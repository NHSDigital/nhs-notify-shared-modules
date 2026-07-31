import { baseJestConfig } from '../../jest.config.base';

const config = baseJestConfig;

config.coveragePathIgnorePatterns = ['/__tests__/', 'cli.ts'];
config.coverageThreshold = {
  global: {
    branches: 100,
    functions: 100,
    lines: 90,
    statements: -10,
  },
};

export default config;
