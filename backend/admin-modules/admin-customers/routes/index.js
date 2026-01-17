/**
 * Admin Customers Routes
 * User management, search, tier changes, bans
 * Migrated from: backend/blink-admin/routes/admin.js lines 130-268
 */

const express = require('express');
const router = express.Router();

module.exports = function(db, middleware) {
  const { authenticateToken, isAdmin } = middleware;

  router.use(authenticateToken);
  router.use(isAdmin);

  // GET /api/admin/users - List users with pagination and filtering
  router.get('/', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';
      const tier = req.query.tier || 'all';

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search) {
        params.push(`%${search}%`);
        whereClause += ` AND (email ILIKE $${params.length} OR name ILIKE $${params.length})`;
      }

      if (tier !== 'all') {
        params.push(tier);
        whereClause += ` AND subscription_tier = $${params.length}`;
      }

      const countResult = await db.query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
      const total = parseInt(countResult.rows[0].count);

      params.push(limit, offset);
      const users = await db.query(`
        SELECT id, email, name, subscription_tier, banned, created_at, last_active_at,
               generations_used, login_count, source
        FROM users ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `, params);

      res.json({
        success: true,
        users: users.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    } catch (error) {
      console.error('Users list error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/admin/users/:id - Get individual user details
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const user = await db.query(`
        SELECT id, email, name, subscription_tier, banned, ban_reason,
               created_at, last_active_at, generations_used, generations_limit,
               login_count, source, stripe_customer_id
        FROM users WHERE id = $1
      `, [id]);

      if (user.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Get user's recent generations
      const generations = await db.query(`
        SELECT id, site_name, industry, status, created_at, total_cost
        FROM generations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10
      `, [id]);

      res.json({
        success: true,
        user: user.rows[0],
        recentGenerations: generations.rows
      });
    } catch (error) {
      console.error('User detail error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUT /api/admin/users/:id/tier - Change user subscription tier
  router.put('/:id/tier', async (req, res) => {
    try {
      const { id } = req.params;
      const { tier } = req.body;
      const validTiers = ['free', 'power', 'dealer', 'admin'];

      if (!validTiers.includes(tier)) {
        return res.status(400).json({ success: false, error: 'Invalid tier' });
      }

      // Get old tier for audit log
      const oldUser = await db.query('SELECT subscription_tier FROM users WHERE id = $1', [id]);
      const oldTier = oldUser.rows[0]?.subscription_tier;

      await db.query('UPDATE users SET subscription_tier = $1 WHERE id = $2', [tier, id]);

      // Audit log
      await db.query(`
        INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, old_value, new_value, ip_address)
        VALUES ($1, 'tier_changed', 'user', $2, $3, $4, $5)
      `, [req.user.id, id, JSON.stringify({ tier: oldTier }), JSON.stringify({ tier }), req.ip]);

      res.json({ success: true, message: 'Tier updated' });
    } catch (error) {
      console.error('Tier change error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUT /api/admin/users/:id/ban - Ban/unban user
  router.put('/:id/ban', async (req, res) => {
    try {
      const { id } = req.params;
      const { banned, reason } = req.body;

      await db.query(`
        UPDATE users SET banned = $1, ban_reason = $2 WHERE id = $3
      `, [banned, banned ? reason : null, id]);

      // Audit log
      await db.query(`
        INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, old_value, new_value, ip_address)
        VALUES ($1, $2, 'user', $3, NULL, $4, $5)
      `, [req.user.id, banned ? 'user_banned' : 'user_unbanned', id, JSON.stringify({ reason }), req.ip]);

      res.json({ success: true, message: banned ? 'User banned' : 'User unbanned' });
    } catch (error) {
      console.error('Ban error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // DELETE /api/admin/users/:id - Delete user
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { hard } = req.query;

      if (hard === 'true') {
        // Hard delete - remove all data
        await db.query('DELETE FROM generations WHERE user_id = $1', [id]);
        await db.query('DELETE FROM api_usage WHERE user_id = $1', [id]);
        await db.query('DELETE FROM users WHERE id = $1', [id]);
      } else {
        // Soft delete - mark as deleted
        await db.query(`
          UPDATE users SET banned = true, ban_reason = 'Account deleted' WHERE id = $1
        `, [id]);
      }

      // Audit log
      await db.query(`
        INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, old_value, new_value, ip_address)
        VALUES ($1, 'user_deleted', 'user', $2, NULL, $3, $4)
      `, [req.user.id, id, JSON.stringify({ hard: hard === 'true' }), req.ip]);

      res.json({ success: true, message: 'User deleted' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/admin/users/export - Export users to CSV
  router.get('/export/csv', async (req, res) => {
    try {
      const users = await db.query(`
        SELECT id, email, name, subscription_tier, banned, created_at, last_active_at, generations_used
        FROM users ORDER BY created_at DESC
      `);

      const csv = [
        'ID,Email,Name,Tier,Banned,Created,Last Active,Generations',
        ...users.rows.map(u =>
          `${u.id},"${u.email}","${u.name || ''}",${u.subscription_tier},${u.banned},${u.created_at},${u.last_active_at || ''},${u.generations_used}`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      res.send(csv);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
