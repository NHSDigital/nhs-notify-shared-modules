import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import {
  DeleteParameterCommand,
  GetParameterCommand,
  GetParametersByPathCommand,
  ParameterNotFound,
  ParameterType,
  PutParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';

import { ParameterStore } from '../../ssm-utils';

const ssmClientMock = mockClient(SSMClient);

const parameterStore = new ParameterStore();

beforeEach(() => {
  ssmClientMock.reset();
});

describe('deleteParameter', () => {
  test('deletes SSM parameter', async () => {
    await parameterStore.deleteParameter('ssm-param');

    expect(ssmClientMock).toHaveReceivedCommandWith(DeleteParameterCommand, {
      Name: 'ssm-param',
    });
  });

  test('does not throw ParameterNotFound exception', async () => {
    const e = new ParameterNotFound({ $metadata: {}, message: 'oops' });
    ssmClientMock.on(DeleteParameterCommand).rejects(e);

    await expect(
      parameterStore.deleteParameter('ssm-param'),
    ).resolves.toBeUndefined();
  });

  test('raises other exceptions', async () => {
    const e = new Error('oops');
    ssmClientMock.on(DeleteParameterCommand).rejects(e);

    await expect(() =>
      parameterStore.deleteParameter('ssm-param'),
    ).rejects.toBe(e);
  });
});

describe('addParameter', () => {
  beforeEach(() => {
    ssmClientMock.on(PutParameterCommand).resolves({ Version: 1 });
  });

  test('adds SSM parameter with defaults', async () => {
    await parameterStore.addParameter('ssm-param', '12');

    expect(ssmClientMock).toHaveReceivedCommandWith(PutParameterCommand, {
      Name: 'ssm-param',
      Value: '12',
      Type: 'SecureString',
      Overwrite: true,
    });
  });

  test('adds SSM parameter with given override and type', async () => {
    await parameterStore.addParameter(
      'ssm-param',
      '12',
      ParameterType.STRING,
      false,
    );

    expect(ssmClientMock).toHaveReceivedCommandWith(PutParameterCommand, {
      Name: 'ssm-param',
      Value: '12',
      Type: 'String',
      Overwrite: false,
    });
  });

  test('returns the created parameter', async () => {
    const parameter = await parameterStore.addParameter('ssm-param', '12');

    expect(parameter).toEqual({
      Name: 'ssm-param',
      Value: '12',
      Version: 1,
    });
  });
});

describe('getAllParameters', () => {
  test('gets SSM parameters by path', async () => {
    const mockParameters = [
      {
        Name: 'ssm-param-1',
        Value: '13',
        Version: 1,
      },
      {
        Name: 'ssm-param-2',
        Value: '14',
        Version: 22,
      },
    ];

    ssmClientMock.on(GetParametersByPathCommand).resolvesOnce({
      Parameters: mockParameters,
    });

    const params = await parameterStore.getAllParameters('ssm-path');

    expect(ssmClientMock).toHaveReceivedCommandWith(
      GetParametersByPathCommand,
      {
        Path: 'ssm-path',
      },
    );

    expect(params).toEqual(mockParameters);
  });

  test('throws an error if failure to read from SSM path)', async () => {
    ssmClientMock
      .on(GetParametersByPathCommand)
      .rejectsOnce(new Error('It broke!'));

    await expect(parameterStore.getAllParameters('/some/path')).rejects.toThrow(
      'Failed to read SSM from path /some/path. ERR: Error: It broke!',
    );
  });
});

describe('getParameter', () => {
  test('gets an SSM parameter', async () => {
    const parameter = {
      Name: 'ssm-param',
      Value: '12',
      Version: 1,
    };

    ssmClientMock.on(GetParameterCommand).resolvesOnce({
      Parameter: parameter,
    });

    const result = await parameterStore.getParameter('ssm-param');

    expect(ssmClientMock).toHaveReceivedCommandWith(GetParameterCommand, {
      Name: 'ssm-param',
      WithDecryption: true,
    });

    expect(result).toEqual(parameter);
  });

  test('retries getting an SSM parameter on throttling exception', async () => {
    jest.useFakeTimers();

    const parameter = {
      Name: 'ssm-param',
      Value: '12',
      Version: 1,
    };

    const error = new Error('some error');
    error.name = 'ThrottlingException';

    ssmClientMock.on(GetParameterCommand).rejectsOnce(error).resolvesOnce({
      Parameter: parameter,
    });

    const promise = parameterStore.getParameter('ssm-param', {
      maxAttempts: 2,
    });

    expect(ssmClientMock).toHaveReceivedCommandTimes(GetParameterCommand, 1);
    expect(ssmClientMock).toHaveReceivedCommandWith(GetParameterCommand, {
      Name: 'ssm-param',
      WithDecryption: true,
    });

    await jest.advanceTimersByTimeAsync(3000);

    expect(ssmClientMock).toHaveReceivedCommandTimes(GetParameterCommand, 2);

    expect(await promise).toEqual(parameter);

    jest.useRealTimers();
  });

  test('fails getting an SSM parameter on other exception', async () => {
    const e = new Error('some error');
    ssmClientMock.on(GetParameterCommand).rejectsOnce(e);

    await expect(
      parameterStore.getParameter('ssm-param', { maxAttempts: 2 }),
    ).rejects.toThrow(e);

    expect(ssmClientMock).toHaveReceivedCommandWith(GetParameterCommand, {
      Name: 'ssm-param',
      WithDecryption: true,
    });
  });
});
