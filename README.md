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
```

## Releases

Tag `v*` (or run **Publish catalog**) to build `catalog.zip` and attach it to a
GitHub Release. RetComM fetches:

`https://github.com/TechnicallyComputers/retcomm-catalog/releases/latest/download/catalog.zip`

## Local check

```sh
python3 -c "import json; json.load(open('index.json'))"
for f in titles/*.json; do python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$f"; done
```
