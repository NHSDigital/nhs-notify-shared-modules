import { checkEpics, getEpicKeysToResolve } from '../epics';

import type { JiraIssue } from '../types';

const issue = (overrides: Partial<JiraIssue> & { key: string }): JiraIssue => ({
  clinicalLead: '',
  clinicalReviewStatus: '',
  components: ['Platform'],
  epicKey: '',
  issueType: 'Story',
  medicalClinicalSafetyCategory: '',
  nwrLinks: [],
  status: 'Done',
  summary: `Summary ${overrides.key}`,
  ...overrides,
});

describe('getEpicKeysToResolve', () => {
  it('returns unique epic keys not already in the release, ignoring exempt types', () => {
    const issues = [
      issue({ key: 'CCM-1', epicKey: 'CCM-10' }),
      issue({ key: 'CCM-2', epicKey: 'CCM-10' }),
      issue({ key: 'CCM-3', epicKey: 'CCM-11' }),
      issue({ key: 'CCM-11', issueType: 'Epic' }),
      issue({ key: 'CCM-4', issueType: 'Sub-task', epicKey: 'CCM-12' }),
      issue({ key: 'CCM-5' }),
    ];

    expect(getEpicKeysToResolve(issues)).toEqual(['CCM-10']);
  });
});

describe('checkEpics', () => {
  it('passes when every ticket has an epic linked to the expected NWR', () => {
    const result = checkEpics({
      issues: [issue({ key: 'CCM-1', epicKey: 'CCM-10' })],
      nwrKey: 'NWR-2198',
      resolvedEpics: [
        issue({ key: 'CCM-10', issueType: 'Epic', nwrLinks: ['NWR-2198'] }),
      ],
    });

    expect(result).toEqual({
      epicsInUse: [
        {
          epic: expect.objectContaining({ key: 'CCM-10' }),
          epicKey: 'CCM-10',
          issueKeys: ['CCM-1'],
        },
      ],
      epicsWithNwrProblems: [],
      issuesWithoutEpic: [],
      nwrKey: 'NWR-2198',
    });
  });

  it('flags tickets without an epic but exempts epics and sub-tasks', () => {
    const result = checkEpics({
      issues: [
        issue({ key: 'CCM-1' }),
        issue({ key: 'CCM-2', issueType: 'Bug' }),
        issue({ key: 'CCM-3', issueType: 'Sub-task' }),
        issue({ key: 'CCM-4', issueType: 'Epic', nwrLinks: ['NWR-2198'] }),
      ],
      nwrKey: 'NWR-2198',
      resolvedEpics: [],
    });

    expect(result.issuesWithoutEpic.map(({ key }) => key)).toEqual([
      'CCM-1',
      'CCM-2',
    ]);
    expect(result.epicsWithNwrProblems).toEqual([]);
  });

  it('flags epics with missing, wrong, unresolved or non-epic NWR links', () => {
    const result = checkEpics({
      issues: [
        issue({ key: 'CCM-1', epicKey: 'CCM-10' }),
        issue({ key: 'CCM-2', epicKey: 'CCM-11' }),
        issue({ key: 'CCM-3', epicKey: 'CCM-12' }),
        issue({ key: 'CCM-4', epicKey: 'CCM-13' }),
        issue({ key: 'CCM-5', epicKey: 'CCM-13' }),
        issue({ key: 'CCM-14', issueType: 'Epic', nwrLinks: ['NWR-1'] }),
      ],
      nwrKey: 'NWR-2198',
      resolvedEpics: [
        issue({ key: 'CCM-10', issueType: 'Epic' }),
        issue({ key: 'CCM-11', issueType: 'Epic', nwrLinks: ['NWR-1'] }),
        issue({ key: 'CCM-12', issueType: 'Story' }),
      ],
    });

    expect(
      result.epicsWithNwrProblems.map(
        ({ epicKey, linkedNwrKeys, problem, referencedBy }) => ({
          epicKey,
          linkedNwrKeys,
          problem,
          referencedBy,
        }),
      ),
    ).toEqual([
      {
        epicKey: 'CCM-10',
        linkedNwrKeys: [],
        problem: 'no-nwr-link',
        referencedBy: ['CCM-1'],
      },
      {
        epicKey: 'CCM-11',
        linkedNwrKeys: ['NWR-1'],
        problem: 'wrong-nwr-link',
        referencedBy: ['CCM-2'],
      },
      {
        epicKey: 'CCM-12',
        linkedNwrKeys: [],
        problem: 'not-an-epic',
        referencedBy: ['CCM-3'],
      },
      {
        epicKey: 'CCM-13',
        linkedNwrKeys: [],
        problem: 'epic-not-found',
        referencedBy: ['CCM-4', 'CCM-5'],
      },
      {
        epicKey: 'CCM-14',
        linkedNwrKeys: ['NWR-1'],
        problem: 'wrong-nwr-link',
        referencedBy: [],
      },
    ]);
  });

  it('accepts an epic linked to several NWRs when one is the expected key', () => {
    const result = checkEpics({
      issues: [
        issue({
          key: 'CCM-10',
          issueType: 'Epic',
          nwrLinks: ['NWR-1', 'NWR-2198'],
        }),
      ],
      nwrKey: 'NWR-2198',
      resolvedEpics: [],
    });

    expect(result.epicsWithNwrProblems).toEqual([]);
  });

  it('lists every epic used by release tickets with the tickets that use it', () => {
    const result = checkEpics({
      issues: [
        issue({ key: 'CCM-1', epicKey: 'CCM-11' }),
        issue({ key: 'CCM-2', epicKey: 'CCM-10' }),
        issue({ key: 'CCM-3', epicKey: 'CCM-11' }),
        issue({ key: 'CCM-4', epicKey: 'CCM-99' }),
      ],
      nwrKey: 'NWR-2198',
      resolvedEpics: [
        issue({ key: 'CCM-10', issueType: 'Epic', nwrLinks: ['NWR-2198'] }),
        issue({ key: 'CCM-11', issueType: 'Epic' }),
      ],
    });

    expect(
      result.epicsInUse.map(({ epic, epicKey, issueKeys }) => ({
        epicKey,
        found: epic !== undefined,
        issueKeys,
      })),
    ).toEqual([
      { epicKey: 'CCM-10', found: true, issueKeys: ['CCM-2'] },
      { epicKey: 'CCM-11', found: true, issueKeys: ['CCM-1', 'CCM-3'] },
      { epicKey: 'CCM-99', found: false, issueKeys: ['CCM-4'] },
    ]);
  });
});
