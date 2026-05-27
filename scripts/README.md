# scripts/

One-off build-time helpers. Each script is a standalone `tsx`-runnable
TypeScript file; tests for any pure helpers live alongside as
`*.test.ts`.

## `snapshot-sefaria-taxonomy.ts`

Fetches Sefaria's full corpus → book index from
`https://www.sefaria.org/api/index/`, flattens it into a normalised
shape, validates with Zod, and writes
`src/data/sefaria-taxonomy.json`.

The output drives the (future) cascading-dropdown UI on `/request`
(Sefaria integration is hybrid per PRD 0001: taxonomy is snapshotted
at build time; name resolution is live from the browser).

**Run:**

```sh
pnpm snapshot:sefaria
# or:
npm run snapshot:sefaria
```

**Refresh cadence:** manual. Sefaria's taxonomy is stable enough that a
quarterly refresh is fine. A GitHub Action that runs this on a cron is
out of scope for the slice that introduced the script — when added, it
should open a PR rather than committing to `main`.

**Network:** the script makes one live HTTPS call to sefaria.org.
Tests use an in-memory fixture and never touch the network.
