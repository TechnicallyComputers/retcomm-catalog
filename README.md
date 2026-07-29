# RetComM Catalog

Official title catalog for [RetComM Launcher](https://github.com/TechnicallyComputers/RetComM-Launcher).

JSON manifests listing supported recomp/decomp titles, ROM/BIOS identity, and
GitHub release asset patterns. The launcher downloads this catalog independently
of app updates.

## Layout

```
index.json          # title id list + platform BIOS defaults
titles/<id>.json    # one manifest per title
SCHEMA.md           # field documentation
submit/             # GitHub Pages submission form
worker/             # Cloudflare Worker (OAuth, probe, email, issues)
docs/SUBMIT_SETUP.md
```

## Propose a title

Use the [submission form](https://technicallycomputers.github.io/retcomm-catalog/submit/)
(GitHub login required). It probes the source repo for digests/release assets,
lets you complete or override fields, then opens an approval issue and emails
human contributors listed in [`submit/contributors.json`](submit/contributors.json)
(plus repo collaborators). Setup notes: [docs/SUBMIT_SETUP.md](docs/SUBMIT_SETUP.md).

Ban abusers via [`submit/banned-users.json`](submit/banned-users.json).

## Releases

Tag `v*` (or run **Publish catalog**) to build `catalog.zip` and attach it to a
GitHub Release. RetComM fetches:

`https://github.com/TechnicallyComputers/retcomm-catalog/releases/latest/download/catalog.zip`

## Local check

```sh
python3 -c "import json; json.load(open('index.json'))"
for f in titles/*.json; do python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$f"; done
```
