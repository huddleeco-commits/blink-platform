/**
 * DevPasswordModal Component
 * Developer access password modal
 */

import React, { useState } from 'react';

export function DevPasswordModal({ onSuccess, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isValidating) return;

    setIsValidating(true);
    try {
      const response = await fetch('/api/auth/validate-dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        localStorage.setItem('blink_dev_access', 'granted');
        onSuccess();
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Dev auth error:', err);
      setError(true);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>🔒 Developer Access</h2>
        <p style={styles.subtitle}>This feature is in development mode</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(false); }} placeholder="Developer password" style={{ ...styles.input, ...(error ? { borderColor: '#ef4444' } : {}) }} autoFocus />
          {error && <p style={styles.error}>Invalid password</p>}
          <div style={styles.buttons}>
            <button type="button" onClick={onCancel} style={styles.cancelBtn}>Cancel</button>
            <button type="submit" style={styles.submitBtn}>Unlock</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1a1a1f', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%', border: '1px solid rgba(255,255,255,0.1)' },
  title: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '8px', textAlign: 'center' },
  subtitle: { color: '#888', fontSize: '14px', marginBottom: '24px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  input: { width: '100%', padding: '14px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', textAlign: 'center' },
  error: { color: '#ef4444', fontSize: '13px', textAlign: 'center', margin: 0 },
  buttons: { display: 'flex', gap: '12px' },
  cancelBtn: { flex: 1, padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: '#888', fontSize: '15px', cursor: 'pointer' },
  submitBtn: { flex: 1, padding: '14px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
};
