# ADR 0002 — Map URLs: corpus-first hierarchy, language as suffix, bare URL is an info page

- Status: Accepted — URL→file mapping amended by [ADR 0006](./0006-bilingual-map-files-and-per-variant-language-policy.md) (one bilingual file now answers both `/he` and `/en`; the URL shape itself is unchanged)
- Date: 2026-05-26

## Context

[[Chazarah Map]] is the first product on [[Chazarah]] but will not be the
only one. The product is also not Talmud-specific — it is designed to extend
to any Sefaria corpus (Tanakh, Mishnah, Halakhah, ...). A single logical map
may exist in several language variants (Hebrew, English, ...), and the owner
explicitly does not expect every language to exist for every map at any given
point in time.

Map URLs are externally visible, will be indexed, shared, and linked. Their
shape is hard to change after the fact, so we lock it in now.

## Decision

Map URLs follow this canonical form:

```
/map/<corpus>/<book>/<location>            → Map Info Page (site-rendered)
/map/<corpus>/<book>/<location>/<lang>     → standalone HTML map (verbatim from skill)
```

Concrete examples:

```
/map/talmud/megillah/26                 → info page for Megillah 26
/map/talmud/megillah/26/he              → Hebrew variant (canonical)
/map/talmud/megillah/26/en              → English variant
/map/talmud/jerusalem-talmud-megillah/6.2/he
/map/mishnah/berakhot/2/he
/map/tanakh/genesis/12/he
```

Specifics:

- **`/map/` is a product segment.** Reserves the URL space cleanly for future
  Chazarah products (`/<other-product>/…`) so this URL shape never needs to
  migrate.
- **`<corpus>` follows Sefaria's top-level categories**, lowercased
  (`talmud`, `mishnah`, `tanakh`, `halakhah`, …). Browsable: `/map/talmud/` is
  itself a real index page in the site.
- **`<book>` follows Sefaria's canonical book slug.** Bavli vs. Yerushalmi is
  disambiguated inside the book slug (e.g., `jerusalem-talmud-megillah`)
  exactly as Sefaria does, not via an extra `bavli/yerushalmi` URL segment.
- **`<location>` is whatever Sefaria can resolve**, slugified: `26`, `26a-27b`,
  `2`, `2.3-2.5`, etc. The site doesn't model whether this is a daf, perek,
  parsha, etc. — it just passes it to Sefaria when needed.
- **`<lang>` is at the end** so that the address of a logical map remains
  stable as language coverage evolves. The bare URL is always valid; new
  language variants appear as new leaf URLs.
- **The bare URL renders a [[Map Info Page]]**, not a redirect or a 404. This
  page is the single SEO-friendly entry point per logical map, lists the
  available language variants, and exposes a "request a translation" button
  that feeds the [[Map Request]] queue when a language is missing.

## Consequences

**Good**
- Stable, future-proof URL space: adding a new corpus, a new book, a new
  language variant, or a new Chazarah product is purely additive.
- Round-trippable with Sefaria refs in both directions, because we reuse
  Sefaria's slugs.
- The bare URL is itself a useful page (browse, share, request missing
  translations) instead of a redirect or error.
- Treating language as content metadata (not a top-level slice) matches
  reality: language coverage is uneven and will stay uneven.

**Bad / accepted trade-offs**
- URLs are longer than a flat `/<book>/<location>` would be. Worth it for
  browsability and future-proofing.
- The site needs a small server-rendered (or build-time-rendered) layer for
  Map Info Pages, even though the actual map files are static and verbatim.
- Map files coming out of the `gemara-map` skill currently don't carry a
  language code in their filename; the site needs a mapping layer until the
  skill emits it (a small, easy change to the skill).

## Alternatives considered

- **Language as a top-level prefix (`/he/map/…`, `/en/map/…`)** — standard
  i18n pattern, but it forces a symmetric `/he` and `/en` tree that doesn't
  match the reality that not every language exists for every map.
- **Language as a query string (`?lang=en`)** — bad for SEO and breaks the
  one-stable-URL-per-resource property of the standalone map files.
- **No `/map/` product segment** — shorter URLs today, painful URL migration
  the day Chazarah ships a second product.
- **Bare URL redirects to the canonical variant** — invisible to users, but
  forfeits the SEO and submission-entry-point value of an info page.
