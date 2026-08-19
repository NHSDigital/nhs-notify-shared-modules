import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { putDataS3 } from '../../s3-utils';

describe('putDataS3', () => {
  it('puts data in S3', async () => {
    const s3Client = mockClient(S3Client);
    await putDataS3(
      {
        value1: '1a',
        value2: '2a',
      },
      {
        Bucket: 'bucket-name',
        Key: 'bucket-key',
      },
    );

    expect(s3Client).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: 'bucket-name',
      Key: 'bucket-key',
      Body: '{\n  "value1": "1a",\n  "value2": "2a"\n}',
    });
  });

  it('throws an error when there is an issue puts data in S3', async () => {
    const s3Client = mockClient(S3Client);
    s3Client.rejectsOnce(new Error('It broke!'));

    await expect(
      putDataS3(
        {
          value1: '1a',
          value2: '2a',
        },
        {
          Bucket: 'bucket-name',
          Key: 'bucket-key',
        },
      ),
    ).rejects.toThrow(
      'Upload to bucket-name/bucket-key failed, error: Error: It broke!',
    );
  });
});
