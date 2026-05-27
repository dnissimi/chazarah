# ADR 0003 — Astro on Cloudflare Pages

- Status: Accepted
- Date: 2026-05-26

## Context

[[Chazarah]] is a content-heavy, mostly-static site that needs a few specific
dynamic capabilities: a submission endpoint (see [ADR 0001](./0001-submissions-as-github-issues.md)),
a small authenticated admin page, and per-map [[Map Info Page]]s rendered from
metadata. It must support Hebrew/RTL and gracefully accommodate other
languages as their coverage grows. It will also need to grow beyond a single
product over time.

## Decision

The site is built with **Astro** and deployed to **Cloudflare Pages**. The
submission endpoint is implemented as an Astro endpoint and runs as a
Cloudflare Worker on the same domain. Cloudflare Turnstile provides a free
CAPTCHA on the submission form; Cloudflare KV holds short-lived rate-limit
counters.

[[Chazarah Map]] HTML files, produced by the `gemara-map` skill, are checked
in untouched under the site's static-assets directory and served verbatim at
their URL — the build does not transform them. Map metadata (title, available
language variants, etc.) lives in an Astro content collection alongside the
map files and drives the rendering of [[Map Info Page]]s and browse indexes.

The codebase splits cleanly into two halves: **TypeScript/Astro for the site**,
**Python for everything Claude Code touches** (the `gemara-map` skill, the
`/chazarah-fulfill` slash command, any scripts).

## Consequences

**Good**
- One platform, one deploy pipeline, one domain — Cloudflare Pages handles
  build, static hosting, the submission Worker, Turnstile, KV, and (if ever
  needed) D1.
- Astro's content collections + dynamic routes are a natural fit for [[Map
  Info Page]]s and for browse pages over a corpus that grows.
- Static-first with selective server logic matches the actual workload: most
  pages are content; the only dynamic surface is the submission POST.
- The skill's standalone-HTML output flows through untransformed, preserving
  the invariant that maps are self-contained.

**Bad / accepted trade-offs**
- Astro's built-in i18n routing assumes language as a path *prefix*; our URL
  shape (see [ADR 0002](./0002-url-shape-for-maps.md)) puts language as a
  *suffix*. We'll write a small explicit dynamic route rather than fight the
  helper. Minor code, no real friction.
- The owner's Python comfort doesn't reach the site code; site work is
  TypeScript/Astro. (The Python half — Claude Code skills and scripts —
  remains the owner's home turf.)

## Alternatives considered

- **Next.js on Vercel** — fully capable but heavy for a content site. More
  surface area to maintain than the project needs.
- **Eleventy + separate Cloudflare Worker** — leaner SSG, but splits deploy
  and routing across two services for no real gain.
- **Hugo + separate function service** — fastest builds, but the submission
  endpoint forces a second service and a second pipeline.
- **Python (FastAPI) + static files** — closer to the owner's comfort zone,
  but always-on server, more ops, no edge caching by default. The dynamic
  surface here is too small to justify a long-running server.
