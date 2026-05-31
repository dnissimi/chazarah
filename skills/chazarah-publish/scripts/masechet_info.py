#!/usr/bin/env python3
"""Derive a MASECHTOT entry (src/lib/browse.ts) for a tractate.

Needed only the FIRST time a brand-new masechet is published — adding a daf to a
tractate already in MASECHTOT needs no change here. The site's browse grid wants
daf bounds + a he/en name + a summary line. We derive all of it instead of
hand-maintaining the list:

  - he/en name   <- src/data/sefaria-taxonomy.json (the offline snapshot)
  - lastDaf      <- Sefaria index API: ceil(schema.lengths[0] / 2)
                    (verified exact across 18 tractates; the first amud is 2a)
  - firstDaf     <- 2 (every Bavli tractate)

Emits a ready-to-paste TypeScript MASECHTOT entry. If the network is unavailable,
pass --last-daf to supply the bound by hand (it's a one-time, low-stakes value).

Usage:
  python3 masechet_info.py talmud chullin
  python3 masechet_info.py talmud "bava-batra" --last-daf 176   # offline
"""
from __future__ import annotations

import argparse
import json
import math
import sys
import urllib.parse
import urllib.request

# --- hebrewNumeral: a faithful port of src/lib/browse.ts (covers 1..499) ------
_ONES = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"]
_TENS = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"]
_HUNDREDS = ["", "ק", "ר", "ש", "ת"]
_GERESH, _GERSHAYIM = "׳", "״"


def hebrew_numeral(n: int) -> str:
    if not isinstance(n, int) or n < 1 or n > 499:
        raise ValueError(f"hebrew_numeral: out of range (1..499): {n}")
    letters = _HUNDREDS[n // 100]
    rem = n % 100
    if rem == 15:
        letters += "טו"
    elif rem == 16:
        letters += "טז"
    else:
        letters += _TENS[rem // 10] + _ONES[rem % 10]
    if len(letters) == 1:
        return letters + _GERESH
    return letters[:-1] + _GERSHAYIM + letters[-1:]


def _slugify(title: str) -> str:
    return title.lower().replace(" ", "-")


def find_book(taxonomy_path: str, corpus: str, book_slug: str) -> dict:
    with open(taxonomy_path, "r", encoding="utf-8") as fh:
        tax = json.load(fh)
    corp = next(
        (c for c in tax["corpora"] if c.get("title", {}).get("en", "").lower() == corpus),
        None,
    )
    if corp is None:
        raise SystemExit(f"corpus not found in snapshot: {corpus!r}")
    for b in corp["books"]:
        title = b.get("title", "")
        # exact slug match excludes commentaries ("Rashi on Chullin"), Mishnah, etc.
        if _slugify(title) != book_slug:
            continue
        cats = b.get("categoryPath", [])
        if corpus == "talmud" and "Bavli" not in cats:
            continue  # skip Yerushalmi / Tosefta / Mishnah variants
        return {"title": title, "heTitle": b.get("heTitle", "")}
    raise SystemExit(
        f"book {book_slug!r} not found under corpus {corpus!r} (Bavli). "
        "Check the slug (lowercase, spaces->hyphens), e.g. 'bava-batra'."
    )


def fetch_last_daf(title: str) -> int:
    url = "https://www.sefaria.org/api/v2/raw/index/" + urllib.parse.quote(title)
    with urllib.request.urlopen(url, timeout=20) as resp:
        idx = json.load(resp)
    length = idx["schema"]["lengths"][0]  # number of amudim, first is 2a
    return math.ceil(length / 2)


def ts_entry(corpus: str, book_slug: str, he: str, en: str, last: int) -> str:
    last_he = hebrew_numeral(last)
    he_sum = (f"כל דפי מסכת {he} (ב׳ עד {last_he}). "
              "אפשר לסקור מה כבר מופה, או לבקש מה שעדיין לא.")
    en_sum = (f"All folios of Tractate {en} (2 through {last}). "
              "Browse what's mapped, request what isn't.")
    return (
        "  {\n"
        f"    corpus: '{corpus}',\n"
        f"    book: '{book_slug}',\n"
        f"    bounds: {{ firstDaf: 2, lastDaf: {last} }},\n"
        f"    name: {{ he: '{he}', en: '{en}' }},\n"
        "    summary: {\n"
        f"      he: '{he_sum}',\n"
        f'      en: "{en_sum}",\n'
        "    },\n"
        "  },"
    )


def main() -> int:
    ap = argparse.ArgumentParser(description="Derive a MASECHTOT entry for a tractate.")
    ap.add_argument("corpus", help="corpus slug, e.g. talmud")
    ap.add_argument("book", help="book slug, e.g. chullin or bava-batra")
    ap.add_argument("--taxonomy", default="src/data/sefaria-taxonomy.json",
                    help="path to the taxonomy snapshot (default: repo-relative)")
    ap.add_argument("--last-daf", type=int, default=None,
                    help="supply lastDaf by hand (skips the Sefaria call)")
    args = ap.parse_args()

    info = find_book(args.taxonomy, args.corpus.lower(), args.book.lower())

    if args.last_daf is not None:
        last = args.last_daf
    else:
        try:
            last = fetch_last_daf(info["title"])
        except Exception as e:  # noqa: BLE001 — network is optional
            print(
                f"ERROR: could not reach Sefaria to derive lastDaf ({e}).\n"
                f"Re-run with --last-daf <N> (the final daf of {info['title']}).",
                file=sys.stderr,
            )
            return 2

    print(f"// derived: {info['title']} ({info['heTitle']}), firstDaf 2, lastDaf {last}",
          file=sys.stderr)
    print(ts_entry(args.corpus.lower(), args.book.lower(),
                   info["heTitle"], info["title"], last))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
