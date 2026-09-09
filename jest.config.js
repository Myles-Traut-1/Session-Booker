// jest.config.js
module.exports = {
  transform: {
    '^.+\\.tsx?$': ['@swc/jest'],
    '^.+\\.m?js$': ['@swc/jest'],
  },
  testEnvironment: 'node',
  globalSetup: '<rootDir>/src/tests/test-utils/global-setup.ts',
  globalTeardown: '<rootDir>/src/tests/test-utils/global-teardown.ts',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: ['/node_modules/(?!config)/'],
};