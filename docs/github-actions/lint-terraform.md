---
layout: default
title: Lint Terraform
parent: GitHub Actions
grand_parent: Home
nav_order: 8
---

## Lint Terraform

Lints and formats Terraform code.

### Description

This composite action validates Terraform code formatting using `terraform fmt`.

### Usage

```yaml
jobs:
  lint-terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup mise
        uses: jdx/mise-action@v4

      - name: Lint Terraform
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/lint-terraform@v1.0.0
```

### Details

- Requires: `mise` on the runner's `PATH` and Terraform pinned in the repository's `mise.toml` and `mise.lock`
- Tool: `terraform fmt`
- Checks: Terraform code formatting
- Validates: HCL syntax and style
- Ensures: Consistent formatting across IaC
