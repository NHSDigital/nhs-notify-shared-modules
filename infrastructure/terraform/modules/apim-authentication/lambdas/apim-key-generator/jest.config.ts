import { baseJestConfig } from '../../jest.config.base';

const config = baseJestConfig;

config.coveragePathIgnorePatterns = ['/__tests__/', 'lambda.ts', '/config.ts'];

export default config;
