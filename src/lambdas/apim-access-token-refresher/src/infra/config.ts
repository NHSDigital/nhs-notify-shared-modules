import { defaultConfigReader } from 'utils';

export function loadConfig() {
  return {
    apimAuthTokenUrl: defaultConfigReader.getValue('APIM_AUTH_TOKEN_URL'),
    apimAccessTokenSsmParameterName: defaultConfigReader.getValue(
      'APIM_ACCESS_TOKEN_SSM_PARAMETER_NAME',
    ),
    apimApiKeySsmParameterName: defaultConfigReader.getValue(
      'APIM_API_KEY_SSM_PARAMETER_NAME',
    ),
    apimPrivateKeySsmParameterName: defaultConfigReader.getValue(
      'APIM_PRIVATE_KEY_SSM_PARAMETER_NAME',
    ),
  };
}
