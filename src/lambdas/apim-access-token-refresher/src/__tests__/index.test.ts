import * as indexModule from 'index';

jest.mock('infra/container', () => ({
  createContainer: jest.fn(() => ({})),
}));

jest.mock('app/refresh-apim-access-token', () => ({
  createApplication: jest.fn(() => jest.fn(() => ({}))),
}));

describe('index', () => {
  it('should export handler', async () => {
    expect(indexModule.handler).toBeDefined();
    await expect(indexModule.handler()).resolves.not.toThrow();
  });
});
