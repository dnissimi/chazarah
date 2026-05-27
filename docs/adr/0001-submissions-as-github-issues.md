# ADR 0001 — Submissions are stored as GitHub issues in a private repo

- Status: Accepted
- Date: 2026-05-26

## Context

[[Chazarah]] is a mostly-static site (pre-generated [[Chazarah Map]] HTML files,
committed to the source repo). The dynamic part is contributions: visitors can
file a [[Map Request]] for a passage we haven't mapped, or [[Map Feedback]] on a
map that's already published. Each contribution lands in the owner's review
queue; the owner reviews, approves, and (on approval) kicks off a Claude Code
session that either generates a new map or revises an existing one.

We had to decide *where submissions live*: in a database with a custom admin
UI, in GitHub as issues, in email, or in a queue our local machine polls.

## Decision

Submissions are stored as **issues in a private GitHub repository**
(`chazarah-submissions` — separate from the public source repo). The public
site's submission form posts to a small serverless function (one route on the
site's host), which validates the payload and opens an issue with structured
labels (`map-request` or `map-feedback`) and a body templated for downstream
parsing.

The "admin panel" is two surfaces, not one:

1. A thin authenticated web page on the Chazarah site that lists open
   submission issues and exposes action buttons (approve, reject, archive).
2. A Claude Code slash command, `/chazarah-fulfill <issue-url>`, that pulls
   the issue, decides whether it's a request or feedback, and runs the right
   downstream skill (`/gemara-map` for a request; a revision flow for
   feedback), ending in a pull request against the public source repo.

The site stays static. The function is stateless. GitHub is the source of
truth for submission state.

## Consequences

**Good**
- Zero database to operate, back up, migrate, or pay for.
- Notifications, history, search, comments, and labels come from GitHub for
  free.
- The "review and approve" loop reuses muscle memory the owner already has
  (triaging issues).
- The handoff into Claude Code is natural: an issue URL is a self-contained,
  shareable input to a slash command.
- The public-facing contract (the submission form) is independent of where
  submissions are stored, so a future migration to a real DB does not change
  what the site does.

**Bad / accepted trade-offs**
- The submission schema is encoded in issue body templates and label
  conventions rather than a typed DB schema. Drift is possible; we mitigate
  by treating the body as machine-parseable (frontmatter or JSON block).
- Anything that needs cross-submission queries (analytics, dashboards,
  duplicate detection at scale) is awkward over the GitHub API and would
  push us toward option B.
- Rate limits on the GitHub API and unauthenticated abuse of the form are
  real failure modes; we'll need a simple captcha/turnstile on the form and
  per-IP throttling in the serverless function.

## Alternatives considered

- **Real DB (Supabase/Postgres) + custom admin UI.** More flexible long-term;
  rejected because it costs weeks of infrastructure work before the first map
  ships, and we don't yet have the submission volume to justify it. Easy to
  graduate to later.
- **Email / Formspree only.** Cheapest, but no structured status tracking and
  no clean way to launch Claude Code from a clipboard. Acceptable for a v0
  prototype, not for the system we want to live with.
- **Local-only queue our laptop polls.** Clever but fragile: nothing moves
  while the laptop is asleep, and the queue infra is the same work as the
  chosen option.
