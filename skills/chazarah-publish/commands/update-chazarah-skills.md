---
description: Pull the latest version of dnissimi/chazarah from GitHub. Re-installs the gemara-map, chazarah-fulfill, and chazarah-publish skills to the latest commit on main, scoped only to this repo (other globally-installed skills are not touched).
argument-hint: (no arguments)
---

Run the following command to pull the latest version of the `dnissimi/chazarah` skills specifically:

```bash
npx skills@latest add dnissimi/chazarah -g -y
```

This is scoped to our repo only — unlike `update -g`, which would re-check every other globally-installed skill (slow, surfaces unrelated errors from skills owned by other authors). `add` is idempotent: if our skills are already at the latest commit, it's effectively a no-op; if there's a new commit on `main`, it re-fetches and re-installs.

After it completes:
- If skills were updated, briefly summarize what changed (the command usually lists updated skills with their new git SHAs).
- If nothing was updated, say so plainly ("Already up to date.").
- If the command fails, surface the error verbatim and check:
  - GitHub auth: `gh auth status` (the repo `dnissimi/chazarah` is private — the active git credential must have access).
  - Lockfile presence: `ls ~/.agents/.skill-lock.json` (the installer tracks installed git SHAs here).
  - npm reachability: `npx skills@latest --version` should print a version number.

Do NOT attempt to upgrade by manually copying files from the source repo — let `npx skills add` handle it so the install path stays consistent.
