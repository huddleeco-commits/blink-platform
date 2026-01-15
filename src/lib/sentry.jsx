/**
 * Sentry Error Tracking - Stub Implementation
 *
 * This provides a minimal implementation for development.
 * In production, replace with actual @sentry/react integration.
 */

import React from 'react';

// Initialize Sentry (no-op in development)
export const initSentry = () => {
  // In development, we just log that Sentry would be initialized
  if (import.meta.env.DEV) {
    console.log('[Sentry] Development mode - error tracking disabled');
  }
};

// Capture exception (logs to console in dev)
export const captureException = (error, context = {}) => {
  console.error('[Sentry] Exception captured:', error, context);
};

// Add breadcrumb (logs to console in dev)
export const addBreadcrumb = (breadcrumb) => {
  if (import.meta.env.DEV) {
    console.log('[Sentry] Breadcrumb:', breadcrumb);
  }
};

// Simple Error Boundary wrapper
export const SentryErrorBoundary = ({ children, fallback, showDialog }) => {
  return children;
};

// Error Fallback component
export const ErrorFallback = ({ error, resetError }) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0f',
      color: '#fff',
      padding: '40px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Something went wrong</h1>
        <p style={{ color: '#888', marginBottom: '24px' }}>
          {error?.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={resetError}
          style={{
            padding: '12px 24px',
            background: '#22c55e',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
};
