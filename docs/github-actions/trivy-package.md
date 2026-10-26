---
layout: default
title: Trivy Package
parent: GitHub Actions
grand_parent: Home
nav_order: 16
---

## Trivy Package

Scans project packages and dependencies using Trivy.

### Description

This composite action scans package dependencies for known vulnerabilities using Trivy.

### Usage

```yaml
jobs:
  scan-packages:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Scan packages
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/trivy-package@v1.0.0
```

### Details

- Tool: Trivy package scanner
- Targets: Package manifest files
- Scans: npm, Ruby gems, Python packages
- Checks: Known CVEs and vulnerabilities
- Reports: Dependency security issues

### Package Types Scanned

- Node.js: `package.json`, `package-lock.json`
- Ruby: `Gemfile`, `Gemfile.lock`
- Python: `requirements.txt`, `Pipfile`
