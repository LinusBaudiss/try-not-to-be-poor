#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$PROJECT_ROOT"

if [[ ! -f .local/database.env ]]; then
  printf '%s\n' 'Datenbankkonfiguration fehlt. Zuerst scripts/start-local/setup.sh ausführen.' >&2
  exit 1
fi

compose_supported() {
  local help
  "$@" version >/dev/null 2>&1 || return 1
  help=$("$@" up --help 2>/dev/null) || return 1
  [[ "$help" =~ (^|[[:space:]])--wait([[:space:]]|$) ]]
}

if command -v docker >/dev/null && compose_supported docker compose; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null && compose_supported docker-compose; then
  COMPOSE=(docker-compose)
else
  printf '%s\n' \
    'Docker Compose mit Unterstützung für up --wait wurde nicht gefunden.' \
    'Installiere Compose v2 oder neuer als Docker-Plugin (docker compose) oder als docker-compose.' \
    'Unter Ubuntu mit Docker aus den Ubuntu-Paketquellen: sudo apt-get install docker-compose-v2' \
    'Details stehen in README.md unter Voraussetzungen.' >&2
  exit 1
fi

"${COMPOSE[@]}" --env-file .local/database.env -f deploy/compose.local.yaml up -d --wait
"${COMPOSE[@]}" --env-file .local/database.env -f deploy/compose.local.yaml exec -T postgres \
  psql --set ON_ERROR_STOP=1 --username tnbp_admin --dbname tnbp \
  --file /opt/tnbp/provision-finance-grants.sql
