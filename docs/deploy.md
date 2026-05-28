# Deploy

How [[Chazarah]] is hosted, and the manual steps to reproduce from scratch.

## Production hosting

- **Static site + submission Worker**: Cloudflare Pages (project name: `chazarah`, account: dnissimi)
- **Production URL**: `https://chazarah.pages.dev` (custom domain TBD)
- **Production branch**: `main` (auto-deploy on push)
- **Preview deploys**: enabled for every PR

Per [ADR 0003](./adr/0003-astro-cloudflare-stack.md), the entire site (static
pages + the submission endpoint) ships under one Cloudflare Pages project.
The submission endpoint is an Astro endpoint compiled to a Worker by the
Cloudflare adapter — no separate Worker project.

## One-time setup (the human steps)

This is what was done once to wire up the project. Re-do these only if
recreating the deployment from scratch.

### Cloudflare side

1. Sign in to https://dash.cloudflare.com/
2. Workers & Pages → **Create application** → **Pages** → **Connect to Git**
3. Authorize Cloudflare's GitHub app on the `dnissimi` GitHub account if not
   already authorized.
4. Select repo `dnissimi/chazarah`. Production branch: `main`.
5. **Build settings:**
   - Framework preset: **Astro**
   - Build command: `pnpm build` (or `npm run build` if pnpm isn't used)
   - Build output directory: `dist`
   - Root directory: `/`
   - Node.js version: 22
6. **Environment variables** (production + preview):
   - For slice 1 (skeleton): none.
   - For slice 11 (submission Worker): set in the next section.
7. Click **Save and Deploy**. The first deploy will build whatever is on
   `main` at that moment.

### GitHub integration

Once step 4 completes, every push to `main` auto-deploys, and every PR
gets a preview URL posted as a PR comment.

### Secrets for the submission Worker (slice 11, not slice 1)

Required once slice 11 lands. Configure in Pages → project → Settings →
Environment variables → **Encrypt** (production and preview):

- `TURNSTILE_SECRET` — Cloudflare Turnstile secret key (paired with a
  sitekey baked into the site at build time)
- `GITHUB_TOKEN` — fine-grained PAT with `issues: read+write` on
  `dnissimi/chazarah-submissions` only

And bind a KV namespace:
- Pages → project → Settings → Functions → KV namespace bindings
- Create namespace `chazarah-rate-limit`, bind it as `RATE_LIMIT_KV`

## Labels required on `chazarah-submissions`

The submission Worker creates issues with these labels. They must exist on
`dnissimi/chazarah-submissions` (private) before the first submission:

- `map-request` — visitor asking for a passage to be mapped
- `map-feedback` — visitor reporting an issue with an existing map
- `needs-triage` — applied to every new submission by default
- (later, manually applied during triage) `ready-for-fulfill`, `wontfix`

A one-liner to create them:
```
for L in map-request map-feedback needs-triage; do
  gh label create "$L" --repo dnissimi/chazarah-submissions --force
done
```

## Notes

- The first deploy of the bare repo (before slice 2 / Astro skeleton lands)
  will **fail** the build step. That's expected. Once the skeleton PR
  merges, the next auto-deploy succeeds.
- PR previews are visible to anyone with the URL. Don't leak preview URLs
  for PRs that contain unreleased Chazarah Maps.
- No custom domain in v0. When ready, add via Pages → project → Custom
  domains.

## Provisioned state (as of 2026-05-28)

All Cloudflare config below was set on the **Production** environment of the
`chazarah` Pages project via `wrangler` / the CF REST API (token in
`~/.config/chazarah/cloudflare.env`):

- **Turnstile widget** "Chazarah" — sitekey `0x4AAAAAADX9O3p4b0EOP_sF`
  (public), domains `hazara.co.il` + `chazarah.pages.dev`, mode Managed.
  Secret set as `TURNSTILE_SECRET`.
- **KV namespace** `chazarah-rate-limit` (`aa769d0c34644e8981a1d81c6f525e00`)
  bound as `RATE_LIMIT_KV`.
- Env vars on Production: `PUBLIC_TURNSTILE_SITEKEY`, `TURNSTILE_SECRET`,
  `GITHUB_TOKEN`, `NODE_VERSION`.

The custom domain `hazara.co.il` is live and serves Production.

## Follow-ups

- [ ] **Swap `GITHUB_TOKEN` to a fine-grained PAT.** It currently holds the
  owner's broad `gh` CLI token (full `repo` scope across all repos) as a
  stopgap. Before publicizing the site, replace it with a fine-grained PAT
  scoped to **Issues: Read and write on `chazarah-submissions` only**:
  ```
  source ~/.config/chazarah/cloudflare.env
  printf '%s' '<fine-grained-pat>' | wrangler pages secret put GITHUB_TOKEN --project-name chazarah
  ```
  Then trigger a redeploy. Limits blast radius if the worker secret ever leaks.
