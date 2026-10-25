#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$PROJECT_ROOT"

npm --prefix frontend ci
exec npm --prefix frontend start -- --host localhost --ssl "$@"
