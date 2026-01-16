/**
 * RecommendedToolsScreen
 * Display recommended tools for industry selection
 */

import React, { useState } from 'react';

const recStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    minHeight: '70vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#666'
  },
  industryBadge: {
    display: 'inline-block',
    padding: '8px 16px',
    background: '#fef3c7',
    borderRadius: '8px',
    fontSize: '0.9rem',
    color: '#92400e',
    marginTop: '12px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    width: '100%',
    maxWidth: '900px',
    marginBottom: '32px'
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  cardSelected: {
    borderColor: '#f59e0b',
    background: '#fffbeb',
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  cardIcon: {
    fontSize: '2rem'
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1f2937'
  },
  cardDescription: {
    fontSize: '0.9rem',
    color: '#6b7280',
    lineHeight: '1.5',
    flex: 1
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9'
  },
  buildBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem',
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  checkbox: {
    width: '22px',
    height: '22px',
    accentColor: '#f59e0b'
  },
  actions: {
    display: 'flex',
    gap: '16px',
    marginTop: '16px'
  },
  backBtn: {
    padding: '12px 24px',
    fontSize: '0.95rem',
    background: 'transparent',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#666'
  },
  buildSelectedBtn: {
    padding: '12px 32px',
    fontSize: '0.95rem',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '60px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #f59e0b',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

export function RecommendedToolsScreen({ recommendations, industry, onSelectTool, onSelectMultiple, onBack, loading, onBuildSite, sharedContext }) {
  const [selectedTools, setSelectedTools] = useState([]);

  const toggleTool = (toolType) => {
    setSelectedTools(prev =>
      prev.includes(toolType)
        ? prev.filter(t => t !== toolType)
        : [...prev, toolType]
    );
  };

  const handleBuildSelected = () => {
    if (selectedTools.length === 1) {
      onSelectTool(selectedTools[0]);
    } else if (selectedTools.length > 1) {
      onSelectMultiple(selectedTools);
    }
  };

  if (loading) {
    return (
      <div style={recStyles.container}>
        <div style={recStyles.loading}>
          <div style={recStyles.spinner} />
          <p>Finding the best tools for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={recStyles.container}>
      <div style={recStyles.header}>
        <h1 style={recStyles.title}>Recommended Tools</h1>
        <p style={recStyles.subtitle}>
          Select one or more tools to build
        </p>
        {industry && (
          <span style={recStyles.industryBadge}>
            For: {industry.charAt(0).toUpperCase() + industry.slice(1)}
          </span>
        )}
      </div>

      <div style={recStyles.grid}>
        {recommendations.map((tool, index) => (
          <div
            key={tool.toolType || index}
            style={{
              ...recStyles.card,
              ...(selectedTools.includes(tool.toolType) ? recStyles.cardSelected : {})
            }}
            onClick={() => toggleTool(tool.toolType)}
          >
            <div style={recStyles.cardHeader}>
              <span style={recStyles.cardIcon}>{tool.icon || '🛠️'}</span>
              <span style={recStyles.cardTitle}>{tool.name}</span>
            </div>
            <p style={recStyles.cardDescription}>{tool.description}</p>
            <div style={recStyles.cardFooter}>
              <input
                type="checkbox"
                checked={selectedTools.includes(tool.toolType)}
                onChange={() => toggleTool(tool.toolType)}
                style={recStyles.checkbox}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                style={recStyles.buildBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTool(tool.toolType, tool.name);
                }}
              >
                Build This
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={recStyles.actions}>
        <button style={recStyles.backBtn} onClick={onBack}>
          ← Back
        </button>
        {selectedTools.length > 0 && (
          <button
            style={{...recStyles.buildSelectedBtn, opacity: selectedTools.length === 0 ? 0.5 : 1}}
            onClick={handleBuildSelected}
            disabled={selectedTools.length === 0}
          >
            Build {selectedTools.length} Tool{selectedTools.length !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Cross-link to website */}
      {onBuildSite && (
        <div style={{
          marginTop: '40px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          width: '100%',
          maxWidth: '600px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '20px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            borderRadius: '16px',
            border: '1px solid #bfdbfe'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🌐</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
                Want a full website for your {industry || 'business'} too?
              </div>
              <button
                onClick={onBuildSite}
                style={{
                  padding: '8px 20px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Build Website →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
