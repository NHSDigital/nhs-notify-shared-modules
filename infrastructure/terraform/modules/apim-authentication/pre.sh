#!/bin/bash

# This script is run before the Terraform apply command.
# It ensures all Node.js dependencies are installed, generates any required dependencies,
# and builds all Lambda functions in the workspace before Terraform provisions infrastructure.

echo "Running Pre.sh"

ROOT_DIR="$(git rev-parse --show-toplevel)"

# Skip dependency installation and build steps when only reading Terraform output.
# terraform output reads from S3 state backend and does not require built artefacts.
if [[ "${ACTION:-}" == "output" ]]; then
  echo "Skipping dependency installation and build steps for 'output' action."
  return 0
fi

(cd "$ROOT_DIR" && pnpm install --frozen-lockfile)

(cd "$ROOT_DIR" && pnpm -r --filter "./src/lambdas/apim*" run --if-present lambda-build)
