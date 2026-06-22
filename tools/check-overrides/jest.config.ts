import type { Config } from "jest";

const jestConfig: Config = {
  preset: "ts-jest",
  clearMocks: true,
  silent: true,
  collectCoverage: true,
  coverageDirectory: "./.reports/unit/coverage",
  coverageProvider: "v8",
  coveragePathIgnorePatterns: ["/__tests__/", "/node_modules/"],
  transform: { "^.+\\.ts$": "ts-jest" },
  testPathIgnorePatterns: [".build"],
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  testEnvironment: "node",
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

export default jestConfig;
