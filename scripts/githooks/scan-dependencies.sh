#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLING_ROOT="${TOOLING_ROOT:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"

cd "$(git rev-parse --show-toplevel)"

export BUILD_DATETIME="${BUILD_DATETIME:-$(date -u +'%Y-%m-%dT%H:%M:%S%z')}"
export GRYPE_FAIL_ON_SEVERITY="${GRYPE_FAIL_ON_SEVERITY:-high}"

echo "Step 1: Creating SBOM..."
"${TOOLING_ROOT}/scripts/reports/create-sbom-report.sh" > /dev/null 2>&1
[[ -f sbom-repository-report.json ]] && echo "  ✓ SBOM created" || echo "  ✗ SBOM not found"

echo "Step 2: Scanning vulnerabilities..."
"${TOOLING_ROOT}/scripts/reports/scan-vulnerabilities.sh" || true

echo "Step 3: Parsing vulnerabilities..."
REPORT_FILE=""
if [[ -f vulnerabilities-repository-report.json ]]; then
  REPORT_FILE="vulnerabilities-repository-report.json"
elif [[ -f vulnerabilities-repository-report.tmp.json ]]; then
  REPORT_FILE="vulnerabilities-repository-report.tmp.json"
fi

if [[ -n "$REPORT_FILE" ]]; then
  "${TOOLING_ROOT}/scripts/reports/parse-vulnerabilities.sh" "$REPORT_FILE" "true"

  # Check if Critical or High vulnerabilities exist and fail
  CRITICAL_COUNT=$(jq '[.matches[] | select(.vulnerability.severity == "Critical") | {id: .vulnerability.id, package: .artifact.name, version: .artifact.version}] | unique_by([.id, .package, .version]) | length' "$REPORT_FILE")
  HIGH_COUNT=$(jq '[.matches[] | select(.vulnerability.severity == "High") | {id: .vulnerability.id, package: .artifact.name, version: .artifact.version}] | unique_by([.id, .package, .version]) | length' "$REPORT_FILE")

  if [[ "$CRITICAL_COUNT" -gt 0 || "$HIGH_COUNT" -gt 0 ]]; then
    echo ""
    echo "❌ Found $CRITICAL_COUNT Critical and $HIGH_COUNT High severity vulnerabilities"
    exit 1
  fi
fi
