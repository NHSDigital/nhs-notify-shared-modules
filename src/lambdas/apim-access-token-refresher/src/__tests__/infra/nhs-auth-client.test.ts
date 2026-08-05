import { logger } from 'utils';
import type { AxiosInstance } from 'axios';
import { mockDeep } from 'jest-mock-extended';
import { NHSAuthClient } from 'infra/nhs-auth-client';

function setup() {
  const axios = mockDeep<AxiosInstance>();

  axios.post.mockResolvedValue({
    data: {
      access_token: 'fake_token',
      expires_in: '600',
      token_type: 'fake_token_type',
      issued_at: '1674777500000',
    },
  });
  const config = {
    apimAuthTokenUrl: 'fake_token_url',
  };

  const mocks = { axios, config };

  const client = new NHSAuthClient(config, axios, logger);

  return { client, mocks };
}

describe('NHSAuthClient', () => {
  describe('getAccessToken', () => {
    it('makes a post request to the token endpoint', async () => {
      const { client, mocks } = setup();

      await client.getAccessToken('fake_jwt');

      expect(mocks.axios.post.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "fake_token_url",
            "grant_type=client_credentials&client_assertion_type=urn%3Aietf%3Aparams%3Aoauth%3Aclient-assertion-type%3Ajwt-bearer&client_assertion=fake_jwt",
            {
              "headers": {
                "content-type": "application/x-www-form-urlencoded",
              },
            },
          ],
        ]
      `);
    });

    it('returns a formatted token with an expiry timestamp calculated from the issued_at and expires_in values', async () => {
      const { client } = setup();

      const result = await client.getAccessToken('fake_jwt');

      expect(result).toMatchInlineSnapshot(`
        {
          "access_token": "fake_token",
          "expires_at": 1674778100,
          "token_type": "fake_token_type",
        }
      `);
    });

    it('throws an error if there is an issue requesting the token from the auth server', async () => {
      expect.hasAssertions();

      const { client, mocks } = setup();

      mocks.axios.post.mockRejectedValueOnce(new Error('AxiosError'));

      let caught: unknown;
      try {
        await client.getAccessToken('fake_jwt');
      } catch (error) {
        caught = error;
      }
      expect(caught).toMatchInlineSnapshot(
        `[Error: Unable to obtain access token from NHS Auth Server.]`,
      );
    });
  });
});
