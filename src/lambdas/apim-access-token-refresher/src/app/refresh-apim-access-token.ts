import type { ApimAccessToken, Logger } from 'utils';

export interface IKeyStore {
  getPrivateKey(): Promise<{ key: string; kid: string }>;
  getAPIKey(): Promise<string>;
  putAccessToken(token: ApimAccessToken): Promise<void>;
}

interface ITokenGenerator {
  generate(
    header: { kid: string },
    payload: { iss: string; sub: string; aud: string },
    signingKey: string,
  ): string;
}

interface INHSAuthClient {
  tokenEndpoint: string;
  getAccessToken(jwt: string): Promise<ApimAccessToken>;
}

export type Dependencies = {
  keystore: IKeyStore;
  logger: Logger;
  nhsAuthClient: INHSAuthClient;
  tokenGenerator: ITokenGenerator;
};

export function createApplication({
  keystore,
  logger,
  nhsAuthClient,
  tokenGenerator,
}: Dependencies) {
  return async function refreshApimAccessToken() {
    logger.info({
      description: 'Fetching Private Key and API key from Keystore.',
    });

    const apiKey = await keystore.getAPIKey();
    const { key, kid } = await keystore.getPrivateKey();

    logger.info({
      description: 'Fetched Private Key and API key from Keystore.',
      kid,
    });

    logger.info({ description: 'Generating signed JWT.' });

    const jwt = tokenGenerator.generate(
      { kid },
      {
        iss: apiKey,
        sub: apiKey,
        aud: nhsAuthClient.tokenEndpoint,
      },
      key,
    );

    logger.info({ description: 'Generated signed JWT.' });

    logger.info({ description: 'Exchanging signed JWT for new Access Token.' });

    const accessToken = await nhsAuthClient.getAccessToken(jwt);

    logger.info({ description: 'Obtained new Access Token.' });

    logger.info({ description: 'Storing Access Token.' });

    await keystore.putAccessToken(accessToken);

    logger.info({ description: 'Access Token successfully stored.' });
  };
}
