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
  listTags: jest.fn(),
  resolveGitTags: jest.fn(),
  resolveRepoPath: jest.fn(),
}));

jest.mock('../jira', () => ({
  fetchJiraIssues: jest.fn(),
  fetchJiraIssuesByKeys: jest.fn(),
  listJiraVersions: jest.fn(),
  resolveJiraVersions: jest.fn(),
  updateJiraIssueClinicalReviewStatus: jest.fn(),
  updateJiraIssueFixVersions: jest.fn(),
}));

jest.mock('../github-release', () => ({
  readReleaseNotesForTags: jest.fn(),
}));

jest.mock('../compare', () => ({
  compareRelease: jest.fn(),
}));

jest.mock('../report', () => ({
  defaultReportPath: jest.fn(),
  renderFixProposalSection: jest.fn(),
  renderFixProposalTerminalSection: jest.fn(),
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
const mockedListTags = git.listTags as jest.MockedFunction<typeof git.listTags>;
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
const mockedListJiraVersions = jira.listJiraVersions as jest.MockedFunction<
  typeof jira.listJiraVersions
>;
const mockedFetchJiraIssues = jira.fetchJiraIssues as jest.MockedFunction<
  typeof jira.fetchJiraIssues
>;
const mockedFetchJiraIssuesByKeys =
  jira.fetchJiraIssuesByKeys as jest.MockedFunction<
    typeof jira.fetchJiraIssuesByKeys
  >;
const mockedUpdateJiraIssueClinicalReviewStatus =
  jira.updateJiraIssueClinicalReviewStatus as jest.MockedFunction<
    typeof jira.updateJiraIssueClinicalReviewStatus
  >;
const mockedUpdateJiraIssueFixVersions =
  jira.updateJiraIssueFixVersions as jest.MockedFunction<
    typeof jira.updateJiraIssueFixVersions
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
const mockedRenderFixProposalSection =
  report.renderFixProposalSection as jest.MockedFunction<
    typeof report.renderFixProposalSection
  >;
const mockedRenderFixProposalTerminalSection =
  report.renderFixProposalTerminalSection as jest.MockedFunction<
    typeof report.renderFixProposalTerminalSection
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
    mockedListTags.mockReturnValue(['0.1.0']);
    mockedResolveGitTags.mockReturnValue(['0.1.0']);
    mockedGetPreviousTag.mockReturnValue('0.0.9');
    mockedCollectCommitsForTags.mockReturnValue([]);
    mockedListJiraVersions.mockResolvedValue([
      {
        id: '71260',
        name: 'release',
        releaseDate: '2026-07-08',
        released: true,
      },
    ]);
    mockedResolveJiraVersions.mockResolvedValue([
      {
        id: '71260',
        name: 'release',
        releaseDate: '2026-07-08',
        released: true,
      },
    ]);
    mockedFetchJiraIssues.mockResolvedValue([]);
    mockedFetchJiraIssuesByKeys.mockResolvedValue([]);
    mockedUpdateJiraIssueClinicalReviewStatus.mockResolvedValue(undefined);
    mockedUpdateJiraIssueFixVersions.mockResolvedValue(undefined);
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
    mockedRenderFixProposalSection.mockReturnValue('fix proposal section');
    mockedRenderFixProposalTerminalSection.mockReturnValue(
      'fix proposal terminal section',
    );
    mockedRenderReport.mockReturnValue('report');
  });

  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
  });

  it('runs the end-to-end comparison and writes the report', async () => {
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
    expect(mockedListJiraVersions).toHaveBeenCalledWith(
      'https://nhsd-jira.digital.nhs.uk',
      'CCM',
    );
    expect(mockedReadReleaseNotesForTags).toHaveBeenCalledWith(
      '/repo',
      ['0.1.0'],
      'auto',
    );
    expect(mockedFetchJiraIssuesByKeys).toHaveBeenCalledWith(
      'https://nhsd-jira.digital.nhs.uk',
      'CCM',
      [],
    );
    expect(fsPromises.mkdir).toHaveBeenCalledWith('/workspace', {
      recursive: true,
    });
    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      '/workspace/report.txt',
      'report',
      'utf8',
    );
    expect(mockedRenderReport).toHaveBeenCalledWith(
      expect.objectContaining({
        fixAction: undefined,
        fixComponent: undefined,
        fixProposals: undefined,
        jiraBaseUrl: 'https://nhsd-jira.digital.nhs.uk',
      }),
    );
    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining('Report written to /workspace/report.txt\n'),
    );
  });

  it('aggregates multiple selected releases into one run', async () => {
    mockedListTags.mockReturnValue(['0.1.0', 'v0.2.0']);
    mockedResolveGitTags.mockReturnValue(['0.1.0', 'v0.2.0']);
    mockedGetPreviousTag.mockReturnValueOnce(null).mockReturnValueOnce('0.1.0');
    mockedListJiraVersions.mockResolvedValue([
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
          issueType: 'Story',
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
          issueType: 'Story',
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
          { gitTag: '0.1.0', previousTag: null, rangeEndTag: '0.1.0' },
          {
            gitTag: 'v0.2.0',
            previousTag: '0.1.0',
            rangeEndTag: 'v0.2.0',
          },
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
  });

  it('rolls patch tags into the base release when Jira has no patch version', async () => {
    mockedListTags.mockReturnValue(['0.3.0', 'v0.3.0', 'v0.3.1']);
    mockedResolveGitTags.mockReturnValue(['0.3.0', 'v0.3.0', 'v0.3.1']);
    mockedListJiraVersions.mockResolvedValue([
      {
        id: '73218',
        name: 'client-config-0.3.0',
        releaseDate: null,
        released: true,
      },
    ]);
    mockedResolveJiraVersions.mockResolvedValue([
      {
        id: '73218',
        name: 'client-config-0.3.0',
        releaseDate: null,
        released: true,
      },
    ]);
    mockedGetPreviousTag.mockImplementation((_, gitTag) => {
      if (gitTag === '0.3.0') {
        return 'v0.2.0';
      }

      if (gitTag === 'v0.3.0') {
        return '0.3.0';
      }

      if (gitTag === 'v0.3.1') {
        return 'v0.3.0';
      }

      return 'v0.2.0';
    });

    await run([
      '--repo',
      '../repo',
      '--git-tags',
      '0.3.0,v0.3.0,v0.3.1',
      '--jira-version',
      'client-config-0.3.0',
    ]);

    expect(mockedCollectCommitsForTags).toHaveBeenCalledWith('/repo', [
      {
        gitTag: '0.3.0',
        previousTag: 'v0.2.0',
        rangeEndTag: 'v0.3.1',
      },
    ]);
  });

  it('proposes and applies component-filtered fix versions in fix mode', async () => {
    mockedCollectCommitsForTags.mockReturnValue([
      {
        hash: 'a'.repeat(40),
        shortHash: 'aaaaaaaa',
        subject: 'CCM-100: ship it',
        body: '',
        explicitIssueKeys: ['CCM-100'],
      },
    ]);
    mockedCompareRelease.mockReturnValue({
      commitsByIssueKey: new Map([
        [
          'CCM-100',
          [
            {
              hash: 'a'.repeat(40),
              shortHash: 'aaaaaaaa',
              subject: 'CCM-100: ship it',
              body: '',
              explicitIssueKeys: ['CCM-100'],
              matchedIssueKeys: ['CCM-100'],
            },
          ],
        ],
      ]),
      commitsWithIssueKeysOutsideRelease: [
        {
          commit: {
            hash: 'a'.repeat(40),
            shortHash: 'aaaaaaaa',
            subject: 'CCM-100: ship it',
            body: '',
            explicitIssueKeys: ['CCM-100'],
            matchedIssueKeys: ['CCM-100'],
          },
          missingKeys: ['CCM-100'],
        },
      ],
      commitsWithoutMatches: [],
      gitReferencedIssueKeys: ['CCM-100'],
      jiraIssuesMissingClinicalLead: [],
      jiraIssuesMissingClinicalSafetyCategory: [],
      jiraIssuesMissingFromGit: [],
      jiraIssuesMissingFromReleaseNotes: [],
      notesReferencedIssueKeys: [],
      releaseReferencedIssuesNotDone: [],
      releaseNotesIssueKeysOutsideRelease: [],
    });
    mockedFetchJiraIssuesByKeys.mockResolvedValue([
      {
        key: 'CCM-100',
        clinicalLead: '',
        clinicalReviewStatus: '',
        components: ['Platform'],
        fixVersions: [],
        issueType: 'Story',
        medicalClinicalSafetyCategory: '',
        status: 'Done',
        summary: 'outside',
      },
    ]);

    await run([
      '--repo',
      '../repo',
      '--git-tag',
      '0.1.0',
      '--jira-version',
      '71260',
      '--fix',
      'fix-version',
      '--fix-component',
      'Platform',
      '--yes',
    ]);

    expect(mockedRenderFixProposalTerminalSection).toHaveBeenCalled();
    expect(mockedRenderFixProposalTerminalSection).toHaveBeenCalledWith(
      'fixVersion',
      'Platform',
      [
        expect.objectContaining({
          currentValueSummary: 'none',
          proposedUpdateSummary: 'release',
          targetValueSummary: 'release',
        }),
      ],
      expect.any(Map),
    );
    expect(mockedRenderReport).not.toHaveBeenCalled();
    expect(fsPromises.writeFile).not.toHaveBeenCalled();
    expect(mockedUpdateJiraIssueFixVersions).toHaveBeenCalledWith(
      'https://nhsd-jira.digital.nhs.uk',
      'CCM-100',
      [{ id: '71260', name: 'release' }],
    );
    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining('Applied fixVersion updates to 1 issue(s).\n'),
    );
  });

  it('shows additive fix-version proposals when issues already have other fix versions', async () => {
    mockedCompareRelease.mockReturnValue({
      commitsByIssueKey: new Map([
        [
          'CCM-100',
          [
            {
              hash: 'a'.repeat(40),
              shortHash: 'aaaaaaaa',
              subject: 'CCM-100: ship it',
              body: '',
              explicitIssueKeys: ['CCM-100'],
              matchedIssueKeys: ['CCM-100'],
            },
          ],
        ],
      ]),
      commitsWithIssueKeysOutsideRelease: [
        {
          commit: {
            hash: 'a'.repeat(40),
            shortHash: 'aaaaaaaa',
            subject: 'CCM-100: ship it',
            body: '',
            explicitIssueKeys: ['CCM-100'],
            matchedIssueKeys: ['CCM-100'],
          },
          missingKeys: ['CCM-100'],
        },
      ],
      commitsWithoutMatches: [],
      gitReferencedIssueKeys: ['CCM-100'],
      jiraIssuesMissingClinicalLead: [],
      jiraIssuesMissingClinicalSafetyCategory: [],
      jiraIssuesMissingFromGit: [],
      jiraIssuesMissingFromReleaseNotes: [],
      notesReferencedIssueKeys: [],
      releaseReferencedIssuesNotDone: [],
      releaseNotesIssueKeysOutsideRelease: [],
    });
    mockedFetchJiraIssuesByKeys.mockResolvedValue([
      {
        key: 'CCM-100',
        clinicalLead: '',
        clinicalReviewStatus: '',
        components: ['Platform'],
        fixVersions: [{ id: '70000', name: 'other-release' }],
        issueType: 'Story',
        medicalClinicalSafetyCategory: '',
        status: 'Done',
        summary: 'outside',
      },
    ]);

    await run([
      '--repo',
      '../repo',
      '--git-tag',
      '0.1.0',
      '--jira-version',
      '71260',
      '--fix',
      'fix-version',
      '--fix-component',
      'Platform',
      '--yes',
    ]);

    expect(mockedRenderFixProposalTerminalSection).toHaveBeenCalledWith(
      'fixVersion',
      'Platform',
      [
        expect.objectContaining({
          currentValueSummary: 'other-release',
          proposedUpdateSummary: 'release + 1 (other-release)',
          targetValueSummary: 'other-release, release',
        }),
      ],
      expect.any(Map),
    );
    expect(mockedUpdateJiraIssueFixVersions).toHaveBeenCalledWith(
      'https://nhsd-jira.digital.nhs.uk',
      'CCM-100',
      [
        { id: '70000', name: 'other-release' },
        { id: '71260', name: 'release' },
      ],
    );
  });

  it('applies component-filtered clinical review status updates', async () => {
    mockedCompareRelease.mockReturnValue({
      commitsByIssueKey: new Map([
        [
          'CCM-100',
          [
            {
              hash: 'a'.repeat(40),
              shortHash: 'aaaaaaaa',
              subject: 'CCM-100: ship it',
              body: '',
              explicitIssueKeys: ['CCM-100'],
              matchedIssueKeys: ['CCM-100'],
            },
          ],
        ],
      ]),
      commitsWithIssueKeysOutsideRelease: [],
      commitsWithoutMatches: [],
      gitReferencedIssueKeys: [],
      jiraIssuesMissingClinicalLead: [
        {
          key: 'CCM-100',
          clinicalLead: '',
          clinicalReviewStatus: 'Review required',
          components: ['Platform'],
          issueType: 'Story',
          medicalClinicalSafetyCategory: '',
          status: 'Done',
          summary: 'needs review update',
        },
      ],
      jiraIssuesMissingClinicalSafetyCategory: [],
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
      '--fix',
      'clinical-review-not-needed',
      '--fix-component',
      'Platform',
      '--yes',
    ]);

    expect(mockedUpdateJiraIssueClinicalReviewStatus).toHaveBeenCalledWith(
      'https://nhsd-jira.digital.nhs.uk',
      'CCM-100',
    );
    expect(mockedRenderReport).not.toHaveBeenCalled();
    expect(fsPromises.writeFile).not.toHaveBeenCalled();
    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining(
        'Applied clinical review status updates to 1 issue(s).\n',
      ),
    );
  });
});
