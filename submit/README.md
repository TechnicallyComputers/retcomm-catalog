# Catalog submission form

Static GitHub Pages app for proposing new `titles/<id>.json` entries.

**Live URL (after Pages is enabled):**  
https://technicallycomputers.github.io/retcomm-catalog/submit/

## What it does

1. Requires **GitHub login** (OAuth via Cloudflare Worker)
2. Probes a public recomp/decomp repo (README, `DISC.md`, `game.toml`, latest release assets)
3. Auto-fills a catalog manifest (including PSX `track_counts` / `require_cue` from `[netplay]`); submitter can edit every field
4. **Required** client-side ROM hashing under “Rom Checksum Submission” (file never uploaded; submit blocked until digests are generated). PSX: drop the `.cue` first (fills `track_counts` + expected Track&nbsp;01 name), then hash that first BINARY `.bin`. `.iso` / `.chd` are rejected
5. On submit:
   - Opens a GitHub issue (label `catalog-submission`) assigned to human contributors
   - Emails addresses from [`contributors.json`](./contributors.json) (Resend)
6. A maintainer adds label **`approved`** → CI merges the title, updates
   `index.json`, and publishes a new `catalog.zip` release
7. Abusers can be blocked by adding their GitHub login to [`banned-users.json`](./banned-users.json)

Keep [`contributors.json`](./contributors.json) updated when people join; fill each
`email` for Resend delivery.

## One-time setup

See [../docs/SUBMIT_SETUP.md](../docs/SUBMIT_SETUP.md) for OAuth App, Worker secrets, Resend, and Pages enablement.

After the Worker is deployed, set its URL in [`config.js`](./config.js):

```js
API_BASE: "https://retcomm-catalog-submit.<your-subdomain>.workers.dev",
```
