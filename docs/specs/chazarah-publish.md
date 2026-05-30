# Spec: the `chazarah-publish` skill

Scoped + built 2026-05-29; PR/merge mechanics dropped 2026-05-30 (see below).
The third of three skills (see [chazarah-fulfill.md](./chazarah-fulfill.md) for
the architecture). Automates the manual procedure captured in
[map-wiring.md](./map-wiring.md) — now that `gemara-map` emits a self-describing
bilingual artifact, publishing is turnkey.

The skill lives at `~/.claude/skills/chazarah-publish/`.

## What it does

Input: one or more finished map artifacts (one self-contained bilingual HTML per
daf, each carrying a `gemara-map:` `<head>` metadata block), optionally with a
`--issue <repo#n>` / `--notes` handoff from `chazarah-fulfill`.

Per artifact (one commit each):

1. **Read metadata** — `scripts/extract_metadata.py` parses the `gemara-map:`
   block → `corpus, book, location, languages, title{he,en}, blurb{he,en},
   topic{he,en}, sefariaRef, sugyaCount`. Fails loud if required fields are
   missing.
2. **Place verbatim** — copy the artifact (byte-for-byte, ADR 0004) to
   `public/maps/<corpus>/<book>/<location>/<lang>.html` for each language.
3. **Write the content entry** — `extract_metadata.py --yaml` →
   `src/content/maps/<corpus>/<book>/<location>.yaml`, in the `config.ts` shape.
4. **Register a new masechet** — only if the book isn't already in `MASECHTOT`;
   `scripts/masechet_info.py` derives the entry.
5. **Validate** — `npm run typecheck && npm run build && npm test`.
6. **Commit + push to `main`** — direct. Cloudflare Pages auto-deploys main on
   every push → live at `https://hazara.co.il/map/<corpus>/<book>/<location>`
   within ~1 minute. Rollback = `git revert && git push`.
7. **Close the submission issue** — with `--issue`, after the last artifact in
   the set has been pushed: `gh issue close <n>` with a comment listing the
   live URL(s). The skill closes the issue directly; no PR, no merge Action.

It does NOT generate/edit map content (gemara-map / chazarah-fulfill) and does
NOT triage.

## Decisions

### Bilingual files — per-language materialization (2026-05-29)

The single authored bilingual artifact is written as one **byte-identical** file
per language (`he.html` **and** `en.html`), keeping the existing one-to-one
`_redirects` rule and uniformity with the 8 legacy he-only maps. Behavior equals
ADR 0006's "one file answers both /he and /en" (the file's JS defaults language
from the URL leaf); it's just materialized per language on disk. See the
implementation note appended to [ADR 0006](../adr/0006-bilingual-map-files-and-per-variant-language-policy.md).

### Masechet config — derived, not hand-maintained (2026-05-29)

`MASECHTOT` (`src/lib/browse.ts`) entries are derived: he/en name from the
offline `src/data/sefaria-taxonomy.json` snapshot; `lastDaf = ceil(lengths[0]/2)`
from Sefaria's index API (verified exact across 18 tractates); `firstDaf = 2`.
Only the first daf of a brand-new tractate triggers this; adding a daf to an
existing tractate needs no `MASECHTOT` change.

### Direct-to-main publish, no PR (2026-05-30 — supersedes the original "PR + preview" design)

Chazarah is a solo project. The operator has already decided to publish by the
time chazarah-publish is invoked — they generated the artifact upstream
(gemara-map) or curated the edit (chazarah-fulfill) and inspected the result
locally. A PR adds bureaucracy without adding eyes. So:

- The **local typecheck / build / tests are the gate**. The skill refuses to
  push if any of them fail.
- On pass, the skill **commits on `main` and pushes**. Cloudflare deploys.
- Rollback is one revert + push (also ~1 min) — equally cheap.
- With `--issue`, the skill **closes the submission issue itself** after the
  last artifact in the set is pushed. No `Fulfills:` trailer, no merge Action,
  no `SUBMISSIONS_TOKEN` secret to configure.

The first Chullin 27 publish (PR #16, merged manually) was the only publish run
under the original PR-based model; all subsequent publishes follow this rule.

## Notes / dependencies

- `map-metadata.ts` (the old build-#6 extractor) is **superseded** by
  `scripts/extract_metadata.py` and is otherwise dead (test-only, stale on the
  old `chazarah:` namespace). Safe to retire in a cleanup commit.
- `gemara-map` should gain a small "offer to run chazarah-publish" hook at the
  end of a standalone run (owner-side change to that skill).
- The artifact's report-a-correction pill iframes the site's `/feedback?ref=…`;
  that base URL is set at *generation* time (gemara-map), so publish just places
  the file — no injection here.
