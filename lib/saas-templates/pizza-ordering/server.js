/**
 * Pizza Ordering SaaS - Backend Server
 * Complete Express server with all routes
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/admin', require('./routes/admin'));

// Stripe webhooks (raw body needed)
app.post('/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  require('./routes/webhooks').stripeWebhook
);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  // Don't leak error details in production
  const isDev = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    success: false,
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack })
  });
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
  try {
    // Test database connection
    const db = require('./database/db');
    await db.query('SELECT 1');
    console.log('✅ Database connected');

    // Verify Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('⚠️ STRIPE_SECRET_KEY not set - payments will not work');
    }

    // Start listening
    app.listen(PORT, () => {
      console.log(`🍕 Pizza Ordering API running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
