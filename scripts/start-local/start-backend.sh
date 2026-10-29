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

./backend/mvnw -f backend/pom.xml package -DskipTests
exec python3 scripts/api-release.py start --release backend/target/tnbp-0.1.0-SNAPSHOT.jar --timeout "${START_LOCAL_TIMEOUT_SECONDS:-300}"
