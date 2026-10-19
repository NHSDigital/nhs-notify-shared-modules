import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

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
import { fetchJiraIssues, resolveJiraVersions } from './jira';
import { defaultReportPath, renderReport } from './report';
import type { JiraIssue, JiraVersion, SelectedGitTag } from './types';

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

export const run = async (argv: string[]): Promise<void> => {
  const options = parseCliArgs(argv);
  const repoPath = resolveRepoPath(options.repo);
  const repoRoot = getRepoRoot(repoPath);
  const repoName = getRepoName(repoRoot);
  const selectedGitTagNames = resolveGitTags(repoRoot, options.gitTagSelectors);
  const selectedGitTags = selectedGitTagNames.map((gitTag, index) => ({
    gitTag,
    previousTag: getPreviousTag(
      repoRoot,
      gitTag,
      index === 0 ? options.previousTag : undefined,
    ),
  }));
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

  const outputPath = path.resolve(
    options.output ??
      defaultReportPath(
        repoName,
        selectedGitTags.map(({ gitTag }) => gitTag),
      ),
  );
  const report = renderReport({
    comparison,
    gitTags: selectedGitTags,
    jiraProject: options.jiraProject,
    jiraVersions,
    releaseNotes,
    repoName,
    repoRoot,
    totalJiraIssues: jiraIssues.length,
  });

  await writeReport(outputPath, report);

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
