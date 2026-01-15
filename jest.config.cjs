/**
 * Jest Configuration - Backend Tests
 *
 * Run with: npm test
 */

module.exports = {
  // Use Node.js environment for backend tests
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.test.cjs',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/__tests__/frontend/',
  ],

  // Coverage collection
  collectCoverageFrom: [
    'server.cjs',
    'routes/**/*.cjs',
    'services/**/*.cjs',
    'lib/**/*.cjs',
    'config/**/*.cjs',
    'database/**/*.js',
    '!**/node_modules/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 50,
      statements: 50,
    },
  },

  // Coverage output
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Setup files
  setupFilesAfterEnv: ['./__tests__/setup.js'],

  // Timeout for async tests
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Module name mapper for aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
