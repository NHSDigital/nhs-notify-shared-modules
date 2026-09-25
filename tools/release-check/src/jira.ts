import { hasGlobPattern, matchesGlobPattern } from './selectors';
import type {
  JiraFixVersion,
  JiraIssue,
  JiraIssueFixDetails,
  JiraVersion,
} from './types';

const CLINICAL_LEAD_FIELD_ID = 'customfield_10523';
const MEDICAL_CLINICAL_SAFETY_CATEGORY_FIELD_ID = 'customfield_15200';
const CLINICAL_REVIEW_STATUS_FIELD_ID = 'customfield_16657';

const getJiraFieldString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => getJiraFieldString(entry))
      .filter(Boolean)
      .join('|');
  }

  if (value && typeof value === 'object') {
    const { name, value: namedValue } = value as {
      name?: unknown;
      value?: unknown;
    };
    if (typeof namedValue === 'string') {
      return namedValue;
    }

    if (typeof name === 'string') {
      return name;
    }
  }

  return '';
};

const getJiraToken = (): string => {
  const token =
    process.env.JIRA_API_TOKEN ||
    process.env.JIRA_PERSONAL_TOKEN ||
    process.env.JIRA_TOKEN;

  if (!token) {
    throw new Error(
      'Missing Jira token. Set JIRA_API_TOKEN, JIRA_PERSONAL_TOKEN, or JIRA_TOKEN.',
    );
  }

  return token;
};

const VERSION_PATH_PATTERN = /\/versions\/(\d+)/;
const JIRA_SEARCH_FIELDS = [
  'summary',
  'status',
  'issuetype',
  'components',
  CLINICAL_LEAD_FIELD_ID,
  MEDICAL_CLINICAL_SAFETY_CATEGORY_FIELD_ID,
  CLINICAL_REVIEW_STATUS_FIELD_ID,
];

type JiraVersionResponse = {
  id: string | number;
  name: string;
  releaseDate?: string;
  released?: boolean;
};

type JiraSearchIssueResponse = {
  key: string;
  fields: {
    customfield_10523?: unknown;
    customfield_15200?: unknown;
    customfield_16657?: unknown;
    components: { name: string }[];
    fixVersions?: { id: string | number; name: string }[];
    issuetype: { name: string };
    status: { name: string };
    summary: string;
  };
};

const toJiraVersion = (version: JiraVersionResponse): JiraVersion => ({
  id: String(version.id),
  name: version.name,
  releaseDate: version.releaseDate ?? null,
  released: Boolean(version.released),
});

const fetchJiraJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${getJiraToken()}`,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Jira request failed (${response.status} ${response.statusText}) for ${url}: ${detail}`,
    );
  }

  return response.json() as Promise<T>;
};

const fetchJiraSearchPage = async (
  jiraBaseUrl: string,
  jql: string,
  startAt: number,
  maxResults: number,
): Promise<{ issues: JiraSearchIssueResponse[]; total: number }> => {
  const response = await fetch(`${jiraBaseUrl}/rest/api/2/search`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${getJiraToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: JIRA_SEARCH_FIELDS,
      jql,
      maxResults,
      startAt,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Jira request failed (${response.status} ${response.statusText}) for ${jiraBaseUrl}/rest/api/2/search: ${detail}`,
    );
  }

  return response.json() as Promise<{
    issues: JiraSearchIssueResponse[];
    total: number;
  }>;
};

const toJiraIssueFixDetails = (
  issue: JiraSearchIssueResponse,
): JiraIssueFixDetails => {
  const {
    components,
    customfield_10523: clinicalLeadField,
    customfield_15200: medicalClinicalSafetyCategoryField,
    customfield_16657: clinicalReviewStatusField,
    fixVersions,
    issuetype,
    status,
    summary,
  } = issue.fields;

  return {
    clinicalLead: getJiraFieldString(clinicalLeadField),
    clinicalReviewStatus: getJiraFieldString(clinicalReviewStatusField),
    components: components.map((component) => component.name),
    fixVersions: (fixVersions ?? []).map((fixVersion) => ({
      id: String(fixVersion.id),
      name: fixVersion.name,
    })),
    issueType: issuetype.name,
    key: issue.key,
    medicalClinicalSafetyCategory: getJiraFieldString(
      medicalClinicalSafetyCategoryField,
    ),
    status: status.name,
    summary,
  };
};

const searchJiraIssues = async (
  jiraBaseUrl: string,
  jql: string,
): Promise<JiraIssueFixDetails[]> => {
  const issues: JiraIssueFixDetails[] = [];
  const maxResults = 100;
  let startAt = 0;

  while (true) {
    const search = await fetchJiraSearchPage(
      jiraBaseUrl,
      jql,
      startAt,
      maxResults,
    );

    issues.push(...search.issues.map((issue) => toJiraIssueFixDetails(issue)));

    startAt += search.issues.length;
    if (startAt >= search.total) {
      break;
    }
  }

  return issues;
};

const parseVersionReference = (
  reference: string,
): { type: 'id'; value: string } | { type: 'name'; value: string } => {
  const trimmed = reference.trim();

  if (/^\d+$/.test(trimmed)) {
    return { type: 'id', value: trimmed };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed);
    const match = VERSION_PATH_PATTERN.exec(url.pathname);
    if (match) {
      return { type: 'id', value: match[1] };
    }
  }

  return { type: 'name', value: trimmed };
};

const fetchProjectVersions = async (
  jiraBaseUrl: string,
  jiraProject: string,
): Promise<JiraVersion[]> => {
  const versions = await fetchJiraJson<JiraVersionResponse[]>(
    `${jiraBaseUrl}/rest/api/2/project/${encodeURIComponent(jiraProject)}/versions`,
  );

  return versions.map((version) => toJiraVersion(version));
};

const fetchVersionById = async (
  jiraBaseUrl: string,
  versionId: string,
): Promise<JiraVersion> => {
  const version = await fetchJiraJson<JiraVersionResponse>(
    `${jiraBaseUrl}/rest/api/2/version/${encodeURIComponent(versionId)}`,
  );

  return toJiraVersion(version);
};

const resolveNamedJiraVersions = (
  jiraProject: string,
  projectVersions: JiraVersion[],
  reference: string,
): JiraVersion[] => {
  const matches = hasGlobPattern(reference)
    ? projectVersions.filter((version) =>
        matchesGlobPattern(version.name, reference),
      )
    : projectVersions.filter((version) => version.name === reference);

  if (matches.length > 0) {
    return matches;
  }

  if (hasGlobPattern(reference)) {
    throw new Error(
      `Could not find Jira versions matching "${reference}" in project ${jiraProject}.`,
    );
  }

  throw new Error(
    `Could not find Jira version "${reference}" in project ${jiraProject}.`,
  );
};

export const resolveJiraVersions = async (
  jiraBaseUrl: string,
  jiraProject: string,
  references: string[],
): Promise<JiraVersion[]> => {
  const selectedVersions: JiraVersion[] = [];
  const selectedVersionIds = new Set<string>();
  const needsProjectVersions = references.some(
    (reference) => parseVersionReference(reference).type === 'name',
  );
  const projectVersions = needsProjectVersions
    ? await fetchProjectVersions(jiraBaseUrl, jiraProject)
    : [];

  for (const reference of references) {
    const parsed = parseVersionReference(reference);
    const matches =
      parsed.type === 'id'
        ? [await fetchVersionById(jiraBaseUrl, parsed.value)]
        : resolveNamedJiraVersions(jiraProject, projectVersions, parsed.value);

    for (const match of matches) {
      if (!selectedVersionIds.has(match.id)) {
        selectedVersions.push(match);
        selectedVersionIds.add(match.id);
      }
    }
  }

  return selectedVersions;
};

export const resolveJiraVersion = async (
  jiraBaseUrl: string,
  jiraProject: string,
  reference: string,
): Promise<JiraVersion> => {
  const [version] = await resolveJiraVersions(jiraBaseUrl, jiraProject, [
    reference,
  ]);
  return version;
};

export const fetchJiraIssues = async (
  jiraBaseUrl: string,
  jiraProject: string,
  jiraVersion: JiraVersion,
): Promise<JiraIssue[]> => {
  const jql = `project = ${jiraProject} AND fixVersion = ${jiraVersion.id} AND issuetype not in (Epic) AND status != "Not Required" ORDER BY key ASC`;
  return searchJiraIssues(jiraBaseUrl, jql);
};

export const fetchJiraIssuesByKeys = async (
  jiraBaseUrl: string,
  jiraProject: string,
  issueKeys: string[],
): Promise<JiraIssueFixDetails[]> => {
  const uniqueIssueKeys = [...new Set(issueKeys)];

  if (uniqueIssueKeys.length === 0) {
    return [];
  }

  const issues: JiraIssueFixDetails[] = [];

  for (let index = 0; index < uniqueIssueKeys.length; index += 100) {
    const batch = uniqueIssueKeys
      .slice(index, index + 100)
      .map((issueKey) => `"${issueKey}"`)
      .join(', ');
    const jql = `project = ${jiraProject} AND key in (${batch}) ORDER BY key ASC`;
    issues.push(...(await searchJiraIssues(jiraBaseUrl, jql)));
  }

  return issues;
};

export const updateJiraIssueFixVersions = async (
  jiraBaseUrl: string,
  issueKey: string,
  fixVersions: JiraFixVersion[],
): Promise<void> => {
  const response = await fetch(
    `${jiraBaseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${getJiraToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          fixVersions: fixVersions.map((fixVersion) => ({
            id: fixVersion.id,
          })),
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Jira request failed (${response.status} ${response.statusText}) for ${jiraBaseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}: ${detail}`,
    );
  }
};

export const updateJiraIssueClinicalReviewStatus = async (
  jiraBaseUrl: string,
  issueKey: string,
): Promise<void> => {
  const response = await fetch(
    `${jiraBaseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${getJiraToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          [CLINICAL_REVIEW_STATUS_FIELD_ID]: { value: 'Review not needed' },
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Jira request failed (${response.status} ${response.statusText}) for ${jiraBaseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}: ${detail}`,
    );
  }
};
