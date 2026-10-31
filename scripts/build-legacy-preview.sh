#!/usr/bin/env bash
set -euo pipefail
PROJECT_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$PROJECT_ROOT"
REFERENCE=5cd387db54cc94aa35e7af02ffd17b1a4480a9f1
[[ $(git rev-parse --verify "$REFERENCE^{commit}") == "$REFERENCE" ]]
DESTINATION="$PROJECT_ROOT/.cache/legacy-preview-$REFERENCE"
mkdir -p "$DESTINATION"
git archive --format=tar --output="$DESTINATION/source.tar" "$REFERENCE"
tar -xf "$DESTINATION/source.tar" -C "$DESTINATION"
# Derselbe Lockbestand erlaubt den bereits installierten unveränderten Abhängigkeitsbaum.
if cmp -s frontend/package-lock.json "$DESTINATION/frontend/package-lock.json"; then
  ln -sfn "$PROJECT_ROOT/frontend/node_modules" "$DESTINATION/frontend/node_modules"
else
  npm --prefix "$DESTINATION/frontend" ci --cache "$PROJECT_ROOT/.cache/npm"
fi
mkdir -p "$DESTINATION/.cache"
ln -sfn "$PROJECT_ROOT/.cache/tools" "$DESTINATION/.cache/tools"
npm --prefix "$DESTINATION/frontend" run build
printf '%s\n' "$REFERENCE" > "$DESTINATION/frontend/dist/tnbp/browser/reference.txt"
printf '%s\n' "$DESTINATION/frontend/dist/tnbp/browser"
