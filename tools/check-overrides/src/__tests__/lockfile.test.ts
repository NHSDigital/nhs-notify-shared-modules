import {
  findGlobalResolvedVersions,
  findScopedResolvedVersions,
  lockfilePath,
  readLockfile,
} from 'src/lockfile';

import { readFile } from 'node:fs/promises';

jest.mock('node:fs/promises', () => ({ readFile: jest.fn() }));

const mockedReadFile = readFile as jest.MockedFunction<typeof readFile>;

const lockfile = {
  lockfileVersion: '9.0',
  snapshots: {
    'mid-pkg@5.7.3': {
      dependencies: {
        'leaf-pkg': '1.2.0',
        'extra-dep': '2.3.0',
      },
    },
    'mid-pkg@4.5.1': {
      dependencies: {
        'leaf-pkg': '1.0.5',
      },
    },
    'leaf-pkg@1.2.0': {},
    'leaf-pkg@1.0.5': {},
    '@scope/root-pkg@3.1039.0': {
      dependencies: {
        'mid-pkg': '5.7.3',
      },
    },
    'peer-dep-pkg@19.0.0(peer@1.0.0)': {},
  },
};

describe('findGlobalResolvedVersions', () => {
  it('returns every resolved version of a package across snapshots', () => {
    expect(findGlobalResolvedVersions(lockfile, 'mid-pkg')).toEqual([
      '5.7.3',
      '4.5.1',
    ]);
  });

  it('strips peer-dep suffixes from versions', () => {
    expect(findGlobalResolvedVersions(lockfile, 'peer-dep-pkg')).toEqual([
      '19.0.0',
    ]);
  });

  it('handles scoped package names', () => {
    expect(findGlobalResolvedVersions(lockfile, '@scope/root-pkg')).toEqual([
      '3.1039.0',
    ]);
  });

  it('returns an empty list when the package is absent', () => {
    expect(findGlobalResolvedVersions(lockfile, 'not-installed')).toEqual([]);
  });

  it('returns an empty list when the lockfile has no snapshots', () => {
    expect(
      findGlobalResolvedVersions({ lockfileVersion: '9.0' }, 'mid-pkg'),
    ).toEqual([]);
  });
});

describe('findScopedResolvedVersions', () => {
  it('returns the child version from every parent snapshot', () => {
    expect(findScopedResolvedVersions(lockfile, 'mid-pkg', 'leaf-pkg')).toEqual(
      ['1.2.0', '1.0.5'],
    );
  });

  it('only includes parents that satisfy the parent version selector', () => {
    expect(
      findScopedResolvedVersions(lockfile, 'mid-pkg', 'leaf-pkg', '>=5.0.0'),
    ).toEqual(['1.2.0']);
  });

  it('strips peer-dep suffixes from child versions', () => {
    const withPeers = {
      lockfileVersion: '9.0',
      snapshots: {
        'mid-pkg@1.0.0': { dependencies: { foo: '2.0.0(peer@1.0.0)' } },
      },
    };
    expect(findScopedResolvedVersions(withPeers, 'mid-pkg', 'foo')).toEqual([
      '2.0.0',
    ]);
  });

  it('returns an empty list when the parent has no such dependency', () => {
    expect(
      findScopedResolvedVersions(lockfile, 'mid-pkg', 'nonexistent'),
    ).toEqual([]);
  });

  it('returns an empty list when the parent is not in the lockfile', () => {
    expect(
      findScopedResolvedVersions(lockfile, 'nonexistent', 'leaf-pkg'),
    ).toEqual([]);
  });

  it('returns an empty list when the lockfile has no snapshots', () => {
    expect(
      findScopedResolvedVersions(
        { lockfileVersion: '9.0' },
        'mid-pkg',
        'leaf-pkg',
      ),
    ).toEqual([]);
  });

  it('skips snapshot keys that have no version separator', () => {
    const weird = {
      lockfileVersion: '9.0',
      snapshots: {
        'no-at-sign-here': { dependencies: { foo: '1.0.0' } },
        'mid-pkg@1.0.0': { dependencies: { foo: '2.0.0' } },
      },
    };
    expect(findScopedResolvedVersions(weird, 'mid-pkg', 'foo')).toEqual([
      '2.0.0',
    ]);
    expect(findGlobalResolvedVersions(weird, 'no-at-sign-here')).toEqual([]);
  });
});

describe('lockfilePath', () => {
  it('joins the project directory with pnpm-lock.yaml', () => {
    expect(lockfilePath('/proj')).toBe('/proj/pnpm-lock.yaml');
  });
});

describe('readLockfile', () => {
  it('parses the lockfile YAML at the project path', async () => {
    mockedReadFile.mockResolvedValue(
      "lockfileVersion: '9.0'\nsnapshots:\n  foo@1.0.0: {}\n",
    );

    const result = await readLockfile('/proj');

    expect(result.lockfileVersion).toBe('9.0');
    expect(result.snapshots).toEqual({ 'foo@1.0.0': {} });
    expect(mockedReadFile).toHaveBeenCalledWith('/proj/pnpm-lock.yaml', 'utf8');
  });
});
