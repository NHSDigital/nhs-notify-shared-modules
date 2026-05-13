---
layout: default
title: Check PR Title Format
parent: GitHub Actions
grand_parent: Home
nav_order: 5
---

## Check PR Title Format

Validates pull request titles against the required format.

### Description

This composite action validates that PR titles follow the NHS Notify convention: `CCM-1234: Description`

### Inputs

| Name | Description | Required |
|------|-------------|----------|
| `title` | Pull request title to validate | Yes |

### Usage

```yaml
jobs:
  validate-pr:
    runs-on: ubuntu-latest
    steps:
      - name: Validate PR title
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/check-pr-title-format@v1.0.0
        with:
          title: ${{ github.event.pull_request.title }}
```

### Format Requirements

- Must match pattern: `^CCM-[0-9]+: .+$`
- Example: `CCM-1234: Add new feature`
- Jira ticket prefix required
- Colon and description required
