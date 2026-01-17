/**
 * ChoosePathStep Screen
 * Simplified path selection - 3 website modes + tools
 *
 * WEBSITE MODES (symmetrical row of 3):
 * - INSTANT (was Orchestrator) - AI-powered one sentence
 * - INSPIRED - Start from designs you like
 * - CUSTOM (was Full Control) - Configure every detail
 *
 * TOOL MODES:
 * - Preset tools grid
 * - Custom Tool (AI-powered)
 *
 * DEV TOOLBOX:
 * - Hidden gear icon in footer
 * - Password protected (abc123)
 * - Contains Quick Start + dev tools
 */

import React, { useState } from 'react';
import { styles } from '../styles';

export function ChoosePathStep({ onSelect, isDevUnlocked }) {
  const [showDevToolbox, setShowDevToolbox] = useState(false);
  const [devPassword, setDevPassword] = useState('');
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  // Tool cards data
  const popularTools = [
    { id: 'invoice-generator', icon: '📄', name: 'Invoice Generator', desc: 'Create professional invoices' },
    { id: 'qr-generator', icon: '📱', name: 'QR Code Generator', desc: 'Generate QR codes instantly' },
    { id: 'calculator', icon: '🧮', name: 'Calculator', desc: 'Build custom calculators' },
    { id: 'countdown', icon: '⏱️', name: 'Countdown Timer', desc: 'Event countdowns & timers' },
  ];

  // Handle dev toolbox unlock
  const handleDevUnlock = () => {
    if (devPassword === 'abc123') {
      setDevUnlocked(true);
      setShowPasswordPrompt(false);
      setShowDevToolbox(true);
    } else {
      alert('Invalid password');
    }
  };

  const handleGearClick = () => {
    if (devUnlocked) {
      setShowDevToolbox(!showDevToolbox);
    } else {
      setShowPasswordPrompt(true);
    }
  };

  // Custom styles for the new layout
  const customStyles = {
    // 3-column symmetrical grid for website modes
    websiteGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '24px',
      marginBottom: '32px',
      maxWidth: '1000px',
    },
    // Primary card (INSTANT) - featured
    primaryCard: {
      ...styles.pathCard,
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.1))',
      borderColor: 'rgba(102, 126, 234, 0.5)',
      borderWidth: '2px',
    },
    // Secondary card (INSPIRED)
    secondaryCard: {
      ...styles.pathCard,
      background: 'rgba(255, 255, 255, 0.03)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    // Tertiary card (CUSTOM)
    tertiaryCard: {
      ...styles.pathCard,
      background: 'rgba(99, 102, 241, 0.08)',
      borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    // Coming soon badge
    comingSoonBadge: {
      position: 'absolute',
      top: '-10px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #6b7280, #4b5563)',
      color: '#fff',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '700',
    },
    // AI badge for instant
    aiBadge: {
      position: 'absolute',
      top: '-10px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: '#fff',
      padding: '4px 14px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: '0.5px',
    },
    // Advanced badge for custom
    advancedBadge: {
      position: 'absolute',
      top: '-10px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: '#fff',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '700',
    },
    // Dev toolbox gear icon
    devGear: {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '32px',
      height: '32px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#555',
      transition: 'all 0.2s',
      opacity: 0.4,
    },
    // Dev toolbox panel
    devToolbox: {
      position: 'fixed',
      bottom: '60px',
      right: '20px',
      background: 'rgba(20, 20, 30, 0.98)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '12px',
      padding: '16px',
      width: '280px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      zIndex: 1000,
    },
    devToolboxTitle: {
      fontSize: '12px',
      fontWeight: '700',
      color: '#888',
      marginBottom: '12px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    devToolboxItem: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      padding: '12px',
      cursor: 'pointer',
      marginBottom: '8px',
      transition: 'all 0.2s',
    },
    devToolboxItemTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#fff',
      marginBottom: '4px',
    },
    devToolboxItemDesc: {
      fontSize: '11px',
      color: '#888',
    },
    // Password prompt modal
    passwordModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    },
    passwordBox: {
      background: 'rgba(30, 30, 40, 0.98)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '16px',
      padding: '24px',
      width: '300px',
      textAlign: 'center',
    },
    passwordInput: {
      width: '100%',
      padding: '12px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '14px',
      marginBottom: '12px',
      outline: 'none',
    },
    passwordBtn: {
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      marginRight: '8px',
    },
    cancelBtn: {
      background: 'transparent',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '8px',
      padding: '10px 20px',
      color: '#888',
      fontSize: '14px',
      cursor: 'pointer',
    },
  };

  return (
    <div style={styles.stepContainer}>
      <h1 style={styles.heroTitle}>What do you want to create?</h1>
      <p style={styles.heroSubtitle}>Build a complete website or a quick utility tool</p>

      {/* Section 1: Build a Website - 3 Symmetrical Cards */}
      <div style={styles.sectionContainer}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>🏢</span> Build a Website
        </h2>
        <p style={styles.sectionSubtitle}>Multi-page websites with full functionality</p>

        <div style={customStyles.websiteGrid}>
          {/* INSTANT (was Orchestrator) - Primary/Featured */}
          <button
            style={customStyles.primaryCard}
            onClick={() => onSelect('orchestrator')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={customStyles.aiBadge}>AI-POWERED</div>
            <div style={styles.pathIcon}>🚀</div>
            <h2 style={styles.pathTitle}>INSTANT</h2>
            <p style={styles.pathDesc}>Describe it, we build it</p>
            <p style={styles.pathDetails}>
              One sentence is all you need. AI infers your industry, pages, design, and builds everything.
            </p>
            <div style={styles.pathArrow}>→</div>
          </button>

          {/* INSPIRED - Secondary */}
          <button
            style={{...customStyles.secondaryCard, ...(isDevUnlocked ? {} : { opacity: 0.7 })}}
            onClick={() => isDevUnlocked ? onSelect('reference') : null}
            onMouseEnter={(e) => {
              if (isDevUnlocked) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {!isDevUnlocked && <div style={customStyles.comingSoonBadge}>COMING SOON</div>}
            <div style={styles.pathIcon}>🎨</div>
            <h2 style={styles.pathTitle}>INSPIRED</h2>
            <p style={styles.pathDesc}>Start from designs you like</p>
            <p style={styles.pathDetails}>
              Share websites you love. AI extracts colors, layouts, and vibes to create something unique.
            </p>
            <div style={styles.pathArrow}>→</div>
          </button>

          {/* CUSTOM (was Full Control) - Tertiary */}
          <button
            style={customStyles.tertiaryCard}
            onClick={() => onSelect('full-control')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={customStyles.advancedBadge}>ADVANCED</div>
            <div style={styles.pathIcon}>⚙️</div>
            <h2 style={styles.pathTitle}>CUSTOM</h2>
            <p style={styles.pathDesc}>Configure every detail</p>
            <p style={styles.pathDetails}>
              Page-by-page control. Choose layouts, sections, colors, and admin features. AI assists.
            </p>
            <div style={styles.pathArrow}>→</div>
          </button>
        </div>
      </div>

      {/* Section 2: Build a Tool */}
      <div style={styles.sectionContainer}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>🛠️</span> Build a Tool
        </h2>
        <p style={styles.sectionSubtitle}>Single-page utilities and micro-tools</p>

        <div style={styles.toolGrid}>
          {/* Popular Tool Cards */}
          {popularTools.map(tool => (
            <button
              key={tool.id}
              style={styles.toolCard}
              onClick={() => onSelect('tool', tool.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              <div style={styles.toolIcon}>{tool.icon}</div>
              <h3 style={styles.toolName}>{tool.name}</h3>
              <p style={styles.toolDesc}>{tool.desc}</p>
            </button>
          ))}

          {/* Custom Tool Card */}
          <button
            style={{...styles.toolCard, ...styles.toolCardCustom}}
            onClick={() => onSelect('tool-custom')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(168, 85, 247, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={styles.toolIcon}>✨</div>
            <h3 style={styles.toolName}>Custom Tool</h3>
            <p style={styles.toolDesc}>Describe any tool you need</p>
            <div style={styles.customBadge}>AI-POWERED</div>
          </button>
        </div>
      </div>

      <p style={styles.bottomHint}>
        💡 All paths take under 2 minutes. Pick INSTANT for speed, CUSTOM for control.
      </p>

      {/* Dev Toolbox Gear Icon */}
      <div
        style={customStyles.devGear}
        onClick={handleGearClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.4';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        }}
        title="Developer Tools"
      >
        ⚙️
      </div>

      {/* Dev Toolbox Panel */}
      {showDevToolbox && devUnlocked && (
        <div style={customStyles.devToolbox}>
          <div style={customStyles.devToolboxTitle}>🔧 Dev Toolbox</div>

          {/* Quick Start - Reliable Backup */}
          <div
            style={customStyles.devToolboxItem}
            onClick={() => onSelect('quick')}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
          >
            <div style={customStyles.devToolboxItemTitle}>⚡ Quick Start</div>
            <div style={customStyles.devToolboxItemDesc}>
              Original tested flow. Keyword-based detection. Reliable backup.
            </div>
          </div>

          {/* Rebuild Mode */}
          <div
            style={customStyles.devToolboxItem}
            onClick={() => onSelect('rebuild')}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
          >
            <div style={customStyles.devToolboxItemTitle}>🔄 Rebuild Mode</div>
            <div style={customStyles.devToolboxItemDesc}>
              Analyze existing site URL. Extract assets and content.
            </div>
          </div>

          {/* Close button */}
          <div
            style={{...customStyles.devToolboxItem, textAlign: 'center', marginBottom: 0}}
            onClick={() => setShowDevToolbox(false)}
          >
            <span style={{color: '#888', fontSize: '12px'}}>Close</span>
          </div>
        </div>
      )}

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div style={customStyles.passwordModal} onClick={() => setShowPasswordPrompt(false)}>
          <div style={customStyles.passwordBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={{color: '#fff', marginBottom: '16px'}}>🔒 Dev Access</h3>
            <input
              type="password"
              placeholder="Enter password"
              style={customStyles.passwordInput}
              value={devPassword}
              onChange={(e) => setDevPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDevUnlock()}
              autoFocus
            />
            <div>
              <button style={customStyles.passwordBtn} onClick={handleDevUnlock}>
                Unlock
              </button>
              <button style={customStyles.cancelBtn} onClick={() => setShowPasswordPrompt(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
