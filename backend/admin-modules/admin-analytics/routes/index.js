/**
 * Admin Analytics Routes
 * Cost analytics, revenue, performance metrics
 * Migrated from: backend/blink-admin/routes/admin.js lines 322-567
 */

const express = require('express');
const router = express.Router();

module.exports = function(db, middleware) {
  const { authenticateToken, isAdmin } = middleware;

  router.use(authenticateToken);
  router.use(isAdmin);

  // GET /api/admin/analytics/costs - Cost breakdown
  router.get('/costs', async (req, res) => {
    try {
      const startDate = req.query.startDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const endDate = req.query.endDate || new Date().toISOString().split('T')[0];

      // Cost by operation
      const byOperation = await db.query(`
        SELECT operation_type, COALESCE(SUM(cost), 0) as total_cost, COUNT(*) as calls,
               COALESCE(SUM(input_tokens), 0) as input_tokens, COALESCE(SUM(output_tokens), 0) as output_tokens
        FROM api_usage
        WHERE (call_date BETWEEN $1 AND $2) OR (DATE(timestamp) BETWEEN $1 AND $2)
        GROUP BY operation_type ORDER BY total_cost DESC
      `, [startDate, endDate]);

      // Cost by model
      const byModel = await db.query(`
        SELECT model_used, COALESCE(SUM(cost), 0) as total_cost, COUNT(*) as calls
        FROM api_usage
        WHERE (call_date BETWEEN $1 AND $2) OR (DATE(timestamp) BETWEEN $1 AND $2)
        GROUP BY model_used ORDER BY total_cost DESC
      `, [startDate, endDate]);

      // Daily costs (14 days)
      const dailyCosts = await db.query(`
        SELECT DATE(COALESCE(call_date, timestamp)) as date, COALESCE(SUM(cost), 0) as cost, COUNT(*) as calls
        FROM api_usage
        WHERE (call_date >= CURRENT_DATE - INTERVAL '14 days') OR (timestamp >= CURRENT_DATE - INTERVAL '14 days')
        GROUP BY DATE(COALESCE(call_date, timestamp)) ORDER BY date
      `);

      // Totals
      const totals = await db.query(`
        SELECT COALESCE(SUM(cost), 0) as total_cost,
               COALESCE(SUM(input_tokens), 0) as input_tokens,
               COALESCE(SUM(output_tokens), 0) as output_tokens,
               COUNT(*) as total_calls
        FROM api_usage
        WHERE (call_date BETWEEN $1 AND $2) OR (DATE(timestamp) BETWEEN $1 AND $2)
      `, [startDate, endDate]);

      res.json({
        success: true,
        costAnalytics: {
          byOperation: byOperation.rows,
          byModel: byModel.rows,
          dailyCosts: dailyCosts.rows,
          totals: totals.rows[0],
          dateRange: { startDate, endDate }
        }
      });
    } catch (error) {
      console.error('Cost analytics error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/admin/analytics/revenue - Revenue metrics
  router.get('/revenue', async (req, res) => {
    try {
      // MRR from active subscriptions
      const mrr = await db.query(`
        SELECT COALESCE(SUM(mrr), 0) as mrr FROM subscribers WHERE status = 'active'
      `);

      // Revenue by tier
      const byTier = await db.query(`
        SELECT subscription_tier as tier, COUNT(*) as users,
               COALESCE(SUM(mrr), 0) as revenue
        FROM users LEFT JOIN subscribers ON users.id = subscribers.user_id
        WHERE subscribers.status = 'active' OR subscribers.status IS NULL
        GROUP BY subscription_tier
      `);

      // Monthly trends
      const monthlyTrends = await db.query(`
        SELECT DATE_TRUNC('month', created_at) as month,
               COUNT(*) as new_subscriptions,
               COALESCE(SUM(mrr), 0) as new_revenue
        FROM subscribers
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `);

      // Cost this month
      const monthlyCost = await db.query(`
        SELECT COALESCE(SUM(cost), 0) as cost
        FROM api_usage
        WHERE call_date >= DATE_TRUNC('month', CURRENT_DATE)
           OR timestamp >= DATE_TRUNC('month', CURRENT_DATE)
      `);

      const mrrValue = parseFloat(mrr.rows[0]?.mrr) || 0;
      const costValue = parseFloat(monthlyCost.rows[0]?.cost) || 0;
      const netProfit = mrrValue - costValue;
      const profitMargin = mrrValue > 0 ? ((netProfit / mrrValue) * 100).toFixed(1) : 0;

      res.json({
        success: true,
        revenue: {
          mrr: mrrValue,
          arr: mrrValue * 12,
          netProfit,
          profitMargin: parseFloat(profitMargin),
          monthlyCost: costValue,
          byTier: byTier.rows,
          monthlyTrends: monthlyTrends.rows
        }
      });
    } catch (error) {
      console.error('Revenue error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/admin/analytics/performance - Performance metrics
  router.get('/performance', async (req, res) => {
    try {
      // Generation performance
      const genPerf = await db.query(`
        SELECT
          COALESCE(AVG(generation_time_ms), 0) as avg_time,
          COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY generation_time_ms), 0) as p95_time,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'completed') as successful,
          COUNT(*) FILTER (WHERE status = 'failed') as failed
        FROM generations
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `);

      // By operation type
      const byOperation = await db.query(`
        SELECT operation_type,
               COUNT(*) as calls,
               COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - timestamp)) * 1000), 0) as avg_time_ms,
               COUNT(*) FILTER (WHERE success = true) as successful,
               COUNT(*) FILTER (WHERE success = false) as failed
        FROM api_usage
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY operation_type
      `);

      // Hourly throughput
      const hourlyThroughput = await db.query(`
        SELECT DATE_TRUNC('hour', created_at) as hour, COUNT(*) as generations
        FROM generations
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY DATE_TRUNC('hour', created_at)
        ORDER BY hour
      `);

      const perf = genPerf.rows[0];
      const successRate = perf.total > 0 ? ((perf.successful / perf.total) * 100).toFixed(1) : 100;

      res.json({
        success: true,
        performance: {
          avgTime: Math.round(parseFloat(perf.avg_time)),
          p95Time: Math.round(parseFloat(perf.p95_time)),
          total: parseInt(perf.total),
          successful: parseInt(perf.successful),
          failed: parseInt(perf.failed),
          successRate: parseFloat(successRate),
          byOperation: byOperation.rows,
          hourlyThroughput: hourlyThroughput.rows
        }
      });
    } catch (error) {
      console.error('Performance error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
