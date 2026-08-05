#!/bin/bash

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

_timer_labels=()
_timer_seconds=()

run_timed() {
  local label="$1"
  shift
  local start
  start=$(date +%s)
  local rc=0
  "$@" || rc=$?
  local end
  end=$(date +%s)
  _timer_labels+=("$label")
  _timer_seconds+=("$((end - start))")
  return "$rc"
}

print_timing_summary() {
  echo ""
  echo "===== Timing Summary ====="
  local total=0
  for i in "${!_timer_labels[@]}"; do
    printf "  %-55s %4ds\n" "${_timer_labels[$i]}" "${_timer_seconds[$i]}"
    total=$((total + _timer_seconds[$i]))
  done
  echo "  ---------------------------------------------------------"
  printf "  %-55s %4ds\n" "TOTAL" "$total"
  echo "=========================="
}

trap print_timing_summary EXIT

run_timed "Node unit tests (parallel)" pnpm run test:unit || jest_exit=$?

# ---- Phase 1: install all Python dev dependencies (sequential) ----
# Discover Python projects dynamically: any directory under src/, utils/, or
# lambdas/ whose Makefile defines both an `install-dev` target (Python deps)
# and a `coverage` target (pytest). This avoids maintaining a hardcoded list.
echo "Installing Python dev dependencies..."
_python_projects=()
while IFS= read -r _proj; do
  _python_projects+=("$_proj")
done < <(
  grep -rl "^install-dev:" src/ utils/ lambdas/ --include="Makefile" 2>/dev/null \
    | xargs grep -l "^coverage:" \
    | xargs -I{} dirname {} \
    | sort
)
for proj in "${_python_projects[@]}"; do
  run_timed "${proj}: install-dev" make -C "$proj" install-dev
done

# ---- Phase 2: run all coverage steps in parallel ----
echo "Running Python coverage in parallel..."

_py_pids=()
_py_labels=()
_py_logs=()
_py_exits=()

for proj in "${_python_projects[@]}"; do
  label="${proj}: coverage"
  logfile=$(mktemp)
  make -C "$proj" coverage >"$logfile" 2>&1 &
  _py_pids+=("$!")
  _py_labels+=("$label")
  _py_logs+=("$logfile")
done

# Collect results in launch order (preserves deterministic output)
_py_start=$(date +%s)
for i in "${!_py_pids[@]}"; do
  if wait "${_py_pids[$i]}"; then
    _py_exit=0
  else
    _py_exit=$?
  fi
  _py_exits+=("${_py_exit}")
  echo ""
  echo "--- ${_py_labels[$i]} ---"
  cat "${_py_logs[$i]}"
  rm -f "${_py_logs[$i]}"
done
_py_end=$(date +%s)
_timer_labels+=("Python unit tests (parallel)")
_timer_seconds+=("$((_py_end - _py_start))")

# Propagate any Jest failure now that all other test suites have completed
if [ "${jest_exit:-0}" -ne 0 ]; then
  echo "Jest tests failed with exit code ${jest_exit}"
  exit "${jest_exit}"
fi

# Propagate any Python coverage failure
for i in "${!_py_exits[@]}"; do
  if [ "${_py_exits[$i]}" -ne 0 ]; then
    echo "${_py_labels[$i]} failed with exit code ${_py_exits[$i]}"
    exit "${_py_exits[$i]}"
  fi
done

# merge coverage reports
mkdir -p .reports
TMPDIR="./.reports" ./node_modules/.bin/lcov-result-merger "**/.reports/unit/coverage/lcov.info" ".reports/lcov.info" --ignore "node_modules" --prepend-source-files --prepend-path-fix "../../.."
