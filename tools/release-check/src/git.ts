import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { hasGlobPattern, matchesGlobPattern } from './selectors';
import type { GitCommit, SelectedGitTag } from './types';

const GIT_EXECUTABLE = '/usr/bin/git';
const ISSUE_KEY_PATTERN = /(^|[^A-Z0-9/])([A-Z][A-Z0-9]+-\d+)(?=$|[^A-Z0-9/])/g;

const extractIssueKeys = (text: string): string[] =>
  [...text.matchAll(ISSUE_KEY_PATTERN)].map((match) => match[2].toUpperCase());

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

export const listTags = (repoRoot: string): string[] => {
  const raw = runGit(repoRoot, ['tag', '--list', '--sort=version:refname']);
  return raw
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export const ensureCommitishExists = (
  repoRoot: string,
  commitish: string,
): void => {
  runGit(repoRoot, ['rev-parse', '--verify', `${commitish}^{commit}`]);
};

export const resolveGitTags = (
  repoRoot: string,
  selectors: string[],
): string[] => {
  const availableTags = listTags(repoRoot);
  const selectedTags = new Set<string>();

  for (const selector of selectors) {
    if (hasGlobPattern(selector)) {
      const matches = availableTags.filter((tag) =>
        matchesGlobPattern(tag, selector),
      );
      if (matches.length === 0) {
        throw new Error(`Could not find git tags matching "${selector}".`);
      }
      for (const match of matches) {
        selectedTags.add(match);
      }
    } else {
      if (!availableTags.includes(selector)) {
        throw new Error(`Could not find git tag "${selector}".`);
      }
      selectedTags.add(selector);
    }
  }

  return availableTags.filter((tag) => selectedTags.has(tag));
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
  rangeEndTag: string = gitTag,
): GitCommit[] => {
  const range = previousTag ? `${previousTag}..${rangeEndTag}` : rangeEndTag;
  const baseReleaseRange = previousTag
    ? `${previousTag}..${gitTag}`
    : `repository start..${gitTag}`;
  const releaseRange =
    rangeEndTag === gitTag
      ? baseReleaseRange
      : `${baseReleaseRange} (+ patches through ${rangeEndTag})`;
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
      const subjectIssueKeys = extractIssueKeys(subject);
      const explicitIssueKeys = [
        ...new Set(
          subjectIssueKeys.length > 0
            ? subjectIssueKeys
            : extractIssueKeys(body),
        ),
      ];

      return {
        body,
        explicitIssueKeys,
        hash,
        releaseRange,
        releaseTag: gitTag,
        shortHash,
        subject,
      };
    });
};

export const collectCommitsForTags = (
  repoRoot: string,
  gitTags: SelectedGitTag[],
): GitCommit[] => {
  const commitsByHash = new Map<string, GitCommit>();

  for (const { gitTag, previousTag, rangeEndTag } of gitTags) {
    for (const commit of collectCommits(
      repoRoot,
      gitTag,
      previousTag,
      rangeEndTag ?? gitTag,
    )) {
      if (!commitsByHash.has(commit.hash)) {
        commitsByHash.set(commit.hash, commit);
      }
    }
  }

  return [...commitsByHash.values()];
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
