/**
 * SiteCustomizationScreen
 * Full website customization form with industry-specific options
 */

import React, { useState } from 'react';
import { INDUSTRY_PAGES, PAGE_LABELS, COLOR_PRESETS, STYLE_OPTIONS, ADMIN_LEVELS } from '../constants';

function getIndustryPageCategory(ind) {
  if (!ind) return 'default';
  const lowerInd = ind.toLowerCase();
  if (['pizza', 'restaurant', 'cafe', 'bar'].includes(lowerInd)) return 'food-beverage';
  if (lowerInd === 'bakery') return 'bakery';
  if (['law-firm', 'accounting', 'consulting', 'real-estate', 'insurance'].includes(lowerInd)) return 'professional-services';
  if (['healthcare', 'dental', 'chiropractic', 'spa-salon'].includes(lowerInd)) return 'healthcare';
  if (['fitness', 'yoga', 'gym'].includes(lowerInd)) return 'fitness';
  if (['saas', 'startup', 'agency', 'tech'].includes(lowerInd)) return 'technology';
  if (['photography', 'wedding', 'portfolio', 'musician', 'podcast'].includes(lowerInd)) return 'creative';
  if (['ecommerce', 'retail', 'shop'].includes(lowerInd)) return 'retail';
  if (['construction', 'plumber', 'electrician', 'landscaping', 'cleaning', 'auto-repair', 'moving', 'hvac', 'roofing'].includes(lowerInd)) return 'trade-services';
  return 'default';
}

const customStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    minHeight: '80vh',
    maxWidth: '800px',
    margin: '0 auto'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  industryBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    borderRadius: '50px',
    marginBottom: '16px',
    border: '1px solid #bbf7d0'
  },
  industryIcon: {
    fontSize: '1.5rem'
  },
  industryText: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#166534',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#1f2937'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#6b7280'
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  sectionTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#374151'
  },
  required: {
    color: '#ef4444'
  },
  input: {
    padding: '12px 16px',
    fontSize: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  },
  inputHint: {
    fontSize: '0.8rem',
    color: '#9ca3af',
    fontStyle: 'italic'
  },
  colorSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  colorPicker: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: '#f9fafb',
    borderRadius: '12px',
    border: '2px solid #e5e7eb'
  },
  colorInput: {
    width: '40px',
    height: '40px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  colorPresets: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  colorSwatch: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.2s ease'
  },
  colorSwatchSelected: {
    border: '2px solid #1f2937',
    transform: 'scale(1.1)'
  },
  styleOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px'
  },
  styleOption: {
    padding: '16px 12px',
    background: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease'
  },
  styleOptionSelected: {
    borderColor: '#3b82f6',
    background: '#eff6ff'
  },
  styleLabel: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px'
  },
  styleDesc: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  logoDropzone: {
    padding: '24px',
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: '#f9fafb'
  },
  logoDropzoneActive: {
    borderColor: '#3b82f6',
    background: '#eff6ff'
  },
  logoPreview: {
    maxWidth: '120px',
    maxHeight: '80px',
    objectFit: 'contain',
    marginBottom: '8px'
  },
  divider: {
    height: '1px',
    background: '#e5e7eb',
    margin: '8px 0'
  },
  pagesGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  },
  pageCheckbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.9rem'
  },
  pageCheckboxSelected: {
    borderColor: '#3b82f6',
    background: '#eff6ff'
  },
  pageIcon: {
    fontSize: '1.1rem'
  },
  adminOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  adminOption: {
    padding: '16px',
    background: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    position: 'relative'
  },
  adminOptionSelected: {
    borderColor: '#3b82f6',
    background: '#eff6ff'
  },
  recommendedBadge: {
    position: 'absolute',
    top: '-8px',
    right: '12px',
    padding: '2px 8px',
    background: '#22c55e',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: '600',
    borderRadius: '4px',
    textTransform: 'uppercase'
  },
  adminLabel: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px'
  },
  adminDesc: {
    fontSize: '0.8rem',
    color: '#6b7280'
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb'
  },
  backBtn: {
    padding: '12px 24px',
    fontSize: '0.95rem',
    background: 'transparent',
    border: '2px solid #d1d5db',
    borderRadius: '12px',
    cursor: 'pointer',
    color: '#6b7280',
    fontWeight: '500'
  },
  generateBtn: {
    padding: '14px 32px',
    fontSize: '1.1rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
  },
  generateBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};

export function SiteCustomizationScreen({
  industry,
  industryDisplay,
  industryIcon,
  sharedContext,
  onGenerate,
  onBack,
  onUpdateContext
}) {
  const [businessName, setBusinessName] = useState(sharedContext?.businessName || '');
  const [location, setLocation] = useState(sharedContext?.location || '');
  const [tagline, setTagline] = useState(sharedContext?.tagline || '');
  const [brandColor, setBrandColor] = useState(sharedContext?.brandColor || '#3b82f6');
  const [style, setStyle] = useState(sharedContext?.style || 'modern');
  const [logo, setLogo] = useState(sharedContext?.logo || null);
  const [adminLevel, setAdminLevel] = useState('standard');
  const [dragOver, setDragOver] = useState(false);

  // Get page config for this industry
  const industryCategory = getIndustryPageCategory(industry);
  const pageConfig = INDUSTRY_PAGES[industryCategory] || INDUSTRY_PAGES.default;
  const [selectedPages, setSelectedPages] = useState(pageConfig.recommended);

  const togglePage = (pageId) => {
    setSelectedPages(prev =>
      prev.includes(pageId)
        ? prev.filter(p => p !== pageId)
        : [...prev, pageId]
    );
  };

  const handleLogoDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setLogo(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setLogo(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    // Update shared context
    if (onUpdateContext) {
      onUpdateContext({
        businessName,
        brandColor,
        location,
        industry,
        industryDisplay,
        style,
        logo,
        tagline
      });
    }
    // Call generate with all config
    onGenerate({
      businessName,
      location,
      tagline,
      brandColor,
      style,
      logo,
      selectedPages,
      adminLevel,
      industry,
      industryDisplay
    });
  };

  return (
    <div style={customStyles.container}>
      <div style={customStyles.header}>
        <div style={customStyles.industryBadge}>
          <span style={customStyles.industryIcon}>{industryIcon}</span>
          <span style={customStyles.industryText}>{industryDisplay} Website</span>
        </div>
        <h1 style={customStyles.title}>Customize before we build</h1>
        <p style={customStyles.subtitle}>Fill in what you know, skip what you don't</p>
      </div>

      <div style={customStyles.form}>
        {/* Business Details */}
        <div style={customStyles.section}>
          <div style={customStyles.inputGroup}>
            <label style={customStyles.label}>
              Business Name <span style={customStyles.required}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Sunrise Bakery"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              style={customStyles.input}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={customStyles.inputGroup}>
            <label style={customStyles.label}>Location</label>
            <input
              type="text"
              placeholder="e.g., Austin, TX"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={customStyles.input}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={customStyles.inputGroup}>
            <label style={customStyles.label}>Tagline</label>
            <input
              type="text"
              placeholder="e.g., Baked fresh daily"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              style={customStyles.input}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <span style={customStyles.inputHint}>Skip and we'll generate one</span>
          </div>
        </div>

        {/* Brand Color */}
        <div style={customStyles.section}>
          <span style={customStyles.sectionTitle}>Brand Color</span>
          <div style={customStyles.colorSection}>
            <div style={customStyles.colorPicker}>
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                style={customStyles.colorInput}
              />
              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>{brandColor}</span>
            </div>
            <div style={customStyles.colorPresets}>
              {COLOR_PRESETS.map((preset) => (
                <div
                  key={preset.color}
                  title={preset.name}
                  style={{
                    ...customStyles.colorSwatch,
                    background: preset.color,
                    ...(brandColor === preset.color ? customStyles.colorSwatchSelected : {})
                  }}
                  onClick={() => setBrandColor(preset.color)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Style */}
        <div style={customStyles.section}>
          <span style={customStyles.sectionTitle}>Style</span>
          <div style={customStyles.styleOptions}>
            {STYLE_OPTIONS.map((opt) => (
              <div
                key={opt.key}
                style={{
                  ...customStyles.styleOption,
                  ...(style === opt.key ? customStyles.styleOptionSelected : {})
                }}
                onClick={() => setStyle(opt.key)}
              >
                <div style={customStyles.styleLabel}>{opt.label}</div>
                <div style={customStyles.styleDesc}>{opt.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Logo */}
        <div style={customStyles.section}>
          <span style={customStyles.sectionTitle}>Logo</span>
          <div
            style={{
              ...customStyles.logoDropzone,
              ...(dragOver ? customStyles.logoDropzoneActive : {})
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleLogoDrop}
            onClick={() => document.getElementById('logo-input').click()}
          >
            {logo ? (
              <>
                <img src={logo} alt="Logo preview" style={customStyles.logoPreview} />
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Click or drop to replace</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📁</div>
                <div style={{ fontSize: '0.95rem', color: '#6b7280' }}>Drop logo image or click to browse</div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>Skip and we'll create a text logo</div>
              </>
            )}
            <input
              id="logo-input"
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div style={customStyles.divider} />

        {/* Pages */}
        <div style={customStyles.section}>
          <span style={customStyles.sectionTitle}>
            Pages (we recommend these for {industryDisplay?.toLowerCase() || 'your business'})
          </span>
          <div style={customStyles.pagesGrid}>
            {pageConfig.recommended.map((pageId) => (
              <div
                key={pageId}
                style={{
                  ...customStyles.pageCheckbox,
                  ...customStyles.pageCheckboxSelected
                }}
                onClick={() => togglePage(pageId)}
              >
                <span style={customStyles.pageIcon}>
                  {selectedPages.includes(pageId) ? '✅' : '☐'}
                </span>
                {PAGE_LABELS[pageId] || pageId}
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '8px' }}>Optional:</div>
          <div style={customStyles.pagesGrid}>
            {pageConfig.optional.map((pageId) => (
              <div
                key={pageId}
                style={{
                  ...customStyles.pageCheckbox,
                  ...(selectedPages.includes(pageId) ? customStyles.pageCheckboxSelected : {})
                }}
                onClick={() => togglePage(pageId)}
              >
                <span style={customStyles.pageIcon}>
                  {selectedPages.includes(pageId) ? '✅' : '☐'}
                </span>
                {PAGE_LABELS[pageId] || pageId}
              </div>
            ))}
          </div>
        </div>

        {/* Admin Level */}
        <div style={customStyles.section}>
          <span style={customStyles.sectionTitle}>Admin Dashboard Level</span>
          <div style={customStyles.adminOptions}>
            {ADMIN_LEVELS.map((level) => (
              <div
                key={level.key}
                style={{
                  ...customStyles.adminOption,
                  ...(adminLevel === level.key ? customStyles.adminOptionSelected : {})
                }}
                onClick={() => setAdminLevel(level.key)}
              >
                {level.recommended && <span style={customStyles.recommendedBadge}>Recommended</span>}
                <div style={customStyles.adminLabel}>{level.label}</div>
                <div style={customStyles.adminDesc}>{level.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={customStyles.actions}>
          <button style={customStyles.backBtn} onClick={onBack}>
            ← Back
          </button>
          <button
            style={{
              ...customStyles.generateBtn,
              ...(!businessName.trim() ? customStyles.generateBtnDisabled : {})
            }}
            onClick={handleGenerate}
            disabled={!businessName.trim()}
          >
            ⚡ BLINK →
          </button>
        </div>
      </div>
    </div>
  );
}
