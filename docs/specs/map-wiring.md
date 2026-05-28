# Mini-spec: wiring a gemara-map artifact into the Chazarah site

Captured after manually wiring 7 real maps (Megillah 26–29, Chullin 24–26).
Purpose: document the steps, and identify what the `gemara-map` skill could
emit so this becomes turnkey (or fully automatable by `/chazarah-fulfill`).

## The manual procedure today (per daf)

1. **Place the HTML verbatim.** Copy the skill's output
   `sugya_<book>_<daf>.html` → `public/maps/<corpus>/<book>/<location>/<lang>.html`.
   - The site serves it at `/map/<corpus>/<book>/<location>/<lang>` via the
     wildcard rewrite in `public/_redirects` (ADR 0004 — byte-for-byte).
   - Requires injecting two facts the filename doesn't carry: `corpus`
     (`talmud`) and `lang` (`he`).

2. **Write the content-collection entry** at
   `src/content/maps/<corpus>/<book>/<location>.yaml` with the schema in
   `src/content/config.ts`:
   `corpus, book, location, title{he,en}, blurb{he,en}, topic{he,en},
   sefariaRef, languages[], sugyaCount?, updated`.
   - `title.he` / `blurb.he` come from the HTML `<title>` / `.takeaway`.
   - `topic` is **not** in the HTML as a discrete field — derived by reading
     the takeaway.
   - `en` variants are **hand-translated** (the maps are Hebrew-only).
   - `sefariaRef` is the **daf-level** ref (`Megillah 26`), not the expanded
     range shown in the HTML subtitle (`Megillah 25b:20-27a:1`).
   - `sugyaCount` = number of `<section class="sugya">` in the HTML.

3. **Register a new masechet** (first time only) in `MASECHTOT`
   (`src/lib/browse.ts`): daf `bounds` (firstDaf/lastDaf), he/en `name`,
   `summary`. Needed for the browse page `/map/<corpus>/<book>/`.

4. **Build** validates everything (`astro check` + content-collection schema);
   the Map Info page is SSR so it picks up new entries with no per-daf route.

## Friction points (and the bug we hit)

- **Filename shape.** Flat `sugya_<book>_<daf>.html` ≠ the URL-shaped path the
  site needs. Manual restructure + corpus/lang injection every time.
- **No machine-readable metadata in the HTML.** The site's metadata extractor
  (`src/lib/map-metadata.ts`, built in #6) looks for `<meta name="description">`
  and `<meta name="chazarah:sefaria-ref">` — **neither exists** in current
  skill output, so it can't recover `sefariaRef`, and `topic` isn't available
  at all. Everything is reconstructed by reading prose.
- **`topic` vs generic `<title>`.** The `<title>` is always
  "מפת הסוגיא — <ref>" (structural, not topical). The site wants a short topic
  ("מכירת קדושת הציבור"). Derived by hand.
- **Bilingual requirement.** The schema requires `en` for title/blurb/topic,
  but maps are Hebrew-only → hand-translation. (Alternative: relax the schema
  so `en` is optional and the renderer falls back to `he`.)
- **`hebrewNumeral` only went to 99.** Chullin runs to daf 142; the browse
  page crashed until `hebrewNumeral` was extended to hundreds (ק/ר/ש/ת). Any
  large masechet (Bava Batra → 176) would have hit this.
- **Per-masechet config is manual.** `MASECHTOT` hardcodes daf bounds + the
  Hebrew book name. We already snapshot the Sefaria taxonomy
  (`src/data/sefaria-taxonomy.json`, slice 9) — bounds and book names could be
  derived from it instead of hand-maintained.

## Proposed `gemara-map` skill changes (to make wiring turnkey)

Ordered by leverage:

1. **Emit machine-readable metadata** so the extractor (already built) works
   with zero hand-assembly. Either:
   - meta tags in the HTML `<head>`:
     `<meta name="description" content="…takeaway…">`,
     `<meta name="chazarah:sefaria-ref" content="Megillah 26">`,
     `<meta name="chazarah:corpus" content="talmud">`,
     `<meta name="chazarah:book" content="megillah">`,
     `<meta name="chazarah:location" content="26">`,
     `<meta name="chazarah:topic" content="מכירת קדושת הציבור">`,
     `<meta name="chazarah:sugya-count" content="6">`; **or**
   - a sidecar `<location>.yaml`/`.json` next to the HTML in the
     content-collection shape.
2. **Output the URL-shaped path** `maps/<corpus>/<book>/<location>/<lang>.html`
   (or at least include corpus + lang), so step 1 is a move, not a restructure.
3. **Emit a discrete `topic`** (short, ≤6 words) alongside the takeaway.
4. **Emit the daf-level `sefariaRef`** separately from the expanded range.
5. (Site side, not skill) **Decide the bilingual policy**: skill emits `en`
   metadata too, or the schema makes `en` optional with he-fallback.
6. (Site side) **Derive `MASECHTOT` from the Sefaria taxonomy snapshot** to
   drop the manual per-masechet config.

If 1–4 land, `/chazarah-fulfill` can wire a new map with no human metadata
authoring: run skill → move file → read sidecar/meta → write YAML.
