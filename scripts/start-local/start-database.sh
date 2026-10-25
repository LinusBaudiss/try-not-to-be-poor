#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$PROJECT_ROOT"

if [[ ! -f .local/database.env ]]; then
  printf '%s\n' 'Datenbankkonfiguration fehlt. Zuerst scripts/start-local/setup.sh ausführen.' >&2
  exit 1
fi

exec docker compose --env-file .local/database.env -f deploy/compose.local.yaml up -d --wait
