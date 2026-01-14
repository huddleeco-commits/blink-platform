/**
 * BLINK Database Connection
 * PostgreSQL connection helper with connection pooling
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('   DB: Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('   DB: Unexpected error on idle client', err);
});

// Initialize database schema
async function initializeDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);
    console.log('   DB: Schema initialized successfully');

    // Create default admin if none exists
    const adminCheck = await pool.query('SELECT COUNT(*) FROM admin_users');
    if (parseInt(adminCheck.rows[0].count) === 0) {
      const bcrypt = require('bcryptjs');
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@blink.be1st.io';
      const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';
      const hash = await bcrypt.hash(adminPassword, 10);

      await pool.query(
        'INSERT INTO admin_users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)',
        [adminEmail, hash, 'Admin', 'super_admin']
      );
      console.log(`   DB: Default admin created (${adminEmail})`);
    }

    return true;
  } catch (err) {
    console.error('   DB: Failed to initialize schema:', err.message);
    return false;
  }
}

// Query helper with error handling
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 100) {
      console.log(`   DB: Slow query (${duration}ms):`, text.substring(0, 80));
    }
    return res;
  } catch (err) {
    console.error('   DB: Query error:', err.message);
    throw err;
  }
}

// Transaction helper
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ============================================
// PROJECT TRACKING
// ============================================

async function trackProjectStart(data) {
  const result = await query(
    `INSERT INTO generated_projects
     (name, industry, bundles, user_email, status, metadata)
     VALUES ($1, $2, $3, $4, 'building', $5)
     RETURNING id`,
    [data.name, data.industry, data.bundles || [], data.userEmail, data.metadata || {}]
  );
  return result.rows[0].id;
}

async function trackProjectDeployed(projectId, data) {
  await query(
    `UPDATE generated_projects SET
     status = 'deployed',
     domain = $2,
     deploy_url = $3,
     github_repo = $4,
     railway_project_id = $5,
     api_tokens_used = $6,
     api_cost = $7,
     deployed_at = NOW()
     WHERE id = $1`,
    [projectId, data.domain, data.deployUrl, data.githubRepo, data.railwayProjectId, data.tokensUsed || 0, data.apiCost || 0]
  );
}

async function trackProjectFailed(projectId, error) {
  await query(
    `UPDATE generated_projects SET status = 'failed', metadata = metadata || $2 WHERE id = $1`,
    [projectId, { error: error.message || error }]
  );
}

// ============================================
// API USAGE TRACKING
// ============================================

async function trackApiUsage(data) {
  await query(
    `INSERT INTO api_usage
     (project_id, endpoint, operation, tokens_used, input_tokens, output_tokens, cost, duration_ms, response_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      data.projectId,
      data.endpoint,
      data.operation,
      data.tokensUsed || 0,
      data.inputTokens || 0,
      data.outputTokens || 0,
      data.cost || 0,
      data.durationMs || 0,
      data.responseStatus || 200
    ]
  );
}

// Calculate Claude API cost (per 1M tokens)
function calculateClaudeCost(inputTokens, outputTokens, model = 'claude-sonnet-4-20250514') {
  const pricing = {
    'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  };
  const rates = pricing[model] || pricing['claude-sonnet-4-20250514'];
  const inputCost = (inputTokens / 1000000) * rates.input;
  const outputCost = (outputTokens / 1000000) * rates.output;
  return inputCost + outputCost;
}

// ============================================
// ADMIN DASHBOARD QUERIES
// ============================================

async function getDashboardStats() {
  const stats = await query(`
    SELECT
      (SELECT COUNT(*) FROM generated_projects) as total_projects,
      (SELECT COUNT(*) FROM generated_projects WHERE status = 'deployed') as deployed_projects,
      (SELECT COUNT(*) FROM generated_projects WHERE created_at >= DATE_TRUNC('month', NOW())) as projects_this_month,
      (SELECT COUNT(*) FROM subscribers WHERE status = 'active') as active_subscribers,
      (SELECT COALESCE(SUM(mrr), 0) FROM subscribers WHERE status = 'active') as total_mrr,
      (SELECT COALESCE(SUM(cost), 0) FROM api_usage WHERE timestamp >= DATE_TRUNC('month', NOW())) as api_cost_this_month,
      (SELECT COALESCE(SUM(tokens_used), 0) FROM api_usage WHERE timestamp >= DATE_TRUNC('month', NOW())) as tokens_this_month
  `);
  return stats.rows[0];
}

async function getRecentProjects(limit = 20) {
  const result = await query(
    `SELECT id, name, industry, domain, status, deploy_url, api_cost, created_at, deployed_at
     FROM generated_projects
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function getAllProjects(page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT * FROM generated_projects ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const count = await query('SELECT COUNT(*) FROM generated_projects');
  return {
    projects: result.rows,
    total: parseInt(count.rows[0].count),
    page,
    pages: Math.ceil(count.rows[0].count / limit)
  };
}

async function getAllSubscribers(page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT * FROM subscribers ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const count = await query('SELECT COUNT(*) FROM subscribers');
  return {
    subscribers: result.rows,
    total: parseInt(count.rows[0].count),
    page,
    pages: Math.ceil(count.rows[0].count / limit)
  };
}

async function getApiUsageStats(days = 30) {
  const result = await query(`
    SELECT
      endpoint,
      COUNT(*) as requests,
      SUM(tokens_used) as total_tokens,
      SUM(cost) as total_cost,
      AVG(duration_ms) as avg_duration
    FROM api_usage
    WHERE timestamp >= NOW() - INTERVAL '${days} days'
    GROUP BY endpoint
    ORDER BY total_cost DESC
  `);
  return result.rows;
}

async function getApiUsageTimeline(days = 30) {
  const result = await query(`
    SELECT
      DATE_TRUNC('day', timestamp) as day,
      endpoint,
      COUNT(*) as requests,
      SUM(cost) as cost
    FROM api_usage
    WHERE timestamp >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE_TRUNC('day', timestamp), endpoint
    ORDER BY day DESC
  `);
  return result.rows;
}

async function getCostBreakdown(month = null) {
  const monthFilter = month ? `WHERE month = '${month}'` : '';
  const result = await query(`
    SELECT
      category,
      vendor,
      SUM(amount) as total
    FROM cost_entries
    ${monthFilter}
    GROUP BY category, vendor
    ORDER BY total DESC
  `);
  return result.rows;
}

async function getMonthlyStats(months = 12) {
  const result = await query(`
    SELECT * FROM monthly_stats
    ORDER BY month DESC
    LIMIT $1`,
    [months]
  );
  return result.rows;
}

async function getProjectsOverTime(days = 90) {
  const result = await query(`
    SELECT
      DATE_TRUNC('day', created_at) as day,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE status = 'deployed') as deployed
    FROM generated_projects
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY day
  `);
  return result.rows;
}

async function getRevenueOverTime(months = 12) {
  const result = await query(`
    SELECT
      DATE_TRUNC('month', created_at) as month,
      SUM(plan_price) as revenue,
      COUNT(*) as new_subscribers
    FROM subscribers
    WHERE created_at >= NOW() - INTERVAL '${months} months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month
  `);
  return result.rows;
}

// ============================================
// SUBSCRIBER MANAGEMENT
// ============================================

async function createOrUpdateSubscriber(data) {
  const result = await query(
    `INSERT INTO subscribers (email, name, stripe_customer_id, plan, plan_price, mrr, status)
     VALUES ($1, $2, $3, $4, $5, $5, $6)
     ON CONFLICT (email) DO UPDATE SET
       name = COALESCE($2, subscribers.name),
       stripe_customer_id = COALESCE($3, subscribers.stripe_customer_id),
       plan = $4,
       plan_price = $5,
       mrr = $5,
       status = $6,
       updated_at = NOW()
     RETURNING *`,
    [data.email, data.name, data.stripeCustomerId, data.plan, data.planPrice || 0, data.status || 'active']
  );
  return result.rows[0];
}

async function updateSubscriberStatus(email, status) {
  await query(
    `UPDATE subscribers SET status = $2, cancelled_at = CASE WHEN $2 = 'cancelled' THEN NOW() ELSE NULL END WHERE email = $1`,
    [email, status]
  );
}

// ============================================
// ADMIN AUTH
// ============================================

async function getAdminByEmail(email) {
  const result = await query('SELECT * FROM admin_users WHERE email = $1', [email]);
  return result.rows[0];
}

async function updateAdminLastLogin(email) {
  await query('UPDATE admin_users SET last_login = NOW() WHERE email = $1', [email]);
}

module.exports = {
  pool,
  query,
  transaction,
  initializeDatabase,
  // Project tracking
  trackProjectStart,
  trackProjectDeployed,
  trackProjectFailed,
  // API tracking
  trackApiUsage,
  calculateClaudeCost,
  // Dashboard
  getDashboardStats,
  getRecentProjects,
  getAllProjects,
  getAllSubscribers,
  getApiUsageStats,
  getApiUsageTimeline,
  getCostBreakdown,
  getMonthlyStats,
  getProjectsOverTime,
  getRevenueOverTime,
  // Subscribers
  createOrUpdateSubscriber,
  updateSubscriberStatus,
  // Admin
  getAdminByEmail,
  updateAdminLastLogin
};
