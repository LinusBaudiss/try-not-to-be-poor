#!/usr/bin/env sh
set -eu
PROJECT_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
"$PROJECT_ROOT/scripts/generator.sh" generate \
  --input-spec "$PROJECT_ROOT/api-contract/openapi.yaml" \
  --generator-name typescript-angular \
  --output "$PROJECT_ROOT/frontend/src/app/api" \
  --additional-properties=ngVersion=22.2.3,tsVersion=6.0.3,providedIn=root,hideGenerationTimestamp=true \
  --global-property=apiDocs=false,modelDocs=false,apiTests=false,modelTests=false
