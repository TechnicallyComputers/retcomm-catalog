#!/usr/bin/env python3
"""Stamp index.json with catalog_date + release_tag before packing catalog.zip."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / "index.json"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tag", required=True, help="Git tag / release name, e.g. v2026.07.29.12")
    ap.add_argument(
        "--date",
        default="",
        help="YYYY-MM-DD (default: derived from tag or UTC today)",
    )
    args = ap.parse_args()
    tag = args.tag.strip()
    date = args.date.strip()
    if not date:
        m = re.match(r"^v?(\d{4}\.\d{2}\.\d{2})", tag)
        if m:
            date = m.group(1).replace(".", "-")
        else:
            from datetime import datetime, timezone

            date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    idx = json.loads(INDEX.read_text(encoding="utf-8"))
    idx["catalog_date"] = date
    idx["release_tag"] = tag
    INDEX.write_text(json.dumps(idx, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"stamped catalog_date={date} release_tag={tag}")


if __name__ == "__main__":
    main()
