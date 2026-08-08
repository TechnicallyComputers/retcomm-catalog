# Catalog schema

RetComM ships a directory of JSON manifests. `index.json` lists title ids;
each `titles/<id>.json` describes one supported recomp/decomp.

## `index.json`

```json
{
  "schema_version": 1,
  "name": "RetComM supported titles",
  "catalog_date": "2026-07-29T18:41:00Z",
  "release_tag": "v2026.07.29.184100.12",
  "platform_defaults": {
    "gba": { "bios_identity": { "required": true, "crc32": ["81977335"], "…": "…" } },
    "psx": { "bios_identity": { "required": true, "crc32": ["37157331"], "…": "…" } }
  },
  "titles": ["metal-warriors-snes", "..."]
}
```

| Field | Type | Notes |
|---|---|---|
| `catalog_date` | string | UTC stamp from publish CI: `YYYY-MM-DDTHH:MM:SSZ` (preferred) or legacy `YYYY-MM-DD` |
| `release_tag` | string | GitHub release tag (e.g. `v2026.07.29.184100.12` = date + `HHMMSS` + issue) |
| `platform_defaults` | object | Optional per-platform defaults keyed by catalog `platform` |
| `platform_defaults.<platform>.bios_identity` | object | Applied to titles on that platform that omit `bios_identity` |

Title manifests may still set `bios_identity` to override the default, or
`"bios_identity": null` to opt out of inheritance.

## `titles/<id>.json`

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable slug; matches filename |
| `name` | string | Display name |
| `kind` | `"recomp"` \| `"decomp"` | |
| `platform` | string | `snes`, `psx`, `n64`, `gba`, … (RomM + folder map) |
| `description` | string | Optional short blurb |
| `homepage` | string | Optional URL (hub “GitHub Source”; defaults to `https://github.com/<release.github>`) |
| `author_notes` | string | Optional message from the recomp/decomp author to users; shown in the hub as **Author's Notes** (any length) |
| `notes` | string | Optional catalog/maintainer footnotes (identity sources, pins); not shown in the hub |
| `release.github` owner | — | Hub shows as Recomp/Decomp Author (owner segment of `owner/repo`) |
| `rom_identity` | object | How we know the user owns the game (always include every digest field) |
| `rom_identity.crc32` | string[] | Hex, e.g. `"f2ab92d4"` (empty `[]` if unused) |
| `rom_identity.md5` | string[] | 32-char lowercase hex (common in recomp README tables) |
| `rom_identity.sha1` | string[] | 40-char lowercase hex |
| `rom_identity.sha256` | string[] | 64-char lowercase hex |
| `rom_identity.disc_serials` | string[] | PSX/etc, e.g. `"SLUS-00562"` |
| `rom_identity.sizes` | number[] | Optional byte lengths; when set, scan only hashes files of those sizes (disc dumps) |
| `rom_identity.filenames` | string[] | Suggested basenames for the hub when unmatched (No-Intro / Redump); search hints, not hard matching |
| `rom_identity.track_counts` | number[] | Optional exact cue `TRACK` counts (e.g. MotK Redump = `[17]`). Digests prove the data track; this proves full multi-track TOC. Empty / omit = no TOC gate |
| `rom_identity.require_cue` | bool | When `true`, RetComM requires a `.cue` bind (auto-true when any `track_counts` entry is `> 1`). PSX titles use `.cue` + `.bin` only — not `.iso`/`.chd` |
| `rom_extensions` | string[] | Scan filter, e.g. `[".sfc",".smc"]` |
| `bios_identity` | object | Optional host BIOS / firmware the title needs |
| `bios_identity.required` | bool | Default `true` when object present |
| `bios_identity.crc32` / `md5` / `sha1` / `sha256` | string[] | Preferred dump checksums (include all keys; unused = `[]`) |
| `bios_identity.sizes` | number[] | Byte lengths to consider while scanning |
| `bios_identity.filenames` | string[] | Basename hints (e.g. `SCPH1001.BIN`) |
| `release` | object | Where to fetch builds |
| `release.github` | string | `owner/repo` |
| `release.allow_prerelease` | bool | Allow GitHub pre-releases when no stable latest exists |
| `release.asset_glob` | object | Per-OS glob: `linux`, `windows`, `macos`. Prefer a pattern from the real asset name (`bpe-*linux*`, `*win64*`, …). The launcher treats Windows/Linux/macOS synonyms as matches and deprioritizes `*tools*` assets for non-tools globs. |
| `build` | object | Optional local generate + cmake recipe. When `enabled`, RetComM **Install** prefers this path; omit for third-party zip-only titles. |
| `build.enabled` | bool | Primary install uses generate + toolchain packs |
| `build.source.github` | string | `owner/repo` for the source zipball (default: `release.github`) |
| `build.source.ref` | string | Tag / branch / commit pin for the source archive |
| `build.sdk` | object | Tools identity. Prefer harvesting emitters from the game release zip (`id` only). Optional `github` + `asset_glob.{linux,windows,macos}` remains a legacy fallback for a separate tools pack (e.g. snesrecomp). |
| `build.toolchain` | object | Prefer downloading `cmake-clang-v1` via `github` + `asset_glob` into the shared cache (`id` required; typically `TechnicallyComputers/retcomm-toolchains`). Set `min_version` to a semver floor against `retcomm-toolchain.json` / release tag (catalog build titles currently require `1.0.3+`). Optional harvest of a legacy game-zip `toolchain/` when download is unavailable. Offline: `RETCOMM_TOOLCHAIN_DIR`. |
| `build.generate` | object | Engine-specific generate args (see below) |
| `build.cmake` | object | `build_dir`, `target`, `config` (Release) |
| `install_dir_name` | string | Folder under `apps/` |
| `launch` | object | Relative binary names: `linux`, `windows`, `macos` |
| `romm` | object | Optional match hints |
| `romm.platforms` | string[] | RomM platform slugs |
| `romm.igdb_ids` | number[] | Optional |
| `saves` | object | Optional paths relative to install for sync later |
| `netplay` | object | Optional; omit when the title has no recomp-net lobby |
| `netplay.supported` | bool | Must be `true` to advertise in the hub lobby |
| `netplay.stack` | string | Currently only `"recomp-net"` |
| `netplay.game_name` | string | Exact WS `create`/`join`/`list` wire name (may differ from catalog `name` / `id`) |
| `netplay.game_version` | string | Lobby pin; align with baked `PSX_GAME_VERSION` / `SNES_GAME_VERSION` (empty → server `"dev"`) |
| `netplay.max_slots` | number | Optional; default `2` |
| `netplay.lobby_url` | string | Optional per-title WS override (else launcher `config.netplay.lobby_url`) |
| `netplay.transports` | string[] | Optional UI hints: `"lan"`, `"ice"`, `"direct"` |
| `netplay.match_caps_schema` | string | Optional host-settings family (`psx-v1`, `snes-v1`) |

A title is considered to have a ROM identity when **any** of `crc32`, `md5`,
`sha1`, `sha256`, or `disc_serials` is non-empty. Matching succeeds if **any**
configured digest matches the scanned file (authors may publish only the
algorithm their gate uses).

Identity should mirror what each game passes into `recomp-ui`
(`known_sha1_hex` / `expected_crc` / MD5 tables / disc verify) so RetComM and
the game agree on “verified.”

### `build` (local generate + cmake)

Omit the object for zip-only / third-party distribution. When present with
`enabled: true`, RetComM obtains game source (preferring the host **release zip**
when it vendors engine/UI trees — otherwise the GitHub zipball at
`build.source.ref`), harvests tools from that zip when present (or downloads a
legacy `build.sdk` tools pack), fetches a toolchain pack from
[retcomm-toolchains](https://github.com/TechnicallyComputers/retcomm-toolchains),
runs the SDK CLI `generate` against the user's verified ROM/disc, then
`cmake --build`, and stages the launch binary into `apps/…/current`.

`build.generate.engine`: `"snesrecomp"` | `"psxrecomp"` | `"gbarecomp"`
(default from `platform`: SNES→snesrecomp, PSX→psxrecomp, GBA→gbarecomp).
SNES uses `cfg_dir` / `out_dir` / `funcs_h` / `cfg_roots`. PSX uses `config`
(default `game.toml`) and passes the library disc as `--disc`. GBA uses
`config` (per-binary symbols TOML), `out_dir` (cart `generated/`), and passes
the library ROM as `--rom` plus optional `--bios`.

```json
"build": {
  "enabled": true,
  "source": {
    "github": "TechnicallyComputers/MetalWarriorsSNESRecomp",
    "ref": "v0.1.0"
  },
  "sdk": {
    "id": "snesrecomp-tools",
    "github": "TechnicallyComputers/MetalWarriorsSNESRecomp",
    "asset_glob": {
      "linux": "*snesrecomp-tools*linux*",
      "windows": "*snesrecomp-tools*windows*",
      "macos": "*snesrecomp-tools*macos*"
    }
  },
  "toolchain": {
    "id": "cmake-clang-v1",
    "github": "TechnicallyComputers/retcomm-toolchains",
    "min_version": "1.0.3",
    "asset_glob": {
      "linux": "*cmake-clang-v1*linux*",
      "windows": "*cmake-clang-v1*windows*",
      "macos": "*cmake-clang-v1*macos*"
    }
  },
  "generate": {
    "engine": "snesrecomp",
    "cfg_dir": "recomp",
    "out_dir": "src/gen",
    "funcs_h": "recomp/funcs.h",
    "cfg_roots": true
  },
  "cmake": {
    "build_dir": "build",
    "target": "MetalWarriorsSNESRecomp",
    "config": "Release"
  }
}
```

Never put ROM bytes or generated `src/gen` / `generated/` into catalog or pack
artifacts. Keep `rom_identity` digests aligned with the game's generate gate.

### `netplay` (recomp-net)

Omit the object entirely when unsupported. When present with
`supported: true`, RetComM may list the title in the multi-game lobby browser.
Rooms are still keyed by `game_name` + `game_version` on the lobby server —
peers must match exactly.

```json
"netplay": {
  "supported": true,
  "stack": "recomp-net",
  "game_name": "Star Wars: Masters of Teras Kasi",
  "game_version": "0.1.0",
  "max_slots": 2,
  "transports": ["lan", "ice"],
  "match_caps_schema": "psx-v1"
}
```

Do **not** put ICE/TURN secrets or full default `match_caps` in the catalog;
hosts choose match caps at create time. Keep `game_version` in sync with the
release pin baked into shipping binaries.

### Submission-ready `rom_identity` template

Always ship the full field set so future author self-submission can fill any
subset without schema churn:

```json
"rom_identity": {
  "crc32": [],
  "md5": [],
  "sha1": [],
  "sha256": [],
  "disc_serials": [],
  "sizes": [],
  "filenames": ["Game Name (USA).z64"],
  "track_counts": [],
  "require_cue": false
}
```

For multi-track PSX titles, set `track_counts` to match `game.toml` `[netplay]
required_tracks` (and usually `require_cue: true`) so Track-01-only dumps
cannot pass the library / Install gate.

## Adding a title

**Preferred:** use the [submission form](https://technicallycomputers.github.io/retcomm-catalog/submit/)
(GitHub login). It auto-fills digests and release globs from the source repo and
opens a review issue. A maintainer with write access adds the **`approved`**
label to merge `titles/<id>.json`, update `index.json`, and publish a new
`catalog.zip` release (use **`approved-update`** only to overwrite an existing
id).

**Manual:**

1. Create `titles/<id>.json`.
2. Append `"<id>"` to `index.json` → `titles`.
3. Fill `rom_identity` from the game's launcher gate / README baserom table
   (prefer publishing every digest you know; leave unused keys as `[]`).
4. Point `release.github` at the shipping repo once releases exist.
5. For GBA/PSX, BIOS identity is inherited from `platform_defaults` unless
   the title sets its own `bios_identity` (or `null` to opt out).
6. Tag `v*` or run **Publish catalog** so launchers get a new zip.
