/**
 * Admin Dashboard Routes
 * Overview statistics and key metrics
 */

const express = require('express');
const router = express.Router();

module.exports = function(db, middleware) {
  const { authenticateToken, isAdmin } = middleware;

  // Apply auth middleware
  router.use(authenticateToken);
  router.use(isAdmin);

  // GET /api/admin/overview - Dashboard overview metrics
  router.get('/', async (req, res) => {
    try {
      const metrics = await db.query(`
        SELECT
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM users WHERE subscription_tier != 'free') as paid_users,
          (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE) as signups_today,
          (SELECT COUNT(*) FROM users WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as signups_this_week,
          (SELECT COUNT(*) FROM users WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as signups_this_month,
          (SELECT COUNT(*) FROM users WHERE banned = true) as banned_users,
          (SELECT COUNT(*) FROM generations) as total_generations,
          (SELECT COUNT(*) FROM generations WHERE DATE(created_at) = CURRENT_DATE) as generations_today,
          (SELECT COUNT(*) FROM generations WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as generations_this_month,
          (SELECT COUNT(*) FROM generations WHERE status = 'completed') as successful_generations,
          (SELECT COUNT(*) FROM generations WHERE status = 'failed') as failed_generations,
          (SELECT COALESCE(AVG(generation_time_ms), 0) FROM generations WHERE status = 'completed') as avg_generation_time,
          (SELECT COALESCE(SUM(pages_generated), 0) FROM generations) as total_pages,
          (SELECT COALESCE(SUM(cost), 0) FROM api_usage WHERE call_date = CURRENT_DATE OR DATE(timestamp) = CURRENT_DATE) as cost_today,
          (SELECT COALESCE(SUM(cost), 0) FROM api_usage WHERE call_date >= DATE_TRUNC('month', CURRENT_DATE) OR timestamp >= DATE_TRUNC('month', CURRENT_DATE)) as cost_this_month,
          (SELECT COALESCE(SUM(tokens_used), 0) FROM api_usage WHERE call_date >= DATE_TRUNC('month', CURRENT_DATE) OR timestamp >= DATE_TRUNC('month', CURRENT_DATE)) as tokens_this_month,
          (SELECT COALESCE(SUM(mrr), 0) FROM subscribers WHERE status = 'active') as mrr,
          (SELECT COUNT(*) FROM system_alerts WHERE resolved = false) as active_alerts
      `);

      const m = metrics.rows[0];
      const totalGenerations = parseInt(m.total_generations) || 1;
      const successRate = (parseInt(m.successful_generations) / totalGenerations * 100).toFixed(1);
      const conversionRate = ((parseInt(m.paid_users) / (parseInt(m.total_users) || 1)) * 100).toFixed(1);
      const costPerGeneration = (parseFloat(m.cost_this_month) / (parseInt(m.generations_this_month) || 1)).toFixed(4);
      const mrr = parseFloat(m.mrr) || 0;
      const monthlyCost = parseFloat(m.cost_this_month) || 0;
      const profitMargin = mrr > 0 ? (((mrr - monthlyCost) / mrr) * 100).toFixed(1) : 0;

      // Recent generations
      const recentGenerations = await db.query(`
        SELECT g.id, g.site_name, g.industry, g.status, g.generation_time_ms, g.created_at, u.email as user_email
        FROM generations g LEFT JOIN users u ON g.user_id = u.id
        ORDER BY g.created_at DESC LIMIT 5
      `);

      // 7-day trends
      const trends = await db.query(`
        SELECT DATE(created_at) as date, COUNT(*) as generations,
          COUNT(*) FILTER (WHERE status = 'completed') as successful,
          COALESCE(SUM(total_cost), 0) as cost
        FROM generations WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at) ORDER BY date
      `);

      // Tier distribution
      const tierDistribution = await db.query(`
        SELECT subscription_tier as tier, COUNT(*) as count
        FROM users
        GROUP BY subscription_tier
        ORDER BY count DESC
      `);

      res.json({
        success: true,
        overview: {
          users: {
            total: parseInt(m.total_users),
            paid: parseInt(m.paid_users),
            free: parseInt(m.total_users) - parseInt(m.paid_users),
            conversionRate: parseFloat(conversionRate),
            signupsToday: parseInt(m.signups_today),
            signupsThisWeek: parseInt(m.signups_this_week),
            signupsThisMonth: parseInt(m.signups_this_month),
            banned: parseInt(m.banned_users)
          },
          generations: {
            total: parseInt(m.total_generations),
            today: parseInt(m.generations_today),
            thisMonth: parseInt(m.generations_this_month),
            successful: parseInt(m.successful_generations),
            failed: parseInt(m.failed_generations),
            successRate: parseFloat(successRate),
            avgTime: Math.round(parseFloat(m.avg_generation_time)),
            totalPages: parseInt(m.total_pages)
          },
          costs: {
            today: parseFloat(m.cost_today),
            thisMonth: parseFloat(m.cost_this_month),
            tokensThisMonth: parseInt(m.tokens_this_month),
            perGeneration: parseFloat(costPerGeneration)
          },
          revenue: {
            mrr: mrr,
            arr: mrr * 12,
            profitMargin: parseFloat(profitMargin),
            netProfit: mrr - monthlyCost
          },
          alerts: {
            active: parseInt(m.active_alerts)
          },
          recentGenerations: recentGenerations.rows,
          trends: trends.rows,
          tierDistribution: tierDistribution.rows
        }
      });
    } catch (error) {
      console.error('Overview error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
