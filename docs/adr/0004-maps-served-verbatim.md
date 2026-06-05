# ADR 0004 — Chazarah Maps are served verbatim; the skill output is the source of truth

- Status: Accepted — revised 2026-06-05 (see "Revision: site-header wrap")
- Date: 2026-05-26

## Context

A [[Chazarah Map]] is a self-contained HTML page produced by the `gemara-map`
skill (today; other skills later, as the product extends to non-Talmud
corpora). The page carries its own fonts, CSS, Mermaid initialization, RTL
layout, language-toggle JS, and quote panels. We had to decide whether
[[Chazarah]] would render maps with its own components, wrap them in an
iframe or shell, or simply serve them as-is.

## Decision

The site serves map HTML files **verbatim**. The build does not transform
them; the URL `…/<lang>` returns the exact bytes the skill produced. The site
contributes the [[Map Info Page]] at the bare URL, the browse indexes around
the corpus, and a small footer link that the skill template embeds back into
each map — *that* link is the only coupling the skill makes to the site.

The skill output is the source of truth for what a map looks like.

## Consequences

**Good**
- A map is a single file: saveable offline, emailable, archivable, embeddable.
  The site is the bookstore; the map is the book.
- One canonical visual style, defined by the skill template — not split
  between the skill and the site.
- Updates to the skill (new colors, new edge types, new toggles) flow through
  to the site with no porting work.
- Deep links inside a map (`#sugya-3`) remain unmodified and stable.

**Bad / accepted trade-offs**
- Site chrome doesn't persist while a visitor is inside a map. To return to
  the library, the visitor uses the footer link embedded by the skill (or
  the browser back button). This is by design — chrome persistence would
  require an iframe or rewriting the page, both of which we rejected.
- Any visual change that should be coordinated between site chrome and the
  map (e.g., a unified header bar) requires touching the skill template,
  not just the site CSS.
- We rely on a discipline: the skill must not embed site-specific URLs
  beyond the single configurable footer link. Other skill–site coupling is a
  drift to push back on.

## Alternatives considered

- **Iframe each map inside a site shell.** Persistent nav around every map,
  but breaks deep links into a map, complicates SEO, hurts RTL behavior,
  introduces scroll quirks. Rejected.
- **Decompose and re-render the map inside site components.** Extract the
  Mermaid + quotes from the HTML and rebuild in Astro components. Maximum
  visual unity but forks the skill output: every skill change requires a
  matching site change. The skill is already a spec; we won't keep two.
- **Bake site chrome into the generated HTML.** Couples the skill to a
  specific site. Bad for a future where Chazarah hosts other products and
  the skill might (in principle) be used elsewhere.

## Revision: site-header wrap (2026-06-05)

The "site chrome doesn't persist inside a map" trade-off above proved too
costly: a visitor landing on `/map/.../<lang>` (from search, a shared link, or
"recently viewed") had no way back into the site but the browser back button.
We resolved it with a **fourth option the original alternatives missed** —
neither iframe, nor decompose, nor baking chrome into the skill output:

> The canonical `/map/:corpus/:book/:location/:lang` URL is now a **prerendered
> Astro page** (`src/pages/map/[corpus]/[book]/[location]/[lang].astro`) that
> **reads the verbatim map file at build and serves it with a slim Chazarah
> header spliced in** (brand → home, Home/Library/Request, he⇄en), plus
> per-language `<title>`/description/canonical/hreflang/OG. The map's own body,
> styles, scripts, deep-link anchors, and content are untouched.

This keeps the ADR's spirit intact:
- **The skill output is still the source of truth and still verbatim** — the
  file on disk is unchanged, the skill is untouched (no site URLs baked in), and
  the raw file remains directly available at `/maps/.../<lang>.html` for
  offline/email/embed use. The wrap is applied by the *site* at build, not by
  the skill, and lives in exactly one place (the Astro page).
- A header change touches that one page, **not** the skill template (this
  reverses the old "unified header bar requires touching the skill" trade-off).
- Deep links (`#sugya-3`) and the in-map cross-link/toggle/feedback still work,
  since the document is the same plus a sticky header above it.

Mechanics: the old `_redirects` 200-rewrite for this URL is removed (the Astro
page owns it now); the file is emitted as `<lang>.html` (`build.format:'file'`)
so Cloudflare serves the right content-type. The embedded footer/feedback link
the skill adds is unaffected.
