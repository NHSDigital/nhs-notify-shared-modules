# release-check design

## Purpose

`release-check` compares git release history, Jira release membership, and release
notes for a repository so that release managers can spot:

- Jira tickets that are in a release but not represented in git
- git-referenced tickets that are outside the selected Jira release scope
- tickets that are referenced but not done
- clinical review metadata gaps

It also supports carefully scoped Jira fix-up actions for a single release pair.

## High-level structure

The package is split into a small set of focused modules:

- [`src/args.ts`](./src/args.ts) parses and validates the CLI contract
- [`src/git.ts`](./src/git.ts) resolves tags and collects commit history
- [`src/jira.ts`](./src/jira.ts) resolves Jira versions, fetches issues, and applies Jira updates
- [`src/github-release.ts`](./src/github-release.ts) reads GitHub or annotated-tag release notes
- [`src/compare.ts`](./src/compare.ts) computes the comparison model from commits, issues, and notes
- [`src/report.ts`](./src/report.ts) renders Markdown reports and fix proposal summaries
- [`src/index.ts`](./src/index.ts) orchestrates the end-to-end flow
- [`src/cli.ts`](./src/cli.ts) is the thin executable entrypoint

## Execution flow

1. Parse CLI options.
2. Resolve the target repository and selected git tags.
3. Collect commits across the selected release ranges.
4. Resolve the selected Jira versions and fetch the issues assigned to them.
5. Read release notes from GitHub releases or annotated tags.
6. Compare commits, Jira issues, and release-note references.
7. Enrich any outside-release issue keys with Jira lookup results where possible.
8. Render a Markdown report.
9. Optionally show a confirmation summary and apply scoped Jira updates.

## Reporting model

The report is Markdown-first so it works well in editor preview panes.

Issue-based sections are rendered as tables rather than nested bullets:

- `Issue` column: Jira key, components, title, and status
- `Commit` column: the first representative commit plus the total commit count

For issue keys that cannot be resolved in Jira, the report keeps the commit
evidence and labels the issue as `not found in Jira`.

## Fix workflows

Two fix actions are currently supported:

- `fix-version`
- `clinical-review-not-needed`

Both actions are intentionally constrained:

- component-scoped via `--fix-component`
- single release pair only
- confirmation shown before changes are applied
- `--yes` required for non-interactive automation

This keeps the first version conservative and easy to audit.

## Extension points

Likely future enhancements:

- richer filtering beyond component-only matching
- multi-release fix inference
- additional Markdown sections or machine-readable exports
- safer dry-run or diff views for Jira mutations
