# Chazarah · חזרה

A non-commercial, Hebrew-first website that hosts a growing library of
**Chazarah Maps** — color-coded flowcharts of Talmudic sugyot (extensible to
other Sefaria corpora) — alongside the original text and a clear Hebrew
translation.

The site is the *bookstore*; each map is a self-contained *book*.

## Repository layout

- [`CONTEXT.md`](./CONTEXT.md) — domain glossary (terms used everywhere)
- [`CLAUDE.md`](./CLAUDE.md) — entry point for agents working on this repo
- [`docs/adr/`](./docs/adr/) — architectural decision records
- [`docs/agents/`](./docs/agents/) — agent skill configuration (issue
  tracker, triage labels, domain docs)
- [`docs/prds/`](./docs/prds/) — product requirements docs
- [`design/`](./design/) — design mockups and the Claude Design export the
  implementation is being built from

## Status

Pre-implementation. The site is specified ([PRD 0001](./docs/prds/0001-chazarah-mvp.md))
and designed; no application code exists yet.

## Stack (planned)

Astro on Cloudflare Pages, with a Cloudflare Worker for the submission
endpoint and Cloudflare Turnstile for anti-spam. See
[ADR 0003](./docs/adr/0003-astro-cloudflare-stack.md).

## License

The site code is the owner's work. The underlying source text is fetched
from [Sefaria](https://www.sefaria.org). The site is non-commercial; see
[ADR 0005](./docs/adr/0005-non-commercial-and-attribution.md).
