#!/usr/bin/env bash
# Ensure catalog submission labels exist (idempotent).
# Requires: gh, GH_TOKEN (or gh auth), GITHUB_REPOSITORY=owner/repo
set -euo pipefail

REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY required}"

ensure_label() {
  local name="$1" color="$2" desc="$3"
  if gh label list --repo "$REPO" --json name --jq '.[].name' | grep -qx "$name"; then
    gh label edit "$name" --repo "$REPO" --color "$color" --description "$desc" >/dev/null
    echo "label ok: $name"
  else
    gh label create "$name" --repo "$REPO" --color "$color" --description "$desc"
    echo "label created: $name"
  fi
}

ensure_label "catalog-submission" "5319E7" "New title submission from the catalog form"
ensure_label "approved" "0E8A16" "Approve submission: merge title and publish catalog.zip"
ensure_label "approved-update" "1D76DB" "Approve and overwrite an existing titles/<id>.json"
