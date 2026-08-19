import type { ApimAccessToken, Logger } from 'utils';
import type { AxiosInstance } from 'axios';
import * as qs from 'qs';

// * DOCS: https://digital.nhs.uk/developer/guides-and-documentation/security-and-authorisation/application-restricted-restful-apis-signed-jwt-authentication#step-5-get-an-access-token

type RawAccessToken = {
  access_token: string;
  expires_in: string; // seconds until token expiry
  token_type: string;
  issued_at: string; // unix timestamp (milliseconds) at which the token was issued (UNDOCUMENTED)
};

type Config = {
  apimAuthTokenUrl: string;
};

export class NHSAuthClient {
  constructor(
    private readonly _config: Config,
    private readonly _http: AxiosInstance,
    private readonly _logger: Logger,
  ) {}

  get tokenEndpoint(): string {
    return this._config.apimAuthTokenUrl;
  }

  async getAccessToken(jwt: string): Promise<ApimAccessToken> {
    const body = {
      grant_type: 'client_credentials',
      client_assertion_type:
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: jwt,
    };

    try {
      const result = await this._http.post<RawAccessToken>(
        this.tokenEndpoint,

        qs.stringify(body),
        {
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return {
        access_token: result.data.access_token,
        expires_at:
          Math.floor(Number.parseInt(result.data.issued_at, 10) / 1000) +
          Number.parseInt(result.data.expires_in, 10),
        token_type: result.data.token_type,
      };
    } catch (error: unknown) {
      this._logger.error({
        description: 'Error obtaining access token from NHS Auth Server.',
        err: error,
      });
      throw new Error('Unable to obtain access token from NHS Auth Server.');
    }
  }
}
