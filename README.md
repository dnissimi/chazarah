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
- [`docs/specs/`](./docs/specs/) — specs for the operational skills
- [`design/`](./design/) — design mockups and the Claude Design export the
  implementation is being built from
- [`.claude-plugin/plugin.json`](./.claude-plugin/plugin.json) — Claude Code
  plugin manifest (registers the skills below)
- [`skills/`](./skills/) — bundled Claude Code skills (see "Claude skills" below)

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

### Local development

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
