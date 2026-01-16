/**
 * ToolCompleteScreen
 * Shows success after tool generation with preview and download options
 */

import React, { useState, useEffect } from 'react';
import { API_BASE } from '../constants';

const toolCompleteStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    minHeight: '80vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  icon: {
    fontSize: '4rem',
    marginBottom: '16px'
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#666'
  },
  previewSection: {
    width: '100%',
    maxWidth: '800px',
    marginBottom: '32px'
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  previewLabel: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#333'
  },
  previewToggle: {
    padding: '6px 12px',
    fontSize: '0.8rem',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  previewFrame: {
    width: '100%',
    height: '500px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'white'
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none'
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    width: '100%',
    maxWidth: '600px',
    marginBottom: '32px'
  },
  actionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 16px',
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  actionCardHover: {
    borderColor: '#10b981',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
  },
  actionIcon: {
    fontSize: '2rem',
    marginBottom: '8px'
  },
  actionLabel: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#333'
  },
  actionHint: {
    fontSize: '0.75rem',
    color: '#888',
    marginTop: '4px'
  },
  toolInfo: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '24px'
  },
  infoBadge: {
    padding: '8px 16px',
    background: '#f0fdf4',
    borderRadius: '8px',
    fontSize: '0.85rem',
    color: '#166534'
  },
  secondaryActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px'
  },
  secondaryBtn: {
    padding: '10px 20px',
    fontSize: '0.9rem',
    background: 'transparent',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#666'
  },
  primaryBtn: {
    padding: '10px 24px',
    fontSize: '0.9rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: 'white',
    fontWeight: '600'
  },
  // Test results styles
  testResultsSection: {
    width: '100%',
    maxWidth: '600px',
    marginBottom: '24px'
  },
  testResultsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  testResultsTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  testSummary: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0'
  },
  testStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.85rem'
  },
  testStatIcon: {
    fontSize: '1rem'
  },
  testStatValue: {
    fontWeight: '600'
  },
  testStatLabel: {
    color: '#666'
  },
  testDetailsToggle: {
    fontSize: '0.75rem',
    color: '#666',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  testDetailsList: {
    marginTop: '12px',
    padding: '12px',
    background: '#fafafa',
    borderRadius: '8px',
    fontSize: '0.8rem',
    maxHeight: '200px',
    overflowY: 'auto'
  },
  testDetailItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '4px 0',
    borderBottom: '1px solid #eee'
  },
  testDetailIcon: {
    flexShrink: 0
  },
  testDetailText: {
    color: '#555'
  }
};

export function ToolCompleteScreen({ toolResult, onReset, onBuildAnother, onBuildSite, industry }) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showTestDetails, setShowTestDetails] = useState(false);

  const tool = toolResult?.tool || {};
  const html = toolResult?.html || '';
  const projectPath = toolResult?.project?.path;
  const testResults = toolResult?.testResults || null;

  // Create blob URL for iframe preview
  const previewUrl = html ? URL.createObjectURL(new Blob([html], { type: 'text/html' })) : null;

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDownload = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(tool.name || 'tool').toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = async () => {
    if (!html) return;
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenFolder = async () => {
    if (!projectPath) return;
    try {
      await fetch(`${API_BASE}/api/open-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: projectPath })
      });
    } catch (err) {
      console.error('Failed to open folder:', err);
    }
  };

  return (
    <div style={toolCompleteStyles.container}>
      <div style={toolCompleteStyles.header}>
        <div style={toolCompleteStyles.icon}>{tool.icon || '🛠️'}</div>
        <h1 style={toolCompleteStyles.title}>{tool.name || 'Tool'} is Ready!</h1>
        <p style={toolCompleteStyles.subtitle}>
          Your tool is complete and works offline
        </p>
      </div>

      {/* Tool Info Badges */}
      <div style={toolCompleteStyles.toolInfo}>
        {tool.category && (
          <span style={toolCompleteStyles.infoBadge}>
            Category: {tool.category}
          </span>
        )}
        {tool.features && (
          <span style={toolCompleteStyles.infoBadge}>
            {tool.features.length} features
          </span>
        )}
        <span style={toolCompleteStyles.infoBadge}>
          Self-contained HTML
        </span>
      </div>

      {/* Test Results Section */}
      {testResults && (
        <div style={toolCompleteStyles.testResultsSection}>
          <div style={toolCompleteStyles.testResultsHeader}>
            <span style={toolCompleteStyles.testResultsTitle}>
              {testResults.allPassed ? '✅' : testResults.failed > 0 ? '❌' : '⚠️'}
              Validation Tests
            </span>
            {testResults.details && testResults.details.length > 0 && (
              <button
                style={toolCompleteStyles.testDetailsToggle}
                onClick={() => setShowTestDetails(!showTestDetails)}
              >
                {showTestDetails ? 'Hide details' : 'Show details'}
              </button>
            )}
          </div>
          <div style={toolCompleteStyles.testSummary}>
            <div style={toolCompleteStyles.testStat}>
              <span style={toolCompleteStyles.testStatIcon}>✅</span>
              <span style={{...toolCompleteStyles.testStatValue, color: '#10b981'}}>{testResults.passed}</span>
              <span style={toolCompleteStyles.testStatLabel}>passed</span>
            </div>
            {testResults.warnings > 0 && (
              <div style={toolCompleteStyles.testStat}>
                <span style={toolCompleteStyles.testStatIcon}>⚠️</span>
                <span style={{...toolCompleteStyles.testStatValue, color: '#f59e0b'}}>{testResults.warnings}</span>
                <span style={toolCompleteStyles.testStatLabel}>warnings</span>
              </div>
            )}
            {testResults.failed > 0 && (
              <div style={toolCompleteStyles.testStat}>
                <span style={toolCompleteStyles.testStatIcon}>❌</span>
                <span style={{...toolCompleteStyles.testStatValue, color: '#ef4444'}}>{testResults.failed}</span>
                <span style={toolCompleteStyles.testStatLabel}>failed</span>
              </div>
            )}
          </div>
          {showTestDetails && testResults.details && (
            <div style={toolCompleteStyles.testDetailsList}>
              {testResults.details.map((detail, idx) => (
                <div key={idx} style={toolCompleteStyles.testDetailItem}>
                  <span style={toolCompleteStyles.testDetailIcon}>
                    {detail.status === 'pass' ? '✅' : detail.status === 'warning' ? '⚠️' : '❌'}
                  </span>
                  <span style={toolCompleteStyles.testDetailText}>{detail.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Section */}
      {html && (
        <div style={toolCompleteStyles.previewSection}>
          <div style={toolCompleteStyles.previewHeader}>
            <span style={toolCompleteStyles.previewLabel}>Live Preview</span>
            <button
              style={toolCompleteStyles.previewToggle}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
          </div>
          {showPreview && previewUrl && (
            <div style={toolCompleteStyles.previewFrame}>
              <iframe
                src={previewUrl}
                style={toolCompleteStyles.iframe}
                title="Tool Preview"
                sandbox="allow-scripts allow-forms"
              />
            </div>
          )}
        </div>
      )}

      {/* Action Cards */}
      <div style={toolCompleteStyles.actionsGrid}>
        <div
          style={toolCompleteStyles.actionCard}
          onClick={handleDownload}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, toolCompleteStyles.actionCardHover)}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={toolCompleteStyles.actionIcon}>📥</span>
          <span style={toolCompleteStyles.actionLabel}>Download</span>
          <span style={toolCompleteStyles.actionHint}>Single HTML file</span>
        </div>

        <div
          style={toolCompleteStyles.actionCard}
          onClick={handleCopyCode}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, toolCompleteStyles.actionCardHover)}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={toolCompleteStyles.actionIcon}>{copied ? '✅' : '📋'}</span>
          <span style={toolCompleteStyles.actionLabel}>{copied ? 'Copied!' : 'Copy Code'}</span>
          <span style={toolCompleteStyles.actionHint}>To clipboard</span>
        </div>

        {projectPath && (
          <div
            style={toolCompleteStyles.actionCard}
            onClick={handleOpenFolder}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, toolCompleteStyles.actionCardHover)}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={toolCompleteStyles.actionIcon}>📂</span>
            <span style={toolCompleteStyles.actionLabel}>Open Folder</span>
            <span style={toolCompleteStyles.actionHint}>View files</span>
          </div>
        )}
      </div>

      {/* Secondary Actions */}
      <div style={toolCompleteStyles.secondaryActions}>
        <button style={toolCompleteStyles.secondaryBtn} onClick={onReset}>
          ← Back to Home
        </button>
        <button style={toolCompleteStyles.primaryBtn} onClick={onBuildAnother}>
          + Build Another Tool
        </button>
      </div>

      {/* Cross-link to website */}
      {onBuildSite && (
        <div style={{
          marginTop: '32px',
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
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            borderRadius: '16px',
            border: '1px solid #bfdbfe'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🌐</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
                Want a full website for your {industry || 'business'} too?
              </div>
              <div style={{ fontSize: '0.85rem', color: '#3b82f6', marginBottom: '8px' }}>
                Complete site with pages, backend & admin
              </div>
              <button
                onClick={onBuildSite}
                style={{
                  padding: '10px 24px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
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
