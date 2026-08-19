import { logger } from '../../logger';
import {
  asKeyStore,
  uploadPublicKeystoreToS3,
} from '../../key-generation-utils';
import { putDataS3 } from '../../s3-utils';

jest.mock('s3-utils');

const mockKeystore = {
  keys: [
    {
      use: 'sig',
      alg: 'RS512',
      kty: 'RSA',
      kid: 'Okfvj_Bm5PTZRQrMObDxR4_ytgt-1UgHmnaIs0ELcWM',
      e: 'AQAB',
      n: '2xDHfn-vcGl6s2MvGrcY74v9hgQnKgmJyDlV310lRQCEEhtQcDCyXhwj1pNf05y03fLyoQnzUi7JBoZHgUfoFX-5IFQBdLjtalB6eIhXLAtXqQ75VrikP3xlHZE3sn_l75wz5M12QYSBZBzAN570NCbs0541XExoMMgZBzCF7wE',
    },
    {
      use: 'sig',
      alg: 'RS512',
      kty: 'RSA',
      kid: 'sS784n6mE_DAjgFRfqZXrO-G5y-2zlmM-DBeMXvDTjM',
      e: 'AQAB',
      n: 'sYQa7uSeKUo_Sw8f3_CLPTJ9DbgqyhnJSktrkO3Qq0Jtd8P5Qen8c-Q_-zcj6ufGWcFOzsAR5P99dRAfGU9fZ5u6twsD18jJz8ddKdPL9Rym80i4fdfYt6_amr1VaukgEUmdrFlHLEaXnlF8ofqOKOOHt-a8VMw6St-Deot-rf0',
    },
  ],
};

const setup = async () => {
  const mockPutDataS3 = jest.fn();
  (putDataS3 as jest.Mock).mockImplementation(mockPutDataS3);

  const keystore = await asKeyStore(mockKeystore);

  return { mockPutDataS3, keystore };
};

describe('generateNewKey', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(logger, 'info').mockImplementation(() => logger);
  });

  it('upload keystore on S3', async () => {
    const { keystore, mockPutDataS3 } = await setup();

    await uploadPublicKeystoreToS3({
      jwksFileName: 'jwks.json',
      keystore,
      staticAssetBucket: 'static-bucket-name',
    });

    expect(mockPutDataS3).toHaveBeenCalledWith(mockKeystore, {
      Bucket: 'static-bucket-name',
      Key: 'jwks.json',
    });
  });
});
