import { logger } from '../../logger';
import { parameterStore } from '../../ssm-utils';
import { KeyStore, generateNewKey } from '../../key-generation-utils';

jest.mock('ssm-utils', () => ({
  parameterStore: {
    addParameter: jest.fn(),
  },
}));

const mockAddParameter = jest.fn();
(parameterStore.addParameter as jest.Mock).mockImplementation(mockAddParameter);

describe('generateNewKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(logger, 'info').mockImplementation(() => logger);
  });

  it('generate key on SSM', async () => {
    const keystore = new KeyStore();

    await generateNewKey({
      keystore,
      ssmPath: 'ssm-path',
      now: new Date('2020-03-15'),
      keyGenerationOptions: {
        use: 'sig',
        kid: 'test-key-id',
      },
    });

    expect(mockAddParameter).toHaveBeenCalledWith(
      'ssm-path/privatekey_20200315_test-key-id.pem',
      expect.anything(),
    );
  });

  it('generate key without specifying kid', async () => {
    const keystore = new KeyStore();

    await generateNewKey({
      keystore,
      ssmPath: 'ssm-path',
      now: new Date('2020-03-15'),
    });

    expect(mockAddParameter).toHaveBeenCalled();
  });
});
