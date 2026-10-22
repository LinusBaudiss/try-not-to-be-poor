#!/usr/bin/env sh
set -eu
PROJECT_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
CACHE_DIR="$PROJECT_ROOT/.cache/tools"
GENERATOR_JAR="$CACHE_DIR/openapi-generator-cli-7.26.0.jar"
mkdir -p "$CACHE_DIR"
if [ ! -f "$GENERATOR_JAR" ]; then
  curl --fail --silent --show-error --location \
    https://repo.maven.apache.org/maven2/org/openapitools/openapi-generator-cli/7.26.0/openapi-generator-cli-7.26.0.jar \
    --output "$GENERATOR_JAR.tmp"
  mv "$GENERATOR_JAR.tmp" "$GENERATOR_JAR"
fi
printf '%s  %s\n' 1760050094997b9cc790cc1350be095f15da8c08a996b184d3eadc4ccda5e35e "$GENERATOR_JAR" | sha256sum --check --status
exec "${JAVA_HOME:+$JAVA_HOME/bin/}java" -jar "$GENERATOR_JAR" "$@"
