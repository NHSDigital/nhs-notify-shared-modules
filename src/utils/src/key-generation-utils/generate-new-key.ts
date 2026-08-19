import { format } from 'date-fns';
import { logger } from '../logger';
import { parameterStore } from '../ssm-utils';
import { KeyStore } from './jwk-key-store';
import { KeyJson } from './types';

type GenerateNewKeyParams = {
  keystore: KeyStore;
  ssmPath: string;
  now: Date;
  keyGenerationOptions?: Record<string, string>;
};

export const generateNewKey = async ({
  keyGenerationOptions = {},
  keystore,
  now,
  ssmPath,
}: GenerateNewKeyParams) => {
  // generate new RSA Key
  logger.info({ description: 'Generating new key' });
  const key = await keystore.generate('RSA', 4096, keyGenerationOptions);
  const { kid } = key.toJSON() as KeyJson;
  const keyPem = key.toPEM();
  const Name = `${ssmPath}/privatekey_${format(now, 'yyyyMMdd')}_${kid}.pem`;

  await parameterStore.addParameter(Name, keyPem);
  logger.info({ description: `generated new private key ${Name}` });
};
