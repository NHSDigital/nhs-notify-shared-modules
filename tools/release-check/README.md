# release-check

Compares a local repository release tag against a Jira release version and reports mismatches across:

- git commit history since the previous tag
- Jira issues assigned to the release version
- release notes, using the GitHub release body when available

## Usage

From the shared-modules repository root:

```bash
pnpm release-check -- --repo ../nhs-notify-client-config --git-tag 0.1.0 --jira-version 71260
```

Or directly:

```bash
pnpm --filter @nhsdigital/nhs-notify-release-check run check -- --repo ../nhs-notify-client-config --git-tag 0.1.0 --jira-version 71260
```

## Required environment

- `JIRA_API_TOKEN` or `JIRA_PERSONAL_TOKEN` or `JIRA_TOKEN`

## Optional environment

- `GITHUB_TOKEN` or `GH_TOKEN` for fetching GitHub release notes from private repositories

## Notes

- The tool auto-detects the previous tag using `git describe --tags --abbrev=0 <tag>^`.
- When GitHub release notes are unavailable, auto mode falls back to annotated tag notes if the tag is annotated.
- Reports default to `.tmp/release-check/<repo>-<tag>.txt` in the current working directory.

## Publishing

The package is configured for GitHub Packages as `@nhsdigital/nhs-notify-release-check`.

```bash
pnpm --filter @nhsdigital/nhs-notify-release-check pack
pnpm --filter @nhsdigital/nhs-notify-release-check publish --no-git-checks
```

## Consuming from another repository

Add this to the consuming repository's `.npmrc`:

```ini
@nhsdigital:registry=https://npm.pkg.github.com
```

Then install and use the CLI:

```bash
pnpm add -D @nhsdigital/nhs-notify-release-check
pnpm release-check --repo ../nhs-notify-client-config --git-tag 0.1.0 --jira-version 71260
```
