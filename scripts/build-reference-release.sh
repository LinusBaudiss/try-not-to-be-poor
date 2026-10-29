#!/usr/bin/env bash
set -euo pipefail
PROJECT_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$PROJECT_ROOT"
REFERENCE=607db4ab33cd83bc90949d5b88a9cfd37aeed42b
[[ $(git rev-parse --verify "$REFERENCE^{commit}") == "$REFERENCE" ]]
# Erreichbarer Quellstand mit exakt demselben Backend wie der lokale Snapshot b467….
[[ $(git rev-parse "$REFERENCE:backend") == 750ce7764a0e9c997ff9e724f84001d9125b8168 ]]
mkdir -p "$PROJECT_ROOT/.cache"
DESTINATION=$(mktemp -d "$PROJECT_ROOT/.cache/reference-release-$REFERENCE-XXXXXXXX")
trap 'rm -rf -- "$DESTINATION"' ERR
# Jeder ausgegebene Pfad stammt aus dieser sauberen Extraktion und diesem erfolgreichen Bau.
git archive --format=tar --output="$DESTINATION/source.tar" "$REFERENCE"
tar -xf "$DESTINATION/source.tar" -C "$DESTINATION"
"$DESTINATION/backend/mvnw" -B -f "$DESTINATION/backend/pom.xml" \
  ${MAVEN_REPO_LOCAL:+-Dmaven.repo.local="$MAVEN_REPO_LOCAL"} clean package -Dmaven.test.skip=true
printf '%s\n' "$DESTINATION/backend/target/tnbp-0.1.0-SNAPSHOT.jar"
