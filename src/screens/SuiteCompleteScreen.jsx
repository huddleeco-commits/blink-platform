/**
 * SuiteCompleteScreen
 * Shows success after tool suite generation with preview and download options
 */

import React, { useState, useEffect } from 'react';
import { API_BASE } from '../constants';

const scStyles = {
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
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#666'
  },
  suiteInfo: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '24px'
  },
  infoBadge: {
    padding: '8px 16px',
    background: '#f5f3ff',
    borderRadius: '8px',
    fontSize: '0.85rem',
    color: '#6d28d9'
  },
  toolsList: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '24px'
  },
  toolChip: {
    padding: '6px 12px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  previewSection: {
    width: '100%',
    maxWidth: '900px',
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
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: 'white',
    fontWeight: '600'
  }
};

export function SuiteCompleteScreen({ suiteResult, onReset, onBuildAnother }) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const suite = suiteResult?.suite || {};
  const html = suiteResult?.html || '';
  const projectPath = suiteResult?.project?.path;
  const zipFilename = suiteResult?.zipFilename;

  // Create blob URL for iframe preview
  const previewUrl = html ? URL.createObjectURL(new Blob([html], { type: 'text/html' })) : null;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDownloadZip = () => {
    if (!suiteResult?.project?.name) return;
    window.open(`${API_BASE}/api/orchestrate/download-suite/${suiteResult.project.name}`, '_blank');
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
    <div style={scStyles.container}>
      <div style={scStyles.header}>
        <div style={scStyles.icon}>🧰</div>
        <h1 style={scStyles.title}>{suite.businessName || 'Tool Suite'} is Ready!</h1>
        <p style={scStyles.subtitle}>
          Your {suite.toolCount}-tool suite with {suite.organization} layout
        </p>
      </div>

      <div style={scStyles.suiteInfo}>
        <span style={scStyles.infoBadge}>
          {suite.toolCount} Tools
        </span>
        <span style={scStyles.infoBadge}>
          Layout: {suite.organization}
        </span>
        <span style={scStyles.infoBadge}>
          {suiteResult?.files?.length || 0} Files
        </span>
      </div>

      <div style={scStyles.toolsList}>
        {suite.tools?.map((tool, i) => (
          <span key={i} style={scStyles.toolChip}>
            <span>{tool.icon}</span>
            {tool.name}
          </span>
        ))}
      </div>

      {html && (
        <div style={scStyles.previewSection}>
          <div style={scStyles.previewHeader}>
            <span style={scStyles.previewLabel}>Live Preview (Index Page)</span>
            <button
              style={scStyles.previewToggle}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
          </div>
          {showPreview && previewUrl && (
            <div style={scStyles.previewFrame}>
              <iframe
                src={previewUrl}
                style={scStyles.iframe}
                title="Suite Preview"
                sandbox="allow-scripts allow-forms"
              />
            </div>
          )}
        </div>
      )}

      <div style={scStyles.actionsGrid}>
        {zipFilename && (
          <div
            style={scStyles.actionCard}
            onClick={handleDownloadZip}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#8b5cf6';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <span style={scStyles.actionIcon}>📦</span>
            <span style={scStyles.actionLabel}>Download ZIP</span>
            <span style={scStyles.actionHint}>All files packaged</span>
          </div>
        )}

        <div
          style={scStyles.actionCard}
          onClick={handleCopyCode}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#8b5cf6';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <span style={scStyles.actionIcon}>{copied ? '✅' : '📋'}</span>
          <span style={scStyles.actionLabel}>{copied ? 'Copied!' : 'Copy Index'}</span>
          <span style={scStyles.actionHint}>Index HTML</span>
        </div>

        {projectPath && (
          <div
            style={scStyles.actionCard}
            onClick={handleOpenFolder}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#8b5cf6';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <span style={scStyles.actionIcon}>📂</span>
            <span style={scStyles.actionLabel}>Open Folder</span>
            <span style={scStyles.actionHint}>View all files</span>
          </div>
        )}
      </div>

      <div style={scStyles.secondaryActions}>
        <button style={scStyles.secondaryBtn} onClick={onReset}>
          ← Back to Home
        </button>
        <button style={scStyles.primaryBtn} onClick={onBuildAnother}>
          + Build Another Suite
        </button>
      </div>
    </div>
  );
}
