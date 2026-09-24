export type JiraIssue = {
  clinicalLead: string;
  clinicalReviewStatus: string;
  components: string[];
  issueType: string;
  key: string;
  medicalClinicalSafetyCategory: string;
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
  shortHash: string;
  subject: string;
};

export type ReleaseNotesSource = 'auto' | 'github' | 'tag' | 'none';

export type ReleaseNotesLookupSource =
  'github-release' | 'mixed' | 'none' | 'tag-annotation';

export type ReleaseNotes = {
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

export type CliOptions = {
  fixAction?: FixAction;
  fixComponent?: string;
  gitTagSelectors: string[];
  jiraBaseUrl: string;
  jiraProject: string;
  jiraVersionSelectors: string[];
  output?: string;
  previousTag?: string;
  releaseNotesSource: ReleaseNotesSource;
  repo: string;
  yes: boolean;
};

export type FixAction = 'fix-version' | 'clinical-review-not-needed';

export type FixProposal = {
  currentValueSummary: string;
  issue: JiraIssueFixDetails;
  targetValueSummary: string;
};

export type SelectedGitTag = {
  gitTag: string;
  previousTag: string | null;
};
