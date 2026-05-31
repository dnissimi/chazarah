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

---

## Refinement — 2026-05-29 (supersedes the proposal above)

After running the full pipeline once (Shabbat 112), the proposal collapses.

### Locked decisions

- **The skill change is one thing: emit a metadata block in the map's
  `<head>`.** It carries `corpus`, `book`, `location`, `sefaria-ref` (daf
  level), `topic` (short), `blurb` (= the takeaway, via standard
  `<meta name="description">`), `sugya-count`, and `lang`. Items "URL-shaped
  output path", "discrete topic", and "daf-level ref" from the proposal are
  all just fields here.
- **Namespace is neutral: `gemara-map:`** (e.g. `gemara-map:sefaria-ref`,
  `gemara-map:topic`, `gemara-map:corpus`). Keeps the skill reusable outside
  Chazarah. The existing extractor (`src/lib/map-metadata.ts`, currently
  expecting `chazarah:`) is updated to this namespace and extended to read
  `topic` + `corpus`/`book`/`location` (it already reads description,
  sefaria-ref, sugya-count, lang).
- **The skill stays site-agnostic** — it does *not* emit Chazarah's URL path.
  `/chazarah-fulfill` computes `public/maps/<corpus>/<book>/<location>/<lang>.html`
  from the metadata.
- **Delivery: embedded meta tags** (self-describing artifact, ADR 0004-aligned),
  not a sidecar.
- **Action: spec-only.** Implement the extractor + skill changes when the
  fulfill loop is built.

Net: `/chazarah-fulfill` = run skill → read `<head>` metadata → write YAML →
place file. Zero hand-authoring.

### Language model — RESOLVED → [ADR 0006](../adr/0006-bilingual-map-files-and-per-variant-language-policy.md)

Decided in the 2026-05-29 breakout: **one bilingual file per map with a
whole-page HE⇄EN toggle**; both `/he` and `/en` serve the one file (verbatim);
**English text = Sefaria's Davidson, shown directly**; the Hebrew side stays
LLM-authored with Davidson never shown; **per-variant IP policy** (Hebrew =
owner's IP, English = CC-BY-NC attributed). Original framing kept below for
context:

- Lean toward **one file in the default language (Hebrew)** now; additional
  languages later. Possibly *one bilingual file* (HE+EN in the same HTML) with
  a path-based default, vs. separate files per language. (These two are in
  mild tension in the owner's framing — resolve in the breakout.)
- **English content should use Sefaria's Davidson English directly**, *not*
  an LLM translation — asymmetric with Hebrew (where the LLM writes clear
  Hebrew from the Aramaic, using Davidson only as a private check).

Two ADR tensions the breakout must resolve:

1. **vs. ADR 0002** (language = URL leaf, one verbatim file per variant):
   a single static file can't vary by path without client JS. Options —
   (a) one file with a built-in HE/EN toggle (like today's HE/Aramaic toggle)
   that the `/he` and `/en` URLs hint at; (b) keep separate per-language files
   (current ADR), Hebrew now, English later.
2. **vs. ADR 0005** (never show Davidson English; the "IP is mine" claim
   rests on that): showing Davidson makes English maps CC-BY-NC derivatives —
   attribution + non-commercial required (already NC), but the sole-IP claim
   would not hold for English. A coherent per-variant policy: **Hebrew maps =
   owner's IP over public-domain source; English maps = a CC-BY-NC convenience
   layer over existing Davidson text.** This would amend ADR 0005.

---

## Map appearance + in-map feedback — added 2026-05-29

Two further `gemara-map` output requirements (spec-only; implement with the
skill/template change).

### 1. Visual alignment with the site

The map page chrome should match the Chazarah site so a map doesn't look like
a different product. Exact site values (from `src/styles/global.css`, "bone"
palette):

| token | site value | map uses today |
|---|---|---|
| page background | `#f1ece2` (`--paper`) | `#faf7f0` |
| ink / text | `#1c1815` (`--ink`) | `#1f2937` |
| card surface | `#f8f3e8` (`--paper-card`) | `#ffffff` |
| accent | `#2a3a6b` navy (`--accent`) | `#3730a3` indigo |
| display font | **David Libre** (`--font-display`) | Frank Ruhl Libre |
| body font | **Assistant** (`--font-body`) | Heebo |

Change the template: page background → `#f1ece2`, ink → `#1c1815`, header +
card surfaces and the base fonts → David Libre / Assistant (load those from
Google Fonts instead of Frank Ruhl Libre / Heebo). **Keep the functional node
colors** (mishnah amber, statement, question, answer, proof, conclusion) — they
carry meaning and match the legend; only align the *page/header/base* layer.
Optionally retune the structural accent (badges, quote rule, h1 underline)
from indigo `#3730a3` → the site navy `#2a3a6b`.

### 2. Always-accessible "report a correction" affordance

Every map should carry a **non-intrusive but persistent** control to report a
problem / suggest a correction *while reading* — the assumption is people will
want to flag something the moment they see it, without hunting for it or
leaving the page.

- **Trigger**: a small fixed-position control (e.g., bottom-corner pill
  "דווחו על טעות / Report a correction"), always visible, low-contrast until
  hover.
- **Action**: opens the feedback flow **in place** (a modal overlay) so the
  reader doesn't lose their spot in the daf.
- **Implementation options** (resolve when building):
  - (a) Modal embeds the site's `/feedback?ref=<ref>` in an iframe — the form
    + Turnstile stay on the site; the map only needs a **configurable feedback
    base URL** (keeps the skill site-agnostic, per the locked decision). Ref
    comes from the `gemara-map:sefaria-ref` metadata.
    *Recommended* — least site-coupling baked into the map.
  - (b) Modal contains the feedback form directly and POSTs to `/api/submit`
    (same origin). Most seamless, but bakes the Turnstile sitekey + endpoint
    path + form into every map file (more site-coupling in a "verbatim" asset).
- **Nice future touch**: if the reader triggers it from a specific node/quote,
  pre-fill the `nodeOrQuote` field.
- Supersedes the earlier "single configurable footer link back to the Map Info
  Page" idea (Q11) — this is the stronger version of that affordance.

Both items are template/skill changes; they ride along with the bilingual +
metadata work when the `gemara-map` skill is updated.

---

## Finalized change-list — grill-aligned (2026-05-29)

Outcome of a grill-me alignment session against how the skill currently
operates. This **consolidates and (where noted) refines** the sections above and
is the implementation guide for the `gemara-map` skill/template update.

### A. Machine-readable metadata — `<head>`, `gemara-map:` namespace

Skill stays **site-agnostic** (emits no URL path). Emit:

- `<meta name="gemara-map:corpus" content="talmud">`
- `<meta name="gemara-map:book" content="megillah">`
- `<meta name="gemara-map:location" content="26">`
- `<meta name="gemara-map:sefaria-ref" content="Megillah 26">` — **daf-level**, not
  the expanded range shown in the subtitle
- `<meta name="gemara-map:topic" content="…">` / `…:topic-en` — short (≤6 words)
- `<meta name="gemara-map:sugya-count" content="6">`
- `<meta name="gemara-map:languages" content="he,en">`
- `<meta name="description" content="…takeaway…">` (the `blurb`; English variant too)
- `<html lang="he">` as the document default; structural `<title>` unchanged.

### B. Bilingual rendering + two orthogonal toggles

- **Page toggle HE⇄EN** — whole-page; sets the *authored* layer: node "meaning"
  labels, the citation translation column, and all chrome (takeaway, topic,
  headings, legend). Default comes from the URL path leaf (`/he`|`/en`) read by
  client JS (ADR 0006), **fallback `he`**; the toggle also flips `<html lang>`/`dir`.
- **Per-chart toggle meaning⇄original** — flips that chart's node labels to the
  **verbatim Aramaic original**; available on *both* language pages.
- ⇒ each chart carries **three label sources**: `src-he`, `src-en`, `src-ar`
  (Aramaic shared). Each citation row carries the **full Aramaic original** plus
  `trans-he` (LLM) and `trans-en` (Davidson); the page toggle shows the right one.

### C. Faithfulness — authored layer vs. verbatim original (HARD RULE)

- **Authored layer** (node "meaning" labels, `topic`, `blurb`/takeaway, `title`,
  headings): written by the skill in **both HE & EN**, informed by the source —
  owner's IP. *Understanding* the source drives this layer.
- **Original text** (the gemara/Mishnah source — termed "Aramaic" as shorthand,
  even where the Mishnah is Hebrew): **never authored, reworded, or free-form.**
  It appears only as verbatim source. In a chart node it may be shortened **only**
  by splicing contiguous verbatim fragments with `…`; in the **citation panel it
  appears in full** (no `…`).
- **Citations** are grouped **one entry per Sefaria segment** (full verbatim
  original, tagged with the node numbers that draw on it). The **English citation
  text = Sefaria's Davidson, verbatim** — never LLM (per ADR 0006).

### D. Visual alignment — bone palette + fonts

- Page background `#f1ece2`, ink `#1c1815`, card surface `#f8f3e8`, structural
  accent indigo `#3730a3` → **navy `#2a3a6b`**. **Keep the functional node colors**
  (mishnah amber, statement, question, answer, proof, conclusion).
- **Fonts (softens the table in the appearance section above):** only the
  **dominant page header (`h1`) → David Libre**; **everything else keeps Frank Ruhl
  Libre (serif reading content incl. `h2`/`h3`) + Heebo (UI/body)**. **Assistant is
  *not* adopted.** Net fonts loaded: David Libre + Frank Ruhl Libre + Heebo.

### E. Report-a-correction affordance

- Always-visible, low-contrast-until-hover **pill** → in-place **modal** →
  `<iframe src="<feedback_path>?ref=<sefaria-ref>&lang=<live current lang>">`.
- `feedback_path` is **root-relative, same-origin** (maps are served from the site
  origin; `/feedback` consumes `ref`+`lang` already), default `/feedback`.
  **Opt-in**: the affordance is emitted only when `feedback_path` is supplied;
  omitted entirely otherwise (standalone-safe, keeps the skill site-agnostic).
- `lang` is the **live page language** (reflects the toggle, not just the initial
  path); the pill label follows the current language too.

### Refinements to the proposals above (recorded so the doc stays consistent)

1. **English flowchart node labels are authored short summaries (per side), not
   Davidson** — ADR 0006 read literally ("English flowchart labels = Davidson
   directly") is impractical (Davidson is long elucidation). Davidson-verbatim
   governs only the **citation** English column + the full Aramaic original; the
   flowchart "meaning" layer is curation, authored in both languages (consistent
   with ADR 0006's per-side IP split).
2. **Font table softened** — only `h1` aligns to David Libre; the reading fonts
   stay Frank Ruhl Libre / Heebo (owner preference; carries the nikud-heavy text
   well).

---

## Refinement — 2026-05-30 (UX tweaks after Chullin 26–30 rollout)

After looking at the first bilingual maps in the wild, three small UX changes,
now encoded in the skill/template:

1. **No on-page HE⇄EN button.** Page language stays **path-driven only** (`/he`
   or `/en`, fallback `he`). Once on a language page a reader is unlikely to
   switch mid-page; if they want the other language they navigate to the other
   URL. Removes a noisy top-corner control. Refines area B.
2. **Per-chart Aramaic toggle is low-contrast until hover** (opacity ~0.4 →
   1.0), matching the report-pill pattern. Available but no longer intrusive.
   Refines area B.
3. **Feedback iframe URL adds `&embed=1`** —
   `<feedback_path>?ref=<sefaria-ref>&lang=<page-lang>&embed=1`. This is a hint
   to the host site to render the form in a **chrome-free embed mode** so it
   fits the modal. Refines area E.

The two corresponding **site changes** (chazarah-side, not gemara-map-side) are:

- `src/layouts/SiteLayout.astro` — the pre-paint inline script and the body
  `applyLang` script should honor a `?lang=` URL query param first, then fall
  back to localStorage, then to `DEFAULT_LANG`. URL becomes a per-load override;
  `localStorage` remains the persistent preference. (`feedback.astro`'s local
  `activeLang()` mirrors the same precedence for the variant badge.)
- `src/layouts/SiteLayout.astro` — when `Astro.url.searchParams.get('embed') ===
  '1'`, omit `<SiteHeader />` and `<SiteFooter />` from the rendered shell, and
  collapse `.shell` padding so the slot fills the iframe.

These are spec-only here; apply when convenient (independent of the gemara-map
skill).
