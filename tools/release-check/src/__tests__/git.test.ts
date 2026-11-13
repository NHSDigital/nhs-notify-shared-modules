import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

import {
  collectCommits,
  collectCommitsForTags,
  ensureCommitishExists,
  getOriginRemoteUrl,
  getPreviousTag,
  getRepoName,
  getRepoRoot,
  listTags,
  readTagAnnotation,
  resolveGitTags,
  resolveRepoPath,
} from '../git';

jest.mock('node:child_process', () => ({
  spawnSync: jest.fn(),
}));

jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
}));

const mockedSpawnSync = spawnSync as jest.MockedFunction<typeof spawnSync>;
const mockedExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

describe('resolveRepoPath', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an existing absolute path', () => {
    mockedExistsSync.mockImplementation((candidate) => candidate === '/repo');

    expect(resolveRepoPath('/repo')).toBe('/repo');
  });

  it('falls back to the sibling checkout path for relative input', () => {
    const cwd = jest.spyOn(process, 'cwd').mockReturnValue('/workspace/shared');
    mockedExistsSync.mockImplementation(
      (candidate) => candidate === '/workspace/tool-target',
    );

    expect(resolveRepoPath('tool-target')).toBe('/workspace/tool-target');

    cwd.mockRestore();
  });

  it('throws when no candidate exists', () => {
    mockedExistsSync.mockReturnValue(false);

    expect(() => resolveRepoPath('missing-repo')).toThrow(
      'Could not resolve repository path for "missing-repo".',
    );
  });
});

describe('git command helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns repo metadata from git commands', () => {
    mockedSpawnSync
      .mockReturnValueOnce({
        status: 0,
        stdout: '/repos/client-config\n',
        stderr: '',
      } as never)
      .mockReturnValueOnce({
        status: 0,
        stdout: '',
        stderr: '',
      } as never)
      .mockReturnValueOnce({
        status: 0,
        stdout: 'git@github.com:NHSDigital/nhs-notify-client-config.git\n',
        stderr: '',
      } as never);

    expect(getRepoRoot('/repos/client-config')).toBe('/repos/client-config');
    expect(() =>
      ensureCommitishExists('/repos/client-config', '0.1.0'),
    ).not.toThrow();
    expect(getOriginRemoteUrl('/repos/client-config')).toBe(
      'git@github.com:NHSDigital/nhs-notify-client-config.git',
    );
    expect(getRepoName('/repos/client-config')).toBe('client-config');
  });

  it('surfaces git failures with stderr when available', () => {
    mockedSpawnSync.mockReturnValue({
      status: 1,
      stdout: '',
      stderr: 'fatal: bad revision',
    } as never);

    expect(() => getRepoRoot('/repos/client-config')).toThrow(
      'git rev-parse --show-toplevel failed: fatal: bad revision',
    );
  });

  it('falls back to stdout details when stderr is empty', () => {
    mockedSpawnSync.mockReturnValue({
      status: 1,
      stdout: 'fatal from stdout',
      stderr: '',
    } as never);

    expect(() => getRepoRoot('/repos/client-config')).toThrow(
      'git rev-parse --show-toplevel failed: fatal from stdout',
    );
  });
});

describe('listTags and resolveGitTags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists tags in git sort order', () => {
    mockedSpawnSync.mockReturnValue({
      status: 0,
      stdout: '0.1.0\nv0.2.0\nv0.3.0\n',
      stderr: '',
    } as never);

    expect(listTags('/repos/client-config')).toEqual([
      '0.1.0',
      'v0.2.0',
      'v0.3.0',
    ]);
  });

  it('resolves exact and wildcard tag selectors in tag order', () => {
    mockedSpawnSync.mockReturnValue({
      status: 0,
      stdout: '0.1.0\nv0.2.0\nv0.3.0\nv0.3.1\n',
      stderr: '',
    } as never);

    expect(resolveGitTags('/repos/client-config', ['v0.?.0', '0.1.0'])).toEqual(
      ['0.1.0', 'v0.2.0', 'v0.3.0'],
    );
  });

  it('throws when an exact selector is missing', () => {
    mockedSpawnSync.mockReturnValue({
      status: 0,
      stdout: '0.1.0\n',
      stderr: '',
    } as never);

    expect(() => resolveGitTags('/repos/client-config', ['0.2.0'])).toThrow(
      'Could not find git tag "0.2.0".',
    );
  });

  it('throws when a wildcard selector matches no tags', () => {
    mockedSpawnSync.mockReturnValue({
      status: 0,
      stdout: '0.1.0\n',
      stderr: '',
    } as never);

    expect(() => resolveGitTags('/repos/client-config', ['v9.*'])).toThrow(
      'Could not find git tags matching "v9.*".',
    );
  });
});

describe('getPreviousTag', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an explicit previous tag after verifying it exists', () => {
    mockedSpawnSync.mockReturnValue({
      status: 0,
      stdout: '',
      stderr: '',
    } as never);

    expect(getPreviousTag('/repos/client-config', '0.2.0', '0.1.0')).toBe(
      '0.1.0',
    );
  });

  it('auto-detects the previous tag', () => {
    mockedSpawnSync.mockReturnValue({
      status: 0,
      stdout: '0.1.0\n',
      stderr: '',
    } as never);

    expect(getPreviousTag('/repos/client-config', '0.2.0')).toBe('0.1.0');
  });

  it('returns null when no previous tag exists', () => {
    mockedSpawnSync.mockReturnValue({
      status: 128,
      stdout: '',
      stderr: 'fatal',
    } as never);

    expect(getPreviousTag('/repos/client-config', '0.1.0')).toBeNull();
  });
});

describe('collectCommits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty list when git log is empty', () => {
    mockedSpawnSync.mockReturnValue({
      status: 0,
      stdout: '',
      stderr: '',
    } as never);

    expect(collectCommits('/repos/client-config', '0.1.0', null)).toEqual([]);
  });

  it('prefers Jira keys in the subject and falls back to body keys otherwise', () => {
    mockedSpawnSync.mockReturnValue({
      status: 0,
      stdout:
        `hash1\u001Fshort1\u001FCCM-100: Add feature\u001Fbody CCM-101 details\u001E` +
        `hash2\u001Fshort2\u001FNo key commit\u001Fbody CCM-101 details\u001E`,
      stderr: '',
    } as never);

    expect(collectCommits('/repos/client-config', '0.2.0', '0.1.0')).toEqual([
      {
        hash: 'hash1',
        shortHash: 'short1',
        subject: 'CCM-100: Add feature',
        body: 'body CCM-101 details',
        explicitIssueKeys: ['CCM-100'],
      },
      {
        hash: 'hash2',
        shortHash: 'short2',
        subject: 'No key commit',
        body: 'body CCM-101 details',
        explicitIssueKeys: ['CCM-101'],
      },
    ]);
  });

  it('ignores body keys when the subject already names a Jira issue', () => {
    mockedSpawnSync.mockReturnValue({
      status: 0,
      stdout: `hash1\u001Fshort1\u001FCCM-11990 Workflow fixes (#80)\u001F* CCM-1190 adding a test for amplify CI\u001E`,
      stderr: '',
    } as never);

    expect(collectCommits('/repos/client-config', '0.2.0', '0.1.0')).toEqual([
      {
        hash: 'hash1',
        shortHash: 'short1',
        subject: 'CCM-11990 Workflow fixes (#80)',
        body: '* CCM-1190 adding a test for amplify CI',
        explicitIssueKeys: ['CCM-11990'],
      },
    ]);
  });

  it('ignores path-like issue keys when falling back to the body', () => {
    mockedSpawnSync.mockReturnValue({
      status: 0,
      stdout:
        `hash1\u001Fshort1\u001FCombined Dependabot PRs (#16)\u001F* Bump requests in /docs/adr/assets/ADR-003/examples/python\u001E` +
        `hash2\u001Fshort2\u001FNo key commit\u001FRefs CCM-101 for rollout\u001E`,
      stderr: '',
    } as never);

    expect(collectCommits('/repos/client-config', '0.2.0', '0.1.0')).toEqual([
      {
        hash: 'hash1',
        shortHash: 'short1',
        subject: 'Combined Dependabot PRs (#16)',
        body: '* Bump requests in /docs/adr/assets/ADR-003/examples/python',
        explicitIssueKeys: [],
      },
      {
        hash: 'hash2',
        shortHash: 'short2',
        subject: 'No key commit',
        body: 'Refs CCM-101 for rollout',
        explicitIssueKeys: ['CCM-101'],
      },
    ]);
  });

  it('deduplicates commits across multiple selected tags', () => {
    mockedSpawnSync
      .mockReturnValueOnce({
        status: 0,
        stdout:
          `hash1\u001Fshort1\u001FCCM-100: Add feature\u001F\u001E` +
          `hash2\u001Fshort2\u001FCCM-101: Add feature\u001F\u001E`,
        stderr: '',
      } as never)
      .mockReturnValueOnce({
        status: 0,
        stdout:
          `hash2\u001Fshort2\u001FCCM-101: Add feature\u001F\u001E` +
          `hash3\u001Fshort3\u001FCCM-102: Add feature\u001F\u001E`,
        stderr: '',
      } as never);

    expect(
      collectCommitsForTags('/repos/client-config', [
        { gitTag: '0.2.0', previousTag: '0.1.0' },
        { gitTag: '0.3.0', previousTag: '0.2.0' },
      ]),
    ).toEqual([
      {
        hash: 'hash1',
        shortHash: 'short1',
        subject: 'CCM-100: Add feature',
        body: '',
        explicitIssueKeys: ['CCM-100'],
      },
      {
        hash: 'hash2',
        shortHash: 'short2',
        subject: 'CCM-101: Add feature',
        body: '',
        explicitIssueKeys: ['CCM-101'],
      },
      {
        hash: 'hash3',
        shortHash: 'short3',
        subject: 'CCM-102: Add feature',
        body: '',
        explicitIssueKeys: ['CCM-102'],
      },
    ]);
  });
});

describe('readTagAnnotation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when the tag ref is absent', () => {
    mockedSpawnSync.mockReturnValue({
      status: 0,
      stdout: '',
      stderr: '',
    } as never);

    expect(readTagAnnotation('/repos/client-config', '0.1.0')).toBeNull();
  });

  it('returns null when an annotated tag has only whitespace content', () => {
    mockedSpawnSync.mockReturnValue({
      status: 0,
      stdout: 'tag\u001F   \n',
      stderr: '',
    } as never);

    expect(readTagAnnotation('/repos/client-config', '0.1.0')).toBeNull();
  });

  it('returns null for lightweight tags', () => {
    mockedSpawnSync.mockReturnValue({
      status: 0,
      stdout: 'commit\u001FCCM-100 release text\n',
      stderr: '',
    } as never);

    expect(readTagAnnotation('/repos/client-config', '0.1.0')).toBeNull();
  });

  it('returns trimmed annotation text for annotated tags', () => {
    mockedSpawnSync.mockReturnValue({
      status: 0,
      stdout: 'tag\u001F  CCM-100 release text  \n',
      stderr: '',
    } as never);

    expect(readTagAnnotation('/repos/client-config', '0.1.0')).toBe(
      'CCM-100 release text',
    );
  });
});
