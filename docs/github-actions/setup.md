---
layout: default
title: Setup
parent: GitHub Actions
grand_parent: Home
nav_order: 12
---

## Setup

Installs dependencies and executes make config.

### Description

This composite action runs the repository setup script to install all required dependencies and configure the development environment.

### Usage

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup environment
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/setup@v1.0.0

      - name: Run tests
        run: make test
```

### Details

- Runs: `scripts/setup/setup.sh`
- Installs: All development dependencies
- Configures: Development environment
- Prepares: Repository for build/test operations

### What Gets Installed

- asdf/mise tools from `.tool-versions`
- Ruby gems via Bundler
- Node packages via npm/pnpm
- Python packages via pip
- Pre-commit hooks
