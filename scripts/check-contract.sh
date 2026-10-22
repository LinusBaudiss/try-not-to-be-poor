#!/usr/bin/env sh
set -eu
PROJECT_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$PROJECT_ROOT"
./scripts/generator.sh validate --input-spec api-contract/openapi.yaml

CACHE_DIR="$PROJECT_ROOT/.cache/tools"
OASDIFF="$CACHE_DIR/oasdiff-1.30.0"
if [ ! -x "$OASDIFF" ]; then
  case "$(uname -s)-$(uname -m)" in
    Linux-x86_64) ;;
    *) echo 'Für die Vertragsprüfung wird Linux x86_64 benötigt (wie in CI).' >&2; exit 1 ;;
  esac
  ARCHIVE="$CACHE_DIR/oasdiff-1.30.0.tar.gz"
  curl --fail --silent --show-error --location \
    https://github.com/oasdiff/oasdiff/releases/download/v1.30.0/oasdiff_1.30.0_linux_amd64.tar.gz --output "$ARCHIVE"
  printf '%s  %s\n' bfa353e7c699dd201d52dd42839330a0d4ba0429767c8ec9fc0e5fdc650b8060 "$ARCHIVE" | sha256sum --check --status
  EXTRACT_DIR=$(mktemp -d)
  tar -xzf "$ARCHIVE" -C "$EXTRACT_DIR" oasdiff
  mv "$EXTRACT_DIR/oasdiff" "$OASDIFF"
  rmdir "$EXTRACT_DIR"
fi
"$OASDIFF" --version

BASE_REF=${CONTRACT_BASE_REF:-HEAD}
if [ "$BASE_REF" = 0000000000000000000000000000000000000000 ]; then
  printf '%s\n' 'Erster Commit: noch kein Basisvertrag vorhanden.'
else
  git rev-parse --verify "$BASE_REF^{commit}" >/dev/null
  if git cat-file -e "$BASE_REF:api-contract/openapi.yaml" 2>/dev/null; then
    BASE_CONTRACT=$(mktemp)
    trap 'rm -f "$BASE_CONTRACT"' EXIT HUP INT TERM
    git show "$BASE_REF:api-contract/openapi.yaml" > "$BASE_CONTRACT"
    "$OASDIFF" breaking "$BASE_CONTRACT" api-contract/openapi.yaml --fail-on ERR --allow-external-refs=false
  else
    printf '%s\n' 'Erstvertrag: Im Basiscommit liegt noch kein API-Vertrag vor.'
  fi
fi

# Beide tatsächlich verwendeten Generatorausgaben werden kompiliert.
./backend/mvnw -B -f backend/pom.xml -DskipTests compile
npm --prefix frontend ci
npm --prefix frontend run build
