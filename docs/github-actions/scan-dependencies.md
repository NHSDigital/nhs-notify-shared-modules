---
layout: default
title: Scan Dependencies
parent: GitHub Actions
grand_parent: Home
nav_order: 10
---

## Scan Dependencies

Scans project dependencies for known vulnerabilities.

### Description

This composite action scans project dependencies to identify known security vulnerabilities.

### Usage

```yaml
jobs:
  scan-deps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Scan dependencies
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/scan-dependencies@v1.0.0
```

### Details

- Scans: npm packages, Ruby gems, Python packages
- Checks: Known vulnerabilities (CVEs)
- Reports: Security advisories
- Alerts: High-risk dependencies
