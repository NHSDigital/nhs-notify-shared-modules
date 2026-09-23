import { getOriginRemoteUrl, readTagAnnotation } from './git';

import type {
  ReleaseNotes,
  ReleaseNotesLookupSource,
  ReleaseNotesSource,
} from './types';

const GITHUB_REMOTE_SSH_PATTERN = /^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/;
const GITHUB_REMOTE_HTTPS_PATTERN =
  /^https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/;
const ISSUE_KEY_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/g;

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

const fetchGitHubReleaseBody = async (
  owner: string,
  repo: string,
  gitTag: string,
): Promise<string | null> => {
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
    return null;
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `GitHub release lookup failed (${response.status} ${response.statusText}): ${detail}`,
    );
  }

  const release = (await response.json()) as { body?: string | null };
  const body = release.body?.trim();
  return body || null;
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

  const body = await fetchGitHubReleaseBody(remote.owner, remote.repo, gitTag);
  if (body) {
    return {
      issueKeys: extractIssueKeys(body),
      source: 'github-release',
      text: body,
      warnings,
    };
  }

  if (source === 'github') {
    throw new Error(`No GitHub release body found for tag ${gitTag}.`);
  }

  warnings.push(
    `No GitHub release body found for tag ${gitTag}; falling back.`,
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
    return {
      issueKeys: extractIssueKeys(annotation),
      source: 'tag-annotation',
      text: annotation,
      warnings,
    };
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
