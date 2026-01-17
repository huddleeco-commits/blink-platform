/**
 * SectionToggles Component
 * Checkboxes for toggling page sections on/off
 */

import React from 'react';
import { PAGE_SECTIONS } from '../constants';

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
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  rowEnabled: {
    background: 'rgba(16, 185, 129, 0.08)'
  },
  checkbox: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: '2px solid #444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s ease'
  },
  checkboxChecked: {
    background: '#10b981',
    borderColor: '#10b981'
  },
  checkmark: {
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  content: {
    flex: 1
  },
  sectionName: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#fff'
  },
  sectionDescription: {
    fontSize: '0.75rem',
    color: '#888',
    marginTop: '2px'
  },
  defaultBadge: {
    fontSize: '0.65rem',
    padding: '2px 6px',
    background: 'rgba(99, 102, 241, 0.2)',
    color: '#6366f1',
    borderRadius: '4px',
    fontWeight: '600'
  },
  toggleAll: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px'
  },
  toggleBtn: {
    padding: '6px 12px',
    fontSize: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: '#888',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

export default function SectionToggles({
  pageType,
  selectedSections,
  onSectionsChange
}) {
  // Get sections for this page type, fallback to default
  const sections = PAGE_SECTIONS[pageType] || PAGE_SECTIONS.default;

  const toggleSection = (sectionId) => {
    if (selectedSections.includes(sectionId)) {
      onSectionsChange(selectedSections.filter(s => s !== sectionId));
    } else {
      onSectionsChange([...selectedSections, sectionId]);
    }
  };

  const selectAll = () => {
    onSectionsChange(sections.map(s => s.id));
  };

  const selectDefaults = () => {
    onSectionsChange(sections.filter(s => s.default).map(s => s.id));
  };

  const clearAll = () => {
    onSectionsChange([]);
  };

  return (
    <div style={styles.container}>
      <label style={styles.label}>Sections</label>
      <div style={styles.toggleAll}>
        <button style={styles.toggleBtn} onClick={selectDefaults}>
          Defaults
        </button>
        <button style={styles.toggleBtn} onClick={selectAll}>
          Select All
        </button>
        <button style={styles.toggleBtn} onClick={clearAll}>
          Clear
        </button>
      </div>
      <div style={styles.grid}>
        {sections.map(section => {
          const isSelected = selectedSections.includes(section.id);

          return (
            <div
              key={section.id}
              style={{
                ...styles.row,
                ...(isSelected ? styles.rowEnabled : {})
              }}
              onClick={() => toggleSection(section.id)}
            >
              <div style={{
                ...styles.checkbox,
                ...(isSelected ? styles.checkboxChecked : {})
              }}>
                {isSelected && <span style={styles.checkmark}>✓</span>}
              </div>
              <div style={styles.content}>
                <div style={styles.sectionName}>
                  {section.name}
                  {section.default && !isSelected && (
                    <span style={{ ...styles.defaultBadge, marginLeft: '8px' }}>
                      Recommended
                    </span>
                  )}
                </div>
                <div style={styles.sectionDescription}>{section.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
