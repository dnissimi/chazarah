---
name: chazarah-fulfill
description: >-
  Process the Chazarah submission queue: take one approved (ready-for-agent)
  Map Request or Map Feedback issue from the private dnissimi/chazarah-submissions
  repo and produce the map artifact — for a request, generate a new map by
  invoking the gemara-map skill; for feedback, edit the existing published map in
  place per the curated issue + comments — then hand off to the publication skill.
  Use this whenever the user wants to fulfill, process, work, or action the
  Chazarah submission queue / chazarah-submissions issues / a map request or map
  feedback, or says "/chazarah-fulfill", "fulfill issue 42", "process the map
  requests", or "handle the feedback queue". Does NOT triage (it assumes the issue
  is already ready-for-agent) and does NOT wire or deploy to the site (that is the
  separate publication skill).
---

# Chazarah Fulfill

Turn one **approved** submission-queue issue into a produced or edited
[[Chazarah Map]] artifact, then hand it to the publication skill. This is the
middle of three skills — see the design spec at
`/Users/dnissimi/PycharmProjects/chazarah/docs/specs/chazarah-fulfill.md` for the
full rationale, and `docs/adr/0005` + `docs/adr/0006` for the load-bearing IP /
language decisions. Read the spec if anything here is ambiguous; it is the
source of truth and this file is the operational procedure.

## Where this skill sits (and what it is NOT)

Three skills, each doing one thing:

1. **gemara-map** *(separate, exists)* — pure generator. A Sefaria ref → one
   self-contained bilingual HTML map. Site-agnostic.
2. **chazarah-fulfill** *(this skill)* — the queue processor. One approved issue
   → produce (delegating to gemara-map) or edit the artifact → hand off.
3. **publication / deployment skill** *(separate, may not exist yet)* — wires the
   artifact into the site (path, content-collection YAML, masechet registration,
   PR, deploy). Invoked by both gemara-map (standalone) and this skill.

This skill deliberately does **not**:

- **Triage.** It assumes the issue is already labeled `ready-for-agent` (you, or
  a triage skill, validated the ref, deduped, and decided it's actionable).
  Fulfill only does thin guardrails so a *mis*labeled issue fails loud.
- **Wire/deploy to the site or close the issue on merge.** That is the
  publication layer's job (skill 3 + a merge-triggered Action). Everything in
  `docs/specs/map-wiring.md` belongs to skill 3, not here.

Keeping these separate is the whole point of the architecture — resist the urge
to "just also do the wiring." If skill 3 does not exist yet, stop after producing
the artifact and report the handoff payload + point at `map-wiring.md` so the
owner can wire manually for now (see Step 5).

## Repos and tools

- **Submissions (read/label/comment):** private `dnissimi/chazarah-submissions`
  — the issue queue. Use `gh ... --repo dnissimi/chazarah-submissions`.
- **Site (artifacts land here):** public `dnissimi/chazarah`, working dir
  `/Users/dnissimi/PycharmProjects/chazarah`.
- `gh` CLI must be authenticated with read+write on the submissions repo.

## Invocation

- `/chazarah-fulfill <issue#>` — operate on exactly that one issue.
- `/chazarah-fulfill` (bare) — **list the queue, don't process.** Show open
  issues labeled `ready-for-agent` so the owner can pick one:
  ```bash
  gh issue list --repo dnissimi/chazarah-submissions \
    --label ready-for-agent --state open \
    --json number,title,labels --jq '.[] | "#\(.number)  \(.title)"'
  ```
  Then ask which to fulfill. Do not auto-process the whole list.

## Workflow

### Step 1 — Load and validate the issue

Fetch the issue with its body and comments:

```bash
gh issue view <n> --repo dnissimi/chazarah-submissions \
  --json number,title,body,labels,comments
```

Then:

- **Confirm it is `ready-for-agent`.** If it is not (e.g. `needs-triage`,
  `needs-info`, `wontfix`), stop and say so — fulfilling un-triaged work is how
  bad maps reach the site. Triage is upstream.
- **Parse the machine block.** The body begins with a fenced ` ```json ` block —
  the visitor's raw payload (defined by `src/lib/submission.ts`). Extract it and
  read `kind` (`map-request` | `map-feedback`) and `schemaVersion`.
- **Reject unknown `schemaVersion`.** Currently only `1` is understood. If it is
  anything else, stop and report — fail loud rather than guess at a shape you
  don't know.
- **Read the comments as the owner's curated, approved guidance.** The JSON block
  is the *visitor's* words; the comments are *your* clarifications added during
  triage/approval. For feedback especially, the comments carry the real
  instruction — weight them heavily.

`map-request` payload: `{ ref:{raw,resolved,resolvedOk}, targetLanguage, note,
email, submittedAt }`. Use `ref.resolved` when `resolvedOk` is true; otherwise
the curated comments should have pinned the ref — if neither gives you a usable
ref, stop and ask.

`map-feedback` payload: `{ ref, languageVariant, nodeOrQuote, observation, email,
submittedAt }`. `nodeOrQuote` is the precise anchor the reporter flagged (it
comes pre-filled from the in-map "report a correction" modal).

### Step 2 — Branch on `kind`

Follow **Step 3** for `map-request`, **Step 4** for `map-feedback`.

### Step 3 — Map Request → generate (delegate to gemara-map)

The map is now one **bilingual** file (ADR 0006), so a "request" is not always a
fresh generate. First decide which case you're in by checking whether a map
already exists at this ref (look under
`/Users/dnissimi/PycharmProjects/chazarah/public/maps/<corpus>/<book>/<location>/`
and the content collection `src/content/maps/...`):

- **No map at this ref →** fresh generate.
- **A map exists but lacks the requested `targetLanguage`** (e.g. a legacy
  he-only map, request asks for `en`) **→** regenerate as **bilingual** — this is
  the ADR-0006 migration path and it **replaces** the existing file. Make the
  replacement explicit in your handoff notes so the reviewer knows the old file
  is being superseded, not added alongside.
- **A map exists and already covers the requested language →** it's a duplicate.
  It should not have been `ready-for-agent`; flag it and stop.

Then **invoke the gemara-map skill in-context** with the ref — do not
re-implement its fetch/segment/template pipeline; that logic lives in gemara-map
and will drift if copied. In Claude Code that means running the gemara-map skill
(e.g. `/gemara-map <ref>`) and letting it write its artifact(s) to its workspace.

**Multi-daf fan-out:** gemara-map emits **one file per daf**. A range request
("Megillah 26–29") therefore yields N artifacts from one issue. Carry all N
forward. The publication side opens **one PR per daf**, each referencing this one
issue (see Step 6); the issue closes only when the *last* of them merges.

### Step 4 — Map Feedback → edit the existing map in place

The existing published HTML is your **base**; the curated issue + comments are
the **change spec**. "Served verbatim" (ADR 0004) means the site serves the file
byte-for-byte — it does **not** mean the file is frozen. Editing and
re-committing it is exactly the intended flow.

1. **Locate the existing map** for `ref` (and `languageVariant` if given). If no
   map exists at that ref, stop and report — feedback on a nonexistent map means
   the issue was mislabeled.
2. **Fetch the source from Sefaria for grounding**, even for small edits — it
   gives you the authoritative text as context and costs little:
   ```bash
   python3 ~/.claude/skills/gemara-map/scripts/fetch_sugya.py "<ref>" \
     --segment --context --out /tmp/chazarah-fulfill-<n>.json
   ```
3. **Apply the change** anchored by `nodeOrQuote` + `observation` + your
   comments. This ranges from a one-word text fix to remapping part of a diagram.
   The reporter's feedback is trusted as the *intent* (that's why you approved
   it) — you are applying it, not re-litigating it.
4. **Discrepancy handling (advisory, not a veto).** If the fetched source
   *contradicts* the reporter's claim, **point it out** — surface it in your run
   output and in the handoff notes for the PR description — rather than silently
   applying it or hard-refusing. The human stays the judge; your job is to make
   the conflict visible.

### Faithfulness / IP invariants (load-bearing — both branches)

These are not style preferences; the site's IP posture rests on them (ADR 0005,
ADR 0006). When generating or editing:

- The **Hebrew side** is LLM-authored from the public-domain Aramaic. **Never**
  copy or introduce Sefaria's William Davidson English onto the Hebrew side.
- The **English side** uses Davidson **directly** (it is a CC-BY-NC convenience
  layer, attributed in the per-map footer — not the owner's IP).
- Map **only** the fetched Sefaria text. Do not add Rashi, Tosafot, Steinsaltz
  explanations, or "how the sugya usually goes" unless the issue explicitly asks.

### Step 5 — Mark the issue in-flight

Once you have produced/edited the artifact(s), drop the ready label so the bare
queue listing and any re-run don't re-surface work already in progress:

```bash
gh issue edit <n> --repo dnissimi/chazarah-submissions \
  --remove-label ready-for-agent
```

(Do **not** close the issue — closing happens downstream on PR merge, via the
publication layer's merge Action. See the spec's "Cross-repo issue lifecycle".)

### Step 6 — Hand off to the publication skill

Offer to run the publication skill (skill 3) rather than wiring the site
yourself. Hand it this payload (pin this shape; it's the contract):

```
{ kind: "new" | "edit",
  artifacts: [<path>, ...],               // N>1 for a multi-daf range
  sourceIssue: "dnissimi/chazarah-submissions#<n>",
  refs: [<sefaria-ref>, ...],
  notes: "<discrepancy flags / 'replaces existing file' warnings, if any>" }
```

Also tell skill 3 to stamp `Fulfills: dnissimi/chazarah-submissions#<n>` into
each PR body — that trailer is what lets the merge Action close this issue later
(cross-repo `Closes` keywords do not fire). After skill 3 opens the PR(s), make
sure the PR URL(s) are commented back onto the submission issue:

```bash
gh issue comment <n> --repo dnissimi/chazarah-submissions \
  --body "Fulfilled in <PR-url(s)>."
```

**If the publication skill does not exist yet:** stop here. Report the handoff
payload, the artifact path(s), and any discrepancy notes, and point the owner at
`docs/specs/map-wiring.md` to wire the map(s) manually for now. Do not attempt
the wiring inside this skill — that's a deliberate boundary, and doing it here
would duplicate logic that belongs in skill 3.

## Quick reference — end-to-end

1. Load issue (`gh issue view`), confirm `ready-for-agent`, parse JSON block,
   check `schemaVersion`, read comments.
2. Branch on `kind`.
3. **Request:** existing-map sub-check → invoke gemara-map → carry N artifacts.
4. **Feedback:** locate map → fetch source for grounding → apply curated edit →
   flag any source/claim discrepancy.
5. Drop `ready-for-agent` (mark in-flight; do not close).
6. Hand off to skill 3 with the payload + `Fulfills:` trailer; comment PR links
   back. If skill 3 is absent, stop and report for manual wiring.
