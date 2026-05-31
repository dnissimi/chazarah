---
name: chazarah-publish
description: >-
  Wire a gemara-map HTML artifact into the Chazarah site and push it live: read
  the map's gemara-map: <head> metadata, place the file verbatim under
  public/maps, write the content-collection YAML, register a new masechet if
  needed, validate, then commit + push to main (Cloudflare auto-deploys to
  hazara.co.il). Use this whenever the user wants to publish, deploy, wire in,
  or "put on the site" a Chazarah Map / sugya map / gemara-map output, says
  "/chazarah-publish", "publish this map", "deploy it to hazara.co.il", or has
  just generated/edited a map (with gemara-map or chazarah-fulfill) and wants it
  live. This is the shared publication step both gemara-map (standalone) and
  chazarah-fulfill hand off to. It does NOT generate or edit map content (that's
  gemara-map / chazarah-fulfill) and does NOT triage submissions.
---

# Chazarah Publish

Take a finished [[Chazarah Map]] artifact (one self-contained bilingual HTML
file per daf, carrying a `gemara-map:` `<head>` metadata block) and get it onto
the site: place the file(s), write the content-collection entry, register the
masechet if it's new, validate, commit on `main`, and push. This is the third
of three skills — see `/Users/dnissimi/PycharmProjects/chazarah/docs/specs/chazarah-publish.md`
for the design rationale and `docs/specs/map-wiring.md` for the manual procedure
this automates.

## Where this skill sits (and what it is NOT)

1. **gemara-map** — generates a map from a Sefaria ref.
2. **chazarah-fulfill** — processes a submission issue → produces/edits a map.
3. **chazarah-publish** *(this skill)* — the shared "get it onto the site" step,
   invoked by **both** of the above (and runnable directly).

This skill does **not** generate or edit map content, and does **not** triage.
It only moves a finished artifact into the repo and pushes it live. The map is
placed **byte-for-byte** (ADR 0004) — never transform or "clean up" the HTML.

**No PR, no review branch, no merge ceremony.** Chazarah is a solo project; the
local typecheck / build / test suite is the gate, and Cloudflare Pages
auto-deploys `main` (~1 min). chazarah-publish is invoked only after the
operator has already decided to publish (they generated or curated the artifact
upstream). If something is wrong after publish, `git revert <sha> && git push`
rolls it back in another minute.

## Repos and where things go

- **Site repo (write + push to main):** `dnissimi/chazarah`, working dir
  `/Users/dnissimi/PycharmProjects/chazarah`. Run from this directory.
- **Submissions repo (close issue on success):** private `dnissimi/chazarah-submissions`
  — touched only when an `--issue` is supplied. The local `gh` auth must have
  Issues:write on it.
- The map artifact lives in the gemara-map workspace, which gemara-map writes
  cwd-relative: `./gemara-map-workspace/<range>/sugya_<book>_<daf>.html`. Run
  from the chazarah working dir, so artifacts land at
  `chazarah/gemara-map-workspace/...` (gitignored).

## Invocation

```
/chazarah-publish <artifact.html> [<artifact2.html> ...] \
    [--issue dnissimi/chazarah-submissions#<n>] [--notes "..."]
```

- **One commit per artifact** (per daf) — matches the chazarah-fulfill fan-out
  decision so a multi-daf range produces clean, independently-revertable history.
- `--issue` / `--notes` come from a chazarah-fulfill handoff; omit them for a
  standalone gemara-map publish.
- Bare `/chazarah-publish` (no path): list recent artifacts under
  `./gemara-map-workspace/` (relative to the chazarah working dir) and ask
  which to publish.

## The bundled scripts (use them — don't hand-parse)

- `scripts/extract_metadata.py <html>` → JSON of the `gemara-map:` fields
  (corpus, book, location, languages, sefariaRef, …). Add `--yaml [--updated DATE]`
  to emit the content-collection entry directly, in the exact shape
  `src/content/config.ts` validates. It fails loud if required metadata is
  missing (an artifact predating the metadata block).
- `scripts/masechet_info.py <corpus> <book>` → a ready-to-paste `MASECHTOT`
  entry (he/en name from the taxonomy snapshot, `lastDaf = ceil(lengths[0]/2)`
  from Sefaria's index API, `firstDaf 2`, summary filled). Use `--last-daf <N>`
  if offline.

## Workflow (per artifact)

### Step 1 — Read the metadata

```bash
python3 <skill>/scripts/extract_metadata.py <artifact.html>
```

Capture `corpus`, `book`, `location`, and `languages` (e.g. `["he","en"]`).
These drive every path below. If the script errors on missing metadata, stop —
the artifact isn't publishable as-is (regenerate it with the current gemara-map,
or fill the `<head>` block by hand).

### Step 2 — Place the map verbatim (per language)

A bilingual map is **one authored file** that serves both `/he` and `/en` (the
file's JS defaults the language from the URL's trailing segment). We materialize
it as one file **per language** so the existing `_redirects` rule
(`/map/:corpus/:book/:location/:lang → /maps/:corpus/:book/:location/:lang.html`)
keeps working unchanged and uniformly with the legacy he-only maps. So for each
language in `languages`, copy the artifact **unmodified**:

```bash
mkdir -p public/maps/<corpus>/<book>/<location>
cp <artifact.html> public/maps/<corpus>/<book>/<location>/he.html
cp <artifact.html> public/maps/<corpus>/<book>/<location>/en.html   # if "en" in languages
```

(The two copies are byte-identical; the difference in default language is purely
the URL the file is served at. Don't edit either copy.) For a he-only artifact,
write only `he.html`.

**Replacement vs new:** if the target files already exist, this is a replacement
(a chazarah-fulfill edit, or a he-only→bilingual upgrade per ADR 0006). Overwrite
them and note "replaces existing file" in the commit message body and (if
`--issue`) the closing comment, so the trail records the supersedure.

### Step 3 — Write the content-collection entry

```bash
python3 <skill>/scripts/extract_metadata.py <artifact.html> --yaml --updated <today> \
  > src/content/maps/<corpus>/<book>/<location>.yaml
```

`languages` in the YAML now means "languages this file contains" (ADR 0006), and
is taken straight from the metadata. One YAML per logical map (not per language).

### Step 4 — Register the masechet (only if new)

Check whether the book is already in `MASECHTOT` (`src/lib/browse.ts`):

```bash
grep -q "book: '<book>'" src/lib/browse.ts && echo "exists" || echo "NEW"
```

If it exists, do nothing. If new, derive and insert an entry:

```bash
python3 <skill>/scripts/masechet_info.py <corpus> <book>
```

Paste the printed object into the `MASECHTOT` array in `src/lib/browse.ts`
(keep the array's ordering sensible). This is rare — only the first daf of a
brand-new tractate triggers it.

### Step 5 — Validate locally

Run the project's checks so the content-collection schema and types are verified
**before** the push (a bad YAML or an unregistered masechet fails here, not on
the live site):

```bash
npm run typecheck   # astro check — types + content-collection schema
npm run build       # astro build — full build incl. content validation
npm test            # vitest — browse.ts / submission unit tests
```

Fix any schema/type errors (usually a malformed YAML value) and re-run until
clean. The Map Info Page is SSR, so a new entry needs no per-daf route.

### Step 6 — Commit and push (direct to main)

The local validation is the gate. There is no PR.

```bash
git checkout main && git pull --ff-only         # make sure we're current
git add public/maps/<corpus>/<book>/<location>/ \
        src/content/maps/<corpus>/<book>/<location>.yaml \
        src/lib/browse.ts                       # only if a masechet was added
git commit -m "Publish <Book> <location> map"   # add a 'replaces existing file' line in the body if applicable
git push
```

The push goes straight to `main`. Cloudflare Pages builds and deploys `main` on
every push — the daf is live at `https://hazara.co.il/map/<corpus>/<book>/<location>`
within ~1 minute. If something is wrong post-publish:
`git revert <sha> && git push` rolls back in another minute.

Stage **only** the publish files. Never `git add -A` (it could sweep up unrelated
working-tree changes). Never push to anything other than `main`, and never
force-push.

### Step 7 — Close the submission issue (only with `--issue`)

After the push lands — and, for a multi-daf set, **after the last artifact in
the set has been pushed** — close the originating issue directly:

```bash
LIVE=https://hazara.co.il/map/<corpus>/<book>/<location>
gh issue close <n> --repo dnissimi/chazarah-submissions \
  --comment "Published — live at $LIVE."
```

For a multi-daf range, comment the **set** of live URLs and close the issue
**once**. (chazarah-fulfill already dropped `ready-for-agent` when it picked the
issue up, so no other label state to clean up.)

## Out of scope (explicitly)

- **Generating or editing map content** — gemara-map / chazarah-fulfill.
- **Triage** — upstream.
- **Pull requests / review process** — by design. Chazarah is solo; the gates
  are local (typecheck / build / tests). Cloudflare main-deploys directly. If
  you ever want a review step back, branch + open a PR by hand on that one.

## Quick reference (per artifact)

1. `extract_metadata.py` → corpus / book / location / languages.
2. `cp` the artifact verbatim → `public/maps/<corpus>/<book>/<location>/<lang>.html`
   for each language.
3. `extract_metadata.py --yaml` → `src/content/maps/<corpus>/<book>/<location>.yaml`.
4. If the book is new in `MASECHTOT`: `masechet_info.py` → paste into `browse.ts`.
5. `npm run typecheck && npm run build && npm test` (until clean).
6. `git add` the publish files only → commit → `git push` to `main`. Cloudflare
   deploys (~1 min); rollback = `git revert && git push`.
7. With `--issue` (once, after the last artifact of the set):
   `gh issue close <n>` with a comment of the live URL(s).
