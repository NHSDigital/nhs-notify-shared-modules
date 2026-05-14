---
layout: default
title: Trivy IaC
parent: GitHub Actions
grand_parent: Home
nav_order: 15
---

## Trivy IaC

Scans Terraform Infrastructure as Code using Trivy.

### Description

This composite action scans Terraform code for security misconfigurations and compliance issues.

### Usage

```yaml
jobs:
  scan-iac:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Scan Terraform IaC
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/trivy-iac@v1.0.0
```

### Details

- Tool: Trivy IaC scanner
- Targets: Terraform (.tf) files
- Checks: Security misconfigurations
- Standards: AWS security best practices
- Reports: Terraform-specific vulnerabilities

### What It Detects

- Insecure resource configurations
- Missing encryption settings
- Public access misconfigurations
- IAM permission issues
- Non-compliant security group rules
