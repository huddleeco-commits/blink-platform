/**
 * Database Connection Pool
 * PostgreSQL connection with helper methods
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Log connection errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

/**
 * Execute a query
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  // Log slow queries
  if (duration > 1000) {
    console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
  }

  return result;
}

/**
 * Get a client from the pool for transactions
 */
async function getClient() {
  const client = await pool.connect();

  // Wrap release to ensure it's only called once
  const originalRelease = client.release.bind(client);
  let released = false;

  client.release = () => {
    if (!released) {
      released = true;
      originalRelease();
    }
  };

  return client;
}

/**
 * Transaction helper
 */
async function transaction(callback) {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  query,
  getClient,
  transaction,
  pool
};
