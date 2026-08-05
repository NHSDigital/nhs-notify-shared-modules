import { SSMClient } from '@aws-sdk/client-ssm';
import { logger, privateKeyFetcher } from 'utils';
import axios from 'axios';
import { randomUUID } from 'node:crypto';
import { sign } from 'jsonwebtoken';
import { SSMKeyStore } from 'infra/ssm-keystore';
import { NHSAuthClient } from 'infra/nhs-auth-client';
import { JWTGenerator } from 'infra/jwt-generator';
import { loadConfig } from 'infra/config';

export function createContainer() {
  const config = loadConfig();
  const { getPrivateKey } = privateKeyFetcher(
    config.apimPrivateKeySsmParameterName,
  );

  return {
    config,
    keystore: new SSMKeyStore(new SSMClient({}), config, logger, getPrivateKey),
    logger,
    nhsAuthClient: new NHSAuthClient(config, axios, logger),
    tokenGenerator: new JWTGenerator(sign, randomUUID, logger),
  };
}
