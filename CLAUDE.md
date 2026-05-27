# Chazarah

Umbrella site (Hebrew: *חזרה*, "review") for visual study aids of Torah
literature. First product: **Chazarah Map** — color-coded sugya flowcharts.
See `CONTEXT.md` for the glossary and `docs/adr/` for architectural decisions.

## Agent skills

### Issue tracker

GitHub issues. The public site lives in the (future) Chazarah repo; visitor
submissions live as issues in a separate private `chazarah-submissions` repo
per [ADR 0001](docs/adr/0001-submissions-as-github-issues.md). See
[docs/agents/issue-tracker.md](docs/agents/issue-tracker.md).

### Triage labels

Default vocabulary — `needs-triage`, `needs-info`, `ready-for-agent`,
`ready-for-human`, `wontfix`. See [docs/agents/triage-labels.md](docs/agents/triage-labels.md).

### Domain docs

Single-context. `CONTEXT.md` and `docs/adr/` live at the repo root. See
[docs/agents/domain.md](docs/agents/domain.md).
