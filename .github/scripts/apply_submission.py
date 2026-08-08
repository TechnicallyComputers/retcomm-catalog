#!/usr/bin/env python3
"""Apply an approved catalog-submission issue body to titles/ + index.json."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TITLES = ROOT / "titles"
INDEX = ROOT / "index.json"

ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
JSON_FENCE_RE = re.compile(
    r"```json\s*\n(.*?)```",
    re.DOTALL | re.IGNORECASE,
)


def extract_manifest(body: str) -> dict:
    matches = list(JSON_FENCE_RE.finditer(body or ""))
    if not matches:
        raise SystemExit("No ```json ... ``` block found in issue body")
    # Prefer the last json fence (proposed manifest); ignore accidental earlier ones.
    raw = matches[-1].group(1).strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise SystemExit(f"Invalid JSON in issue body: {e}") from e
    if not isinstance(data, dict):
        raise SystemExit("Manifest JSON must be an object")
    return data


def validate(manifest: dict) -> None:
    errors: list[str] = []
    tid = str(manifest.get("id") or "").strip()
    if not tid or not ID_RE.match(tid):
        errors.append("id must be a lowercase slug (e.g. megaman-x-snes)")
    if not str(manifest.get("name") or "").strip():
        errors.append("name is required")
    kind = manifest.get("kind")
    if kind not in ("recomp", "decomp"):
        errors.append('kind must be "recomp" or "decomp"')
    if not str(manifest.get("platform") or "").strip():
        errors.append("platform is required")

    release = manifest.get("release") or {}
    if not isinstance(release, dict) or not str(release.get("github") or "").strip():
        errors.append("release.github is required")
    glob = (release.get("asset_glob") or {}) if isinstance(release, dict) else {}
    if not isinstance(glob, dict) or not any(
        str(glob.get(k) or "").strip() for k in ("linux", "windows", "macos")
    ):
        errors.append("release.asset_glob needs at least one OS pattern")

    if not str(manifest.get("install_dir_name") or "").strip():
        errors.append("install_dir_name is required")

    launch = manifest.get("launch") or {}
    if not isinstance(launch, dict) or not any(
        str(launch.get(k) or "").strip() for k in ("linux", "windows", "macos")
    ):
        errors.append("launch needs at least one OS binary name")

    ri = manifest.get("rom_identity") or {}
    if not isinstance(ri, dict):
        errors.append("rom_identity must be an object")
    else:
        has = any(
            isinstance(ri.get(k), list) and len(ri.get(k)) > 0
            for k in ("crc32", "md5", "sha1", "sha256", "disc_serials")
        )
        if not has:
            errors.append(
                "rom_identity needs at least one digest or disc_serial"
            )
        tc = ri.get("track_counts")
        if tc is not None:
            if not isinstance(tc, list) or not all(
                isinstance(n, int) and not isinstance(n, bool) and n >= 1
                for n in tc
            ):
                errors.append(
                    "rom_identity.track_counts must be a list of integers >= 1"
                )
            elif any(n > 1 for n in tc) and not ri.get("require_cue", False):
                # Soft preference: multi-track dumps need a .cue bind.
                # Do not hard-fail — authors may set require_cue explicitly later.
                pass

    netplay = manifest.get("netplay")
    if isinstance(netplay, dict) and netplay.get("supported"):
        stack = str(netplay.get("stack") or "").strip()
        if stack and stack != "recomp-net":
            errors.append('netplay.stack must be "recomp-net" when supported')
        if not str(netplay.get("game_name") or "").strip():
            errors.append("netplay.game_name is required when netplay is supported")
        if netplay.get("game_version") is None or str(netplay.get("game_version")).strip() == "":
            errors.append(
                "netplay.game_version is required when netplay is supported"
            )

    if errors:
        raise SystemExit("Validation failed:\n- " + "\n- ".join(errors))


def apply_manifest(manifest: dict, *, allow_update: bool) -> str:
    validate(manifest)
    tid = str(manifest["id"]).strip()
    # Keep id in sync with object
    manifest["id"] = tid

    path = TITLES / f"{tid}.json"
    existed = path.exists()
    if existed and not allow_update:
        raise SystemExit(
            f"titles/{tid}.json already exists; remove `approved` and use "
            "`approved-update` only if intentionally replacing the entry"
        )

    TITLES.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    idx = json.loads(INDEX.read_text(encoding="utf-8"))
    titles = list(idx.get("titles") or [])
    if tid not in titles:
        titles.append(tid)
        idx["titles"] = titles
        INDEX.write_text(
            json.dumps(idx, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    if not path.is_file():
        raise SystemExit(f"failed to write {path}")
    return f"{'updated' if existed else 'added'}:{tid}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--body-file", required=True, help="Path to issue body markdown")
    ap.add_argument(
        "--allow-update",
        action="store_true",
        help="Overwrite an existing titles/<id>.json",
    )
    args = ap.parse_args()
    body = Path(args.body_file).read_text(encoding="utf-8")
    manifest = extract_manifest(body)
    result = apply_manifest(manifest, allow_update=args.allow_update)
    print(result)
    print(f"Wrote titles/{manifest['id']}.json", file=sys.stderr)


if __name__ == "__main__":
    main()
