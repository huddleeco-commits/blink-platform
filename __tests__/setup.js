/**
 * Jest Setup - Backend Tests
 *
 * Runs before each test file to set up the test environment.
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Disable Sentry in tests
process.env.SENTRY_DEBUG = 'false';

// Set test passwords
process.env.BLINK_ADMIN_PASSWORD = 'test-admin-password';
process.env.BLINK_DEV_PASSWORD = 'test-dev-password';

// Disable database in tests by default
// Tests that need DB should set this explicitly
delete process.env.DATABASE_URL;

// Increase timeout for slow operations
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to generate random string
  randomString: (length = 8) => {
    return Math.random().toString(36).substring(2, 2 + length);
  },
};

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
});

// Log test start
beforeAll(() => {
  console.log('\n========================================');
  console.log('Starting test suite...');
  console.log('========================================\n');
});

// Log test end
afterAll(() => {
  console.log('\n========================================');
  console.log('Test suite complete.');
  console.log('========================================\n');
});
