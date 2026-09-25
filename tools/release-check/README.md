# release-check

Compares a local repository release tag, or a selected set of release tags, against one or more Jira release versions and reports mismatches across:

- git commit history for the selected release ranges
- Jira issues assigned to the selected release versions
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

## Multi-release usage

Explicit list selection:

```bash
pnpm release-check -- \
  --repo ../nhs-notify-client-config \
  --git-tags 0.1.0,v0.2.0,v0.3.0,v0.3.1 \
  --jira-versions client-config-0.1.0,client-config-0.2.0,client-config-0.3.0,client-config-0.3.1
```

Wildcard selection against tag and Jira version names:

```bash
pnpm release-check -- \
  --repo ../nhs-notify-client-config \
  --git-tags '0.1.0,v0.2.*,v0.3.*' \
  --jira-versions 'client-config-0.1.0,client-config-0.2.*,client-config-0.3.*'
```

Notes for multi-release mode:

- `--git-tags` and `--jira-versions` accept comma-separated selectors.
- Selectors can be exact values or glob-style patterns using `*` and `?`.
- Multiple selected git tags are expanded in repository tag order.
- Commit history is aggregated by collecting each selected release range and de-duplicating overlapping commits.
- Multiple selected Jira versions are aggregated into one issue set before comparison.

## Required environment

- `JIRA_API_TOKEN` or `JIRA_PERSONAL_TOKEN` or `JIRA_TOKEN`

## Optional environment

- `GITHUB_TOKEN` or `GH_TOKEN` for fetching GitHub release notes from private repositories

## Fix workflows

The CLI can also prepare and optionally apply targeted Jira updates for a single
resolved release pair.

### Add the selected Jira fix version to git-referenced issues outside the release

```bash
pnpm release-check -- \
  --repo ../nhs-notify-client-config \
  --git-tag v0.2.0 \
  --jira-version client-config-0.2.0 \
  --fix fix-version \
  --fix-component onboarding-journey-improvements
```

### Mark clinical review as not needed for a component-scoped subset

```bash
pnpm release-check -- \
  --repo ../nhs-notify-client-config \
  --git-tag v0.3.0 \
  --jira-version client-config-0.3.0 \
  --fix clinical-review-not-needed \
  --fix-component onboarding-journey-improvements
```

Notes for fix mode:

- `--fix` accepts `fix-version` or `clinical-review-not-needed`.
- `--fix-component` is required and scopes the proposed Jira updates.
- Fix mode currently requires exactly one resolved git tag and one resolved Jira version.
- The CLI prints the full issue and representative commit list before applying updates.
- By default the CLI asks for confirmation before changing Jira.
- Use `--yes` to skip the confirmation prompt in non-interactive automation.

## Notes

- The tool auto-detects the previous tag using `git describe --tags --abbrev=0 <tag>^`.
- When GitHub release notes are unavailable, auto mode falls back to annotated tag notes if the tag is annotated.
- Reports default to `.tmp/release-check/<repo>-<tag>.md` for single-release checks.
- Multi-release reports default to `.tmp/release-check/<repo>-<first-tag>-to-<last-tag>-<count>-tags.md`.
- Reports are emitted as Markdown so they can be inspected in a Markdown preview.

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
