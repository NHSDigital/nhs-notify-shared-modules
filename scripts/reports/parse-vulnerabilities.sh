#!/bin/bash
#
# Parse vulnerability report JSON and output a human-readable summary
# Usage: ./parse-vulnerabilities.sh <path-to-report.json>
#

set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <vulnerability-report.json>"
    exit 1
fi

REPORT_FILE="$1"

if [[ ! -f "$REPORT_FILE" ]]; then
    echo "Error: File not found: $REPORT_FILE"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed"
    exit 1
fi

# Get counts by severity
echo "## Vulnerability Report Summary"
echo ""

CRITICAL_COUNT=$(jq '[.matches[] | select(.vulnerability.severity == "Critical")] | length' "$REPORT_FILE")
HIGH_COUNT=$(jq '[.matches[] | select(.vulnerability.severity == "High")] | length' "$REPORT_FILE")
MEDIUM_COUNT=$(jq '[.matches[] | select(.vulnerability.severity == "Medium")] | length' "$REPORT_FILE")
LOW_COUNT=$(jq '[.matches[] | select(.vulnerability.severity == "Low")] | length' "$REPORT_FILE")
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
    echo "| Package | Version | Fix | Description |"
    echo "|---------|---------|-----|-------------|"

    jq -r --arg sev "$severity" '
        [.matches[] | select(.vulnerability.severity == $sev) | {
            id: .vulnerability.id,
            severity: .vulnerability.severity,
            package: .artifact.name,
            version: .artifact.version,
            fix: (.vulnerability.fix.versions[0] // "N/A"),
            description: .vulnerability.description
        }]
        | unique_by(.id + .package + .version)
        | sort_by(.package)
        | .[]
        | "| \(.package) | \(.version) | \(.fix) | \(.description[0:70])... |"
    ' "$REPORT_FILE"

    echo ""
}

print_severity_section "Critical" "$CRITICAL_COUNT"
print_severity_section "High" "$HIGH_COUNT"
print_severity_section "Medium" "$MEDIUM_COUNT"
print_severity_section "Low" "$LOW_COUNT"

# Priority packages summary
echo "---"
echo ""
echo "### Priority Packages to Update"
echo ""

jq -r '
    [.matches[] | select(.vulnerability.severity == "Critical" or .vulnerability.severity == "High") | .artifact.name]
    | unique
    | sort
    | join(", ")
' "$REPORT_FILE" | fold -s -w 80

echo ""
