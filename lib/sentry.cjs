/**
 * Sentry Error Tracking - Backend Configuration (v10+ API)
 *
 * Captures and reports errors from the Express server.
 * Initialize this FIRST before any other imports in server.cjs
 */

const Sentry = require('@sentry/node');

const SENTRY_DSN = process.env.SENTRY_DSN_BACKEND || 'https://de5e55821bd5e5480eee0479be445674@o4510709184593920.ingest.us.sentry.io/4510715157872640';

let isInitialized = false;

/**
 * Initialize Sentry for backend error tracking
 */
function initSentry(app) {
  // Only initialize if we have a DSN and not in test mode
  if (!SENTRY_DSN || process.env.NODE_ENV === 'test') {
    console.log('   ⚠️ Sentry disabled (no DSN or test mode)');
    return;
  }

  // Prevent double initialization
  if (isInitialized) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    // Filter out noisy errors
    ignoreErrors: [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'socket hang up',
    ],

    // Add extra context to errors
    beforeSend(event, hint) {
      // Don't send errors in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
        console.log('🔴 Sentry Error (dev mode - not sent):', hint?.originalException?.message || event.message);
        return null;
      }
      return event;
    },
  });

  isInitialized = true;
  console.log('   ✅ Sentry initialized (backend)');
}

/**
 * Express request handler middleware for Sentry (v10+ compatible)
 * Add this BEFORE all routes to capture request context
 */
function sentryRequestHandler() {
  return (req, res, next) => {
    // Add request context to Sentry scope
    Sentry.withScope((scope) => {
      scope.setTag('url', req.url);
      scope.setTag('method', req.method);
      scope.setExtra('headers', {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      });
      scope.setExtra('query', req.query);
    });

    // Add breadcrumb for request
    Sentry.addBreadcrumb({
      category: 'http',
      message: `${req.method} ${req.url}`,
      level: 'info',
    });

    next();
  };
}

/**
 * Express error handler middleware for Sentry (v10+ compatible)
 * Add this AFTER all routes but BEFORE your custom error handler
 */
function sentryErrorHandler() {
  return (err, req, res, next) => {
    // Capture the error with request context
    Sentry.withScope((scope) => {
      scope.setTag('url', req.url);
      scope.setTag('method', req.method);
      scope.setExtra('body', req.body);
      scope.setExtra('query', req.query);
      scope.setExtra('params', req.params);

      // Set error status
      if (err.status) {
        scope.setTag('status_code', err.status);
      }

      Sentry.captureException(err);
    });

    next(err);
  };
}

/**
 * Capture an exception manually
 */
function captureException(error, context = {}) {
  if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
    console.error('🔴 Error captured:', error.message, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context.user) {
      scope.setUser(context.user);
    }
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture a message manually
 */
function captureMessage(message, level = 'info', context = {}) {
  if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
    console.log(`🔵 Sentry message (${level}):`, message);
    return;
  }

  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    Sentry.captureMessage(message);
  });
}

/**
 * Set user context for error tracking
 */
function setUser(user) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
function addBreadcrumb(message, category = 'custom', data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

module.exports = {
  initSentry,
  sentryRequestHandler,
  sentryErrorHandler,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  Sentry,
};
