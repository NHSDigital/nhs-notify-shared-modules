---
layout: default
title: Pre-commit Hooks
parent: Home
nav_order: 3
---

## Pre-commit Hooks

This repository provides reusable pre-commit hooks for NHS Notify projects.

### Available Hooks

#### sort-dictionary

Sorts dictionary files alphabetically to maintain consistency.

**Usage:**

```yaml
- repo: https://github.com/NHSDigital/nhs-notify-shared-modules
  rev: vX.Y.Z
  hooks:
    - id: sort-dictionary
```

#### scan-secrets

Scans the entire Git history for secrets and sensitive information.

**Usage:**

```yaml
- repo: https://github.com/NHSDigital/nhs-notify-shared-modules
  rev: vX.Y.Z
  hooks:
    - id: scan-secrets
```

#### check-file-format

Validates file formatting standards across the repository.

**Usage:**

```yaml
- repo: https://github.com/NHSDigital/nhs-notify-shared-modules
  rev: vX.Y.Z
  hooks:
    - id: check-file-format
```

#### check-markdown-format

Checks Markdown files for formatting issues using markdownlint.

**Usage:**

```yaml
- repo: https://github.com/NHSDigital/nhs-notify-shared-modules
  rev: vX.Y.Z
  hooks:
    - id: check-markdown-format
```

#### check-english-usage

Validates English usage and style using Vale.

**Usage:**

```yaml
- repo: https://github.com/NHSDigital/nhs-notify-shared-modules
  rev: vX.Y.Z
  hooks:
    - id: check-english-usage
```

#### lint-terraform

Lints and formats Terraform code using terraform fmt.

**Usage:**

```yaml
- repo: https://github.com/NHSDigital/nhs-notify-shared-modules
  rev: vX.Y.Z
  hooks:
    - id: lint-terraform
```

#### generate-terraform-docs

Generates and validates Terraform module documentation.

**Usage:**

```yaml
- repo: https://github.com/NHSDigital/nhs-notify-shared-modules
  rev: vX.Y.Z
  hooks:
    - id: generate-terraform-docs
```

#### check-todo-usage

Validates TODO comments follow the required format with Jira ticket IDs.

**Usage:**

```yaml
- repo: https://github.com/NHSDigital/nhs-notify-shared-modules
  rev: vX.Y.Z
  hooks:
    - id: check-todo-usage
```

#### scan-dependencies

Runs the same SBOM and Grype dependency scan used in CI and prints the markdown vulnerability summary locally.

**Usage:**

```yaml
- repo: https://github.com/NHSDigital/nhs-notify-shared-modules
  rev: vX.Y.Z
  hooks:
    - id: scan-dependencies
```

Run it manually when needed:

```bash
pre-commit run --config scripts/config/pre-commit.yaml --hook-stage manual scan-dependencies
```

## Setup in Your Repository

Add to your `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/NHSDigital/nhs-notify-shared-modules
    rev: vX.Y.Z  # Use the latest release tag
    hooks:
      - id: scan-secrets
      - id: check-file-format
      - id: check-markdown-format
      - id: lint-terraform
      - id: scan-dependencies
      # Add other hooks as needed
```

Then install:

```bash
pre-commit install
```

## Notes

- All hooks run with `pass_filenames: false` - they operate on the entire repository
- The `scan-secrets` hook checks the entire Git history for security
- Hooks reference scripts in either `scripts/githooks/` or `.github/actions/`
- `scan-dependencies` uses the same Grype-based workflow as CI, respects `scripts/config/grype.yaml` when present, and is configured as a manual-only hook
