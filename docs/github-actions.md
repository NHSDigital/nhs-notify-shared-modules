---
layout: default
title: GitHub Actions
parent: Home
nav_order: 4
has_children: true
---

## GitHub Actions

This repository provides reusable composite actions for NHS Notify projects.

## Available Actions

- [Build Docs](github-actions/build-docs.html) - Builds Jekyll documentation site
- [Check English Usage](github-actions/check-english-usage.html) - Validates writing style using Vale
- [Check File Format](github-actions/check-file-format.html) - Validates file formatting standards
- [Check Markdown Format](github-actions/check-markdown-format.html) - Checks Markdown files with markdownlint
- [Check pnpm Overrides](github-actions/check-overrides.html) - Discovers and removes stale pnpm overrides
- [Check PR Title Format](github-actions/check-pr-title-format.html) - Validates PR titles against regex
- [Check TODO Usage](github-actions/check-todo-usage.html) - Validates TODO comment format
- [Create Lines of Code Report](github-actions/create-lines-of-code-report.html) - Counts lines of code
- [Lint Terraform](github-actions/lint-terraform.html) - Lints and formats Terraform
- [Perform Static Analysis](github-actions/perform-static-analysis.html) - Runs static analysis tools
- [Scan Dependencies](github-actions/scan-dependencies.html) - Scans for dependency vulnerabilities
- [Scan Secrets](github-actions/scan-secrets.html) - Scans Git history for secrets
- [Setup](github-actions/setup.html) - Installs dependencies and runs make config
- [Sync Template Repo](github-actions/sync-template-repo.html) - Syncs repository template changes
- [Trivy](github-actions/trivy.html) - General Trivy security scanner
- [Trivy IaC](github-actions/trivy-iac.html) - Scans Terraform IaC with Trivy
- [Trivy Package](github-actions/trivy-package.html) - Scans packages with Trivy

## Usage

Reference actions in your workflow files:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: NHSDigital/nhs-notify-shared-modules/.github/actions/setup@v1.0.0

      - uses: NHSDigital/nhs-notify-shared-modules/.github/actions/scan-secrets@v1.0.0
```

Replace `v1.0.0` with the latest release tag.
