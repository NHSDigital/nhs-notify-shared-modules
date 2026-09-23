import {
  fetchJiraIssues,
  resolveJiraVersion,
  resolveJiraVersions,
} from '../jira';

const mockFetch = jest.fn();

Object.defineProperty(globalThis, 'fetch', {
  value: mockFetch,
  writable: true,
});

describe('resolveJiraVersion', () => {
  const originalToken = process.env.JIRA_API_TOKEN;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JIRA_API_TOKEN = 'token';
  });

  afterAll(() => {
    process.env.JIRA_API_TOKEN = originalToken;
  });

  it('resolves a numeric version id directly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 71_260,
        name: 'client-config-0.1.0',
        releaseDate: '2026-07-08',
        released: true,
      }),
    });

    await expect(
      resolveJiraVersion('https://jira.example.com', 'CCM', '71260'),
    ).resolves.toEqual({
      id: '71260',
      name: 'client-config-0.1.0',
      releaseDate: '2026-07-08',
      released: true,
    });
  });

  it('extracts a version id from a Jira version URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 71_260,
        name: 'client-config-0.1.0',
        releaseDate: '2026-07-08',
        released: true,
      }),
    });

    await expect(
      resolveJiraVersion(
        'https://jira.example.com',
        'CCM',
        'https://jira.example.com/projects/CCM/versions/71260',
      ),
    ).resolves.toEqual({
      id: '71260',
      name: 'client-config-0.1.0',
      releaseDate: '2026-07-08',
      released: true,
    });
  });

  it('resolves a version name from the project versions list', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, name: 'older' },
        {
          id: 71_260,
          name: 'client-config-0.1.0',
          releaseDate: '2026-07-08',
          released: true,
        },
      ],
    });

    await expect(
      resolveJiraVersion(
        'https://jira.example.com',
        'CCM',
        'client-config-0.1.0',
      ),
    ).resolves.toEqual({
      id: '71260',
      name: 'client-config-0.1.0',
      releaseDate: '2026-07-08',
      released: true,
    });
  });

  it('resolves multiple versions from exact and wildcard selectors', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 1,
          name: 'client-config-0.1.0',
          releaseDate: '2026-07-08',
          released: true,
        },
        {
          id: 2,
          name: 'client-config-0.2.0',
          releaseDate: '2026-08-08',
          released: false,
        },
        {
          id: 3,
          name: 'other-release',
          releaseDate: '2026-09-01',
          released: false,
        },
      ],
    });

    await expect(
      resolveJiraVersions('https://jira.example.com', 'CCM', [
        'client-config-0.1.0',
        'client-config-*',
      ]),
    ).resolves.toEqual([
      {
        id: '1',
        name: 'client-config-0.1.0',
        releaseDate: '2026-07-08',
        released: true,
      },
      {
        id: '2',
        name: 'client-config-0.2.0',
        releaseDate: '2026-08-08',
        released: false,
      },
    ]);
  });

  it('defaults missing release metadata from the version response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 71_260,
        name: 'client-config-0.1.0',
      }),
    });

    await expect(
      resolveJiraVersion('https://jira.example.com', 'CCM', '71260'),
    ).resolves.toEqual({
      id: '71260',
      name: 'client-config-0.1.0',
      releaseDate: null,
      released: false,
    });
  });

  it('throws when the named version is not found', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, name: 'older' }],
    });

    await expect(
      resolveJiraVersion('https://jira.example.com', 'CCM', 'missing'),
    ).rejects.toThrow('Could not find Jira version "missing" in project CCM.');
  });

  it('throws when the wildcard version selector matches nothing', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, name: 'older' }],
    });

    await expect(
      resolveJiraVersions('https://jira.example.com', 'CCM', [
        'client-config-*',
      ]),
    ).rejects.toThrow(
      'Could not find Jira versions matching "client-config-*" in project CCM.',
    );
  });

  it('throws when no Jira token is configured', async () => {
    delete process.env.JIRA_API_TOKEN;

    await expect(
      resolveJiraVersion('https://jira.example.com', 'CCM', '71260'),
    ).rejects.toThrow(
      'Missing Jira token. Set JIRA_API_TOKEN, JIRA_PERSONAL_TOKEN, or JIRA_TOKEN.',
    );
  });
});

describe('fetchJiraIssues', () => {
  const originalToken = process.env.JIRA_API_TOKEN;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JIRA_API_TOKEN = 'token';
  });

  afterAll(() => {
    process.env.JIRA_API_TOKEN = originalToken;
  });

  it('maps paged Jira issues', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          total: 2,
          issues: [
            {
              key: 'CCM-1',
              fields: {
                customfield_10523: { name: 'Dr Test' },
                customfield_15200: { value: 'Cat 1' },
                customfield_16657: { value: 'Review required' },
                issuetype: { name: 'Story' },
                summary: 'First',
                status: { name: 'Done' },
                components: [{ name: 'Platform' }],
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          total: 2,
          issues: [
            {
              key: 'CCM-2',
              fields: {
                customfield_10523: null,
                customfield_15200: ['Cat 2', { value: 'Cat 3' }],
                customfield_16657: 'Review not needed',
                issuetype: { name: 'Bug' },
                summary: 'Second',
                status: { name: 'In Progress' },
                components: [],
              },
            },
          ],
        }),
      });

    await expect(
      fetchJiraIssues('https://jira.example.com', 'CCM', {
        id: '71260',
        name: 'release',
        releaseDate: null,
        released: true,
      }),
    ).resolves.toEqual([
      {
        issueType: 'Story',
        key: 'CCM-1',
        clinicalLead: 'Dr Test',
        clinicalReviewStatus: 'Review required',
        summary: 'First',
        medicalClinicalSafetyCategory: 'Cat 1',
        status: 'Done',
        components: ['Platform'],
      },
      {
        issueType: 'Bug',
        key: 'CCM-2',
        clinicalLead: '',
        clinicalReviewStatus: 'Review not needed',
        summary: 'Second',
        medicalClinicalSafetyCategory: 'Cat 2|Cat 3',
        status: 'In Progress',
        components: [],
      },
    ]);
  });

  it('throws when Jira responds with an error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: async () => 'boom',
    });

    await expect(
      fetchJiraIssues('https://jira.example.com', 'CCM', {
        id: '71260',
        name: 'release',
        releaseDate: null,
        released: true,
      }),
    ).rejects.toThrow(
      'Jira request failed (500 Server Error) for https://jira.example.com/rest/api/2/search',
    );
  });
});
