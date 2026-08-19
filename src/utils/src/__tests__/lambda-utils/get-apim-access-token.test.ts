import { mockDeep } from 'jest-mock-extended';
import { IParameterStore } from 'ssm-utils';
import { logger } from 'logger';
import { createGetApimAccessToken } from 'lambda-utils';
import type { ApimAccessToken } from 'lambda-utils/types';

const NOW = new Date('2022-01-01').valueOf();

const tokenPath = '/ssm/path/token';

const validAccessToken: ApimAccessToken = {
  access_token: '123',
  expires_at: NOW / 1000 + 15,
  token_type: 'Bearer',
};

const expiringAccessToken: ApimAccessToken = {
  access_token: '123',
  expires_at: NOW / 1000 + 14,
  token_type: 'Bearer',
};

const expiredAccessToken: ApimAccessToken = {
  access_token: '123',
  expires_at: NOW / 1000 - 1,
  token_type: 'Bearer',
};

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterAll(() => {
  jest.useRealTimers();
});

function setup() {
  const log = logger;
  const parameterStore = mockDeep<IParameterStore>();

  const mocks = {
    log,
    parameterStore,
  };

  const getApimAccessToken = createGetApimAccessToken(
    tokenPath,
    log,
    parameterStore,
  );

  return { getApimAccessToken, mocks };
}

describe('createGetApimAccessToken', () => {
  test('access token does not need refreshing', async () => {
    const { getApimAccessToken, mocks } = setup();

    mocks.parameterStore.getParameter.mockResolvedValueOnce({
      Value: JSON.stringify(validAccessToken),
      Version: 1,
    });

    const accessToken = await getApimAccessToken();

    expect(mocks.parameterStore.getParameter).toHaveBeenCalledTimes(1);
    expect(mocks.parameterStore.getParameter).toHaveBeenCalledWith(tokenPath);

    expect(accessToken).toEqual(validAccessToken.access_token);
  });

  test('access token needs refreshing', async () => {
    const { getApimAccessToken, mocks } = setup();

    mocks.parameterStore.getParameter
      .mockResolvedValueOnce({
        Value: JSON.stringify(expiringAccessToken),
        Version: 1,
      })
      .mockResolvedValueOnce({
        Value: JSON.stringify(validAccessToken),
        Version: 2,
      });

    const accessToken = await getApimAccessToken();

    expect(mocks.parameterStore.getParameter).toHaveBeenCalledTimes(2);
    expect(mocks.parameterStore.getParameter).toHaveBeenNthCalledWith(
      1,
      tokenPath,
    );
    expect(mocks.parameterStore.getParameter).toHaveBeenNthCalledWith(
      2,
      tokenPath,
    );
    expect(mocks.parameterStore.clearCachedParameter).toHaveBeenCalledTimes(1);
    expect(mocks.parameterStore.clearCachedParameter).toHaveBeenCalledWith(
      tokenPath,
      1,
    );

    expect(accessToken).toEqual(validAccessToken.access_token);
  });

  test('access token is not the correct format', async () => {
    const { getApimAccessToken, mocks } = setup();

    mocks.parameterStore.getParameter.mockResolvedValue({
      Value: JSON.stringify({ ...validAccessToken, expires_at: undefined }),
      Version: 1,
    });

    await expect(getApimAccessToken()).rejects.toThrow('Invalid token');
  });

  test('access token parameter is not found in SSM', async () => {
    const { getApimAccessToken, mocks } = setup();

    mocks.parameterStore.getParameter.mockResolvedValue({
      Value: undefined,
      Version: 1,
    });

    await expect(getApimAccessToken()).rejects.toThrow(
      `APIM access token parameter "/ssm/path/token" not found in SSM`,
    );
  });

  test('access token cannot be refreshed but is not expired', async () => {
    const { getApimAccessToken, mocks } = setup();

    mocks.parameterStore.getParameter.mockResolvedValue({
      Value: JSON.stringify(expiringAccessToken),
      Version: 1,
    });

    const accessToken = await getApimAccessToken();

    expect(mocks.parameterStore.getParameter).toHaveBeenCalledTimes(2);
    expect(mocks.parameterStore.getParameter).toHaveBeenNthCalledWith(
      1,
      tokenPath,
    );
    expect(mocks.parameterStore.getParameter).toHaveBeenNthCalledWith(
      2,
      tokenPath,
    );
    expect(mocks.parameterStore.clearCachedParameter).toHaveBeenCalledTimes(1);
    expect(mocks.parameterStore.clearCachedParameter).toHaveBeenCalledWith(
      tokenPath,
      1,
    );

    expect(accessToken).toEqual(expiringAccessToken.access_token);
  });

  test('access token cannot be refreshed and is expired', async () => {
    const { getApimAccessToken, mocks } = setup();

    mocks.parameterStore.getParameter.mockResolvedValue({
      Value: JSON.stringify(expiredAccessToken),
      Version: 1,
    });

    await expect(getApimAccessToken()).rejects.toThrow(
      'Failed to update token',
    );

    expect(mocks.parameterStore.getParameter).toHaveBeenCalledTimes(2);
    expect(mocks.parameterStore.getParameter).toHaveBeenNthCalledWith(
      1,
      tokenPath,
    );
    expect(mocks.parameterStore.getParameter).toHaveBeenNthCalledWith(
      2,
      tokenPath,
    );
    expect(mocks.parameterStore.clearCachedParameter).toHaveBeenCalledTimes(1);
    expect(mocks.parameterStore.clearCachedParameter).toHaveBeenCalledWith(
      tokenPath,
      1,
    );
  });
});
