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
[[ -f vulnerabilities-repository-report.tmp.json ]] && echo "  ✓ Vulnerability scan complete" || echo "  ✗ Vulnerability report not found"

echo "Step 3: Parsing vulnerabilities..."
REPORT_FILE=""
if [[ -f vulnerabilities-repository-report.json ]]; then
  REPORT_FILE="vulnerabilities-repository-report.json"
elif [[ -f vulnerabilities-repository-report.tmp.json ]]; then
  REPORT_FILE="vulnerabilities-repository-report.tmp.json"
fi

if [[ -n "$REPORT_FILE" ]]; then
  "${TOOLING_ROOT}/scripts/reports/parse-vulnerabilities.sh" "$REPORT_FILE"
  echo "  ✓ Vulnerabilities parsed"
else
  echo "  ✗ No vulnerability report found"
  exit 1
fi

# Display Critical and High vulnerabilities
echo ""
echo "Critical and High Vulnerabilities:"
echo "=================================="

# Find which report file exists
REPORT_FILE=""
if [[ -f vulnerabilities-repository-report.json ]]; then
  REPORT_FILE="vulnerabilities-repository-report.json"
elif [[ -f vulnerabilities-repository-report.tmp.json ]]; then
  REPORT_FILE="vulnerabilities-repository-report.tmp.json"
fi

if [[ -n "$REPORT_FILE" ]]; then
  jq -r '.matches[] | select(.vulnerability.severity == "Critical" or .vulnerability.severity == "High") | "\(.vulnerability.severity | ascii_upcase): \(.vulnerability.id) - \(.artifact.name)@\(.artifact.version)"' "$REPORT_FILE" | sort
else
  echo "No vulnerability report found"
fi
