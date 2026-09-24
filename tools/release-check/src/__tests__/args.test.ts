import { parseCliArgs } from '../args';

describe('parseCliArgs', () => {
  it('parses required and optional arguments', () => {
    expect(
      parseCliArgs([
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
      repo: '../repo',
      gitTag: '0.1.0',
      jiraVersion: '71260',
      jiraProject: 'ABC',
      jiraBaseUrl: 'https://jira.example.com',
      previousTag: '0.0.9',
      output: 'out.txt',
      releaseNotesSource: 'tag',
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
      repo: '../repo',
      gitTag: '0.1.0',
      jiraVersion: '71260',
      jiraProject: 'CCM',
      jiraBaseUrl: 'https://nhsd-jira.digital.nhs.uk',
      previousTag: undefined,
      output: undefined,
      releaseNotesSource: 'auto',
    });
  });

  it('throws for missing required arguments', () => {
    expect(() => parseCliArgs([])).toThrow('Missing required option --repo');
  });

  it('throws when the git tag is missing', () => {
    expect(() =>
      parseCliArgs(['--repo', '../repo', '--jira-version', '71260']),
    ).toThrow('Missing required option --git-tag');
  });

  it('throws when the Jira version is missing', () => {
    expect(() =>
      parseCliArgs(['--repo', '../repo', '--git-tag', '0.1.0']),
    ).toThrow('Missing required option --jira-version');
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
});
