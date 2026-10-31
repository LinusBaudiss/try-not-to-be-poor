#!/usr/bin/env bash
set -euo pipefail
PROJECT_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$PROJECT_ROOT"
npm --prefix frontend run build
./scripts/build-legacy-preview.sh
mkdir -p .local/e2e-transition
chmod 700 .local/e2e-transition
ln -sfn "$PROJECT_ROOT/.cache/legacy-preview-5cd387db54cc94aa35e7af02ffd17b1a4480a9f1/frontend/dist/tnbp/browser" .local/e2e-transition/static
export TNBP_STATIC_ROOT="$PROJECT_ROOT/.local/e2e-transition/static"
exec ./scripts/start-static-preview.sh
