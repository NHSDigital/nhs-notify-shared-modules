# NHS Notify Shared Modules

[![CI/CD Pull Request](https://github.com/NHSDigital/nhs-notify-shared-modules/actions/workflows/cicd-1-pull-request.yaml/badge.svg)](https://github.com/NHSDigital/nhs-notify-shared-modules/actions/workflows/cicd-1-pull-request.yaml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=NHSDigital_nhs-notify-shared-modules&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=NHSDigital_nhs-notify-shared-modules)

**Reusable infrastructure modules, pre-commit/prek hooks, and GitHub Actions for NHS Notify services.**

This repository provides shared resources to maintain consistency, security, and quality across all NHS Notify service repositories.

## Local setup

Install mise using the instructions for your operating system, activate it in your shell, and run `make config`. This installs the versions locked in `mise.toml` and `mise.lock` and configures the repository Git hooks with prek.

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
