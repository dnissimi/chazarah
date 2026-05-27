# PRD 0001 — Chazarah MVP (site + submission endpoint)

- Status: Ready for agent
- Date: 2026-05-27
- Scope: the public-facing [[Chazarah]] site, the Cloudflare Worker that
  receives submissions, the first batch of static map content.
- Explicitly **out** of scope (separate work): the `/chazarah-fulfill` slash
  command and `gemara-map` skill changes (language code in filename, footer
  link). Both are tracked as follow-up work; this PRD ships a site that
  doesn't depend on either.

Background reading:
- [`CONTEXT.md`](../../CONTEXT.md) — glossary
- ADRs [0001](../adr/0001-submissions-as-github-issues.md),
  [0002](../adr/0002-url-shape-for-maps.md),
  [0003](../adr/0003-astro-cloudflare-stack.md),
  [0004](../adr/0004-maps-served-verbatim.md),
  [0005](../adr/0005-non-commercial-and-attribution.md)

---

## Problem Statement

People who learn Talmud (and other Sefaria-indexed Torah literature) want to
*review* — חזרה — material they've already studied, and find that the
hardest part of review is reconstructing the *structure* of a sugya: what
the question was, where the back-and-forth pivoted, where it landed. Today
this happens on paper, in notebooks, or it doesn't happen at all. There is
no public catalogue of structural maps that one can land on, browse, request,
or correct.

Specifically:
- A learner who wants a visual map of the daf they just studied has nowhere
  to find one.
- A learner who *does* find a map (e.g. shared as a one-off HTML file) has
  no way to discover others, no way to know what's available, and no way to
  contribute back.
- A learner who finds a small mistake in a map has no path to fix it.
- A learner who wants a map for a passage that doesn't exist yet has no
  way to ask.

## Solution

A non-commercial, Hebrew-first (English available) website — [[Chazarah]] —
that hosts a growing library of [[Chazarah Map]] HTML pages produced by the
`gemara-map` skill. The site:

- **Lets visitors browse** the library by corpus → book → location.
- **Serves each map verbatim** at a stable URL with a sibling URL per
  language variant (see [[Map Info Page]] + ADR 0002).
- **Surfaces what's there** with a "Most Popular" table on the landing and
  per-visitor "Recently viewed" stored client-side ([[Visitor Recents]]).
- **Lets visitors contribute** in two ways — [[Map Request]] (for a passage
  that hasn't been mapped) and [[Map Feedback]] (on a passage that has) —
  both via a small form whose submission opens a GitHub issue in a private
  triage queue. The owner reviews, approves, and (out of scope here) runs
  the fulfill flow.

The site is the *bookstore*; each map remains a self-contained *book*. We
never wrap, transform, or re-render a map — we only link to it.

## User Stories

### Discovery & landing

1. As a first-time visitor, I want a clear one-sentence explanation of what Chazarah is and what a Chazarah Map looks like, so I can decide whether this site is for me.
2. As a daily learner, I want the landing page to feature today's [[Daf Yomi]] map prominently, so I can open it in one click without searching.
3. As a returning visitor, I want to see a "Most Popular" list of maps on the landing, so I can discover content I haven't seen yet.
4. As a returning visitor, I want to see a "Recently viewed" list of maps *I* have opened, so I can pick up where I left off — without creating an account.
5. As a visitor, I want the language switcher to be obvious and visible, so I can flip the UI between Hebrew and English without hunting for it.
6. As a Hebrew-reading visitor, I want the entire UI (nav, labels, body copy, breadcrumbs, dates) in Hebrew with RTL layout — Hebrew is the default.
7. As an English-reading visitor, I want the entire UI in English with LTR layout, with Sefaria refs rendered in Latin form (e.g. `Megillah 26` not `מגילה כ״ו`).
8. As a visitor, I want a one-line Sefaria credit visible on every page, so the source of the underlying text is clear.

### Browsing the library

9. As a visitor, I want to browse maps by [[Masechet]] (a tractate's full list of [[Daf]]im), so I can see what coverage exists in something I'm learning.
10. As a visitor, I want dapim that don't have a map yet to appear in the browse list anyway (as empty rows), so the catalog is honest about gaps.
11. As a visitor, I want to filter the browse list to "All / Has map / No map", so I can either see only what's available or only what's missing.
12. As a visitor, I want each daf row to show which language variants exist (e.g., `HE`, `EN`, `YI` chips), so I know at a glance.
13. As a visitor, I want to click any empty daf row's "Request this daf" link and arrive at the request form with the ref pre-filled, so I don't retype it.
14. As a visitor, I want a breadcrumb on every page (`Chazarah / Talmud / Megillah / כ״ו`) so I can navigate up the hierarchy.

### Map Info Page (the bare URL — `/map/<corpus>/<book>/<location>`)

15. As a visitor, I want the bare URL of a logical map to *always* render an info page (never 404), so URLs I share or bookmark survive even before a particular language exists.
16. As a visitor, I want the Map Info Page to show the map's title, a short blurb of what it covers, and the Sefaria ref, so I can verify I'm in the right place.
17. As a visitor, I want the Map Info Page to list **all** language variants we display (currently HE / EN / YI), with available ones linked and missing ones grayed-out + dashed.
18. As a visitor, I want each grayed-out missing-language row to have a "Request translation" button that takes me to the request form with ref + target language pre-filled.
19. As a visitor on a Map Info Page, I want a clearly-placed "Submit feedback on this map" CTA that takes me to the feedback form pre-filled with this map's ref.
20. As a visitor on a Map Info Page, I want previous/next adjacent maps within the same book (e.g., Megillah 25 ↔ Megillah 27), with topics shown when they exist.
21. As a visitor on a Map Info Page, I want the page to show the "Updated" date and the Sefaria credit footer.
22. As a visitor on a Map Info Page for a daf that has no maps yet, I want a friendly empty state and a single CTA to request the daf.

### Opening a map

23. As a visitor, I want clicking a language variant link to open the standalone map HTML at its stable URL (`/map/<corpus>/<book>/<location>/<lang>`), unmodified by the site, in the same tab.
24. As a visitor, I want a deep link into a specific section of a map (e.g., `#sugya-3`) to remain stable, so I can share a precise location within a map.

### [[Map Request]]

25. As a visitor on `/request`, I want a "Sefaria reference" field where I can type a ref in Hebrew (`מגילה כו`) or Latin (`Megillah 26`), and a "Lookup" button that resolves it via Sefaria, so I get confirmation I've named a real ref before submitting.
26. As a visitor, I want the lookup to display a clear "Resolved: <canonical ref>" state when it succeeds and a "Not found — you can still submit; we'll check manually" state when it doesn't (still allow submission, ADR-aligned with manual triage).
27. As a visitor, I want to optionally pick a target language (default Hebrew) via pills (`HE / EN / YI`), so I can ask for a translation alongside the base request.
28. As a visitor, I want optional "Note" and "Email" fields — note for context, email for a "when it's ready" notification.
29. As a visitor, I want a Turnstile widget on the form so abuse is prevented without the friction of a traditional CAPTCHA.
30. As a visitor, I want a clear success state after submitting that confirms the request was queued and tells me what to expect (manual review, no SLA).
31. As a visitor, I want the "Sefaria taxonomy" eventually surfaced as cascading dropdowns / autocomplete for the corpus/book selection (post-v1; v1 ships lookup-only).

### [[Map Feedback]]

32. As a visitor on `/feedback?ref=<ref>`, I want a non-editable banner at the top showing which map this feedback is about, so I can't accidentally misfile it.
33. As a visitor, I want an optional "Specific node or quote number" field for pinpointing the observation.
34. As a visitor, I want a required free-text observation field — the actual feedback.
35. As a visitor, I want an optional email field for follow-up.
36. As a visitor, I want a clear success state after submitting that confirms the feedback was received.

### Site infrastructure / shared

37. As a visitor, I want pages to load fast (static, edge-cached) and work without JavaScript for content (forms and Visitor Recents are JS-only, which is fine).
38. As a visitor, I want the site to render correctly on mobile (single-column, readable type, tappable targets).
39. As a visitor, I want the typography to feel like a printed sefer — David Libre (display) and Assistant (body) — not a generic webapp.
40. As a visitor, I want a 404 page that's clearly Chazarah-branded and offers a way home.

### Owner / operator (passes through to a non-site flow)

41. As the owner, I want each form submission to land as a structured GitHub issue in a private `chazarah-submissions` repo so I can triage in a familiar tool.
42. As the owner, I want each issue's body to follow a documented template (machine-parseable) so the future `/chazarah-fulfill` can consume it without ambiguity.
43. As the owner, I want each issue tagged with `map-request` or `map-feedback` so I can filter quickly.
44. As the owner, I want the submission Worker to fail loudly (5xx with a body the form can show) if GitHub or Turnstile is down, rather than silently dropping submissions.
45. As the owner, I want rate-limiting on the submission endpoint (per-IP, per-hour) so a runaway bot can't fill my issue tracker.

---

## Implementation Decisions

### Stack & deployment
- **Astro on Cloudflare Pages** per ADR 0003. Map files are committed under
  `public/maps/<corpus>/<book>/<location>/<lang>.html` and served verbatim.
- **No SSR for content pages**: every Astro page is generated at build time
  except the submission endpoint, which is an Astro endpoint deployed as a
  Cloudflare Worker.
- **Deploy on push to `main`**; PR previews on by default.

### URL shape (locked, ADR 0002)
- `/map/<corpus>/<book>/<location>` → [[Map Info Page]] (site-rendered, never 404)
- `/map/<corpus>/<book>/<location>/<lang>` → standalone map HTML, verbatim
- `/map/<corpus>/<book>/` → browse page for the book
- `/request`, `/feedback?ref=<ref>` → submission forms
- `/` → landing
- Astro **does not** use its built-in i18n routing helper (which assumes
  language-as-prefix); we write explicit dynamic routes since language is a
  suffix.

### Site chrome i18n
- All UI strings live in a single i18n table (`src/i18n/strings.ts`) keyed
  by language (`he`, `en`).
- Language switcher is in the top-right of the header; choice persists in
  `localStorage` and sets the `dir`/`lang` attributes on `<html>`.
- Hebrew is the default if no preference is stored.
- All map *content* (topic strings, references) is stored bilingually in
  the map metadata; the renderer picks the field for the current UI
  language.

### Map metadata (Astro content collection)
- One entry per logical map (not per language variant) under
  `src/content/maps/`. Filename mirrors the URL: `talmud/megillah/26.yaml`.
- Schema (Zod):

  ```ts
  {
    corpus: 'talmud' | 'mishnah' | 'tanakh' | 'halakhah' | 'midrash',
    book: string,                 // sefaria slug, e.g. 'megillah'
    location: string,             // 'free-form, sefaria-resolvable, e.g. "26" or "2-3"'
    title: { he: string, en: string },
    blurb: { he: string, en: string },
    topic: { he: string, en: string },
    sefariaRef: string,           // canonical, e.g. 'Megillah 26'
    languages: Array<'he' | 'en' | 'yi'>,   // which variant files exist
    sugyaCount?: number,
    updated: string,              // ISO date
  }
  ```

- For v0 the entries are written by hand alongside the first maps; later,
  `/chazarah-fulfill` writes them automatically. The schema is the same
  in both modes — that's the contract.

### Adjacent-map navigation
- Computed at build time from the content collection: previous/next is the
  numerically-closest existing map within the same `book`, with the
  immediately-prior/next location number (existing or not) used to label the
  card. If the adjacent location has a map, link it; if not, render a
  disabled card that links to the request form pre-filled with that
  location.

### Submission endpoint (Cloudflare Worker / Astro endpoint)
- Route: `POST /api/submit` (single endpoint; the body discriminates between
  `map-request` and `map-feedback`).
- Validates the payload against a Zod schema (separate schema per `kind`).
- Verifies the Turnstile token against Cloudflare's siteverify endpoint.
- Rate-limit: KV-backed, per-IP, 10 submissions / hour. Soft-fail with 429.
- Opens a GitHub issue via the GitHub REST API
  (`POST /repos/<owner>/chazarah-submissions/issues`) with:
  - `labels`: `['map-request']` or `['map-feedback']`, plus `'needs-triage'`
  - `title`: short, e.g. `[Request] Megillah 26 — HE` or `[Feedback] Megillah 26 / HE`
  - `body`: see "Issue body templates" below.
- Returns `{ok: true, issueUrl: string}` on success.
- Authenticated using a GitHub fine-grained token (scope: issues:write on
  the submissions repo only). Token in a Cloudflare secret, not a regular
  env var.

### Issue body templates (the contract with the future `/chazarah-fulfill`)
Both templates open with a fenced JSON block (machine-parseable), followed
by a human-readable section. `/chazarah-fulfill` reads only the JSON block;
the prose is for the owner triaging in GitHub's UI.

**Map Request body:**

```
\`\`\`json
{
  "kind": "map-request",
  "schemaVersion": 1,
  "ref": { "raw": "מגילה כו", "resolved": "Megillah 26", "resolvedOk": true },
  "targetLanguage": "he",
  "note": "...",
  "email": "...",
  "submittedAt": "2026-05-27T..."
}
\`\`\`

(human-readable summary repeated for triage)
```

**Map Feedback body:**

```
\`\`\`json
{
  "kind": "map-feedback",
  "schemaVersion": 1,
  "ref": "Megillah 26",
  "languageVariant": "he",
  "nodeOrQuote": "node 3",
  "observation": "...",
  "email": "...",
  "submittedAt": "2026-05-27T..."
}
\`\`\`

(human-readable summary repeated for triage)
```

`schemaVersion` is reserved so the parser can detect and reject unfamiliar
payload shapes.

### Sefaria integration — hybrid (this PRD's call)
- **Taxonomy** (corpus → book tree) is **snapshotted at build time** by
  `scripts/snapshot-sefaria-taxonomy.ts` into `src/data/sefaria-taxonomy.json`.
  Refreshed manually or by a quarterly GitHub Action. Drives any future
  cascading-dropdown UI on `/request` (post-v1).
- **Name resolution** (the `/request` form's "Lookup" button) calls Sefaria's
  live `/api/name?name=<query>` endpoint **from the browser** (CORS is open
  on Sefaria's API). Returns canonical ref, Hebrew ref, "not-found", or an
  ambiguous-options list. The lookup result is non-blocking — the visitor
  can submit even if lookup returns "not found"; the issue body records
  `resolvedOk: false` for the owner to handle manually.
- Rationale: taxonomy doesn't change; resolution input space is open.

### Visitor Recents
- Pure `localStorage`. Key `chazarah.visitorRecents.v2` (versioned so we can
  bump the schema and re-seed). Entries: `{ corpus, book, location, topic{he,en}, ref, openedAt }`.
- Bounded: keep the most recent 10. Pushed on every visit to a Map Info
  Page or a standalone map page (added via a tiny client snippet injected
  on the Map Info Page; the standalone map HTML is *not* modified — see ADR
  0004; instead, the footer link in the map points to the Map Info Page,
  which is when we record the visit). v0 only records visits to the Map
  Info Page; recording from inside the standalone HTML is a `/gemara-map`
  skill change tracked separately.
- Surfaced on the landing in the "Your recent maps" section, only rendered
  if non-empty.

### Site Recents ("Most Popular")
- Sourced from the content collection at build time: top N maps by an
  `updated` date (v0 proxy for popularity — we don't have analytics yet).
- The label is "Most Popular" / "הפופולריים ביותר" (forward-looking; once
  analytics are wired, we swap the sort key without changing the label).

### Typography & palette (locked in design)
- Display: **David Libre** (Google Fonts, weights 400/500/700).
- Body: **Assistant** (Google Fonts, weights 300–700).
- Palette: "bone" — paper `#f1ece2`, ink `#1c1815`, navy accent `#2a3a6b`,
  warm rule `#cabfb0` / `#a99c8b`. Full token list in design `styles.css`.
- The site's color/type vocabulary is intentionally close to but distinct
  from the [[Chazarah Map]] visual identity (which uses Frank Ruhl Libre +
  pastel node colors). Chrome ≠ map; they harmonize, not duplicate.

### Brand mark
- A small abstract three-bar SVG glyph (layered horizontal lines suggesting
  text structure). Decorative only. Not a Hebrew letter, not a Star of
  David — see the design `chrome.jsx` for the source.

### Initial content
- Manually commit ~3–5 Chazarah Map files under `public/maps/talmud/...`
  for launch. The first one is **Megillah 26** (used as the Daf Yomi
  feature on the landing in the design). Their corresponding `.yaml`
  metadata entries are written by hand.

### Out-of-product machinery (excluded from this PRD)
- The `/chazarah-fulfill` slash command — separate work, scoped via
  `/skill-builder` later.
- `gemara-map` skill changes (language code in filename, footer link
  back to Map Info Page) — separate context. **Until those land**, the
  manually-committed v0 map files should be named/linked manually to
  match the URL shape.

---

## Testing Decisions

### What makes a good test
- Tests external, contract-level behavior — never implementation detail.
- One test = one observable behavior.
- Tests run fast (<1s each) and deterministic (no live network unless
  explicitly an integration test).
- Tests are written against the **interface** of a deep module, so the
  module can be refactored freely.

### Modules to test (high-leverage only — per scope cut)

**1. Submission Worker** (`POST /api/submit`)
- The most contract-critical module — a bug here either drops submissions
  silently or pollutes the issue queue. Integration tests against a
  scratch GitHub repo, plus unit tests for validation and Turnstile
  verification.
- Tests cover:
  - Valid Map Request → creates an issue with the right title, labels, and JSON body
  - Valid Map Feedback → same, different shape
  - Invalid payload (missing required fields, unknown kind) → 400 with structured error
  - Turnstile verification fails → 403
  - Rate-limit exceeded → 429
  - GitHub API 5xx → endpoint returns 502 with a body the form can render
  - Round-trip: write an issue body with the Worker, parse it with a stand-in
    parser (a Zod parser that matches the future `/chazarah-fulfill` schema
    — this is the contract we want frozen now, even though the *real*
    parser lives in the deferred skill).

**2. Sefaria lookup**
- Pure browser-side function wrapping `fetch` to Sefaria's `/api/name`.
- Tests cover:
  - Known canonical refs resolve → ok:true with normalized form
  - Unknown text → ok:false with `not-found` reason
  - Ambiguous (multiple matches) → returns the list, surfaced in the UI
  - Empty / whitespace-only input → ok:false without making a network call
  - Network error → ok:false, soft-fail so the visitor can still submit

**3. Map metadata extractor**
- Pure function: given the bytes of a standalone map HTML, returns the
  metadata fields the content-collection schema expects.
- Tests cover:
  - A known good Megillah 26 HTML → expected title, takeaway, ref, sugya count
  - A multi-language file produces the right `languages` entry
  - Missing/malformed metadata → returns partial result with a clear flag,
    never throws

### Modules NOT tested in v0
- Astro page components (landing, browse, map info, forms) — shallow,
  presentational; tests would be snapshot-y and low-leverage. Visual
  review during build covers them.
- Visitor Recents store — trivial `localStorage` wrapper; any breakage is
  immediately visible.
- i18n helpers — flat lookup table; tests would tautologically copy the
  table.
- Content-collection schema validation — Zod gives us this for free at
  build time; a typed schema is its own test.

### Prior art
- This is a new codebase; there's no existing test prior art in the
  Chazarah repo. The Submission Worker tests should follow patterns from
  Cloudflare Workers' official test harness (`@cloudflare/vitest-pool-workers`
  or Miniflare). Sefaria lookup tests can use `vi.fn()` to stub `fetch`.
  Map metadata extractor tests run plain Node + Vitest.

---

## Out of Scope

The following are explicitly **not** part of this PRD and should not be
implemented as part of the work it scopes:

1. **`/chazarah-fulfill` slash command** — the full operator loop that
   reads a submission issue, generates or revises a map, opens a PR, and
   comments back on the issue. Tracked separately; will use the
   `/skill-builder` skill.
2. **`gemara-map` skill changes** — adding a language-code suffix to
   output filenames; adding a configurable footer link back to the Map
   Info Page. Done in a separate context.
3. **User accounts / authentication** — none in v0. Visitor Recents is
   `localStorage`-only.
4. **Search** — no site-wide search bar. Visitors browse via corpus →
   book → map. Add when the library is big enough that browse fails.
5. **Cascading dropdowns / autocomplete for the request form** — v1 ships
   the lookup-only path. The Sefaria taxonomy snapshot lands now to
   *enable* this, but the dropdown UI is deferred.
6. **Admin UI / `/admin` panel** — the owner triages submissions directly
   in GitHub. ADR 0001 documented this choice.
7. **Comments / discussion threads** under maps — out of scope; feedback
   goes through the queue, not a public thread.
8. **Donation button** — allowed under the non-commercial posture
   (ADR 0005), but not in v0.
9. **Analytics** — none in v0. Site Recents uses the `updated` date as a
   popularity proxy until analytics exist.
10. **English chrome translation** — the i18n primitives ship; the English
    table can be partial in v0 and filled out over time. **Hebrew** must
    be complete.
11. **Yiddish / Arabic / Russian site chrome** — only Hebrew and English
    site chrome in v0 (though *maps* in other languages can exist and be
    linked).
12. **Mobile native apps** — web only.

---

## Further Notes

### Sequencing recommendation
A reasonable order for the engineering work:
1. Astro project skeleton + deploy pipeline + bone palette + David Libre/Assistant fonts.
2. i18n primitives + language switcher in the header.
3. Map content-collection schema + commit the first map (Megillah 26 in Hebrew) + Map Info Page rendering.
4. Browse page + Site Recents.
5. Landing page (editorial hero + Daf Yomi feature + Most Popular + Visitor Recents block + request banner).
6. Request form (lookup-only) + Feedback form + Turnstile widget.
7. Submission Worker + GitHub-issue body templates + rate limiting.
8. Test pass (the three deep modules above).
9. Manually commit 2–3 more maps for launch content.

### Hebrew / English content parity
Per the chat in the design (`design/claude/chat1.md`), the user iterated to
ensure that the English page shows English topics, the Hebrew page shows
Hebrew topics, refs render in the appropriate form, etc. The implementation
must enforce this: any place a topic/ref string surfaces, it must read
through the i18n switch — no hardcoded language inside a page component.

### The non-commercial constraint is design-time
Per ADR 0005, no ads, no paywall, no subscription tier. Build the site with
that constraint internalized: no analytics that monetize, no sponsorship
slots in the layout, no commercial CTAs.

### Visitor Recents and the standalone map files
A subtle interaction: when a visitor opens the standalone map HTML
(`/map/.../<lang>`), we'd like to record that visit in Visitor Recents. But
the standalone HTML is served verbatim (ADR 0004) and we can't inject
JavaScript into it. The v0 workaround is to record the visit on the Map
Info Page only (since reaching a map almost always goes Info → standalone).
A more complete solution arrives when the `gemara-map` skill gains the
configurable footer link back to the Info Page — at that point, the skill
can also be given a tiny snippet that POSTs nothing but updates
`localStorage` on load. **That's a follow-up, not part of this PRD.**
