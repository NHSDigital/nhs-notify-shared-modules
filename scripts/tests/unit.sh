#!/bin/bash

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

pnpm run test:unit

# merge coverage reports
mkdir -p .reports
TMPDIR="./.reports" ./node_modules/.bin/lcov-result-merger "**/.reports/unit/coverage/lcov.info" ".reports/lcov.info" --ignore "node_modules" --prepend-source-files --prepend-path-fix "../../.."
