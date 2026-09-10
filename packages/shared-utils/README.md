# @nhsdigital/nhs-notify-shared-utils

This package contains **generic** technical helpers (logging, Lambda
helpers) for use across bounded contexts. Test-only helpers (AWS client
factories, polling, event-factory fixtures) are intentionally not included —
they are boilerplate enough to copy into each repo's integration tests rather
than maintain as a shared dependency.

## Exports

| Subpath           | Purpose                                                            | Docs                                       |
| ------------------ | ------------------------------------------------------------------ | ------------------------------------------- |
| `./logger`         | Generic pino-backed `Logger` with redaction support                 | [logger](src/logger/README.md)             |
| `./lambda-utils`   | `parseEnv`, `EnvValidationError`, `formatZodIssues`, SQS attribute readers | [lambda-utils](src/lambda-utils/README.md) |
| `./s3-json`        | S3 get-JSON-and-validate helper                                     | [s3-json](src/s3-json/README.md)           |

## Scripts

```sh
pnpm run build       # rm -rf dist && tsc
pnpm run lint        # eslint .
pnpm run typecheck   # tsc --noEmit
pnpm run test:unit   # jest (100% coverage)
pnpm run verify      # lint && typecheck && test:unit
```

## Release

Publishing is tag-driven: pushing a tag of the form `shared-utils-vX.Y.Z`
triggers the publish workflow. Tags are created automatically by the
"Tag shared-utils release" workflow once CI/CD completes successfully on
`main`, from whatever `version` is set in `package.json` — so bumping the
version in a merged PR is the only manual step required to release.
