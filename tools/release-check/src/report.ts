import path from 'node:path';

import type {
  ComparisonResult,
  JiraIssue,
  JiraVersion,
  MatchedCommit,
  ReleaseNotes,
} from './types';

const formatIssue = (
  issue: JiraIssue,
  commitsByIssueKey: Map<string, MatchedCommit[]>,
): string => {
  const components =
    issue.components.length > 0 ? `[${issue.components.join(', ')}] ` : '';
  const commits = commitsByIssueKey.get(issue.key) ?? [];
  const commitSummary = commits
    .map((commit) => `${commit.shortHash} ${commit.subject}`)
    .join('; ');
  const issueSummary = `${issue.key}: ${components}${issue.summary} (${issue.status})`;
  return commitSummary
    ? `${issueSummary} | commits: ${commitSummary}`
    : issueSummary;
};

const formatCommit = (commit: MatchedCommit): string =>
  `${commit.shortHash} ${commit.subject}`;

const renderSection = (title: string, lines: string[]): string => {
  if (lines.length === 0) {
    return `${title}\n- none\n`;
  }
  const renderedLines = lines.map((line) => `- ${line}`).join('\n');
  return `${title}\n${renderedLines}\n`;
};

const sanitizeFileSegment = (value: string): string =>
  value.replaceAll(/[^A-Za-z0-9._-]+/g, '-');

export const defaultReportPath = (
  repoName: string,
  gitTag: string,
  cwd: string = process.cwd(),
): string =>
  path.join(
    cwd,
    '.tmp',
    'release-check',
    `${sanitizeFileSegment(repoName)}-${sanitizeFileSegment(gitTag)}.txt`,
  );

export const renderReport = ({
  comparison,
  gitTag,
  jiraProject,
  jiraVersion,
  previousTag,
  releaseNotes,
  repoName,
  repoRoot,
  totalJiraIssues,
}: {
  comparison: ComparisonResult;
  gitTag: string;
  jiraProject: string;
  jiraVersion: JiraVersion;
  previousTag: string | null;
  releaseNotes: ReleaseNotes;
  repoName: string;
  repoRoot: string;
  totalJiraIssues: number;
}): string => {
  const { warnings } = releaseNotes;
  const sections = [
    'Release check report',
    `Repository: ${repoName}`,
    `Repository root: ${repoRoot}`,
    `Git tag: ${gitTag}`,
    `Comparison base: ${previousTag ?? 'repository start'}`,
    `Jira project: ${jiraProject}`,
    `Jira version: ${jiraVersion.name} (${jiraVersion.id})`,
    `Jira release date: ${jiraVersion.releaseDate ?? 'unknown'}`,
    `Jira version released: ${jiraVersion.released ? 'yes' : 'no'}`,
    `Release notes source: ${releaseNotes.source}`,
    '',
    'Summary',
    `- Jira issues in release: ${totalJiraIssues}`,
    `- Jira issues referenced in git: ${comparison.gitReferencedIssueKeys.length}`,
    `- Jira issues referenced in release notes: ${comparison.notesReferencedIssueKeys.length}`,
    `- Jira issues missing from git: ${comparison.jiraIssuesMissingFromGit.length}`,
    `- Jira issues missing from release notes: ${comparison.jiraIssuesMissingFromReleaseNotes.length}`,
    `- Git issue keys outside Jira release: ${comparison.commitsWithIssueKeysOutsideRelease.length}`,
    `- Release-note issue keys outside Jira release: ${comparison.releaseNotesIssueKeysOutsideRelease.length}`,
    `- Referenced Jira issues not done: ${comparison.releaseReferencedIssuesNotDone.length}`,
    `- Jira issues missing clinical safety category: ${comparison.jiraIssuesMissingClinicalSafetyCategory.length}`,
    `- Jira issues missing clinical lead: ${comparison.jiraIssuesMissingClinicalLead.length}`,
    `- Commits without Jira matches: ${comparison.commitsWithoutMatches.length}`,
    '',
  ];

  if (warnings.length > 0) {
    sections.push(renderSection('Warnings', warnings));
  }

  sections.push(
    renderSection(
      'Jira issues in the release with no matching git reference',
      comparison.jiraIssuesMissingFromGit.map((issue) =>
        formatIssue(issue, comparison.commitsByIssueKey),
      ),
    ),
    renderSection(
      'Jira issues in the release with no matching release-note reference',
      comparison.jiraIssuesMissingFromReleaseNotes.map((issue) =>
        formatIssue(issue, comparison.commitsByIssueKey),
      ),
    ),
    renderSection(
      'Jira issues referenced in git or release notes but not in a done status',
      comparison.releaseReferencedIssuesNotDone.map((issue) =>
        formatIssue(issue, comparison.commitsByIssueKey),
      ),
    ),
    renderSection(
      'Jira issues missing clinical safety category',
      comparison.jiraIssuesMissingClinicalSafetyCategory.map((issue) =>
        formatIssue(issue, comparison.commitsByIssueKey),
      ),
    ),
    renderSection(
      'Jira issues missing clinical lead',
      comparison.jiraIssuesMissingClinicalLead.map((issue) =>
        formatIssue(issue, comparison.commitsByIssueKey),
      ),
    ),
    renderSection(
      'Git-referenced Jira issue keys missing from the Jira release',
      comparison.commitsWithIssueKeysOutsideRelease.map(
        ({ commit, missingKeys }) =>
          `${formatCommit(commit)} | missing keys: ${missingKeys.join(', ')}`,
      ),
    ),
    renderSection(
      'Release-note Jira issue keys missing from the Jira release',
      comparison.releaseNotesIssueKeysOutsideRelease,
    ),
    renderSection(
      'Commits without a Jira key or exact Jira-summary match',
      comparison.commitsWithoutMatches.map((commit) => formatCommit(commit)),
    ),
  );

  return sections.join('\n').replaceAll(/\n{3,}/g, '\n\n');
};
