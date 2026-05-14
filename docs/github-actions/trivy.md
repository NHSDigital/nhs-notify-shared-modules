---
layout: default
title: Trivy
parent: GitHub Actions
grand_parent: Home
nav_order: 14
---

## Trivy

General Trivy security scanner.

### Description

This composite action runs Trivy security scanner for vulnerability detection.

### Usage

```yaml
jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy scan
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/trivy@v1.0.0
```

### Details

- Tool: Trivy security scanner
- Scans: Multiple security aspects
- Detects: Vulnerabilities, misconfigurations, secrets
- Reports: Security findings

### Related Actions

- [Trivy IaC](trivy-iac.html) - Infrastructure as Code scanning
- [Trivy Package](trivy-package.html) - Package dependency scanning
