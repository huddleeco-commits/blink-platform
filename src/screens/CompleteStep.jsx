/**
 * CompleteStep Screen
 * Shows success after website generation with deployment options
 */

import React from 'react';
import { API_BASE } from '../constants';
import { styles } from '../styles';

export function CompleteStep({ result, projectData, onReset, blinkCount, onDeploy, deployReady, onAddTools, industry }) {
  const blinkMessage = blinkCount <= 1
    ? "Less than a blink! ⚡"
    : `Only ${blinkCount} blinks! 👁️`;

  const handleOpenFolder = async () => {
    try {
      await fetch(`${API_BASE}/api/open-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: result?.path })
      });
    } catch (err) {
      console.error('Failed to open folder:', err);
    }
  };

  const handleOpenVSCode = async () => {
    try {
      await fetch(`${API_BASE}/api/open-vscode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: result?.path })
      });
    } catch (err) {
      console.error('Failed to open VS Code:', err);
    }
  };

  return (
    <div style={styles.completeContainer}>
      <div style={styles.completeIcon}>✅</div>
      <h1 style={styles.completeTitle}>{projectData.businessName} is Ready!</h1>
      <p style={styles.completeSubtitle}>Your website + admin dashboard have been generated</p>

      <div style={styles.blinkResult}>
        {blinkMessage}
        <span style={styles.blinkSubtext}>That's roughly {((blinkCount || 1) * 4)} seconds</span>
      </div>

      <div style={styles.resultCard}>
        <div style={styles.resultRow}>
          <span>📁 Location</span>
          <span style={styles.resultPath}>{result?.path || 'generated-projects/'}</span>
        </div>
        <div style={styles.resultRow}>
          <span>📄 Pages</span>
          <span>{projectData.selectedPages.length} pages</span>
        </div>
        <div style={styles.resultRow}>
          <span>🎨 Style</span>
          <span>{projectData.industry?.name || 'Custom'}</span>
        </div>
        <div style={styles.resultRow}>
          <span>🎛️ Admin</span>
          <span style={{color: '#22c55e'}}>✓ Dashboard Included</span>
        </div>
        <div style={styles.resultRow}>
          <span>🧠 brain.json</span>
          <span style={{color: '#22c55e'}}>✓ Config Generated</span>
        </div>
      </div>

      <div style={styles.nextSteps}>
        <h3 style={{marginBottom: '16px'}}>🚀 Quick Start:</h3>

        <p style={{fontSize: '13px', color: '#888', marginBottom: '8px'}}>Backend API:</p>
        <div style={styles.codeBlock}>
          <code>cd "{result?.path || 'your-project'}/backend"</code>
          <code>npm install && cp .env.example .env && npm run dev</code>
        </div>

        <p style={{fontSize: '13px', color: '#888', marginBottom: '8px', marginTop: '16px'}}>Customer Website:</p>
        <div style={styles.codeBlock}>
          <code>cd "{result?.path || 'your-project'}/frontend"</code>
          <code>npm install && npm run dev</code>
        </div>

        <p style={{fontSize: '13px', color: '#888', marginBottom: '8px', marginTop: '16px'}}>Admin Dashboard:</p>
        <div style={styles.codeBlock}>
          <code>cd "{result?.path || 'your-project'}/admin"</code>
          <code>npm install && npm run dev</code>
        </div>

        <div style={{marginTop: '20px', padding: '16px', background: 'rgba(34,197,94,0.1)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)'}}>
          <p style={{fontSize: '14px', fontWeight: '600', marginBottom: '8px'}}>🔗 Endpoints (after starting):</p>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px'}}>
            <span style={{color: '#888'}}>Customer Site:</span>
            <span style={{color: '#22c55e'}}>http://localhost:5173</span>
            <span style={{color: '#888'}}>Admin Panel:</span>
            <span style={{color: '#22c55e'}}>http://localhost:5174</span>
            <span style={{color: '#888'}}>API Server:</span>
            <span style={{color: '#22c55e'}}>http://localhost:5000</span>
            <span style={{color: '#888'}}>Health Check:</span>
            <span style={{color: '#3b82f6'}}>http://localhost:5000/api/health</span>
            <span style={{color: '#888'}}>Brain Config:</span>
            <span style={{color: '#3b82f6'}}>http://localhost:5000/api/brain</span>
          </div>
        </div>
      </div>

      {/* Deploy Section */}
      {deployReady && (
        <div style={styles.deploySection}>
          <div style={styles.deployDivider}>
            <span style={styles.deployDividerText}>Ready to go live?</span>
          </div>
          <button style={styles.deployBtn} onClick={onDeploy}>
            🚀 Deploy to {projectData?.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'your-site'}.be1st.io
          </button>
          <p style={styles.deployHint}>One click. No terminal. Live in ~2 minutes.</p>
        </div>
      )}

      <div style={styles.completeActions}>
        <button style={styles.actionBtn} onClick={handleOpenFolder}>📂 Open Folder</button>
        <button style={styles.actionBtn} onClick={handleOpenVSCode}>💻 Open in VS Code</button>
        <button style={styles.actionBtnSecondary} onClick={onReset}>+ Create Another</button>
      </div>

      {/* Cross-link to tools */}
      {onAddTools && (
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
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            borderRadius: '16px',
            border: '1px solid #fcd34d'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🔧</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                Want tools for your {industry || 'business'} too?
              </div>
              <div style={{ fontSize: '0.85rem', color: '#a16207', marginBottom: '8px' }}>
                Calculators, forms, trackers & more
              </div>
              <button
                onClick={onAddTools}
                style={{
                  padding: '10px 24px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Add Business Tools →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
