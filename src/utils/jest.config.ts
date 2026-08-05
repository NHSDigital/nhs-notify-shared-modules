import { baseJestConfig } from '../../jest.config.base';

const utilsJestConfig = {
  ...baseJestConfig,

  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: -10,
    },
  },

  coveragePathIgnorePatterns: [
    ...(baseJestConfig.coveragePathIgnorePatterns ?? []),
    'index.ts',
  ],
};

export default utilsJestConfig;
