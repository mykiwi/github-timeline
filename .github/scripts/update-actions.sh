#!/usr/bin/env bash
# Bumps every `uses: owner/repo[/path]@ref` in .github/workflows/ to the action's
# latest release (major versions included), then re-pins actions.lock.
set -euo pipefail
cd "$(dirname "$0")/../.."

shopt -s nullglob
workflows=(.github/workflows/*.yml .github/workflows/*.yaml)

actions=$(grep -hoE 'uses:[[:space:]]*[A-Za-z0-9_.-]+/[A-Za-z0-9_./-]+@[^[:space:]#]+' "${workflows[@]}" \
  | sed -E 's/uses:[[:space:]]*//' | sort -u)

for action in $actions; do
  name=${action%@*}           # owner/repo[/path]
  current=${action##*@}
  repo=$(cut -d/ -f1-2 <<<"$name")
  latest=$(gh api "repos/$repo/releases/latest" --jq .tag_name 2>/dev/null || true)
  if [ -z "$latest" ]; then
    echo "  $name@$current: no release found, kept"
    continue
  fi
  if [ "$latest" = "$current" ]; then
    echo "  $name@$current: up to date"
    continue
  fi
  echo "  $name: $current -> $latest"
  sed -i -E "s#(uses:[[:space:]]*${name//./\\.})@${current//./\\.}([[:space:]]|\$)#\1@${latest}\2#" "${workflows[@]}"
done

gh actions-lock
