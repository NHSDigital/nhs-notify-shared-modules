---
layout: default
title: Scan Dependencies
parent: GitHub Actions
grand_parent: Home
nav_order: 10
---

## Scan Dependencies

Scans project dependencies for known vulnerabilities.

### Description

This composite action scans project dependencies to identify known security vulnerabilities.
It always produces the SBOM, raw Grype JSON report, and markdown summary, and it fails the workflow when High or Critical vulnerabilities are present unless the triggering PR carries a configured skip label.

### Usage

```yaml
jobs:
  scan-deps:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
    steps:
      - uses: actions/checkout@v4

      - name: Scan dependencies
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/scan-dependencies@v1.0.0
        with:
          build_datetime: "${{ needs.metadata.outputs.build_datetime }}"
          build_timestamp: "${{ needs.metadata.outputs.build_timestamp }}"
          skip_if_pr_has_label: grype-ignore-high-and-critical
```

### Details

- Scans: npm packages, Ruby gems, Python packages
- Checks: Known vulnerabilities or CVE
- Reports: SBOM JSON, Grype JSON, and markdown summary
- Alerts: High and Critical vulnerabilities fail by default

### Ignore File

If a repository contains a file at `scripts/config/grype.yaml`, each non-comment line is treated as a Grype vulnerability ID to suppress. For example:

```text
CVE-2026-25128 # Ticket to review: CCM-14317
GHSA-xxxx-yyyy-zzzz
```

### Skip Label

Set `skip_if_pr_has_label` to a PR label name if you need to skip the blocking failure for known High or Critical findings that are already being handled elsewhere.

- The scan still runs.
- Reports and summaries are still uploaded.
- Only the final blocking failure is skipped when the label is present.

The default label is `skip-dependencies-check`.
