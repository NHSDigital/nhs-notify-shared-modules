import { defaultConfigReader } from 'utils';

export const loadConfig = (): Config => {
  const environment = defaultConfigReader.getValue('ENVIRONMENT');

  const s3Bucket = defaultConfigReader.tryGetValue('KEYSTORE_S3_BUCKET');

  return {
    environment,
    pemSSMPath: defaultConfigReader.getValue('SSM_PRIVATE_KEY_PARAMETER_NAME'),
    staticAssetBucket: s3Bucket === null ? 'unavailable' : s3Bucket,
    jwksFileName: 'auth/jwks.json',
  };
};

export type Config = {
  environment: string;
  pemSSMPath: string;
  staticAssetBucket: string;
  jwksFileName: string;
};
