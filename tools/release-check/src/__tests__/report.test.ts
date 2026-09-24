import {
  defaultReportPath,
  renderFixProposalSection,
  renderFixProposalTerminalSection,
  renderReport,
} from '../report';

import type {
  ComparisonResult,
  FixProposal,
  JiraVersion,
  ReleaseNotes,
} from '../types';

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

const fixProposals: FixProposal[] = [
  {
    currentValueSummary: 'none',
    issue: {
      issueType: 'Story',
      key: 'CCM-555',
      summary: 'Needs fix version',
      status: 'Done',
      components: ['Platform'],
      clinicalLead: '',
      clinicalReviewStatus: '',
      medicalClinicalSafetyCategory: '',
      fixVersions: [],
    },
    proposedUpdateSummary: 'client-config-0.1.0',
    targetValueSummary: 'client-config-0.1.0',
  },
];

const originalStdoutIsTTY = Object.getOwnPropertyDescriptor(
  process.stdout,
  'isTTY',
);
const originalStdoutColumns = Object.getOwnPropertyDescriptor(
  process.stdout,
  'columns',
);

const setTerminalSize = (isTTY: boolean, columns: number): void => {
  Object.defineProperty(process.stdout, 'isTTY', {
    configurable: true,
    value: isTTY,
  });
  Object.defineProperty(process.stdout, 'columns', {
    configurable: true,
    value: columns,
  });
};

describe('defaultReportPath', () => {
  it('writes single-release reports under .tmp/release-check in the cwd', () => {
    expect(
      defaultReportPath('nhs-notify-client-config', ['0.1.0'], '/workspace'),
    ).toBe('/workspace/.tmp/release-check/nhs-notify-client-config-0.1.0.md');
  });

  it('summarises multiple selected tags in the report filename', () => {
    expect(
      defaultReportPath(
        'nhs-notify-client-config',
        ['0.1.0', 'v0.2.0', 'v0.3.1'],
        '/workspace',
      ),
    ).toBe(
      '/workspace/.tmp/release-check/nhs-notify-client-config-0.1.0-to-v0.3.1-3-tags.md',
    );
  });
});

describe('renderReport', () => {
  afterAll(() => {
    if (originalStdoutIsTTY) {
      Object.defineProperty(process.stdout, 'isTTY', originalStdoutIsTTY);
    }
    if (originalStdoutColumns) {
      Object.defineProperty(process.stdout, 'columns', originalStdoutColumns);
    }
  });

  it('renders markdown summary metadata and warnings', () => {
    const report = renderReport({
      comparison,
      fixAction: undefined,
      fixComponent: undefined,
      fixProposals: undefined,
      gitTags: [{ gitTag: '0.1.0', previousTag: null }],
      jiraProject: 'CCM',
      jiraVersions: [jiraVersion],
      outsideReleaseIssuesByKey: new Map(),
      releaseNotes,
      repoName: 'nhs-notify-client-config',
      repoRoot: '/repos/nhs-notify-client-config',
      totalJiraIssues: 16,
    });

    expect(report).toContain('# Release check report');
    expect(report).toContain('- **Repository:** nhs-notify-client-config');
    expect(report).toContain('- **Jira version:** client-config-0.1.0 (71260)');
    expect(report).toContain('## Warnings');
    expect(report).toContain(
      '- No GitHub release body found for tag v0.0.1; falling back.',
    );
  });

  it('renders populated issue and fix sections as markdown tables', () => {
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
          [
            'CCM-999',
            [
              {
                hash: 'b'.repeat(40),
                shortHash: 'bbbbbbbb',
                subject: 'CCM-999: outside',
                body: '',
                explicitIssueKeys: ['CCM-999'],
                matchedIssueKeys: ['CCM-999'],
              },
              {
                hash: 'c'.repeat(40),
                shortHash: 'cccccccc',
                subject: 'CCM-999: outside follow-up',
                body: '',
                explicitIssueKeys: ['CCM-999'],
                matchedIssueKeys: ['CCM-999'],
              },
            ],
          ],
          [
            'CCM-555',
            [
              {
                hash: 'd'.repeat(40),
                shortHash: 'dddddddd',
                subject: 'CCM-555: proposed fix',
                body: '',
                explicitIssueKeys: ['CCM-555'],
                matchedIssueKeys: ['CCM-555'],
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
          {
            commit: {
              hash: 'c'.repeat(40),
              shortHash: 'cccccccc',
              subject: 'CCM-999: outside follow-up',
              body: '',
              explicitIssueKeys: ['CCM-999'],
              matchedIssueKeys: ['CCM-999'],
            },
            missingKeys: ['CCM-999'],
          },
        ],
        commitsWithoutMatches: [
          {
            hash: 'e'.repeat(40),
            shortHash: 'eeeeeeee',
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
      fixAction: 'fixVersion',
      fixComponent: 'Platform',
      fixProposals,
      gitTags: [
        { gitTag: '0.1.0', previousTag: '0.0.9', rangeEndTag: '0.1.0' },
      ],
      jiraProject: 'CCM',
      jiraVersions: [jiraVersion],
      outsideReleaseIssuesByKey: new Map([
        [
          'CCM-999',
          {
            issueType: 'Story',
            key: 'CCM-999',
            summary: 'Outside selected versions',
            status: 'Done',
            components: ['Platform'],
            clinicalLead: '',
            clinicalReviewStatus: '',
            medicalClinicalSafetyCategory: '',
          },
        ],
        [
          'CCM-200',
          {
            issueType: 'Story',
            key: 'CCM-200',
            summary: 'Outside release notes',
            status: 'Done',
            components: [],
            clinicalLead: '',
            clinicalReviewStatus: '',
            medicalClinicalSafetyCategory: '',
          },
        ],
      ]),
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
      '## Jira issues in the release with no matching git reference',
    );
    expect(populatedReport).toContain('| Issue | Commit |');
    expect(populatedReport).toContain(
      '| [CCM-101](https://nhsd-jira.digital.nhs.uk/browse/CCM-101): [Platform] Missing from git (Done) | No matching commit |',
    );
    expect(populatedReport).toContain(
      '| [CCM-100](https://nhsd-jira.digital.nhs.uk/browse/CCM-100): [Platform] Referenced and not done (In Progress) | `aaaaaaaa CCM-100: ship it` _(1 commit total)_ |',
    );
    expect(populatedReport).toContain(
      '| [CCM-999](https://nhsd-jira.digital.nhs.uk/browse/CCM-999): [Platform] Outside selected versions (Done) | `bbbbbbbb CCM-999: outside` _(2 commits total)_ |',
    );
    expect(populatedReport).toContain(
      '## Proposed fixVersion updates for component Platform',
    );
    expect(populatedReport).toContain('| Issue | Commit | Proposed update |');
    expect(populatedReport).toContain(
      '| [CCM-555](https://nhsd-jira.digital.nhs.uk/browse/CCM-555): [Platform] Needs fix version (Done) | `dddddddd CCM-555: proposed fix` _(1 commit total)_ | client-config-0.1.0 |',
    );
    expect(populatedReport).toContain(
      '- Git commit ranges mapped to Jira versions:',
    );
    expect(populatedReport).toContain(
      '  - `0.0.9..0.1.0` -> client-config-0.1.0',
    );
    expect(populatedReport).toContain(
      '## Commits without a Jira key or exact Jira-summary match',
    );
    expect(populatedReport).toContain('- eeeeeeee maintenance');
  });

  it('renders multi-release metadata when multiple tags and Jira versions are selected', () => {
    const report = renderReport({
      comparison,
      fixAction: undefined,
      fixComponent: undefined,
      fixProposals: undefined,
      gitTags: [
        { gitTag: '0.1.0', previousTag: null, rangeEndTag: '0.1.0' },
        { gitTag: 'v0.2.0', previousTag: '0.1.0', rangeEndTag: 'v0.2.0' },
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
      outsideReleaseIssuesByKey: new Map(),
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

    expect(report).toContain('- **Git tags selected (2):** 0.1.0, v0.2.0');
    expect(report).toContain(
      '- **Comparison bases:** 0.1.0 <- repository start; v0.2.0 <- 0.1.0',
    );
    expect(report).toContain(
      '- **Jira versions selected (2):** client-config-0.1.0 (71260), client-config-0.2.0 (71261)',
    );
    expect(report).toContain(
      '- **Jira release dates:** client-config-0.1.0: 2026-07-08; client-config-0.2.0: unknown',
    );
    expect(report).toContain('- **Jira versions released:** 1/2');
    expect(report).toContain('- **Release notes source:** mixed');
    expect(report).toContain(
      '  - `repository start..0.1.0` -> client-config-0.1.0',
    );
    expect(report).toContain('  - `0.1.0..v0.2.0` -> client-config-0.2.0');
  });

  it('adds separate release range and fix version columns to multi-release reports', () => {
    const report = renderReport({
      comparison: {
        ...comparison,
        jiraIssuesMissingClinicalSafetyCategory: [
          {
            issueType: 'Story',
            key: 'CCM-998',
            summary: 'Missing clinical safety category',
            status: 'Done',
            components: ['Platform'],
            clinicalLead: 'Dr Test',
            clinicalReviewStatus: 'Review required',
            medicalClinicalSafetyCategory: '',
            fixVersions: [{ id: '71261', name: 'client-config-0.2.0' }],
          },
        ],
        commitsByIssueKey: new Map([
          [
            'CCM-999',
            [
              {
                hash: 'b'.repeat(40),
                shortHash: 'bbbbbbbb',
                subject: 'CCM-999: outside',
                body: '',
                explicitIssueKeys: ['CCM-999'],
                matchedIssueKeys: ['CCM-999'],
                releaseRange: '0.1.0..v0.2.0',
                releaseTag: 'v0.2.0',
              },
              {
                hash: 'c'.repeat(40),
                shortHash: 'cccccccc',
                subject: 'CCM-999: outside follow-up',
                body: '',
                explicitIssueKeys: ['CCM-999'],
                matchedIssueKeys: ['CCM-999'],
                releaseRange: 'v0.2.0..v0.3.0',
                releaseTag: 'v0.3.0',
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
              releaseRange: '0.1.0..v0.2.0',
              releaseTag: 'v0.2.0',
            },
            missingKeys: ['CCM-999'],
          },
        ],
      },
      fixAction: undefined,
      fixComponent: undefined,
      fixProposals: undefined,
      gitTags: [
        { gitTag: 'v0.2.0', previousTag: '0.1.0', rangeEndTag: 'v0.2.0' },
        { gitTag: 'v0.3.0', previousTag: 'v0.2.0', rangeEndTag: 'v0.3.0' },
      ],
      jiraProject: 'CCM',
      jiraVersions: [
        {
          id: '71261',
          name: 'client-config-0.2.0',
          releaseDate: null,
          released: false,
        },
        {
          id: '71262',
          name: 'client-config-0.3.0',
          releaseDate: null,
          released: false,
        },
      ],
      outsideReleaseIssuesByKey: new Map([
        [
          'CCM-999',
          {
            issueType: 'Story',
            key: 'CCM-999',
            summary: 'Outside selected versions',
            status: 'Done',
            components: ['Platform'],
            clinicalLead: '',
            clinicalReviewStatus: '',
            medicalClinicalSafetyCategory: '',
            fixVersions: [
              { id: '71260', name: 'client-config-0.1.0' },
              { id: '80000', name: 'another-release' },
            ],
          },
        ],
      ]),
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

    expect(report).toContain(
      '| Issue | Commit | Release range | Fix versions |',
    );
    expect(report).toContain(
      '| [CCM-999](https://nhsd-jira.digital.nhs.uk/browse/CCM-999): [Platform] Outside selected versions (Done) | `bbbbbbbb CCM-999: outside` _(2 commits total)_ | 0.1.0..v0.2.0; v0.2.0..v0.3.0 | client-config-0.1.0, another-release |',
    );
    expect(report).toContain('### Example fix-version commands by component');
    expect(report).toContain(
      "npm run check -- --repo '/repos/nhs-notify-client-config' --git-tag 'v0.2.0' --jira-version 'client-config-0.2.0' --fix fix-version --fix-component 'Platform'",
    );
    expect(report).toContain(
      "npm run check -- --repo '/repos/nhs-notify-client-config' --git-tag 'v0.3.0' --jira-version 'client-config-0.3.0' --fix fix-version --fix-component 'Platform'",
    );
    expect(report).toContain(
      '### Example clinical-review-not-needed commands by component',
    );
    expect(report).toContain(
      "npm run check -- --repo '/repos/nhs-notify-client-config' --git-tag 'v0.2.0' --jira-version 'client-config-0.2.0' --fix clinical-review-not-needed --fix-component 'Platform'",
    );
  });

  it('renders unknown release metadata when Jira has not set it', () => {
    const report = renderReport({
      comparison,
      fixAction: undefined,
      fixComponent: undefined,
      fixProposals: undefined,
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
      outsideReleaseIssuesByKey: new Map(),
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

    expect(report).toContain('- **Jira release date:** unknown');
    expect(report).toContain('- **Jira version released:** no');
  });

  it('scopes clinical review example commands to the issue fix versions', () => {
    const report = renderReport({
      comparison: {
        ...comparison,
        commitsByIssueKey: new Map([
          [
            'CCM-12081',
            [
              {
                hash: 'a'.repeat(40),
                shortHash: 'aaaaaaaa',
                subject: 'CCM-12081: first release work',
                body: '',
                explicitIssueKeys: ['CCM-12081'],
                matchedIssueKeys: ['CCM-12081'],
                releaseRange: 'repository start..0.1.0',
                releaseTag: '0.1.0',
              },
            ],
          ],
          [
            'CCM-22822',
            [
              {
                hash: 'b'.repeat(40),
                shortHash: 'bbbbbbbb',
                subject: 'CCM-22822: third release work',
                body: '',
                explicitIssueKeys: ['CCM-22822'],
                matchedIssueKeys: ['CCM-22822'],
                releaseRange: 'v0.2.0..v0.3.1',
                releaseTag: '0.3.0',
              },
            ],
          ],
        ]),
        jiraIssuesMissingClinicalSafetyCategory: [
          {
            issueType: 'Story',
            key: 'CCM-12081',
            summary: 'First release issue',
            status: 'Done',
            components: ['Onboarding-Improvements'],
            clinicalLead: '',
            clinicalReviewStatus: '',
            medicalClinicalSafetyCategory: '',
            fixVersions: [{ id: '71260', name: 'client-config-0.1.0' }],
          },
          {
            issueType: 'Story',
            key: 'CCM-22822',
            summary: 'Third release issue',
            status: 'Done',
            components: ['onboarding-journey-improvements'],
            clinicalLead: '',
            clinicalReviewStatus: '',
            medicalClinicalSafetyCategory: '',
            fixVersions: [{ id: '71262', name: 'client-config-0.3.0' }],
          },
        ],
      },
      fixAction: undefined,
      fixComponent: undefined,
      fixProposals: undefined,
      gitTags: [
        { gitTag: '0.1.0', previousTag: null, rangeEndTag: '0.1.0' },
        { gitTag: '0.3.0', previousTag: 'v0.2.0', rangeEndTag: 'v0.3.1' },
      ],
      jiraProject: 'CCM',
      jiraVersions: [
        {
          id: '71260',
          name: 'client-config-0.1.0',
          releaseDate: '2026-07-08',
          released: true,
        },
        {
          id: '71262',
          name: 'client-config-0.3.0',
          releaseDate: '2026-09-15',
          released: true,
        },
      ],
      outsideReleaseIssuesByKey: new Map(),
      releaseNotes: {
        issueKeys: [],
        source: 'none',
        text: null,
        warnings: [],
      },
      repoName: 'nhs-notify-client-config',
      repoRoot: '/repos/nhs-notify-client-config',
      totalJiraIssues: 2,
    });

    expect(report).toContain(
      "npm run check -- --repo '/repos/nhs-notify-client-config' --git-tag '0.1.0' --jira-version 'client-config-0.1.0' --fix clinical-review-not-needed --fix-component 'Onboarding-Improvements'",
    );
    expect(report).toContain(
      "npm run check -- --repo '/repos/nhs-notify-client-config' --git-tag '0.3.0' --jira-version 'client-config-0.3.0' --fix clinical-review-not-needed --fix-component 'onboarding-journey-improvements'",
    );
    expect(report).not.toContain(
      "npm run check -- --repo '/repos/nhs-notify-client-config' --git-tag '0.3.0' --jira-version 'client-config-0.3.0' --fix clinical-review-not-needed --fix-component 'Onboarding-Improvements'",
    );
  });

  it('does not invent clinical review commands for issues without a selected fix version', () => {
    const report = renderReport({
      comparison: {
        ...comparison,
        jiraIssuesMissingClinicalSafetyCategory: [
          {
            issueType: 'Story',
            key: 'CCM-999',
            summary: 'No selected fix version',
            status: 'Done',
            components: ['Platform'],
            clinicalLead: '',
            clinicalReviewStatus: '',
            medicalClinicalSafetyCategory: '',
            fixVersions: [{ id: '80000', name: 'some-other-release' }],
          },
        ],
      },
      fixAction: undefined,
      fixComponent: undefined,
      fixProposals: undefined,
      gitTags: [
        { gitTag: '0.3.0', previousTag: 'v0.2.0', rangeEndTag: 'v0.3.1' },
      ],
      jiraProject: 'CCM',
      jiraVersions: [
        {
          id: '71262',
          name: 'client-config-0.3.0',
          releaseDate: '2026-09-15',
          released: true,
        },
      ],
      outsideReleaseIssuesByKey: new Map(),
      releaseNotes: {
        issueKeys: [],
        source: 'none',
        text: null,
        warnings: [],
      },
      repoName: 'nhs-notify-client-config',
      repoRoot: '/repos/nhs-notify-client-config',
      totalJiraIssues: 1,
    });

    expect(report).not.toContain('--fix clinical-review-not-needed');
    expect(report).toContain(
      '# No single-release clinical review command generated for CCM-999',
    );
  });

  it('labels missing Jira issues as not found while retaining commits', () => {
    const report = renderReport({
      comparison: {
        ...comparison,
        commitsByIssueKey: new Map([
          [
            'CCM-404',
            [
              {
                hash: 'e'.repeat(40),
                shortHash: 'eeeeeeee',
                subject: 'CCM-404: missing issue',
                body: '',
                explicitIssueKeys: ['CCM-404'],
                matchedIssueKeys: ['CCM-404'],
              },
            ],
          ],
        ]),
        commitsWithIssueKeysOutsideRelease: [
          {
            commit: {
              hash: 'e'.repeat(40),
              shortHash: 'eeeeeeee',
              subject: 'CCM-404: missing issue',
              body: '',
              explicitIssueKeys: ['CCM-404'],
              matchedIssueKeys: ['CCM-404'],
            },
            missingKeys: ['CCM-404'],
          },
        ],
      },
      fixAction: undefined,
      fixComponent: undefined,
      fixProposals: undefined,
      gitTags: [{ gitTag: '0.1.0', previousTag: null }],
      jiraProject: 'CCM',
      jiraVersions: [jiraVersion],
      outsideReleaseIssuesByKey: new Map(),
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

    expect(report).toContain(
      '| [CCM-404](https://nhsd-jira.digital.nhs.uk/browse/CCM-404): not found in Jira | `eeeeeeee CCM-404: missing issue` _(1 commit total)_ |',
    );
  });

  it('renders manual-review guidance for fix-version command gaps', () => {
    const report = renderReport({
      comparison: {
        ...comparison,
        commitsByIssueKey: new Map([
          [
            'CCM-900',
            [
              {
                hash: 'f'.repeat(40),
                shortHash: 'ffffffff',
                subject: 'CCM-900: unmapped release',
                body: '',
                explicitIssueKeys: ['CCM-900'],
                matchedIssueKeys: ['CCM-900'],
                releaseRange: '0.8.0..0.9.0',
                releaseTag: '0.9.0',
              },
            ],
          ],
        ]),
        commitsWithIssueKeysOutsideRelease: [
          {
            commit: {
              hash: 'f'.repeat(40),
              shortHash: 'ffffffff',
              subject: 'CCM-900: unmapped release',
              body: '',
              explicitIssueKeys: ['CCM-900'],
              matchedIssueKeys: ['CCM-900'],
              releaseRange: '0.8.0..0.9.0',
              releaseTag: '0.9.0',
            },
            missingKeys: ['CCM-900', 'CCM-901'],
          },
        ],
        releaseNotesIssueKeysOutsideRelease: [],
      },
      fixAction: undefined,
      fixComponent: undefined,
      fixProposals: undefined,
      gitTags: [{ gitTag: '0.1.0', previousTag: null, rangeEndTag: '0.1.0' }],
      jiraProject: 'CCM',
      jiraVersions: [jiraVersion],
      outsideReleaseIssuesByKey: new Map([
        [
          'CCM-900',
          {
            issueType: 'Story',
            key: 'CCM-900',
            summary: 'Needs manual version mapping',
            status: 'Done',
            components: ['Platform'],
            clinicalLead: '',
            clinicalReviewStatus: '',
            medicalClinicalSafetyCategory: '',
          },
        ],
        [
          'CCM-901',
          {
            issueType: 'Story',
            key: 'CCM-901',
            summary: 'Needs component',
            status: 'Done',
            components: [],
            clinicalLead: '',
            clinicalReviewStatus: '',
            medicalClinicalSafetyCategory: '',
          },
        ],
      ]),
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

    expect(report).toContain(
      '# Manual review needed: no component set for CCM-901',
    );
    expect(report).toContain(
      '# No single-release fix command generated for ranges without a matching selected Jira version: 0.9.0',
    );
  });

  it('renders manual-review guidance for clinical review command gaps', () => {
    const report = renderReport({
      comparison: {
        ...comparison,
        jiraIssuesMissingClinicalSafetyCategory: [
          {
            issueType: 'Story',
            key: 'CCM-700',
            summary: 'Needs component',
            status: 'Done',
            components: [],
            clinicalLead: '',
            clinicalReviewStatus: '',
            medicalClinicalSafetyCategory: '',
            fixVersions: [{ id: '71260', name: 'client-config-0.1.0' }],
          },
          {
            issueType: 'Story',
            key: 'CCM-701',
            summary: 'Has Jira version but no matching selected git tag',
            status: 'Done',
            components: ['Platform'],
            clinicalLead: '',
            clinicalReviewStatus: '',
            medicalClinicalSafetyCategory: '',
            fixVersions: [{ id: '71261', name: 'client-config-0.2.0' }],
          },
        ],
      },
      fixAction: undefined,
      fixComponent: undefined,
      fixProposals: undefined,
      gitTags: [{ gitTag: '0.1.0', previousTag: null, rangeEndTag: '0.1.0' }],
      jiraProject: 'CCM',
      jiraVersions: [
        jiraVersion,
        {
          id: '71261',
          name: 'client-config-0.2.0',
          releaseDate: null,
          released: true,
        },
      ],
      outsideReleaseIssuesByKey: new Map(),
      releaseNotes: {
        issueKeys: [],
        source: 'none',
        text: null,
        warnings: [],
      },
      repoName: 'nhs-notify-client-config',
      repoRoot: '/repos/nhs-notify-client-config',
      totalJiraIssues: 2,
    });

    expect(report).toContain(
      '# Manual review needed: no component set for CCM-700',
    );
    expect(report).toContain(
      '# No single-release clinical review command generated for CCM-701',
    );
  });
});

describe('renderFixProposalSection', () => {
  it('renders markdown table rows for proposed fixes', () => {
    const section = renderFixProposalSection(
      'fixVersion',
      'Platform',
      fixProposals,
      new Map([
        [
          'CCM-555',
          [
            {
              hash: 'd'.repeat(40),
              shortHash: 'dddddddd',
              subject: 'CCM-555: proposed fix',
              body: '',
              explicitIssueKeys: ['CCM-555'],
              matchedIssueKeys: ['CCM-555'],
            },
          ],
        ],
      ]),
    );

    expect(section).toContain(
      '## Proposed fixVersion updates for component Platform',
    );
    expect(section).toContain('| Issue | Commit | Proposed update |');
    expect(section).toContain(
      '| [CCM-555](https://nhsd-jira.digital.nhs.uk/browse/CCM-555): [Platform] Needs fix version (Done) | `dddddddd CCM-555: proposed fix` _(1 commit total)_ | client-config-0.1.0 |',
    );
  });

  it('renders empty fix proposal sections explicitly', () => {
    expect(
      renderFixProposalSection('fixVersion', 'Platform', [], new Map()),
    ).toContain('- none');
  });

  it('renders release-range comparison columns when requested', () => {
    const section = renderFixProposalSection(
      'fixVersion',
      'Platform',
      fixProposals,
      new Map([
        [
          'CCM-555',
          [
            {
              hash: 'd'.repeat(40),
              shortHash: 'dddddddd',
              subject: 'CCM-555: proposed fix',
              body: '',
              explicitIssueKeys: ['CCM-555'],
              matchedIssueKeys: ['CCM-555'],
              releaseRange: '0.0.9..0.1.0',
              releaseTag: '0.1.0',
            },
          ],
        ],
      ]),
      true,
    );

    expect(section).toContain(
      '| Issue | Commit | Release range | Fix versions | Proposed update |',
    );
    expect(section).toContain('0.0.9..0.1.0');
    expect(section).toContain('none');
  });

  it('renders terminal-friendly proposed fixes without markdown formatting', () => {
    const section = renderFixProposalTerminalSection(
      'fixVersion',
      'Platform',
      fixProposals,
      new Map([
        [
          'CCM-555',
          [
            {
              hash: 'd'.repeat(40),
              shortHash: 'dddddddd',
              subject: 'CCM-555: proposed fix',
              body: '',
              explicitIssueKeys: ['CCM-555'],
              matchedIssueKeys: ['CCM-555'],
            },
          ],
        ],
      ]),
    );

    expect(section).toContain(
      'Proposed fixVersion updates for component Platform',
    );
    expect(section).toContain('CCM-555: [Platform] Needs fix version (Done)');
    expect(section).toContain(
      'dddddddd CCM-555: proposed fix (1 commit total)',
    );
    expect(section).not.toContain('## Proposed');
    expect(section).not.toContain('| Issue | Commit | Proposed update |');
    expect(section).not.toContain('[CCM-555](');
  });

  it('renders empty terminal fix proposal sections explicitly', () => {
    expect(
      renderFixProposalTerminalSection('fixVersion', 'Platform', [], new Map()),
    ).toContain('none');
  });

  it('renders terminal output with no matching commits', () => {
    const section = renderFixProposalTerminalSection(
      'fixVersion',
      'Platform',
      fixProposals,
      new Map(),
    );

    expect(section).toContain('No matching commit');
  });

  it('truncates wide issue and commit cells in terminal output', () => {
    const longSummary = `Needs fix version ${'summary '.repeat(20)}`.trim();
    const longCommit = `CCM-777: ${'proposed fix '.repeat(20)}`.trim();

    const section = renderFixProposalTerminalSection(
      'fixVersion',
      'Platform',
      [
        {
          currentValueSummary: 'other-release',
          issue: {
            issueType: 'Story',
            key: 'CCM-777',
            summary: longSummary,
            status: 'Done',
            components: ['Platform'],
            clinicalLead: '',
            clinicalReviewStatus: '',
            medicalClinicalSafetyCategory: '',
            fixVersions: [{ id: '70000', name: 'other-release' }],
          },
          proposedUpdateSummary: 'client-config-0.1.0 + 1 (other-release)',
          targetValueSummary: 'other-release, client-config-0.1.0',
        },
      ],
      new Map([
        [
          'CCM-777',
          [
            {
              hash: 'd'.repeat(40),
              shortHash: 'dddddddd',
              subject: longCommit,
              body: '',
              explicitIssueKeys: ['CCM-777'],
              matchedIssueKeys: ['CCM-777'],
            },
          ],
        ],
      ]),
    );

    expect(section).toContain('...');
    expect(section).not.toContain(longSummary);
    expect(section).not.toContain(`dddddddd ${longCommit} (1 commit total)`);
    expect(section).toContain('client-config-0.1.0 + 1 (other-release)');
  });

  it('uses terminal column widths when stdout reports a TTY size', () => {
    const longSummary = `Needs fix version ${'summary '.repeat(20)}`.trim();
    const longCommit = `CCM-888: ${'proposed fix '.repeat(20)}`.trim();

    setTerminalSize(true, 60);

    const section = renderFixProposalTerminalSection(
      'fixVersion',
      'Platform',
      [
        {
          currentValueSummary: 'other-release',
          issue: {
            issueType: 'Story',
            key: 'CCM-888',
            summary: longSummary,
            status: 'Done',
            components: ['Platform'],
            clinicalLead: '',
            clinicalReviewStatus: '',
            medicalClinicalSafetyCategory: '',
            fixVersions: [{ id: '70000', name: 'other-release' }],
          },
          proposedUpdateSummary: 'client-config-0.1.0 + 1 (other-release)',
          targetValueSummary: 'other-release, client-config-0.1.0',
        },
      ],
      new Map([
        [
          'CCM-888',
          [
            {
              hash: 'd'.repeat(40),
              shortHash: 'dddddddd',
              subject: longCommit,
              body: '',
              explicitIssueKeys: ['CCM-888'],
              matchedIssueKeys: ['CCM-888'],
            },
          ],
        ],
      ]),
    );

    expect(section).toContain('...');
    expect(section).not.toContain(longSummary);
  });
});
