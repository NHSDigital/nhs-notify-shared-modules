---
layout: default
title: Scan Secrets
parent: GitHub Actions
grand_parent: Home
nav_order: 11
---

## Scan Secrets

Scans the entire Git history for secrets and sensitive information.

### Description

This composite action scans the Git history to detect accidentally committed secrets, credentials, and sensitive data.

### Usage

```yaml
jobs:
  scan-secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history required

      - name: Scan for secrets
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/scan-secrets@v1.0.0
```

### Details

- Scans: Full Git history
- Detects: API keys, passwords, tokens, certificates
- Tools: Secret scanning tools
- Scope: All commits, all branches

### Important Notes

- Requires full Git history (`fetch-depth: 0`)
- Runs on entire repository history
- Prevents accidental credential exposure
