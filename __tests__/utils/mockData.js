/**
 * Mock Data Utility
 *
 * Test fixtures and mock data for tests.
 */

// Valid test credentials
const validCredentials = {
  adminPassword: 'test-admin-password',
  devPassword: 'test-dev-password',
};

// Invalid credentials for negative tests
const invalidCredentials = {
  wrongPassword: 'wrong-password',
  emptyPassword: '',
  nullPassword: null,
};

// Sample project configurations
const sampleProjects = {
  minimal: {
    name: 'Test Restaurant',
    description: 'A test restaurant project',
    industry: 'restaurant',
    layout: 'hero-full-image',
  },
  fullConfig: {
    name: 'Test SaaS Platform',
    description: 'A comprehensive SaaS platform with all features',
    industry: 'saas',
    layout: 'hero-split',
    effects: ['parallax', 'fade-in'],
    features: ['auth', 'dashboard', 'analytics'],
  },
  ecommerce: {
    name: 'Test Online Store',
    description: 'An e-commerce store for testing',
    industry: 'ecommerce',
    layout: 'hero-carousel',
    features: ['cart', 'checkout', 'inventory'],
  },
};

// Sample user data
const sampleUsers = {
  admin: {
    id: 'test-admin-1',
    email: 'admin@test.com',
    role: 'admin',
  },
  subscriber: {
    id: 'test-user-1',
    email: 'user@test.com',
    role: 'subscriber',
    plan: 'pro',
  },
  trial: {
    id: 'test-trial-1',
    email: 'trial@test.com',
    role: 'subscriber',
    plan: 'trial',
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

// Sample API responses
const mockResponses = {
  health: {
    status: 'ok',
    timestamp: expect.any(String),
  },
  authSuccess: {
    success: true,
  },
  authFailure: {
    success: false,
    error: 'Invalid password',
  },
  validationError: {
    success: false,
    errors: expect.any(Array),
  },
};

// Sample industry data (subset for testing)
const sampleIndustries = {
  restaurant: {
    name: 'Restaurant',
    vibe: 'warm, inviting',
    defaultLayout: 'hero-full-image',
  },
  saas: {
    name: 'SaaS',
    vibe: 'professional, modern',
    defaultLayout: 'hero-split',
  },
};

// Sample layout data
const sampleLayouts = {
  'hero-full-image': {
    name: 'Hero Full Image',
    description: 'Full-width hero with background image',
    heroHeight: '70vh',
  },
  'hero-split': {
    name: 'Hero Split',
    description: 'Split-screen hero layout',
    heroHeight: '80vh',
  },
};

// Helper to create mock request bodies
const createMockBody = (base, overrides = {}) => ({
  ...base,
  ...overrides,
});

// Helper to generate random test data
const generateTestData = {
  projectName: () => `Test Project ${Date.now()}`,
  email: () => `test-${Date.now()}@example.com`,
  businessName: () => `Test Business ${Math.random().toString(36).substring(7)}`,
};

module.exports = {
  validCredentials,
  invalidCredentials,
  sampleProjects,
  sampleUsers,
  mockResponses,
  sampleIndustries,
  sampleLayouts,
  createMockBody,
  generateTestData,
};
