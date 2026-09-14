import { GetObjectCommand, NoSuchKey, type S3Client } from '@aws-sdk/client-s3';

/**
 * Structural validator shape. A Zod schema satisfies this, so callers can pass
 * `schema` directly without this package depending on Zod.
 */
export interface JsonValidator<T> {
  parse: (data: unknown) => T;
}

export interface GetJsonObjectParams<T> {
  bucket: string;
  key: string;
  validator?: JsonValidator<T>;
}

function isNoSuchKey(error: unknown): boolean {
  return (
    error instanceof NoSuchKey ||
    (error instanceof Error && error.name === 'NoSuchKey')
  );
}

/**
 * Fetches a JSON object from S3, returning `undefined` when the key does not
 * exist. When a validator is supplied the parsed value is validated (and typed)
 * through it; otherwise the raw parsed value is returned.
 */
export async function getJsonObject<T = unknown>(
  s3Client: S3Client,
  { bucket, key, validator }: GetJsonObjectParams<T>,
): Promise<T | undefined> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const body = await response.Body?.transformToString();
    if (body === undefined) {
      return undefined;
    }
    const parsed: unknown = JSON.parse(body);
    return validator ? validator.parse(parsed) : (parsed as T);
  } catch (error) {
    if (isNoSuchKey(error)) {
      return undefined;
    }
    throw error;
  }
}
