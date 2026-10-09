import path from 'node:path';

import type {
  ComparisonResult,
  JiraIssue,
  JiraVersion,
  MatchedCommit,
  ReleaseNotes,
  SelectedGitTag,
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

const summarizeGitTagsForPath = (gitTags: string[]): string =>
  gitTags.length === 1
    ? sanitizeFileSegment(gitTags[0])
    : `${sanitizeFileSegment(gitTags[0])}-to-${sanitizeFileSegment(gitTags.at(-1) ?? gitTags[0])}-${gitTags.length}-tags`;

const formatGitTagSummary = (gitTags: SelectedGitTag[]): string =>
  gitTags.map(({ gitTag }) => gitTag).join(', ');

const formatComparisonBaseSummary = (gitTags: SelectedGitTag[]): string =>
  gitTags
    .map(
      ({ gitTag, previousTag }) =>
        `${gitTag} <- ${previousTag ?? 'repository start'}`,
    )
    .join('; ');

const formatJiraVersion = (jiraVersion: JiraVersion): string =>
  `${jiraVersion.name} (${jiraVersion.id})`;

const formatJiraReleaseDates = (jiraVersions: JiraVersion[]): string =>
  jiraVersions
    .map((version) => {
      const releaseDate = version.releaseDate ?? 'unknown';
      return `${version.name}: ${releaseDate}`;
    })
    .join('; ');

export const defaultReportPath = (
  repoName: string,
  gitTags: string[],
  cwd: string = process.cwd(),
): string =>
  path.join(
    cwd,
    '.tmp',
    'release-check',
    `${sanitizeFileSegment(repoName)}-${summarizeGitTagsForPath(gitTags)}.txt`,
  );

export const renderReport = ({
  comparison,
  gitTags,
  jiraProject,
  jiraVersions,
  releaseNotes,
  repoName,
  repoRoot,
  totalJiraIssues,
}: {
  comparison: ComparisonResult;
  gitTags: SelectedGitTag[];
  jiraProject: string;
  jiraVersions: JiraVersion[];
  releaseNotes: ReleaseNotes;
  repoName: string;
  repoRoot: string;
  totalJiraIssues: number;
}): string => {
  const { warnings } = releaseNotes;
  const singleGitTag = gitTags.length === 1;
  const singleJiraVersion = jiraVersions.length === 1;
  const jiraScopeLabel = singleJiraVersion
    ? 'the release'
    : 'the selected releases';
  const jiraVersionScopeLabel = singleJiraVersion
    ? 'the Jira release'
    : 'the selected Jira versions';
  const sections = [
    'Release check report',
    `Repository: ${repoName}`,
    `Repository root: ${repoRoot}`,
    singleGitTag
      ? `Git tag: ${gitTags[0].gitTag}`
      : `Git tags selected (${gitTags.length}): ${formatGitTagSummary(gitTags)}`,
    singleGitTag
      ? `Comparison base: ${gitTags[0].previousTag ?? 'repository start'}`
      : `Comparison bases: ${formatComparisonBaseSummary(gitTags)}`,
    `Jira project: ${jiraProject}`,
    singleJiraVersion
      ? `Jira version: ${formatJiraVersion(jiraVersions[0])}`
      : `Jira versions selected (${jiraVersions.length}): ${jiraVersions.map((jiraVersion) => formatJiraVersion(jiraVersion)).join(', ')}`,
    ...(singleJiraVersion
      ? [
          `Jira release date: ${jiraVersions[0].releaseDate ?? 'unknown'}`,
          `Jira version released: ${jiraVersions[0].released ? 'yes' : 'no'}`,
        ]
      : [
          `Jira release dates: ${formatJiraReleaseDates(jiraVersions)}`,
          `Jira versions released: ${jiraVersions.filter((version) => version.released).length}/${jiraVersions.length}`,
        ]),
    `Release notes source: ${releaseNotes.source}`,
    '',
    'Summary',
    `- Jira issues in ${singleJiraVersion ? 'release' : 'selected releases'}: ${totalJiraIssues}`,
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
      `Jira issues in ${jiraScopeLabel} with no matching git reference`,
      comparison.jiraIssuesMissingFromGit.map((issue) =>
        formatIssue(issue, comparison.commitsByIssueKey),
      ),
    ),
    renderSection(
      `Jira issues in ${jiraScopeLabel} with no matching release-note reference`,
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
      `Git-referenced Jira issue keys missing from ${jiraVersionScopeLabel}`,
      comparison.commitsWithIssueKeysOutsideRelease.map(
        ({ commit, missingKeys }) =>
          `${formatCommit(commit)} | missing keys: ${missingKeys.join(', ')}`,
      ),
    ),
    renderSection(
      `Release-note Jira issue keys missing from ${jiraVersionScopeLabel}`,
      comparison.releaseNotesIssueKeysOutsideRelease,
    ),
    renderSection(
      'Commits without a Jira key or exact Jira-summary match',
      comparison.commitsWithoutMatches.map((commit) => formatCommit(commit)),
    ),
  );

  return sections.join('\n').replaceAll(/\n{3,}/g, '\n\n');
};
