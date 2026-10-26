#!/usr/bin/env sh
set -eu
PROJECT_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
for VERSION in v1 v2; do
  case "$VERSION" in
    v1) CONTRACT="$PROJECT_ROOT/api-contract/openapi.yaml"; OUTPUT="$PROJECT_ROOT/frontend/src/app/api" ;;
    v2) CONTRACT="$PROJECT_ROOT/api-contract/v2/openapi.yaml"; OUTPUT="$PROJECT_ROOT/frontend/src/app/api/v2" ;;
  esac
  "$PROJECT_ROOT/scripts/generator.sh" generate \
    --input-spec "$CONTRACT" \
    --generator-name typescript-angular \
    --output "$OUTPUT" \
    --additional-properties=ngVersion=22.2.3,tsVersion=6.0.3,providedIn=root,hideGenerationTimestamp=true \
    --global-property=apiDocs=false,modelDocs=false,apiTests=false,modelTests=false
done
