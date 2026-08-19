import type { Logger } from '../logger';
import type { ApimAccessToken } from './types';
import { IParameterStore } from '../ssm-utils/types';

export const doesAccessTokenNeedRefresh = (
  token: ApimAccessToken,
  tokenRefreshThresholdSeconds: number,
): boolean =>
  Date.now() / 1000 + tokenRefreshThresholdSeconds > token.expires_at;

export function createGetApimAccessToken(
  accessTokenSSMPath: string,
  logger: Logger,
  parameterStore: IParameterStore,
) {
  async function getParsedToken(): Promise<[ApimAccessToken, number?]> {
    const parameter = await parameterStore.getParameter(accessTokenSSMPath);

    if (!parameter?.Value) {
      throw new Error(
        `APIM access token parameter "${accessTokenSSMPath}" not found in SSM`,
      );
    }

    return [JSON.parse(parameter.Value) as ApimAccessToken, parameter.Version];
  }

  return async function getApimAccessToken() {
    if (accessTokenSSMPath === '') {
      return '';
    }

    let [accessToken, version] = await getParsedToken();

    logger.debug(`Access token expires at: ${accessToken.expires_at}`);

    if (!accessToken || doesAccessTokenNeedRefresh(accessToken, 15)) {
      logger.debug('Access token requires refresh');

      await parameterStore.clearCachedParameter(accessTokenSSMPath, version);

      // eslint-disable-next-line sonarjs/no-dead-store
      [accessToken, version] = await getParsedToken();

      logger.debug(
        `Access token fetched. New access token expires at: ${accessToken.expires_at}`,
      );
    } else {
      logger.debug('Access token does not require fetch');
    }

    if (!accessToken?.access_token || !accessToken?.expires_at) {
      logger.error('Access token parameter has invalid format');
      throw new Error('Invalid token');
    }

    // if we have just tried to refresh the token and it is out of date, then we have failed to update the token - throw an error
    if (doesAccessTokenNeedRefresh(accessToken, 0)) {
      logger.error('Access token is out of date.');
      throw new Error('Failed to update token');
    }

    return accessToken.access_token;
  };
}
