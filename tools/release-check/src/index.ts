import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';

import { parseCliArgs } from './args';
import { compareRelease } from './compare';
import {
  applyCommitIssueKeyMappings,
  collectCommitsForTags,
  findDefaultCommitIssueMappingFile,
  getPreviousTag,
  getRepoName,
  getRepoRoot,
  listTags,
  readCommitIssueKeyMappings,
  resolveGitTags,
  resolveRepoPath,
} from './git';
import { readReleaseNotesForTags } from './github-release';
import {
  fetchJiraIssues,
  fetchJiraIssuesByKeys,
  listJiraVersions,
  resolveJiraVersions,
  updateJiraIssueClinicalReviewStatus,
  updateJiraIssueFixVersions,
} from './jira';
import {
  defaultReportPath,
  renderFixProposalTerminalSection,
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

const formatSelectedGitTagLabel = ({
  gitTag,
  rangeEndTag,
}: SelectedGitTag): string =>
  rangeEndTag && rangeEndTag !== gitTag
    ? `${gitTag} (+ patches through ${rangeEndTag})`
    : gitTag;

const formatGitTagSummary = (gitTags: SelectedGitTag[]): string =>
  gitTags.map((gitTag) => formatSelectedGitTagLabel(gitTag)).join(', ');

const formatComparisonBaseSummary = (gitTags: SelectedGitTag[]): string =>
  gitTags
    .map(
      (gitTag) =>
        `${formatSelectedGitTagLabel(gitTag)} <- ${gitTag.previousTag ?? 'repository start'}`,
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

const removePlaceholderFixVersions = (
  fixVersions: JiraIssueFixDetails['fixVersions'],
): JiraIssueFixDetails['fixVersions'] =>
  fixVersions.filter(
    (fixVersion) => fixVersion.name.trim().toUpperCase() !== 'NA',
  );
const appendFixVersion = (
  fixVersions: JiraIssueFixDetails['fixVersions'],
  targetVersion: JiraVersion,
): JiraIssueFixDetails['fixVersions'] => [
  ...removePlaceholderFixVersions(fixVersions),
  {
    id: targetVersion.id,
    name: targetVersion.name,
  },
];

const PROPOSED_FIX_UPDATE_MAX_LENGTH = 60;

const truncateSummary = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }

  if (maxLength <= 3) {
    return value.slice(0, maxLength);
  }

  return `${value.slice(0, maxLength - 3)}...`;
};

const formatProposedFixVersionUpdate = (
  targetVersion: JiraVersion,
  existingFixVersions: JiraIssueFixDetails['fixVersions'],
): string => {
  if (existingFixVersions.length === 0) {
    return targetVersion.name;
  }

  const retainedFixVersions = removePlaceholderFixVersions(existingFixVersions);
  if (retainedFixVersions.length === 0) {
    return targetVersion.name;
  }

  const summary = `${targetVersion.name} + ${retainedFixVersions.length} (${retainedFixVersions.map(({ name }) => name).join(', ')})`;

  return truncateSummary(summary, PROPOSED_FIX_UPDATE_MAX_LENGTH);
};
const dedupeIssuesByKey = <T extends { key: string }>(issues: T[]): T[] =>
  dedupeBy(issues, (issue) => issue.key);

const VERSION_TAG_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)$/;

type ParsedVersionTag = {
  major: number;
  minor: number;
  patch: number;
};

const parseVersionTag = (tag: string): ParsedVersionTag | undefined => {
  const match = VERSION_TAG_PATTERN.exec(tag);
  if (!match) {
    return undefined;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
};

const isSameMinorSeries = (
  left: ParsedVersionTag,
  right: ParsedVersionTag,
): boolean => left.major === right.major && left.minor === right.minor;

const compareVersionTags = (left: string, right: string): number => {
  const parsedLeft = parseVersionTag(left);
  const parsedRight = parseVersionTag(right);

  if (!parsedLeft || !parsedRight) {
    return left.localeCompare(right);
  }

  return (
    parsedLeft.major - parsedRight.major ||
    parsedLeft.minor - parsedRight.minor ||
    parsedLeft.patch - parsedRight.patch ||
    left.localeCompare(right)
  );
};

const hasSpecificJiraVersionForTag = (
  gitTag: string,
  jiraVersions: JiraVersion[],
): boolean => {
  const parsedTag = parseVersionTag(gitTag);
  if (!parsedTag) {
    return false;
  }

  const versionSuffix = `${parsedTag.major}.${parsedTag.minor}.${parsedTag.patch}`;
  return jiraVersions.some((jiraVersion) =>
    jiraVersion.name.endsWith(versionSuffix),
  );
};

const findCanonicalSeriesBaseTag = (
  gitTag: string,
  availableTags: string[],
): string => {
  const parsedTag = parseVersionTag(gitTag);
  if (!parsedTag) {
    return gitTag;
  }

  return (
    availableTags.find((candidateTag) => {
      const parsedCandidate = parseVersionTag(candidateTag);
      return (
        parsedCandidate &&
        parsedCandidate.patch === 0 &&
        isSameMinorSeries(parsedCandidate, parsedTag)
      );
    }) ?? gitTag
  );
};

const findPatchRollupEndTag = (
  repoRoot: string,
  canonicalBaseTag: string,
  availableTags: string[],
  jiraVersions: JiraVersion[],
): string => {
  const parsedBaseTag = parseVersionTag(canonicalBaseTag);
  if (!parsedBaseTag) {
    return canonicalBaseTag;
  }

  const sameSeriesCandidates = availableTags
    .filter((candidateTag) => {
      const parsedCandidate = parseVersionTag(candidateTag);
      return (
        candidateTag !== canonicalBaseTag &&
        parsedCandidate &&
        isSameMinorSeries(parsedCandidate, parsedBaseTag)
      );
    })
    .toSorted(compareVersionTags);
  let currentTag = canonicalBaseTag;

  while (true) {
    let nextTag: string | undefined;

    for (const candidateTag of sameSeriesCandidates) {
      if (getPreviousTag(repoRoot, candidateTag) === currentTag) {
        nextTag = candidateTag;
        break;
      }
    }

    if (!nextTag) {
      break;
    }

    const parsedNextTag = parseVersionTag(nextTag);
    if (
      parsedNextTag &&
      parsedNextTag.patch > 0 &&
      hasSpecificJiraVersionForTag(nextTag, jiraVersions)
    ) {
      break;
    }

    currentTag = nextTag;
  }

  return currentTag;
};

const getCanonicalBaseTag = (
  resolvedTagName: string,
  availableTags: string[],
  projectJiraVersions: JiraVersion[],
): string => {
  const parsedResolvedTag = parseVersionTag(resolvedTagName);
  if (parsedResolvedTag?.patch === 0) {
    return findCanonicalSeriesBaseTag(resolvedTagName, availableTags);
  }

  if (hasSpecificJiraVersionForTag(resolvedTagName, projectJiraVersions)) {
    return resolvedTagName;
  }

  return findCanonicalSeriesBaseTag(resolvedTagName, availableTags);
};

const resolveSelectedGitTags = async (
  repoRoot: string,
  gitTagSelectors: string[],
  jiraBaseUrl: string,
  jiraProject: string,
  previousTag?: string,
): Promise<SelectedGitTag[]> => {
  const availableTags = listTags(repoRoot);
  const projectJiraVersions = await listJiraVersions(jiraBaseUrl, jiraProject);
  const resolvedSelectedTagNames = resolveGitTags(repoRoot, gitTagSelectors);
  const seenBaseTags = new Set<string>();
  const orderedBaseTags: string[] = [];

  for (const resolvedTagName of resolvedSelectedTagNames) {
    const canonicalBaseTag = getCanonicalBaseTag(
      resolvedTagName,
      availableTags,
      projectJiraVersions,
    );

    if (!seenBaseTags.has(canonicalBaseTag)) {
      seenBaseTags.add(canonicalBaseTag);
      orderedBaseTags.push(canonicalBaseTag);
    }
  }

  return orderedBaseTags
    .toSorted(compareVersionTags)
    .map((canonicalBaseTag, index) => ({
      gitTag: canonicalBaseTag,
      previousTag: getPreviousTag(
        repoRoot,
        canonicalBaseTag,
        index === 0 ? previousTag : undefined,
      ),
      rangeEndTag: findPatchRollupEndTag(
        repoRoot,
        canonicalBaseTag,
        availableTags,
        projectJiraVersions,
      ),
    }));
};

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
      proposedUpdateSummary: formatProposedFixVersionUpdate(
        targetVersion,
        issue.fixVersions,
      ),
      targetValueSummary: formatFixVersions(
        appendFixVersion(issue.fixVersions, targetVersion),
      ),
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

  await updateJiraIssueFixVersions(
    jiraBaseUrl,
    proposal.issue.key,
    appendFixVersion(proposal.issue.fixVersions, jiraVersion),
  );
};

const maybeWriteComparisonReport = async ({
  comparison,
  fixAction,
  fixComponent,
  fixProposals,
  gitTags,
  jiraBaseUrl,
  jiraProject,
  jiraVersions,
  output,
  outsideReleaseIssuesByKey,
  releaseNotes,
  repoName,
  repoRoot,
  totalJiraIssues,
}: {
  comparison: ReturnType<typeof compareRelease>;
  fixAction?: NonNullable<ReturnType<typeof parseCliArgs>['fixAction']>;
  fixComponent?: string;
  fixProposals?: FixProposal[];
  gitTags: SelectedGitTag[];
  jiraBaseUrl: string;
  jiraProject: string;
  jiraVersions: JiraVersion[];
  output?: string;
  outsideReleaseIssuesByKey: Map<string, JiraIssue>;
  releaseNotes: Awaited<ReturnType<typeof readReleaseNotesForTags>>;
  repoName: string;
  repoRoot: string;
  totalJiraIssues: number;
}): Promise<string | undefined> => {
  if (fixAction) {
    return undefined;
  }

  const outputPath = path.resolve(
    output ??
      defaultReportPath(
        repoName,
        gitTags.map(({ gitTag }) => gitTag),
      ),
  );
  const report = renderReport({
    comparison,
    fixAction,
    fixComponent,
    fixProposals,
    gitTags,
    jiraBaseUrl,
    jiraProject,
    jiraVersions,
    releaseNotes,
    repoName,
    repoRoot,
    outsideReleaseIssuesByKey,
    totalJiraIssues,
  });

  await writeReport(outputPath, report);
  return outputPath;
};

const maybeApplyFixProposals = async ({
  commitsByIssueKey,
  fixAction,
  fixComponent,
  fixProposals,
  jiraBaseUrl,
  jiraVersion,
  yes,
}: {
  commitsByIssueKey: ReturnType<typeof compareRelease>['commitsByIssueKey'];
  fixAction?: NonNullable<ReturnType<typeof parseCliArgs>['fixAction']>;
  fixComponent?: string;
  fixProposals?: FixProposal[];
  jiraBaseUrl: string;
  jiraVersion: JiraVersion;
  yes: boolean;
}): Promise<void> => {
  if (!fixAction || !fixProposals) {
    return;
  }

  const fixActionLabel = getFixActionLabel(fixAction);
  const proposalSection = renderFixProposalTerminalSection(
    fixActionLabel,
    fixComponent!,
    fixProposals,
    commitsByIssueKey,
  );
  const confirmed = await confirmFixApplication(
    proposalSection,
    fixActionLabel,
    yes,
  );

  if (!confirmed) {
    process.stdout.write(
      `Aborted without applying ${fixActionLabel} updates.\n`,
    );
    return;
  }

  for (const proposal of fixProposals) {
    await applyFixProposal(jiraBaseUrl, fixAction, proposal, jiraVersion);
  }

  process.stdout.write(
    `Applied ${fixActionLabel} updates to ${fixProposals.length} issue(s).\n`,
  );
};

export const run = async (argv: string[]): Promise<void> => {
  const options = parseCliArgs(argv);
  const repoPath = resolveRepoPath(options.repo);
  const repoRoot = getRepoRoot(repoPath);
  const repoName = getRepoName(repoRoot);
  const commitMappingFile =
    options.commitMappingFile ?? findDefaultCommitIssueMappingFile(repoRoot);
  const commitIssueKeyMappings = commitMappingFile
    ? await readCommitIssueKeyMappings(repoRoot, commitMappingFile)
    : new Map<string, string>();
  const selectedGitTags = await resolveSelectedGitTags(
    repoRoot,
    options.gitTagSelectors,
    options.jiraBaseUrl,
    options.jiraProject,
    options.previousTag,
  );
  const commits = applyCommitIssueKeyMappings(
    collectCommitsForTags(repoRoot, selectedGitTags),
    commitIssueKeyMappings,
  );

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

  const outputPath = await maybeWriteComparisonReport({
    comparison,
    fixAction: options.fixAction,
    fixComponent: options.fixComponent,
    fixProposals,
    gitTags: selectedGitTags,
    jiraBaseUrl: options.jiraBaseUrl,
    jiraProject: options.jiraProject,
    jiraVersions,
    output: options.output,
    outsideReleaseIssuesByKey,
    releaseNotes,
    repoName,
    repoRoot,
    totalJiraIssues: jiraIssues.length,
  });

  await maybeApplyFixProposals({
    commitsByIssueKey: comparison.commitsByIssueKey,
    fixAction: options.fixAction,
    fixComponent: options.fixComponent,
    fixProposals,
    jiraBaseUrl: options.jiraBaseUrl,
    jiraVersion: jiraVersions[0],
    yes: options.yes,
  });

  const summaryLines = [
    `Repository: ${repoName}`,
    selectedGitTags.length === 1
      ? `Git tag: ${formatSelectedGitTagLabel(selectedGitTags[0])}`
      : `Git tags selected (${selectedGitTags.length}): ${formatGitTagSummary(selectedGitTags)}`,
    selectedGitTags.length === 1
      ? `Comparison base: ${selectedGitTags[0].previousTag ?? 'repository start'}`
      : `Comparison bases: ${formatComparisonBaseSummary(selectedGitTags)}`,
    `Commits inspected: ${commits.length}`,
    jiraVersions.length === 1
      ? `Jira version: ${jiraVersions[0].name} (${jiraVersions[0].id})`
      : `Jira versions selected (${jiraVersions.length}): ${formatJiraVersionSummary(jiraVersions)}`,
    `Commit ticket mappings applied: ${commits.filter((commit) => commit.issueKeyOverride != null).length}`,
    `Jira issues in ${jiraVersions.length === 1 ? 'release' : 'selected releases'}: ${jiraIssues.length}`,
    `Jira issues missing from git: ${comparison.jiraIssuesMissingFromGit.length}`,
    `Jira issues missing from release notes: ${comparison.jiraIssuesMissingFromReleaseNotes.length}`,
    `Referenced Jira issues not done: ${comparison.releaseReferencedIssuesNotDone.length}`,
    `Jira issues missing clinical safety category: ${comparison.jiraIssuesMissingClinicalSafetyCategory.length}`,
    `Jira issues missing clinical lead: ${comparison.jiraIssuesMissingClinicalLead.length}`,
    `Commits without Jira matches: ${comparison.commitsWithoutMatches.length}`,
    ...(outputPath ? [`Report written to ${outputPath}`] : []),
  ];

  process.stdout.write(`${summaryLines.join('\n')}\n`);
};
