# Chazarah — Domain glossary

Canonical language for the Chazarah project. This is a glossary, not a spec.
Terms are added as they get resolved in conversation; implementation details
belong in code, ADRs, or product docs — not here.

## Brand and products

### Chazarah
The umbrella website and brand. Hebrew: *חזרה* — "review." The site exists to
help learners *come back* to Torah material they've studied, in formats that
make the structure of the learning visible. Chazarah will host multiple
products/modalities over time; today it has one.

### Chazarah Map
The first product offered on Chazarah. A self-contained HTML page that visualizes
the structure of a passage of Torah literature as a color-coded flowchart with a
paired original-text-plus-translation panel.

Today Chazarah Map covers Talmud (via the `gemara-map` Claude Code skill), but
the product is **not gemara-specific**: it is designed to extend to any corpus
Sefaria carries — Tanakh, Mishnah, Halakhah, Midrash, etc. The unit a map covers
varies by corpus (a sugya / daf in Talmud, a perek in Mishnah, a parsha in
Tanakh, ...), but each map page covers one *coherent unit of the source text*
and stays grounded in the Sefaria text it was built from.

A single map *range* may have several **language variants** — separate HTML
files of the same content rendered in different languages (Hebrew, English,
...). Hebrew is the canonical variant; others are translations. The site treats
these as siblings of one map, not as separate maps. The map files themselves
remain self-contained and standalone — the site links to them but never wraps
or rewrites them.

## Talmud terms (used as-is from the source material)

These terms come from the gemara itself; we keep them in their traditional form
rather than translating, because the audience knows them and translating loses
precision.

- **Sugya** — a complete, self-contained discussion in the gemara. The
  fundamental unit a Chazarah Map covers. A Chazarah Map never cuts a sugya
  mid-thought.
- **Daf** — a folio (two-sided page) of Talmud, e.g. "Megillah 26." Chazarah
  Maps are organized roughly one file per daf.
- **Masechet** — a tractate, e.g. "Megillah," "Berakhot." The top-level
  grouping for navigation.
- **Amud** — one side of a daf (a or b). Refs use the form `Megillah 26a:6`.

### Map Info Page
The site-rendered page at a [[Chazarah Map]]'s bare URL (no language suffix).
Shows the map's title and metadata, lists the language variants that exist,
links to each, and exposes a "request a translation" entry point that feeds the
[[Map Request]] queue. The single SEO-friendly entry point per logical map; it
never 404s, even before any language variant has been produced.

### Recents (two distinct things)
"Recents" appears in two different scopes; they should not be confused.
- **Site Recents** — recently added or updated maps *across all of Chazarah*.
  A site-level fact, the same for every visitor. Surfaced on the landing page.
- **Visitor Recents** — maps a *specific visitor* has opened recently. A
  per-visitor fact, stored client-side (cookies / `localStorage`); never sent
  to a server. No user account is needed or implied.

## Contribution / submission concepts

Visitors can contribute in two ways. Every contribution lands in the owner's
review queue; nothing reaches the public site without approval.

- **Map Request** — a visitor asks for a Talmud passage (ref or range) that
  has not yet been mapped. Carries no reference to an existing [[Chazarah Map]].
  When approved, it kicks off a Claude Code session that *generates a new* map.
- **Map Feedback** — a visitor reports a correction, addition, or refinement
  for an *existing* [[Chazarah Map]]. Always anchored to a specific map (and
  ideally to a specific node or quote within it). When approved, it kicks off
  a Claude Code session that *revises an existing* map.

We deliberately don't split Map Feedback into "correction" vs. "addition" — the
line is fuzzy, the admin workflow is identical, and the distinction can be
recovered with a tag later if it ever matters.
