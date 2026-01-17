/**
 * Blink Landing Page
 * The first thing users see - explains value and drives signups
 */

import React, { useState, useEffect } from 'react';
import { Zap, Layers, Rocket, ShieldCheck, Clock, DollarSign, ArrowRight, Check, Play } from 'lucide-react';

// ============================================
// STYLES
// ============================================

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
    color: '#fff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    overflow: 'hidden'
  },

  // Nav
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '24px',
    fontWeight: '700',
    color: '#fff'
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  navLinks: {
    display: 'flex',
    gap: '32px',
    alignItems: 'center'
  },
  navLink: {
    color: '#a1a1aa',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'color 0.2s'
  },

  // Hero
  hero: {
    textAlign: 'center',
    padding: '80px 40px 60px',
    maxWidth: '1000px',
    margin: '0 auto',
    position: 'relative'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '100px',
    padding: '8px 16px',
    fontSize: '14px',
    color: '#a5b4fc',
    marginBottom: '24px'
  },
  headline: {
    fontSize: 'clamp(40px, 6vw, 72px)',
    fontWeight: '800',
    lineHeight: '1.1',
    marginBottom: '24px',
    background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  headlineAccent: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subheadline: {
    fontSize: '20px',
    color: '#a1a1aa',
    lineHeight: '1.6',
    maxWidth: '700px',
    margin: '0 auto 40px'
  },

  // CTA Buttons
  ctaContainer: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  primaryCta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 32px',
    fontSize: '17px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
  },
  secondaryCta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '16px 32px',
    fontSize: '17px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },

  // Stats
  statsBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '60px',
    padding: '40px 20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    marginTop: '60px',
    flexWrap: 'wrap'
  },
  stat: {
    textAlign: 'center'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },

  // How it works
  howItWorks: {
    padding: '80px 40px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  sectionTitle: {
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: '#6366f1',
    marginBottom: '12px',
    textAlign: 'center'
  },
  sectionHeadline: {
    fontSize: '40px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '60px'
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '32px'
  },
  stepCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '20px',
    padding: '32px',
    position: 'relative'
  },
  stepNumber: {
    position: 'absolute',
    top: '-16px',
    left: '32px',
    width: '32px',
    height: '32px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700'
  },
  stepIcon: {
    width: '48px',
    height: '48px',
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    color: '#6366f1'
  },
  stepTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '12px'
  },
  stepDesc: {
    fontSize: '15px',
    color: '#a1a1aa',
    lineHeight: '1.6'
  },

  // What you get
  whatYouGet: {
    padding: '80px 40px',
    background: 'rgba(99, 102, 241, 0.03)'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  featureCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start'
  },
  featureIcon: {
    width: '40px',
    height: '40px',
    background: 'rgba(34, 197, 94, 0.1)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#22c55e',
    flexShrink: 0
  },
  featureTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '4px'
  },
  featureDesc: {
    fontSize: '14px',
    color: '#71717a'
  },

  // Comparison
  comparison: {
    padding: '80px 40px',
    maxWidth: '900px',
    margin: '0 auto'
  },
  comparisonTable: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  comparisonHeader: {
    textAlign: 'left',
    padding: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#71717a',
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  comparisonCell: {
    padding: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    fontSize: '15px'
  },
  checkMark: {
    color: '#22c55e'
  },
  xMark: {
    color: '#ef4444'
  },

  // Final CTA
  finalCta: {
    padding: '100px 40px',
    textAlign: 'center',
    background: 'linear-gradient(180deg, transparent 0%, rgba(99, 102, 241, 0.05) 100%)'
  },
  finalHeadline: {
    fontSize: '48px',
    fontWeight: '700',
    marginBottom: '20px'
  },
  finalSubtext: {
    fontSize: '18px',
    color: '#a1a1aa',
    marginBottom: '40px'
  },

  // Footer
  footer: {
    padding: '40px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    textAlign: 'center',
    color: '#52525b',
    fontSize: '14px'
  }
};

// ============================================
// COMPONENT
// ============================================

export default function LandingPage({ onGetStarted }) {
  const [hoveredButton, setHoveredButton] = useState(null);

  const features = [
    { icon: <Layers size={20} />, title: 'Complete Backend', desc: 'Auth, payments, booking, inventory - all included' },
    { icon: <ShieldCheck size={20} />, title: 'Admin Dashboard', desc: '4-tier admin system: Lite, Standard, Pro, Enterprise' },
    { icon: <Rocket size={20} />, title: 'One-Click Deploy', desc: 'Live on the internet with custom domain in minutes' },
    { icon: <DollarSign size={20} />, title: 'Stripe Ready', desc: 'Accept payments immediately with built-in checkout' },
    { icon: <Clock size={20} />, title: 'Booking System', desc: 'Customer appointments and scheduling built-in' },
    { icon: <Zap size={20} />, title: '50+ Modules', desc: 'From CRM to inventory to loyalty programs' }
  ];

  const steps = [
    {
      icon: <Zap size={24} />,
      title: 'Describe Your Business',
      desc: 'Tell us what you do in plain English. "Mario\'s Pizza in Brooklyn with online ordering"'
    },
    {
      icon: <Layers size={24} />,
      title: 'We Build Everything',
      desc: 'AI generates your website, admin dashboard, payment system, and backend infrastructure.'
    },
    {
      icon: <Rocket size={24} />,
      title: 'Go Live Instantly',
      desc: 'One click deploys to production with your custom domain. Start taking orders today.'
    }
  ];

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <Zap size={22} color="#fff" />
          </div>
          BLINK
        </div>
        <div style={styles.navLinks}>
          <span style={styles.navLink}>Features</span>
          <span style={styles.navLink}>Pricing</span>
          <span style={styles.navLink}>Examples</span>
          <button
            style={{
              ...styles.primaryCta,
              padding: '10px 20px',
              fontSize: '14px'
            }}
            onClick={onGetStarted}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.badge}>
          <Zap size={14} />
          AI-Powered Business Generation
        </div>

        <h1 style={styles.headline}>
          Describe Your Business.<br />
          <span style={styles.headlineAccent}>We Build Everything.</span>
        </h1>

        <p style={styles.subheadline}>
          Not just a website. A complete business system with payments, booking,
          admin dashboard, and backend—deployed and running in 15 minutes.
        </p>

        <div style={styles.ctaContainer}>
          <button
            style={{
              ...styles.primaryCta,
              transform: hoveredButton === 'primary' ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredButton === 'primary'
                ? '0 8px 30px rgba(99, 102, 241, 0.5)'
                : '0 4px 20px rgba(99, 102, 241, 0.4)'
            }}
            onMouseEnter={() => setHoveredButton('primary')}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={onGetStarted}
          >
            Start Building Free
            <ArrowRight size={18} />
          </button>

          <button
            style={{
              ...styles.secondaryCta,
              background: hoveredButton === 'secondary'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.05)'
            }}
            onMouseEnter={() => setHoveredButton('secondary')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Play size={18} />
            Watch Demo
          </button>
        </div>

        {/* Stats */}
        <div style={styles.statsBar}>
          <div style={styles.stat}>
            <div style={styles.statValue}>50+</div>
            <div style={styles.statLabel}>Backend Modules</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>45</div>
            <div style={styles.statLabel}>Industries</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>15min</div>
            <div style={styles.statLabel}>To Live Site</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>$0</div>
            <div style={styles.statLabel}>To Start</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={styles.howItWorks}>
        <div style={styles.sectionTitle}>How It Works</div>
        <h2 style={styles.sectionHeadline}>Three Steps to a Complete Business</h2>

        <div style={styles.stepsGrid}>
          {steps.map((step, i) => (
            <div key={i} style={styles.stepCard}>
              <div style={styles.stepNumber}>{i + 1}</div>
              <div style={styles.stepIcon}>{step.icon}</div>
              <h3 style={styles.stepTitle}>{step.title}</h3>
              <p style={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What You Get */}
      <section style={styles.whatYouGet}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={styles.sectionTitle}>What's Included</div>
          <h2 style={{ ...styles.sectionHeadline, marginBottom: '40px' }}>
            Everything You Need to Run a Business
          </h2>

          <div style={styles.featuresGrid}>
            {features.map((feature, i) => (
              <div key={i} style={styles.featureCard}>
                <div style={styles.featureIcon}>{feature.icon}</div>
                <div>
                  <div style={styles.featureTitle}>{feature.title}</div>
                  <div style={styles.featureDesc}>{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section style={styles.comparison}>
        <div style={styles.sectionTitle}>The Difference</div>
        <h2 style={{ ...styles.sectionHeadline, marginBottom: '40px' }}>
          Blink vs Other Builders
        </h2>

        <table style={styles.comparisonTable}>
          <thead>
            <tr>
              <th style={styles.comparisonHeader}>Feature</th>
              <th style={styles.comparisonHeader}>Blink</th>
              <th style={styles.comparisonHeader}>Others</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Complete Backend', true, false],
              ['Admin Dashboard', true, false],
              ['Payment Processing', true, false],
              ['User Authentication', true, false],
              ['Booking System', true, false],
              ['One-Click Deploy', true, false],
              ['Custom Domain', true, true],
              ['AI Generation', true, true]
            ].map(([feature, blink, others], i) => (
              <tr key={i}>
                <td style={styles.comparisonCell}>{feature}</td>
                <td style={styles.comparisonCell}>
                  {blink ? <Check size={20} style={styles.checkMark} /> : '—'}
                </td>
                <td style={styles.comparisonCell}>
                  {others ? <Check size={20} style={styles.checkMark} /> : <span style={styles.xMark}>✕</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Final CTA */}
      <section style={styles.finalCta}>
        <h2 style={styles.finalHeadline}>Ready to Build Your Business?</h2>
        <p style={styles.finalSubtext}>
          Join thousands of businesses running on Blink. Start free today.
        </p>
        <button
          style={{
            ...styles.primaryCta,
            padding: '20px 48px',
            fontSize: '18px'
          }}
          onClick={onGetStarted}
        >
          Get Started Now
          <ArrowRight size={20} />
        </button>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2025 Blink by BE1st.io. All rights reserved.</p>
      </footer>
    </div>
  );
}
