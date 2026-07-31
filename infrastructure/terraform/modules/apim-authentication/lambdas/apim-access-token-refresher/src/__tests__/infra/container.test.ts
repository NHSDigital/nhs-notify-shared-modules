import { createContainer } from 'infra/container';

jest.mock('infra/config', () => ({
  loadConfig: jest.fn(() => ({
    apimPrivateKeySsmParameterName: 'test-parameter-name',
  })),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => ({})),
}));

jest.mock('utils', () => ({
  privateKeyFetcher: jest.fn(() => ({ getPrivateKey: jest.fn() })),
  logger: {},
}));

describe('container', () => {
  it('should create container', () => {
    const container = createContainer();
    expect(container).toBeDefined();
  });
});
