import { parseArgs } from 'node:util';

import type { CliOptions, ReleaseNotesSource } from './types';

const DEFAULT_JIRA_BASE_URL = 'https://nhsd-jira.digital.nhs.uk';
const DEFAULT_JIRA_PROJECT = 'CCM';

const trimTrailingSlashes = (value: string): string => {
  let end = value.length;
  while (end > 0 && value[end - 1] === '/') {
    end -= 1;
  }
  return value.slice(0, end);
};

const isReleaseNotesSource = (
  value: string | undefined,
): value is ReleaseNotesSource =>
  value === 'auto' || value === 'github' || value === 'tag' || value === 'none';

export const parseCliArgs = (argv: string[]): CliOptions => {
  const { values } = parseArgs({
    args: argv,
    options: {
      repo: { type: 'string' },
      'git-tag': { type: 'string' },
      'jira-version': { type: 'string' },
      'jira-project': { type: 'string', default: DEFAULT_JIRA_PROJECT },
      'jira-base-url': { type: 'string', default: DEFAULT_JIRA_BASE_URL },
      'previous-tag': { type: 'string' },
      output: { type: 'string' },
      'release-notes-source': { type: 'string', default: 'auto' },
    },
    allowPositionals: false,
  });

  if (!values.repo) {
    throw new Error('Missing required option --repo');
  }
  if (!values['git-tag']) {
    throw new Error('Missing required option --git-tag');
  }
  if (!values['jira-version']) {
    throw new Error('Missing required option --jira-version');
  }
  if (!isReleaseNotesSource(values['release-notes-source'])) {
    throw new Error(
      'Invalid --release-notes-source. Expected one of: auto, github, tag, none',
    );
  }

  return {
    repo: values.repo,
    gitTag: values['git-tag'],
    jiraVersion: values['jira-version'],
    jiraProject: values['jira-project'],
    jiraBaseUrl: trimTrailingSlashes(values['jira-base-url']),
    previousTag: values['previous-tag'],
    output: values.output,
    releaseNotesSource: values['release-notes-source'],
  };
};
