import type {
  EpicCheckResult,
  EpicNwrFinding,
  EpicNwrProblem,
  JiraIssue,
} from './types';

// Epics sit at the top of the ticket hierarchy and sub-tasks inherit their parent's epic.
const EPIC_LINK_EXEMPT_ISSUE_TYPES = new Set(['Epic', 'Sub-task']);

const requiresEpic = (issue: JiraIssue): boolean =>
  !EPIC_LINK_EXEMPT_ISSUE_TYPES.has(issue.issueType);

const compareKeys = (left: string, right: string): number =>
  left.localeCompare(right, undefined, { numeric: true });

export const getEpicKeysToResolve = (issues: JiraIssue[]): string[] => {
  const knownKeys = new Set(issues.map((issue) => issue.key));

  return [
    ...new Set(
      issues
        .filter((issue) => requiresEpic(issue) && issue.epicKey)
        .map((issue) => issue.epicKey as string)
        .filter((epicKey) => !knownKeys.has(epicKey)),
    ),
  ].toSorted(compareKeys);
};

const getNwrProblem = (
  epic: JiraIssue | undefined,
  nwrKey: string,
): EpicNwrProblem | undefined => {
  if (!epic) {
    return 'epic-not-found';
  }

  if (epic.issueType !== 'Epic') {
    return 'not-an-epic';
  }

  const linkedNwrKeys = epic.nwrLinks ?? [];
  if (linkedNwrKeys.length === 0) {
    return 'no-nwr-link';
  }

  return linkedNwrKeys.includes(nwrKey) ? undefined : 'wrong-nwr-link';
};

export const checkEpics = ({
  issues,
  nwrKey,
  resolvedEpics,
}: {
  issues: JiraIssue[];
  nwrKey: string;
  resolvedEpics: JiraIssue[];
}): EpicCheckResult => {
  const epicsByKey = new Map(
    [...issues, ...resolvedEpics].map((issue) => [issue.key, issue]),
  );
  const referencedBy = new Map<string, string[]>();
  const issuesWithoutEpic: JiraIssue[] = [];

  for (const issue of issues.filter((entry) => requiresEpic(entry))) {
    if (issue.epicKey) {
      referencedBy.set(issue.epicKey, [
        ...(referencedBy.get(issue.epicKey) ?? []),
        issue.key,
      ]);
    } else {
      issuesWithoutEpic.push(issue);
    }
  }

  const epicKeysToCheck = new Set([
    ...referencedBy.keys(),
    ...issues.filter((issue) => issue.issueType === 'Epic').map((i) => i.key),
  ]);

  const epicsWithNwrProblems = [...epicKeysToCheck]
    .toSorted(compareKeys)
    .flatMap((epicKey): EpicNwrFinding[] => {
      const epic = epicsByKey.get(epicKey);
      const problem = getNwrProblem(epic, nwrKey);

      return problem
        ? [
            {
              epic,
              epicKey,
              linkedNwrKeys: epic?.nwrLinks ?? [],
              problem,
              referencedBy: referencedBy.get(epicKey) ?? [],
            },
          ]
        : [];
    });

  const epicsInUse = [...referencedBy.entries()]
    .toSorted(([left], [right]) => compareKeys(left, right))
    .map(([epicKey, issueKeys]) => ({
      epic: epicsByKey.get(epicKey),
      epicKey,
      issueKeys,
    }));

  return { epicsInUse, epicsWithNwrProblems, issuesWithoutEpic, nwrKey };
};
