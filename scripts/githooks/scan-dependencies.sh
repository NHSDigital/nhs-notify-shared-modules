#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLING_ROOT="${TOOLING_ROOT:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"

cd "$(git rev-parse --show-toplevel)"

export BUILD_DATETIME="${BUILD_DATETIME:-$(date -u +'%Y-%m-%dT%H:%M:%S%z')}"
export GRYPE_FAIL_ON_SEVERITY="${GRYPE_FAIL_ON_SEVERITY:-high}"

"${TOOLING_ROOT}/scripts/reports/create-sbom-report.sh" > /dev/null 2>&1
"${TOOLING_ROOT}/scripts/reports/scan-vulnerabilities.sh"
"${TOOLING_ROOT}/scripts/reports/parse-vulnerabilities.sh" vulnerabilities-repository-report.json

# Display Critical and High vulnerabilities
echo ""
echo "Critical and High Vulnerabilities:"
echo "=================================="
jq -r '.matches[] | select(.vulnerability.severity == "Critical" or .vulnerability.severity == "High") | "\(.vulnerability.severity | ascii_upcase): \(.vulnerability.id) - \(.artifact.name)@\(.artifact.version)"' vulnerabilities-repository-report.tmp.json | sort
