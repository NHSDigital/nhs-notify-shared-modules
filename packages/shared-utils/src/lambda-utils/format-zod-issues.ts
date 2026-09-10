/**
 * Minimal structural shape of a Zod issue. Declared locally so the formatter
 * stays dependency-free and does not couple the package to a specific Zod
 * version; a `ZodError.issues` array is structurally assignable to this type.
 */
export interface FormattableZodIssue {
  path: PropertyKey[];
  message: string;
}

export function formatZodIssues(
  issues: readonly FormattableZodIssue[],
): string {
  return issues
    .map((issue) => {
      const path = issue.path.map(String).join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');
}
