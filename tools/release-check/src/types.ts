export type JiraIssue = {
  clinicalLead: string;
  clinicalReviewStatus: string;
  components: string[];
  key: string;
  medicalClinicalSafetyCategory: string;
  status: string;
  summary: string;
};

export type GitCommit = {
  body: string;
  explicitIssueKeys: string[];
  hash: string;
  shortHash: string;
  subject: string;
};

export type ReleaseNotesSource = 'auto' | 'github' | 'tag' | 'none';

export type ReleaseNotes = {
  issueKeys: string[];
  source: 'github-release' | 'tag-annotation' | 'none';
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
  gitTag: string;
  jiraBaseUrl: string;
  jiraProject: string;
  jiraVersion: string;
  output?: string;
  previousTag?: string;
  releaseNotesSource: ReleaseNotesSource;
  repo: string;
};
