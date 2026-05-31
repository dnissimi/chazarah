#!/usr/bin/env python3
"""Fetch a Talmud sugya from the Sefaria API for the gemara-map skill.

Why this exists: every run of the skill needs the *same* clean, aligned source —
the vocalized Aramaic original (what we show) plus the English Davidson/Steinsaltz
elucidation (a private faithfulness check for the Hebrew translation, never shown).
Doing it in one tested script keeps every map grounded in identical, correctly
parsed text instead of re-deriving the fetch logic each time.

It also handles the fiddly part: a daf holds several sugyot, and a sugya often
spills across the amud line. With --expand end (the default) we use Sefaria's
passages endpoint to extend the END of the requested range to the natural end of
the last sugya, so the map is a complete logical unit and not a page cut.

Usage:
  python fetch_sugya.py "Berakhot 2a"
  python fetch_sugya.py "Bava Metzia 2a-2b" --expand none
  python fetch_sugya.py "Berakhot 2a" --expand both --out sugya.json

Output: JSON to stdout (or --out) with shape:
  {
    "requested_ref": "Berakhot 2a",
    "final_ref": "Berakhot 2a:1-2b:4",
    "heRef": "...", "expanded": true,
    "segments": [{"n": 1, "ref": "Berakhot 2a:1", "he": "...", "en": "..."}, ...]
  }
No third-party dependencies (stdlib only) so it runs anywhere.
"""
import argparse
import json
import re
import sys
import urllib.parse
import urllib.request

API = "https://www.sefaria.org/api"
VOCALIZED = "hebrew|William Davidson Edition - Vocalized Aramaic"
ENGLISH = "english"

TAG_RE = re.compile(r"<[^>]+>")
ENTITIES = {"&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&#x2014;": "—"}


def _get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "gemara-map/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def clean(s):
    """Strip Sefaria's footnote/markup tags and normalise whitespace."""
    if not isinstance(s, str):
        return ""
    s = TAG_RE.sub("", s)
    for k, v in ENTITIES.items():
        s = s.replace(k, v)
    return re.sub(r"\s+", " ", s).strip()


def flatten(text):
    """v3 `text` is a string, a list of segments, or (when spanning) a list of
    daf-lists. Flatten to an ordered list of segment strings."""
    out = []
    if isinstance(text, str):
        out.append(text)
    elif isinstance(text, list):
        for item in text:
            out.extend(flatten(item))
    return out


def segment_refs(data):
    """Build a parallel list of per-segment refs from a v3 response, so each piece
    of text can be addressed (needed for passages boundary checks).

    When spanning, spanningRefs are per-daf sub-ranges like 'Berakhot 2a:1-14',
    so we recover book+daf+start-segment from each and number within it."""
    refs = []
    if data.get("isSpanning") and data.get("spanningRefs"):
        text = data["versions"][0]["text"]
        for daf_ref, daf_text in zip(data["spanningRefs"], text):
            pp = parse_passage(daf_ref)
            if not pp:
                continue
            book, daf, start_seg = pp[0], pp[1], pp[2]
            for i in range(len(flatten(daf_text))):
                refs.append("%s %s:%d" % (book, daf, start_seg + i))
    else:
        n = len(flatten(data["versions"][0]["text"]))
        ref = data.get("ref") or data.get("sectionRef") or ""
        pp = parse_passage(ref)
        if pp:
            # number from the true starting line (a sub-range like 26a:2-9 starts at 2)
            book, daf, start = pp[0], pp[1], pp[2]
            refs = ["%s %s:%d" % (book, daf, start + i) for i in range(n)]
        else:
            base = data.get("sectionRef") or ref
            refs = ["%s:%d" % (base, i + 1) for i in range(n)]
    return refs


def fetch_version(tref, version):
    url = "%s/v3/texts/%s?version=%s" % (
        API,
        urllib.parse.quote(tref),
        urllib.parse.quote(version),
    )
    data = _get(url)
    versions = data.get("versions") or []
    text = versions[0]["text"] if versions else []
    return data, flatten([clean(x) for x in flatten(text)])


def resolve_name(ref):
    """Forgiving lookup: if a ref doesn't parse, ask Sefaria's name endpoint for
    the closest canonical ref (handles named sugyot / loose titles)."""
    try:
        res = _get("%s/name/%s" % (API, urllib.parse.quote(ref)))
        if res.get("is_ref") and res.get("ref"):
            return res["ref"]
        comps = res.get("completion_objects") or []
        if comps and comps[0].get("key"):
            return comps[0]["key"]
    except Exception:
        pass
    return None


# --- daf/segment arithmetic for sugya-boundary expansion --------------------
DAF_RE = re.compile(r"(\d+)([ab])")


def daf_key(daf):
    m = DAF_RE.fullmatch(daf.strip())
    if not m:
        return (0, 0)
    return (int(m.group(1)), 0 if m.group(2) == "a" else 1)


def parse_passage(p):
    """Parse a Sefaria talmud ref/range into (book, start_daf, start_seg, end_daf,
    end_seg). Handles 'Berakhot 2a', 'Berakhot 2a:6-11', 'Berakhot 2a:14-2b:4'."""
    m = DAF_RE.search(p)
    if not m:
        return None
    book = p[: m.start()].strip()
    loc = p[m.start():]
    if "-" in loc:
        left, right = loc.split("-", 1)
    else:
        left, right = loc, None
    lm = re.fullmatch(r"(\d+[ab])(?::(\d+))?", left.strip())
    sd, ss = lm.group(1), int(lm.group(2) or 1)
    if right is None:
        return book, sd, ss, sd, ss
    rm = re.fullmatch(r"(?:(\d+[ab]):)?(\d+)", right.strip())
    ed = rm.group(1) or sd
    es = int(rm.group(2))
    return book, sd, ss, ed, es


def ref_lt(daf_a, seg_a, daf_b, seg_b):
    return (daf_key(daf_a), seg_a) < (daf_key(daf_b), seg_b)


def build_ref(book, sd, ss, ed, es):
    if sd == ed:
        if ss == es:
            return "%s %s:%d" % (book, sd, ss)
        return "%s %s:%d-%d" % (book, sd, ss, es)
    return "%s %s:%d-%s:%d" % (book, sd, ss, ed, es)


def expand_end(book, sd, ss, ed, es):
    """Return possibly-extended end so the last sugya is not cut at the page line."""
    last_seg = "%s.%s.%d" % (book.replace(" ", "_"), ed, es)
    try:
        res = _get("%s/passages/%s" % (API, urllib.parse.quote(last_seg)))
        passage = list(res.values())[0]
        pp = parse_passage(passage)
        if pp and ref_lt(ed, es, pp[3], pp[4]):
            return pp[3], pp[4]
    except Exception:
        pass
    return ed, es


def expand_start(book, sd, ss):
    first_seg = "%s.%s.%d" % (book.replace(" ", "_"), sd, ss)
    try:
        res = _get("%s/passages/%s" % (API, urllib.parse.quote(first_seg)))
        passage = list(res.values())[0]
        pp = parse_passage(passage)
        if pp and ref_lt(pp[1], pp[2], sd, ss):
            return pp[1], pp[2]
    except Exception:
        pass
    return sd, ss


def prev_amud(daf):
    n, ab = daf_key(daf)
    return "%da" % n if ab == 1 else "%db" % (n - 1)


def next_amud(daf):
    n, ab = daf_key(daf)
    return "%db" % n if ab == 0 else "%da" % (n + 1)


def sugya_at(book, daf, seg):
    """Return the full sugya ref containing book daf:seg, or None."""
    if seg < 1:
        return None
    seg_ref = "%s.%s.%d" % (book.replace(" ", "_"), daf, seg)
    try:
        res = _get("%s/passages/%s" % (API, urllib.parse.quote(seg_ref)))
        return list(res.values())[0]
    except Exception:
        return None


def passage_preview(passage_ref, limit=220):
    try:
        _, txt = fetch_version(passage_ref, VOCALIZED)
        return (" ".join(txt))[:limit]
    except Exception:
        return ""


def neighbor_context(book, refs):
    """Best-effort: the sugya immediately BEFORE the first segment and AFTER the
    last, so the caller can confirm the boundaries are real breaks and nothing is
    cut. Read-only context — never mapped, just for boundary judgment."""
    ctx = {"before": None, "after": None}
    if not refs:
        return ctx
    first, last = parse_passage(refs[0]), parse_passage(refs[-1])
    # before
    if first:
        bd, bs = first[1], first[2]
        pref = sugya_at(book, bd, bs - 1) if bs > 1 else None
        if pref is None and bs <= 1:
            pa = prev_amud(bd)
            try:
                _, ptxt = fetch_version("%s %s" % (book, pa), VOCALIZED)
                pref = sugya_at(book, pa, len(ptxt))
            except Exception:
                pref = None
        if pref:
            ctx["before"] = {"ref": pref, "he": passage_preview(pref)}
    # after
    if last:
        ad, as_ = last[1], last[2]
        nref = sugya_at(book, ad, as_ + 1) or sugya_at(book, next_amud(ad), 1)
        if nref:
            ctx["after"] = {"ref": nref, "he": passage_preview(nref)}
    return ctx


def segment_sugyot(book, refs):
    """Partition ordered segment refs into sugyot using the passages endpoint.

    A daf holds many sugyot; mapping a multi-daf range well means treating each
    sugya as its own unit. We walk the segments in order and, whenever we pass the
    end of the current sugya, ask passages for the sugya containing the next
    segment. That's ~one call per sugya. Returns a list of
    {ref, start_n, end_n, starts_before} where start_n/end_n are 1-based indices
    into `refs`, and `starts_before` flags a sugya whose true start precedes the
    fetched range."""
    sugyot = []
    cur = None
    for i, r in enumerate(refs):
        pp = parse_passage(r)
        if not pp:
            continue
        rdaf, rseg = pp[1], pp[2]
        need_new = cur is None or ref_lt(cur["end_daf"], cur["end_seg"], rdaf, rseg)
        if need_new:
            seg_ref = "%s.%s.%d" % (book.replace(" ", "_"), rdaf, rseg)
            try:
                res = _get("%s/passages/%s" % (API, urllib.parse.quote(seg_ref)))
                passage = list(res.values())[0]
            except Exception:
                passage = r
            sp = parse_passage(passage) or pp
            cur = {
                "ref": passage,
                "start_daf": sp[1],
                "start_seg": sp[2],
                "end_daf": sp[3],
                "end_seg": sp[4],
                "start_n": i + 1,
                "end_n": i + 1,
                "starts_before": ref_lt(sp[1], sp[2], rdaf, rseg),
            }
            sugyot.append(cur)
        else:
            cur["end_n"] = i + 1
    # strip internal arithmetic keys before returning
    return [
        {
            "index": k + 1,
            "ref": s["ref"],
            "start_n": s["start_n"],
            "end_n": s["end_n"],
            "starts_before": s["starts_before"],
        }
        for k, s in enumerate(sugyot)
    ]


def main():
    ap = argparse.ArgumentParser(description="Fetch a Talmud sugya from Sefaria.")
    ap.add_argument("ref", help='e.g. "Berakhot 2a" or "Bava Metzia 2a-2b"')
    ap.add_argument(
        "--expand",
        choices=["none", "end", "both"],
        default="both",
        help="snap range to full sugya boundaries so nothing is cut. both (default) "
        "completes BOTH the first and last sugya (a sugya that began on the previous "
        "amud is pulled back to its real start); end only extends the end; none maps "
        "exactly what was asked.",
    )
    ap.add_argument(
        "--segment",
        action="store_true",
        help="also partition the range into its constituent sugyot (for multi-daf maps)",
    )
    ap.add_argument(
        "--context",
        action="store_true",
        help="also include the sugya immediately before and after the range (read-only) "
        "so you can confirm the boundaries are natural breaks and nothing is cut",
    )
    ap.add_argument("--out", help="write JSON here instead of stdout")
    args = ap.parse_args()

    # Probe the ref; if it doesn't resolve, try a forgiving name lookup.
    tref = args.ref
    try:
        data, _ = fetch_version(tref, VOCALIZED)
    except Exception:
        resolved = resolve_name(tref)
        if not resolved:
            sys.exit("Could not resolve reference: %r" % tref)
        tref = resolved
        data, _ = fetch_version(tref, VOCALIZED)

    final_ref = data.get("ref", tref)
    expanded = False

    if args.expand != "none":
        refs = segment_refs(data)
        if refs:
            parsed = parse_passage(final_ref) or parse_passage(refs[0])
            book = parsed[0]
            # start from the actual fetched span
            first = parse_passage(refs[0])
            last = parse_passage(refs[-1])
            sd, ss = first[1], first[2]
            ed, es = last[1], last[2]
            ned, nes = expand_end(book, sd, ss, ed, es)
            nsd, nss = (expand_start(book, sd, ss) if args.expand == "both" else (sd, ss))
            if (nsd, nss, ned, nes) != (sd, ss, ed, es):
                expanded = True
                final_ref = build_ref(book, nsd, nss, ned, nes)
                data, _ = fetch_version(final_ref, VOCALIZED)

    # Fetch both versions for the final range and align by index.
    hdata, he = fetch_version(final_ref, VOCALIZED)
    refs = segment_refs(hdata)
    try:
        _, en = fetch_version(final_ref, ENGLISH)
    except Exception:
        en = []

    n = len(he)
    segments = []
    for i in range(n):
        segments.append(
            {
                "n": i + 1,
                "ref": refs[i] if i < len(refs) else "%s:%d" % (final_ref, i + 1),
                "he": he[i],
                "en": en[i] if i < len(en) else "",
            }
        )

    result = {
        "requested_ref": args.ref,
        "final_ref": final_ref,
        "heRef": hdata.get("heRef", ""),
        "expanded": expanded,
        "segment_count": n,
        "segments": segments,
    }

    if refs:
        parsed = parse_passage(refs[0])
        book = parsed[0] if parsed else None
        if args.segment and book:
            result["sugyot"] = segment_sugyot(book, refs)
        if args.context and book:
            result["context"] = neighbor_context(book, refs)

    payload = json.dumps(result, ensure_ascii=False, indent=2)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(payload)
        print("Wrote %d segments for %s -> %s" % (n, final_ref, args.out))
    else:
        print(payload)


if __name__ == "__main__":
    main()
