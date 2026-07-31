import { loadConfig } from 'infra/config';

jest.mock('utils', () => ({
  defaultConfigReader: {
    getValue: jest.fn(),
    getInt: jest.fn(),
  },
}));

describe('config', () => {
  it('should load config', () => {
    const config = loadConfig();
    expect(config).toBeDefined();
  });
});
