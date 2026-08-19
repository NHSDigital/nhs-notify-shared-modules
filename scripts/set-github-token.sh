#!/usr/bin/env bash

set -euo pipefail

existing_token=$(pnpm config get //npm.pkg.github.com/:_authToken 2>/dev/null)
if [[ -n "$existing_token" && "$existing_token" != "null" && "$existing_token" != "undefined" ]]; then
    echo "GitHub token already exists"
    exit 0
fi

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
    read -p "Enter GitHub token: " GITHUB_TOKEN
    export GITHUB_TOKEN
fi

pnpm config set //npm.pkg.github.com/:_authToken "$GITHUB_TOKEN"
