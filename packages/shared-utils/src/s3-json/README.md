# `@nhsdigital/nhs-notify-shared-utils/s3-json`

Fetch a JSON object from S3, with optional validation. Missing keys resolve to
`undefined` instead of throwing.

## Import

```ts
import { getJsonObject } from "@nhsdigital/nhs-notify-shared-utils/s3-json";
import type {
  GetJsonObjectParams,
  JsonValidator,
} from "@nhsdigital/nhs-notify-shared-utils/s3-json";
```

`@aws-sdk/client-s3` is a peer dependency; the consumer installs it and passes a
client in.

## Usage

```ts
import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: "eu-west-2" });

const config = await getJsonObject(s3, {
  bucket: "my-bucket",
  key: "config.json",
});
// `config` is `unknown`, or `undefined` when the key does not exist.
```

### With validation

Pass any object with a `parse(data): T` method (e.g. a Zod schema). The resolved value is typed as `T`.

```ts
const config = await getJsonObject(s3, {
  bucket: "my-bucket",
  key: "config.json",
  validator: configSchema,
});
```

## Behaviour

- Returns `undefined` when the key does not exist (`NoSuchKey`, or an `Error`
  whose `name` is `NoSuchKey`).
- Returns `undefined` when the object has no body.
- Any other error is rethrown.
- With a validator, the parsed JSON is passed through `validator.parse`; a
  validation failure throws.
