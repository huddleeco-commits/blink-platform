/**
 * Jest Configuration for Frontend Tests
 *
 * Optimized for React component testing with React Testing Library
 */

module.exports = {
  // Test environment with jsdom for browser APIs
  testEnvironment: 'jsdom',

  // Root directory
  rootDir: '../..',

  // Test file patterns
  testMatch: [
    '**/src/__tests__/**/*.test.js',
    '**/src/__tests__/**/*.test.jsx',
    '**/src/__tests__/**/*.spec.js',
    '**/src/__tests__/**/*.spec.jsx'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.cjs'],

  // Transform JSX files with babel
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  // Module name mapper for CSS and static assets
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__tests__/mocks/fileMock.cjs'
  },

  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/__tests__/**',
    '!src/main.jsx',
    '!**/node_modules/**'
  ],

  // Coverage thresholds (start conservative)
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30
    }
  },

  // Coverage output
  coverageDirectory: '<rootDir>/src/__tests__/coverage',

  // Verbose output
  verbose: true,

  // Timeout
  testTimeout: 10000,

  // Clear mocks
  clearMocks: true
};
