/**
 * GeneratingStep Screen
 * Shows progress during website generation
 */

import React, { useState, useEffect } from 'react';
import { styles } from '../styles';

// Component-specific styles
const genStepStyles = {
  stepList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '24px',
    maxWidth: '400px',
    width: '100%'
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    borderRadius: '8px',
    transition: 'all 0.3s ease'
  },
  stepIcon: {
    fontSize: '16px',
    width: '24px',
    textAlign: 'center'
  },
  stepLabel: {
    fontSize: '14px',
    flex: 1
  },
  activeDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22c55e',
    animation: 'pulse 1.5s infinite'
  },
  timeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '400px',
    marginTop: '12px',
    fontSize: '14px'
  },
  elapsed: {
    color: '#888'
  },
  remaining: {
    color: '#22c55e'
  },
  cancelBtn: {
    marginTop: '24px',
    padding: '12px 32px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

export function GeneratingStep({ steps, currentStep, startTime, projectName, onCancel }) {
  const [elapsed, setElapsed] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Estimate: ~15 seconds per step
  const estimatedTotal = steps.length * 15;
  const remaining = Math.max(0, estimatedTotal - elapsed);
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  return (
    <div style={styles.generatingContainer}>
      <div style={styles.generatingIcon}>⚡</div>
      <h2 style={styles.generatingTitle}>Building {projectName}...</h2>

      {/* Step list */}
      <div style={genStepStyles.stepList}>
        {steps.map((step, idx) => (
          <div
            key={step.id}
            style={{
              ...genStepStyles.stepItem,
              opacity: idx <= currentStep ? 1 : 0.4,
              background: idx === currentStep ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
              borderLeft: idx === currentStep ? '3px solid #22c55e' : '3px solid transparent'
            }}
          >
            <span style={genStepStyles.stepIcon}>
              {idx < currentStep ? '✓' : step.icon}
            </span>
            <span style={{
              ...genStepStyles.stepLabel,
              color: idx < currentStep ? '#22c55e' : idx === currentStep ? '#fff' : '#888'
            }}>
              {step.label}
            </span>
            {idx === currentStep && (
              <span style={genStepStyles.activeDot} />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div style={{...styles.progressFill, width: `${Math.min(progress, 100)}%`}} />
      </div>

      {/* Time display */}
      <div style={genStepStyles.timeRow}>
        <span style={genStepStyles.elapsed}>Elapsed: {formatTime(elapsed)}</span>
        <span style={genStepStyles.remaining}>~{formatTime(remaining)} remaining</span>
      </div>

      {/* Cancel button */}
      <button onClick={onCancel} style={genStepStyles.cancelBtn}>
        Cancel
      </button>
    </div>
  );
}
