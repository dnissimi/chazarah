# Coding Standards — Chazarah

Project-specific standards for agents implementing or reviewing changes in
this repo. Read once at the start of a task; refer back when in doubt.

> Note: the default Sandcastle scaffold (parallel-planner template) ships a
> 3-phase loop (plan → implement → merge) with **no review phase**. Nothing
> reads this file automatically yet. To wire it in, either: (a) add a review
> phase to `.sandcastle/main.mts` modeled after the reference project's
> `review-prompt.md`, or (b) reference it from `implement-prompt.md` so the
> implementer reads it during execution (at the cost of more tokens per
> task).

## Domain language

- Use the canonical vocabulary defined in `CONTEXT.md` — `Chazarah`,
  `Chazarah Map`, `Map Info Page`, `Map Request`, `Map Feedback`,
  `Site Recents` vs `Visitor Recents`, `Sugya`, `Daf`, `Masechet`, `Amud`.
- Don't drift to synonyms the glossary deliberately avoids
  (no "review tool," no "lesson," no "sugya page" when "Map Info Page" is
  meant).
- If you need a concept that isn't in the glossary, that's a signal — either
  reconsider, or call it out in the PR description.

## Architectural respect

- Read relevant ADRs (`docs/adr/`) before touching the areas they cover.
- If your change contradicts an existing ADR, **surface it explicitly** in
  the PR description (don't silently override):
  > _Contradicts ADR-0004 (maps served verbatim) — but worth reopening because…_
- Load-bearing invariants that are easy to violate without realising:
  - **ADR 0001** — Visitor submissions go to `dnissimi/chazarah-submissions`,
    a *separate* private repo. Never write submission data to this repo's
    issues. PRD work, on the other hand, lives here.
  - **ADR 0002** — Map URLs are `/map/<corpus>/<book>/<location>` (info page)
    and `/map/<corpus>/<book>/<location>/<lang>` (the verbatim HTML).
    Language is the leaf, never a top-level prefix.
  - **ADR 0004** — The standalone map HTML files in `public/maps/` are served
    **verbatim**. Do not transform, wrap, iframe, or rewrite them. The site
    only links to them.
  - **ADR 0005** — Non-commercial. No ads, paywalls, subscription tiers,
    sponsorship slots, or commercial CTAs.

## TypeScript / Astro

- **No `any`.** Use proper types or `unknown` + narrowing.
- **Validate at boundaries.** Zod (or equivalent) on every external input —
  form bodies, fetch responses, env-var parsing. Internal code can trust
  types.
- **No backwards-compatibility shims.** Internal refactors should change the
  code, not add shims around it.
- **Prefer named exports.** Default exports only when an Astro convention
  requires it (e.g. page components).
- **Comments**: only when the *why* is non-obvious — a hidden constraint, a
  workaround, a subtle invariant. Never comment what the code does. Never
  reference the current task / PR / issue number in code comments — that
  belongs in the PR description.

## i18n discipline

- **No hardcoded UI strings in components.** Every visible string reads
  through the i18n table (`src/i18n/strings.ts` or equivalent). Even an
  English-only string starts in the table — that's the contract that lets
  Hebrew translations land later as a data change, not a code change.
- Hebrew is the **canonical** language. Every key in the table must have a
  Hebrew value. English values may be partial during v0.
- Map *content* (topic, blurb, title) is stored bilingually in the
  content-collection YAML; the renderer picks the field for the current UI
  language.

## Testing

- The PRD targets three deep modules for tests: **Submission Worker**,
  **Sefaria lookup**, **Map metadata extractor**. New code in those areas
  ships with tests.
- Shallow modules (Astro page components, layout chrome, the localStorage
  store, the i18n helper) do **not** need tests in v0 — visual review
  catches regressions.
- Tests describe **external behaviour**, not implementation detail. One
  test = one observable behaviour. Fast (<1s each), deterministic, no
  live network unless the test is explicitly an integration test.

## What to leave alone

- The standalone Chazarah Map HTML files in `public/maps/**` — produced by
  the `gemara-map` skill, served verbatim. Do not edit them; do not
  reformat them; do not "improve" their inline CSS.
- The design exploration files in `design/` — historical artefacts (one
  Claude Code mockup, one Claude Design export, plus the handoff doc).
  Do not modify; do not delete.
- `CONTEXT.md`, `docs/adr/*`, `docs/prds/*` — domain and decision history.
  Only update with explicit user direction (or via `/grill-with-docs` /
  `/to-prd` flows).
