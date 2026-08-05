#!/bin/bash

# This script is run before the module is packaged into a zip archive.
# It builds the lambda functions and copies the distribution files to the module directory.

echo "Running Pre.sh"

ROOT_DIR="$(git rev-parse --show-toplevel)"

(cd "$ROOT_DIR" && pnpm -r --filter "./src/lambdas/apim*" run --if-present lambda-build)

# move distribution files to the module directory so that they can be zipped as part of a release
mkdir dist || true
cp -r "$ROOT_DIR/src/lambdas/apim-access-token-refresher/dist" dist/apim-access-token-refresher
cp -r "$ROOT_DIR/src/lambdas/apim-key-generator/dist" dist/apim-key-generator
