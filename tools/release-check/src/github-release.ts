import { getOriginRemoteUrl, readTagAnnotation } from './git';

import type {
  GitCommit,
  ReleaseNoteEntry,
  ReleaseNotes,
  ReleaseNotesLookupSource,
  ReleaseNotesSource,
} from './types';

const GITHUB_REMOTE_SSH_PATTERN = /^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/;
const GITHUB_REMOTE_HTTPS_PATTERN =
  /^https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/;
const ISSUE_KEY_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/g;
const RELEASE_NOTE_PULL_REQUEST_PATTERN = /\/pull\/(\d+)\b/;
const COMMIT_PULL_REQUEST_PATTERNS = [
  /\(#(\d+)\)/g,
  /^Merge pull request #(\d+)\b/g,
];

const parseGitHubRepositoryFromRemote = (
  remoteUrl: string,
): { owner: string; repo: string } | null => {
  const sshMatch = GITHUB_REMOTE_SSH_PATTERN.exec(remoteUrl);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  const httpsMatch = GITHUB_REMOTE_HTTPS_PATTERN.exec(remoteUrl);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  return null;
};

const extractIssueKeys = (text: string): string[] => [
  ...new Set(
    (text.match(ISSUE_KEY_PATTERN) ?? []).map((key) => key.toUpperCase()),
  ),
];

const parseReleaseNoteEntries = (text: string): ReleaseNoteEntry[] =>
  text
    .split('\n')
    .map((line) => {
      const pullRequest = RELEASE_NOTE_PULL_REQUEST_PATTERN.exec(line)?.[1];
      return {
        issueKeys: extractIssueKeys(line),
        pullRequestNumber: pullRequest ? Number(pullRequest) : null,
      };
    })
    .filter(
      ({ issueKeys, pullRequestNumber }) =>
        issueKeys.length > 0 || pullRequestNumber != null,
    );

const buildReleaseNotes = (
  source: ReleaseNotesLookupSource,
  text: string,
  warnings: string[],
): ReleaseNotes => ({
  entries: parseReleaseNoteEntries(text),
  issueKeys: extractIssueKeys(text),
  source,
  text,
  warnings,
});

const getCommitPullRequestNumber = (commit: GitCommit): number | null => {
  for (const pattern of COMMIT_PULL_REQUEST_PATTERNS) {
    const matches = [...commit.subject.matchAll(pattern)];
    const last = matches.at(-1)?.[1];
    if (last) {
      return Number(last);
    }
  }
  return null;
};

// Release notes are written from PR titles, so they carry the same wrong ticket
// as the commit; apply the commit mappings to the notes via the PR number.
export const applyCommitMappingsToReleaseNotes = (
  releaseNotes: ReleaseNotes,
  commits: GitCommit[],
): ReleaseNotes => {
  const mappedKeyByPullRequest = new Map<number, string>();
  for (const commit of commits) {
    const pullRequestNumber = getCommitPullRequestNumber(commit);
    if (commit.issueKeyOverride && pullRequestNumber != null) {
      mappedKeyByPullRequest.set(
        pullRequestNumber,
        commit.issueKeyOverride.issueKey,
      );
    }
  }

  if (mappedKeyByPullRequest.size === 0) {
    return releaseNotes;
  }

  const entries = releaseNotes.entries.map((entry) => {
    const mappedKey =
      entry.pullRequestNumber == null
        ? undefined
        : mappedKeyByPullRequest.get(entry.pullRequestNumber);
    return mappedKey ? { ...entry, issueKeys: [mappedKey] } : entry;
  });

  return {
    ...releaseNotes,
    entries,
    issueKeys: [...new Set(entries.flatMap(({ issueKeys }) => issueKeys))],
  };
};

type GitHubReleaseLookupMissReason = 'empty-body' | 'not-found';

type GitHubReleaseLookupResult =
  | {
      body: string;
      kind: 'body';
    }
  | {
      kind: 'missing';
      reason: GitHubReleaseLookupMissReason;
    };

const hasGitHubToken = (): boolean =>
  Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);

const formatMissingReleaseBodyMessage = (
  gitTag: string,
  reason: GitHubReleaseLookupMissReason,
): string => {
  if (reason === 'not-found' && !hasGitHubToken()) {
    return `No GitHub release body found for tag ${gitTag}; if this repository is private, set GITHUB_TOKEN or GH_TOKEN and try again.`;
  }

  return `No GitHub release body found for tag ${gitTag}.`;
};

const fetchGitHubReleaseBody = async (
  owner: string,
  repo: string,
  gitTag: string,
): Promise<GitHubReleaseLookupResult> => {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(gitTag)}`,
    {
      headers,
    },
  );

  if (response.status === 404) {
    return {
      kind: 'missing',
      reason: 'not-found',
    };
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `GitHub release lookup failed (${response.status} ${response.statusText}): ${detail}`,
    );
  }

  const release = (await response.json()) as { body?: string | null };
  const body = release.body?.trim();
  if (body) {
    return {
      body,
      kind: 'body',
    };
  }

  return {
    kind: 'missing',
    reason: 'empty-body',
  };
};

const formatLookupError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const tryReadGitHubReleaseNotes = async (
  repoRoot: string,
  gitTag: string,
  source: ReleaseNotesSource,
  warnings: string[],
): Promise<ReleaseNotes | null> => {
  const remote = parseGitHubRepositoryFromRemote(getOriginRemoteUrl(repoRoot));
  if (!remote) {
    if (source === 'github') {
      throw new Error('Origin remote is not a supported GitHub URL.');
    }
    warnings.push(
      'Origin remote is not a supported GitHub URL; skipped GitHub release lookup.',
    );
    return null;
  }

  let result = await fetchGitHubReleaseBody(remote.owner, remote.repo, gitTag);
  if (result.kind === 'missing' && result.reason === 'not-found') {
    // Git tags and GitHub release tags are not always named consistently (0.3.0 vs v0.3.0)
    const alternateTag = gitTag.startsWith('v')
      ? gitTag.slice(1)
      : `v${gitTag}`;
    const alternateResult = await fetchGitHubReleaseBody(
      remote.owner,
      remote.repo,
      alternateTag,
    );
    if (alternateResult.kind === 'body') {
      result = alternateResult;
    }
  }
  if (result.kind === 'body') {
    return buildReleaseNotes('github-release', result.body, warnings);
  }

  if (source === 'github') {
    throw new Error(formatMissingReleaseBodyMessage(gitTag, result.reason));
  }

  warnings.push(
    `${formatMissingReleaseBodyMessage(gitTag, result.reason)} Falling back.`,
  );
  return null;
};

const readTagReleaseNotes = (
  repoRoot: string,
  gitTag: string,
  source: ReleaseNotesSource,
  warnings: string[],
): ReleaseNotes | null => {
  const annotation = readTagAnnotation(repoRoot, gitTag);
  if (annotation) {
    return buildReleaseNotes('tag-annotation', annotation, warnings);
  }
  if (source === 'tag') {
    throw new Error(
      `Tag ${gitTag} is not annotated, so no tag release notes are available.`,
    );
  }
  warnings.push(
    `Tag ${gitTag} is not annotated; no tag release notes available.`,
  );
  return null;
};

const mergeReleaseNoteSources = (
  sources: ReleaseNotesLookupSource[],
): ReleaseNotesLookupSource => {
  const uniqueSources = [...new Set(sources)];
  if (uniqueSources.length === 1) {
    return uniqueSources[0];
  }
  return 'mixed';
};

export const readReleaseNotes = async (
  repoRoot: string,
  gitTag: string,
  source: ReleaseNotesSource,
): Promise<ReleaseNotes> => {
  const warnings: string[] = [];

  if (source === 'none') {
    return {
      entries: [],
      issueKeys: [],
      source: 'none',
      text: null,
      warnings,
    };
  }

  if (source === 'github' || source === 'auto') {
    try {
      const releaseNotes = await tryReadGitHubReleaseNotes(
        repoRoot,
        gitTag,
        source,
        warnings,
      );
      if (releaseNotes) {
        return releaseNotes;
      }
    } catch (error: unknown) {
      if (source === 'github') {
        throw error;
      }
      warnings.push(
        `GitHub release lookup failed: ${formatLookupError(error)}`,
      );
    }
  }

  if (source === 'tag' || source === 'auto') {
    const releaseNotes = readTagReleaseNotes(
      repoRoot,
      gitTag,
      source,
      warnings,
    );
    if (releaseNotes) {
      return releaseNotes;
    }
  }

  return {
    entries: [],
    issueKeys: [],
    source: 'none',
    text: null,
    warnings,
  };
};

export const readReleaseNotesForTags = async (
  repoRoot: string,
  gitTags: string[],
  source: ReleaseNotesSource,
): Promise<ReleaseNotes> => {
  if (gitTags.length === 1) {
    return readReleaseNotes(repoRoot, gitTags[0], source);
  }

  const notesByTag = await Promise.all(
    gitTags.map(async (gitTag) => ({
      gitTag,
      releaseNotes: await readReleaseNotes(repoRoot, gitTag, source),
    })),
  );

  return {
    entries: notesByTag.flatMap(({ releaseNotes }) => releaseNotes.entries),
    issueKeys: [
      ...new Set(
        notesByTag.flatMap(({ releaseNotes }) => releaseNotes.issueKeys),
      ),
    ],
    source: mergeReleaseNoteSources(
      notesByTag.map(({ releaseNotes }) => releaseNotes.source),
    ),
    text: null,
    warnings: notesByTag.flatMap(({ gitTag, releaseNotes }) =>
      releaseNotes.warnings.map((warning) => `[${gitTag}] ${warning}`),
    ),
  };
};

export { parseGitHubRepositoryFromRemote };
