#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLING_ROOT="${TOOLING_ROOT:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"

# Scan a locally built container image for CVEs (Common Vulnerabilities and
# Exposures). This is a grype command wrapper. It will run grype natively if it
# is installed, otherwise it will run it in a Docker container.
#
# Usage:
#   $ IMAGE=[local image reference] REPORT_FILE=[report path relative to the repository root] ./scan-container-image.sh
#
# Options:
#   GRYPE_DB_CACHE_DIR=/tmp/grype/db  # Directory to persist the grype vulnerability database in
#   FORCE_USE_DOCKER=true             # If set to true the command is run in a Docker container, default is 'false'
#   VERBOSE=true                      # Show all the executed commands, default is 'false'

# ==============================================================================

function main() {

  : "${IMAGE:?IMAGE is required}"
  : "${REPORT_FILE:?REPORT_FILE is required}"

  cd "$(git rev-parse --show-toplevel)"

  config="$PWD/scripts/config/grype.yaml"
  [ -f "$config" ] || config="$TOOLING_ROOT/scripts/config/grype.yaml"
  db_cache_dir="${GRYPE_DB_CACHE_DIR:-/tmp/grype/db}"
  mkdir -p "$db_cache_dir" "$(dirname "$REPORT_FILE")"

  if command -v grype > /dev/null 2>&1 && ! is-arg-true "${FORCE_USE_DOCKER:-false}"; then
    run-grype-natively
  else
    run-grype-in-docker
  fi
}

function run-grype-natively() {

  GRYPE_DB_CACHE_DIR="$db_cache_dir" grype \
    "docker:${IMAGE}" \
    --config "$config" \
    --output json \
    --file "$PWD/$REPORT_FILE"
}

function run-grype-in-docker() {

  # shellcheck disable=SC1091
  source "$TOOLING_ROOT/scripts/docker/docker.lib.sh"

  # shellcheck disable=SC2155
  local image=$(name=ghcr.io/anchore/grype docker-get-image-version-and-pull)

  docker run --rm --platform linux/amd64 \
    --volume /var/run/docker.sock:/var/run/docker.sock \
    --volume "$PWD":/workdir \
    --volume "$config":/grype.yaml:ro \
    --volume "$db_cache_dir":/grype-db \
    --env GRYPE_DB_CACHE_DIR=/grype-db \
    "$image" \
      "docker:${IMAGE}" \
      --config /grype.yaml \
      --output json \
      --file "/workdir/$REPORT_FILE"
}

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
