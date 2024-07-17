import type { Config } from 'jest';

// Sync object
const config: Config = {
  displayName: 'orvium-ui',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$|screenfull/|@orvium/contracts))'],
  clearMocks: true,
  coverageDirectory: '../../coverage/apps/orvium-ui',
  coveragePathIgnorePatterns: ['<rootDir>/src/app/demo'],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 75,
      functions: 90,
      lines: 90,
    },
  },
  testEnvironment: '../../FixJSDOMEnvironment.ts',
};
export default config;
