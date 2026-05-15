---
layout: default
title: Create Lines of Code Report
parent: GitHub Actions
grand_parent: Home
nav_order: 7
---

## Create Lines of Code Report

Counts and reports lines of code in the repository.

### Description

This composite action generates a lines of code report for tracking codebase metrics.

### Usage

```yaml
jobs:
  code-metrics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Count lines of code
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/create-lines-of-code-report@v1.0.0
```

### Details

- Counts lines of code across the repository
- Generates metrics report
- Useful for tracking codebase growth
