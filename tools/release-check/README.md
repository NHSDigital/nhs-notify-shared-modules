# release-check

Compares a local repository release tag, or a selected set of release tags, against one or more Jira release versions and reports mismatches across:

- git commit history for the selected release ranges
- Jira issues assigned to the selected release versions
- release notes, using the GitHub release body when available
- Jira ticket hygiene: every ticket is assigned to an epic, and every epic is linked to the expected NWR

## Usage

From the shared-modules repository root, using the workspace script:

```bash
pnpm release-check -- --repo ../nhs-notify-client-config --git-tag 0.1.0 --jira-version 71260
```

Or directly from the package, using its local `check` script:

```bash
pnpm --filter @nhsdigital/nhs-notify-release-check run check -- --repo ../nhs-notify-client-config --git-tag 0.1.0 --jira-version 71260
```

## Multi-release usage

Multi-release mode is mainly intended for cases like an initial production release, where we want to validate the full set of tickets that make up the build being released to prod for the first time.

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

## Commit ticket mappings

If a commit carries the wrong Jira issue number, you can provide a mapping file to substitute the release-check ticket detection for specific commits.

When present, the tool automatically looks for a file called `.jira-commits` in the root of the target repository. Use `--commit-mapping-file` if you want to point at a different file instead.

```bash
pnpm release-check -- \
  --repo ../nhs-notify-client-config \
  --git-tag v0.2.0 \
  --jira-version client-config-0.2.0 \
  --commit-mapping-file .release-check/commit-mappings.txt
```

Example mapping file format:

```text
# <commit-hash> <replacement-jira-key>
2f6c9d1 CCM-12081
4ab12cd CCM-22822
```

Notes for commit mappings:

- `.jira-commits` is auto-detected from the target repository root.
- Relative paths passed to `--commit-mapping-file` are resolved from the target repository root.
- Hashes can be 7-40 hexadecimal characters, as long as they uniquely identify one selected commit.
- The mapped Jira key replaces the detected key for reporting and fix workflows.
- Reports mark mapped commits explicitly so reviewers can see where a substitution was applied.

## Epic and NWR checks

Every report also validates the Jira tickets in the selected release(s) against the CCM ticket creation rules in `co-jira`:

- every ticket must have an Epic Link (`customfield_10005`); `Epic` and `Sub-task` issue types are exempt
- every epic must be linked to the NWR ticket using the `NWR` issue link type (`jira issue link NWR-2198 <EPIC> "NWR"`)

Epics are checked whether they are in the release or only referenced by a release ticket (the latter are fetched from Jira). An epic is reported when it cannot be found, when the Epic Link points at a non-epic, when it has no `NWR` link, or when it is only linked to a different NWR.

The expected NWR defaults to `NWR-2198`. Override it with `--nwr-key`:

```bash
pnpm release-check -- --repo ../nhs-notify-client-config --git-tag 0.1.0 --jira-version 71260 --nwr-key NWR-2198
```

### Linking epics to the NWR

`--fix link-nwr` adds the `NWR` link to every epic the report lists as having no NWR link. The target is the `--nwr-key` ticket (default `NWR-2198`), so one run fixes them all:

```bash
pnpm release-check -- \
  --repo ../nhs-notify-client-config \
  --git-tag v0.2.0 \
  --jira-version client-config-0.2.0 \
  --fix link-nwr
```

Example output (confirm with `y`, or add `--yes` to skip the prompt):

```text
Proposed NWR link updates

Issue                                      Commit  Proposed update
CCM-24285: [Platform] Client config prod   -       no NWR link -> linked to NWR-2198
CCM-24286: [Platform] Provide non-prod...  -       no NWR link -> linked to NWR-2198

Apply NWR link updates? [y/N] y
Applied NWR link updates to 2 issue(s).
```

- Only epics with no NWR link are proposed; epics linked to a different NWR are reported but never changed.
- Add `--fix-component <component>` to limit the run to epics carrying that component.
- Multiple git tags and Jira versions are accepted, so the whole set of epics from a multi-release check can be fixed in one go.
- The report prints this command, ready to run, under "Example link-nwr command".

### Assigning tickets to an epic

The report lists every epic used by the release tickets under "Epics used by Jira tickets", and prints an editable `assign-epic` command for the tickets that have no epic. `--fix assign-epic` sets the epic on a list of tickets you choose:

```bash
pnpm release-check -- \
  --repo ../nhs-notify-client-config \
  --git-tag v0.2.0 \
  --jira-version client-config-0.2.0 \
  --fix assign-epic \
  --tickets CCM-101,CCM-102 \
  --epic CCM-24285
```

- `--tickets` and `--epic` are the last options so they are easy to edit; the report pre-fills `--tickets` with the unassigned tickets and uses the placeholder `CCM-XXXXX` for `--epic`, which is rejected until you replace it.
- `--fix-component` is not used. Tickets may be in the release or elsewhere in the Jira project.
- The epic must exist and be an `Epic`. `Epic` and `Sub-task` tickets cannot be assigned, and tickets already in the epic are skipped.

## Required environment

- `JIRA_API_TOKEN` or `JIRA_PERSONAL_TOKEN` or `JIRA_TOKEN`

## Optional environment

- `GITHUB_TOKEN` or `GH_TOKEN` for fetching GitHub release notes from private repositories (without one, GitHub returns a 404 for releases in private repositories and release-check falls back to annotated tags)

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

- `--fix` accepts `fix-version`, `clinical-review-not-needed`, `link-nwr` or `assign-epic`.
- `--fix-component` is required for `fix-version` and `clinical-review-not-needed`, optional for `link-nwr`, and not used by `assign-epic`.
- `fix-version` and `clinical-review-not-needed` currently require exactly one resolved git tag and one resolved Jira version.
- The CLI prints the full issue and representative commit list before applying updates.
- By default the CLI asks for confirmation before changing Jira.
- Use `--yes` to skip the confirmation prompt in non-interactive automation.

## Notes

- Example fix commands in reports default to `npm run check -- --repo <repo> ...`. Wrapper scripts can set `RELEASE_CHECK_COMMAND` (for example `pnpm run release-check --`) so reports show the exact command users run locally. The wrapper is expected to supply `--repo` itself, so it is omitted from the generated commands.
- The tool auto-detects the previous tag using `git describe --tags --abbrev=0 <tag>^`.
- When GitHub release notes are unavailable, auto mode falls back to annotated tag notes if the tag is annotated.
- When no release notes are available from either source, release-note mismatch sections are omitted from the report so it does not imply a comparison was made.
- Reports default to `.reports/release-check/<repo>-<tag>.md` for single-release checks.
- Multi-release reports default to `.reports/release-check/<repo>-<first-tag>-to-<last-tag>-<count>-tags.md`.
- Epic issues are labelled as `[Epic]` in report rows so they are visible in the same tables as other Jira issues.
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

Then install and use the published CLI binary:

```bash
pnpm add -D @nhsdigital/nhs-notify-release-check
pnpm exec release-check --repo ../nhs-notify-client-config --git-tag 0.1.0 --jira-version 71260
```
