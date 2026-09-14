import type { Config } from 'jest';
import { baseJestConfig } from '../../jest.config.base';

const sharedUtilsJestConfig: Config = {
  ...baseJestConfig,

  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },

  coveragePathIgnorePatterns: [
    ...(baseJestConfig.coveragePathIgnorePatterns ?? []),
    'index.ts',
  ],
};

export default sharedUtilsJestConfig;
