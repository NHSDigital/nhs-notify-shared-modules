---
layout: default
title: Check pnpm overrides
parent: GitHub Actions
grand_parent: Home
nav_order: 17
---

<!-- vale off -->

## Check pnpm overrides

Discovers and optionally removes stale `pnpm.overrides` entries from `pnpm-workspace.yaml`.

### Description

This composite action scans the `overrides` section of `pnpm-workspace.yaml` to identify entries that are no longer required to mitigate transitive dependency vulnerabilities. For each override (or chain of linked overrides), it:

1. Temporarily removes the override from `pnpm-workspace.yaml`
2. Regenerates the lockfile using `pnpm update --lockfile-only`
3. Checks whether the dependency still resolves to a version that satisfies the original minimum version constraint
4. Reports which overrides are removable, simplifiable, or still required

When run in apply mode, it also modifies `pnpm-workspace.yaml` and raises a pull request with the changes.

### Prerequisites

The consuming repository must have a `pnpm-workspace.yaml` with an `overrides` section. The action requires `contents: write` and `pull-requests: write` permissions to create pull requests.

### Inputs

| Input          | Required | Default | Description                                               |
| -------------- | -------- | ------- | --------------------------------------------------------- |
| `project-dir`  | No       | `.`     | Path to the project root containing `pnpm-workspace.yaml` |
| `apply`        | No       | `false` | Whether to apply removals and raise a pull request        |
| `node-version` | No       | `22`    | Node.js version to use                                    |

### Usage

```yaml
name: Check pnpm overrides

on:
  schedule:
    - cron: "0 8 * * 1-5"
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  check-overrides:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha> # v4

      - name: Check and remove stale overrides
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/check-overrides@main
        with:
          apply: "true"
```

### Behaviour

- In **check mode** (default), the action reports findings to the workflow log without modifying any files.
- In **apply mode** (`apply: "true"`), the action modifies `pnpm-workspace.yaml` and `pnpm-lock.yaml`, then raises a pull request targeting `feature/remove-stale-pnpm-overrides`. If a pull request for that branch already exists, it is updated.
- The pull request body contains a full report listing which overrides were removed or simplified and why.
- The pull request creation step is skipped when running locally with [`act`](https://github.com/nektos/act).
