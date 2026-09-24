import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';

import { parseCliArgs } from './args';
import { compareRelease } from './compare';
import {
  collectCommitsForTags,
  getPreviousTag,
  getRepoName,
  getRepoRoot,
  resolveGitTags,
  resolveRepoPath,
} from './git';
import { readReleaseNotesForTags } from './github-release';
import {
  fetchJiraIssues,
  fetchJiraIssuesByKeys,
  resolveJiraVersions,
  updateJiraIssueClinicalReviewStatus,
  updateJiraIssueFixVersions,
} from './jira';
import {
  defaultReportPath,
  renderFixProposalSection,
  renderReport,
} from './report';
import type {
  FixProposal,
  JiraIssue,
  JiraIssueFixDetails,
  JiraVersion,
  SelectedGitTag,
} from './types';

const writeReport = async (
  outputPath: string,
  report: string,
): Promise<void> => {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, report, 'utf8');
};

const dedupeBy = <T>(items: T[], getKey: (item: T) => string): T[] => {
  const seenKeys = new Set<string>();
  const dedupedItems: T[] = [];

  for (const item of items) {
    const key = getKey(item);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      dedupedItems.push(item);
    }
  }

  return dedupedItems;
};

const formatGitTagSummary = (gitTags: SelectedGitTag[]): string =>
  gitTags.map(({ gitTag }) => gitTag).join(', ');

const formatComparisonBaseSummary = (gitTags: SelectedGitTag[]): string =>
  gitTags
    .map(
      ({ gitTag, previousTag }) =>
        `${gitTag} <- ${previousTag ?? 'repository start'}`,
    )
    .join('; ');

const formatJiraVersionSummary = (jiraVersions: JiraVersion[]): string =>
  jiraVersions.map((version) => `${version.name} (${version.id})`).join(', ');

const getFixActionLabel = (fixAction: string): string =>
  fixAction === 'clinical-review-not-needed'
    ? 'clinical review status'
    : 'fixVersion';

const formatFixVersions = (
  fixVersions: JiraIssueFixDetails['fixVersions'],
): string =>
  fixVersions.length > 0
    ? fixVersions.map(({ name }) => name).join(', ')
    : 'none';

const dedupeIssuesByKey = <T extends { key: string }>(issues: T[]): T[] =>
  dedupeBy(issues, (issue) => issue.key);

const resolveSelectedGitTags = (
  repoRoot: string,
  gitTagSelectors: string[],
  previousTag?: string,
): SelectedGitTag[] =>
  resolveGitTags(repoRoot, gitTagSelectors).map((gitTag, index) => ({
    gitTag,
    previousTag: getPreviousTag(
      repoRoot,
      gitTag,
      index === 0 ? previousTag : undefined,
    ),
  }));

const getOutsideReleaseIssueKeys = (
  comparison: ReturnType<typeof compareRelease>,
): string[] =>
  dedupeBy(
    [
      ...comparison.commitsWithIssueKeysOutsideRelease.flatMap(
        ({ missingKeys }) => missingKeys,
      ),
      ...comparison.releaseNotesIssueKeysOutsideRelease,
    ],
    (issueKey) => issueKey,
  );

const buildFixProposals = (
  fixAction: NonNullable<ReturnType<typeof parseCliArgs>['fixAction']>,
  issues: JiraIssueFixDetails[],
  component: string,
  targetVersion: JiraVersion,
): FixProposal[] => {
  const componentIssues = issues
    .filter((issue) => issue.components.includes(component))
    .toSorted((left, right) => left.key.localeCompare(right.key));

  if (fixAction === 'clinical-review-not-needed') {
    return componentIssues
      .filter((issue) => issue.clinicalReviewStatus !== 'Review not needed')
      .map((issue) => ({
        currentValueSummary: issue.clinicalReviewStatus || 'empty',
        issue,
        targetValueSummary: 'Review not needed',
      }));
  }

  return componentIssues
    .filter(
      (issue) =>
        !issue.fixVersions.some(
          (fixVersion) => fixVersion.id === targetVersion.id,
        ),
    )
    .map((issue) => ({
      currentValueSummary: formatFixVersions(issue.fixVersions),
      issue,
      targetValueSummary: targetVersion.name,
    }));
};

const confirmFixApplication = async (
  section: string,
  fixActionLabel: string,
  autoConfirm: boolean,
): Promise<boolean> => {
  process.stdout.write(`${section}\n`);

  if (autoConfirm) {
    return true;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      `Applying ${fixActionLabel} updates requires an interactive terminal unless --yes is provided.`,
    );
  }

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await readline.question(
      `Apply ${fixActionLabel} updates? [y/N] `,
    );
    return /^(y|yes)$/i.test(answer.trim());
  } finally {
    readline.close();
  }
};

const buildFixCandidateIssues = async (
  fixAction: NonNullable<ReturnType<typeof parseCliArgs>['fixAction']>,
  comparison: ReturnType<typeof compareRelease>,
  jiraBaseUrl: string,
  jiraProject: string,
): Promise<JiraIssueFixDetails[]> => {
  if (fixAction === 'clinical-review-not-needed') {
    return dedupeIssuesByKey([
      ...comparison.jiraIssuesMissingClinicalSafetyCategory,
      ...comparison.jiraIssuesMissingClinicalLead,
    ]).map((issue) => ({
      ...issue,
      fixVersions: [],
    }));
  }

  return fetchJiraIssuesByKeys(
    jiraBaseUrl,
    jiraProject,
    dedupeBy(
      comparison.commitsWithIssueKeysOutsideRelease.flatMap(
        ({ missingKeys }) => missingKeys,
      ),
      (issueKey) => issueKey,
    ),
  );
};

const applyFixProposal = async (
  jiraBaseUrl: string,
  fixAction: NonNullable<ReturnType<typeof parseCliArgs>['fixAction']>,
  proposal: FixProposal,
  jiraVersion: JiraVersion,
): Promise<void> => {
  if (fixAction === 'clinical-review-not-needed') {
    await updateJiraIssueClinicalReviewStatus(jiraBaseUrl, proposal.issue.key);
    return;
  }

  await updateJiraIssueFixVersions(jiraBaseUrl, proposal.issue.key, [
    ...proposal.issue.fixVersions,
    {
      id: jiraVersion.id,
      name: jiraVersion.name,
    },
  ]);
};

export const run = async (argv: string[]): Promise<void> => {
  const options = parseCliArgs(argv);
  const repoPath = resolveRepoPath(options.repo);
  const repoRoot = getRepoRoot(repoPath);
  const repoName = getRepoName(repoRoot);
  const selectedGitTags = resolveSelectedGitTags(
    repoRoot,
    options.gitTagSelectors,
    options.previousTag,
  );
  const commits = collectCommitsForTags(repoRoot, selectedGitTags);

  const jiraVersions = await resolveJiraVersions(
    options.jiraBaseUrl,
    options.jiraProject,
    options.jiraVersionSelectors,
  );
  const jiraIssuesByVersion = await Promise.all(
    jiraVersions.map((jiraVersion) =>
      fetchJiraIssues(options.jiraBaseUrl, options.jiraProject, jiraVersion),
    ),
  );
  const jiraIssues = dedupeBy(
    jiraIssuesByVersion.flat(),
    (issue: JiraIssue) => issue.key,
  );
  const releaseNotes = await readReleaseNotesForTags(
    repoRoot,
    selectedGitTags.map(({ gitTag }) => gitTag),
    options.releaseNotesSource,
  );
  const comparison = compareRelease(
    commits,
    jiraIssues,
    releaseNotes.issueKeys,
  );
  const outsideReleaseIssueKeys = getOutsideReleaseIssueKeys(comparison);
  const outsideReleaseIssues = await fetchJiraIssuesByKeys(
    options.jiraBaseUrl,
    options.jiraProject,
    outsideReleaseIssueKeys,
  );
  const outsideReleaseIssuesByKey = new Map(
    outsideReleaseIssues.map((issue) => [issue.key, issue]),
  );
  let fixProposals: FixProposal[] | undefined;

  if (options.fixAction) {
    if (selectedGitTags.length !== 1 || jiraVersions.length !== 1) {
      throw new Error(
        'Option --fix currently requires exactly one resolved git tag and one resolved Jira version.',
      );
    }

    const fixCandidateIssues = await buildFixCandidateIssues(
      options.fixAction,
      comparison,
      options.jiraBaseUrl,
      options.jiraProject,
    );

    fixProposals = buildFixProposals(
      options.fixAction,
      fixCandidateIssues,
      options.fixComponent!,
      jiraVersions[0],
    );
  }

  const outputPath = path.resolve(
    options.output ??
      defaultReportPath(
        repoName,
        selectedGitTags.map(({ gitTag }) => gitTag),
      ),
  );
  const report = renderReport({
    comparison,
    fixAction: options.fixAction,
    fixComponent: options.fixComponent,
    fixProposals,
    gitTags: selectedGitTags,
    jiraProject: options.jiraProject,
    jiraVersions,
    releaseNotes,
    repoName,
    repoRoot,
    outsideReleaseIssuesByKey,
    totalJiraIssues: jiraIssues.length,
  });

  await writeReport(outputPath, report);

  if (options.fixAction && fixProposals) {
    const fixActionLabel = getFixActionLabel(options.fixAction);
    const proposalSection = renderFixProposalSection(
      fixActionLabel,
      options.fixComponent!,
      fixProposals,
      comparison.commitsByIssueKey,
    );
    const confirmed = await confirmFixApplication(
      proposalSection,
      fixActionLabel,
      options.yes,
    );

    if (confirmed) {
      for (const proposal of fixProposals) {
        await applyFixProposal(
          options.jiraBaseUrl,
          options.fixAction,
          proposal,
          jiraVersions[0],
        );
      }

      process.stdout.write(
        `Applied ${fixActionLabel} updates to ${fixProposals.length} issue(s).\n`,
      );
    } else {
      process.stdout.write(
        `Aborted without applying ${fixActionLabel} updates.\n`,
      );
    }
  }

  const summaryLines = [
    `Repository: ${repoName}`,
    selectedGitTags.length === 1
      ? `Git tag: ${selectedGitTags[0].gitTag}`
      : `Git tags selected (${selectedGitTags.length}): ${formatGitTagSummary(selectedGitTags)}`,
    selectedGitTags.length === 1
      ? `Comparison base: ${selectedGitTags[0].previousTag ?? 'repository start'}`
      : `Comparison bases: ${formatComparisonBaseSummary(selectedGitTags)}`,
    `Commits inspected: ${commits.length}`,
    jiraVersions.length === 1
      ? `Jira version: ${jiraVersions[0].name} (${jiraVersions[0].id})`
      : `Jira versions selected (${jiraVersions.length}): ${formatJiraVersionSummary(jiraVersions)}`,
    `Jira issues in ${jiraVersions.length === 1 ? 'release' : 'selected releases'}: ${jiraIssues.length}`,
    `Jira issues missing from git: ${comparison.jiraIssuesMissingFromGit.length}`,
    `Jira issues missing from release notes: ${comparison.jiraIssuesMissingFromReleaseNotes.length}`,
    `Referenced Jira issues not done: ${comparison.releaseReferencedIssuesNotDone.length}`,
    `Jira issues missing clinical safety category: ${comparison.jiraIssuesMissingClinicalSafetyCategory.length}`,
    `Jira issues missing clinical lead: ${comparison.jiraIssuesMissingClinicalLead.length}`,
    `Commits without Jira matches: ${comparison.commitsWithoutMatches.length}`,
    `Report written to ${outputPath}`,
  ];

  process.stdout.write(`${summaryLines.join('\n')}\n`);
};
