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
  it('writes reports under .tmp/release-check in the cwd', () => {
    expect(
      defaultReportPath('nhs-notify-client-config', '0.1.0', '/workspace'),
    ).toBe('/workspace/.tmp/release-check/nhs-notify-client-config-0.1.0.txt');
  });
});

describe('renderReport', () => {
  it('renders summary metadata and warnings', () => {
    const report = renderReport({
      comparison,
      gitTag: '0.1.0',
      jiraProject: 'CCM',
      jiraVersion,
      previousTag: null,
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
      gitTag: '0.1.0',
      jiraProject: 'CCM',
      jiraVersion,
      previousTag: '0.0.9',
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

  it('renders unknown release metadata when Jira has not set it', () => {
    const report = renderReport({
      comparison,
      gitTag: '0.1.0',
      jiraProject: 'CCM',
      jiraVersion: {
        id: '71260',
        name: 'client-config-0.1.0',
        releaseDate: null,
        released: false,
      },
      previousTag: null,
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
