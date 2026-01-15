/**
 * Jest Configuration - Frontend Tests
 *
 * Run with: npm run test:frontend
 */

module.exports = {
  // Use jsdom environment for React tests
  testEnvironment: 'jsdom',

  // Test file patterns
  testMatch: [
    '**/src/**/__tests__/**/*.test.js',
    '**/src/**/__tests__/**/*.test.jsx',
    '**/__tests__/frontend/**/*.test.js',
    '**/__tests__/frontend/**/*.test.jsx',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],

  // Transform JSX files
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'json'],

  // Setup files
  setupFilesAfterEnv: [
    '@testing-library/jest-dom',
    './__tests__/frontend/setup.js',
  ],

  // Module name mapper for imports
  moduleNameMapper: {
    // Handle CSS imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__tests__/mocks/fileMock.js',
    // Handle path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/main.jsx',
    '!**/node_modules/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 40,
      statements: 40,
    },
  },

  // Coverage output
  coverageDirectory: 'coverage/frontend',
  coverageReporters: ['text', 'lcov', 'html'],

  // Timeout for async tests
  testTimeout: 15000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(lucide-react|recharts)/)',
  ],
};
