import { run } from '..';

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../git', () => ({
  collectCommitsForTags: jest.fn(),
  getPreviousTag: jest.fn(),
  getRepoName: jest.fn(),
  getRepoRoot: jest.fn(),
  resolveGitTags: jest.fn(),
  resolveRepoPath: jest.fn(),
}));

jest.mock('../jira', () => ({
  fetchJiraIssues: jest.fn(),
  resolveJiraVersions: jest.fn(),
}));

jest.mock('../github-release', () => ({
  readReleaseNotesForTags: jest.fn(),
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
const mockedResolveGitTags = git.resolveGitTags as jest.MockedFunction<
  typeof git.resolveGitTags
>;
const mockedGetPreviousTag = git.getPreviousTag as jest.MockedFunction<
  typeof git.getPreviousTag
>;
const mockedCollectCommitsForTags =
  git.collectCommitsForTags as jest.MockedFunction<
    typeof git.collectCommitsForTags
  >;
const mockedResolveJiraVersions =
  jira.resolveJiraVersions as jest.MockedFunction<
    typeof jira.resolveJiraVersions
  >;
const mockedFetchJiraIssues = jira.fetchJiraIssues as jest.MockedFunction<
  typeof jira.fetchJiraIssues
>;
const mockedReadReleaseNotesForTags =
  notes.readReleaseNotesForTags as jest.MockedFunction<
    typeof notes.readReleaseNotesForTags
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
    mockedResolveGitTags.mockReturnValue(['0.1.0']);
    mockedGetPreviousTag.mockReturnValue('0.0.9');
    mockedCollectCommitsForTags.mockReturnValue([]);
    mockedResolveJiraVersions.mockResolvedValue([
      {
        id: '71260',
        name: 'release',
        releaseDate: '2026-07-08',
        released: true,
      },
    ]);
    mockedFetchJiraIssues.mockResolvedValue([]);
    mockedReadReleaseNotesForTags.mockResolvedValue({
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
    expect(mockedResolveGitTags).toHaveBeenCalledWith('/repo', ['0.1.0']);
    expect(mockedResolveJiraVersions).toHaveBeenCalledWith(
      'https://nhsd-jira.digital.nhs.uk',
      'CCM',
      ['71260'],
    );
    expect(mockedReadReleaseNotesForTags).toHaveBeenCalledWith(
      '/repo',
      ['0.1.0'],
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

  it('aggregates multiple selected releases into one run', async () => {
    mockedResolveGitTags.mockReturnValue(['0.1.0', 'v0.2.0']);
    mockedGetPreviousTag.mockReturnValueOnce(null).mockReturnValueOnce('0.1.0');
    mockedCollectCommitsForTags.mockReturnValue([
      {
        hash: 'a'.repeat(40),
        shortHash: 'aaaaaaaa',
        subject: 'CCM-100: ship it',
        body: '',
        explicitIssueKeys: ['CCM-100'],
      },
    ]);
    mockedResolveJiraVersions.mockResolvedValue([
      {
        id: '71260',
        name: 'release-a',
        releaseDate: '2026-07-08',
        released: true,
      },
      {
        id: '71261',
        name: 'release-b',
        releaseDate: null,
        released: false,
      },
    ]);
    mockedFetchJiraIssues
      .mockResolvedValueOnce([
        {
          key: 'CCM-1',
          clinicalLead: '',
          clinicalReviewStatus: '',
          components: [],
          medicalClinicalSafetyCategory: '',
          status: 'Done',
          summary: 'one',
        },
      ])
      .mockResolvedValueOnce([
        {
          key: 'CCM-1',
          clinicalLead: '',
          clinicalReviewStatus: '',
          components: [],
          medicalClinicalSafetyCategory: '',
          status: 'Done',
          summary: 'duplicate one',
        },
      ]);

    await run([
      '--repo',
      '../repo',
      '--git-tags',
      '0.1.0,v0.2.0',
      '--jira-versions',
      'release-a,release-b',
    ]);

    expect(mockedDefaultReportPath).toHaveBeenCalledWith('repo', [
      '0.1.0',
      'v0.2.0',
    ]);
    expect(mockedFetchJiraIssues).toHaveBeenCalledTimes(2);
    expect(mockedRenderReport).toHaveBeenCalledWith(
      expect.objectContaining({
        gitTags: [
          { gitTag: '0.1.0', previousTag: null },
          { gitTag: 'v0.2.0', previousTag: '0.1.0' },
        ],
        jiraVersions: [
          {
            id: '71260',
            name: 'release-a',
            releaseDate: '2026-07-08',
            released: true,
          },
          {
            id: '71261',
            name: 'release-b',
            releaseDate: null,
            released: false,
          },
        ],
        totalJiraIssues: 1,
      }),
    );
    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining('Git tags selected (2): 0.1.0, v0.2.0\n'),
    );
    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining(
        'Comparison bases: 0.1.0 <- repository start; v0.2.0 <- 0.1.0\n',
      ),
    );
    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining(
        'Jira versions selected (2): release-a (71260), release-b (71261)\n',
      ),
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
