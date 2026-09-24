import { run } from '..';

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../git', () => ({
  collectCommits: jest.fn(),
  ensureCommitishExists: jest.fn(),
  getPreviousTag: jest.fn(),
  getRepoName: jest.fn(),
  getRepoRoot: jest.fn(),
  resolveRepoPath: jest.fn(),
}));

jest.mock('../jira', () => ({
  fetchJiraIssues: jest.fn(),
  resolveJiraVersion: jest.fn(),
}));

jest.mock('../github-release', () => ({
  readReleaseNotes: jest.fn(),
}));

jest.mock('../compare', () => ({
  compareRelease: jest.fn(),
}));

jest.mock('../report', () => ({
  defaultReportPath: jest.fn(),
  renderReport: jest.fn(),
}));

const fsPromises =
  jest.requireMock<typeof import('node:fs/promises')>('node:fs/promises');
const git = jest.requireMock<typeof import('../git')>('../git');
const jira = jest.requireMock<typeof import('../jira')>('../jira');
const notes =
  jest.requireMock<typeof import('../github-release')>('../github-release');
const compare = jest.requireMock<typeof import('../compare')>('../compare');
const report = jest.requireMock<typeof import('../report')>('../report');
const mockedResolveRepoPath = git.resolveRepoPath as jest.MockedFunction<
  typeof git.resolveRepoPath
>;
const mockedGetRepoRoot = git.getRepoRoot as jest.MockedFunction<
  typeof git.getRepoRoot
>;
const mockedGetRepoName = git.getRepoName as jest.MockedFunction<
  typeof git.getRepoName
>;
const mockedGetPreviousTag = git.getPreviousTag as jest.MockedFunction<
  typeof git.getPreviousTag
>;
const mockedCollectCommits = git.collectCommits as jest.MockedFunction<
  typeof git.collectCommits
>;
const mockedResolveJiraVersion = jira.resolveJiraVersion as jest.MockedFunction<
  typeof jira.resolveJiraVersion
>;
const mockedFetchJiraIssues = jira.fetchJiraIssues as jest.MockedFunction<
  typeof jira.fetchJiraIssues
>;
const mockedReadReleaseNotes = notes.readReleaseNotes as jest.MockedFunction<
  typeof notes.readReleaseNotes
>;
const mockedCompareRelease = compare.compareRelease as jest.MockedFunction<
  typeof compare.compareRelease
>;
const mockedDefaultReportPath = report.defaultReportPath as jest.MockedFunction<
  typeof report.defaultReportPath
>;
const mockedRenderReport = report.renderReport as jest.MockedFunction<
  typeof report.renderReport
>;

describe('run', () => {
  const originalStdoutWrite = process.stdout.write;
  const stdoutWrite = jest.fn().mockReturnValue(true);

  beforeEach(() => {
    jest.clearAllMocks();
    process.stdout.write = stdoutWrite as typeof process.stdout.write;

    mockedResolveRepoPath.mockReturnValue('/repo');
    mockedGetRepoRoot.mockReturnValue('/repo');
    mockedGetRepoName.mockReturnValue('repo');
    mockedGetPreviousTag.mockReturnValue('0.0.9');
    mockedCollectCommits.mockReturnValue([]);
    mockedResolveJiraVersion.mockResolvedValue({
      id: '71260',
      name: 'release',
      releaseDate: '2026-07-08',
      released: true,
    });
    mockedFetchJiraIssues.mockResolvedValue([]);
    mockedReadReleaseNotes.mockResolvedValue({
      issueKeys: [],
      source: 'none',
      text: null,
      warnings: [],
    });
    mockedCompareRelease.mockReturnValue({
      commitsByIssueKey: new Map(),
      commitsWithIssueKeysOutsideRelease: [],
      commitsWithoutMatches: [],
      gitReferencedIssueKeys: [],
      jiraIssuesMissingClinicalLead: [],
      jiraIssuesMissingClinicalSafetyCategory: [],
      jiraIssuesMissingFromGit: [],
      jiraIssuesMissingFromReleaseNotes: [],
      notesReferencedIssueKeys: [],
      releaseReferencedIssuesNotDone: [],
      releaseNotesIssueKeysOutsideRelease: [],
    });
    mockedDefaultReportPath.mockReturnValue('/workspace/report.txt');
    mockedRenderReport.mockReturnValue('report');
  });

  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
  });

  it('runs the end-to-end comparison and writes the report', async () => {
    mockedCompareRelease.mockReturnValue({
      commitsByIssueKey: new Map(),
      commitsWithIssueKeysOutsideRelease: [],
      commitsWithoutMatches: [],
      gitReferencedIssueKeys: [],
      jiraIssuesMissingClinicalLead: [
        {
          clinicalLead: '',
          clinicalReviewStatus: 'Pending',
          components: [],
          key: 'CCM-2',
          medicalClinicalSafetyCategory: '',
          status: 'Done',
          summary: 'lead missing',
        },
      ],
      jiraIssuesMissingClinicalSafetyCategory: [
        {
          clinicalLead: '',
          clinicalReviewStatus: 'Pending',
          components: [],
          key: 'CCM-1',
          medicalClinicalSafetyCategory: '',
          status: 'Done',
          summary: 'category missing',
        },
      ],
      jiraIssuesMissingFromGit: [],
      jiraIssuesMissingFromReleaseNotes: [],
      notesReferencedIssueKeys: [],
      releaseReferencedIssuesNotDone: [],
      releaseNotesIssueKeysOutsideRelease: [],
    });

    await run([
      '--repo',
      '../repo',
      '--git-tag',
      '0.1.0',
      '--jira-version',
      '71260',
    ]);

    expect(mockedResolveRepoPath).toHaveBeenCalledWith('../repo');
    expect(git.ensureCommitishExists).toHaveBeenCalledWith('/repo', '0.1.0');
    expect(mockedReadReleaseNotes).toHaveBeenCalledWith(
      '/repo',
      '0.1.0',
      'auto',
    );
    expect(fsPromises.mkdir).toHaveBeenCalledWith('/workspace', {
      recursive: true,
    });
    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      '/workspace/report.txt',
      'report',
      'utf8',
    );
    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining(
        'Jira issues missing clinical safety category: 1\n',
      ),
    );
    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining('Jira issues missing clinical lead: 1\n'),
    );
    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining('Report written to /workspace/report.txt\n'),
    );
  });

  it('respects an explicit output path and a missing previous tag', async () => {
    mockedGetPreviousTag.mockReturnValue(null);

    await run([
      '--repo',
      '../repo',
      '--git-tag',
      '0.1.0',
      '--jira-version',
      '71260',
      '--output',
      'reports/custom.txt',
    ]);

    expect(mockedDefaultReportPath).not.toHaveBeenCalled();
    expect(fsPromises.mkdir).toHaveBeenCalledWith(
      expect.stringContaining('/reports'),
      { recursive: true },
    );
    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining('Comparison base: repository start\n'),
    );
  });
});
