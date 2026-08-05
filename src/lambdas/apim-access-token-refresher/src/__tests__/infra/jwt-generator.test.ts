import { logger } from 'utils';
import { JWTGenerator } from 'infra/jwt-generator';

function setup() {
  const uuid = jest.fn(() => 'totally-random-string');
  const token = 'fake-jwt';
  const signer = jest.fn(() => token);

  const generator = new JWTGenerator(signer, uuid, logger);

  const mocks = { uuid, signer };
  const data = { token };

  return { generator, mocks, data };
}

describe('JWTGenerator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-27'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('generates a signed jwt with the correct parameters', () => {
    const { data, generator, mocks } = setup();

    const result = generator.generate(
      { kid: 'fake_kid' },
      { aud: 'fake_aud', iss: 'fake_iss', sub: 'fake_sub' },
      'fake_key',
    );

    expect(mocks.signer).toHaveBeenCalledTimes(1);
    expect(mocks.signer.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "aud": "fake_aud",
          "exp": 1674777900,
          "iss": "fake_iss",
          "jti": "totally-random-string",
          "sub": "fake_sub",
        },
        "fake_key",
        {
          "header": {
            "alg": "RS512",
            "kid": "fake_kid",
            "typ": "JWT",
          },
        },
      ]
    `);

    expect(result).toBe(data.token);
  });

  it('throws its own error if signing the token fails', () => {
    expect.hasAssertions();

    const { generator, mocks } = setup();

    mocks.signer.mockImplementationOnce(() => {
      throw new Error('signing error');
    });

    let caught: unknown;
    try {
      generator.generate(
        { kid: 'fake_kid' },
        { aud: 'fake_aud', iss: 'fake_iss', sub: 'fake_sub' },
        'fake_key',
      );
    } catch (error) {
      caught = error;
    }
    expect(caught).toMatchInlineSnapshot(
      `[Error: Unable to generate signed JWT.]`,
    );
  });
});
