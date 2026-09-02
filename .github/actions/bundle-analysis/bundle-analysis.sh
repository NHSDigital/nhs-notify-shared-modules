#!/bin/bash

set -euo pipefail

function main() {
  if [[ -z "${TOOL_DIR:-}" ]]; then
    echo "ERROR: TOOL_DIR is not set" >&2
    exit 1
  fi

  if [[ ! -d "${TOOL_DIR}" ]]; then
    echo "ERROR: Tool directory does not exist: ${TOOL_DIR}" >&2
    exit 1
  fi

  echo "Installing bundle-analysis dependencies..."
  (cd "${TOOL_DIR}" && npm ci)

  echo "Running bundle analysis..."
  (cd "${TOOL_DIR}" && npm run analyse -- \
    --baseline-dir="${BASELINE_DIR}" \
    --current-dir="${CURRENT_DIR}" \
    --output-dir="${OUTPUT_DIR}" \
    --threshold="${THRESHOLD}")
}

main
