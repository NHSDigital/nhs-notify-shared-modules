---
layout: default
title: Perform Static Analysis
parent: GitHub Actions
grand_parent: Home
nav_order: 9
---

## Perform Static Analysis

Runs static analysis tools on the codebase.

### Description

This composite action performs static code analysis to identify potential issues and code quality problems.

### Usage

```yaml
jobs:
  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run static analysis
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/perform-static-analysis@v1.0.0
```

### Details

- Performs static code analysis
- Identifies code quality issues
- Detects potential bugs
- Ensures code quality standards
