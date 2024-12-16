#!/usr/bin/env bash
set -euo pipefail

# Pre-commit git hook to generate Terraform docs.
#
# Usage:
#   $ [options] ./check-terraform-docs.sh
#
# Options:
#   check_only=true         # Do not format, run check only, default is 'false'
#   FORCE_USE_DOCKER=true   # If set to true the command is run in a Docker container, default is 'false'
#   VERBOSE=true            # Show all the executed commands, default is 'false'

# ==============================================================================

function main() {

  cd "$(git rev-parse --show-toplevel)"

  local check_only=${check_only:-false}
  check_only=$check_only terraform-docs
}

# Format Terraform files.
# Arguments (provided as environment variables):
#   check_only=[do not format, run check only]
function terraform-docs() {
  DIRECTORIES=("infrastructure/modules")

  for DIRECTORY in "${DIRECTORIES[@]}"; do
      for d in "$DIRECTORY"/*; do
          if [ -d "$d" ]; then
            terraform-docs -c scripts/config/.terraform-docs.yml markdown table "$d"
            # --output-file "docs/collections/${d}.md"
          fi
      done
  done
}

# ==============================================================================

function is-arg-true() {

  if [[ "$1" =~ ^(true|yes|y|on|1|TRUE|YES|Y|ON)$ ]]; then
    return 0
  else
    return 1
  fi
}

# ==============================================================================

is-arg-true "${VERBOSE:-false}" && set -x

main "$@"

exit 0
