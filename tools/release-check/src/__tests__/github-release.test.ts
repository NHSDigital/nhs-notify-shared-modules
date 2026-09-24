import {
  parseGitHubRepositoryFromRemote,
  readReleaseNotes,
} from '../github-release';

jest.mock('../git', () => ({
  getOriginRemoteUrl: jest.fn(),
  readTagAnnotation: jest.fn(),
}));

const gitModule = jest.requireMock<typeof import('../git')>('../git');
const mockFetch = jest.fn();
const mockedGetOriginRemoteUrl =
  gitModule.getOriginRemoteUrl as jest.MockedFunction<
    typeof gitModule.getOriginRemoteUrl
  >;
const mockedReadTagAnnotation =
  gitModule.readTagAnnotation as jest.MockedFunction<
    typeof gitModule.readTagAnnotation
  >;

Object.defineProperty(globalThis, 'fetch', {
  value: mockFetch,
  writable: true,
});

describe('parseGitHubRepositoryFromRemote', () => {
  it('parses ssh remotes', () => {
    expect(
      parseGitHubRepositoryFromRemote(
        'git@github.com:NHSDigital/nhs-notify-client-config.git',
      ),
    ).toEqual({
      owner: 'NHSDigital',
      repo: 'nhs-notify-client-config',
    });
  });

  it('parses https remotes', () => {
    expect(
      parseGitHubRepositoryFromRemote(
        'https://github.com/NHSDigital/nhs-notify-client-config.git',
      ),
    ).toEqual({
      owner: 'NHSDigital',
      repo: 'nhs-notify-client-config',
    });
  });

  it('returns null for non-github remotes', () => {
    expect(
      parseGitHubRepositoryFromRemote('ssh://gitlab.example.com/repo.git'),
    ).toBeNull();
  });
});

describe('readReleaseNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
  });

  it('returns none when release notes are disabled', async () => {
    await expect(readReleaseNotes('/repo', '0.1.0', 'none')).resolves.toEqual({
      issueKeys: [],
      source: 'none',
      text: null,
      warnings: [],
    });
  });

  it('returns github release notes when a release body exists', async () => {
    process.env.GITHUB_TOKEN = 'github-token';
    mockedGetOriginRemoteUrl.mockReturnValue(
      'git@github.com:NHSDigital/nhs-notify-client-config.git',
    );
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ body: 'CCM-100 first\nCCM-101 second' }),
    });

    await expect(readReleaseNotes('/repo', '0.1.0', 'github')).resolves.toEqual(
      {
        issueKeys: ['CCM-100', 'CCM-101'],
        source: 'github-release',
        text: 'CCM-100 first\nCCM-101 second',
        warnings: [],
      },
    );
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/NHSDigital/nhs-notify-client-config/releases/tags/0.1.0',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/vnd.github+json',
          Authorization: 'Bearer github-token',
        }),
      }),
    );
  });

  it('throws in github mode when the origin remote is not GitHub', async () => {
    mockedGetOriginRemoteUrl.mockReturnValue(
      'ssh://gitlab.example.com/repo.git',
    );

    await expect(readReleaseNotes('/repo', '0.1.0', 'github')).rejects.toThrow(
      'Origin remote is not a supported GitHub URL.',
    );
  });

  it('falls back to tag annotation in auto mode with a warning', async () => {
    mockedGetOriginRemoteUrl.mockReturnValue(
      'ssh://gitlab.example.com/repo.git',
    );
    mockedReadTagAnnotation.mockReturnValue('CCM-200 annotated release');

    await expect(readReleaseNotes('/repo', '0.1.0', 'auto')).resolves.toEqual({
      issueKeys: ['CCM-200'],
      source: 'tag-annotation',
      text: 'CCM-200 annotated release',
      warnings: [
        'Origin remote is not a supported GitHub URL; skipped GitHub release lookup.',
      ],
    });
  });

  it('falls back to none in auto mode when GitHub lookup fails and no annotation exists', async () => {
    mockedGetOriginRemoteUrl.mockReturnValue(
      'git@github.com:NHSDigital/nhs-notify-client-config.git',
    );
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'bad token',
    });
    mockedReadTagAnnotation.mockReturnValue(null);

    await expect(readReleaseNotes('/repo', '0.1.0', 'auto')).resolves.toEqual({
      issueKeys: [],
      source: 'none',
      text: null,
      warnings: [
        'GitHub release lookup failed: GitHub release lookup failed (401 Unauthorized): bad token',
        'Tag 0.1.0 is not annotated; no tag release notes available.',
      ],
    });
  });

  it('records non-Error exceptions from github lookup in auto mode', async () => {
    mockedGetOriginRemoteUrl.mockReturnValue(
      'git@github.com:NHSDigital/nhs-notify-client-config.git',
    );
    mockFetch.mockRejectedValue('network down');
    mockedReadTagAnnotation.mockReturnValue(null);

    await expect(readReleaseNotes('/repo', '0.1.0', 'auto')).resolves.toEqual({
      issueKeys: [],
      source: 'none',
      text: null,
      warnings: [
        'GitHub release lookup failed: network down',
        'Tag 0.1.0 is not annotated; no tag release notes available.',
      ],
    });
  });

  it('throws in github mode when no release body is found', async () => {
    mockedGetOriginRemoteUrl.mockReturnValue(
      'https://github.com/NHSDigital/nhs-notify-client-config.git',
    );
    mockFetch.mockResolvedValue({
      status: 404,
      ok: false,
      statusText: 'Not Found',
      text: async () => 'missing',
    });

    await expect(readReleaseNotes('/repo', '0.1.0', 'github')).rejects.toThrow(
      'No GitHub release body found for tag 0.1.0.',
    );
  });

  it('warns and falls back when the github release exists but has no body in auto mode', async () => {
    mockedGetOriginRemoteUrl.mockReturnValue(
      'https://github.com/NHSDigital/nhs-notify-client-config.git',
    );
    mockFetch.mockResolvedValue({
      status: 200,
      ok: true,
      statusText: 'OK',
      json: async () => ({ body: '' }),
    });
    mockedReadTagAnnotation.mockReturnValue('CCM-300 tag notes');

    await expect(readReleaseNotes('/repo', '0.1.0', 'auto')).resolves.toEqual({
      issueKeys: ['CCM-300'],
      source: 'tag-annotation',
      text: 'CCM-300 tag notes',
      warnings: ['No GitHub release body found for tag 0.1.0; falling back.'],
    });
  });

  it('throws in tag mode when the tag is not annotated', async () => {
    mockedReadTagAnnotation.mockReturnValue(null);

    await expect(readReleaseNotes('/repo', '0.1.0', 'tag')).rejects.toThrow(
      'Tag 0.1.0 is not annotated, so no tag release notes are available.',
    );
  });
});
