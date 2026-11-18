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

Run these commands inside your Linux distribution, not in PowerShell. The mise installer is documented in the [official Linux instructions](https://mise.jdx.dev/installing-mise.html):

```shell
sudo apt update
sudo apt install -y build-essential make gawk sed grep coreutils binutils curl
curl -fsSL https://mise.run | sh
```

The installer places mise at `~/.local/bin/mise`. If `~/.local/bin` is not already on your `PATH`, add it to your shell startup file before the mise activation command:

```shell
export PATH="$HOME/.local/bin:$PATH"
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
      path=("${path[@]:#$HOME/.asdf/shims}")
      export PATH="$HOME/.asdf/shims:$PATH"
      ;;
    *)
      print -u2 "Usage: activate mise|asdf"
      return 2
      ;;
  esac
  rehash
}
```

Restart the terminal or reload your shell configuration. From the repository root, review `mise.toml` and run `mise trust` once if mise reports that the configuration is untrusted. Trust is stored locally and does not change repository files:

```shell
mise trust
```

Run `make config` to install the pinned tools and configure the repository's Git hooks with prek:

```shell
make config
```

Run `make githooks-run` to run the repository hooks manually.

### Updating pinned tool versions

After changing `mise.toml`, run `mise lock`, review the updated `mise.lock`, and commit both files. `make config` uses locked installs and does not update the lockfile.

## Documentation

> [View Full Documentation on GitHub Pages](https://nhsdigital.github.io/nhs-notify-shared-modules/)

The documentation site provides comprehensive guides for:

- **[Terraform Modules](https://nhsdigital.github.io/nhs-notify-shared-modules/#-terraform-modules)** - Reusable IaC components
- **[Pre-commit Hooks](https://nhsdigital.github.io/nhs-notify-shared-modules/pre-commit-hooks.html)** - Code quality and security checks
- **[GitHub Actions](https://nhsdigital.github.io/nhs-notify-shared-modules/github-actions.html)** - Reusable workflow actions
