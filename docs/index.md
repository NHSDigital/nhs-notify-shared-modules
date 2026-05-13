---
layout: default
title: Home
nav_order: 1
has_children: true
---

## NHS Notify Shared Modules

Reusable infrastructure modules, pre-commit hooks, and GitHub Actions for NHS Notify services.

### [Terraform Modules](terraform-modules.html)

Production-ready Terraform modules for AWS infrastructure including Lambda functions, KMS keys, S3 buckets, SQS queues, EventBridge publishers, and more.

**Quick Start:**

```hcl
module "lambda_function" {
  source = "github.com/NHSDigital/nhs-notify-shared-modules//infrastructure/terraform/modules/lambda?ref=vX.Y.Z"

  function_name = "my-function"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
}
```

[View all Terraform modules →](terraform-modules.html)

### [Pre-commit Hooks](pre-commit-hooks.html)

Code quality and security hooks for secret scanning, file format checking, Markdown linting, Vale writing checks, Terraform validation, and more.

**Quick Start:**

```yaml
repos:
  - repo: https://github.com/NHSDigital/nhs-notify-shared-modules
    rev: vX.Y.Z
    hooks:
      - id: scan-secrets
      - id: lint-terraform
      - id: check-todo-usage
```

[View all pre-commit hooks →](pre-commit-hooks.html)

### [GitHub Actions](github-actions.html)

Composite actions for CI/CD including setup, documentation builds, security scanning, dependency checks, Terraform linting, static analysis, and more.

**Quick Start:**

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: NHSDigital/nhs-notify-shared-modules/.github/actions/setup@vX.Y.Z
      - uses: NHSDigital/nhs-notify-shared-modules/.github/actions/scan-secrets@vX.Y.Z
```

[View all GitHub Actions →](github-actions.html)
