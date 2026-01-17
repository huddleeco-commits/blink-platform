/**
 * LayoutPicker Component
 * Visual layout selection grid for page customization
 */

import React from 'react';
import { PAGE_LAYOUTS } from '../constants';

const styles = {
  container: {
    marginBottom: '24px'
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '12px',
    display: 'block'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '12px'
  },
  option: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 12px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '2px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center'
  },
  optionHover: {
    background: 'rgba(255, 255, 255, 0.05)'
  },
  optionSelected: {
    borderColor: '#6366f1',
    background: 'rgba(99, 102, 241, 0.1)'
  },
  optionIcon: {
    fontSize: '2rem',
    marginBottom: '8px'
  },
  optionName: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#fff',
    marginBottom: '4px'
  },
  optionDescription: {
    fontSize: '0.75rem',
    color: '#888',
    lineHeight: '1.3'
  },
  suggested: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: '#10b981',
    color: '#fff',
    fontSize: '0.65rem',
    padding: '2px 6px',
    borderRadius: '8px',
    fontWeight: '600'
  },
  optionWrapper: {
    position: 'relative'
  }
};

export default function LayoutPicker({
  pageType,
  selectedLayout,
  onLayoutChange,
  suggestedLayout = null
}) {
  // Get layouts for this page type, fallback to default
  const layouts = PAGE_LAYOUTS[pageType] || PAGE_LAYOUTS.default;

  return (
    <div style={styles.container}>
      <label style={styles.label}>Layout</label>
      <div style={styles.grid}>
        {layouts.map(layout => {
          const isSelected = selectedLayout === layout.id;
          const isSuggested = suggestedLayout === layout.id;

          return (
            <div key={layout.id} style={styles.optionWrapper}>
              {isSuggested && !isSelected && (
                <span style={styles.suggested}>AI Pick</span>
              )}
              <div
                style={{
                  ...styles.option,
                  ...(isSelected ? styles.optionSelected : {})
                }}
                onClick={() => onLayoutChange(layout.id)}
              >
                <span style={styles.optionIcon}>{layout.icon}</span>
                <span style={styles.optionName}>{layout.name}</span>
                <span style={styles.optionDescription}>{layout.description}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
