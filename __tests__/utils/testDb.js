/**
 * Test Database Utility
 *
 * Helpers for database-related tests.
 * Only used when DATABASE_URL is set.
 */

// Mock database for tests that don't need real DB
const mockDb = {
  users: new Map(),
  sessions: new Map(),
  projects: new Map(),

  // Mock user operations
  createUser: async (userData) => {
    const id = `mock-user-${Date.now()}`;
    const user = { id, ...userData, createdAt: new Date().toISOString() };
    mockDb.users.set(id, user);
    return user;
  },

  findUserByEmail: async (email) => {
    for (const user of mockDb.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  },

  findUserById: async (id) => {
    return mockDb.users.get(id) || null;
  },

  updateUser: async (id, updates) => {
    const user = mockDb.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
    mockDb.users.set(id, updated);
    return updated;
  },

  deleteUser: async (id) => {
    return mockDb.users.delete(id);
  },

  // Mock session operations
  createSession: async (userId, token) => {
    const session = {
      id: `mock-session-${Date.now()}`,
      userId,
      token,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    mockDb.sessions.set(session.id, session);
    return session;
  },

  findSessionByToken: async (token) => {
    for (const session of mockDb.sessions.values()) {
      if (session.token === token) return session;
    }
    return null;
  },

  // Mock project operations
  createProject: async (projectData) => {
    const id = `mock-project-${Date.now()}`;
    const project = { id, ...projectData, createdAt: new Date().toISOString() };
    mockDb.projects.set(id, project);
    return project;
  },

  findProjectById: async (id) => {
    return mockDb.projects.get(id) || null;
  },

  listProjects: async (userId) => {
    const projects = [];
    for (const project of mockDb.projects.values()) {
      if (!userId || project.userId === userId) {
        projects.push(project);
      }
    }
    return projects;
  },

  // Reset all mock data
  reset: () => {
    mockDb.users.clear();
    mockDb.sessions.clear();
    mockDb.projects.clear();
  },
};

/**
 * Get real database connection for integration tests
 * @returns {Object|null} - Database instance or null
 */
function getRealDb() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    const db = require('../../database/db.js');
    return db;
  } catch (err) {
    console.warn('Could not load real database:', err.message);
    return null;
  }
}

/**
 * Setup test database (creates test tables if needed)
 * @returns {Promise<void>}
 */
async function setupTestDb() {
  const db = getRealDb();
  if (!db) {
    console.log('Using mock database for tests');
    return;
  }

  await db.initializeDatabase();
  console.log('Real database initialized for tests');
}

/**
 * Cleanup test database (removes test data)
 * @returns {Promise<void>}
 */
async function cleanupTestDb() {
  mockDb.reset();

  const db = getRealDb();
  if (!db) return;

  // Clean up test data (implement based on your schema)
  console.log('Test database cleanup complete');
}

module.exports = {
  mockDb,
  getRealDb,
  setupTestDb,
  cleanupTestDb,
};
