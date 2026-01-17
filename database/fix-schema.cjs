/**
 * Fix Database Schema
 * Adds missing columns and resets costs to realistic values
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');

async function fix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    console.log('Adding missing columns to users table...');

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS generations_used INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_used INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS generations_limit INTEGER;
    `);

    // Copy name to full_name
    await client.query(`UPDATE users SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL`);
    console.log('  ✅ Columns added');

    // Reset API costs to realistic values
    // Original estimates were ~100x too high
    // Real costs should be ~$0.02-0.05 per simple generation
    console.log('Resetting API costs to realistic values...');

    await client.query(`UPDATE api_usage SET cost = cost * 0.01`);
    await client.query(`UPDATE generated_projects SET api_cost = api_cost * 0.01`);
    await client.query(`UPDATE generations SET total_cost = total_cost * 0.01`);

    // Get new totals
    const costs = await client.query(`SELECT SUM(cost) as total FROM api_usage`);
    const genCosts = await client.query(`SELECT SUM(total_cost) as total FROM generations`);

    console.log(`  ✅ API usage total: $${parseFloat(costs.rows[0].total || 0).toFixed(2)}`);
    console.log(`  ✅ Generations total: $${parseFloat(genCosts.rows[0].total || 0).toFixed(2)}`);

    console.log('\nDone!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fix();
