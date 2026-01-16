/**
 * ErrorStep Screen
 * Generic error display screen
 */

import React from 'react';
import { styles, errorStepStyles } from '../styles';

export function ErrorStep({ error, onRetry, onReset }) {
  // Handle both string errors and structured { title, message, hint } objects
  const errorTitle = typeof error === 'object' ? error.title : 'Something went wrong';
  const errorMessage = typeof error === 'object' ? error.message : error;
  const errorHint = typeof error === 'object' ? error.hint : null;

  return (
    <div style={styles.errorContainer}>
      <div style={styles.errorIcon}>❌</div>
      <h2 style={styles.errorTitle}>{errorTitle}</h2>
      <p style={styles.errorMessage}>{errorMessage}</p>
      {errorHint && (
        <p style={errorStepStyles.hint}>{errorHint}</p>
      )}
      <div style={styles.errorActions}>
        <button style={styles.primaryBtn} onClick={onRetry}>Try Again</button>
        <button style={styles.secondaryBtn} onClick={onReset}>Start Over</button>
      </div>
    </div>
  );
}
