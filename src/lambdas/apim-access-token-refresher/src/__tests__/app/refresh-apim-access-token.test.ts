import { mockDeep } from 'jest-mock-extended';
import { Dependencies, createApplication } from 'app/refresh-apim-access-token';

function setup() {
  const mocks = mockDeep<Dependencies>({
    nhsAuthClient: {
      tokenEndpoint: 'fake_nhs_auth_token_endpoint',
      getAccessToken: jest.fn(async () => ({
        access_token: 'fake_access_token',
        expires_at: 1_674_778_100,
        token_type: 'fake_token_type',
      })),
    },
    keystore: {
      getPrivateKey: jest.fn(async () => ({
        kid: 'fake_kid',
        key: 'fake_private_key',
      })),
      getAPIKey: jest.fn().mockResolvedValue('fake_pds_api_key'),
    },
    tokenGenerator: {
      generate: jest.fn(() => 'fake_jwt'),
    },
  });

  const refreshApimAccessToken = createApplication(mocks);

  return {
    refreshApimAccessToken,
    mocks,
  };
}

describe('refreshApimAccessToken', () => {
  it('gets the private key and api key from the keystore', async () => {
    const { mocks, refreshApimAccessToken } = setup();

    await refreshApimAccessToken();

    expect(mocks.keystore.getPrivateKey).toHaveBeenCalled();
    expect(mocks.keystore.getAPIKey).toHaveBeenCalled();
  });

  it('generates a JWT with the correct claims using the private key', async () => {
    const { mocks, refreshApimAccessToken } = setup();

    await refreshApimAccessToken();

    expect(mocks.tokenGenerator.generate.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "kid": "fake_kid",
        },
        {
          "aud": "fake_nhs_auth_token_endpoint",
          "iss": "fake_pds_api_key",
          "sub": "fake_pds_api_key",
        },
        "fake_private_key",
      ]
    `);
  });

  it('exchanges the JWT for an access token from the nhs auth server', async () => {
    const { mocks, refreshApimAccessToken } = setup();

    await refreshApimAccessToken();

    expect(mocks.nhsAuthClient.getAccessToken.mock.lastCall)
      .toMatchInlineSnapshot(`
        [
          "fake_jwt",
        ]
      `);
  });

  it('persists the access token', async () => {
    const { mocks, refreshApimAccessToken } = setup();

    await refreshApimAccessToken();

    expect(mocks.keystore.putAccessToken.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "access_token": "fake_access_token",
          "expires_at": 1674778100,
          "token_type": "fake_token_type",
        },
      ]
    `);
  });
});
