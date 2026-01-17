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

    // 1. Run base schema first
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log('Running base schema:', schemaPath);
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schema);
    console.log('Base schema completed!');

    // 2. Create users table if not exists (required by admin dashboard)
    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255),
        subscription_tier VARCHAR(50) DEFAULT 'free',
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Users table ready!');

    // 3. Run admin dashboard migration
    const migrationPath = path.join(__dirname, 'migrations', '001_admin_dashboard.sql');
    console.log('Running admin dashboard migration:', migrationPath);
    const migration = fs.readFileSync(migrationPath, 'utf8');
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
