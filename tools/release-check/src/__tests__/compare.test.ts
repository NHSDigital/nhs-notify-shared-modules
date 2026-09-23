import { compareRelease } from '../compare';

import type { GitCommit, JiraIssue } from '../types';

const issues: JiraIssue[] = [
  {
    clinicalLead: '',
    clinicalReviewStatus: 'Review required',
    key: 'CCM-100',
    medicalClinicalSafetyCategory: '',
    issueType: 'Story',
    summary: 'First ticket',
    status: 'Done',
    components: ['Platform'],
  },
  {
    clinicalLead: 'Dr Test',
    clinicalReviewStatus: 'In review',
    key: 'CCM-101',
    medicalClinicalSafetyCategory: 'Cat 1',
    issueType: 'Story',
    summary: 'Exact summary fallback',
    status: 'In Progress',
    components: ['Platform'],
  },
  {
    clinicalLead: '',
    clinicalReviewStatus: 'Review not needed',
    key: 'CCM-102',
    medicalClinicalSafetyCategory: '',
    issueType: 'Story',
    summary: 'Release only ticket',
    status: 'Done',
    components: ['Platform'],
  },
];

const commits: GitCommit[] = [
  {
    hash: 'a'.repeat(40),
    shortHash: 'aaaaaaaa',
    subject: 'CCM-100: implement first ticket',
    body: '',
    explicitIssueKeys: ['CCM-100'],
  },
  {
    hash: 'b'.repeat(40),
    shortHash: 'bbbbbbbb',
    subject: 'Exact summary fallback (#123)',
    body: '',
    explicitIssueKeys: [],
  },
  {
    hash: 'c'.repeat(40),
    shortHash: 'cccccccc',
    subject: 'Untracked maintenance change',
    body: '',
    explicitIssueKeys: [],
  },
  {
    hash: 'd'.repeat(40),
    shortHash: 'dddddddd',
    subject: 'CCM-999: outside release',
    body: '',
    explicitIssueKeys: ['CCM-999'],
  },
];

describe('compareRelease', () => {
  it('compares git and release-note issue references against the Jira release', () => {
    const result = compareRelease(commits, issues, ['CCM-100', 'CCM-200']);

    expect(result.gitReferencedIssueKeys).toEqual([
      'CCM-100',
      'CCM-101',
      'CCM-999',
    ]);
    expect(result.notesReferencedIssueKeys).toEqual(['CCM-100', 'CCM-200']);
    expect(result.jiraIssuesMissingFromGit.map((issue) => issue.key)).toEqual([
      'CCM-102',
    ]);
    expect(
      result.jiraIssuesMissingFromReleaseNotes.map((issue) => issue.key),
    ).toEqual(['CCM-101', 'CCM-102']);
    expect(
      result.releaseReferencedIssuesNotDone.map((issue) => issue.key),
    ).toEqual(['CCM-101']);
    expect(
      result.jiraIssuesMissingClinicalSafetyCategory.map((issue) => issue.key),
    ).toEqual(['CCM-100']);
    expect(
      result.jiraIssuesMissingClinicalLead.map((issue) => issue.key),
    ).toEqual(['CCM-100']);
    expect(result.releaseNotesIssueKeysOutsideRelease).toEqual(['CCM-200']);
    expect(
      result.commitsWithIssueKeysOutsideRelease.map(
        ({ missingKeys }) => missingKeys,
      ),
    ).toEqual([['CCM-999']]);
    expect(
      result.commitsWithoutMatches.map((commit) => commit.shortHash),
    ).toEqual(['cccccccc']);
  });

  it('excludes bugs from clinical review checks', () => {
    const result = compareRelease(
      commits,
      [
        ...issues,
        {
          clinicalLead: '',
          clinicalReviewStatus: 'Review required',
          components: ['Platform'],
          issueType: 'Bug',
          key: 'CCM-103',
          medicalClinicalSafetyCategory: '',
          status: 'Done',
          summary: 'Bug fix',
        },
      ],
      [],
    );

    expect(
      result.jiraIssuesMissingClinicalSafetyCategory.map((issue) => issue.key),
    ).not.toContain('CCM-103');
    expect(
      result.jiraIssuesMissingClinicalLead.map((issue) => issue.key),
    ).not.toContain('CCM-103');
  });

  it('treats punctuation-only subjects as unmatched when no Jira key is present', () => {
    const result = compareRelease(
      [
        {
          hash: 'e'.repeat(40),
          shortHash: 'eeeeeeee',
          subject: ' (#123) ',
          body: '',
          explicitIssueKeys: [],
        },
      ],
      issues,
      [],
    );

    expect(
      result.commitsWithoutMatches.map((commit) => commit.shortHash),
    ).toEqual(['eeeeeeee']);
  });
});
