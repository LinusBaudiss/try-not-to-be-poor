#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$PROJECT_ROOT"

for config in database registration session; do
  if [[ ! -f ".local/$config.env" ]]; then
    printf '%s\n' "Konfiguration .local/$config.env fehlt. Zuerst scripts/start-local/setup.sh ausführen." >&2
    exit 1
  fi
done

set -a
. .local/database.env
. .local/registration.env
. .local/session.env
set +a

exec ./backend/mvnw -f backend/pom.xml spring-boot:run
