import { Readable } from 'node:stream';
import {
  getS3Object,
  getS3ObjectBufferFromUri,
  getS3ObjectFromUri,
  getS3ObjectMetadata,
  s3Client,
} from '../../s3-utils';

describe('getS3Object', () => {
  afterEach(jest.resetAllMocks);

  it('Should throw an error if invalid key', async () => {
    s3Client.send = jest.fn().mockImplementationOnce(() => {
      throw new Error('No file found');
    });

    await expect(
      getS3Object({
        Bucket: 'bucket-name',
        Key: 'config.test.json',
      }),
    ).rejects.toThrow(
      "Could not retrieve from bucket 's3://bucket-name/config.test.json' from S3: Could not retrieve from bucket 's3://bucket-name/config.test.json' from S3: No file found",
    );
  });

  it('Should return config', async () => {
    const result = JSON.stringify({
      featureFlags: {
        testFlag: true,
      },
    });

    s3Client.send = jest
      .fn()
      .mockReturnValueOnce({ Body: Readable.from([result]) });

    const s3Location = {
      Bucket: 'bucket-name',
      Key: 'config.test.json',
    };

    const data = await getS3Object(s3Location);

    expect(s3Client.send).toHaveBeenCalledWith(
      expect.objectContaining({ input: s3Location }),
    );
    expect(data).toEqual(result);
  });

  it('Should return config by S3 version', async () => {
    const result = JSON.stringify({
      featureFlags: {
        testFlag: true,
      },
    });

    s3Client.send = jest
      .fn()
      .mockReturnValueOnce({ Body: Readable.from([result]) });

    const s3Location = {
      Bucket: 'bucket-name',
      Key: 'config.test.json',
      VersionId: 'versionId',
    };

    const data = await getS3Object(s3Location);

    expect(s3Client.send).toHaveBeenCalledWith(
      expect.objectContaining({ input: s3Location }),
    );
    expect(data).toEqual(result);
  });

  it('Should return default when object does not exist', async () => {
    const defaultValue = 'the default value';

    s3Client.send = jest.fn().mockImplementationOnce(() => {
      throw new Error('not found');
    });

    const data = await getS3Object(
      {
        Bucket: 'bucket-name',
        Key: 'config.test.json',
      },
      defaultValue,
    );

    expect(data).toEqual(defaultValue);
  });
});

describe('getS3ObjectFromUri', () => {
  afterEach(jest.resetAllMocks);

  it('Should throw an error for invalid S3 URI format', async () => {
    await expect(getS3ObjectFromUri('invalid-uri')).rejects.toThrow(
      'Invalid S3 URI format: invalid-uri',
    );
  });

  it('Should throw an error for S3 URI without bucket', async () => {
    await expect(getS3ObjectFromUri('s3://')).rejects.toThrow(
      'Invalid S3 URI format: s3://',
    );
  });

  it('Should throw an error for S3 URI without key', async () => {
    await expect(getS3ObjectFromUri('s3://bucket-name/')).rejects.toThrow(
      'Invalid S3 URI format: s3://bucket-name/',
    );
  });

  it('Should parse valid S3 URI and retrieve object', async () => {
    const result = JSON.stringify({
      featureFlags: {
        testFlag: true,
      },
    });

    s3Client.send = jest
      .fn()
      .mockReturnValueOnce({ Body: Readable.from([result]) });

    const uri = 's3://bucket-name/config.test.json';
    const data = await getS3ObjectFromUri(uri);

    expect(s3Client.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          Bucket: 'bucket-name',
          Key: 'config.test.json',
          VersionId: undefined,
        },
      }),
    );
    expect(data).toEqual(result);
  });

  it('Should parse S3 URI with nested path', async () => {
    const result = 'test content';

    s3Client.send = jest
      .fn()
      .mockReturnValueOnce({ Body: Readable.from([result]) });

    const uri = 's3://bucket-name/path/to/nested/file.json';
    const data = await getS3ObjectFromUri(uri);

    expect(s3Client.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          Bucket: 'bucket-name',
          Key: 'path/to/nested/file.json',
          VersionId: undefined,
        },
      }),
    );
    expect(data).toEqual(result);
  });

  it('Should throw an error if object not found', async () => {
    s3Client.send = jest.fn().mockImplementationOnce(() => {
      throw new Error('No file found');
    });

    await expect(
      getS3ObjectFromUri('s3://bucket-name/config.test.json'),
    ).rejects.toThrow(
      "Could not retrieve from bucket 's3://bucket-name/config.test.json' from S3",
    );
  });
});

describe('getS3ObjectBufferFromUri', () => {
  afterEach(jest.resetAllMocks);

  it('Should throw an error for invalid S3 URI format', async () => {
    await expect(getS3ObjectBufferFromUri('invalid-uri')).rejects.toThrow(
      'Invalid S3 URI format: invalid-uri',
    );
  });

  it('Should throw an error for S3 URI without bucket', async () => {
    await expect(getS3ObjectBufferFromUri('s3://')).rejects.toThrow(
      'Invalid S3 URI format: s3://',
    );
  });

  it('Should throw an error for S3 URI without key', async () => {
    await expect(getS3ObjectBufferFromUri('s3://bucket-name/')).rejects.toThrow(
      'Invalid S3 URI format: s3://bucket-name/',
    );
  });

  it('Should parse valid S3 URI and retrieve object', async () => {
    const result = JSON.stringify({
      featureFlags: {
        testFlag: true,
      },
    });

    s3Client.send = jest
      .fn()
      .mockReturnValueOnce({ Body: Readable.from([result]) });

    const uri = 's3://bucket-name/config.test.json';
    const data = await getS3ObjectBufferFromUri(uri);

    expect(s3Client.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          Bucket: 'bucket-name',
          Key: 'config.test.json',
          VersionId: undefined,
        },
      }),
    );

    const expectedBuffer = Buffer.from(result);
    expect(data).toEqual(expectedBuffer);
  });

  it('Should parse S3 URI with nested path', async () => {
    const result = 'test content';

    s3Client.send = jest
      .fn()
      .mockReturnValueOnce({ Body: Readable.from([result]) });

    const uri = 's3://bucket-name/path/to/nested/file.json';
    const data = await getS3ObjectBufferFromUri(uri);

    expect(s3Client.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          Bucket: 'bucket-name',
          Key: 'path/to/nested/file.json',
          VersionId: undefined,
        },
      }),
    );

    const expectedBuffer = Buffer.from(result);
    expect(data).toEqual(expectedBuffer);
  });

  it('Should throw an error if object not found', async () => {
    s3Client.send = jest.fn().mockImplementationOnce(() => {
      throw new Error('No file found');
    });

    await expect(
      getS3ObjectBufferFromUri('s3://bucket-name/config.test.json'),
    ).rejects.toThrow(
      "Could not retrieve from bucket 's3://bucket-name/config.test.json' from S3",
    );
  });
});

describe('getS3ObjectMetadata', () => {
  afterEach(jest.resetAllMocks);

  it('Should retrieve metadata for object', async () => {
    const metadata = {
      messagereference: 'test-ref-001',
      senderid: 'SENDER_001',
      createdat: '2026-01-19T12:00:00Z',
    };

    s3Client.send = jest.fn().mockReturnValueOnce({ Metadata: metadata });

    const s3Location = {
      Bucket: 'bucket-name',
      Key: 'test-file.pdf',
    };

    const result = await getS3ObjectMetadata(s3Location);

    expect(s3Client.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: s3Location,
      }),
    );
    expect(result).toEqual(metadata);
  });

  it('Should retrieve metadata with version ID', async () => {
    const metadata = {
      customkey: 'customvalue',
    };

    s3Client.send = jest.fn().mockReturnValueOnce({ Metadata: metadata });

    const s3Location = {
      Bucket: 'bucket-name',
      Key: 'versioned-file.json',
      VersionId: 'version-123',
    };

    const result = await getS3ObjectMetadata(s3Location);

    expect(s3Client.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: s3Location,
      }),
    );
    expect(result).toEqual(metadata);
  });

  it('Should throw an error if object not found', async () => {
    s3Client.send = jest.fn().mockImplementationOnce(() => {
      throw new Error('NoSuchKey');
    });

    await expect(
      getS3ObjectMetadata({
        Bucket: 'bucket-name',
        Key: 'nonexistent.pdf',
      }),
    ).rejects.toThrow(
      "Could not retrieve metadata from bucket 's3://bucket-name/nonexistent.pdf' from S3: NoSuchKey",
    );
  });

  it('Should handle error objects', async () => {
    const error = new Error('Access Denied');
    s3Client.send = jest.fn().mockImplementationOnce(() => {
      throw error;
    });

    await expect(
      getS3ObjectMetadata({
        Bucket: 'bucket-name',
        Key: 'forbidden.pdf',
      }),
    ).rejects.toThrow(
      "Could not retrieve metadata from bucket 's3://bucket-name/forbidden.pdf' from S3: Access Denied",
    );
  });
});
