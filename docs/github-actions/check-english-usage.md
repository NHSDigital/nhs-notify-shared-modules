---
layout: default
title: Check English Usage
parent: GitHub Actions
grand_parent: Home
nav_order: 2
---

## Check English Usage

Validates English usage and writing style using Vale.

### Description

This composite action checks English usage, grammar, and style across documentation using Vale linter.

### Usage

```yaml
jobs:
  check-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check English usage
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/check-english-usage@v1.0.0
```

### Details

- Tool: Vale linter
- Checks: Grammar, style, terminology consistency
- Configuration: Repository-specific Vale rules
