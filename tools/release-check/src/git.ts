import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import type { GitCommit } from './types';

const GIT_EXECUTABLE = '/usr/bin/git';
const ISSUE_KEY_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/g;

const runGit = (repoPath: string, args: string[]): string => {
  const result = spawnSync(GIT_EXECUTABLE, ['-C', repoPath, ...args], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.status !== 0) {
    const detail =
      result.stderr.trim() ||
      result.stdout.trim() ||
      `git exited ${result.status}`;
    throw new Error(`git ${args.join(' ')} failed: ${detail}`);
  }

  return result.stdout.trimEnd();
};

export const resolveRepoPath = (repoInput: string): string => {
  const candidates = path.isAbsolute(repoInput)
    ? [repoInput]
    : [
        path.resolve(process.cwd(), repoInput),
        path.resolve(process.cwd(), '..', repoInput),
      ];

  const resolved = candidates.find((candidate) => existsSync(candidate));
  if (!resolved) {
    throw new Error(`Could not resolve repository path for "${repoInput}".`);
  }

  return resolved;
};

export const getRepoRoot = (repoPath: string): string =>
  runGit(repoPath, ['rev-parse', '--show-toplevel']);

export const getRepoName = (repoRoot: string): string =>
  path.basename(repoRoot);

export const ensureCommitishExists = (
  repoRoot: string,
  commitish: string,
): void => {
  runGit(repoRoot, ['rev-parse', '--verify', `${commitish}^{commit}`]);
};

export const getPreviousTag = (
  repoRoot: string,
  gitTag: string,
  explicitPreviousTag?: string,
): string | null => {
  if (explicitPreviousTag) {
    ensureCommitishExists(repoRoot, explicitPreviousTag);
    return explicitPreviousTag;
  }

  const result = spawnSync(
    GIT_EXECUTABLE,
    ['-C', repoRoot, 'describe', '--tags', '--abbrev=0', `${gitTag}^`],
    {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    },
  );

  if (result.status !== 0) {
    return null;
  }

  return result.stdout.trim() || null;
};

export const collectCommits = (
  repoRoot: string,
  gitTag: string,
  previousTag: string | null,
): GitCommit[] => {
  const range = previousTag ? `${previousTag}..${gitTag}` : gitTag;
  const raw = runGit(repoRoot, [
    'log',
    '--no-merges',
    '--format=%H%x1f%h%x1f%s%x1f%b%x1e',
    range,
  ]);

  if (!raw) {
    return [];
  }

  return raw
    .split('\u001E')
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, shortHash, subject, body = ''] = record.split('\u001F');
      const explicitIssueKeys = [
        ...new Set(
          (`${subject}\n${body}`.match(ISSUE_KEY_PATTERN) ?? []).map((key) =>
            key.toUpperCase(),
          ),
        ),
      ];

      return {
        body,
        explicitIssueKeys,
        hash,
        shortHash,
        subject,
      };
    });
};

export const getOriginRemoteUrl = (repoRoot: string): string =>
  runGit(repoRoot, ['remote', 'get-url', 'origin']);

export const readTagAnnotation = (
  repoRoot: string,
  gitTag: string,
): string | null => {
  const output = runGit(repoRoot, [
    'for-each-ref',
    `refs/tags/${gitTag}`,
    '--format=%(objecttype)%x1f%(contents)',
  ]);

  if (!output) {
    return null;
  }

  const [objectType, contents = ''] = output.split('\u001F');
  if (objectType !== 'tag') {
    return null;
  }

  const text = contents.trim();
  return text || null;
};
