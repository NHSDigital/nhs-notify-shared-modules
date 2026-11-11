import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

import { minSatisfying, sort, valid } from 'semver';

import {
  findGlobalResolvedVersions,
  findScopedResolvedVersions,
  lockfilePath,
  readLockfile,
} from 'src/lockfile';
import {
  removeOverridesFromYaml,
  workspaceFilePath,
  writeWorkspaceFile,
} from 'src/workspace-file';

import type { Override } from 'src/types';

export const regenerateLockfile = async (
  projectDir: string,
  packagesToUpdate: string[],
): Promise<void> => {
  if (packagesToUpdate.length === 0) {
    return;
  }
  const args = [
    'update',
    '--lockfile-only',
    '--no-save',
    '-r',
    ...packagesToUpdate,
  ];
  await new Promise<void>((resolve, reject) => {
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    const child = spawn('pnpm', args, {
      cwd: projectDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      const stdout = Buffer.concat(stdoutChunks).toString('utf8');
      const stderr = Buffer.concat(stderrChunks).toString('utf8');
      const output = [stdout, stderr].filter(Boolean).join('\n');
      reject(
        new Error(
          `pnpm ${args.join(' ')} failed with exit code ${code}\n${output}`,
        ),
      );
    });
  });
};

const lowestVersion = (
  versions: string[],
  selector?: string,
): string | undefined => {
  const semverVersions = versions.filter((version) => valid(version) !== null);
  return selector === undefined
    ? sort(semverVersions)[0]
    : (minSatisfying(semverVersions, selector) ?? undefined);
};

/**
 * Returns the lowest resolved version that the override applies to, or
 * undefined if no resolved version is in the selector range.
 */
export const readResolvedVersion = async (
  projectDir: string,
  override: Override,
): Promise<string | undefined> => {
  const lockfile = await readLockfile(projectDir);
  const versions = override.parent
    ? findScopedResolvedVersions(
        lockfile,
        override.parent,
        override.package,
        override.parentVersionSelector,
      )
    : findGlobalResolvedVersions(lockfile, override.package);
  return lowestVersion(versions, override.versionSelector);
};

export const withOriginalFiles = async <T>(
  projectDir: string,
  fn: () => Promise<T>,
): Promise<T> => {
  const workspacePath = workspaceFilePath(projectDir);
  const lockPath = lockfilePath(projectDir);
  const [originalWorkspace, originalLock] = await Promise.all([
    readFile(workspacePath, 'utf8'),
    readFile(lockPath, 'utf8'),
  ]);
  try {
    return await fn();
  } finally {
    await Promise.all([
      writeFile(workspacePath, originalWorkspace, 'utf8'),
      writeFile(lockPath, originalLock, 'utf8'),
    ]);
  }
};

export const applyRemovals = async (
  projectDir: string,
  overridesToRemove: Override[],
): Promise<void> => {
  if (overridesToRemove.length === 0) {
    return;
  }
  const workspacePath = workspaceFilePath(projectDir);
  const current = await readFile(workspacePath, 'utf8');
  const updated = removeOverridesFromYaml(
    current,
    overridesToRemove.map((o) => o.key),
  );
  await writeWorkspaceFile(projectDir, updated);
  const affectedPackages = [
    ...new Set(overridesToRemove.flatMap((o) => [o.package, o.parent ?? ''])),
  ].filter((name) => name.length > 0);
  await regenerateLockfile(projectDir, affectedPackages);
};
