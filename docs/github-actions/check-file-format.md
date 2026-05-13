---
layout: default
title: Check File Format
parent: GitHub Actions
grand_parent: Home
nav_order: 3
---

## Check File Format

Validates file formatting standards across the repository.

### Description

This composite action checks files for formatting issues and ensures consistent formatting standards.

### Usage

```yaml
jobs:
  check-format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check file formatting
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/check-file-format@v1.0.0
```

### Details

- Validates file formatting consistency
- Enforces repository formatting standards
- Runs across all file types
