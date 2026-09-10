# `@nhsdigital/nhs-notify-shared-utils/logger`

A generic [pino](https://getpino.io)-backed `Logger`, with support for opt-in log redaction.

## Import

```ts
import { Logger } from "@nhsdigital/nhs-notify-shared-utils/logger";
import type {
  LogContext,
  LoggerOptions,
} from "@nhsdigital/nhs-notify-shared-utils/logger";
```

`pino` is a peer dependency; the consumer installs it.

## Usage

```ts
const logger = new Logger();

logger.info("Handler started");
logger.error("Processing failed", { error: caughtError });
```

### Log context

`addContext` merges fields into every later log line. `correlationId` returns the
bound correlation id when one is set.

```ts
logger.addContext({ correlationId: "abc-123" });
logger.info("Message received"); // includes correlationId
logger.correlationId; // 'abc-123'
logger.clearContext();
```

### Initial context

```ts
const logger = new Logger({ initialContext: { correlationId: "abc-123" } });
```

### Redaction (opt in)

No paths are redacted unless the caller supplies them. Pass the paths the
bounded context needs; the format is [pino redaction paths](https://getpino.io/#/docs/redaction).

```ts
const logger = new Logger({
  redactPaths: ["req.headers.authorization", "*.password"],
});
```

## Options

| Option           | Type         | Default | Purpose                            |
| ---------------- | ------------ | ------- | ---------------------------------- |
| `initialContext` | `LogContext` | `{}`    | Context bound at construction.     |
| `redactPaths`    | `string[]`   | `[]`    | Paths to redact. Empty means none. |

## Log level

The level is read from `process.env.LOG_LEVEL` (default `info`).
