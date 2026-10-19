import type {
  ComparisonResult,
  GitCommit,
  JiraIssue,
  MatchedCommit,
} from './types';

const DONE_STATUSES = new Set([
  'Done',
  'Closed',
  'Resolved',
  'Live Services Consult',
]);
const compareIssueKeys = (left: string, right: string): number =>
  left.localeCompare(right);

const stripPullRequestSuffix = (text: string): string => {
  const trimmed = text.trimEnd();
  const suffixStart = trimmed.lastIndexOf(' (#');
  if (suffixStart === -1 || !trimmed.endsWith(')')) {
    return trimmed;
  }

  const candidate = trimmed.slice(suffixStart + 3, -1);
  if (
    !candidate ||
    [...candidate].some((character) => character < '0' || character > '9')
  ) {
    return trimmed;
  }

  return trimmed.slice(0, suffixStart).trimEnd();
};

const normalise = (text: string): string =>
  stripPullRequestSuffix(text)
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, ' ')
    .trim();

const shouldCheckClinicalReview = (issue: JiraIssue): boolean =>
  issue.issueType !== 'Bug' &&
  issue.clinicalReviewStatus !== 'Review not needed';

const findSummaryMatches = (subject: string, issues: JiraIssue[]): string[] => {
  const normalisedSubject = normalise(subject);
  if (!normalisedSubject) {
    return [];
  }

  return issues
    .filter((issue) => normalise(issue.summary) === normalisedSubject)
    .map((issue) => issue.key);
};

const matchCommit = (commit: GitCommit, issues: JiraIssue[]): MatchedCommit => {
  const detectedIssueKeys =
    commit.explicitIssueKeys.length > 0
      ? commit.explicitIssueKeys
      : findSummaryMatches(commit.subject, issues);
  let issueKeySource: MatchedCommit['issueKeySource'];

  if (commit.explicitIssueKeys.length > 0) {
    issueKeySource = 'explicit';
  } else if (detectedIssueKeys.length > 0) {
    issueKeySource = 'summary';
  } else {
    issueKeySource = 'none';
  }

  if (commit.issueKeyOverride) {
    return {
      ...commit,
      detectedIssueKeys,
      issueKeySource: 'mapped',
      matchedIssueKeys: [commit.issueKeyOverride.issueKey],
    };
  }

  return {
    ...commit,
    detectedIssueKeys,
    issueKeySource,
    matchedIssueKeys: detectedIssueKeys,
  };
};

export const compareRelease = (
  commits: GitCommit[],
  issues: JiraIssue[],
  releaseNoteIssueKeys: string[],
): ComparisonResult => {
  const issueMap = new Map(issues.map((issue) => [issue.key, issue]));
  const matchedCommits = commits.map((commit) => matchCommit(commit, issues));
  const commitsByIssueKey = new Map<string, MatchedCommit[]>();
  const commitsWithoutMatches: MatchedCommit[] = [];
  const commitsWithIssueKeysOutsideRelease: {
    commit: MatchedCommit;
    missingKeys: string[];
  }[] = [];

  for (const commit of matchedCommits) {
    const { matchedIssueKeys } = commit;
    if (matchedIssueKeys.length === 0) {
      commitsWithoutMatches.push(commit);
    } else {
      const missingKeys = matchedIssueKeys.filter((key) => !issueMap.has(key));
      if (missingKeys.length > 0) {
        commitsWithIssueKeysOutsideRelease.push({ commit, missingKeys });
      }

      for (const key of matchedIssueKeys) {
        const existing = commitsByIssueKey.get(key) ?? [];
        existing.push(commit);
        commitsByIssueKey.set(key, existing);
      }
    }
  }

  const gitReferencedIssueKeys = [...commitsByIssueKey.keys()].toSorted(
    compareIssueKeys,
  );
  const notesReferencedIssueKeys = [...new Set(releaseNoteIssueKeys)].toSorted(
    compareIssueKeys,
  );

  const jiraIssuesMissingFromGit = issues.filter(
    (issue) => !commitsByIssueKey.has(issue.key),
  );
  const jiraIssuesMissingFromReleaseNotes = issues.filter(
    (issue) => !notesReferencedIssueKeys.includes(issue.key),
  );
  const jiraIssuesMissingClinicalSafetyCategory = issues.filter(
    (issue) =>
      issue.medicalClinicalSafetyCategory === '' &&
      shouldCheckClinicalReview(issue),
  );
  const jiraIssuesMissingClinicalLead = issues.filter(
    (issue) => issue.clinicalLead === '' && shouldCheckClinicalReview(issue),
  );
  const releaseNotesIssueKeysOutsideRelease = notesReferencedIssueKeys.filter(
    (key) => !issueMap.has(key),
  );

  const releaseReferencedIssuesNotDone = issues.filter(
    (issue) =>
      (commitsByIssueKey.has(issue.key) ||
        notesReferencedIssueKeys.includes(issue.key)) &&
      !DONE_STATUSES.has(issue.status),
  );

  return {
    commitsByIssueKey,
    commitsWithIssueKeysOutsideRelease,
    commitsWithoutMatches,
    gitReferencedIssueKeys,
    jiraIssuesMissingClinicalLead,
    jiraIssuesMissingClinicalSafetyCategory,
    jiraIssuesMissingFromGit,
    jiraIssuesMissingFromReleaseNotes,
    notesReferencedIssueKeys,
    releaseReferencedIssuesNotDone,
    releaseNotesIssueKeysOutsideRelease,
  };
};
