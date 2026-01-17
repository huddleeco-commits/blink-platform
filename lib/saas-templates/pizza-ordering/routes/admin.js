/**
 * Admin Dashboard API Routes
 * Analytics, reports, and management endpoints
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth, requireStaff } = require('../middleware/auth');

// All admin routes require authentication and staff role
router.use(requireAuth);
router.use(requireStaff('manager'));

// ============================================
// DASHBOARD OVERVIEW
// ============================================

/**
 * GET /api/admin/dashboard
 * Main dashboard stats
 */
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Today's stats
    const todayStats = await db.query(`
      SELECT
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status NOT IN ('cancelled')) as completed_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE status NOT IN ('cancelled', 'pending')), 0) as revenue,
        COALESCE(AVG(total_amount) FILTER (WHERE status NOT IN ('cancelled', 'pending')), 0) as avg_order
      FROM orders
      WHERE DATE(created_at) = $1
    `, [today]);

    // Active orders (need attention)
    const activeOrders = await db.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery')
      GROUP BY status
    `);

    // Comparison to yesterday
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const yesterdayStats = await db.query(`
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE status NOT IN ('cancelled', 'pending')), 0) as revenue
      FROM orders
      WHERE DATE(created_at) = $1
    `, [yesterday]);

    // This week vs last week
    const weekStats = await db.query(`
      SELECT
        COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND status NOT IN ('cancelled', 'pending')), 0) as this_week,
        COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '14 days' AND created_at < CURRENT_DATE - INTERVAL '7 days' AND status NOT IN ('cancelled', 'pending')), 0) as last_week
      FROM orders
    `);

    // Top selling items today
    const topItems = await db.query(`
      SELECT
        oi.item_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total_price) as revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE DATE(o.created_at) = $1 AND o.status NOT IN ('cancelled')
      GROUP BY oi.item_name
      ORDER BY total_sold DESC
      LIMIT 5
    `, [today]);

    // New customers today
    const newCustomers = await db.query(`
      SELECT COUNT(*) as count
      FROM customers
      WHERE DATE(created_at) = $1
    `, [today]);

    const stats = todayStats.rows[0];
    const yStats = yesterdayStats.rows[0];
    const wStats = weekStats.rows[0];

    res.json({
      success: true,
      dashboard: {
        today: {
          orders: parseInt(stats.total_orders),
          revenue: parseFloat(stats.revenue),
          avgOrder: parseFloat(stats.avg_order),
          completed: parseInt(stats.completed_orders),
          cancelled: parseInt(stats.cancelled_orders),
          newCustomers: parseInt(newCustomers.rows[0].count)
        },
        comparison: {
          ordersVsYesterday: parseInt(stats.total_orders) - parseInt(yStats.total_orders),
          revenueVsYesterday: parseFloat(stats.revenue) - parseFloat(yStats.revenue),
          thisWeek: parseFloat(wStats.this_week),
          lastWeek: parseFloat(wStats.last_week),
          weekGrowth: wStats.last_week > 0
            ? ((wStats.this_week - wStats.last_week) / wStats.last_week * 100).toFixed(1)
            : 0
        },
        activeOrders: activeOrders.rows.reduce((acc, row) => {
          acc[row.status] = parseInt(row.count);
          return acc;
        }, {}),
        topItems: topItems.rows
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard' });
  }
});

// ============================================
// SALES ANALYTICS
// ============================================

/**
 * GET /api/admin/analytics/sales
 * Sales analytics with date range
 */
router.get('/analytics/sales', async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;

    const startDate = start_date || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    let dateFormat, interval;
    switch (group_by) {
      case 'hour':
        dateFormat = "TO_CHAR(created_at, 'YYYY-MM-DD HH24:00')";
        interval = 'hour';
        break;
      case 'week':
        dateFormat = "TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD')";
        interval = 'week';
        break;
      case 'month':
        dateFormat = "TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM')";
        interval = 'month';
        break;
      default:
        dateFormat = "TO_CHAR(created_at, 'YYYY-MM-DD')";
        interval = 'day';
    }

    const salesData = await db.query(`
      SELECT
        ${dateFormat} as period,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount) FILTER (WHERE status NOT IN ('cancelled', 'pending')), 0) as revenue,
        COALESCE(AVG(total_amount) FILTER (WHERE status NOT IN ('cancelled', 'pending')), 0) as avg_order,
        COUNT(*) FILTER (WHERE order_type = 'delivery') as delivery_orders,
        COUNT(*) FILTER (WHERE order_type = 'pickup') as pickup_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
      FROM orders
      WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
      GROUP BY ${dateFormat}
      ORDER BY period
    `, [startDate, endDate]);

    // Summary
    const summary = await db.query(`
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE status NOT IN ('cancelled', 'pending')), 0) as total_revenue,
        COALESCE(AVG(total_amount) FILTER (WHERE status NOT IN ('cancelled', 'pending')), 0) as avg_order,
        COALESCE(SUM(tip_amount), 0) as total_tips,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(delivery_fee), 0) as total_delivery_fees
      FROM orders
      WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2 AND status NOT IN ('cancelled')
    `, [startDate, endDate]);

    res.json({
      success: true,
      analytics: {
        data: salesData.rows.map(row => ({
          ...row,
          orders: parseInt(row.orders),
          revenue: parseFloat(row.revenue),
          avg_order: parseFloat(row.avg_order),
          delivery_orders: parseInt(row.delivery_orders),
          pickup_orders: parseInt(row.pickup_orders),
          cancelled: parseInt(row.cancelled)
        })),
        summary: {
          ...summary.rows[0],
          total_orders: parseInt(summary.rows[0].total_orders),
          total_revenue: parseFloat(summary.rows[0].total_revenue),
          avg_order: parseFloat(summary.rows[0].avg_order)
        },
        period: { start: startDate, end: endDate, groupBy: group_by }
      }
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to load analytics' });
  }
});

/**
 * GET /api/admin/analytics/items
 * Item performance analytics
 */
router.get('/analytics/items', async (req, res) => {
  try {
    const { start_date, end_date, limit = 20 } = req.query;

    const startDate = start_date || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    const itemStats = await db.query(`
      SELECT
        mi.id,
        mi.name,
        mi.base_price,
        mc.name as category,
        SUM(oi.quantity) as times_ordered,
        COALESCE(SUM(oi.total_price), 0) as revenue,
        mi.avg_rating,
        mi.review_count
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mc.id = mi.category_id
      LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
      LEFT JOIN orders o ON o.id = oi.order_id
        AND DATE(o.created_at) >= $1
        AND DATE(o.created_at) <= $2
        AND o.status NOT IN ('cancelled')
      GROUP BY mi.id, mi.name, mi.base_price, mc.name, mi.avg_rating, mi.review_count
      ORDER BY times_ordered DESC NULLS LAST
      LIMIT $3
    `, [startDate, endDate, parseInt(limit)]);

    // Category breakdown
    const categoryStats = await db.query(`
      SELECT
        mc.name as category,
        COUNT(DISTINCT oi.id) as items_sold,
        COALESCE(SUM(oi.total_price), 0) as revenue
      FROM menu_categories mc
      LEFT JOIN menu_items mi ON mi.category_id = mc.id
      LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
      LEFT JOIN orders o ON o.id = oi.order_id
        AND DATE(o.created_at) >= $1
        AND DATE(o.created_at) <= $2
        AND o.status NOT IN ('cancelled')
      GROUP BY mc.id, mc.name
      ORDER BY revenue DESC
    `, [startDate, endDate]);

    res.json({
      success: true,
      analytics: {
        items: itemStats.rows.map(row => ({
          ...row,
          times_ordered: parseInt(row.times_ordered) || 0,
          revenue: parseFloat(row.revenue)
        })),
        categories: categoryStats.rows.map(row => ({
          ...row,
          items_sold: parseInt(row.items_sold) || 0,
          revenue: parseFloat(row.revenue)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching item analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to load item analytics' });
  }
});

/**
 * GET /api/admin/analytics/customers
 * Customer analytics
 */
router.get('/analytics/customers', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const startDate = start_date || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    // Customer acquisition
    const acquisition = await db.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*) as new_customers
      FROM customers
      WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date
    `, [startDate, endDate]);

    // Top customers
    const topCustomers = await db.query(`
      SELECT
        c.id, c.first_name, c.last_name, c.email,
        c.total_orders, c.total_spent, c.loyalty_points,
        c.last_order_at
      FROM customers c
      WHERE c.total_orders > 0
      ORDER BY c.total_spent DESC
      LIMIT 10
    `);

    // Customer segments
    const segments = await db.query(`
      SELECT
        CASE
          WHEN total_orders = 1 THEN 'One-time'
          WHEN total_orders BETWEEN 2 AND 5 THEN 'Regular'
          WHEN total_orders > 5 THEN 'Loyal'
          ELSE 'New'
        END as segment,
        COUNT(*) as count,
        COALESCE(AVG(total_spent), 0) as avg_ltv
      FROM customers
      GROUP BY segment
      ORDER BY avg_ltv DESC
    `);

    // Repeat rate
    const repeatRate = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE total_orders > 1)::float / NULLIF(COUNT(*), 0) * 100 as repeat_rate,
        COUNT(*) as total_customers,
        COUNT(*) FILTER (WHERE total_orders > 1) as repeat_customers
      FROM customers
      WHERE total_orders > 0
    `);

    res.json({
      success: true,
      analytics: {
        acquisition: acquisition.rows,
        topCustomers: topCustomers.rows,
        segments: segments.rows.map(row => ({
          ...row,
          count: parseInt(row.count),
          avg_ltv: parseFloat(row.avg_ltv)
        })),
        retention: {
          repeatRate: parseFloat(repeatRate.rows[0]?.repeat_rate || 0).toFixed(1),
          totalCustomers: parseInt(repeatRate.rows[0]?.total_customers || 0),
          repeatCustomers: parseInt(repeatRate.rows[0]?.repeat_customers || 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to load customer analytics' });
  }
});

// ============================================
// ORDER MANAGEMENT
// ============================================

/**
 * GET /api/admin/orders
 * List all orders with filters
 */
router.get('/orders', async (req, res) => {
  try {
    const { status, order_type, date, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        o.*,
        c.first_name, c.last_name, c.email, c.phone,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    if (order_type) {
      params.push(order_type);
      query += ` AND o.order_type = $${params.length}`;
    }

    if (date) {
      params.push(date);
      query += ` AND DATE(o.created_at) = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (o.order_number ILIKE $${params.length} OR c.email ILIKE $${params.length} OR c.phone ILIKE $${params.length})`;
    }

    params.push(parseInt(limit), parseInt(offset));
    query += ` ORDER BY o.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const ordersResult = await db.query(query, params);

    // Count total
    let countQuery = 'SELECT COUNT(*) FROM orders o LEFT JOIN customers c ON c.id = o.customer_id WHERE 1=1';
    const countParams = [];

    if (status) {
      countParams.push(status);
      countQuery += ` AND o.status = $${countParams.length}`;
    }
    if (order_type) {
      countParams.push(order_type);
      countQuery += ` AND o.order_type = $${countParams.length}`;
    }
    if (date) {
      countParams.push(date);
      countQuery += ` AND DATE(o.created_at) = $${countParams.length}`;
    }
    if (search) {
      countParams.push(`%${search}%`);
      countQuery += ` AND (o.order_number ILIKE $${countParams.length} OR c.email ILIKE $${countParams.length})`;
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      orders: ordersResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// ============================================
// REPORTS
// ============================================

/**
 * GET /api/admin/reports/daily
 * Daily sales report
 */
router.get('/reports/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];

    // Check if we have cached daily stats
    let dailyStats = await db.query(
      'SELECT * FROM daily_sales WHERE date = $1',
      [reportDate]
    );

    if (dailyStats.rows.length === 0) {
      // Generate fresh stats
      const stats = await db.query(`
        SELECT
          $1::date as date,
          COUNT(*) as total_orders,
          COUNT(*) FILTER (WHERE status IN ('delivered', 'picked_up')) as completed_orders,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
          COALESCE(SUM(subtotal + tax_amount + delivery_fee + tip_amount), 0) as gross_sales,
          COALESCE(SUM(total_amount) FILTER (WHERE status NOT IN ('cancelled', 'pending')), 0) as net_sales,
          COALESCE(SUM(tax_amount), 0) as tax_collected,
          COALESCE(SUM(tip_amount), 0) as tips_collected,
          COALESCE(SUM(delivery_fee), 0) as delivery_fees,
          COALESCE(AVG(total_amount) FILTER (WHERE status NOT IN ('cancelled', 'pending')), 0) as avg_order_value,
          COUNT(DISTINCT customer_id) FILTER (WHERE customer_id IN (
            SELECT id FROM customers WHERE DATE(created_at) = $1
          )) as new_customers,
          COUNT(DISTINCT customer_id) - COUNT(DISTINCT customer_id) FILTER (WHERE customer_id IN (
            SELECT id FROM customers WHERE DATE(created_at) = $1
          )) as returning_customers,
          COUNT(*) FILTER (WHERE order_type = 'delivery') as delivery_orders,
          COUNT(*) FILTER (WHERE order_type = 'pickup') as pickup_orders,
          COUNT(*) FILTER (WHERE order_type = 'dine_in') as dine_in_orders
        FROM orders
        WHERE DATE(created_at) = $1
      `, [reportDate]);

      dailyStats = { rows: stats.rows };
    }

    // Hourly breakdown
    const hourlyBreakdown = await db.query(`
      SELECT
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE DATE(created_at) = $1 AND status NOT IN ('cancelled')
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `, [reportDate]);

    // Payment method breakdown
    const paymentBreakdown = await db.query(`
      SELECT
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE DATE(created_at) = $1 AND status NOT IN ('cancelled', 'pending')
      GROUP BY payment_method
    `, [reportDate]);

    res.json({
      success: true,
      report: {
        date: reportDate,
        summary: dailyStats.rows[0],
        hourlyBreakdown: hourlyBreakdown.rows.map(row => ({
          hour: parseInt(row.hour),
          orders: parseInt(row.orders),
          revenue: parseFloat(row.revenue)
        })),
        paymentMethods: paymentBreakdown.rows.map(row => ({
          method: row.payment_method,
          count: parseInt(row.count),
          total: parseFloat(row.total)
        }))
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

// ============================================
// SETTINGS
// ============================================

/**
 * GET /api/admin/settings
 * Get all store settings
 */
router.get('/settings', async (req, res) => {
  try {
    const result = await db.query('SELECT key, value FROM store_settings');

    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/admin/settings
 * Update store settings
 */
router.put('/settings', requireStaff('owner'), async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await db.query(`
        INSERT INTO store_settings (key, value, updated_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP, updated_by = $3
      `, [key, JSON.stringify(value), req.user.id]);
    }

    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

module.exports = router;
