import { logger } from '../logger';
import { putDataS3 } from '../s3-utils';
import { KeyStore } from './jwk-key-store';
import { KeyStoreJson } from './types';

type UploadPublicKeystoreToS3Params = {
  keystore: KeyStore;
  staticAssetBucket: string;
  jwksFileName: string;
};

export const uploadPublicKeystoreToS3 = async ({
  jwksFileName,
  keystore,
  staticAssetBucket,
}: UploadPublicKeystoreToS3Params) => {
  // upload public keys as JWKS to S3
  const keys = [];

  // we do this because it's hard to convince node-jose to return these values directly
  //
  // as far as I can tell node-jose doesn't take alg or sig into account in terms of
  // generating any different output, so this is only a question or relabelling
  //
  // node-jose may not be the ideal library for what we want to do here
  for (const inputJwk of keystore.all()) {
    keys.push({ use: 'sig', alg: 'RS512', ...inputJwk.toJSON() });
  }
  const keystoreJson = { keys } as KeyStoreJson;
  const Bucket = staticAssetBucket;
  const Key = jwksFileName;

  logger.info({ description: `Uploading JWKS to ${Bucket}/${Key}` });
  await putDataS3(keystoreJson, {
    Bucket,
    Key,
  });

  logger.info({ description: 'Keygen: public keystore updated' });
};
