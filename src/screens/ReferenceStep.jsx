/**
 * ReferenceStep
 * Show sites you like for inspiration and element selection
 */

import React, { useState } from 'react';
import { API_BASE } from '../constants';
import { styles } from '../styles';

// Inspiration Step Styles
const inspiredStyles = {
  businessSection: {
    marginBottom: '24px'
  },
  businessRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  businessField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  fieldLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#888'
  },
  fieldInput: {
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#e4e4e4',
    fontSize: '15px',
    outline: 'none'
  },
  suggestionsSection: {
    marginBottom: '24px',
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  suggestionsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px'
  },
  suggestionsIcon: {
    fontSize: '16px'
  },
  suggestionsTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#888'
  },
  suggestionsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  suggestionChip: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  suggestionName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#e4e4e4'
  },
  suggestionDesc: {
    fontSize: '11px',
    color: '#666'
  },
  sitesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  siteCard: {
    padding: '20px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)'
  },
  siteCardPrimary: {
    border: '1px solid rgba(34, 197, 94, 0.3)',
    background: 'rgba(34, 197, 94, 0.03)'
  },
  siteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  siteHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  siteNumber: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e4e4e4'
  },
  primaryBadge: {
    padding: '2px 8px',
    background: 'rgba(34, 197, 94, 0.2)',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#22c55e'
  },
  siteHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  analyzedBadge: {
    padding: '2px 8px',
    background: 'rgba(34, 197, 94, 0.2)',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#22c55e'
  },
  removeSiteBtn: {
    width: '24px',
    height: '24px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#888',
    cursor: 'pointer',
    fontSize: '12px'
  },
  urlRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px'
  },
  urlInput: {
    flex: 1,
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#e4e4e4',
    fontSize: '14px',
    outline: 'none'
  },
  analyzeBtn: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  screenshotContainer: {
    marginBottom: '12px',
    borderRadius: '8px',
    overflow: 'hidden',
    background: 'rgba(0,0,0,0.3)',
    maxHeight: '200px'
  },
  screenshot: {
    width: '100%',
    height: 'auto',
    display: 'block'
  },
  analysisResults: {
    marginBottom: '12px'
  },
  colorsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px'
  },
  colorsLabel: {
    fontSize: '12px',
    color: '#888'
  },
  colorDot: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: '2px solid rgba(255,255,255,0.2)'
  },
  styleLabel: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: '#888',
    padding: '2px 8px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px'
  },
  priorityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  priorityLabel: {
    fontSize: '13px',
    color: '#888'
  },
  priorityToggle: {
    display: 'flex',
    gap: '8px'
  },
  priorityBtn: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#888',
    fontSize: '12px',
    cursor: 'pointer'
  },
  priorityBtnActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid #22c55e',
    color: '#22c55e'
  },
  priorityBtnSecondary: {
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: '#3b82f6'
  },
  elementsSection: {
    marginBottom: '12px'
  },
  elementsLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
    marginBottom: '8px'
  },
  elementsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  elementChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    color: '#888',
    fontSize: '11px',
    cursor: 'pointer'
  },
  elementChipActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid #22c55e',
    color: '#22c55e'
  },
  notesInput: {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#e4e4e4',
    fontSize: '13px',
    resize: 'none',
    outline: 'none'
  },
  addSiteBtn: {
    padding: '16px',
    background: 'transparent',
    border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: '12px',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer'
  },
  footer: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  continueBtn: {
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  // Preview styles
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  previewSection: {
    padding: '20px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)'
  },
  previewSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px'
  },
  previewIcon: {
    fontSize: '20px'
  },
  previewTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#e4e4e4'
  },
  previewSource: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: '#666'
  },
  colorPalette: {
    display: 'flex',
    gap: '16px'
  },
  colorBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px'
  },
  colorSwatch: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    border: '2px solid rgba(255,255,255,0.1)'
  },
  colorLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#e4e4e4'
  },
  colorValue: {
    fontSize: '11px',
    color: '#666',
    fontFamily: 'monospace'
  },
  styleDescription: {
    color: '#888',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  elementsBreakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  elementItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '8px'
  },
  elementIcon: {
    fontSize: '16px'
  },
  elementName: {
    flex: 1,
    fontSize: '14px',
    color: '#e4e4e4'
  },
  elementFrom: {
    fontSize: '12px',
    color: '#666'
  },
  elementPrimaryTag: {
    padding: '2px 6px',
    background: 'rgba(34, 197, 94, 0.2)',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#22c55e'
  },
  sourcesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px'
  },
  sourceCard: {
    borderRadius: '8px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  sourceThumb: {
    width: '100%',
    height: '80px',
    objectFit: 'cover'
  },
  sourceInfo: {
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  sourceUrl: {
    flex: 1,
    fontSize: '12px',
    color: '#e4e4e4'
  },
  sourcePrimary: {
    padding: '2px 6px',
    background: 'rgba(34, 197, 94, 0.2)',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#22c55e'
  },
  previewFooter: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backToEditBtn: {
    padding: '14px 24px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer'
  }
};

export function ReferenceStep({ projectData, updateProject, onContinue, onBack }) {
  // Sites with enhanced structure
  const [sites, setSites] = useState([{
    url: '',
    notes: '',
    analysis: null,
    screenshotUrl: null,
    isPrimary: true,
    elements: [] // What elements to grab from this site
  }]);
  const [analyzing, setAnalyzing] = useState(null);
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessName, setBusinessName] = useState('');

  // Sub-step: 'input' | 'preview'
  const [subStep, setSubStep] = useState('input');

  // Element options - what can be grabbed from each site
  const elementOptions = [
    { id: 'colors', label: 'Color Scheme', icon: '🎨', description: 'Use this site\'s color palette' },
    { id: 'typography', label: 'Typography', icon: '🔤', description: 'Font choices and text styling' },
    { id: 'layout', label: 'Layout Structure', icon: '📐', description: 'How sections are arranged' },
    { id: 'hero', label: 'Hero Section', icon: '🦸', description: 'The main banner/header area' },
    { id: 'navigation', label: 'Navigation', icon: '🧭', description: 'Menu and nav bar style' },
    { id: 'cards', label: 'Card Design', icon: '🃏', description: 'How content cards look' },
    { id: 'spacing', label: 'Whitespace', icon: '📏', description: 'Breathing room between elements' },
    { id: 'cta', label: 'CTAs & Buttons', icon: '👆', description: 'Call-to-action button styles' },
    { id: 'footer', label: 'Footer', icon: '🦶', description: 'Bottom section design' },
    { id: 'overall', label: 'Overall Vibe', icon: '💫', description: 'General aesthetic and feeling' },
  ];

  // Industry-specific site suggestions
  const industrySuggestions = {
    'dental': [
      { name: 'Tend', url: 'hellotend.com', desc: 'Modern dental experience' },
      { name: 'Aspen Dental', url: 'aspendental.com', desc: 'Friendly, approachable' },
      { name: 'One Medical', url: 'onemedical.com', desc: 'Clean healthcare design' },
    ],
    'restaurant': [
      { name: 'Sweetgreen', url: 'sweetgreen.com', desc: 'Fresh, modern food brand' },
      { name: 'Chipotle', url: 'chipotle.com', desc: 'Bold, confident' },
      { name: 'Shake Shack', url: 'shakeshack.com', desc: 'Fun, approachable' },
    ],
    'saas': [
      { name: 'Stripe', url: 'stripe.com', desc: 'Premium tech aesthetic' },
      { name: 'Linear', url: 'linear.app', desc: 'Clean, minimal SaaS' },
      { name: 'Notion', url: 'notion.so', desc: 'Friendly, spacious' },
    ],
    'default': [
      { name: 'Stripe', url: 'stripe.com', desc: 'Premium, professional' },
      { name: 'Airbnb', url: 'airbnb.com', desc: 'Warm, trustworthy' },
      { name: 'Linear', url: 'linear.app', desc: 'Clean, modern' },
      { name: 'Vercel', url: 'vercel.com', desc: 'Bold, developer-focused' },
    ]
  };

  const getSuggestions = () => {
    const industry = projectData.industryKey || 'default';
    return industrySuggestions[industry] || industrySuggestions['default'];
  };

  const toggleElement = (siteIndex, elementId) => {
    const newSites = [...sites];
    const currentElements = newSites[siteIndex].elements || [];
    newSites[siteIndex].elements = currentElements.includes(elementId)
      ? currentElements.filter(e => e !== elementId)
      : [...currentElements, elementId];
    setSites(newSites);
  };

  const setPrimary = (index) => {
    const newSites = sites.map((site, i) => ({
      ...site,
      isPrimary: i === index
    }));
    setSites(newSites);
  };

  const addSite = () => {
    if (sites.length < 3) {
      setSites([...sites, {
        url: '',
        notes: '',
        analysis: null,
        screenshotUrl: null,
        isPrimary: false,
        elements: []
      }]);
    }
  };

  const updateSite = (index, field, value) => {
    const newSites = [...sites];
    newSites[index] = { ...newSites[index], [field]: value };
    setSites(newSites);
  };

  const removeSite = (index) => {
    if (sites.length > 1) {
      let newSites = sites.filter((_, i) => i !== index);
      // If we removed the primary, make first one primary
      if (sites[index].isPrimary && newSites.length > 0) {
        newSites[0].isPrimary = true;
      }
      setSites(newSites);
    }
  };

  const getScreenshotUrl = (url) => {
    if (!url) return null;
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) cleanUrl = 'https://' + cleanUrl;
    return `https://image.thum.io/get/width/400/crop/300/png/${cleanUrl}`;
  };

  const analyzeSite = async (index) => {
    const site = sites[index];
    if (!site.url.trim()) return;

    setAnalyzing(index);

    try {
      let cleanUrl = site.url.trim();
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
      }

      // Set screenshot URL immediately
      const newSites = [...sites];
      newSites[index].screenshotUrl = getScreenshotUrl(cleanUrl);
      setSites(newSites);

      const response = await fetch(`${API_BASE}/api/analyze-site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl })
      });

      const data = await response.json();

      if (data.success) {
        const updatedSites = [...sites];
        updatedSites[index] = {
          ...updatedSites[index],
          analysis: data.analysis,
          screenshotUrl: getScreenshotUrl(cleanUrl),
          // Auto-select some elements based on analysis
          elements: updatedSites[index].isPrimary
            ? ['colors', 'typography', 'overall']
            : ['cards', 'spacing']
        };
        setSites(updatedSites);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(null);
    }
  };

  const useSuggestion = (suggestion) => {
    const newSites = [...sites];
    const emptyIndex = newSites.findIndex(s => !s.url.trim());
    if (emptyIndex >= 0) {
      newSites[emptyIndex].url = suggestion.url;
      setSites(newSites);
    } else if (newSites.length < 3) {
      setSites([...newSites, {
        url: suggestion.url,
        notes: '',
        analysis: null,
        screenshotUrl: null,
        isPrimary: false,
        elements: []
      }]);
    }
  };

  const goToPreview = () => {
    setSubStep('preview');
  };

  const handleContinue = () => {
    // Find primary site for colors
    const primarySite = sites.find(s => s.isPrimary && s.analysis?.colors);

    if (primarySite?.analysis?.colors) {
      updateProject({
        colors: {
          primary: primarySite.analysis.colors.primary || projectData.colors.primary,
          secondary: primarySite.analysis.colors.secondary || projectData.colors.secondary,
          accent: primarySite.analysis.colors.accent || projectData.colors.accent,
          text: projectData.colors.text,
          background: projectData.colors.background
        },
        colorMode: 'from-site'
      });
    }

    // Build enhanced reference data
    const enhancedSites = sites.filter(s => s.url.trim()).map(s => ({
      url: s.url,
      notes: s.notes,
      isPrimary: s.isPrimary,
      elements: s.elements || [],
      elementLabels: (s.elements || []).map(id => elementOptions.find(o => o.id === id)?.label).filter(Boolean),
      analysis: s.analysis
    }));

    updateProject({
      referenceSites: enhancedSites,
      businessName: businessName || businessDescription || projectData.businessName,
      tagline: businessDescription || projectData.tagline
    });

    onContinue();
  };

  const validSites = sites.filter(s => s.url.trim()).length;
  const analyzedSites = sites.filter(s => s.analysis).length;

  // Get blend preview summary
  const getBlendSummary = () => {
    const primary = sites.find(s => s.isPrimary);
    const secondary = sites.filter(s => !s.isPrimary && s.url.trim());

    let summary = {
      colors: null,
      typography: null,
      style: null,
      elements: []
    };

    // Colors from primary or first analyzed
    if (primary?.analysis?.colors) {
      summary.colors = primary.analysis.colors;
    }

    // Style from primary
    if (primary?.analysis) {
      summary.style = primary.analysis.style;
      summary.typography = primary.analysis.fonts;
    }

    // Collect all selected elements
    sites.forEach((site, idx) => {
      (site.elements || []).forEach(el => {
        const opt = elementOptions.find(o => o.id === el);
        if (opt) {
          summary.elements.push({
            element: opt.label,
            icon: opt.icon,
            from: site.url.replace('https://', '').split('/')[0],
            isPrimary: site.isPrimary
          });
        }
      });
    });

    return summary;
  };

  // INPUT SUBSTEP
  if (subStep === 'input') {
    return (
      <div style={styles.stepContainer}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>

        <h1 style={styles.stepTitle}>🎨 Get Inspired</h1>
        <p style={styles.stepSubtitle}>Show us sites you love - we'll blend their best elements</p>

        {/* Business Info */}
        <div style={inspiredStyles.businessSection}>
          <div style={inspiredStyles.businessRow}>
            <div style={inspiredStyles.businessField}>
              <label style={inspiredStyles.fieldLabel}>Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your Business Name"
                style={inspiredStyles.fieldInput}
              />
            </div>
            <div style={inspiredStyles.businessField}>
              <label style={inspiredStyles.fieldLabel}>What do you do?</label>
              <input
                type="text"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="e.g., Modern dental clinic in Austin"
                style={inspiredStyles.fieldInput}
              />
            </div>
          </div>
        </div>

        {/* Quick Suggestions */}
        <div style={inspiredStyles.suggestionsSection}>
          <div style={inspiredStyles.suggestionsHeader}>
            <span style={inspiredStyles.suggestionsIcon}>💡</span>
            <span style={inspiredStyles.suggestionsTitle}>Popular Inspirations</span>
          </div>
          <div style={inspiredStyles.suggestionsList}>
            {getSuggestions().map(s => (
              <button
                key={s.url}
                style={inspiredStyles.suggestionChip}
                onClick={() => useSuggestion(s)}
              >
                <span style={inspiredStyles.suggestionName}>{s.name}</span>
                <span style={inspiredStyles.suggestionDesc}>{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sites Input */}
        <div style={inspiredStyles.sitesContainer}>
          {sites.map((site, index) => (
            <div
              key={index}
              style={{
                ...inspiredStyles.siteCard,
                ...(site.isPrimary ? inspiredStyles.siteCardPrimary : {})
              }}
            >
              {/* Site Header */}
              <div style={inspiredStyles.siteHeader}>
                <div style={inspiredStyles.siteHeaderLeft}>
                  <span style={inspiredStyles.siteNumber}>Site {index + 1}</span>
                  {site.isPrimary && <span style={inspiredStyles.primaryBadge}>Primary</span>}
                </div>
                <div style={inspiredStyles.siteHeaderRight}>
                  {site.analysis && <span style={inspiredStyles.analyzedBadge}>✓ Analyzed</span>}
                  {sites.length > 1 && (
                    <button style={inspiredStyles.removeSiteBtn} onClick={() => removeSite(index)}>✕</button>
                  )}
                </div>
              </div>

              {/* URL Input */}
              <div style={inspiredStyles.urlRow}>
                <input
                  type="text"
                  value={site.url}
                  onChange={(e) => updateSite(index, 'url', e.target.value)}
                  placeholder="stripe.com"
                  style={inspiredStyles.urlInput}
                />
                {site.url && !site.analysis && (
                  <button
                    onClick={() => analyzeSite(index)}
                    disabled={analyzing === index}
                    style={inspiredStyles.analyzeBtn}
                  >
                    {analyzing === index ? '⏳' : '🔍'} {analyzing === index ? 'Analyzing...' : 'Analyze'}
                  </button>
                )}
              </div>

              {/* Screenshot Preview */}
              {site.screenshotUrl && (
                <div style={inspiredStyles.screenshotContainer}>
                  <img
                    src={site.screenshotUrl}
                    alt="Site preview"
                    style={inspiredStyles.screenshot}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Analysis Results */}
              {site.analysis && (
                <div style={inspiredStyles.analysisResults}>
                  {/* Extracted Colors */}
                  {site.analysis.colors && (
                    <div style={inspiredStyles.colorsRow}>
                      <span style={inspiredStyles.colorsLabel}>Colors:</span>
                      <div style={{...inspiredStyles.colorDot, background: site.analysis.colors.primary}} />
                      <div style={{...inspiredStyles.colorDot, background: site.analysis.colors.secondary}} />
                      <div style={{...inspiredStyles.colorDot, background: site.analysis.colors.accent}} />
                      {site.analysis.style && (
                        <span style={inspiredStyles.styleLabel}>{site.analysis.style}</span>
                      )}
                    </div>
                  )}

                  {/* Primary/Secondary Toggle */}
                  <div style={inspiredStyles.priorityRow}>
                    <span style={inspiredStyles.priorityLabel}>Use as:</span>
                    <div style={inspiredStyles.priorityToggle}>
                      <button
                        style={{
                          ...inspiredStyles.priorityBtn,
                          ...(site.isPrimary ? inspiredStyles.priorityBtnActive : {})
                        }}
                        onClick={() => setPrimary(index)}
                      >
                        Primary Source
                      </button>
                      <button
                        style={{
                          ...inspiredStyles.priorityBtn,
                          ...(!site.isPrimary ? inspiredStyles.priorityBtnSecondary : {})
                        }}
                        onClick={() => {
                          if (site.isPrimary && sites.filter(s => s.url.trim()).length > 1) {
                            // Find another site to make primary
                            const otherIdx = sites.findIndex((s, i) => i !== index && s.url.trim());
                            if (otherIdx >= 0) setPrimary(otherIdx);
                          }
                        }}
                      >
                        Secondary
                      </button>
                    </div>
                  </div>

                  {/* Element Selection */}
                  <div style={inspiredStyles.elementsSection}>
                    <span style={inspiredStyles.elementsLabel}>
                      {site.isPrimary ? 'Primary elements (use most of this site\'s style):' : 'Pick specific elements from this site:'}
                    </span>
                    <div style={inspiredStyles.elementsGrid}>
                      {elementOptions.map(opt => (
                        <button
                          key={opt.id}
                          style={{
                            ...inspiredStyles.elementChip,
                            ...((site.elements || []).includes(opt.id) ? inspiredStyles.elementChipActive : {})
                          }}
                          onClick={() => toggleElement(index, opt.id)}
                          title={opt.description}
                        >
                          <span>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <textarea
                value={site.notes}
                onChange={(e) => updateSite(index, 'notes', e.target.value)}
                placeholder="Specific notes... e.g., 'Love the floating navbar' or 'The testimonials section is perfect'"
                style={inspiredStyles.notesInput}
                rows={2}
              />
            </div>
          ))}

          {sites.length < 3 && (
            <button style={inspiredStyles.addSiteBtn} onClick={addSite}>
              + Add Another Inspiration Site
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={inspiredStyles.footer}>
          <button
            style={{
              ...inspiredStyles.continueBtn,
              opacity: (validSites === 0 || !businessName.trim()) ? 0.5 : 1
            }}
            onClick={analyzedSites > 0 ? goToPreview : handleContinue}
            disabled={validSites === 0 || !businessName.trim()}
          >
            {analyzedSites > 0 ? 'Preview Your Blend →' : 'Continue →'}
          </button>
        </div>
      </div>
    );
  }

  // PREVIEW SUBSTEP (Blend Preview)
  const blendSummary = getBlendSummary();

  return (
    <div style={styles.stepContainer}>
      <button style={styles.backBtn} onClick={() => setSubStep('input')}>← Back to Sites</button>

      <h1 style={styles.stepTitle}>✨ Your Design Blend</h1>
      <p style={styles.stepSubtitle}>Here's what we'll create based on your selections</p>

      <div style={inspiredStyles.previewContainer}>
        {/* Color Palette */}
        {blendSummary.colors && (
          <div style={inspiredStyles.previewSection}>
            <div style={inspiredStyles.previewSectionHeader}>
              <span style={inspiredStyles.previewIcon}>🎨</span>
              <span style={inspiredStyles.previewTitle}>Color Palette</span>
              <span style={inspiredStyles.previewSource}>
                from {sites.find(s => s.isPrimary)?.url?.replace('https://', '').split('/')[0] || 'primary'}
              </span>
            </div>
            <div style={inspiredStyles.colorPalette}>
              <div style={inspiredStyles.colorBlock}>
                <div style={{...inspiredStyles.colorSwatch, background: blendSummary.colors.primary}} />
                <span style={inspiredStyles.colorLabel}>Primary</span>
                <span style={inspiredStyles.colorValue}>{blendSummary.colors.primary}</span>
              </div>
              <div style={inspiredStyles.colorBlock}>
                <div style={{...inspiredStyles.colorSwatch, background: blendSummary.colors.secondary}} />
                <span style={inspiredStyles.colorLabel}>Secondary</span>
                <span style={inspiredStyles.colorValue}>{blendSummary.colors.secondary}</span>
              </div>
              <div style={inspiredStyles.colorBlock}>
                <div style={{...inspiredStyles.colorSwatch, background: blendSummary.colors.accent}} />
                <span style={inspiredStyles.colorLabel}>Accent</span>
                <span style={inspiredStyles.colorValue}>{blendSummary.colors.accent}</span>
              </div>
            </div>
          </div>
        )}

        {/* Style Direction */}
        <div style={inspiredStyles.previewSection}>
          <div style={inspiredStyles.previewSectionHeader}>
            <span style={inspiredStyles.previewIcon}>💫</span>
            <span style={inspiredStyles.previewTitle}>Style Direction</span>
          </div>
          <p style={inspiredStyles.styleDescription}>
            {blendSummary.style ? `${blendSummary.style.charAt(0).toUpperCase() + blendSummary.style.slice(1)} aesthetic` : 'Modern, professional design'} with elements carefully selected from your inspiration sites.
          </p>
        </div>

        {/* Elements Breakdown */}
        <div style={inspiredStyles.previewSection}>
          <div style={inspiredStyles.previewSectionHeader}>
            <span style={inspiredStyles.previewIcon}>🧩</span>
            <span style={inspiredStyles.previewTitle}>Elements We'll Use</span>
          </div>
          <div style={inspiredStyles.elementsBreakdown}>
            {blendSummary.elements.map((el, idx) => (
              <div key={idx} style={inspiredStyles.elementItem}>
                <span style={inspiredStyles.elementIcon}>{el.icon}</span>
                <span style={inspiredStyles.elementName}>{el.element}</span>
                <span style={inspiredStyles.elementFrom}>from {el.from}</span>
                {el.isPrimary && <span style={inspiredStyles.elementPrimaryTag}>primary</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Sites Used */}
        <div style={inspiredStyles.previewSection}>
          <div style={inspiredStyles.previewSectionHeader}>
            <span style={inspiredStyles.previewIcon}>🔗</span>
            <span style={inspiredStyles.previewTitle}>Inspiration Sources</span>
          </div>
          <div style={inspiredStyles.sourcesGrid}>
            {sites.filter(s => s.url.trim()).map((site, idx) => (
              <div key={idx} style={inspiredStyles.sourceCard}>
                {site.screenshotUrl && (
                  <img
                    src={site.screenshotUrl}
                    alt=""
                    style={inspiredStyles.sourceThumb}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div style={inspiredStyles.sourceInfo}>
                  <span style={inspiredStyles.sourceUrl}>{site.url.replace('https://', '').split('/')[0]}</span>
                  {site.isPrimary && <span style={inspiredStyles.sourcePrimary}>Primary</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={inspiredStyles.previewFooter}>
        <button style={inspiredStyles.backToEditBtn} onClick={() => setSubStep('input')}>
          ← Adjust Selections
        </button>
        <button style={inspiredStyles.continueBtn} onClick={handleContinue}>
          Looks Good! Continue →
        </button>
      </div>
    </div>
  );
}
