/**
 * PasswordGate Component
 * Main entry password gate for application access
 */

import React, { useState, useEffect } from 'react';
import { TAGLINES } from '../../constants';

export function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex(prev => (prev + 1) % TAGLINES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isValidating) return;

    setIsValidating(true);
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        localStorage.setItem('blink_access', 'granted');
        onUnlock();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.logoContainer}>
          <img src="/blink-logo.webp" alt="Blink" style={styles.logoImage} onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
        <h1 style={styles.title}>BLINK</h1>
        <p style={styles.tagline} key={taglineIndex}>{TAGLINES[taglineIndex]}</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={{ ...styles.inputWrapper, ...(shake ? { animation: 'shake 0.5s' } : {}), ...(error ? { borderColor: 'rgba(239, 68, 68, 0.5)' } : {}) }}>
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(false); }} placeholder="Enter access code" style={styles.input} autoFocus />
          </div>
          {error && <p style={styles.errorText}>Invalid access code</p>}
          <button type="submit" style={styles.submitBtn}><span>Enter</span><span style={styles.btnArrow}>→</span></button>
        </form>
        <p style={styles.hint}>Private beta access only</p>
      </div>
      <div style={styles.bgGlow1}></div>
      <div style={styles.bgGlow2}></div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', position: 'relative', overflow: 'hidden' },
  content: { textAlign: 'center', zIndex: 10, padding: '40px' },
  logoContainer: { marginBottom: '24px' },
  logoImage: { height: '100px', width: 'auto', objectFit: 'contain' },
  title: { fontSize: '56px', fontWeight: '800', letterSpacing: '12px', background: 'linear-gradient(135deg, #fff 0%, #888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px' },
  tagline: { fontSize: '18px', color: '#22c55e', marginBottom: '48px', fontWeight: '500', minHeight: '27px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '320px', margin: '0 auto' },
  inputWrapper: { position: 'relative' },
  input: { width: '100%', padding: '18px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '16px', textAlign: 'center', letterSpacing: '4px', outline: 'none' },
  errorText: { color: '#ef4444', fontSize: '14px', margin: '0' },
  submitBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px 32px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  btnArrow: { fontSize: '18px' },
  hint: { marginTop: '32px', fontSize: '13px', color: '#444' },
  bgGlow1: { position: 'absolute', top: '-200px', right: '-200px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)', borderRadius: '50%' },
  bgGlow2: { position: 'absolute', bottom: '-200px', left: '-200px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', borderRadius: '50%' },
};
