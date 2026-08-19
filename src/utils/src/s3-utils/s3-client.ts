import { S3Client, type S3ClientConfig } from '@aws-sdk/client-s3';
import { region } from '../locations';

export const s3Client = new S3Client({ region: region() });

export const createS3Client = (config: S3ClientConfig = {}) =>
  new S3Client({
    region: region(),
    ...config,
  });
