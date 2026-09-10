# `@nhsdigital/nhs-notify-shared-utils/lambda-utils`

Small, dependency-light helpers for Lambda handlers.

## Import

```ts
import {
  CORRELATION_ID_ATTRIBUTE,
  EnvValidationError,
  formatZodIssues,
  parseEnv,
  readSqsStringAttribute,
} from '@nhsdigital/nhs-notify-shared-utils/lambda-utils';
```

## `parseEnv`

Parses `process.env` (or a supplied source) against a Zod object schema,
returning a typed, coerced result. Throws `EnvValidationError` — with a
formatted list of issues — when validation fails.

```ts
import { z } from 'zod';

const envSchema = z.object({
  TABLE_NAME: z.string().min(1),
  TTL_SECONDS: z.coerce.number().int().positive(),
});

const { TABLE_NAME: tableName, TTL_SECONDS: ttlSeconds } = parseEnv(envSchema);
```

`EnvSchema<T>` declares the minimal `safeParse` shape required, so this
package does not depend on Zod directly — any Zod object schema is
structurally assignable to it.

## `readSqsStringAttribute`

Reads a `String` message attribute from an SQS record, or `undefined` when the
attribute is absent or not a string. `CORRELATION_ID_ATTRIBUTE` is the shared
`correlationId` attribute name.

```ts
const correlationId = readSqsStringAttribute(record, CORRELATION_ID_ATTRIBUTE);
```

The record only needs a `messageAttributes` map (see `SqsRecordLike`), so the
helper stays decoupled from the `aws-lambda` types.

## `formatZodIssues`

Turns an array of Zod issues into a single readable string. It is pure: it does
not log or throw. Any `ZodError.issues` array is accepted.

```ts
const result = schema.safeParse(input);
if (!result.success) {
  throw new Error(`Invalid input — ${formatZodIssues(result.error.issues)}`);
}
// "items.0.id: Required; name: Expected string"
```
