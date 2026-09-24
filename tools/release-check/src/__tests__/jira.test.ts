import {
  fetchJiraIssues,
  fetchJiraIssuesByKeys,
  resolveJiraVersion,
  resolveJiraVersions,
  updateJiraIssueClinicalReviewStatus,
  updateJiraIssueFixVersions,
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

  it('resolves a Jira version from a version URL', async () => {
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
      resolveJiraVersions('https://jira.example.com', 'CCM', [
        'https://jira.example.com/projects/CCM/versions/71260',
      ]),
    ).resolves.toEqual([
      {
        id: '71260',
        name: 'client-config-0.1.0',
        releaseDate: '2026-07-08',
        released: true,
      },
    ]);
  });

  it('surfaces Jira version lookup failures', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: async () => 'broken',
    });

    await expect(
      resolveJiraVersion('https://jira.example.com', 'CCM', '71260'),
    ).rejects.toThrow(
      'Jira request failed (500 Server Error) for https://jira.example.com/rest/api/2/version/71260: broken',
    );
  });

  it('throws when an exact Jira version name is missing', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await expect(
      resolveJiraVersions('https://jira.example.com', 'CCM', [
        'client-config-9.9.9',
      ]),
    ).rejects.toThrow(
      'Could not find Jira version "client-config-9.9.9" in project CCM.',
    );
  });

  it('throws when a wildcard Jira version selector matches nothing', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
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

describe('jira issue operations', () => {
  const originalToken = process.env.JIRA_API_TOKEN;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JIRA_API_TOKEN = 'token';
  });

  afterAll(() => {
    process.env.JIRA_API_TOKEN = originalToken;
  });

  it('maps paged Jira issues including fix versions', async () => {
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
                fixVersions: [{ id: 71_260, name: 'client-config-0.1.0' }],
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
                fixVersions: [],
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
        fixVersions: [{ id: '71260', name: 'client-config-0.1.0' }],
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
        fixVersions: [],
        summary: 'Second',
        medicalClinicalSafetyCategory: 'Cat 2|Cat 3',
        status: 'In Progress',
        components: [],
      },
    ]);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://jira.example.com/rest/api/2/search',
      expect.objectContaining({
        body: JSON.stringify({
          fields: [
            'summary',
            'status',
            'issuetype',
            'components',
            'fixVersions',
            'customfield_10523',
            'customfield_15200',
            'customfield_16657',
          ],
          jql: 'project = CCM AND fixVersion = 71260 AND issuetype not in (Epic) AND status != "Not Required" ORDER BY key ASC',
          maxResults: 100,
          startAt: 0,
        }),
      }),
    );
  });

  it('fetches issues by key', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        total: 1,
        issues: [
          {
            key: 'CCM-42',
            fields: {
              customfield_10523: { name: 'Dr Test' },
              customfield_15200: { value: 'Cat 1' },
              customfield_16657: { value: 'Review required' },
              fixVersions: [],
              issuetype: { name: 'Story' },
              summary: 'Outside selected versions',
              status: { name: 'Done' },
              components: [{ name: 'Platform' }],
            },
          },
        ],
      }),
    });

    await expect(
      fetchJiraIssuesByKeys('https://jira.example.com', 'CCM', ['CCM-42']),
    ).resolves.toEqual([
      {
        issueType: 'Story',
        key: 'CCM-42',
        clinicalLead: 'Dr Test',
        clinicalReviewStatus: 'Review required',
        fixVersions: [],
        summary: 'Outside selected versions',
        medicalClinicalSafetyCategory: 'Cat 1',
        status: 'Done',
        components: ['Platform'],
      },
    ]);
  });

  it('returns no issues when fetch by keys is given an empty list', async () => {
    await expect(
      fetchJiraIssuesByKeys('https://jira.example.com', 'CCM', []),
    ).resolves.toEqual([]);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('surfaces Jira search failures', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => 'bad jql',
    });

    await expect(
      fetchJiraIssues('https://jira.example.com', 'CCM', {
        id: '71260',
        name: 'release',
        releaseDate: null,
        released: true,
      }),
    ).rejects.toThrow(
      'Jira request failed (400 Bad Request) for https://jira.example.com/rest/api/2/search: bad jql',
    );
  });

  it('updates issue fix versions', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => '',
    });

    await expect(
      updateJiraIssueFixVersions('https://jira.example.com', 'CCM-42', [
        { id: '71260', name: 'client-config-0.1.0' },
      ]),
    ).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://jira.example.com/rest/api/2/issue/CCM-42',
      expect.objectContaining({
        body: JSON.stringify({
          fields: {
            fixVersions: [{ id: '71260' }],
          },
        }),
        method: 'PUT',
      }),
    );
  });

  it('surfaces fix version update failures', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      text: async () => 'cannot update',
    });

    await expect(
      updateJiraIssueFixVersions('https://jira.example.com', 'CCM-42', [
        { id: '71260', name: 'client-config-0.1.0' },
      ]),
    ).rejects.toThrow(
      'Jira request failed (409 Conflict) for https://jira.example.com/rest/api/2/issue/CCM-42: cannot update',
    );
  });

  it('updates clinical review status', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => '',
    });

    await expect(
      updateJiraIssueClinicalReviewStatus('https://jira.example.com', 'CCM-42'),
    ).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://jira.example.com/rest/api/2/issue/CCM-42',
      expect.objectContaining({
        body: JSON.stringify({
          fields: {
            customfield_16657: { value: 'Review not needed' },
          },
        }),
        method: 'PUT',
      }),
    );
  });

  it('surfaces clinical review update failures', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => 'not allowed',
    });

    await expect(
      updateJiraIssueClinicalReviewStatus('https://jira.example.com', 'CCM-42'),
    ).rejects.toThrow(
      'Jira request failed (403 Forbidden) for https://jira.example.com/rest/api/2/issue/CCM-42: not allowed',
    );
  });
});
