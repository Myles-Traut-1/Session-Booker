module.exports = {
  transform: {
    '^.+\\.tsx?$': ['@swc/jest'],
  },
  testEnvironment: 'node',
  globalSetup: '<rootDir>/src/tests/test-utils/global-setup.ts',
  globalTeardown: '<rootDir>/src/tests/test-utils/global-teardown.ts',
};