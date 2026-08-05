import { PutObjectCommand, PutObjectCommandOutput } from '@aws-sdk/client-s3';
import type { S3Location } from './get-object-s3';
import { s3Client } from './s3-client';

export async function putDataS3(
  fileData: Record<string, unknown>,
  { Bucket, Key }: S3Location,
  Metadata: Record<string, string> = {},
): Promise<PutObjectCommandOutput> {
  try {
    const params = {
      Bucket,
      Key,
      Body: JSON.stringify(fileData, null, 2),
      Metadata,
    };

    const data = await s3Client.send(new PutObjectCommand(params));

    return data;
  } catch (error) {
    throw new Error(`Upload to ${Bucket}/${Key} failed, error: ${error}`);
  }
}
