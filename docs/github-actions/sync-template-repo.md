---
layout: default
title: Sync Template Repo
parent: GitHub Actions
grand_parent: Home
nav_order: 13
---

## Sync Template Repo

Synchronizes changes from the nhs-notify-repository-template.

### Description

This composite action keeps the repository synchronized with the latest changes from the NHS Notify repository template.

### Usage

```yaml
jobs:
  sync-template:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Sync with template
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/sync-template-repo@v1.0.0
```

### Details

- Source: `NHSDigital/nhs-notify-repository-template`
- Updates: Shared configurations, workflows, scripts
- Ensures: Consistency across NHS Notify repositories
- Merges: Template changes into current repository

### Use Cases

- Keeping CI/CD workflows up to date
- Synchronizing shared tooling configurations
- Maintaining consistent repository standards
