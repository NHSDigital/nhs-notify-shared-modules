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
        uses: jdx/mise-action@c2a87611a18de5b3828c5652fe268e992400cb5c # v4.3.0

      - name: Lint Terraform
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/lint-terraform@v1.0.0
```

### Details

- The caller must set up a version manager before this action. For migrated repositories, set up mise as shown above. Legacy repositories should retain their existing version-manager setup.
- Installs Terraform from `mise.lock` when the checkout has `mise.toml`; otherwise installs it using the legacy version manager and `.tool-versions`. If neither manager is available, Terraform must already be on `PATH`.
- Tool: `terraform fmt`
- Checks: Terraform code formatting
- Validates: HCL syntax and style
- Ensures: Consistent formatting across IaC
