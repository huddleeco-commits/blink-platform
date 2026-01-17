/**
 * BLINK Admin Routes
 * Admin dashboard API endpoints
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Database functions
let db;
try {
  db = require('../database/db.cjs');
} catch (e) {
  console.log('   DB: Database module not loaded yet');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = '1h'; // Reduced from 24h for security - use refresh tokens for longer sessions

// Validate JWT_SECRET is set and sufficiently strong
if (!JWT_SECRET) {
  console.error('❌ CRITICAL: JWT_SECRET environment variable is required');
  console.error('   Admin routes will not function without it.');
} else if (JWT_SECRET.length < 32) {
  console.error('❌ CRITICAL: JWT_SECRET is too weak (min 32 characters required)');
  console.error('   Generate a strong secret: openssl rand -base64 48');
} else if (JWT_SECRET.includes('secret') || JWT_SECRET.includes('change') || JWT_SECRET.includes('local')) {
  console.warn('⚠️ WARNING: JWT_SECRET appears to be a placeholder - use a cryptographically random value');
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

function authenticateAdmin(req, res, next) {
  if (!JWT_SECRET) {
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }
    req.admin = decoded;
    next();
  });
}

// ============================================
// AUTH ROUTES
// ============================================

router.post('/login',
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isString().notEmpty().withMessage('Password is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      if (!JWT_SECRET) {
        return res.status(500).json({ success: false, error: 'Server configuration error' });
      }

      const { email, password } = req.body;

      const admin = await db.getAdminByEmail(email);
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    await db.updateAdminLastLogin(email);

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

router.get('/me', authenticateAdmin, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// ============================================
// DASHBOARD ROUTES
// ============================================

router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    const recentProjects = await db.getRecentProjects(10);

    // Calculate profit margin
    const mrr = parseFloat(stats.total_mrr) || 0;
    const apiCost = parseFloat(stats.api_cost_this_month) || 0;
    const profitMargin = mrr > 0 ? ((mrr - apiCost) / mrr * 100).toFixed(1) : 0;

    // Convert numeric fields in recentProjects
    const processedProjects = recentProjects.map(p => ({
      ...p,
      api_cost: parseFloat(p.api_cost) || 0
    }));

    res.json({
      success: true,
      stats: {
        totalProjects: parseInt(stats.total_projects) || 0,
        deployedProjects: parseInt(stats.deployed_projects) || 0,
        projectsThisMonth: parseInt(stats.projects_this_month) || 0,
        activeSubscribers: parseInt(stats.active_subscribers) || 0,
        mrr: mrr,
        apiCostThisMonth: apiCost,
        tokensThisMonth: parseInt(stats.tokens_this_month) || 0,
        profitMargin: parseFloat(profitMargin)
      },
      recentProjects: processedProjects
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, error: 'Failed to load dashboard' });
  }
});

// ============================================
// PROJECTS ROUTES
// ============================================

router.get('/projects', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const data = await db.getAllProjects(page, limit);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('Projects error:', err);
    res.status(500).json({ success: false, error: 'Failed to load projects' });
  }
});

router.get('/projects/:id', authenticateAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM generated_projects WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Get API usage for this project
    const usage = await db.query(
      'SELECT * FROM api_usage WHERE project_id = $1 ORDER BY timestamp DESC',
      [req.params.id]
    );

    // Get deployments for this project
    const deployments = await db.query(
      'SELECT * FROM deployments WHERE project_id = $1 ORDER BY started_at DESC',
      [req.params.id]
    );

    res.json({
      success: true,
      project: result.rows[0],
      apiUsage: usage.rows,
      deployments: deployments.rows
    });
  } catch (err) {
    console.error('Project detail error:', err);
    res.status(500).json({ success: false, error: 'Failed to load project' });
  }
});

// ============================================
// SUBSCRIBERS ROUTES
// ============================================

router.get('/subscribers', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const data = await db.getAllSubscribers(page, limit);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('Subscribers error:', err);
    res.status(500).json({ success: false, error: 'Failed to load subscribers' });
  }
});

router.post('/subscribers', authenticateAdmin, async (req, res) => {
  try {
    const subscriber = await db.createOrUpdateSubscriber(req.body);
    res.json({ success: true, subscriber });
  } catch (err) {
    console.error('Create subscriber error:', err);
    res.status(500).json({ success: false, error: 'Failed to create subscriber' });
  }
});

// ============================================
// API USAGE ROUTES
// ============================================

router.get('/usage', authenticateAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const stats = await db.getApiUsageStats(days);
    const timeline = await db.getApiUsageTimeline(days);

    // Calculate totals
    const totals = stats.reduce((acc, s) => ({
      requests: acc.requests + parseInt(s.requests),
      tokens: acc.tokens + parseInt(s.total_tokens || 0),
      cost: acc.cost + parseFloat(s.total_cost || 0)
    }), { requests: 0, tokens: 0, cost: 0 });

    res.json({
      success: true,
      stats,
      timeline,
      totals
    });
  } catch (err) {
    console.error('Usage error:', err);
    res.status(500).json({ success: false, error: 'Failed to load usage data' });
  }
});

// ============================================
// COSTS ROUTES
// ============================================

router.get('/costs', authenticateAdmin, async (req, res) => {
  try {
    const month = req.query.month || null;
    const breakdown = await db.getCostBreakdown(month);

    // Get API costs from usage table
    const apiCosts = await db.query(`
      SELECT
        endpoint as category,
        'api' as type,
        SUM(cost) as total
      FROM api_usage
      WHERE timestamp >= DATE_TRUNC('month', NOW())
      GROUP BY endpoint
    `);

    // Calculate totals
    const fixedCosts = breakdown.reduce((sum, c) => sum + parseFloat(c.total || 0), 0);
    const variableCosts = apiCosts.rows.reduce((sum, c) => sum + parseFloat(c.total || 0), 0);

    res.json({
      success: true,
      fixed: breakdown,
      variable: apiCosts.rows,
      totals: {
        fixed: fixedCosts,
        variable: variableCosts,
        total: fixedCosts + variableCosts
      }
    });
  } catch (err) {
    console.error('Costs error:', err);
    res.status(500).json({ success: false, error: 'Failed to load costs' });
  }
});

router.post('/costs', authenticateAdmin, async (req, res) => {
  try {
    const { category, description, amount, vendor, recurring, billingPeriod } = req.body;
    const month = new Date().toISOString().slice(0, 7) + '-01';

    await db.query(
      `INSERT INTO cost_entries (category, description, amount, vendor, recurring, billing_period, month)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [category, description, amount, vendor, recurring, billingPeriod, month]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Add cost error:', err);
    res.status(500).json({ success: false, error: 'Failed to add cost entry' });
  }
});

// ============================================
// ANALYTICS ROUTES
// ============================================

router.get('/analytics', authenticateAdmin, async (req, res) => {
  try {
    const monthlyStats = await db.getMonthlyStats(12);
    const projectsTimeline = await db.getProjectsOverTime(90);
    const revenueTimeline = await db.getRevenueOverTime(12);

    // Calculate growth rates
    const currentMonth = monthlyStats[0] || {};
    const lastMonth = monthlyStats[1] || {};

    const projectGrowth = lastMonth.projects_generated
      ? ((currentMonth.projects_generated - lastMonth.projects_generated) / lastMonth.projects_generated * 100).toFixed(1)
      : 0;

    const revenueGrowth = lastMonth.total_revenue
      ? ((currentMonth.total_revenue - lastMonth.total_revenue) / lastMonth.total_revenue * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      monthly: monthlyStats,
      projects: projectsTimeline,
      revenue: revenueTimeline,
      growth: {
        projects: parseFloat(projectGrowth),
        revenue: parseFloat(revenueGrowth)
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, error: 'Failed to load analytics' });
  }
});

// ============================================
// EXPORT
// ============================================

module.exports = router;
