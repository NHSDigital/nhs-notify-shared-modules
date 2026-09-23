import { defaultReportPath, renderReport } from '../report';

import type { ComparisonResult, JiraVersion, ReleaseNotes } from '../types';

const comparison: ComparisonResult = {
  commitsByIssueKey: new Map(),
  commitsWithIssueKeysOutsideRelease: [],
  commitsWithoutMatches: [],
  gitReferencedIssueKeys: ['CCM-100'],
  jiraIssuesMissingClinicalLead: [],
  jiraIssuesMissingClinicalSafetyCategory: [],
  jiraIssuesMissingFromGit: [],
  jiraIssuesMissingFromReleaseNotes: [],
  notesReferencedIssueKeys: ['CCM-100'],
  releaseReferencedIssuesNotDone: [],
  releaseNotesIssueKeysOutsideRelease: [],
};

const jiraVersion: JiraVersion = {
  id: '71260',
  name: 'client-config-0.1.0',
  releaseDate: '2026-07-08',
  released: true,
};

const releaseNotes: ReleaseNotes = {
  issueKeys: ['CCM-100'],
  source: 'github-release',
  text: 'CCM-100: release note entry',
  warnings: ['No GitHub release body found for tag v0.0.1; falling back.'],
};

describe('defaultReportPath', () => {
  it('writes single-release reports under .tmp/release-check in the cwd', () => {
    expect(
      defaultReportPath('nhs-notify-client-config', ['0.1.0'], '/workspace'),
    ).toBe('/workspace/.tmp/release-check/nhs-notify-client-config-0.1.0.txt');
  });

  it('summarises multiple selected tags in the report filename', () => {
    expect(
      defaultReportPath(
        'nhs-notify-client-config',
        ['0.1.0', 'v0.2.0', 'v0.3.1'],
        '/workspace',
      ),
    ).toBe(
      '/workspace/.tmp/release-check/nhs-notify-client-config-0.1.0-to-v0.3.1-3-tags.txt',
    );
  });
});

describe('renderReport', () => {
  it('renders summary metadata and warnings', () => {
    const report = renderReport({
      comparison,
      gitTags: [{ gitTag: '0.1.0', previousTag: null }],
      jiraProject: 'CCM',
      jiraVersions: [jiraVersion],
      releaseNotes,
      repoName: 'nhs-notify-client-config',
      repoRoot: '/repos/nhs-notify-client-config',
      totalJiraIssues: 16,
    });

    expect(report).toContain('Release check report');
    expect(report).toContain('Repository: nhs-notify-client-config');
    expect(report).toContain('Jira version: client-config-0.1.0 (71260)');
    expect(report).toContain('Release notes source: github-release');
    expect(report).toContain('Warnings');
    expect(report).toContain(
      'No GitHub release body found for tag v0.0.1; falling back.',
    );
  });

  it('renders populated issue and commit sections', () => {
    const populatedReport = renderReport({
      comparison: {
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
              hash: 'b'.repeat(40),
              shortHash: 'bbbbbbbb',
              subject: 'CCM-999: outside',
              body: '',
              explicitIssueKeys: ['CCM-999'],
              matchedIssueKeys: ['CCM-999'],
            },
            missingKeys: ['CCM-999'],
          },
        ],
        commitsWithoutMatches: [
          {
            hash: 'c'.repeat(40),
            shortHash: 'cccccccc',
            subject: 'maintenance',
            body: '',
            explicitIssueKeys: [],
            matchedIssueKeys: [],
          },
        ],
        gitReferencedIssueKeys: ['CCM-100'],
        jiraIssuesMissingClinicalLead: [
          {
            issueType: 'Story',
            key: 'CCM-104',
            summary: 'Missing clinical lead',
            status: 'Done',
            components: ['Platform'],
            clinicalLead: '',
            clinicalReviewStatus: 'Review required',
            medicalClinicalSafetyCategory: 'Cat 1',
          },
        ],
        jiraIssuesMissingClinicalSafetyCategory: [
          {
            issueType: 'Story',
            key: 'CCM-103',
            summary: 'Missing clinical safety category',
            status: 'Done',
            components: ['Platform'],
            clinicalLead: 'Dr Test',
            clinicalReviewStatus: 'Review required',
            medicalClinicalSafetyCategory: '',
          },
        ],
        jiraIssuesMissingFromGit: [
          {
            issueType: 'Story',
            key: 'CCM-101',
            summary: 'Missing from git',
            status: 'Done',
            components: ['Platform'],
            clinicalLead: '',
            clinicalReviewStatus: '',
            medicalClinicalSafetyCategory: '',
          },
        ],
        jiraIssuesMissingFromReleaseNotes: [
          {
            issueType: 'Story',
            key: 'CCM-102',
            summary: 'Missing from notes',
            status: 'Done',
            components: [],
            clinicalLead: '',
            clinicalReviewStatus: '',
            medicalClinicalSafetyCategory: '',
          },
        ],
        notesReferencedIssueKeys: ['CCM-100'],
        releaseReferencedIssuesNotDone: [
          {
            issueType: 'Story',
            key: 'CCM-100',
            summary: 'Referenced and not done',
            status: 'In Progress',
            components: ['Platform'],
            clinicalLead: '',
            clinicalReviewStatus: '',
            medicalClinicalSafetyCategory: '',
          },
        ],
        releaseNotesIssueKeysOutsideRelease: ['CCM-200'],
      },
      gitTags: [{ gitTag: '0.1.0', previousTag: '0.0.9' }],
      jiraProject: 'CCM',
      jiraVersions: [jiraVersion],
      releaseNotes: {
        issueKeys: ['CCM-100'],
        source: 'github-release',
        text: 'CCM-100 release note entry',
        warnings: [],
      },
      repoName: 'nhs-notify-client-config',
      repoRoot: '/repos/nhs-notify-client-config',
      totalJiraIssues: 3,
    });

    expect(populatedReport).toContain(
      'CCM-101: [Platform] Missing from git (Done)',
    );
    expect(populatedReport).toContain('CCM-102: Missing from notes (Done)');
    expect(populatedReport).toContain(
      'CCM-100: [Platform] Referenced and not done (In Progress) | commits: aaaaaaaa CCM-100: ship it',
    );
    expect(populatedReport).toContain(
      'CCM-103: [Platform] Missing clinical safety category (Done)',
    );
    expect(populatedReport).toContain(
      'CCM-104: [Platform] Missing clinical lead (Done)',
    );
    expect(populatedReport).toContain(
      'bbbbbbbb CCM-999: outside | missing keys: CCM-999',
    );
    expect(populatedReport).toContain(
      'Commits without a Jira key or exact Jira-summary match',
    );
    expect(populatedReport).toContain('- cccccccc maintenance');
  });

  it('renders multi-release metadata when multiple tags and Jira versions are selected', () => {
    const report = renderReport({
      comparison,
      gitTags: [
        { gitTag: '0.1.0', previousTag: null },
        { gitTag: 'v0.2.0', previousTag: '0.1.0' },
      ],
      jiraProject: 'CCM',
      jiraVersions: [
        jiraVersion,
        {
          id: '71261',
          name: 'client-config-0.2.0',
          releaseDate: null,
          released: false,
        },
      ],
      releaseNotes: {
        issueKeys: ['CCM-100'],
        source: 'mixed',
        text: null,
        warnings: [],
      },
      repoName: 'nhs-notify-client-config',
      repoRoot: '/repos/nhs-notify-client-config',
      totalJiraIssues: 20,
    });

    expect(report).toContain('Git tags selected (2): 0.1.0, v0.2.0');
    expect(report).toContain(
      'Comparison bases: 0.1.0 <- repository start; v0.2.0 <- 0.1.0',
    );
    expect(report).toContain(
      'Jira versions selected (2): client-config-0.1.0 (71260), client-config-0.2.0 (71261)',
    );
    expect(report).toContain(
      'Jira release dates: client-config-0.1.0: 2026-07-08; client-config-0.2.0: unknown',
    );
    expect(report).toContain('Jira versions released: 1/2');
    expect(report).toContain('Release notes source: mixed');
  });

  it('renders unknown release metadata when Jira has not set it', () => {
    const report = renderReport({
      comparison,
      gitTags: [{ gitTag: '0.1.0', previousTag: null }],
      jiraProject: 'CCM',
      jiraVersions: [
        {
          id: '71260',
          name: 'client-config-0.1.0',
          releaseDate: null,
          released: false,
        },
      ],
      releaseNotes: {
        issueKeys: [],
        source: 'none',
        text: null,
        warnings: [],
      },
      repoName: 'nhs-notify-client-config',
      repoRoot: '/repos/nhs-notify-client-config',
      totalJiraIssues: 0,
    });

    expect(report).toContain('Jira release date: unknown');
    expect(report).toContain('Jira version released: no');
  });
});
