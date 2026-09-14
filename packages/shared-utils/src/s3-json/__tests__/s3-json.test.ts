import { GetObjectCommand, NoSuchKey, type S3Client } from '@aws-sdk/client-s3';
import { getJsonObject } from '../s3-json';

jest.mock('@aws-sdk/client-s3', () => {
  class MockNoSuchKey extends Error {
    constructor() {
      super('missing');
      this.name = 'NoSuchKey';
    }
  }
  return {
    __esModule: true,
    GetObjectCommand: jest.fn((input) => ({ input })),
    NoSuchKey: MockNoSuchKey,
    S3Client: jest.fn(),
  };
});

function buildS3Client(send: jest.Mock): S3Client {
  return { send } as unknown as S3Client;
}

function bodyResolving(value: string | undefined) {
  return { Body: { transformToString: jest.fn().mockResolvedValue(value) } };
}

describe('getJsonObject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends a GetObjectCommand with the supplied bucket and key', async () => {
    const send = jest.fn().mockResolvedValue(bodyResolving('{"a":1}'));
    await getJsonObject(buildS3Client(send), { bucket: 'b', key: 'k.json' });
    expect(GetObjectCommand).toHaveBeenCalledWith({
      Bucket: 'b',
      Key: 'k.json',
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('returns the parsed value when no validator is supplied', async () => {
    const send = jest.fn().mockResolvedValue(bodyResolving('{"a":1}'));
    await expect(
      getJsonObject(buildS3Client(send), { bucket: 'b', key: 'k.json' }),
    ).resolves.toEqual({ a: 1 });
  });

  it('returns the validated value when a validator is supplied', async () => {
    const send = jest.fn().mockResolvedValue(bodyResolving('{"a":1}'));
    const validator = {
      parse: jest.fn((data) => ({ ...(data as object), b: 2 })),
    };
    await expect(
      getJsonObject(buildS3Client(send), {
        bucket: 'b',
        key: 'k.json',
        validator,
      }),
    ).resolves.toEqual({ a: 1, b: 2 });
    expect(validator.parse).toHaveBeenCalledWith({ a: 1 });
  });

  it('returns undefined when the object body is absent', async () => {
    const send = jest.fn().mockResolvedValue({ Body: undefined });
    await expect(
      getJsonObject(buildS3Client(send), { bucket: 'b', key: 'k.json' }),
    ).resolves.toBeUndefined();
  });

  it('returns undefined when the transformed body is undefined', async () => {
    const send = jest.fn().mockResolvedValue(bodyResolving(undefined));
    await expect(
      getJsonObject(buildS3Client(send), { bucket: 'b', key: 'k.json' }),
    ).resolves.toBeUndefined();
  });

  it('returns undefined when the key does not exist (NoSuchKey instance)', async () => {
    const send = jest
      .fn()
      .mockRejectedValue(new NoSuchKey({ $metadata: {}, message: 'missing' }));
    await expect(
      getJsonObject(buildS3Client(send), { bucket: 'b', key: 'k.json' }),
    ).resolves.toBeUndefined();
  });

  it('returns undefined for an Error whose name is NoSuchKey', async () => {
    const error = Object.assign(new Error('missing'), { name: 'NoSuchKey' });
    const send = jest.fn().mockRejectedValue(error);
    await expect(
      getJsonObject(buildS3Client(send), { bucket: 'b', key: 'k.json' }),
    ).resolves.toBeUndefined();
  });

  it('rethrows any other error', async () => {
    const send = jest.fn().mockRejectedValue(new Error('access denied'));
    await expect(
      getJsonObject(buildS3Client(send), { bucket: 'b', key: 'k.json' }),
    ).rejects.toThrow('access denied');
  });
});
