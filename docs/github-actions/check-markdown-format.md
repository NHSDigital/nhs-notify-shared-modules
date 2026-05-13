---
layout: default
title: Check Markdown Format
parent: GitHub Actions
grand_parent: Home
nav_order: 4
---

## Check Markdown Format

Checks Markdown files for formatting issues using markdownlint.

### Description

This composite action validates Markdown files against markdownlint rules to ensure consistent documentation formatting.

### Usage

```yaml
jobs:
  check-markdown:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check Markdown format
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/check-markdown-format@v1.0.0
```

### Details

- Tool: markdownlint
- Checks: Markdown syntax, formatting consistency
- Configuration: Repository-specific markdownlint rules
