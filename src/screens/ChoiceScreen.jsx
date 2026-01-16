/**
 * ChoiceScreen
 * Shown when input is ambiguous - lets user choose between site or tools
 */

import React from 'react';

const choiceStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 20px',
    minHeight: '70vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px'
  },
  detected: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    borderRadius: '50px',
    marginBottom: '24px',
    border: '1px solid #bbf7d0'
  },
  detectedIcon: {
    fontSize: '2rem'
  },
  detectedText: {
    fontSize: '1.1rem',
    color: '#166534'
  },
  detectedIndustry: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  title: {
    fontSize: '2.25rem',
    fontWeight: '800',
    marginBottom: '12px',
    color: '#1f2937'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#6b7280',
    maxWidth: '500px'
  },
  cardsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
    width: '100%',
    maxWidth: '700px',
    marginBottom: '32px'
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 24px',
    background: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center'
  },
  cardSite: {
    ':hover': {
      borderColor: '#3b82f6',
      boxShadow: '0 8px 30px rgba(59, 130, 246, 0.15)'
    }
  },
  cardTools: {
    ':hover': {
      borderColor: '#f59e0b',
      boxShadow: '0 8px 30px rgba(245, 158, 11, 0.15)'
    }
  },
  cardIcon: {
    fontSize: '3.5rem',
    marginBottom: '16px'
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '12px',
    color: '#1f2937'
  },
  cardDescription: {
    fontSize: '0.95rem',
    color: '#6b7280',
    lineHeight: '1.6',
    marginBottom: '24px',
    minHeight: '60px'
  },
  cardButton: {
    padding: '14px 32px',
    fontSize: '1rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  cardButtonSite: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white'
  },
  cardButtonTools: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: 'white'
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  footerNote: {
    fontSize: '0.9rem',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  backBtn: {
    padding: '10px 20px',
    fontSize: '0.9rem',
    background: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#6b7280'
  }
};

export function ChoiceScreen({ detectedIndustry, industryDisplay, industryIcon, originalInput, onChooseSite, onChooseTools, onBack }) {
  return (
    <div style={choiceStyles.container}>
      <div style={choiceStyles.header}>
        <div style={choiceStyles.detected}>
          <span style={choiceStyles.detectedIcon}>{industryIcon}</span>
          <span style={choiceStyles.detectedText}>
            We detected: <span style={choiceStyles.detectedIndustry}>{industryDisplay}</span>
          </span>
        </div>
        <h1 style={choiceStyles.title}>What would you like to build?</h1>
        <p style={choiceStyles.subtitle}>
          Choose how you want to power your {industryDisplay?.toLowerCase()} business
        </p>
      </div>

      <div style={choiceStyles.cardsContainer}>
        {/* Full Website Card */}
        <div
          style={choiceStyles.card}
          onClick={onChooseSite}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={choiceStyles.cardIcon}>🌐</span>
          <h2 style={choiceStyles.cardTitle}>Full Website</h2>
          <p style={choiceStyles.cardDescription}>
            Complete site with multiple pages, backend integration, and admin dashboard
          </p>
          <button style={{...choiceStyles.cardButton, ...choiceStyles.cardButtonSite}}>
            Build Site →
          </button>
        </div>

        {/* Business Tools Card */}
        <div
          style={choiceStyles.card}
          onClick={onChooseTools}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#f59e0b';
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(245, 158, 11, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={choiceStyles.cardIcon}>🧰</span>
          <h2 style={choiceStyles.cardTitle}>Business Tools</h2>
          <p style={choiceStyles.cardDescription}>
            Calculators, forms, trackers & utilities tailored for {industryDisplay?.toLowerCase() || 'your industry'}
          </p>
          <button style={{...choiceStyles.cardButton, ...choiceStyles.cardButtonTools}}>
            See Tools →
          </button>
        </div>
      </div>

      <div style={choiceStyles.footer}>
        <p style={choiceStyles.footerNote}>
          ⚡ Both include branding & customization options
        </p>
        <button style={choiceStyles.backBtn} onClick={onBack}>
          ← Start Over
        </button>
      </div>
    </div>
  );
}
