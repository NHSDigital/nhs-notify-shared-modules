import { hasGlobPattern, matchesGlobPattern } from './selectors';
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

type JiraVersionResponse = {
  id: string | number;
  name: string;
  releaseDate?: string;
  released?: boolean;
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
          issuetype: { name: string };
          status: { name: string };
          summary: string;
        };
      }[];
      total: number;
    }>(
      `${jiraBaseUrl}/rest/api/2/search?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${maxResults}&fields=summary,status,issuetype,components,${CLINICAL_LEAD_FIELD_ID},${MEDICAL_CLINICAL_SAFETY_CATEGORY_FIELD_ID},${CLINICAL_REVIEW_STATUS_FIELD_ID}`,
    );

    for (const issue of search.issues) {
      const {
        components,
        customfield_10523: clinicalLeadField,
        customfield_15200: medicalClinicalSafetyCategoryField,
        customfield_16657: clinicalReviewStatusField,
        issuetype,
        status,
        summary,
      } = issue.fields;

      issues.push({
        clinicalLead: getJiraFieldString(clinicalLeadField),
        clinicalReviewStatus: getJiraFieldString(clinicalReviewStatusField),
        components: components.map((component) => component.name),
        issueType: issuetype.name,
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
