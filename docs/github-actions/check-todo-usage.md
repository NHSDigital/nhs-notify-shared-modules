---
layout: default
title: Check TODO Usage
parent: GitHub Actions
grand_parent: Home
nav_order: 6
---

## Check TODO Usage

Validates TODO comments follow the required format with Jira ticket IDs.

### Description

This composite action ensures all TODO comments in code include a Jira ticket reference.

### Usage

```yaml
jobs:
  check-todos:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check TODO usage
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/check-todo-usage@v1.0.0
```

### Format Requirements

TODO comments must include Jira ticket IDs:

- Valid: `// TODO: CCM-1234 - Fix this issue`
- Invalid: `// TODO: Fix this issue`

### Details

- Enforces TODO tracking via Jira
- Prevents orphaned TODO comments
- Ensures accountability for technical debt
