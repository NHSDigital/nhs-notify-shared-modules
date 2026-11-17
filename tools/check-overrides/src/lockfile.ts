import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { satisfies } from 'semver';
import { parse as parseYaml } from 'yaml';

const LOCKFILE = 'pnpm-lock.yaml';

type Snapshot = {
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

type Lockfile = {
  lockfileVersion: string;
  snapshots?: Record<string, Snapshot>;
};

export const lockfilePath = (projectDir: string): string =>
  path.join(projectDir, LOCKFILE);

export const readLockfile = async (projectDir: string): Promise<Lockfile> => {
  const content = await readFile(lockfilePath(projectDir), 'utf8');
  return parseYaml(content) as Lockfile;
};

const baseVersion = (raw: string): string => {
  const parenIndex = raw.indexOf('(');
  return parenIndex === -1 ? raw : raw.slice(0, parenIndex);
};

const parseSnapshotKey = (
  key: string,
): { name: string; version: string } | undefined => {
  const startSearch = key.startsWith('@') ? 1 : 0;
  const atIndex = key.indexOf('@', startSearch);
  if (atIndex === -1) {
    return undefined;
  }
  return {
    name: key.slice(0, atIndex),
    version: baseVersion(key.slice(atIndex + 1)),
  };
};

const matchesParentSnapshot = (
  key: string,
  parentName: string,
  parentVersionSelector?: string,
): boolean => {
  const parent = parseSnapshotKey(key);
  return (
    parent?.name === parentName &&
    (parentVersionSelector === undefined ||
      satisfies(parent.version, parentVersionSelector))
  );
};

const findDependencyVersion = (
  dependencies: Record<string, string> | undefined,
  packageName: string,
): string | undefined =>
  Object.entries(dependencies ?? {}).find(
    ([name]) => name === packageName,
  )?.[1];

export const findGlobalResolvedVersions = (
  lockfile: Lockfile,
  packageName: string,
): string[] =>
  Object.keys(lockfile.snapshots ?? {})
    .map((key) => parseSnapshotKey(key))
    .filter(
      (parsed): parsed is { name: string; version: string } =>
        parsed?.name === packageName,
    )
    .map((parsed) => parsed.version);

export const hasScopedParent = (
  lockfile: Lockfile,
  parentName: string,
  parentVersionSelector?: string,
): boolean =>
  Object.keys(lockfile.snapshots ?? {}).some((key) =>
    matchesParentSnapshot(key, parentName, parentVersionSelector),
  );

export const findScopedResolvedVersions = (
  lockfile: Lockfile,
  parentName: string,
  packageName: string,
  parentVersionSelector?: string,
): string[] =>
  Object.entries(lockfile.snapshots ?? {})
    .filter(([key]) =>
      matchesParentSnapshot(key, parentName, parentVersionSelector),
    )
    .map(
      ([, snapshot]) =>
        findDependencyVersion(snapshot.dependencies, packageName) ??
        findDependencyVersion(snapshot.optionalDependencies, packageName),
    )
    .filter((dependency): dependency is string => dependency !== undefined)
    .map((dependency) => baseVersion(dependency));
