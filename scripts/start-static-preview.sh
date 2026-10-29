#!/usr/bin/env bash
set -euo pipefail
PROJECT_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$PROJECT_ROOT"
CADDY="$PROJECT_ROOT/.cache/tools/caddy"
if [[ ! -x "$CADDY" ]]; then
  mkdir -p .cache/tools
  ARCHIVE="$PROJECT_ROOT/.cache/tools/caddy_2.10.2_linux_amd64.tar.gz"
  curl --fail --silent --show-error --location https://github.com/caddyserver/caddy/releases/download/v2.10.2/caddy_2.10.2_linux_amd64.tar.gz --output "$ARCHIVE"
  printf '%s  %s\n' 5c218bc34c9197369263da7e9317a83acdbd80ef45d94dca5eff76e727c67cdd "$ARCHIVE" | sha256sum --check --status
  tar -xzf "$ARCHIVE" -C .cache/tools caddy
fi
printf '%s  %s\n' 4ef1f68c70219536b2711fd16547a79841a2dec2d6b4e56b1e3e5e9da76028e6 "$CADDY" | sha256sum --check --status
export XDG_DATA_HOME="$PROJECT_ROOT/.local/caddy-data"
export XDG_CONFIG_HOME="$PROJECT_ROOT/.local/caddy-config"
export TNBP_STATIC_ROOT=${TNBP_STATIC_ROOT:-$PROJECT_ROOT/frontend/dist/tnbp/browser}
"$CADDY" validate --config deploy/Caddyfile.preview --adapter caddyfile
exec "$CADDY" run --config deploy/Caddyfile.preview --adapter caddyfile
