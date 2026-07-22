#!/usr/bin/env bash

set -euo pipefail

if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    pnpm config set //npm.pkg.github.com/:_authToken $GITHUB_TOKEN
fi
