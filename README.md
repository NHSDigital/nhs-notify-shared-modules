# NHS Notify Shared Modules

[![CI/CD Pull Request](https://github.com/NHSDigital/nhs-notify-shared-modules/actions/workflows/cicd-1-pull-request.yaml/badge.svg)](https://github.com/NHSDigital/nhs-notify-shared-modules/actions/workflows/cicd-1-pull-request.yaml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=NHSDigital_nhs-notify-shared-modules&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=NHSDigital_nhs-notify-shared-modules)

**Reusable infrastructure modules, pre-commit/prek hooks, and GitHub Actions for NHS Notify services.**

This repository provides shared resources to maintain consistency, security, and quality across all NHS Notify service repositories.

## Local setup

### Prerequisites

Local development requires Git, mise, GNU make 3.82 or later, GNU sed, GNU grep, coreutils, and binutils. Docker is needed for container-based tests.

### macOS

Install the host tools with [Homebrew](https://brew.sh/):

```shell
brew install mise make gnu-sed grep coreutils binutils
```

Follow Homebrew's instructions to add GNU make and the GNU utilities to your `PATH`.

### Ubuntu or Debian on WSL

Run these commands inside your Linux distribution, not in PowerShell. Install mise using the [official Linux instructions](https://mise.jdx.dev/installing-mise.html):

```shell
sudo apt update
sudo apt install -y build-essential make gawk sed grep coreutils binutils curl
```

For container-based tests, use Docker Desktop with WSL integration or install a compatible runtime in the distribution.

### Configuration

Activate mise in your shell. For zsh, add this to `~/.zshrc`; for Bash, add it to `~/.bashrc`:

```zsh
eval "$(mise activate zsh)"
```

```bash
eval "$(mise activate bash)"
```

Restart the terminal or reload your shell configuration, then run `make config`. This installs the versions locked in `mise.toml` and `mise.lock` and configures the repository Git hooks with prek.

Keep `asdf` installed while working in repositories that have not migrated. Personal shell configuration is user-managed; this repository does not edit host shell configuration. Z shell users who work across both types of repository can add this optional function to `~/.zshrc`:

```zsh
function activate() {
  case "$1" in
    mise)
      path=("${path[@]:#$HOME/.asdf/shims}")
      eval "$(mise activate zsh)"
      ;;
    asdf)
      mise deactivate
      path=("$HOME/.asdf/shims" "${path[@]:#$HOME/.asdf/shims}")
      source "$HOME/.asdf/asdf.sh"
      ;;
    *)
      print -u2 "Usage: activate mise|asdf"
      return 2
      ;;
  esac
  rehash
}
```

## Documentation

> [View Full Documentation on GitHub Pages](https://nhsdigital.github.io/nhs-notify-shared-modules/)

The documentation site provides comprehensive guides for:

- **[Terraform Modules](https://nhsdigital.github.io/nhs-notify-shared-modules/#-terraform-modules)** - Reusable IaC components
- **[Pre-commit Hooks](https://nhsdigital.github.io/nhs-notify-shared-modules/pre-commit-hooks.html)** - Code quality and security checks
- **[GitHub Actions](https://nhsdigital.github.io/nhs-notify-shared-modules/github-actions.html)** - Reusable workflow actions
