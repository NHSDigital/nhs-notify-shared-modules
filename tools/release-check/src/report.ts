import path from 'node:path';

import type {
  ComparisonResult,
  FixProposal,
  JiraFixVersion,
  JiraIssue,
  JiraVersion,
  MatchedCommit,
  ReleaseNotes,
  SelectedGitTag,
} from './types';

const DEFAULT_JIRA_BASE_URL = 'https://nhsd-jira.digital.nhs.uk';

const formatCommitMappingNote = (commit: MatchedCommit): string => {
  if (commit.issueKeySource !== 'mapped' || !commit.issueKeyOverride) {
    return '';
  }

  const detectedKeys =
    commit.detectedIssueKeys && commit.detectedIssueKeys.length > 0
      ? commit.detectedIssueKeys.join(', ')
      : 'no detected ticket';
  return ` [ticket mapping: ${detectedKeys} -> ${commit.issueKeyOverride.issueKey}]`;
};

const formatCommit = (commit: MatchedCommit): string =>
  `${commit.shortHash} ${commit.subject}${formatCommitMappingNote(commit)}`;

const escapeMarkdownCell = (value: string): string =>
  value.replaceAll('|', String.raw`\|`).replaceAll('\n', '<br>');

const formatJiraIssueLink = (jiraBaseUrl: string, issueKey: string): string =>
  `[${issueKey}](${jiraBaseUrl}/browse/${encodeURIComponent(issueKey)})`;

const formatPlainIssueHeading = (key: string, issue?: JiraIssue): string => {
  /* c8 ignore next -- terminal fix proposals always provide an issue */
  if (!issue) {
    return `${key}: not found in Jira`;
  }

  const components =
    issue.components.length > 0 ? `[${issue.components.join(', ')}] ` : '';
  return `${key}: ${components}${issue.summary} (${issue.status})`;
};

const formatIssueHeading = (
  jiraBaseUrl: string,
  key: string,
  issue?: JiraIssue,
): string => {
  const linkedKey = formatJiraIssueLink(jiraBaseUrl, key);

  if (!issue) {
    return `${linkedKey}: not found in Jira`;
  }

  const components =
    issue.components.length > 0 ? `[${issue.components.join(', ')}] ` : '';
  return `${linkedKey}: ${components}${issue.summary} (${issue.status})`;
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

const formatRepresentativeCommitText = (
  commits: MatchedCommit[],
  emptyLabel = 'No matching commit',
): string => {
  if (commits.length === 0) {
    return emptyLabel;
  }

  const totalLabel =
    commits.length === 1 ? '1 commit total' : `${commits.length} commits total`;
  return `${formatCommit(commits[0])} (${totalLabel})`;
};

const formatFixVersions = (fixVersions?: JiraFixVersion[]): string => {
  if (!fixVersions || fixVersions.length === 0) {
    return 'none';
  }

  return fixVersions.map(({ name }) => name).join(', ');
};

const formatReleaseRanges = (
  commits: MatchedCommit[],
  emptyLabel = 'No matching commit',
): string => {
  if (commits.length === 0) {
    return emptyLabel;
  }

  const countsByRange = new Map<string, number>();

  for (const commit of commits) {
    const rangeLabel = commit.releaseRange ?? 'unknown range';
    countsByRange.set(rangeLabel, (countsByRange.get(rangeLabel) ?? 0) + 1);
  }

  return [...countsByRange.entries()]
    .map(([rangeLabel, count]) =>
      count === 1 ? rangeLabel : `${rangeLabel} (${count} commits)`,
    )
    .join('; ');
};

const formatSelectedGitRange = ({
  gitTag,
  previousTag,
  rangeEndTag,
}: SelectedGitTag): string =>
  `${previousTag ?? 'repository start'}..${rangeEndTag ?? gitTag}`;

function normalizeGitTagForVersionMatch(gitTag: string): string {
  return gitTag.startsWith('v') ? gitTag.slice(1) : gitTag;
}

function findJiraVersionForGitTag(
  gitTag: string,
  jiraVersions: JiraVersion[],
): JiraVersion | undefined {
  const normalizedGitTag = normalizeGitTagForVersionMatch(gitTag);

  return jiraVersions.find((jiraVersion) =>
    jiraVersion.name.endsWith(normalizedGitTag),
  );
}

function findGitTagForJiraVersion(
  jiraVersion: JiraVersion,
  gitTags: SelectedGitTag[],
): SelectedGitTag | undefined {
  return gitTags.find((gitTag) =>
    findJiraVersionForGitTag(gitTag.gitTag, [jiraVersion]),
  );
}

function renderGitRangeMappings(
  gitTags: SelectedGitTag[],
  jiraVersions: JiraVersion[],
): string[] {
  const lines = ['- Git commit ranges mapped to Jira versions:'];

  for (const gitTag of gitTags) {
    const jiraVersion = findJiraVersionForGitTag(gitTag.gitTag, jiraVersions);
    lines.push(
      `  - \`${formatSelectedGitRange(gitTag)}\` -> ${jiraVersion?.name ?? 'no matching selected Jira version'}`,
    );
  }

  return lines;
}

function quoteShellArg(value: string): string {
  const escapedValue = value.replaceAll("'", `'"'"'`);
  return `'${escapedValue}'`;
}

const formatIssueFixVersions = (issue?: JiraIssue): string =>
  issue ? formatFixVersions(issue.fixVersions) : 'not found in Jira';

const compareStrings = (left: string, right: string): number =>
  left.localeCompare(right);

const getAllComparedCommits = (
  comparison: ComparisonResult,
): MatchedCommit[] => {
  const commitsByHash = new Map<string, MatchedCommit>();

  for (const commits of comparison.commitsByIssueKey.values()) {
    for (const commit of commits) {
      commitsByHash.set(commit.hash, commit);
    }
  }

  for (const commit of comparison.commitsWithoutMatches) {
    commitsByHash.set(commit.hash, commit);
  }

  for (const { commit } of comparison.commitsWithIssueKeysOutsideRelease) {
    commitsByHash.set(commit.hash, commit);
  }

  return [...commitsByHash.values()];
};

const getMappedCommits = (comparison: ComparisonResult): MatchedCommit[] =>
  getAllComparedCommits(comparison)
    .filter((commit) => commit.issueKeySource === 'mapped')
    .toSorted((left, right) => left.hash.localeCompare(right.hash));

const formatSelectedGitTagLabel = ({
  gitTag,
  rangeEndTag,
}: SelectedGitTag): string =>
  rangeEndTag && rangeEndTag !== gitTag
    ? `${gitTag} (+ patches through ${rangeEndTag})`
    : gitTag;

function formatFixCommand({
  action,
  component,
  gitTag,
  jiraVersion,
  repoRoot,
}: {
  action: 'clinical-review-not-needed' | 'fix-version';
  component: string;
  gitTag: string;
  jiraVersion: string;
  repoRoot: string;
}): string {
  return `npm run check -- --repo ${quoteShellArg(repoRoot)} --git-tag ${quoteShellArg(gitTag)} --jira-version ${quoteShellArg(jiraVersion)} --fix ${action} --fix-component ${quoteShellArg(component)}`;
}

const getIssueReleaseTags = (
  issueKey: string,
  commitsByIssueKey: Map<string, MatchedCommit[]>,
): Set<string> =>
  new Set(
    (commitsByIssueKey.get(issueKey) ?? [])
      .map((commit) => commit.releaseTag)
      .filter((releaseTag): releaseTag is string => releaseTag != null),
  );

const addFixVersionCommandEntries = ({
  commandEntries,
  gitTags,
  issue,
  jiraVersions,
  releaseTags,
  repoRoot,
  unmappedRanges,
}: {
  commandEntries: Set<string>;
  gitTags: SelectedGitTag[];
  issue: JiraIssue;
  jiraVersions: JiraVersion[];
  releaseTags: Set<string>;
  repoRoot: string;
  unmappedRanges: Set<string>;
}): void => {
  for (const releaseTag of releaseTags) {
    const selectedGitTag = gitTags.find(
      ({ gitTag }) => gitTag === releaseTag,
    )?.gitTag;
    const jiraVersion = findJiraVersionForGitTag(releaseTag, jiraVersions);

    if (selectedGitTag && jiraVersion) {
      for (const component of issue.components) {
        commandEntries.add(
          `# ${component}\n${formatFixCommand({
            action: 'fix-version',
            component,
            gitTag: selectedGitTag,
            jiraVersion: jiraVersion.name,
            repoRoot,
          })}`,
        );
      }
    } else {
      unmappedRanges.add(releaseTag);
    }
  }
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

const DEFAULT_TERMINAL_COLUMN_WIDTH = 100;
const TERMINAL_TABLE_MIN_COLUMN_WIDTH = 20;

const truncateTerminalCell = (value: string, maxWidth: number): string => {
  if (value.length <= maxWidth) {
    return value;
  }

  /* c8 ignore next -- terminal widths are clamped to at least 20 chars */
  if (maxWidth <= 3) {
    return value.slice(0, maxWidth);
  }

  return `${value.slice(0, maxWidth - 3)}...`;
};

const getTerminalColumnMaxWidths = (columnCount: number): number[] => {
  if (!process.stdout.isTTY || !process.stdout.columns) {
    return Array.from(
      { length: columnCount },
      () => DEFAULT_TERMINAL_COLUMN_WIDTH,
    );
  }

  const separatorWidth = (columnCount - 1) * 3;
  const availableWidth = Math.max(
    process.stdout.columns - separatorWidth,
    columnCount * TERMINAL_TABLE_MIN_COLUMN_WIDTH,
  );
  const equalShare = Math.max(
    TERMINAL_TABLE_MIN_COLUMN_WIDTH,
    Math.floor(availableWidth / columnCount),
  );

  return Array.from({ length: columnCount }, () =>
    Math.min(DEFAULT_TERMINAL_COLUMN_WIDTH, equalShare),
  );
};

const renderTerminalTable = (
  headers: string[],
  rows: string[][],
  maxColumnWidths = getTerminalColumnMaxWidths(headers.length),
): string => {
  const truncatedHeaders = headers.map((header, index) =>
    truncateTerminalCell(
      header,
      maxColumnWidths[index] ?? DEFAULT_TERMINAL_COLUMN_WIDTH,
    ),
  );
  const truncatedRows = rows.map((row) =>
    row.map((cell, index) =>
      truncateTerminalCell(
        cell ?? '',
        maxColumnWidths[index] ?? DEFAULT_TERMINAL_COLUMN_WIDTH,
      ),
    ),
  );
  const columnWidths = headers.map((header, index) =>
    Math.max(
      truncatedHeaders[index]?.length ?? header.length,
      ...truncatedRows.map((row) => (row[index] ?? '').length),
    ),
  );
  const formatRow = (row: string[]): string =>
    row
      .map((cell, index) => (cell ?? '').padEnd(columnWidths[index]))
      .join(' | ');
  const separator = columnWidths.map((width) => '-'.repeat(width)).join('-+-');

  return [
    formatRow(truncatedHeaders),
    separator,
    ...truncatedRows.map((row) => formatRow(row)),
  ].join('\n');
};

const renderIssueSection = (
  title: string,
  issueKeys: string[],
  issueByKey: Map<string, JiraIssue>,
  commitsByIssueKey: Map<string, MatchedCommit[]>,
  showReleaseRangeComparison: boolean,
  jiraBaseUrl: string,
): string => {
  if (issueKeys.length === 0) {
    return `## ${title}\n\n- none\n`;
  }

  const headers = ['Issue', 'Commit'];
  if (showReleaseRangeComparison) {
    headers.push('Release range', 'Fix versions');
  }

  const rows = issueKeys.map((key) => {
    const issue = issueByKey.get(key);
    const commits = commitsByIssueKey.get(key) ?? [];
    const row = [
      escapeMarkdownCell(formatIssueHeading(jiraBaseUrl, key, issue)),
      escapeMarkdownCell(formatRepresentativeCommit(commits)),
    ];

    if (showReleaseRangeComparison) {
      row.push(
        escapeMarkdownCell(formatReleaseRanges(commits)),
        escapeMarkdownCell(formatIssueFixVersions(issue)),
      );
    }

    return row;
  });

  return `## ${title}\n\n${renderTable(headers, rows)}\n`;
};

const renderMappedCommitSection = ({
  commits,
  issueByKey,
  jiraBaseUrl,
}: {
  commits: MatchedCommit[];
  issueByKey: Map<string, JiraIssue>;
  jiraBaseUrl: string;
}): string => {
  const title = 'Commits with Jira ticket mappings applied';
  if (commits.length === 0) {
    return `## ${title}\n\n- none\n`;
  }

  const rows = commits.map((commit) => {
    const mappedIssueKey = commit.issueKeyOverride?.issueKey ?? '';
    const mappedIssue = issueByKey.get(mappedIssueKey);
    const detectedTicketLabel =
      commit.detectedIssueKeys && commit.detectedIssueKeys.length > 0
        ? commit.detectedIssueKeys.join(', ')
        : 'no detected ticket';

    return [
      escapeMarkdownCell(`\`${commit.shortHash} ${commit.subject}\``),
      escapeMarkdownCell(
        formatIssueHeading(jiraBaseUrl, mappedIssueKey, mappedIssue),
      ),
      escapeMarkdownCell(detectedTicketLabel),
    ];
  });

  return `## ${title}\n\n${renderTable(
    ['Commit', 'Mapped ticket', 'Detected ticket'],
    rows,
  )}\n`;
};

const renderFixProposalSection = (
  fixAction: string,
  fixComponent: string,
  proposals: FixProposal[],
  commitsByIssueKey: Map<string, MatchedCommit[]>,
  showReleaseRangeComparison = false,
  jiraBaseUrl = DEFAULT_JIRA_BASE_URL,
): string => {
  const title = `Proposed ${fixAction} updates for component ${fixComponent}`;
  if (proposals.length === 0) {
    return `## ${title}\n\n- none\n`;
  }

  const headers = ['Issue', 'Commit'];
  if (showReleaseRangeComparison) {
    headers.push('Release range', 'Fix versions');
  }
  headers.push('Proposed update');

  const rows = proposals.map((proposal) => {
    const commits = commitsByIssueKey.get(proposal.issue.key) ?? [];
    const row = [
      escapeMarkdownCell(
        formatIssueHeading(jiraBaseUrl, proposal.issue.key, proposal.issue),
      ),
      escapeMarkdownCell(formatRepresentativeCommit(commits)),
    ];

    if (showReleaseRangeComparison) {
      row.push(
        escapeMarkdownCell(formatReleaseRanges(commits)),
        escapeMarkdownCell(formatIssueFixVersions(proposal.issue)),
      );
    }

    row.push(
      escapeMarkdownCell(
        proposal.proposedUpdateSummary ??
          `${proposal.currentValueSummary} -> ${proposal.targetValueSummary}`,
      ),
    );

    return row;
  });

  return `## ${title}\n\n${renderTable(headers, rows)}\n`;
};

const renderFixProposalTerminalSection = (
  fixAction: string,
  fixComponent: string,
  proposals: FixProposal[],
  commitsByIssueKey: Map<string, MatchedCommit[]>,
): string => {
  const title = `Proposed ${fixAction} updates for component ${fixComponent}`;
  if (proposals.length === 0) {
    return `${title}\n\nnone\n`;
  }

  const rows = proposals.map((proposal) => {
    const commits = commitsByIssueKey.get(proposal.issue.key) ?? [];

    return [
      formatPlainIssueHeading(proposal.issue.key, proposal.issue),
      formatRepresentativeCommitText(commits),
      proposal.proposedUpdateSummary ??
        `${proposal.currentValueSummary} -> ${proposal.targetValueSummary}`,
    ];
  });

  return `${title}\n\n${renderTerminalTable(
    ['Issue', 'Commit', 'Proposed update'],
    rows,
  )}\n`;
};

const renderFixVersionCommandExamples = ({
  commitsByIssueKey,
  gitTags,
  issueKeys,
  jiraVersions,
  outsideReleaseIssuesByKey,
  repoRoot,
}: {
  commitsByIssueKey: Map<string, MatchedCommit[]>;
  gitTags: SelectedGitTag[];
  issueKeys: string[];
  jiraVersions: JiraVersion[];
  outsideReleaseIssuesByKey: Map<string, JiraIssue>;
  repoRoot: string;
}): string => {
  const commandEntries = new Set<string>();
  const issuesWithoutComponents: string[] = [];
  const unmappedRanges = new Set<string>();

  for (const issueKey of issueKeys) {
    const issue = outsideReleaseIssuesByKey.get(issueKey);
    if (issue && issue.components.length === 0) {
      issuesWithoutComponents.push(issueKey);
    } else if (issue) {
      addFixVersionCommandEntries({
        commandEntries,
        gitTags,
        issue,
        jiraVersions,
        releaseTags: getIssueReleaseTags(issueKey, commitsByIssueKey),
        repoRoot,
        unmappedRanges,
      });
    }
  }

  const lines = [...commandEntries].toSorted(compareStrings);

  if (issuesWithoutComponents.length > 0) {
    lines.push(
      `# Manual review needed: no component set for ${issuesWithoutComponents.toSorted(compareStrings).join(', ')}`,
    );
  }

  if (unmappedRanges.size > 0) {
    lines.push(
      `# No single-release fix command generated for ranges without a matching selected Jira version: ${[...unmappedRanges].toSorted(compareStrings).join(', ')}`,
    );
  }

  if (lines.length === 0) {
    return '';
  }

  return [
    '### Example fix-version commands by component',
    '',
    '```bash',
    ...lines,
    '```',
    '',
  ].join('\n');
};

const getSelectedJiraVersionsForIssue = (
  issue: JiraIssue,
  jiraVersions: JiraVersion[],
): JiraVersion[] => {
  const issueFixVersions = issue.fixVersions ?? [];

  return jiraVersions.filter((jiraVersion) =>
    issueFixVersions.some(
      ({ id, name }) => jiraVersion.id === id || jiraVersion.name === name,
    ),
  );
};

const addClinicalReviewCommandsForIssue = ({
  commandEntries,
  gitTags,
  issue,
  issuesWithoutSelectedVersion,
  jiraVersions,
  repoRoot,
}: {
  commandEntries: Set<string>;
  gitTags: SelectedGitTag[];
  issue: JiraIssue;
  issuesWithoutSelectedVersion: string[];
  jiraVersions: JiraVersion[];
  repoRoot: string;
}): void => {
  const matchingJiraVersions = getSelectedJiraVersionsForIssue(
    issue,
    jiraVersions,
  );

  if (matchingJiraVersions.length === 0) {
    issuesWithoutSelectedVersion.push(issue.key);
    return;
  }

  for (const jiraVersion of matchingJiraVersions) {
    const gitTag = findGitTagForJiraVersion(jiraVersion, gitTags);
    if (gitTag) {
      for (const component of issue.components) {
        commandEntries.add(
          `# ${component}\n${formatFixCommand({
            action: 'clinical-review-not-needed',
            component,
            gitTag: gitTag.gitTag,
            jiraVersion: jiraVersion.name,
            repoRoot,
          })}`,
        );
      }
    } else {
      issuesWithoutSelectedVersion.push(issue.key);
    }
  }
};

const renderClinicalReviewCommandExamples = ({
  gitTags,
  issues,
  jiraVersions,
  repoRoot,
}: {
  gitTags: SelectedGitTag[];
  issues: JiraIssue[];
  jiraVersions: JiraVersion[];
  repoRoot: string;
}): string => {
  const commandEntries = new Set<string>();
  const issuesWithoutComponents: string[] = [];
  const issuesWithoutSelectedVersion: string[] = [];

  for (const issue of issues) {
    if (issue.components.length === 0) {
      issuesWithoutComponents.push(issue.key);
    } else {
      addClinicalReviewCommandsForIssue({
        commandEntries,
        gitTags,
        issue,
        issuesWithoutSelectedVersion,
        jiraVersions,
        repoRoot,
      });
    }
  }

  const lines = [...commandEntries].toSorted(compareStrings);

  if (issuesWithoutComponents.length > 0) {
    lines.push(
      `# Manual review needed: no component set for ${issuesWithoutComponents.toSorted(compareStrings).join(', ')}`,
    );
  }

  if (issuesWithoutSelectedVersion.length > 0) {
    lines.push(
      `# No single-release clinical review command generated for ${[...new Set(issuesWithoutSelectedVersion)].toSorted(compareStrings).join(', ')}`,
    );
  }

  if (lines.length === 0) {
    return '';
  }

  return [
    '### Example clinical-review-not-needed commands by component',
    '',
    '```bash',
    ...lines,
    '```',
    '',
  ].join('\n');
};

const sanitizeFileSegment = (value: string): string =>
  value.replaceAll(/[^A-Za-z0-9._-]+/g, '-');

const summarizeGitTagsForPath = (gitTags: string[]): string =>
  gitTags.length === 1
    ? sanitizeFileSegment(gitTags[0])
    : `${sanitizeFileSegment(gitTags[0])}-to-${sanitizeFileSegment(gitTags.at(-1) ?? gitTags[0])}-${gitTags.length}-tags`;

const formatGitTagSummary = (gitTags: SelectedGitTag[]): string =>
  gitTags.map((gitTag) => formatSelectedGitTagLabel(gitTag)).join(', ');

const formatComparisonBaseSummary = (gitTags: SelectedGitTag[]): string =>
  gitTags
    .map(
      (gitTag) =>
        `${formatSelectedGitTagLabel(gitTag)} <- ${gitTag.previousTag ?? 'repository start'}`,
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
  jiraBaseUrl = DEFAULT_JIRA_BASE_URL,
  jiraProject,
  jiraVersions,
  outsideReleaseIssuesByKey,
  selectedReleaseIssuesByKey = new Map<string, JiraIssue>(),
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
  jiraBaseUrl?: string;
  jiraProject: string;
  jiraVersions: JiraVersion[];
  outsideReleaseIssuesByKey: Map<string, JiraIssue>;
  selectedReleaseIssuesByKey?: Map<string, JiraIssue>;
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
  const mappedCommits = getMappedCommits(comparison);
  const showReleaseRangeComparison = gitTags.length > 1;
  const sections = [
    '# Release check report',
    '',
    `- **Repository:** ${repoName}`,
    `- **Repository root:** ${repoRoot}`,
    singleGitTag
      ? `- **Git tag:** ${formatSelectedGitTagLabel(gitTags[0])}`
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
    `- Commit ticket mappings applied: ${mappedCommits.length}`,
    ...renderGitRangeMappings(gitTags, jiraVersions),
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
  const mappedIssuesByKey = new Map([
    ...selectedReleaseIssuesByKey,
    ...outsideReleaseIssuesByKey,
    ...selectedIssuesByKey,
  ]);

  sections.push(
    renderIssueSection(
      `Jira issues in ${jiraScopeLabel} with no matching git reference`,
      comparison.jiraIssuesMissingFromGit.map((issue) => issue.key),
      selectedIssuesByKey,
      comparison.commitsByIssueKey,
      showReleaseRangeComparison,
      jiraBaseUrl,
    ),
    renderIssueSection(
      `Jira issues in ${jiraScopeLabel} with no matching release-note reference`,
      comparison.jiraIssuesMissingFromReleaseNotes.map((issue) => issue.key),
      selectedIssuesByKey,
      comparison.commitsByIssueKey,
      showReleaseRangeComparison,
      jiraBaseUrl,
    ),
    renderIssueSection(
      'Jira issues referenced in git or release notes but not in a done status',
      comparison.releaseReferencedIssuesNotDone.map((issue) => issue.key),
      selectedIssuesByKey,
      comparison.commitsByIssueKey,
      showReleaseRangeComparison,
      jiraBaseUrl,
    ),
    renderIssueSection(
      'Jira issues missing clinical safety category',
      comparison.jiraIssuesMissingClinicalSafetyCategory.map(
        (issue) => issue.key,
      ),
      selectedIssuesByKey,
      comparison.commitsByIssueKey,
      showReleaseRangeComparison,
      jiraBaseUrl,
    ),
    renderClinicalReviewCommandExamples({
      gitTags,
      issues: comparison.jiraIssuesMissingClinicalSafetyCategory,
      jiraVersions,
      repoRoot,
    }),
    renderIssueSection(
      'Jira issues missing clinical lead',
      comparison.jiraIssuesMissingClinicalLead.map((issue) => issue.key),
      selectedIssuesByKey,
      comparison.commitsByIssueKey,
      showReleaseRangeComparison,
      jiraBaseUrl,
    ),
    renderIssueSection(
      `Git-referenced Jira issue keys missing from ${jiraVersionScopeLabel}`,
      outsideReleaseIssueKeys,
      outsideReleaseIssuesByKey,
      comparison.commitsByIssueKey,
      showReleaseRangeComparison,
      jiraBaseUrl,
    ),
    renderFixVersionCommandExamples({
      commitsByIssueKey: comparison.commitsByIssueKey,
      gitTags,
      issueKeys: outsideReleaseIssueKeys,
      jiraVersions,
      outsideReleaseIssuesByKey,
      repoRoot,
    }),
    renderIssueSection(
      `Release-note Jira issue keys missing from ${jiraVersionScopeLabel}`,
      comparison.releaseNotesIssueKeysOutsideRelease,
      outsideReleaseIssuesByKey,
      comparison.commitsByIssueKey,
      showReleaseRangeComparison,
      jiraBaseUrl,
    ),
    ...(fixAction && fixComponent && fixProposals
      ? [
          renderFixProposalSection(
            fixAction,
            fixComponent,
            fixProposals,
            comparison.commitsByIssueKey,
            showReleaseRangeComparison,
            jiraBaseUrl,
          ),
        ]
      : []),
    renderSimpleSection(
      'Commits without a Jira key or exact Jira-summary match',
      comparison.commitsWithoutMatches.map((commit) => formatCommit(commit)),
    ),
    ...(mappedCommits.length > 0
      ? [
          renderMappedCommitSection({
            commits: mappedCommits,
            issueByKey: mappedIssuesByKey,
            jiraBaseUrl,
          }),
        ]
      : []),
  );

  return sections.join('\n').replaceAll(/\n{3,}/g, '\n\n');
};

export { renderFixProposalSection, renderFixProposalTerminalSection };
