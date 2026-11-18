# NHS Notify Shared Modules

[![CI/CD Pull Request](https://github.com/NHSDigital/nhs-notify-shared-modules/actions/workflows/cicd-1-pull-request.yaml/badge.svg)](https://github.com/NHSDigital/nhs-notify-shared-modules/actions/workflows/cicd-1-pull-request.yaml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=NHSDigital_nhs-notify-shared-modules&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=NHSDigital_nhs-notify-shared-modules)

**Reusable infrastructure modules, pre-commit/prek hooks, and GitHub Actions for NHS Notify services.**

This repository provides shared resources to maintain consistency, security, and quality across all NHS Notify service repositories.

## Local setup

For the standard mise and prek setup procedure, see [PLAT-KOP-027 - Local Setup for Mise Prek](https://nhsd-confluence.digital.nhs.uk/spaces/RIS/pages/1559872281/PLAT-KOP-027+-+Local+Setup+for+Mise+Prek).

### Prerequisites

Local development requires Git, GNU make 3.82 or later, GNU sed, GNU grep, coreutils, and binutils. Docker is needed for container-based tests. See the KOP above for mise and prek setup.

### macOS

Install the host tools with [Homebrew](https://brew.sh/):

```shell
brew install make gnu-sed grep coreutils binutils
```

Follow Homebrew's instructions to add GNU make and the GNU utilities to your `PATH`.

### Ubuntu or Debian on WSL

Install the Linux prerequisites inside your distribution, not in PowerShell:

```shell
sudo apt update
sudo apt install -y build-essential make gawk sed grep coreutils binutils
```

For container-based tests, use Docker Desktop with WSL integration or install a compatible runtime in the distribution.

### Configuration

From the repository root, run `make config` to install the pinned tools and configure the repository's Git hooks with prek:

```shell
make config
```

Run `make githooks-run` to run the repository hooks manually.

## Documentation

> [View Full Documentation on GitHub Pages](https://nhsdigital.github.io/nhs-notify-shared-modules/)

The documentation site provides comprehensive guides for:

- **[Terraform Modules](https://nhsdigital.github.io/nhs-notify-shared-modules/#-terraform-modules)** - Reusable IaC components
- **[Pre-commit Hooks](https://nhsdigital.github.io/nhs-notify-shared-modules/pre-commit-hooks.html)** - Code quality and security checks
- **[GitHub Actions](https://nhsdigital.github.io/nhs-notify-shared-modules/github-actions.html)** - Reusable workflow actions
