const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function check() {
  try {
    // Check generated_projects table for deploy_url
    console.log('=== GENERATED_PROJECTS TABLE ===');
    const projects = await pool.query(`
      SELECT id, name, industry, status, deploy_url, github_repo, created_at
      FROM generated_projects
      WHERE deploy_url IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 20
    `);
    console.log('Projects with deploy_url:', projects.rows.length);
    projects.rows.forEach(r => {
      console.log(`ID: ${r.id} | ${r.name} | ${r.status} | ${r.deploy_url}`);
    });

    // Total in generated_projects
    const totalProjects = await pool.query('SELECT COUNT(*) as count FROM generated_projects');
    console.log('Total in generated_projects:', totalProjects.rows[0].count);

    // Check deployments table
    console.log('\n=== DEPLOYMENTS TABLE ===');
    const deployments = await pool.query(`
      SELECT id, project_id, platform, status, deploy_url, github_repo
      FROM deployments
      WHERE deploy_url IS NOT NULL
      ORDER BY started_at DESC
      LIMIT 20
    `);
    console.log('Deployments with deploy_url:', deployments.rows.length);
    deployments.rows.forEach(r => {
      console.log(`ID: ${r.id} | Project: ${r.project_id} | ${r.platform} | ${r.status} | ${r.deploy_url}`);
    });

    // Total deployments
    const totalDeploys = await pool.query('SELECT COUNT(*) as count FROM deployments');
    console.log('Total deployments:', totalDeploys.rows[0].count);

    // List all tables to see what's available
    console.log('\n=== ALL TABLES ===');
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    tables.rows.forEach(r => console.log(r.table_name));

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}
check();
