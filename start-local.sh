#!/usr/bin/env bash
# Auch ein expliziter Aufruf mit sh soll die benötigte Bash verwenden.
if ! (builtin shopt) >/dev/null 2>&1; then
  exec bash -- "$0" "$@"
fi

set -euo pipefail

PROJECT_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$PROJECT_ROOT"
umask 077

START_LOCAL_TIMEOUT_SECONDS=${START_LOCAL_TIMEOUT_SECONDS:-300}
if [[ ! "$START_LOCAL_TIMEOUT_SECONDS" =~ ^[1-9][0-9]*$ ]]; then
  printf '%s\n' 'START_LOCAL_TIMEOUT_SECONDS muss eine positive ganze Zahl sein.' >&2
  exit 1
fi
for command in python3 curl flock; do
  if ! command -v "$command" >/dev/null; then
    printf '%s\n' "Benötigtes Programm fehlt: $command" >&2
    exit 1
  fi
done

# Die Sitzungskonfiguration und die Bereitschaftschecks verwenden eine feste HTTPS-Origin.
validate_frontend_args() {
  while (($#)); do
    case "$1" in
      --ssl-cert|--ssl-key)
        if (($# < 2)) || [[ -z "$2" || "$2" == --* ]]; then
          printf '%s\n' "Für $1 fehlt der Dateipfad." >&2
          return 1
        fi
        shift 2
        ;;
      --ssl-cert=?*|--ssl-key=?*) shift ;;
      *)
        printf '%s\n' 'Erlaubte Optionen: --ssl-cert und --ssl-key. Die Adresse https://localhost:4200 ist fest.' >&2
        return 1
        ;;
    esac
  done
}
validate_frontend_args "$@"

./scripts/start-local/setup.sh
exec {START_LOCAL_LOCK}>.local/start-local.lock
if ! flock --nonblock "$START_LOCAL_LOCK"; then
  printf '%s\n' 'Ein lokaler Gesamtstart läuft bereits für dieses Projekt.' >&2
  exit 1
fi

# Bereits belegte Ports dürfen nicht als Bereitschaft unserer Prozesse gelten.
python3 - <<'PY'
import socket

for port in (8080, 4200):
    for host in ('127.0.0.1', '::1'):
        try:
            connection = socket.create_connection((host, port), timeout=0.2)
        except OSError:
            continue
        connection.close()
        raise SystemExit(f'Port {port} ist bereits belegt. Bestehenden Dienst zuerst beenden.')
PY

./scripts/start-local/start-database.sh

APP_PIDS=()
cleanup() {
  trap - EXIT INT TERM
  if ((${#APP_PIDS[@]} == 0)); then return; fi
  printf '\n%s\n' 'Backend und Frontend werden beendet; die lokale Datenbank läuft weiter.'
  local pid active attempt
  for pid in "${APP_PIDS[@]}"; do kill -TERM -- "-$pid" 2>/dev/null || true; done
  # Der Guard beendet zuerst Containment und PostgreSQL-Arbeit nachweisbar.
  for attempt in {1..600}; do
    active=false
    for pid in "${APP_PIDS[@]}"; do
      if kill -0 -- "-$pid" 2>/dev/null; then active=true; fi
    done
    if [[ "$active" == false ]]; then break; fi
    sleep 0.1
  done
  for pid in "${APP_PIDS[@]}"; do
    kill -KILL -- "-$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Frontend und Guard haben eigene Gruppen; der Guard hält die API im Subreaper.
set -m
wait_ready() {
  local service=$1 url=$2 pid deadline=$((SECONDS + START_LOCAL_TIMEOUT_SECONDS))
  shift 2
  printf '%s\n' "Warte auf $service …"
  while ((SECONDS < deadline)); do
    for pid in "${APP_PIDS[@]}"; do
      if ! kill -0 "$pid" 2>/dev/null; then
        printf '%s\n' 'Ein Anwendungsprozess wurde vorzeitig beendet. Siehe Ausgabe oben.' >&2
        return 1
      fi
    done
    if [[ "$service" == Backend ]]; then
      if python3 scripts/start-local/check-backend.py "$url"; then return 0; fi
    elif curl --disable --noproxy '*' --fail --silent --connect-timeout 1 --max-time 2 "$@" --output /dev/null "$url"; then
      return 0
    fi
    sleep 1
  done
  printf '%s\n' "$service ist nach $START_LOCAL_TIMEOUT_SECONDS Sekunden nicht bereit. Siehe Ausgabe oben." >&2
  return 1
}

./scripts/start-local/start-backend.sh </dev/null &
APP_PIDS+=("$!")
wait_ready Backend http://127.0.0.1:8080/api/v2/access/csrf

./scripts/start-local/start-frontend.sh "$@" </dev/null &
APP_PIDS+=("$!")
# Ausschließlich das lokale HTTPS-Entwicklungszertifikat beim Bereitschaftscheck akzeptieren.
wait_ready Frontend https://localhost:4200/ --insecure

printf '\n%s\n' 'Anwendung bereit: https://localhost:4200' \
  'Registrierungslink bei aktiver Registrierung: .local/registration-link.txt' \
  'Strg+C beendet Backend und Frontend.'
if wait -n "${APP_PIDS[@]}"; then
  printf '%s\n' 'Ein Anwendungsprozess wurde beendet; der Gesamtstart wird beendet.' >&2
  exit 1
else
  exit "$?"
fi
