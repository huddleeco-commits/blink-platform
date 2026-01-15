/**
 * Test App Utility
 *
 * Creates a testable Express app for API tests.
 * Uses supertest for HTTP assertions.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

// Paths for testing
const MODULE_LIBRARY = path.resolve(__dirname, '..', '..', '..');
const PROMPTS_DIR = path.join(MODULE_LIBRARY, 'prompts');

// Load prompt configs (cached)
let INDUSTRIES, LAYOUTS, EFFECTS, SECTIONS;
try {
  INDUSTRIES = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, 'industries.json'), 'utf-8'));
  LAYOUTS = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, 'layouts.json'), 'utf-8'));
  EFFECTS = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, 'effects.json'), 'utf-8'));
  SECTIONS = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, 'sections.json'), 'utf-8'));
} catch (err) {
  console.warn('Warning: Could not load prompt configs:', err.message);
  INDUSTRIES = {};
  LAYOUTS = {};
  EFFECTS = {};
  SECTIONS = {};
}

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * Create a test Express app with core routes
 * @param {Object} options - Configuration options
 * @returns {Express.Application} - Testable Express app
 */
function createTestApp(options = {}) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Password validation endpoint
  app.post('/api/auth/validate',
    body('password').isString().notEmpty().withMessage('Password is required'),
    handleValidationErrors,
    (req, res) => {
      const { password } = req.body;
      const adminPassword = process.env.BLINK_ADMIN_PASSWORD;

      if (!adminPassword) {
        return res.status(500).json({ success: false, error: 'Server configuration error' });
      }

      if (password === adminPassword) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, error: 'Invalid password' });
      }
    }
  );

  // Dev password validation
  app.post('/api/auth/validate-dev',
    body('password').isString().notEmpty().withMessage('Password is required'),
    handleValidationErrors,
    (req, res) => {
      const { password } = req.body;
      const devPassword = process.env.BLINK_DEV_PASSWORD;

      if (!devPassword) {
        return res.status(500).json({ success: false, error: 'Server configuration error' });
      }

      if (password === devPassword) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, error: 'Invalid password' });
      }
    }
  );

  // Industries endpoint
  app.get('/api/industries', (req, res) => {
    res.json(INDUSTRIES);
  });

  // Single industry endpoint
  app.get('/api/industry/:key', (req, res) => {
    const industry = INDUSTRIES[req.params.key];
    if (industry) {
      res.json(industry);
    } else {
      res.status(404).json({ error: 'Industry not found' });
    }
  });

  // Layouts endpoint
  app.get('/api/layouts', (req, res) => {
    res.json(LAYOUTS);
  });

  // Effects endpoint
  app.get('/api/effects', (req, res) => {
    res.json(EFFECTS);
  });

  // Sections endpoint
  app.get('/api/sections', (req, res) => {
    res.json(SECTIONS);
  });

  // Build prompt endpoint (mock)
  app.post('/api/build-prompt', (req, res) => {
    const { industry, layout } = req.body;
    if (!industry) {
      return res.status(400).json({ error: 'Industry is required' });
    }
    res.json({
      prompt: `Mock prompt for ${industry}`,
      industry,
      layout: layout || 'default',
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Test app error:', err);
    res.status(500).json({ error: err.message });
  });

  return app;
}

/**
 * Create a test request helper using supertest
 * @param {Express.Application} app - Express app
 * @returns {supertest.SuperTest} - Supertest instance
 */
function createTestRequest(app) {
  const request = require('supertest');
  return request(app);
}

module.exports = {
  createTestApp,
  createTestRequest,
  INDUSTRIES,
  LAYOUTS,
  EFFECTS,
  SECTIONS,
};
