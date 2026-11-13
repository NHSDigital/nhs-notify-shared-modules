import path from 'node:path';

import type {
  ComparisonResult,
  FixProposal,
  JiraIssue,
  JiraVersion,
  MatchedCommit,
  ReleaseNotes,
  SelectedGitTag,
} from './types';

const formatCommit = (commit: MatchedCommit): string =>
  `${commit.shortHash} ${commit.subject}`;

const escapeMarkdownCell = (value: string): string =>
  value.replaceAll('|', String.raw`\|`).replaceAll('\n', '<br>');

const formatIssueHeading = (key: string, issue?: JiraIssue): string => {
  if (!issue) {
    return `${key}: not found in Jira`;
  }

  const components =
    issue.components.length > 0 ? `[${issue.components.join(', ')}] ` : '';
  return `${key}: ${components}${issue.summary} (${issue.status})`;
};

const formatRepresentativeCommit = (
  commits: MatchedCommit[],
  emptyLabel = 'No matching commit',
): string => {
  if (commits.length === 0) {
    return emptyLabel;
  }

  const totalLabel =
    commits.length === 1 ? '1 commit total' : `${commits.length} commits total`;
  return `\`${formatCommit(commits[0])}\` _(${totalLabel})_`;
};

const groupOutsideReleaseReferences = (
  commitsWithIssueKeysOutsideRelease: ComparisonResult['commitsWithIssueKeysOutsideRelease'],
): string[] =>
  [
    ...new Set(
      commitsWithIssueKeysOutsideRelease.flatMap(
        ({ missingKeys }) => missingKeys,
      ),
    ),
  ].toSorted((left, right) => left.localeCompare(right));

const renderSimpleSection = (title: string, lines: string[]): string => {
  if (lines.length === 0) {
    return `## ${title}\n\n- none\n`;
  }

  const renderedLines = lines.map((line) => `- ${line}`).join('\n');
  return `## ${title}\n\n${renderedLines}\n`;
};

const renderTable = (headers: string[], rows: string[][]): string => {
  const headerRow = `| ${headers.join(' | ')} |`;
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
  const bodyRows = rows.map((row) => `| ${row.join(' | ')} |`).join('\n');
  return `${headerRow}\n${separatorRow}\n${bodyRows}`;
};

const renderIssueSection = (
  title: string,
  issueKeys: string[],
  issueByKey: Map<string, JiraIssue>,
  commitsByIssueKey: Map<string, MatchedCommit[]>,
): string => {
  if (issueKeys.length === 0) {
    return `## ${title}\n\n- none\n`;
  }

  const rows = issueKeys.map((key) => [
    escapeMarkdownCell(formatIssueHeading(key, issueByKey.get(key))),
    escapeMarkdownCell(
      formatRepresentativeCommit(commitsByIssueKey.get(key) ?? []),
    ),
  ]);

  return `## ${title}\n\n${renderTable(['Issue', 'Commit'], rows)}\n`;
};

const renderFixProposalSection = (
  fixAction: string,
  fixComponent: string,
  proposals: FixProposal[],
  commitsByIssueKey: Map<string, MatchedCommit[]>,
): string => {
  const title = `Proposed ${fixAction} updates for component ${fixComponent}`;
  if (proposals.length === 0) {
    return `## ${title}\n\n- none\n`;
  }

  const rows = proposals.map((proposal) => [
    escapeMarkdownCell(formatIssueHeading(proposal.issue.key, proposal.issue)),
    escapeMarkdownCell(
      formatRepresentativeCommit(
        commitsByIssueKey.get(proposal.issue.key) ?? [],
      ),
    ),
    escapeMarkdownCell(
      `${proposal.currentValueSummary} -> ${proposal.targetValueSummary}`,
    ),
  ]);

  return `## ${title}\n\n${renderTable(
    ['Issue', 'Commit', 'Proposed update'],
    rows,
  )}\n`;
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
    `${sanitizeFileSegment(repoName)}-${summarizeGitTagsForPath(gitTags)}.md`,
  );

export const renderReport = ({
  comparison,
  fixAction,
  fixComponent,
  fixProposals,
  gitTags,
  jiraProject,
  jiraVersions,
  outsideReleaseIssuesByKey,
  releaseNotes,
  repoName,
  repoRoot,
  totalJiraIssues,
}: {
  comparison: ComparisonResult;
  fixAction?: string;
  fixComponent?: string;
  fixProposals?: FixProposal[];
  gitTags: SelectedGitTag[];
  jiraProject: string;
  jiraVersions: JiraVersion[];
  outsideReleaseIssuesByKey: Map<string, JiraIssue>;
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
  const outsideReleaseIssueKeys = groupOutsideReleaseReferences(
    comparison.commitsWithIssueKeysOutsideRelease,
  );
  const sections = [
    '# Release check report',
    '',
    `- **Repository:** ${repoName}`,
    `- **Repository root:** ${repoRoot}`,
    singleGitTag
      ? `- **Git tag:** ${gitTags[0].gitTag}`
      : `- **Git tags selected (${gitTags.length}):** ${formatGitTagSummary(gitTags)}`,
    singleGitTag
      ? `- **Comparison base:** ${gitTags[0].previousTag ?? 'repository start'}`
      : `- **Comparison bases:** ${formatComparisonBaseSummary(gitTags)}`,
    `- **Jira project:** ${jiraProject}`,
    singleJiraVersion
      ? `- **Jira version:** ${formatJiraVersion(jiraVersions[0])}`
      : `- **Jira versions selected (${jiraVersions.length}):** ${jiraVersions.map((jiraVersion) => formatJiraVersion(jiraVersion)).join(', ')}`,
    ...(singleJiraVersion
      ? [
          `- **Jira release date:** ${jiraVersions[0].releaseDate ?? 'unknown'}`,
          `- **Jira version released:** ${jiraVersions[0].released ? 'yes' : 'no'}`,
        ]
      : [
          `- **Jira release dates:** ${formatJiraReleaseDates(jiraVersions)}`,
          `- **Jira versions released:** ${jiraVersions.filter((version) => version.released).length}/${jiraVersions.length}`,
        ]),
    `- **Release notes source:** ${releaseNotes.source}`,
    '',
    '## Summary',
    '',
    `- Jira issues in ${singleJiraVersion ? 'release' : 'selected releases'}: ${totalJiraIssues}`,
    `- Jira issues referenced in git: ${comparison.gitReferencedIssueKeys.length}`,
    `- Jira issues referenced in release notes: ${comparison.notesReferencedIssueKeys.length}`,
    `- Jira issues missing from git: ${comparison.jiraIssuesMissingFromGit.length}`,
    `- Jira issues missing from release notes: ${comparison.jiraIssuesMissingFromReleaseNotes.length}`,
    `- Git-referenced Jira issues outside Jira release: ${outsideReleaseIssueKeys.length}`,
    `- Release-note issue keys outside Jira release: ${comparison.releaseNotesIssueKeysOutsideRelease.length}`,
    `- Referenced Jira issues not done: ${comparison.releaseReferencedIssuesNotDone.length}`,
    `- Jira issues missing clinical safety category: ${comparison.jiraIssuesMissingClinicalSafetyCategory.length}`,
    `- Jira issues missing clinical lead: ${comparison.jiraIssuesMissingClinicalLead.length}`,
    `- Commits without Jira matches: ${comparison.commitsWithoutMatches.length}`,
    '',
  ];

  if (warnings.length > 0) {
    sections.push(renderSimpleSection('Warnings', warnings));
  }

  const selectedIssuesByKey = new Map(
    [
      ...comparison.jiraIssuesMissingFromGit,
      ...comparison.jiraIssuesMissingFromReleaseNotes,
      ...comparison.releaseReferencedIssuesNotDone,
      ...comparison.jiraIssuesMissingClinicalSafetyCategory,
      ...comparison.jiraIssuesMissingClinicalLead,
    ].map((issue) => [issue.key, issue]),
  );

  sections.push(
    renderIssueSection(
      `Jira issues in ${jiraScopeLabel} with no matching git reference`,
      comparison.jiraIssuesMissingFromGit.map((issue) => issue.key),
      selectedIssuesByKey,
      comparison.commitsByIssueKey,
    ),
    renderIssueSection(
      `Jira issues in ${jiraScopeLabel} with no matching release-note reference`,
      comparison.jiraIssuesMissingFromReleaseNotes.map((issue) => issue.key),
      selectedIssuesByKey,
      comparison.commitsByIssueKey,
    ),
    renderIssueSection(
      'Jira issues referenced in git or release notes but not in a done status',
      comparison.releaseReferencedIssuesNotDone.map((issue) => issue.key),
      selectedIssuesByKey,
      comparison.commitsByIssueKey,
    ),
    renderIssueSection(
      'Jira issues missing clinical safety category',
      comparison.jiraIssuesMissingClinicalSafetyCategory.map(
        (issue) => issue.key,
      ),
      selectedIssuesByKey,
      comparison.commitsByIssueKey,
    ),
    renderIssueSection(
      'Jira issues missing clinical lead',
      comparison.jiraIssuesMissingClinicalLead.map((issue) => issue.key),
      selectedIssuesByKey,
      comparison.commitsByIssueKey,
    ),
    renderIssueSection(
      `Git-referenced Jira issue keys missing from ${jiraVersionScopeLabel}`,
      outsideReleaseIssueKeys,
      outsideReleaseIssuesByKey,
      comparison.commitsByIssueKey,
    ),
    renderIssueSection(
      `Release-note Jira issue keys missing from ${jiraVersionScopeLabel}`,
      comparison.releaseNotesIssueKeysOutsideRelease,
      outsideReleaseIssuesByKey,
      comparison.commitsByIssueKey,
    ),
    ...(fixAction && fixComponent && fixProposals
      ? [
          renderFixProposalSection(
            fixAction,
            fixComponent,
            fixProposals,
            comparison.commitsByIssueKey,
          ),
        ]
      : []),
    renderSimpleSection(
      'Commits without a Jira key or exact Jira-summary match',
      comparison.commitsWithoutMatches.map((commit) => formatCommit(commit)),
    ),
  );

  return sections.join('\n').replaceAll(/\n{3,}/g, '\n\n');
};

export { renderFixProposalSection };
