export type JiraIssue = {
  clinicalLead: string;
  clinicalReviewStatus: string;
  components: string[];
  epicKey?: string;
  fixVersions?: JiraFixVersion[];
  issueType: string;
  key: string;
  medicalClinicalSafetyCategory: string;
  nwrLinks?: string[];
  status: string;
  summary: string;
};

export type JiraFixVersion = {
  id: string;
  name: string;
};

export type JiraIssueFixDetails = JiraIssue & {
  fixVersions: JiraFixVersion[];
};

export type GitCommit = {
  body: string;
  explicitIssueKeys: string[];
  hash: string;
  issueKeyOverride?: {
    commitHash: string;
    issueKey: string;
  };
  releaseRange?: string;
  releaseTag?: string;
  shortHash: string;
  subject: string;
};

export type ReleaseNotesSource = 'auto' | 'github' | 'tag' | 'none';

export type ReleaseNotesLookupSource =
  'github-release' | 'mixed' | 'none' | 'tag-annotation';

export type ReleaseNoteEntry = {
  issueKeys: string[];
  pullRequestNumber: number | null;
};

export type ReleaseNotes = {
  entries: ReleaseNoteEntry[];
  issueKeys: string[];
  source: ReleaseNotesLookupSource;
  text: string | null;
  warnings: string[];
};

export type JiraVersion = {
  id: string;
  name: string;
  releaseDate: string | null;
  released: boolean;
};

export type MatchedCommit = GitCommit & {
  detectedIssueKeys?: string[];
  issueKeySource?: 'explicit' | 'mapped' | 'none' | 'summary';
  matchedIssueKeys: string[];
};

export type ComparisonResult = {
  commitsByIssueKey: Map<string, MatchedCommit[]>;
  commitsWithIssueKeysOutsideRelease: {
    commit: MatchedCommit;
    missingKeys: string[];
  }[];
  commitsWithoutMatches: MatchedCommit[];
  gitReferencedIssueKeys: string[];
  jiraIssuesMissingClinicalLead: JiraIssue[];
  jiraIssuesMissingClinicalSafetyCategory: JiraIssue[];
  jiraIssuesMissingFromGit: JiraIssue[];
  jiraIssuesMissingFromReleaseNotes: JiraIssue[];
  notesReferencedIssueKeys: string[];
  releaseReferencedIssuesNotDone: JiraIssue[];
  releaseNotesIssueKeysOutsideRelease: string[];
};

export type EpicNwrProblem =
  'epic-not-found' | 'not-an-epic' | 'no-nwr-link' | 'wrong-nwr-link';

export type EpicNwrFinding = {
  epic?: JiraIssue;
  epicKey: string;
  linkedNwrKeys: string[];
  problem: EpicNwrProblem;
  referencedBy: string[];
};

export type EpicUsage = {
  epic?: JiraIssue;
  epicKey: string;
  issueKeys: string[];
};

export type EpicCheckResult = {
  epicsInUse: EpicUsage[];
  epicsWithNwrProblems: EpicNwrFinding[];
  issuesWithoutEpic: JiraIssue[];
  nwrKey: string;
};

export type CliOptions = {
  commitMappingFile?: string;
  epicKey?: string;
  fixAction?: FixAction;
  fixComponent?: string;
  gitTagSelectors: string[];
  jiraBaseUrl: string;
  jiraProject: string;
  jiraVersionSelectors: string[];
  nwrKey: string;
  output?: string;
  previousTag?: string;
  releaseNotesSource: ReleaseNotesSource;
  repo: string;
  ticketKeys: string[];
  yes: boolean;
};

export type FixAction =
  'fix-version' | 'clinical-review-not-needed' | 'link-nwr' | 'assign-epic';

export type FixProposal = {
  currentValueSummary: string;
  issue: JiraIssueFixDetails;
  proposedUpdateSummary?: string;
  targetValueSummary: string;
};

export type SelectedGitTag = {
  gitTag: string;
  previousTag: string | null;
  rangeEndTag?: string;
};
