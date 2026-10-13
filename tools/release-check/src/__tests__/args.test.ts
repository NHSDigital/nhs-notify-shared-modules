import { parseCliArgs } from '../args';

describe('parseCliArgs', () => {
  it('parses required and optional arguments', () => {
    expect(
      parseCliArgs([
        '--fix',
        'fix-version',
        '--fix-component',
        'Platform',
        '--repo',
        '../repo',
        '--git-tag',
        '0.1.0',
        '--jira-version',
        '71260',
        '--jira-project',
        'ABC',
        '--jira-base-url',
        'https://jira.example.com/',
        '--previous-tag',
        '0.0.9',
        '--output',
        'out.txt',
        '--release-notes-source',
        'tag',
      ]),
    ).toEqual({
      fixAction: 'fix-version',
      fixComponent: 'Platform',
      repo: '../repo',
      gitTagSelectors: ['0.1.0'],
      jiraVersionSelectors: ['71260'],
      jiraProject: 'ABC',
      jiraBaseUrl: 'https://jira.example.com',
      previousTag: '0.0.9',
      output: 'out.txt',
      releaseNotesSource: 'tag',
      yes: false,
    });
  });

  it('parses comma-separated multi-release selectors', () => {
    expect(
      parseCliArgs([
        '--repo',
        '../repo',
        '--git-tags',
        '0.1.0, v0.2.0 , v0.3.*',
        '--jira-versions',
        '71260, client-config-0.2.0 , client-config-*',
      ]),
    ).toEqual({
      fixAction: undefined,
      fixComponent: undefined,
      repo: '../repo',
      gitTagSelectors: ['0.1.0', 'v0.2.0', 'v0.3.*'],
      jiraVersionSelectors: ['71260', 'client-config-0.2.0', 'client-config-*'],
      jiraProject: 'CCM',
      jiraBaseUrl: 'https://nhsd-jira.digital.nhs.uk',
      previousTag: undefined,
      output: undefined,
      releaseNotesSource: 'auto',
      yes: false,
    });
  });

  it('uses defaults for optional arguments', () => {
    expect(
      parseCliArgs([
        '--repo',
        '../repo',
        '--git-tag',
        '0.1.0',
        '--jira-version',
        '71260',
      ]),
    ).toEqual({
      fixAction: undefined,
      fixComponent: undefined,
      repo: '../repo',
      gitTagSelectors: ['0.1.0'],
      jiraVersionSelectors: ['71260'],
      jiraProject: 'CCM',
      jiraBaseUrl: 'https://nhsd-jira.digital.nhs.uk',
      previousTag: undefined,
      output: undefined,
      releaseNotesSource: 'auto',
      yes: false,
    });
  });

  it('parses fix confirmation flags', () => {
    expect(
      parseCliArgs([
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
      ]),
    ).toEqual({
      fixAction: 'clinical-review-not-needed',
      fixComponent: 'Platform',
      repo: '../repo',
      gitTagSelectors: ['0.1.0'],
      jiraVersionSelectors: ['71260'],
      jiraProject: 'CCM',
      jiraBaseUrl: 'https://nhsd-jira.digital.nhs.uk',
      previousTag: undefined,
      output: undefined,
      releaseNotesSource: 'auto',
      yes: true,
    });
  });

  it('accepts github as a release notes source', () => {
    expect(
      parseCliArgs([
        '--repo',
        '../repo',
        '--git-tag',
        '0.1.0',
        '--jira-version',
        '71260',
        '--release-notes-source',
        'github',
      ]),
    ).toEqual({
      fixAction: undefined,
      fixComponent: undefined,
      repo: '../repo',
      gitTagSelectors: ['0.1.0'],
      jiraVersionSelectors: ['71260'],
      jiraProject: 'CCM',
      jiraBaseUrl: 'https://nhsd-jira.digital.nhs.uk',
      previousTag: undefined,
      output: undefined,
      releaseNotesSource: 'github',
      yes: false,
    });
  });

  it('throws for missing required arguments', () => {
    expect(() => parseCliArgs([])).toThrow('Missing required option --repo');
  });

  it('throws when the git selector is missing', () => {
    expect(() =>
      parseCliArgs(['--repo', '../repo', '--jira-version', '71260']),
    ).toThrow('Missing required option --git-tag or --git-tags');
  });

  it('throws when the Jira selector is missing', () => {
    expect(() =>
      parseCliArgs(['--repo', '../repo', '--git-tag', '0.1.0']),
    ).toThrow('Missing required option --jira-version or --jira-versions');
  });

  it('throws when both single and multiple git selectors are provided', () => {
    expect(() =>
      parseCliArgs([
        '--repo',
        '../repo',
        '--git-tag',
        '0.1.0',
        '--git-tags',
        '0.2.0',
        '--jira-version',
        '71260',
      ]),
    ).toThrow('Options --git-tag and --git-tags are mutually exclusive');
  });

  it('throws when both single and multiple Jira selectors are provided', () => {
    expect(() =>
      parseCliArgs([
        '--repo',
        '../repo',
        '--git-tag',
        '0.1.0',
        '--jira-version',
        '71260',
        '--jira-versions',
        '71261',
      ]),
    ).toThrow(
      'Options --jira-version and --jira-versions are mutually exclusive',
    );
  });

  it('throws when a selector list is empty after trimming', () => {
    expect(() =>
      parseCliArgs([
        '--repo',
        '../repo',
        '--git-tags',
        ' , ',
        '--jira-version',
        '71260',
      ]),
    ).toThrow('Selector list must not be empty.');
  });

  it('throws for an invalid release notes source', () => {
    expect(() =>
      parseCliArgs([
        '--repo',
        '../repo',
        '--git-tag',
        '0.1.0',
        '--jira-version',
        '71260',
        '--release-notes-source',
        'weird',
      ]),
    ).toThrow(
      'Invalid --release-notes-source. Expected one of: auto, github, tag, none',
    );
  });

  it('throws for an invalid fix action', () => {
    expect(() =>
      parseCliArgs([
        '--repo',
        '../repo',
        '--git-tag',
        '0.1.0',
        '--jira-version',
        '71260',
        '--fix',
        'weird',
      ]),
    ).toThrow(
      'Invalid --fix. Expected one of: fix-version, clinical-review-not-needed',
    );
  });

  it('throws when --fix is missing its component', () => {
    expect(() =>
      parseCliArgs([
        '--repo',
        '../repo',
        '--git-tag',
        '0.1.0',
        '--jira-version',
        '71260',
        '--fix',
        'fix-version',
      ]),
    ).toThrow('Option --fix requires --fix-component');
  });

  it('throws when --fix-component is provided without --fix', () => {
    expect(() =>
      parseCliArgs([
        '--repo',
        '../repo',
        '--git-tag',
        '0.1.0',
        '--jira-version',
        '71260',
        '--fix-component',
        'Platform',
      ]),
    ).toThrow('Option --fix-component requires --fix');
  });
});
