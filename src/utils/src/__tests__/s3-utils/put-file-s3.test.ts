import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { putFileS3 } from '../../s3-utils';

describe('putFileS3', () => {
  it('puts buffer in S3', async () => {
    const s3Client = mockClient(S3Client);
    const testBuffer = Buffer.from('test pdf content');

    await putFileS3(testBuffer, {
      Bucket: 'bucket-name',
      Key: 'file.pdf',
    });

    expect(s3Client).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: 'bucket-name',
      Key: 'file.pdf',
      Body: testBuffer,
      Metadata: {},
    });
  });

  it('puts buffer in S3 with ContentType', async () => {
    const s3Client = mockClient(S3Client);
    const testBuffer = Buffer.from('test pdf content');

    await putFileS3(
      testBuffer,
      {
        Bucket: 'bucket-name',
        Key: 'file.pdf',
      },
      {},
      'application/pdf',
    );

    expect(s3Client).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: 'bucket-name',
      Key: 'file.pdf',
      Body: testBuffer,
      Metadata: {},
      ContentType: 'application/pdf',
    });
  });

  it('puts buffer in S3 with metadata', async () => {
    const s3Client = mockClient(S3Client);
    const testBuffer = Buffer.from('test pdf content');

    await putFileS3(
      testBuffer,
      {
        Bucket: 'bucket-name',
        Key: 'file.pdf',
      },
      { 'x-custom-metadata': 'value' },
    );

    expect(s3Client).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: 'bucket-name',
      Key: 'file.pdf',
      Body: testBuffer,
      Metadata: { 'x-custom-metadata': 'value' },
    });
  });

  it('throws an error when there is an issue putting buffer in S3', async () => {
    const s3Client = mockClient(S3Client);
    s3Client.rejectsOnce(new Error('It broke!'));
    const testBuffer = Buffer.from('test pdf content');

    await expect(
      putFileS3(testBuffer, {
        Bucket: 'bucket-name',
        Key: 'file.pdf',
      }),
    ).rejects.toThrow(
      'Upload to bucket-name/file.pdf failed, error: Error: It broke!',
    );
  });
});
