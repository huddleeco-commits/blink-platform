/**
 * DeployingStep Screen
 * Shows progress during deployment to cloud
 */

import React, { useState, useEffect } from 'react';
import { styles } from '../styles';

// Component-specific styles
const deployStepStyles = {
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    maxWidth: '400px',
    margin: '20px auto'
  },
  progressBar: {
    flex: 1,
    height: '8px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #22c55e)',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  progressText: {
    color: '#22c55e',
    fontWeight: 600,
    fontSize: '14px',
    minWidth: '40px'
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
  },
  // Service status grid styles
  servicesGrid: {
    width: '100%',
    maxWidth: '500px',
    margin: '24px auto 0',
    padding: '20px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)'
  },
  servicesTitle: {
    color: '#888',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center',
    fontWeight: 500
  },
  servicesCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px'
  },
  serviceCard: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '10px',
    padding: '16px',
    border: '2px solid',
    borderColor: 'rgba(255,255,255,0.1)',
    transition: 'all 0.3s ease',
    textAlign: 'center'
  },
  serviceIcon: {
    fontSize: '24px',
    marginBottom: '8px'
  },
  serviceName: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '6px'
  },
  serviceStatus: {
    fontSize: '12px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  }
};

export function DeployingStep({ status, projectName, startTime, onCancel, railwayServices }) {
  const [dots, setDots] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Use startTime prop if available, otherwise count from 0
    const timeInterval = setInterval(() => {
      if (startTime) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      } else {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(timeInterval);
    };
  }, [startTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Get progress from status object (0-100)
  const progress = typeof status === 'object' ? (status.progress || 0) : 0;

  // Calculate remaining time based on progress (estimated 90 seconds total)
  const estimatedTotal = 90;
  const estimatedRemaining = progress > 0
    ? Math.max(0, Math.round((100 - progress) / progress * elapsedTime))
    : estimatedTotal - elapsedTime;

  // Get current status display
  const statusDisplay = typeof status === 'object'
    ? `${status.icon || '🚀'} ${status.status || 'Deploying...'}`
    : (status || 'Initializing...');

  // Service card display helper
  const getServiceStatus = (service) => {
    if (!service) return { icon: '⏳', label: 'Pending', color: '#666' };
    if (service.isDeployed) return { icon: '✅', label: 'Online', color: '#22c55e' };
    if (service.isFailed) return { icon: '❌', label: 'Failed', color: '#ef4444' };
    if (service.isBuilding) return { icon: '🔨', label: 'Building', color: '#f59e0b' };
    if (service.status === 'DEPLOYING') return { icon: '🚀', label: 'Deploying', color: '#3b82f6' };
    return { icon: '⏳', label: service.status || 'Pending', color: '#666' };
  };

  // Service cards configuration
  const serviceCards = [
    { key: 'postgres', name: 'Database', icon: '🗄️' },
    { key: 'backend', name: 'Backend', icon: '⚙️' },
    { key: 'frontend', name: 'Frontend', icon: '🌐' },
    { key: 'admin', name: 'Admin', icon: '🔧' }
  ];

  return (
    <div style={styles.deployingContainer}>
      <div style={styles.deployingIcon}>🚀</div>
      <h2 style={styles.deployingTitle}>Deploying {projectName}{dots}</h2>
      <p style={styles.deployingSubtitle}>Your site is going live on the internet</p>

      {/* Progress Bar */}
      <div style={deployStepStyles.progressContainer}>
        <div style={deployStepStyles.progressBar}>
          <div style={{
            ...deployStepStyles.progressFill,
            width: `${progress}%`
          }} />
        </div>
        <span style={deployStepStyles.progressText}>{progress}%</span>
      </div>

      <div style={styles.deployingStatusCard}>
        <div style={styles.deployingSpinner}></div>
        <span style={styles.deployingStatus}>{statusDisplay}</span>
      </div>

      {/* Railway Services Status Grid */}
      {railwayServices && (
        <div style={deployStepStyles.servicesGrid}>
          <p style={deployStepStyles.servicesTitle}>Service Status:</p>
          <div style={deployStepStyles.servicesCards}>
            {serviceCards.map(({ key, name, icon }) => {
              const service = railwayServices[key];
              const status = getServiceStatus(service);
              return (
                <div key={key} style={{
                  ...deployStepStyles.serviceCard,
                  borderColor: status.color
                }}>
                  <div style={deployStepStyles.serviceIcon}>{icon}</div>
                  <div style={deployStepStyles.serviceName}>{name}</div>
                  <div style={{ ...deployStepStyles.serviceStatus, color: status.color }}>
                    {status.icon} {status.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={styles.deployingTimeline}>
        <div style={styles.timelineItem}>
          <span style={styles.timelineIcon}>⏱️</span>
          <span>Elapsed: {formatTime(elapsedTime)}</span>
        </div>
        <div style={styles.timelineItem}>
          <span style={styles.timelineIcon}>🎯</span>
          <span>~{formatTime(Math.max(0, estimatedRemaining))} remaining</span>
        </div>
      </div>

      {/* Cancel button */}
      <button onClick={onCancel} style={deployStepStyles.cancelBtn}>
        Cancel Deployment
      </button>

      <div style={styles.deployingWarning}>
        <span style={styles.warningIcon}>⚠️</span>
        <span>Cancelling may leave partial resources created</span>
      </div>
    </div>
  );
}
