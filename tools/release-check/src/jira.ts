import type { JiraIssue, JiraVersion } from './types';

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

export const resolveJiraVersion = async (
  jiraBaseUrl: string,
  jiraProject: string,
  reference: string,
): Promise<JiraVersion> => {
  const parsed = parseVersionReference(reference);

  if (parsed.type === 'id') {
    const version = await fetchJiraJson<{
      id: string | number;
      name: string;
      releaseDate?: string;
      released?: boolean;
    }>(`${jiraBaseUrl}/rest/api/2/version/${encodeURIComponent(parsed.value)}`);

    return {
      id: String(version.id),
      name: version.name,
      releaseDate: version.releaseDate ?? null,
      released: Boolean(version.released),
    };
  }

  const versions = await fetchJiraJson<
    {
      id: string | number;
      name: string;
      releaseDate?: string;
      released?: boolean;
    }[]
  >(
    `${jiraBaseUrl}/rest/api/2/project/${encodeURIComponent(jiraProject)}/versions`,
  );

  const version = versions.find((candidate) => candidate.name === parsed.value);
  if (!version) {
    throw new Error(
      `Could not find Jira version "${parsed.value}" in project ${jiraProject}.`,
    );
  }

  return {
    id: String(version.id),
    name: version.name,
    releaseDate: version.releaseDate ?? null,
    released: Boolean(version.released),
  };
};

export const fetchJiraIssues = async (
  jiraBaseUrl: string,
  jiraProject: string,
  jiraVersion: JiraVersion,
): Promise<JiraIssue[]> => {
  const issues: JiraIssue[] = [];
  const maxResults = 100;
  let startAt = 0;
  const jql = `project = ${jiraProject} AND fixVersion = ${jiraVersion.id} AND issuetype not in (Epic) AND status != "Not Required" ORDER BY key ASC`;

  while (true) {
    const search = await fetchJiraJson<{
      issues: {
        key: string;
        fields: {
          customfield_10523?: unknown;
          customfield_15200?: unknown;
          customfield_16657?: unknown;
          components: { name: string }[];
          status: { name: string };
          summary: string;
        };
      }[];
      total: number;
    }>(
      `${jiraBaseUrl}/rest/api/2/search?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${maxResults}&fields=summary,status,components,${CLINICAL_LEAD_FIELD_ID},${MEDICAL_CLINICAL_SAFETY_CATEGORY_FIELD_ID},${CLINICAL_REVIEW_STATUS_FIELD_ID}`,
    );

    for (const issue of search.issues) {
      const {
        components,
        customfield_10523: clinicalLeadField,
        customfield_15200: medicalClinicalSafetyCategoryField,
        customfield_16657: clinicalReviewStatusField,
        status,
        summary,
      } = issue.fields;

      issues.push({
        clinicalLead: getJiraFieldString(clinicalLeadField),
        clinicalReviewStatus: getJiraFieldString(clinicalReviewStatusField),
        components: components.map((component) => component.name),
        key: issue.key,
        medicalClinicalSafetyCategory: getJiraFieldString(
          medicalClinicalSafetyCategoryField,
        ),
        status: status.name,
        summary,
      });
    }

    startAt += search.issues.length;
    if (startAt >= search.total) {
      break;
    }
  }

  return issues;
};
