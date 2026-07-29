#!/usr/bin/env python3
"""Stamp index.json with catalog_date + release_tag before packing catalog.zip.

catalog_date is UTC ISO-8601 with time when known (YYYY-MM-DDTHH:MM:SSZ),
or YYYY-MM-DD for legacy date-only tags.
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / "index.json"

# vYYYY.MM.DD[.HHMMSS|.HHMM][.suffix…]
_TAG_RE = re.compile(
    r"^v?"
    r"(?P<y>\d{4})\.(?P<mo>\d{2})\.(?P<d>\d{2})"
    r"(?:\.(?P<t>\d{4}|\d{6}))?"
    r"(?:\..*)?$"
)


def stamp_from_tag(tag: str) -> str | None:
    m = _TAG_RE.match(tag.strip())
    if not m:
        return None
    y, mo, d = m.group("y"), m.group("mo"), m.group("d")
    t = m.group("t")
    if not t:
        return f"{y}-{mo}-{d}"
    if len(t) == 4:
        hh, mm, ss = t[:2], t[2:], "00"
    else:
        hh, mm, ss = t[:2], t[2:4], t[4:6]
    return f"{y}-{mo}-{d}T{hh}:{mm}:{ss}Z"


def normalize_datetime(value: str) -> str:
    """Accept YYYY-MM-DD or ISO-8601; return canonical stamp string."""
    value = value.strip()
    if not value:
        return value
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return value
    # 2026-07-29T18:41:00Z / …+00:00 / with fractional seconds
    try:
        raw = value.replace("Z", "+00:00")
        dt = datetime.fromisoformat(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except ValueError as e:
        raise SystemExit(f"invalid --date/--datetime value {value!r}: {e}") from e


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tag", required=True, help="Git tag / release name, e.g. v2026.07.29.184100.12")
    ap.add_argument(
        "--date",
        "--datetime",
        dest="date",
        default="",
        help="YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ (default: derived from tag or UTC now)",
    )
    args = ap.parse_args()
    tag = args.tag.strip()
    date = normalize_datetime(args.date) if args.date.strip() else ""
    if not date:
        date = stamp_from_tag(tag) or ""
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    idx = json.loads(INDEX.read_text(encoding="utf-8"))
    idx["catalog_date"] = date
    idx["release_tag"] = tag
    INDEX.write_text(json.dumps(idx, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"stamped catalog_date={date} release_tag={tag}")


if __name__ == "__main__":
    main()
