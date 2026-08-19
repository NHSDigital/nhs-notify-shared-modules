import {
  ValidateKeyResult,
  asKey,
  validatePrivateKey,
} from '../../key-generation-utils';

const testPrivateKey =
  '-----BEGIN EC PRIVATE KEY-----\n' + // gitleaks:allow This is a false positive, the string is not a secret and is used for testing purposes only.
  'MHcCAQEEIEpVnqrylY4xEsQdQgJhGFUFKGTGtl5cnKsIq2uNWa56oAoGCCqGSM49\n' +
  'AwEHoUQDQgAEqoc8zybajz/NEoUzP5G7lchuuD7dej7vKlWConh1mvI9gvmyRheT\n' +
  '0vrkuPszvyLXTYusKKgiLZkqz3SHOjVhDw==\n' +
  '-----END EC PRIVATE KEY-----\n';

const testKid = 'test-key-id';

describe('validatePrivateKey', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('rejects empty parameter name', async () => {
    const testOutput = await validatePrivateKey({
      Name: '',
      Value: testPrivateKey,
      minIssueDate: new Date('2020-11-15'),
      now: new Date('2020-12-05'),
    });

    const expectedOutput: ValidateKeyResult = {
      valid: false,
      deleteReason:
        'Does not match the name format privatekey_<date>_<kid>.pem',
      warn: true,
    };

    expect(testOutput).toEqual(expectedOutput);
  });

  it('rejects invalid parameter name', async () => {
    const testOutput = await validatePrivateKey({
      Name: 'bad-param-name',
      Value: testPrivateKey,
      minIssueDate: new Date('2020-11-15'),
      now: new Date('2020-12-05'),
    });

    const expectedOutput: ValidateKeyResult = {
      valid: false,
      deleteReason:
        'Does not match the name format privatekey_<date>_<kid>.pem',
      warn: true,
    };

    expect(testOutput).toEqual(expectedOutput);
  });

  it('rejects invalid parameter date', async () => {
    const testOutput = await validatePrivateKey({
      Name: 'privatekey_99999999_123.pem',
      Value: testPrivateKey,
      minIssueDate: new Date('2020-11-15'),
      now: new Date('2020-12-05'),
    });

    const expectedOutput: ValidateKeyResult = {
      valid: false,
      deleteReason: "'99999999' is not a valid yyyyMMdd date",
      warn: true,
    };

    expect(testOutput).toEqual(expectedOutput);
  });

  it('rejects expired key', async () => {
    const testOutput = await validatePrivateKey({
      Name: 'privatekey_20201104_123.pem',
      Value: testPrivateKey,
      minIssueDate: new Date('2020-11-15'),
      now: new Date('2020-12-05'),
    });

    const expectedOutput: ValidateKeyResult = {
      valid: false,
      deleteReason: 'Key expired, keyDateString: 20201104',
    };

    expect(testOutput).toEqual(expectedOutput);
  });

  it('rejects invalid key', async () => {
    const testOutput = await validatePrivateKey({
      Name: 'privatekey_20201120_123.pem',
      Value: 'invalid-pem',
      minIssueDate: new Date('2020-11-15'),
      now: new Date('2020-12-05'),
    });

    const expectedOutput: ValidateKeyResult = {
      valid: false,
      deleteReason:
        'Could not parse pem value, Error: Invalid PEM formatted message.',
      warn: true,
    };

    expect(testOutput).toEqual(expectedOutput);
  });

  it('accepts valid key', async () => {
    const testPrivateKeyJwk = await asKey(testKid, testPrivateKey);

    const testOutput = await validatePrivateKey({
      Name: `privatekey_20201120_${testKid}.pem`,
      Value: testPrivateKey,
      minIssueDate: new Date('2020-11-15'),
      now: new Date('2020-12-05'),
    });

    const expectedOutput: ValidateKeyResult = {
      valid: true,
      keyDate: new Date('2020-11-20'),
      keyJwk: testPrivateKeyJwk,
    };

    expect(testOutput).toEqual(expectedOutput);
  });
});
