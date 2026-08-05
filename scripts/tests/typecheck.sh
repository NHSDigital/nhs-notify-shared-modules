#!/bin/bash

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

pnpm install --frozen-lockfile
pnpm run typecheck
