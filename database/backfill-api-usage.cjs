/**
 * Backfill API Usage Data
 * Generates estimated API usage records for historical projects
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');

async function backfillApiUsage() {
  console.log('Starting API usage backfill...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    // Get all projects that don't have API usage records
    const projects = await client.query(`
      SELECT gp.id, gp.name, gp.industry, gp.created_at, gp.metadata
      FROM generated_projects gp
      LEFT JOIN api_usage au ON au.project_id = gp.id
      WHERE au.id IS NULL
      ORDER BY gp.created_at
    `);

    console.log(`Found ${projects.rows.length} projects without API usage records\n`);

    let totalRecords = 0;
    let totalCost = 0;

    for (const project of projects.rows) {
      const metadata = project.metadata || {};
      const backendModules = metadata.backendModules || 5;
      const frontendModules = metadata.frontendModules || 8;
      const totalModules = backendModules + frontendModules;

      // Estimate tokens based on complexity
      // Average generation uses ~50-100K tokens for a full site
      const baseTokens = 30000;
      const tokensPerModule = 5000;
      const estimatedInputTokens = baseTokens + (totalModules * tokensPerModule * 0.3);
      const estimatedOutputTokens = baseTokens + (totalModules * tokensPerModule * 0.7);

      // Calculate cost (Claude Sonnet pricing: $3/1M input, $15/1M output)
      const inputCost = (estimatedInputTokens / 1000000) * 3;
      const outputCost = (estimatedOutputTokens / 1000000) * 15;
      const totalCostForProject = inputCost + outputCost;

      // Create API usage records for different operations
      const operations = [
        { endpoint: 'claude-generate-homepage', operation: 'generate_homepage', pct: 0.25 },
        { endpoint: 'claude-generate-pages', operation: 'generate_pages', pct: 0.40 },
        { endpoint: 'claude-generate-theme', operation: 'generate_theme', pct: 0.15 },
        { endpoint: 'claude-generate-admin', operation: 'generate_admin', pct: 0.20 }
      ];

      for (const op of operations) {
        const opInputTokens = Math.round(estimatedInputTokens * op.pct);
        const opOutputTokens = Math.round(estimatedOutputTokens * op.pct);
        const opCost = (opInputTokens / 1000000) * 3 + (opOutputTokens / 1000000) * 15;

        await client.query(`
          INSERT INTO api_usage (
            project_id, endpoint, operation, model_used,
            input_tokens, output_tokens, tokens_used, cost,
            duration_ms, response_status, timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          project.id,
          op.endpoint,
          op.operation,
          'claude-sonnet-4-20250514',
          opInputTokens,
          opOutputTokens,
          opInputTokens + opOutputTokens,
          opCost,
          Math.round(15000 + Math.random() * 45000), // 15-60 seconds
          200,
          project.created_at
        ]);

        totalRecords++;
      }

      // Update project with total cost
      await client.query(`
        UPDATE generated_projects
        SET api_cost = $1, api_tokens_used = $2
        WHERE id = $3
      `, [totalCostForProject, estimatedInputTokens + estimatedOutputTokens, project.id]);

      totalCost += totalCostForProject;
      console.log(`  ✅ ${project.name}: $${totalCostForProject.toFixed(4)} (${(estimatedInputTokens + estimatedOutputTokens).toLocaleString()} tokens)`);
    }

    console.log('\n========================================');
    console.log('Backfill complete!');
    console.log(`  API Usage Records: ${totalRecords}`);
    console.log(`  Total Estimated Cost: $${totalCost.toFixed(2)}`);
    console.log('========================================\n');

    // Show summary stats
    const stats = await client.query(`
      SELECT
        COUNT(*) as total_records,
        SUM(cost) as total_cost,
        SUM(tokens_used) as total_tokens,
        COUNT(DISTINCT project_id) as projects_with_usage
      FROM api_usage
    `);

    console.log('Database Summary:');
    console.log(`  Total API Usage Records: ${stats.rows[0].total_records}`);
    console.log(`  Total Cost: $${parseFloat(stats.rows[0].total_cost || 0).toFixed(2)}`);
    console.log(`  Total Tokens: ${parseInt(stats.rows[0].total_tokens || 0).toLocaleString()}`);

  } catch (error) {
    console.error('Backfill failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

backfillApiUsage();
