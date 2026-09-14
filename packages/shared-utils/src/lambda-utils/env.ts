import { type FormattableZodIssue, formatZodIssues } from './format-zod-issues';

/**
 * Structural shape of a Zod schema's `safeParse` result. Declared locally so
 * this helper stays dependency-free and does not couple the package to a
 * specific Zod version; any Zod object schema is structurally assignable to
 * this type.
 */
export interface EnvSchema<T> {
  safeParse: (
    data: unknown,
  ) =>
    | { success: true; data: T }
    | { success: false; error: { issues: readonly FormattableZodIssue[] } };
}

export class EnvValidationError extends Error {
  constructor(issues: string) {
    super(`Invalid environment configuration — ${issues}`);
    this.name = 'EnvValidationError';
  }
}

/**
 * Parses `process.env` (or a supplied source) against a Zod schema, throwing
 * a formatted `EnvValidationError` when validation fails. Using a schema
 * allows coercion (e.g. numbers, true/false flags) and format assertions,
 * rather than every environment variable being read as a plain string with
 * no type checking.
 */
export function parseEnv<T>(
  schema: EnvSchema<T>,
  source: NodeJS.ProcessEnv = process.env,
): T {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new EnvValidationError(formatZodIssues(result.error.issues));
  }
  return result.data;
}
