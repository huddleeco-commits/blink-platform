/**
 * Authentication Middleware
 * JWT verification and role-based access control
 */

const jwt = require('jsonwebtoken');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('WARNING: JWT_SECRET must be at least 32 characters');
}

/**
 * Verify JWT token and attach user to request
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database
    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.userId || decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    console.error('Auth error:', error);
    return res.status(500).json({ success: false, error: 'Authentication failed' });
  }
}

/**
 * Optional auth - doesn't fail if no token, but attaches user if present
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.userId || decoded.id]
    );

    if (userResult.rows.length > 0) {
      req.user = userResult.rows[0];
    }

    next();
  } catch (error) {
    // Silently continue without user
    next();
  }
}

/**
 * Require specific staff role
 * Roles hierarchy: owner > manager > cook > driver > cashier
 */
function requireStaff(minimumRole = 'cashier') {
  const roleHierarchy = {
    'owner': 5,
    'manager': 4,
    'cook': 3,
    'driver': 2,
    'cashier': 1
  };

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // Check if user is staff
      const staffResult = await db.query(
        'SELECT role, is_active FROM staff WHERE user_id = $1',
        [req.user.id]
      );

      if (staffResult.rows.length === 0) {
        return res.status(403).json({ success: false, error: 'Staff access required' });
      }

      const staff = staffResult.rows[0];

      if (!staff.is_active) {
        return res.status(403).json({ success: false, error: 'Staff account is inactive' });
      }

      const userRoleLevel = roleHierarchy[staff.role] || 0;
      const requiredRoleLevel = roleHierarchy[minimumRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({
          success: false,
          error: `Insufficient permissions. Required: ${minimumRole}, Current: ${staff.role}`
        });
      }

      req.staff = staff;
      next();
    } catch (error) {
      console.error('Staff auth error:', error);
      return res.status(500).json({ success: false, error: 'Authorization failed' });
    }
  };
}

/**
 * Rate limiting middleware
 */
const rateLimiters = {};

function rateLimit(key, maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const identifier = req.ip || 'unknown';
    const limitKey = `${key}:${identifier}`;

    if (!rateLimiters[limitKey]) {
      rateLimiters[limitKey] = {
        count: 0,
        resetAt: Date.now() + windowMs
      };
    }

    const limiter = rateLimiters[limitKey];

    if (Date.now() > limiter.resetAt) {
      limiter.count = 0;
      limiter.resetAt = Date.now() + windowMs;
    }

    limiter.count++;

    if (limiter.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireStaff,
  rateLimit
};
