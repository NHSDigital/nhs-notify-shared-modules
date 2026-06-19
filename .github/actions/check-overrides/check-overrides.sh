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

  local project_dir="${PROJECT_DIR:-.}"
  local apply="${APPLY:-false}"

  echo "Installing check-overrides dependencies..."
  (cd "${TOOL_DIR}" && pnpm install --no-frozen-lockfile)

  local args=("--project-dir" "${project_dir}")

  if [[ "${apply}" == "true" ]]; then
    args+=("--apply")
  fi

  echo "Running check-overrides..."
  (cd "${TOOL_DIR}" && pnpm run check "${args[@]}")
}

main "$@"
