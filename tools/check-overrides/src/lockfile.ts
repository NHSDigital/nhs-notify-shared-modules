import { readFile } from "node:fs/promises";
import path from "node:path";

import { parse as parseYaml } from "yaml";

const LOCKFILE = "pnpm-lock.yaml";

type Snapshot = {
  dependencies?: Record<string, string>;
};

type Lockfile = {
  lockfileVersion: string;
  snapshots?: Record<string, Snapshot>;
};

export const lockfilePath = (projectDir: string): string =>
  path.join(projectDir, LOCKFILE);

export const readLockfile = async (projectDir: string): Promise<Lockfile> => {
  const content = await readFile(lockfilePath(projectDir), "utf8");
  return parseYaml(content) as Lockfile;
};

const baseVersion = (raw: string): string => {
  const parenIndex = raw.indexOf("(");
  return parenIndex === -1 ? raw : raw.slice(0, parenIndex);
};

const parseSnapshotKey = (
  key: string,
): { name: string; version: string } | undefined => {
  const startSearch = key.startsWith("@") ? 1 : 0;
  const atIndex = key.indexOf("@", startSearch);
  if (atIndex === -1) {
    return undefined;
  }
  return {
    name: key.slice(0, atIndex),
    version: baseVersion(key.slice(atIndex + 1)),
  };
};

export const findGlobalResolvedVersion = (
  lockfile: Lockfile,
  packageName: string,
): string | undefined => {
  const snapshots = lockfile.snapshots ?? {};
  const versions = Object.keys(snapshots)
    .map((key) => parseSnapshotKey(key))
    .filter(
      (parsed): parsed is { name: string; version: string } =>
        parsed !== undefined && parsed.name === packageName,
    )
    .map((parsed) => parsed.version);

  if (versions.length === 0) {
    return undefined;
  }
  return versions.toSorted((a, b) => (a < b ? 1 : -1))[0];
};

export const findScopedResolvedVersion = (
  lockfile: Lockfile,
  parentName: string,
  packageName: string,
): string | undefined => {
  const snapshots = lockfile.snapshots ?? {};
  const childVersions: string[] = [];

  for (const [key, snapshot] of Object.entries(snapshots)) {
    const parsed = parseSnapshotKey(key);
    if (parsed && parsed.name === parentName) {
      const dep = snapshot.dependencies?.[packageName];
      if (dep) {
        childVersions.push(baseVersion(dep));
      }
    }
  }

  if (childVersions.length === 0) {
    return undefined;
  }
  return childVersions.toSorted((a, b) => (a < b ? -1 : 1))[0];
};
