import { CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { S3Location } from './get-object-s3';
import { s3Client } from './s3-client';

export async function copyAndDeleteObjectS3(
  source: S3Location,
  destination: S3Location,
): Promise<void> {
  try {
    const copyParams = {
      Bucket: destination.Bucket,
      CopySource: `/${source.Bucket}/${source.Key}`,
      Key: destination.Key,
    };

    await s3Client.send(new CopyObjectCommand(copyParams));

    await s3Client.send(new DeleteObjectCommand(source));
  } catch (error) {
    throw new Error(
      `Move of ${source.Bucket}/${source.Key} to ${destination.Bucket}/${destination.Key} failed, error: ${error}`,
    );
  }
}
