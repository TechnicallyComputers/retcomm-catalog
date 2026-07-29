# Catalog submission form

Static GitHub Pages app for proposing new `titles/<id>.json` entries.

**Live URL (after Pages is enabled):**  
https://technicallycomputers.github.io/retcomm-catalog/submit/

## What it does

1. Requires **GitHub login** (OAuth via Cloudflare Worker)
2. Probes a public recomp/decomp repo (README, `DISC.md`, latest release assets)
3. Auto-fills a catalog manifest; submitter can edit every field
4. Optional **client-side** ROM hashing (file never uploaded)
5. On submit:
   - Opens a GitHub issue (label `catalog-submission`) assigned to human contributors
   - Emails addresses from [`contributors.json`](./contributors.json) (Resend)
6. Abusers can be blocked by adding their GitHub login to [`banned-users.json`](./banned-users.json)

Keep [`contributors.json`](./contributors.json) updated when people join; fill each
`email` for Resend delivery.

## One-time setup

See [../docs/SUBMIT_SETUP.md](../docs/SUBMIT_SETUP.md) for OAuth App, Worker secrets, Resend, and Pages enablement.

After the Worker is deployed, set its URL in [`config.js`](./config.js):

```js
API_BASE: "https://retcomm-catalog-submit.<your-subdomain>.workers.dev",
```
