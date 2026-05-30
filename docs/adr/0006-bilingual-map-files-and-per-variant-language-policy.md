# ADR 0006 — Bilingual map files + per-variant language/IP policy

- Status: Accepted
- Date: 2026-05-29
- Amends: [ADR 0002](./0002-url-shape-for-maps.md) (URL→file mapping),
  [ADR 0005](./0005-non-commercial-and-attribution.md) (Davidson English /
  IP claim)

## Context

After wiring 8 real Hebrew maps and running the full skill→publish pipeline
once (Shabbat 112), we revisited the language model. ADR 0002 assumed one
verbatim HTML file *per language variant* (`…/<lang>.html`), and ADR 0005
forbade ever showing Sefaria's CC-BY-NC William Davidson English translation
(the "the IP is mine" claim rested on that). Two things pushed a rethink:

- The only real hand-authoring left when wiring a map was the **English**
  metadata/translation — maps are Hebrew-only, but the schema wanted English.
- Producing English by LLM is redundant and lower-quality when Sefaria already
  carries a high-quality English (Davidson).

## Decision

### One bilingual file per map, with a built-in language toggle

A [[Chazarah Map]] is **one HTML file containing both Hebrew and English**,
with a whole-page **HE⇄EN toggle** (the same pattern as the existing
Hebrew⇄Aramaic node-label toggle, but spanning the whole page — flowchart
labels, quotes, takeaway, headings).

- The file no longer carries `<lang>` in its name.
- Both `/map/<corpus>/<book>/<location>/he` and `…/en` **rewrite (200,
  verbatim) to the same file**; the file's client JS reads the path's trailing
  language segment and sets the default language shown.
- Served byte-for-byte — **ADR 0004 (verbatim) is intact**; the
  language-defaulting is client-side, part of the self-contained file.
- This **amends ADR 0002**: the URL→file mapping is now many-to-one
  (multiple language URLs, one file) rather than one-to-one. The URL *shape*
  (`/map/<corpus>/<book>/<location>/<lang>`, language as leaf, bare URL =
  [[Map Info Page]]) is unchanged.

The content-collection `languages` field changes meaning: from "which variant
*files* exist" to "which languages this *file contains*."

### English text comes from Davidson; Hebrew is LLM-authored

Within the bilingual file:

- **Hebrew side** — the flowchart labels and quote translations are written by
  the `gemara-map` skill in clear modern Hebrew from the public-domain
  Aramaic. Davidson English is used only as a private check and **never
  shown** (unchanged from ADR 0005).
- **English side** — uses **Sefaria's William Davidson English directly**
  (shown), not an LLM translation.

### Per-variant IP / licensing policy (amends ADR 0005)

ADR 0005's blanket "never show Davidson" is replaced by a **per-side** rule:

- **Hebrew side + the flowchart structure/curation** = the owner's original
  work over public-domain source → owner's IP; minimal-compliance attribution.
- **English side** = a CC-BY-NC convenience layer over Davidson's existing
  translation → must be **attributed** (already in the per-map footer: "מקור:
  ספריא · William Davidson") and **non-commercial** (the site already is). The
  owner does **not** claim sole IP over the English prose.

The non-commercial posture (no ads/paywall/subscription) is unchanged and is
now also a hard *requirement* (not just a preference) for any map that shows
Davidson English.

### Metadata block carries both languages

The `<head>` metadata block (ADR-spec `map-wiring.md`) carries he **and** en
fields (`title`, `topic`, `blurb`) under the neutral `gemara-map:` namespace;
the English fields derive from Davidson / Sefaria, not the LLM.

## Consequences

**Good**
- Zero hand-authored English: the English side and metadata come from Davidson.
- One artifact per map carries everything and travels together.
- Reuses the proven toggle UX.
- Honest licensing: Hebrew (owned) and English (Davidson, attributed) are
  cleanly separated *within* the file.

**Bad / accepted trade-offs**
- The `gemara-map` skill + template gain a meaningful change (whole-page
  bilingual rendering + HE⇄EN toggle + Davidson English ingestion + bilingual
  metadata). Larger than the "emit metadata" change first envisioned.
- The "IP is mine" story is now nuanced (per-side), not blanket.
- Bigger map files (two languages in one).

**Migration**
- The 8 existing maps are Hebrew-only single files under the old model. They
  remain valid (`languages: [he]`); regenerate as bilingual when desired.
  **Not retrofitted now.**

## Status of implementation

The `gemara-map` skill/template change (bilingual + the `gemara-map:` metadata
block) has landed. The site-side publication is automated by the
`chazarah-publish` skill (see `docs/specs/chazarah-publish.md`); the
content-collection `languages` field now means "languages this file contains."

### Implementation note — per-language materialization (2026-05-29)

The Decision above frames the URL→file mapping as **many-to-one** (both `/he`
and `/en` rewriting to one physical file, via a `_redirects` change). In
implementation we chose the equivalent but simpler **per-language
materialization**: the single *authored* bilingual artifact is written to one
**byte-identical** file per language (`…/<location>/he.html` **and**
`…/<location>/en.html`), so the existing one-to-one `_redirects` rule
(`/map/:corpus/:book/:location/:lang → /maps/:corpus/:book/:location/:lang.html`)
is unchanged and stays uniform with the legacy he-only maps.

The user-facing behavior is identical to the Decision: each language URL serves
the same self-contained file byte-for-byte (ADR 0004 intact), and the file's JS
still defaults the language from the URL's trailing segment. The only
differences are physical: there is one authored artifact but two on-disk copies
(negligible bytes), and the URL→file mapping stays **one-to-one** rather than
many-to-one. No `_redirects` change was needed. This narrows — does not
contradict — the Decision: "one bilingual file" is the *authoring* model;
materializing it per language is a deployment detail.
