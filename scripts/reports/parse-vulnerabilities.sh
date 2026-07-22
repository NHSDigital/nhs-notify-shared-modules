#!/bin/bash
#
# WARNING: This file is managed via the repository template.
# Local changes may diverge from the template source of truth.
#
# Parse vulnerability report JSON and output a human-readable summary
# Usage: ./parse-vulnerabilities.sh <path-to-report.json> [critical-high-only]
# Options:
#   critical-high-only  Only print Critical and High severity sections

set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <vulnerability-report.json> [critical-high-only]"
    exit 1
fi

REPORT_FILE="$1"
FILTER_CRITICAL_HIGH_ONLY="${2:-false}"

if [[ ! -f "$REPORT_FILE" ]]; then
    echo "Error: File not found: $REPORT_FILE"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed"
    exit 1
fi

# Get counts by severity
count_unique_severity() {
    local severity="$1"

    jq -r --arg sev "$severity" '
        [.matches[] | select(.vulnerability.severity == $sev) | {
            id: .vulnerability.id,
            package: .artifact.name,
            version: .artifact.version
        }]
        | unique_by([.id, .package, .version])
        | length
    ' "$REPORT_FILE"
}

echo "## Vulnerability Report Summary"
echo ""

CRITICAL_COUNT=$(count_unique_severity "Critical")
HIGH_COUNT=$(count_unique_severity "High")
MEDIUM_COUNT=$(count_unique_severity "Medium")
LOW_COUNT=$(count_unique_severity "Low")
TOTAL=$((CRITICAL_COUNT + HIGH_COUNT + MEDIUM_COUNT + LOW_COUNT))

echo "**Total: $TOTAL vulnerabilities** ($CRITICAL_COUNT Critical, $HIGH_COUNT High, $MEDIUM_COUNT Medium, $LOW_COUNT Low)"
echo ""

# Function to print vulnerabilities for a given severity
print_severity_section() {
    local severity="$1"
    local count="$2"

    if [[ "$count" -eq 0 ]]; then
        return
    fi

    echo "### $severity ($count)"
    echo ""
    echo "| ID | Package | Language | Version | Fix | Description |"
    echo "|---|---|---|---|---|---|"

    jq -r --arg sev "$severity" '
        [.matches[] | select(.vulnerability.severity == $sev) | {
            id: .vulnerability.id,
            package: .artifact.name,
            language: .artifact.language,
            version: .artifact.version,
            fix: (.vulnerability.fix.versions[0] // "N/A"),
            description: ((.vulnerability.description // "N/A") | .[0:70] + "...")
        }]
        | unique_by([.id, .package, .version])
        | sort_by(.id)
        | .[]
        | "| \(.id) | \(.package) | \(.language) | \(.version) | \(.fix) | \(.description) |"
    ' "$REPORT_FILE"

    echo ""
}

print_severity_section "Critical" "$CRITICAL_COUNT"
print_severity_section "High" "$HIGH_COUNT"

if [[ "$FILTER_CRITICAL_HIGH_ONLY" != "true" && "$FILTER_CRITICAL_HIGH_ONLY" != "critical-high-only" ]]; then
  print_severity_section "Medium" "$MEDIUM_COUNT"
  print_severity_section "Low" "$LOW_COUNT"
fi
