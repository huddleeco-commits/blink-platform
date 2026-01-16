/**
 * Authentication Routes
 * Extracted from server.cjs
 *
 * Handles: password validation, login, health check
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * Create auth routes
 * @param {Object} deps - Dependencies
 * @param {Object} deps.db - Database connection (can be null)
 */
function createAuthRoutes(deps) {
  const router = express.Router();
  const { db } = deps;

  // Health check
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Validate main access password
  router.post('/auth/validate',
    body('password').isString().notEmpty().withMessage('Password is required'),
    handleValidationErrors,
    (req, res) => {
      const { password } = req.body;
      const adminPassword = process.env.BLINK_ADMIN_PASSWORD;

      if (!adminPassword) {
        console.error('❌ BLINK_ADMIN_PASSWORD not configured');
        return res.status(500).json({ success: false, error: 'Server configuration error' });
      }

      if (password === adminPassword) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, error: 'Invalid password' });
      }
    }
  );

  // Validate developer access password
  router.post('/auth/validate-dev',
    body('password').isString().notEmpty().withMessage('Password is required'),
    handleValidationErrors,
    (req, res) => {
      const { password } = req.body;
      const devPassword = process.env.BLINK_DEV_PASSWORD;

      if (!devPassword) {
        console.error('❌ BLINK_DEV_PASSWORD not configured');
        return res.status(500).json({ success: false, error: 'Server configuration error' });
      }

      if (password === devPassword) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, error: 'Invalid password' });
      }
    }
  );

  // Admin login endpoint (JWT-based)
  router.post('/auth/login',
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
    handleValidationErrors,
    async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!db) {
          return res.status(500).json({ success: false, error: 'Database not available' });
        }

        // Find user by email
        const result = await db.query(
          'SELECT id, email, password_hash, name, subscription_tier, is_admin FROM users WHERE email = $1',
          [email]
        );

        if (result.rows.length === 0) {
          return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
          return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check if admin
        if (!user.is_admin) {
          return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        // Generate JWT - use is_admin (snake_case) to match auth middleware
        const token = jwt.sign(
          { id: user.id, email: user.email, is_admin: user.is_admin },
          process.env.JWT_SECRET || 'blink-default-secret',
          { expiresIn: '24h' }
        );

        res.json({
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            subscription_tier: user.subscription_tier,
            is_admin: user.is_admin
          }
        });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Login failed' });
      }
    }
  );

  return router;
}

module.exports = { createAuthRoutes };
