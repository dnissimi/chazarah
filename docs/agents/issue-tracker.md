# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Two repos, two roles

Chazarah uses **two** GitHub repos with different purposes (see [ADR 0001](../adr/0001-submissions-as-github-issues.md)):

- **The site repo** (this one, when initialized) — engineering work: feature
  tickets, bugs, PRDs, ADRs. This is what `gh` operates on by default when run
  inside a clone.
- **`chazarah-submissions`** (separate, private) — visitor submissions ([[Map
  Request]] and [[Map Feedback]]). The public site's submission Worker opens
  issues here; the owner triages here. To target it explicitly:
  `gh issue list --repo <owner>/chazarah-submissions ...`.

When a skill says "publish to the issue tracker" without qualification, it
means the **site repo**. Submissions are a separate flow and only
`/chazarah-fulfill` should touch the submissions repo.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

## When a skill says "publish to the issue tracker"

Create a GitHub issue in the **site repo**.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments` against the site repo, unless the
ticket reference makes it clear it's in `chazarah-submissions`.
