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
(plus repo collaborators). Maintainers add the **`approved`** label to merge the
title and publish a new `catalog.zip`. Setup notes:
[docs/SUBMIT_SETUP.md](docs/SUBMIT_SETUP.md).

If you have a bulk submission request or a submission request that is not maintained on GH and isn't compatible with the tool, please contact us directly, or open an issue on this repo, and we can make arrangements to have it added manually somehow.

Ban abusers via [`submit/banned-users.json`](submit/banned-users.json).

## Releases

Catalog releases use **date/time tags** (`vYYYY.MM.DD.HHMMSS…`). Approving a
submission or tagging `v*` / running **Publish catalog** stamps `catalog_date`
(UTC ISO-8601) + `release_tag` into `index.json`, packs `catalog.zip`, and
publishes a GitHub Release (not a draft). RetComM checks that release identity /
stamp on startup and downloads the zip only when the remote catalog is newer:

`https://github.com/TechnicallyComputers/retcomm-catalog/releases/latest/download/catalog.zip`

## Local check

```sh
python3 -c "import json; json.load(open('index.json'))"
for f in titles/*.json; do python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$f"; done
```
