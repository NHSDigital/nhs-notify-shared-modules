---
layout: default
title: Build Docs
parent: GitHub Actions
grand_parent: Home
nav_order: 1
---

## Build Docs

Builds Jekyll documentation site.

### Description

This composite action builds the Jekyll documentation site by:

1. Setting up Node.js (v22)
2. Installing npm dependencies
3. Setting up Ruby 3.2 and bundler
4. Building the Jekyll site with production settings
5. Uploading the built site as a Pages artifact

### Inputs

| Name | Description | Required |
|------|-------------|----------|
| `version` | Version number for the documentation build | Yes |

### Usage

```yaml
jobs:
  build-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build documentation
        uses: NHSDigital/nhs-notify-shared-modules/.github/actions/build-docs@v1.0.0
        with:
          version: "1.2.3"
```

### Details

- Node workspaces: `docs`, `src/cloudevents`
- Ruby version: 3.2
- Jekyll environment: production
- Output directory: `docs/_site/`
- Automatically uploads artifact for GitHub Pages deployment
