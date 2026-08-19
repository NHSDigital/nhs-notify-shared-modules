import { SSMClient } from '@aws-sdk/client-ssm';
import { logger } from 'utils';
import { mockDeep } from 'jest-mock-extended';
import { Config, SSMKeyStore } from 'infra/ssm-keystore';

function setup() {
  const ssm = mockDeep<SSMClient>();
  const key = {
    key: 'fake_key',
    kid: 'fake_kid',
  };
  const getPrivateKey = jest.fn().mockResolvedValue(key);

  const config: Config = {
    apimAccessTokenSsmParameterName: 'fake_access_token_parameter_name',
    apimApiKeySsmParameterName: 'fake_api_key_parameter_name',
  };

  // @ts-ignore
  const keystore = new SSMKeyStore(ssm, config, logger, getPrivateKey);

  const mocks = { ssm, getPrivateKey };

  const data = { config, key };

  return { keystore, mocks, data };
}

describe('SSMKeyStore', () => {
  describe('getPrivateKey', () => {
    it('invokes the given getPrivateKey callback and returns the resulting key', async () => {
      const { data, keystore, mocks } = setup();

      const result = await keystore.getPrivateKey();

      expect(mocks.getPrivateKey).toHaveBeenCalled();

      expect(result).toBe(data.key);
    });

    it('throws its own error if the given getPrivateKey callback errors', async () => {
      expect.hasAssertions();

      const { keystore, mocks } = setup();

      mocks.getPrivateKey.mockRejectedValueOnce(
        new Error('GetPrivateKeyError'),
      );

      let caught: unknown;
      try {
        await keystore.getPrivateKey();
      } catch (error) {
        caught = error;
      }
      expect(caught).toMatchInlineSnapshot(
        `[Error: Error fetching private key.]`,
      );
    });
  });

  describe('putAccessToken', () => {
    it('puts the access token into SSM Parameter Store', async () => {
      const { keystore, mocks } = setup();

      await keystore.putAccessToken({
        access_token: 'fake_access_token',
        expires_at: 1_674_778_100,
        token_type: 'fake_token_type',
      });

      expect(mocks.ssm.send.mock.calls).toMatchInlineSnapshot(`
        [
          [
            PutParameterCommand {
              "deserialize": null,
              "input": {
                "Name": "fake_access_token_parameter_name",
                "Overwrite": true,
                "Value": "{"access_token":"fake_access_token","expires_at":1674778100,"token_type":"fake_token_type"}",
              },
              "middlewareStack": {
                "add": [Function],
                "addRelativeTo": [Function],
                "applyToStack": [Function],
                "clone": [Function],
                "concat": [Function],
                "identify": [Function],
                "identifyOnResolve": [Function],
                "remove": [Function],
                "removeByTag": [Function],
                "resolve": [Function],
                "use": [Function],
              },
              "schema": [
                9,
                "com.amazonaws.ssm",
                "PutParameter",
                0,
                [Function],
                [Function],
              ],
              "serialize": null,
            },
          ],
        ]
      `);
    });

    it('throws its own error if there is an error from SSM Parameter Store', async () => {
      expect.hasAssertions();

      const { keystore, mocks } = setup();

      mocks.ssm.send.mockImplementationOnce(() => {
        throw new Error('MockAWSError');
      });

      let caught: any;
      try {
        await keystore.putAccessToken({
          access_token: 'fake_access_token',
          expires_at: 1_674_778_100,
          token_type: 'fake_token_type',
        });
      } catch (error) {
        caught = error;
      }
      expect(caught).toMatchInlineSnapshot(
        `[Error: Unable to store Access Token in SSM Parameter Store.]`,
      );
    });
  });

  describe('getAPIKey', () => {
    it('requests the API key from SSM Parameter Store using the configured name and returns the parameter value', async () => {
      const { keystore, mocks } = setup();

      const expected = 'mock_api_key';

      // @ts-ignore
      mocks.ssm.send.mockResolvedValueOnce({
        Parameter: { Value: expected },
      });

      const result = await keystore.getAPIKey();

      expect(mocks.ssm.send.mock.calls).toMatchInlineSnapshot(`
        [
          [
            GetParameterCommand {
              "deserialize": null,
              "input": {
                "Name": "fake_api_key_parameter_name",
                "WithDecryption": true,
              },
              "middlewareStack": {
                "add": [Function],
                "addRelativeTo": [Function],
                "applyToStack": [Function],
                "clone": [Function],
                "concat": [Function],
                "identify": [Function],
                "identifyOnResolve": [Function],
                "remove": [Function],
                "removeByTag": [Function],
                "resolve": [Function],
                "use": [Function],
              },
              "schema": [
                9,
                "com.amazonaws.ssm",
                "GetParameter",
                0,
                [Function],
                [Function],
              ],
              "serialize": null,
            },
          ],
        ]
      `);
      expect(result).toEqual(expected);
    });

    it('errors if there is no parameter attribute returned from SSM Parameter Store', async () => {
      expect.hasAssertions();

      const { keystore, mocks } = setup();

      // @ts-ignore
      mocks.ssm.send.mockResolvedValueOnce({});

      let caught: any;
      try {
        await keystore.getAPIKey();
      } catch (error) {
        caught = error;
      }
      expect(caught).toMatchInlineSnapshot(
        `[Error: Unable to retrieve APIM API Key from SSM Parameter Store.]`,
      );
    });

    it('errors if there is no parameter value returned from SSM Parameter Store', async () => {
      expect.hasAssertions();

      const { keystore, mocks } = setup();

      // @ts-ignore
      mocks.ssm.send.mockResolvedValueOnce({
        Parameter: { Value: '' },
      });

      let caught: unknown;
      try {
        await keystore.getAPIKey();
      } catch (error) {
        caught = error;
      }
      expect(caught).toMatchInlineSnapshot(
        `[Error: Unable to retrieve APIM API Key from SSM Parameter Store.]`,
      );
    });
  });
});
