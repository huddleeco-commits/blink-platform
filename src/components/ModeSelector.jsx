/**
 * ModeSelector Component
 * Toggle between Quick Mode and Full Control Mode
 */

import React from 'react';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '500px',
    margin: '0 auto'
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: '8px'
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  option: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  optionSelected: {
    borderColor: '#6366f1',
    background: 'rgba(99, 102, 241, 0.1)'
  },
  optionQuick: {
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  optionQuickSelected: {
    borderColor: '#10b981',
    background: 'rgba(16, 185, 129, 0.1)'
  },
  optionIcon: {
    fontSize: '2rem',
    lineHeight: 1
  },
  optionContent: {
    flex: 1
  },
  optionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  optionDescription: {
    fontSize: '0.9rem',
    color: '#888',
    lineHeight: '1.4'
  },
  badge: {
    fontSize: '0.7rem',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  badgeFast: {
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#10b981'
  },
  badgeControl: {
    background: 'rgba(99, 102, 241, 0.2)',
    color: '#6366f1'
  },
  features: {
    marginTop: '12px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  feature: {
    fontSize: '0.75rem',
    padding: '4px 10px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '20px',
    color: '#aaa'
  },
  radio: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid #444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '4px'
  },
  radioSelected: {
    borderColor: '#6366f1'
  },
  radioQuickSelected: {
    borderColor: '#10b981'
  },
  radioDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#6366f1'
  },
  radioDotQuick: {
    background: '#10b981'
  }
};

export default function ModeSelector({ selectedMode, onModeChange }) {
  const modes = [
    {
      id: 'quick',
      icon: '⚡',
      title: 'Quick Mode',
      badge: 'Fast',
      description: 'AI handles everything. Describe your business and get a complete website in seconds.',
      features: ['90-second generation', 'AI picks layout & style', 'One-click customization'],
      isQuick: true
    },
    {
      id: 'full-control',
      icon: '🎛️',
      title: 'Full Control Mode',
      badge: 'Detailed',
      description: 'You decide everything with AI as your brainstorm partner. Perfect for specific visions.',
      features: ['Page-by-page customization', 'Layout selection', 'AI suggestions on demand'],
      isQuick: false
    }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.title}>How do you want to build?</div>
      <div style={styles.optionsContainer}>
        {modes.map(mode => {
          const isSelected = selectedMode === mode.id;
          return (
            <div
              key={mode.id}
              style={{
                ...styles.option,
                ...(mode.isQuick ? styles.optionQuick : {}),
                ...(isSelected ? (mode.isQuick ? styles.optionQuickSelected : styles.optionSelected) : {})
              }}
              onClick={() => onModeChange(mode.id)}
            >
              <div
                style={{
                  ...styles.radio,
                  ...(isSelected ? (mode.isQuick ? styles.radioQuickSelected : styles.radioSelected) : {})
                }}
              >
                {isSelected && (
                  <div style={{
                    ...styles.radioDot,
                    ...(mode.isQuick ? styles.radioDotQuick : {})
                  }} />
                )}
              </div>
              <span style={styles.optionIcon}>{mode.icon}</span>
              <div style={styles.optionContent}>
                <div style={styles.optionTitle}>
                  {mode.title}
                  <span style={{
                    ...styles.badge,
                    ...(mode.isQuick ? styles.badgeFast : styles.badgeControl)
                  }}>
                    {mode.badge}
                  </span>
                </div>
                <div style={styles.optionDescription}>{mode.description}</div>
                <div style={styles.features}>
                  {mode.features.map((feature, idx) => (
                    <span key={idx} style={styles.feature}>{feature}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
