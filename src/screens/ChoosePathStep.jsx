/**
 * ChoosePathStep Screen
 * Initial path selection - website or tool
 */

import React from 'react';
import { styles } from '../styles';

export function ChoosePathStep({ onSelect, isDevUnlocked }) {
  // Tool cards data
  const popularTools = [
    { id: 'invoice-generator', icon: '📄', name: 'Invoice Generator', desc: 'Create professional invoices' },
    { id: 'qr-generator', icon: '📱', name: 'QR Code Generator', desc: 'Generate QR codes instantly' },
    { id: 'calculator', icon: '🧮', name: 'Calculator', desc: 'Build custom calculators' },
    { id: 'countdown', icon: '⏱️', name: 'Countdown Timer', desc: 'Event countdowns & timers' },
  ];

  return (
    <div style={styles.stepContainer}>
      <h1 style={styles.heroTitle}>What do you want to create?</h1>
      <p style={styles.heroSubtitle}>Build a complete website or a quick utility tool</p>

      {/* Section 1: Build a Business */}
      <div style={styles.sectionContainer}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>🏢</span> Build a Business Website
        </h2>
        <p style={styles.sectionSubtitle}>Multi-page websites with full functionality</p>

        <div style={styles.pathGrid}>
          {/* Rebuild Path - Dev Locked */}
          <button style={{...styles.pathCard, ...(!isDevUnlocked ? styles.pathCardLocked : {})}} onClick={() => onSelect('rebuild')}>
            {!isDevUnlocked && <div style={styles.lockedBadge}>🔒 DEV</div>}
            <div style={styles.pathIcon}>🔄</div>
            <h2 style={styles.pathTitle}>REBUILD</h2>
            <p style={styles.pathDesc}>I have a website already</p>
            <p style={styles.pathDetails}>
              Paste your URL and we'll extract your content, colors, and create a modern upgrade.
            </p>
            <div style={styles.pathArrow}>→</div>
          </button>

          {/* Quick Path - Featured & Open */}
          <button style={{...styles.pathCard, ...styles.pathCardFeatured}} onClick={() => onSelect('quick')}>
            <div style={styles.featuredBadge}>FASTEST</div>
            <div style={styles.pathIcon}>⚡</div>
            <h2 style={styles.pathTitle}>QUICK START</h2>
            <p style={styles.pathDesc}>Tell me what you're building</p>
            <p style={styles.pathDetails}>
              Just describe your business. AI picks the perfect template and you customize.
            </p>
            <div style={styles.pathArrow}>→</div>
          </button>

          {/* Reference Path - Dev Locked */}
          <button style={{...styles.pathCard, ...(!isDevUnlocked ? styles.pathCardLocked : {})}} onClick={() => onSelect('reference')}>
            {!isDevUnlocked && <div style={styles.lockedBadge}>🔒 DEV</div>}
            <div style={styles.pathIcon}>🎨</div>
            <h2 style={styles.pathTitle}>INSPIRED</h2>
            <p style={styles.pathDesc}>Show me sites I like</p>
            <p style={styles.pathDetails}>
              Add websites you love. AI extracts the best parts and builds something unique.
            </p>
            <div style={styles.pathArrow}>→</div>
          </button>

          {/* Orchestrator Path */}
          <button style={{...styles.pathCard, ...styles.pathCardOrchestrator}} onClick={() => onSelect('orchestrator')}>
            <div style={styles.newBadge}>AI</div>
            <div style={styles.pathIcon}>🧠</div>
            <h2 style={styles.pathTitle}>ORCHESTRATOR</h2>
            <p style={styles.pathDesc}>One sentence. Done.</p>
            <p style={styles.pathDetails}>
              Just describe your business in a single sentence. AI handles everything.
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
          >
            <div style={styles.toolIcon}>✨</div>
            <h3 style={styles.toolName}>Custom Tool</h3>
            <p style={styles.toolDesc}>Describe any tool you need</p>
            <div style={styles.customBadge}>AI-POWERED</div>
          </button>
        </div>
      </div>

      <p style={styles.bottomHint}>
        💡 All paths take under 2 minutes. Tools are single-page, websites are multi-page.
      </p>
    </div>
  );
}
