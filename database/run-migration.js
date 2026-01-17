/**
 * Database Migration Runner
 * Runs SQL migration files against the PostgreSQL database
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('Starting database migration...');
  console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));

  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL not set in .env file');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test connection
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected successfully!');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '001_admin_dashboard.sql');
    console.log('Reading migration file:', migrationPath);

    const migration = fs.readFileSync(migrationPath, 'utf8');

    // Split into individual statements (handle multi-statement SQL)
    // We need to be careful with $$ delimiters for functions
    console.log('Running migration...');

    await client.query(migration);

    console.log('Migration completed successfully!');

    // Verify tables were created
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\nTables in database:');
    tables.rows.forEach(row => console.log('  -', row.table_name));

    client.release();
  } catch (error) {
    console.error('Migration failed:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('Could not connect to database. Check your DATABASE_URL.');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
