import { run } from '..';

import type { JiraIssue } from '../types';

jest.mock('node:readline/promises', () => ({
  createInterface: jest.fn(),
}));

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../git', () => ({
  applyCommitIssueKeyMappings: jest.fn(),
  collectCommitsForTags: jest.fn(),
  findDefaultCommitIssueMappingFile: jest.fn(),
  getPreviousTag: jest.fn(),
  getRepoName: jest.fn(),
  getRepoRoot: jest.fn(),
  listTags: jest.fn(),
  readCommitIssueKeyMappings: jest.fn(),
  resolveGitTags: jest.fn(),
  resolveRepoPath: jest.fn(),
}));

jest.mock('../jira', () => ({
  fetchJiraIssues: jest.fn(),
  fetchJiraIssuesByKeys: jest.fn(),
  linkJiraEpicToNwr: jest.fn(),
  listJiraVersions: jest.fn(),
  resolveJiraVersions: jest.fn(),
  updateJiraIssueClinicalReviewStatus: jest.fn(),
  updateJiraIssueEpicLink: jest.fn(),
  updateJiraIssueFixVersions: jest.fn(),
}));

jest.mock('../github-release', () => ({
  applyCommitMappingsToReleaseNotes: jest.fn(),
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
const readlinePromises = jest.requireMock<
  typeof import('node:readline/promises')
>('node:readline/promises');

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
const mockedFindDefaultCommitIssueMappingFile =
  git.findDefaultCommitIssueMappingFile as jest.MockedFunction<
    typeof git.findDefaultCommitIssueMappingFile
  >;
const mockedApplyCommitIssueKeyMappings =
  git.applyCommitIssueKeyMappings as jest.MockedFunction<
    typeof git.applyCommitIssueKeyMappings
  >;
const mockedReadCommitIssueKeyMappings =
  git.readCommitIssueKeyMappings as jest.MockedFunction<
    typeof git.readCommitIssueKeyMappings
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
const mockedUpdateJiraIssueEpicLink =
  jira.updateJiraIssueEpicLink as jest.MockedFunction<
    typeof jira.updateJiraIssueEpicLink
  >;
const mockedLinkJiraEpicToNwr = jira.linkJiraEpicToNwr as jest.MockedFunction<
  typeof jira.linkJiraEpicToNwr
>;
const mockedUpdateJiraIssueFixVersions =
  jira.updateJiraIssueFixVersions as jest.MockedFunction<
    typeof jira.updateJiraIssueFixVersions
  >;
const mockedApplyCommitMappingsToReleaseNotes =
  notes.applyCommitMappingsToReleaseNotes as jest.MockedFunction<
    typeof notes.applyCommitMappingsToReleaseNotes
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
const mockedCreateInterface =
  readlinePromises.createInterface as jest.MockedFunction<
    typeof readlinePromises.createInterface
  >;

const originalStdinIsTTY = Object.getOwnPropertyDescriptor(
  process.stdin,
  'isTTY',
);
const originalStdoutIsTTY = Object.getOwnPropertyDescriptor(
  process.stdout,
  'isTTY',
);

const setStreamTty = (
  stream: NodeJS.ReadStream | NodeJS.WriteStream,
  value: boolean,
): void => {
  Object.defineProperty(stream, 'isTTY', {
    configurable: true,
    value,
  });
};

const buildEpic = (
  key: string,
  components: string[],
  nwrLinks: string[],
): JiraIssue => ({
  clinicalLead: '',
  clinicalReviewStatus: '',
  components,
  epicKey: '',
  issueType: 'Epic',
  key,
  medicalClinicalSafetyCategory: '',
  nwrLinks,
  status: 'In Progress',
  summary: `epic ${key}`,
});

const story = (key: string, epicKey = ''): JiraIssue => ({
  clinicalLead: '',
  clinicalReviewStatus: '',
  components: ['Platform'],
  epicKey,
  issueType: 'Story',
  key,
  medicalClinicalSafetyCategory: '',
  nwrLinks: [],
  status: 'Done',
  summary: `story ${key}`,
});
const runAssign = (tickets: string, epic = 'CCM-10') =>
  run([
    '--repo',
    '../repo',
    '--git-tag',
    '0.1.0',
    '--jira-version',
    '71260',
    '--fix',
    'assign-epic',
    '--tickets',
    tickets,
    '--epic',
    epic,
    '--yes',
  ]);

describe('run', () => {
  const originalStdoutWrite = process.stdout.write;
  const stdoutWrite = jest.fn().mockReturnValue(true);

  beforeEach(() => {
    jest.clearAllMocks();
    process.stdout.write = stdoutWrite as typeof process.stdout.write;
    setStreamTty(process.stdin, false);
    setStreamTty(process.stdout, false);

    mockedResolveRepoPath.mockReturnValue('/repo');
    mockedGetRepoRoot.mockReturnValue('/repo');
    mockedGetRepoName.mockReturnValue('repo');
    mockedListTags.mockReturnValue(['0.1.0']);
    mockedResolveGitTags.mockReturnValue(['0.1.0']);
    mockedGetPreviousTag.mockReturnValue('0.0.9');
    mockedCollectCommitsForTags.mockReturnValue([]);
    mockedFindDefaultCommitIssueMappingFile.mockReturnValue(undefined);
    mockedApplyCommitIssueKeyMappings.mockImplementation((commits) => commits);
    mockedReadCommitIssueKeyMappings.mockResolvedValue(new Map());
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
    mockedLinkJiraEpicToNwr.mockResolvedValue(undefined);
    mockedUpdateJiraIssueEpicLink.mockResolvedValue(undefined);
    mockedApplyCommitMappingsToReleaseNotes.mockImplementation(
      (releaseNotes) => releaseNotes,
    );
    mockedReadReleaseNotesForTags.mockResolvedValue({
      entries: [],
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

  afterAll(() => {
    if (originalStdinIsTTY) {
      Object.defineProperty(process.stdin, 'isTTY', originalStdinIsTTY);
    }
    if (originalStdoutIsTTY) {
      Object.defineProperty(process.stdout, 'isTTY', originalStdoutIsTTY);
    }
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
    expect(mockedApplyCommitIssueKeyMappings).toHaveBeenCalledWith(
      [],
      new Map(),
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
        epicCheck: {
          epicsInUse: [],
          epicsWithNwrProblems: [],
          issuesWithoutEpic: [],
          nwrKey: 'NWR-2198',
        },
      }),
    );
    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining('Report written to /workspace/report.txt\n'),
    );
  });

  it('reads and applies commit ticket mappings when configured', async () => {
    mockedCollectCommitsForTags.mockReturnValue([
      {
        hash: 'a'.repeat(40),
        shortHash: 'aaaaaaaa',
        subject: 'CCM-999: wrong ticket',
        body: '',
        explicitIssueKeys: ['CCM-999'],
      },
    ]);
    mockedApplyCommitIssueKeyMappings.mockReturnValue([
      {
        hash: 'a'.repeat(40),
        shortHash: 'aaaaaaaa',
        subject: 'CCM-999: wrong ticket',
        body: '',
        explicitIssueKeys: ['CCM-999'],
        issueKeyOverride: {
          commitHash: 'aaaaaaa',
          issueKey: 'CCM-100',
        },
      },
    ]);
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

    await run([
      '--repo',
      '../repo',
      '--git-tag',
      '0.1.0',
      '--jira-version',
      '71260',
      '--commit-mapping-file',
      '.release-check/map.txt',
    ]);

    expect(mockedReadCommitIssueKeyMappings).toHaveBeenCalledWith(
      '/repo',
      '.release-check/map.txt',
    );
    expect(mockedApplyCommitIssueKeyMappings).toHaveBeenCalledWith(
      [
        {
          hash: 'a'.repeat(40),
          shortHash: 'aaaaaaaa',
          subject: 'CCM-999: wrong ticket',
          body: '',
          explicitIssueKeys: ['CCM-999'],
        },
      ],
      new Map(),
    );
    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining('Commit ticket mappings applied: 1\n'),
    );
  });

  it('auto-detects a .jira-commits file from the target repo root', async () => {
    mockedFindDefaultCommitIssueMappingFile.mockReturnValue(
      '/repo/.jira-commits',
    );

    await run([
      '--repo',
      '../repo',
      '--git-tag',
      '0.1.0',
      '--jira-version',
      '71260',
    ]);

    expect(mockedFindDefaultCommitIssueMappingFile).toHaveBeenCalledWith(
      '/repo',
    );
    expect(mockedReadCommitIssueKeyMappings).toHaveBeenCalledWith(
      '/repo',
      '/repo/.jira-commits',
    );
  });

  it('prefers an explicit mapping file over the repo-root .jira-commits file', async () => {
    mockedFindDefaultCommitIssueMappingFile.mockReturnValue(
      '/repo/.jira-commits',
    );

    await run([
      '--repo',
      '../repo',
      '--git-tag',
      '0.1.0',
      '--jira-version',
      '71260',
      '--commit-mapping-file',
      '.release-check/map.txt',
    ]);

    expect(mockedReadCommitIssueKeyMappings).toHaveBeenCalledWith(
      '/repo',
      '.release-check/map.txt',
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
          issueType: 'Story',
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
          issueType: 'Story',
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

  it('matches issues that have the requested component alongside other components', async () => {
    mockedCollectCommitsForTags.mockReturnValue([
      {
        hash: 'a'.repeat(40),
        shortHash: 'aaaaaaaa',
        subject: 'CCM-9336: ship it',
        body: '',
        explicitIssueKeys: ['CCM-9336'],
      },
    ]);
    mockedCompareRelease.mockReturnValue({
      commitsByIssueKey: new Map([
        [
          'CCM-9336',
          [
            {
              hash: 'a'.repeat(40),
              shortHash: 'aaaaaaaa',
              subject: 'CCM-9336: ship it',
              body: '',
              explicitIssueKeys: ['CCM-9336'],
              matchedIssueKeys: ['CCM-9336'],
            },
          ],
        ],
      ]),
      commitsWithIssueKeysOutsideRelease: [
        {
          commit: {
            hash: 'a'.repeat(40),
            shortHash: 'aaaaaaaa',
            subject: 'CCM-9336: ship it',
            body: '',
            explicitIssueKeys: ['CCM-9336'],
            matchedIssueKeys: ['CCM-9336'],
          },
          missingKeys: ['CCM-9336'],
        },
      ],
      commitsWithoutMatches: [],
      gitReferencedIssueKeys: ['CCM-9336'],
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
        key: 'CCM-9336',
        clinicalLead: '',
        clinicalReviewStatus: '',
        components: ['Cohorting - Platform', 'Platform'],
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
      'Cohorting - Platform',
      '--yes',
    ]);

    expect(mockedRenderFixProposalTerminalSection).toHaveBeenCalledWith(
      'fixVersion',
      'Cohorting - Platform',
      [
        expect.objectContaining({
          issue: expect.objectContaining({ key: 'CCM-9336' }),
        }),
      ],
      expect.any(Map),
    );
    expect(mockedUpdateJiraIssueFixVersions).toHaveBeenCalledWith(
      'https://nhsd-jira.digital.nhs.uk',
      'CCM-9336',
      [{ id: '71260', name: 'release' }],
    );
  });

  it('skips matching issues when they already have the target fix version', async () => {
    mockedCollectCommitsForTags.mockReturnValue([
      {
        hash: 'a'.repeat(40),
        shortHash: 'aaaaaaaa',
        subject: 'CCM-9336: ship it',
        body: '',
        explicitIssueKeys: ['CCM-9336'],
      },
    ]);
    mockedCompareRelease.mockReturnValue({
      commitsByIssueKey: new Map([
        [
          'CCM-9336',
          [
            {
              hash: 'a'.repeat(40),
              shortHash: 'aaaaaaaa',
              subject: 'CCM-9336: ship it',
              body: '',
              explicitIssueKeys: ['CCM-9336'],
              matchedIssueKeys: ['CCM-9336'],
            },
          ],
        ],
      ]),
      commitsWithIssueKeysOutsideRelease: [
        {
          commit: {
            hash: 'a'.repeat(40),
            shortHash: 'aaaaaaaa',
            subject: 'CCM-9336: ship it',
            body: '',
            explicitIssueKeys: ['CCM-9336'],
            matchedIssueKeys: ['CCM-9336'],
          },
          missingKeys: ['CCM-9336'],
        },
      ],
      commitsWithoutMatches: [],
      gitReferencedIssueKeys: ['CCM-9336'],
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
        key: 'CCM-9336',
        clinicalLead: '',
        clinicalReviewStatus: '',
        components: ['Cohorting - Platform', 'Platform'],
        fixVersions: [{ id: '71260', name: 'release' }],
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
      'Cohorting - Platform',
      '--yes',
    ]);

    expect(mockedRenderFixProposalTerminalSection).toHaveBeenCalledWith(
      'fixVersion',
      'Cohorting - Platform',
      [],
      expect.any(Map),
    );
    expect(mockedUpdateJiraIssueFixVersions).not.toHaveBeenCalled();
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

  it('removes the placeholder NA fix version when adding a real release version', async () => {
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
        fixVersions: [{ id: 'na', name: 'NA' }],
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
          currentValueSummary: 'NA',
          proposedUpdateSummary: 'release',
          targetValueSummary: 'release',
        }),
      ],
      expect.any(Map),
    );
    expect(mockedUpdateJiraIssueFixVersions).toHaveBeenCalledWith(
      'https://nhsd-jira.digital.nhs.uk',
      'CCM-100',
      [{ id: '71260', name: 'release' }],
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

  it('links component-filtered epics that have no NWR link', async () => {
    mockedFetchJiraIssues.mockResolvedValue([
      buildEpic('CCM-1', ['Platform'], []),
      buildEpic('CCM-2', ['Architecture'], []),
      buildEpic('CCM-3', ['Platform'], ['NWR-1']),
      buildEpic('CCM-4', ['Platform'], ['NWR-2198']),
    ]);

    await run([
      '--repo',
      '../repo',
      '--git-tag',
      '0.1.0',
      '--jira-version',
      '71260',
      '--fix',
      'link-nwr',
      '--fix-component',
      'Platform',
      '--yes',
    ]);

    expect(mockedLinkJiraEpicToNwr).toHaveBeenCalledTimes(1);
    expect(mockedLinkJiraEpicToNwr).toHaveBeenCalledWith(
      'https://nhsd-jira.digital.nhs.uk',
      'CCM-1',
      'NWR-2198',
    );
    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining('Applied NWR link updates to 1 issue(s).\n'),
    );
  });

  it('links every epic with no NWR link when no component is given', async () => {
    mockedFetchJiraIssues.mockResolvedValue([
      buildEpic('CCM-1', ['Platform'], []),
      buildEpic('CCM-2', ['Architecture'], []),
      buildEpic('CCM-3', ['Platform'], ['NWR-1']),
    ]);

    await run([
      '--repo',
      '../repo',
      '--git-tags',
      '0.1.0,0.2.0',
      '--jira-versions',
      '71260',
      '--fix',
      'link-nwr',
      '--yes',
    ]);

    expect(mockedLinkJiraEpicToNwr.mock.calls.map(([, key]) => key)).toEqual([
      'CCM-1',
      'CCM-2',
    ]);
    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining('Applied NWR link updates to 2 issue(s).\n'),
    );
  });

  describe('assign-epic fix', () => {
    it('assigns release and outside-release tickets to the epic, skipping those already in it', async () => {
      mockedFetchJiraIssues.mockResolvedValue([
        story('CCM-1'),
        story('CCM-2', 'CCM-10'),
        story('CCM-3', 'CCM-11'),
        buildEpic('CCM-10', ['Platform'], ['NWR-2198']),
      ]);
      mockedFetchJiraIssuesByKeys.mockImplementation(async (_url, _p, keys) =>
        keys.includes('CCM-4') ? [{ ...story('CCM-4'), fixVersions: [] }] : [],
      );

      await runAssign('CCM-1,CCM-2,CCM-3,CCM-4');

      expect(mockedUpdateJiraIssueEpicLink.mock.calls).toEqual([
        ['https://nhsd-jira.digital.nhs.uk', 'CCM-1', 'CCM-10'],
        ['https://nhsd-jira.digital.nhs.uk', 'CCM-3', 'CCM-10'],
        ['https://nhsd-jira.digital.nhs.uk', 'CCM-4', 'CCM-10'],
      ]);
      expect(stdoutWrite).toHaveBeenCalledWith(
        expect.stringContaining(
          'Applied epic assignment updates to 3 issue(s).\n',
        ),
      );
    });

    it('rejects an epic that is not an Epic or cannot be found', async () => {
      mockedFetchJiraIssues.mockResolvedValue([
        story('CCM-1'),
        story('CCM-10'),
      ]);

      await expect(runAssign('CCM-1')).rejects.toThrow(
        'CCM-10 is a Story, not an Epic.',
      );
      await expect(runAssign('CCM-1', 'CCM-77')).rejects.toThrow(
        'Epic CCM-77 was not found in Jira project CCM.',
      );
      expect(mockedUpdateJiraIssueEpicLink).not.toHaveBeenCalled();
    });

    it('rejects unknown tickets and tickets that cannot have an epic', async () => {
      mockedFetchJiraIssues.mockResolvedValue([
        buildEpic('CCM-10', ['Platform'], []),
        buildEpic('CCM-11', ['Platform'], []),
      ]);

      await expect(runAssign('CCM-404')).rejects.toThrow(
        'Tickets not found in Jira project CCM: CCM-404',
      );
      await expect(runAssign('CCM-11')).rejects.toThrow(
        'CCM-11 is a Epic and cannot be assigned to an epic.',
      );
      expect(mockedUpdateJiraIssueEpicLink).not.toHaveBeenCalled();
    });
  });

  it('requires an interactive terminal for fix mode without --yes', async () => {
    mockedCompareRelease.mockReturnValue({
      commitsByIssueKey: new Map(),
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

    await expect(
      run([
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
      ]),
    ).rejects.toThrow(
      'Applying fixVersion updates requires an interactive terminal unless --yes is provided.',
    );
  });

  it('aborts fix mode when the user declines confirmation', async () => {
    const close = jest.fn();

    setStreamTty(process.stdin, true);
    setStreamTty(process.stdout, true);
    mockedCreateInterface.mockReturnValue({
      close,
      question: jest.fn().mockResolvedValue('n'),
    } as never);
    mockedCompareRelease.mockReturnValue({
      commitsByIssueKey: new Map(),
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
    ]);

    expect(close).toHaveBeenCalled();
    expect(mockedUpdateJiraIssueFixVersions).not.toHaveBeenCalled();
    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining('Aborted without applying fixVersion updates.\n'),
    );
  });

  it('rejects fix mode when multiple tags or Jira versions are resolved', async () => {
    mockedResolveGitTags.mockReturnValue(['0.1.0', 'v0.2.0']);
    mockedGetPreviousTag.mockReturnValueOnce(null).mockReturnValueOnce('0.1.0');
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

    await expect(
      run([
        '--repo',
        '../repo',
        '--git-tags',
        '0.1.0,v0.2.0',
        '--jira-versions',
        'release-a,release-b',
        '--fix',
        'fix-version',
        '--fix-component',
        'Platform',
        '--yes',
      ]),
    ).rejects.toThrow(
      'Option --fix currently requires exactly one resolved git tag and one resolved Jira version.',
    );
  });

  it('keeps non-semver tags as standalone selections', async () => {
    mockedListTags.mockReturnValue(['release-2026-09']);
    mockedResolveGitTags.mockReturnValue(['release-2026-09']);
    mockedListJiraVersions.mockResolvedValue([
      {
        id: '90000',
        name: 'release-2026-09',
        releaseDate: null,
        released: true,
      },
    ]);
    mockedResolveJiraVersions.mockResolvedValue([
      {
        id: '90000',
        name: 'release-2026-09',
        releaseDate: null,
        released: true,
      },
    ]);
    mockedGetPreviousTag.mockReturnValue(null);

    await run([
      '--repo',
      '../repo',
      '--git-tag',
      'release-2026-09',
      '--jira-version',
      'release-2026-09',
    ]);

    expect(mockedCollectCommitsForTags).toHaveBeenCalledWith('/repo', [
      {
        gitTag: 'release-2026-09',
        previousTag: null,
        rangeEndTag: 'release-2026-09',
      },
    ]);
  });

  it('keeps patch releases separate when Jira has a matching patch version', async () => {
    mockedListTags.mockReturnValue(['0.3.0', 'v0.3.1']);
    mockedResolveGitTags.mockReturnValue(['0.3.0', 'v0.3.1']);
    mockedListJiraVersions.mockResolvedValue([
      {
        id: '73218',
        name: 'client-config-0.3.0',
        releaseDate: null,
        released: true,
      },
      {
        id: '73219',
        name: 'client-config-0.3.1',
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
      {
        id: '73219',
        name: 'client-config-0.3.1',
        releaseDate: null,
        released: true,
      },
    ]);
    mockedGetPreviousTag.mockImplementation((_, gitTag) => {
      if (gitTag === '0.3.0') {
        return 'v0.2.0';
      }

      if (gitTag === 'v0.3.1') {
        return '0.3.0';
      }

      return 'v0.2.0';
    });

    await run([
      '--repo',
      '../repo',
      '--git-tags',
      '0.3.0,v0.3.1',
      '--jira-versions',
      'client-config-0.3.0,client-config-0.3.1',
    ]);

    expect(mockedCollectCommitsForTags).toHaveBeenCalledWith('/repo', [
      {
        gitTag: '0.3.0',
        previousTag: 'v0.2.0',
        rangeEndTag: '0.3.0',
      },
      {
        gitTag: 'v0.3.1',
        previousTag: '0.3.0',
        rangeEndTag: 'v0.3.1',
      },
    ]);
  });

  it('truncates long fix-version proposal summaries', async () => {
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
        fixVersions: [
          { id: '70000', name: 'other-release-1' },
          { id: '70001', name: 'other-release-2' },
          { id: '70002', name: 'other-release-3' },
          { id: '70003', name: 'other-release-4' },
          { id: '70004', name: 'other-release-5' },
        ],
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
          proposedUpdateSummary: expect.stringMatching(/\.\.\.$/),
        }),
      ],
      expect.any(Map),
    );
  });
});
