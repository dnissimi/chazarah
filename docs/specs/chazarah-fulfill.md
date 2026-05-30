# Spec: the `/chazarah-fulfill` skill

Scoped 2026-05-29 in a grilling session. This is the brief for building the
skill (via `skill-creator`). Fulfill's coupling to `gemara-map` is just the
**invoke interface** (a ref in → artifact path(s) out), which is stable — so
fulfill can be **built now**. What actually waits on the `gemara-map` changes
landing (the `gemara-map:` `<head>` metadata block + bilingual output, per
[ADR 0006](../adr/0006-bilingual-map-files-and-per-variant-language-policy.md)
and [map-wiring.md](./map-wiring.md)) is **(a)** the publication skill (skill 3),
which *reads* that metadata to wire the site, and **(b)** realistic end-to-end
testing of the edit branch against a real bilingual artifact. The request branch
and the issue-parsing/lifecycle logic can be exercised immediately.

Resolves open issue **chazarah#15** (whether to split fulfill, and/or merge it
with a triage reviewer). The answer below: **fulfill is fulfill-only**; triage
stays upstream; publication is a *third* skill.

## The three-skill architecture

Fulfill is the middle of three skills. Each does one thing.

1. **`gemara-map`** *(exists; being updated separately)* — pure generator. A
   Sefaria ref → one self-contained **bilingual** HTML map (HE⇄EN toggle) with
   a `gemara-map:`-namespaced `<head>` metadata block. Site-agnostic: knows
   nothing about Chazarah's repo layout or URL shape.
2. **`/chazarah-fulfill`** *(this spec)* — the submission-queue processor. Takes
   one approved issue from the private `dnissimi/chazarah-submissions` repo,
   produces or edits the map artifact, then **offers to hand off to skill 3**.
   It does **not** wire anything into the site.
3. **publication / deployment skill** *(future — not built here)* — the shared
   "get a map onto the site" step: compute the URL-shaped path, place the HTML
   verbatim, write/update the content-collection YAML, register a new masechet
   if needed, open the PR (Cloudflare preview = the review gate), deploy. It is
   invoked by **both** producers: `gemara-map` run standalone, **and** fulfill.
   Everything in [map-wiring.md](./map-wiring.md) is **this** skill's job, not
   fulfill's.

## Inputs (the issue contract)

Source of truth: `src/lib/submission.ts`. Each submission issue body is a fenced
` ```json ` block (the visitor's raw payload) followed by human-readable prose.
Fulfill:

- Fetches the issue with `gh issue view <n> --repo dnissimi/chazarah-submissions
  --json title,body,labels,comments` (read access to the private repo required).
- Parses the JSON block. **Rejects** any `schemaVersion` it doesn't understand
  (currently `1`) — fail loud, don't guess.
- Reads the **comments** as the owner's *curated, approved guidance* — distinct
  from the visitor's raw payload. For feedback especially, the comments carry
  the approved change instruction.

`map-request` payload: `{ kind, schemaVersion, ref:{raw,resolved,resolvedOk},
targetLanguage, note, email, submittedAt }`. Use `ref.resolved` when
`resolvedOk`, else the curated comments should have clarified the ref.

`map-feedback` payload: `{ kind, schemaVersion, ref, languageVariant,
nodeOrQuote, observation, email, submittedAt }`. `nodeOrQuote` is the in-map
modal's pre-filled anchor — a precise pointer to what to change.

## Invocation

- `/chazarah-fulfill <issue#>` — operate on exactly that one issue.
- `/chazarah-fulfill` (bare) — list the `ready-for-agent` queue so the owner
  picks one. Does not auto-process.

## Behavior

### Pre-flight (both kinds)

- Confirm the issue is labeled `ready-for-agent`. (Triage — validating the ref,
  deduping, deciding `needs-info`/`wontfix` — happens **upstream**, by the owner
  or the generic triage skill. Fulfill assumes it's done.)
- Thin guardrails so a mislabeled issue fails loud rather than corrupting the
  site (see per-branch checks below).

### Map Request → generate (delegate to `gemara-map`)

1. Extract the ref from the payload.
2. **Existing-map sub-check** (post-ADR-0006, a map is one bilingual file):
   - **No map at this ref** → fresh generate.
   - **A map exists but lacks the requested `targetLanguage`** (e.g. a he-only
     legacy map, request asks `en`) → **regenerate as bilingual** (the ADR-0006
     migration path); this *replaces* the existing file. Surface that it's a
     replacement, not a new map.
   - **A map exists and already covers the requested language** → it's a
     duplicate; flag it (it shouldn't have been `ready-for-agent`) and stop.
3. **Invoke the `gemara-map` skill in-context** with the ref (do NOT
   re-implement its fetch/template pipeline — that would duplicate logic and
   drift). gemara-map writes artifact(s) to its workspace.
4. **Multi-daf fan-out**: gemara-map emits *one file per daf*, so a range
   request (e.g. "Megillah 26–29") yields N artifacts from one issue. Fulfill
   carries all N forward; the publication side commits **one per daf** to
   `main` and, after the last one is pushed, closes the single issue once
   (see Cross-repo lifecycle).

### Map Feedback → edit the existing map in place

The existing published HTML is the base; the curated issue + comments are the
change spec. "Served verbatim" (ADR 0004) means served byte-for-byte, **not**
immutable — editing and re-committing the file is in-bounds.

1. Locate the existing map for `ref` (+ `languageVariant`). **Guardrail**: if no
   map exists at that ref, fail loud (feedback on a nonexistent map = mislabeled).
2. **Fetch the source from Sefaria for grounding** even for small edits — use
   gemara-map's `fetch_sugya.py` for the relevant segment. The owner's feedback
   is trusted as the *intent* (that's why it was approved), but the fetch gives
   the model the authoritative text as context.
3. Apply the change anchored by `nodeOrQuote` + `observation` + comments —
   ranging from a one-word text tweak to a diagram remap.
4. **Discrepancy handling (advisory)**: if the Sefaria source contradicts the
   reporter's claim, **point it out** (in the run output / handed to the
   publish commit message body and the closing comment on the issue) rather
   than silently applying or hard-refusing. The human stays the judge.
5. Faithfulness invariants (load-bearing, [ADR 0005]/[ADR 0006]): never
   introduce Davidson English onto the Hebrew side; the Hebrew stays
   LLM-authored from the Aramaic; the English side uses Davidson directly.

### Hand off to skill 3

When the artifact is produced/edited, fulfill **offers to run the publication
skill** (`chazarah-publish`) rather than wiring the site itself. Handoff payload:

```
{ kind: "new" | "edit",
  artifacts: [<path>, ...],          // N>1 for a multi-daf range
  sourceIssue: "dnissimi/chazarah-submissions#<n>",
  refs: [<sefaria-ref>, ...],
  notes: "<discrepancy flags / replacement warnings, if any>" }
```

`chazarah-publish` consumes this, pushes each artifact to `main` (Cloudflare
deploys), and — after the *last* artifact in the set is live — closes the
submission issue directly with a comment listing the live URL(s).

## Cross-repo issue lifecycle

The issue lives in private `chazarah-submissions`; the published files live in
public `chazarah`. Both repos are touched within a single publish run.

Fulfill's part:
- On pickup, **drop `ready-for-agent`** (mark in-flight) so the bare-invocation
  queue listing and re-runs don't re-surface an issue already being worked.
- Pass `sourceIssue` in the handoff to `chazarah-publish`.

`chazarah-publish`'s part:
- Commits + pushes each artifact to `main` (one commit per daf).
- After the last artifact is pushed, runs `gh issue close <n> --repo dnissimi/chazarah-submissions`
  with a comment listing the live URL(s). The skill drives the close directly
  using the local `gh` auth — no PR, no merge Action, no PAT secret.

If `chazarah-publish` fails partway through a multi-daf range, the issue stays
open: re-run on the remaining artifacts.

## Out of scope (explicitly)

- **Triage** — upstream; fulfill consumes `ready-for-agent`.
- **Site wiring / deploy / issue-close** — `chazarah-publish`.
- **The `gemara-map` template/metadata/bilingual changes** — separate context.

## Derived decisions to confirm

These follow from ADR 0006 / the code contract rather than from an explicit
choice in the session — confirm before/while building:

1. Request-for-a-language-of-an-existing-map = **regenerate bilingual**
   (replace), not dup-reject.
2. Fulfill **rejects unknown `schemaVersion`** and fails loud.
3. Multi-daf range issue closes only after its **last** artifact is pushed.
