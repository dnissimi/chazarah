#!/usr/bin/env python3
"""Read a gemara-map HTML artifact's <head> and emit its metadata.

The gemara-map skill self-describes each map with a flat `gemara-map:` <meta>
block (ADR 0006 / docs/specs/map-wiring.md). This script turns that block into
either:

  --json   structured fields (default) — the publish skill uses these to compute
           the site file paths (corpus/book/location/languages).
  --yaml   the content-collection entry (src/content/maps/<corpus>/<book>/<location>.yaml)
           exactly in the shape src/content/config.ts validates — no hand-authoring.

Stdlib only (html.parser), so it runs anywhere without a venv.

Usage:
  python3 extract_metadata.py <map.html>                 # JSON fields
  python3 extract_metadata.py <map.html> --yaml          # content-collection YAML
  python3 extract_metadata.py <map.html> --yaml --updated 2026-05-29
"""
from __future__ import annotations

import argparse
import datetime as _dt
import html
import json
import sys
from html.parser import HTMLParser

NS = "gemara-map:"

# gemara-map: keys we care about -> output field name
_KEYS = {
    "corpus": "corpus",
    "book": "book",
    "location": "location",
    "sefaria-ref": "sefariaRef",
    "topic-he": "topic_he",
    "topic-en": "topic_en",
    "title-he": "title_he",
    "title-en": "title_en",
    "blurb-he": "blurb_he",
    "blurb-en": "blurb_en",
    "sugya-count": "sugyaCount",
    "languages": "languages",
}


class _Head(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.meta: dict[str, str] = {}
        self.title: str | None = None
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        if tag == "title":
            self._in_title = True
        elif tag == "meta":
            a = {k: (v or "") for k, v in attrs}
            name = a.get("name", "").strip().lower()
            if name == "description":
                self.meta["description"] = html.unescape(a.get("content", ""))
            elif name.startswith(NS):
                self.meta[name[len(NS):]] = html.unescape(a.get("content", ""))

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title = (self.title or "") + data


def extract(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as fh:
        p = _Head()
        p.feed(fh.read())

    raw = p.meta
    fields: dict = {}
    for meta_key, out_key in _KEYS.items():
        if meta_key in raw and raw[meta_key] != "":
            fields[out_key] = raw[meta_key]

    # languages: comma list -> array; default he if absent.
    langs = [s.strip() for s in fields.get("languages", "he").split(",") if s.strip()]
    fields["languages"] = langs or ["he"]

    # sugyaCount: int if present.
    if "sugyaCount" in fields:
        try:
            fields["sugyaCount"] = int(fields["sugyaCount"])
        except ValueError:
            fields.pop("sugyaCount")

    # blurb fallback: <meta description> is the he blurb.
    if "blurb_he" not in fields and "description" in raw:
        fields["blurb_he"] = raw["description"]

    fields["_title_tag"] = (p.title or "").strip()
    return fields


_REQUIRED = ["corpus", "book", "location", "sefariaRef",
             "title_he", "title_en", "blurb_he", "blurb_en",
             "topic_he", "topic_en"]


def _missing(fields: dict) -> list[str]:
    return [k for k in _REQUIRED if not fields.get(k)]


def _dq(s: str) -> str:
    """A YAML double-quoted scalar (handles Hebrew, colons, embedded quotes)."""
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def to_yaml(fields: dict, updated: str) -> str:
    lines = [
        f"corpus: {fields['corpus']}",
        f"book: {fields['book']}",
        f"location: {_dq(str(fields['location']))}",
        "title:",
        f"  he: {_dq(fields['title_he'])}",
        f"  en: {_dq(fields['title_en'])}",
        "blurb:",
        f"  he: {_dq(fields['blurb_he'])}",
        f"  en: {_dq(fields['blurb_en'])}",
        "topic:",
        f"  he: {_dq(fields['topic_he'])}",
        f"  en: {_dq(fields['topic_en'])}",
        f"sefariaRef: {_dq(fields['sefariaRef'])}",
        "languages:",
    ]
    lines += [f"  - {l}" for l in fields["languages"]]
    if "sugyaCount" in fields:
        lines.append(f"sugyaCount: {fields['sugyaCount']}")
    lines.append(f"updated: {_dq(updated)}")
    return "\n".join(lines) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description="Extract gemara-map metadata from a map HTML.")
    ap.add_argument("html", help="path to the gemara-map .html artifact")
    ap.add_argument("--yaml", action="store_true", help="emit the content-collection YAML")
    ap.add_argument("--updated", default=_dt.date.today().isoformat(),
                    help="updated date (YYYY-MM-DD); defaults to today")
    args = ap.parse_args()

    fields = extract(args.html)
    miss = _missing(fields)
    if miss:
        print(
            "ERROR: the map is missing required gemara-map: metadata: "
            + ", ".join(miss)
            + "\nThis artifact predates the gemara-map metadata block, or the block is "
              "incomplete. Regenerate it, or fill these fields by hand before publishing.",
            file=sys.stderr,
        )
        return 2

    if args.yaml:
        sys.stdout.write(to_yaml(fields, args.updated))
    else:
        json.dump(fields, sys.stdout, ensure_ascii=False, indent=2)
        sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
