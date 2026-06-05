# Chazarah · חזרה

A non-commercial, bilingual (Hebrew/English) website that hosts a growing
library of **Chazarah Maps** — color-coded flowcharts of Talmudic sugyot
(extensible to other Sefaria corpora) — alongside the original text and clear
translations.

**Live at [hazara.co.il](https://hazara.co.il).**

The site is the *bookstore*; each map is a self-contained *book*.

## Repository layout

- [`src/`](./src/) — the Astro application: pages/routes, components, the
  `maps` content collection, i18n strings, and pure libs (browse/library/map
  helpers, submission validation).
- [`public/`](./public/) — static assets, incl. [`public/maps/`](./public/maps/)
  (the published, verbatim map files) and `public/_redirects` / `robots.txt`.
- [`skills/`](./skills/) — bundled Claude Code skills (see "Claude skills" below).
- [`CONTEXT.md`](./CONTEXT.md) — domain glossary (terms used everywhere)
- [`CLAUDE.md`](./CLAUDE.md) — entry point for agents working on this repo
- [`docs/adr/`](./docs/adr/) — architectural decision records
- [`docs/agents/`](./docs/agents/) — agent skill configuration (issue
  tracker, triage labels, domain docs)
- [`docs/prds/`](./docs/prds/) — product requirements docs
- [`docs/specs/`](./docs/specs/) — specs for the operational skills
- [`design/`](./design/) — design mockups and the Claude Design export the
  implementation was built from
- [`.claude-plugin/plugin.json`](./.claude-plugin/plugin.json) — Claude Code
  plugin manifest (registers the skills below)

## Claude skills

This repo doubles as a Claude Code skills package: three skills that, together,
take a Talmud reference all the way to a published map on the site.

| Skill | What it does |
|---|---|
| **`gemara-map`** | Generates a self-contained bilingual (HE/EN) flowchart HTML for one or more dapim from a Sefaria ref. Pure generator; knows nothing about the site. |
| **`chazarah-fulfill`** | Processes one approved (`ready-for-agent`) issue from the private `dnissimi/chazarah-submissions` queue → produces a new map (delegating to `gemara-map`) or edits an existing one in place, then hands off to `chazarah-publish`. |
| **`chazarah-publish`** | Wires a finished artifact onto the site: places `he.html` + `en.html` under `public/maps/`, writes the content-collection YAML, registers a new masechet if needed, validates locally, then commits + pushes to `main`. Cloudflare auto-deploys (~1 min). With `--issue`, closes the originating submission issue. |

See [`docs/specs/chazarah-publish.md`](./docs/specs/chazarah-publish.md) and
[`docs/specs/chazarah-fulfill.md`](./docs/specs/chazarah-fulfill.md) for the
design rationale.

### Install

Distributed via the [`skills`](https://www.npmjs.com/package/skills) CLI
([source](https://github.com/vercel-labs/skills)). The repo is private; the
installer uses your existing `gh` credentials — if you hit an auth error,
`gh auth status` and confirm access to `dnissimi/chazarah`.

```bash
# 1. Install all three skills globally for Claude Code
npx skills@latest add dnissimi/chazarah -g

# 2. Wire up the in-Claude /update-chazarah-skills slash command
#    macOS / Linux:
mkdir -p ~/.claude/commands
ln -sfn ~/.agents/skills/chazarah-publish/commands/update-chazarah-skills.md \
        ~/.claude/commands/update-chazarah-skills.md

#    Windows (Git Bash) — symlinks need admin rights, so copy instead:
mkdir -p ~/.claude/commands
cp ~/.agents/skills/chazarah-publish/commands/update-chazarah-skills.md \
   ~/.claude/commands/update-chazarah-skills.md
```

Step 1 installs each skill into `~/.agents/skills/<name>/`; Claude Code
auto-discovers them on the next session start. Step 2 makes the upgrade
slash command discoverable (Claude Code only scans `~/.claude/commands/`,
not the skill's own `commands/` subdirectory).

### Update

```bash
npx skills@latest update -g           # from a terminal
# — or, inside Claude Code, any session —
/update-chazarah-skills
```

Both run the same underlying command.

### Local development (skills)

`npx skills add` snapshots from GitHub into `~/.agents/skills/`; local edits to
the working tree are NOT reflected. For tight edit-test loops on the skills
themselves, use the bundled symlinker:

```bash
# First clear any prior install so the symlink can take its place:
rm -rf ~/.claude/skills/{gemara-map,chazarah-fulfill,chazarah-publish} \
       ~/.agents/skills/{gemara-map,chazarah-fulfill,chazarah-publish}
./scripts/link-skills.sh
```

This symlinks `~/.claude/skills/<name>/` directly to `skills/<name>/` in your
clone — edits are live in the next Claude session. Revert to the production
install with `rm ~/.claude/skills/{gemara-map,chazarah-fulfill,chazarah-publish}`
then `npx skills add dnissimi/chazarah -g`.

## Running the site locally

```bash
npm install
npm run dev         # local dev server
npm run typecheck   # astro check (types + content-collection schema)
npm run build       # full static/SSR build
npm test            # vitest unit tests
```

## Status

**Live.** The site is deployed on Cloudflare Pages at
[hazara.co.il](https://hazara.co.il), serving a growing map library across
Megillah, Shabbat, Chullin, and Bava Kamma (more added via the submission
pipeline above). Shipped:

- **Bilingual, separately-indexable URLs** — Hebrew at the root, English under
  `/en` — rendered server-side (real translated pages, not a client-side swap),
  with `hreflang`, canonical, Open Graph, JSON-LD, a generated `sitemap.xml`,
  and `robots.txt`.
- **Map pages** are the verbatim gemara-map files served *wrapped* with the
  site header (brand / nav / language switch) and per-language SEO, without
  altering the map file itself ([ADR 0004](./docs/adr/0004-maps-served-verbatim.md)).
- **In-map shape⇄citation cross-linking** — tap a chart shape to jump to its
  source, and back — working on mouse and touch.
- The submission → fulfill → publish skill pipeline described above.

## Stack

Astro on Cloudflare Pages (`output: 'hybrid'`), with a serverless `/api/submit`
endpoint and Cloudflare Turnstile for anti-spam; maps are Mermaid flowcharts in
self-contained HTML. See [ADR 0003](./docs/adr/0003-astro-cloudflare-stack.md).

## License

The site code is the owner's work. The underlying source text is fetched
from [Sefaria](https://www.sefaria.org). The site is non-commercial; see
[ADR 0005](./docs/adr/0005-non-commercial-and-attribution.md).
