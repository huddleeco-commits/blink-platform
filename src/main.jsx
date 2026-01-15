import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Initialize Sentry error tracking FIRST
import { initSentry, SentryErrorBoundary, ErrorFallback } from './lib/sentry.jsx';
initSentry();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SentryErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error} resetError={resetError} />
      )}
      showDialog={false}
    >
      <App />
    </SentryErrorBoundary>
  </React.StrictMode>
);
