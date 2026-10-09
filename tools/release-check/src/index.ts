import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { parseCliArgs } from './args';
import { compareRelease } from './compare';
import {
  collectCommits,
  ensureCommitishExists,
  getPreviousTag,
  getRepoName,
  getRepoRoot,
  resolveRepoPath,
} from './git';
import { readReleaseNotes } from './github-release';
import { fetchJiraIssues, resolveJiraVersion } from './jira';
import { defaultReportPath, renderReport } from './report';

const writeReport = async (
  outputPath: string,
  report: string,
): Promise<void> => {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, report, 'utf8');
};

export const run = async (argv: string[]): Promise<void> => {
  const options = parseCliArgs(argv);
  const repoPath = resolveRepoPath(options.repo);
  const repoRoot = getRepoRoot(repoPath);
  ensureCommitishExists(repoRoot, options.gitTag);

  const repoName = getRepoName(repoRoot);
  const previousTag = getPreviousTag(
    repoRoot,
    options.gitTag,
    options.previousTag,
  );
  const commits = collectCommits(repoRoot, options.gitTag, previousTag);

  const jiraVersion = await resolveJiraVersion(
    options.jiraBaseUrl,
    options.jiraProject,
    options.jiraVersion,
  );
  const jiraIssues = await fetchJiraIssues(
    options.jiraBaseUrl,
    options.jiraProject,
    jiraVersion,
  );
  const releaseNotes = await readReleaseNotes(
    repoRoot,
    options.gitTag,
    options.releaseNotesSource,
  );
  const comparison = compareRelease(
    commits,
    jiraIssues,
    releaseNotes.issueKeys,
  );

  const outputPath = path.resolve(
    options.output ?? defaultReportPath(repoName, options.gitTag),
  );
  const report = renderReport({
    comparison,
    gitTag: options.gitTag,
    jiraProject: options.jiraProject,
    jiraVersion,
    previousTag,
    releaseNotes,
    repoName,
    repoRoot,
    totalJiraIssues: jiraIssues.length,
  });

  await writeReport(outputPath, report);

  process.stdout.write(
    `${[
      `Repository: ${repoName}`,
      `Git tag: ${options.gitTag}`,
      `Comparison base: ${previousTag ?? 'repository start'}`,
      `Commits inspected: ${commits.length}`,
      `Jira version: ${jiraVersion.name} (${jiraVersion.id})`,
      `Jira issues in release: ${jiraIssues.length}`,
      `Jira issues missing from git: ${comparison.jiraIssuesMissingFromGit.length}`,
      `Jira issues missing from release notes: ${comparison.jiraIssuesMissingFromReleaseNotes.length}`,
      `Referenced Jira issues not done: ${comparison.releaseReferencedIssuesNotDone.length}`,
      `Jira issues missing clinical safety category: ${comparison.jiraIssuesMissingClinicalSafetyCategory.length}`,
      `Jira issues missing clinical lead: ${comparison.jiraIssuesMissingClinicalLead.length}`,
      `Commits without Jira matches: ${comparison.commitsWithoutMatches.length}`,
      `Report written to ${outputPath}`,
    ].join('\n')}\n`,
  );
};
