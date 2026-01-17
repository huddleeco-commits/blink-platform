/**
 * Backfill Generated Projects
 * Scans the generated-projects folder and populates the database
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const GENERATED_PROJECTS_PATH = path.resolve(__dirname, '..', '..', '..', 'generated-projects');

async function backfillProjects() {
  console.log('Starting project backfill...');
  console.log('Scanning:', GENERATED_PROJECTS_PATH);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    // Check if folder exists
    if (!fs.existsSync(GENERATED_PROJECTS_PATH)) {
      console.error('Generated projects folder not found:', GENERATED_PROJECTS_PATH);
      return;
    }

    // Get all directories
    const items = fs.readdirSync(GENERATED_PROJECTS_PATH, { withFileTypes: true });
    const projectDirs = items.filter(item => item.isDirectory()).map(item => item.name);

    console.log(`Found ${projectDirs.length} project directories\n`);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const projectName of projectDirs) {
      const projectPath = path.join(GENERATED_PROJECTS_PATH, projectName);
      const brainPath = path.join(projectPath, 'brain.json');
      const manifestPath = path.join(projectPath, 'project-manifest.json');

      try {
        // Check if already exists
        const existing = await client.query(
          'SELECT id FROM generated_projects WHERE name = $1',
          [projectName]
        );

        if (existing.rows.length > 0) {
          console.log(`  ⏭️  ${projectName} (already exists)`);
          skipped++;
          continue;
        }

        // Read metadata files
        let brain = null;
        let manifest = null;

        if (fs.existsSync(brainPath)) {
          brain = JSON.parse(fs.readFileSync(brainPath, 'utf8'));
        }

        if (fs.existsSync(manifestPath)) {
          manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        }

        if (!brain && !manifest) {
          console.log(`  ⚠️  ${projectName} (no metadata files)`);
          skipped++;
          continue;
        }

        // Get folder stats for created date
        const stats = fs.statSync(projectPath);

        // Extract data
        const industry = brain?.industry?.type || manifest?.industry || 'unknown';
        const bundles = manifest?.bundles || [];
        const generatedAt = brain?.generatedAt || manifest?.generatedAt || stats.birthtime;
        const businessName = brain?.business?.name || projectName.replace(/-/g, ' ');

        // Count pages/modules
        const backendModules = manifest?.counts?.backendModules || manifest?.modules?.backend?.length || 0;
        const frontendModules = manifest?.counts?.frontendModules || manifest?.modules?.frontend?.length || 0;
        const totalModules = backendModules + frontendModules;

        // Insert into database
        await client.query(`
          INSERT INTO generated_projects (name, industry, bundles, status, metadata, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          projectName,
          industry,
          bundles,
          'completed',
          JSON.stringify({
            businessName,
            backendModules,
            frontendModules,
            totalModules,
            generator: manifest?.generator || 'Module Library Assembler',
            admin: manifest?.admin || null,
            theme: brain?.theme || null
          }),
          generatedAt
        ]);

        console.log(`  ✅ ${projectName} (${industry})`);
        inserted++;

      } catch (err) {
        console.error(`  ❌ ${projectName}: ${err.message}`);
        errors++;
      }
    }

    console.log('\n========================================');
    console.log(`Backfill complete!`);
    console.log(`  Inserted: ${inserted}`);
    console.log(`  Skipped:  ${skipped}`);
    console.log(`  Errors:   ${errors}`);
    console.log('========================================\n');

    // Show summary
    const count = await client.query('SELECT COUNT(*) FROM generated_projects');
    console.log(`Total projects in database: ${count.rows[0].count}`);

  } catch (error) {
    console.error('Backfill failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

backfillProjects();
