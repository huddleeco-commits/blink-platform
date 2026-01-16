/**
 * RebuildStep
 * Import and analyze existing website for rebuild
 */

import React, { useState } from 'react';
import { API_BASE } from '../constants';
import { styles } from '../styles';

// Rebuild Step Styles
const rebuildStyles = {
  resultsContainer: {
    marginTop: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  successHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 24px',
    background: 'rgba(34, 197, 94, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(34, 197, 94, 0.3)'
  },
  checkIcon: {
    fontSize: '32px'
  },
  successTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff'
  },
  successSubtitle: {
    fontSize: '14px',
    color: '#888',
    marginTop: '4px'
  },
  section: {
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  sectionIcon: {
    fontSize: '20px'
  },
  sectionTitle: {
    flex: 1,
    fontSize: '15px',
    fontWeight: '600',
    color: '#e4e4e4'
  },
  expandIcon: {
    color: '#666',
    fontSize: '12px'
  },
  sectionContent: {
    padding: '16px 20px'
  },
  sectionHint: {
    color: '#888',
    fontSize: '13px',
    marginBottom: '12px'
  },
  selectAllRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  selectAllBtn: {
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#888',
    fontSize: '12px',
    cursor: 'pointer'
  },
  selectHint: {
    color: '#666',
    fontSize: '12px',
    marginLeft: 'auto'
  },
  imageCategory: {
    marginBottom: '16px'
  },
  categoryLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#888',
    marginBottom: '8px'
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: '8px'
  },
  imageThumb: {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: 'rgba(255,255,255,0.05)'
  },
  imageThumbSelected: {
    border: '2px solid #22c55e',
    boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.3)'
  },
  imageImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  imageCheck: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '20px',
    height: '20px',
    background: '#22c55e',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '700'
  },
  headlinesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  headlineItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  headlineItemSelected: {
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)'
  },
  headlineCheckbox: {
    marginTop: '2px',
    accentColor: '#22c55e'
  },
  headlineText: {
    fontSize: '14px',
    color: '#e4e4e4',
    lineHeight: '1.4'
  },
  brandRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px'
  },
  brandOption: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  brandLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#e4e4e4'
  },
  colorPreview: {
    display: 'flex',
    gap: '6px',
    marginBottom: '4px'
  },
  colorDot: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    border: '2px solid rgba(255,255,255,0.2)'
  },
  toggleRow: {
    display: 'flex',
    gap: '8px'
  },
  toggleBtn: {
    flex: 1,
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  toggleBtnActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid #22c55e',
    color: '#22c55e'
  },
  chipGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  likeChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  likeChipActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid #22c55e',
    color: '#22c55e'
  },
  dislikeChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  dislikeChipActive: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid #ef4444',
    color: '#ef4444'
  },
  notesTextarea: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#e4e4e4',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none'
  },
  refSiteRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px'
  },
  refSiteInput: {
    flex: 1,
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#e4e4e4',
    fontSize: '14px',
    outline: 'none'
  },
  removeRefBtn: {
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#888',
    cursor: 'pointer'
  },
  addRefBtn: {
    padding: '10px 16px',
    background: 'transparent',
    border: '1px dashed rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    width: '100%'
  },
  continueBtn: {
    padding: '18px 32px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px'
  }
};

export function RebuildStep({ projectData, updateProject, onContinue, onBack }) {
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  // What they DON'T like about current site
  const [dislikes, setDislikes] = useState([]);
  // What they LIKE about current site (want to preserve)
  const [likes, setLikes] = useState([]);
  const [notes, setNotes] = useState('');

  // Keep/Change decisions
  const [keepLogo, setKeepLogo] = useState(true);
  const [keepColors, setKeepColors] = useState(false);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [selectedHeadlines, setSelectedHeadlines] = useState(new Set());

  // Optional reference sites for inspiration
  const [showReferences, setShowReferences] = useState(false);
  const [references, setReferences] = useState([{ url: '', likes: [], notes: '' }]);

  // Expanded sections
  const [showImages, setShowImages] = useState(true);
  const [showHeadlines, setShowHeadlines] = useState(true);

  const dislikeOptions = [
    { id: 'outdated', label: 'Looks outdated', icon: '📅' },
    { id: 'slow', label: 'Too slow', icon: '🐌' },
    { id: 'mobile', label: 'Bad on mobile', icon: '📱' },
    { id: 'colors', label: 'Don\'t like colors', icon: '🎨' },
    { id: 'layout', label: 'Poor layout', icon: '📐' },
    { id: 'fonts', label: 'Bad typography', icon: '🔤' },
    { id: 'images', label: 'Weak images', icon: '🖼️' },
    { id: 'navigation', label: 'Hard to navigate', icon: '🧭' },
    { id: 'content', label: 'Content needs work', icon: '📝' },
    { id: 'trust', label: 'Doesn\'t build trust', icon: '🤝' },
  ];

  const likeOptions = [
    { id: 'brand', label: 'Brand identity', icon: '🏷️' },
    { id: 'tone', label: 'Business tone', icon: '💬' },
    { id: 'structure', label: 'Page structure', icon: '📐' },
    { id: 'content', label: 'Written content', icon: '📝' },
    { id: 'images', label: 'Current photos', icon: '🖼️' },
    { id: 'contact', label: 'Contact info', icon: '📞' },
  ];

  const toggleDislike = (id) => {
    setDislikes(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const toggleLike = (id) => {
    setLikes(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const toggleImage = (imgSrc) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imgSrc)) {
        newSet.delete(imgSrc);
      } else {
        newSet.add(imgSrc);
      }
      return newSet;
    });
  };

  const toggleHeadline = (headline) => {
    setSelectedHeadlines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(headline)) {
        newSet.delete(headline);
      } else {
        newSet.add(headline);
      }
      return newSet;
    });
  };

  const selectAllImages = () => {
    const allImages = analysis?.designSystem?.images || [];
    setSelectedImages(new Set(allImages.map(img => img.src)));
  };

  const deselectAllImages = () => {
    setSelectedImages(new Set());
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    setAnalyzing(true);
    setError(null);

    try {
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
      }

      const response = await fetch(`${API_BASE}/api/analyze-existing-site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl })
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);

        // Auto-select logo and hero images by default
        const autoSelected = new Set();
        const catImages = data.analysis.designSystem?.categorizedImages;
        if (catImages?.logo) catImages.logo.forEach(img => autoSelected.add(img.src));
        if (catImages?.hero) catImages.hero.slice(0, 2).forEach(img => autoSelected.add(img.src));
        if (catImages?.product) catImages.product.slice(0, 4).forEach(img => autoSelected.add(img.src));
        setSelectedImages(autoSelected);

        // Auto-select first few headlines
        const headlines = data.analysis.pageContent?.headlines || [];
        setSelectedHeadlines(new Set(headlines.slice(0, 3)));

        // Auto-fill project data from analysis
        updateProject({
          businessName: data.analysis.businessName || '',
          tagline: data.analysis.description || '',
          industryKey: data.analysis.industry || 'saas',
          selectedPages: data.analysis.recommendations?.pages || ['home', 'about', 'services', 'contact'],
        });
      } else {
        setError(data.error || 'Failed to analyze site');
      }
    } catch (err) {
      setError('Failed to analyze site. Please check the URL.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleContinue = () => {
    // Build the complete existingSite object with all selections
    const selectedImagesArray = analysis?.designSystem?.images?.filter(img => selectedImages.has(img.src)) || [];
    const selectedHeadlinesArray = Array.from(selectedHeadlines);

    updateProject({
      existingSite: {
        ...analysis,
        dislikes,
        likes,
        userNotes: notes,
        keepLogo,
        keepColors,
        selectedImages: selectedImagesArray,
        selectedHeadlines: selectedHeadlinesArray,
        referenceInspiration: references.filter(r => r.url.trim())
      },
      colors: keepColors && analysis?.designSystem?.colors?.length > 0
        ? {
            primary: analysis.designSystem.colors[0] || projectData.colors.primary,
            secondary: analysis.designSystem.colors[1] || projectData.colors.secondary,
            accent: analysis.designSystem.colors[2] || projectData.colors.accent,
            text: projectData.colors.text,
            background: projectData.colors.background
          }
        : projectData.colors
    });
    onContinue();
  };

  // Get categorized images for display
  const getImagesByCategory = () => {
    const cat = analysis?.designSystem?.categorizedImages;
    if (!cat) return [];

    const categories = [];
    if (cat.logo?.length > 0) categories.push({ name: 'Logo', icon: '🏷️', images: cat.logo });
    if (cat.hero?.length > 0) categories.push({ name: 'Hero/Banner', icon: '🦸', images: cat.hero });
    if (cat.team?.length > 0) categories.push({ name: 'Team', icon: '👥', images: cat.team });
    if (cat.product?.length > 0) categories.push({ name: 'Products/Services', icon: '📦', images: cat.product });
    if (cat.gallery?.length > 0) categories.push({ name: 'Gallery', icon: '🖼️', images: cat.gallery });
    if (cat.general?.length > 0) categories.push({ name: 'Other', icon: '📷', images: cat.general.slice(0, 6) });

    return categories;
  };

  return (
    <div style={styles.stepContainer}>
      <button style={styles.backBtn} onClick={onBack}>← Back</button>

      <h1 style={styles.stepTitle}>🔄 Rebuild Your Website</h1>
      <p style={styles.stepSubtitle}>We'll analyze your site and create a modern upgrade</p>

      <div style={styles.inputRow}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
          placeholder="yourwebsite.com"
          style={styles.bigInput}
          autoFocus
        />
        <button
          onClick={handleAnalyze}
          disabled={analyzing || !url.trim()}
          style={{...styles.primaryBtn, opacity: analyzing || !url.trim() ? 0.5 : 1}}
        >
          {analyzing ? '⏳ Analyzing...' : '🔍 Analyze'}
        </button>
      </div>

      {error && <p style={styles.errorText}>{error}</p>}

      {/* Analysis Results */}
      {analysis && (
        <div style={rebuildStyles.resultsContainer}>
          {/* Success Header */}
          <div style={rebuildStyles.successHeader}>
            <span style={rebuildStyles.checkIcon}>✅</span>
            <div>
              <div style={rebuildStyles.successTitle}>Site Analyzed: {analysis.businessName || 'Your Business'}</div>
              <div style={rebuildStyles.successSubtitle}>
                {analysis.industry} • {analysis.designSystem?.images?.length || 0} images • {analysis.pageContent?.headlines?.length || 0} headlines
              </div>
            </div>
          </div>

          {/* SECTION: Extracted Images */}
          <div style={rebuildStyles.section}>
            <div style={rebuildStyles.sectionHeader} onClick={() => setShowImages(!showImages)}>
              <span style={rebuildStyles.sectionIcon}>🖼️</span>
              <span style={rebuildStyles.sectionTitle}>Images Found ({selectedImages.size} selected)</span>
              <span style={rebuildStyles.expandIcon}>{showImages ? '▼' : '▶'}</span>
            </div>

            {showImages && (
              <div style={rebuildStyles.sectionContent}>
                <div style={rebuildStyles.selectAllRow}>
                  <button style={rebuildStyles.selectAllBtn} onClick={selectAllImages}>Select All</button>
                  <button style={rebuildStyles.selectAllBtn} onClick={deselectAllImages}>Deselect All</button>
                  <span style={rebuildStyles.selectHint}>Click images to keep them in your new site</span>
                </div>

                {getImagesByCategory().map(category => (
                  <div key={category.name} style={rebuildStyles.imageCategory}>
                    <div style={rebuildStyles.categoryLabel}>{category.icon} {category.name}</div>
                    <div style={rebuildStyles.imageGrid}>
                      {category.images.slice(0, 8).map((img, idx) => (
                        <div
                          key={idx}
                          style={{
                            ...rebuildStyles.imageThumb,
                            ...(selectedImages.has(img.src) ? rebuildStyles.imageThumbSelected : {})
                          }}
                          onClick={() => toggleImage(img.src)}
                        >
                          <img
                            src={img.src}
                            alt={img.alt || ''}
                            style={rebuildStyles.imageImg}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          {selectedImages.has(img.src) && (
                            <div style={rebuildStyles.imageCheck}>✓</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION: Headlines */}
          {analysis.pageContent?.headlines?.length > 0 && (
            <div style={rebuildStyles.section}>
              <div style={rebuildStyles.sectionHeader} onClick={() => setShowHeadlines(!showHeadlines)}>
                <span style={rebuildStyles.sectionIcon}>📝</span>
                <span style={rebuildStyles.sectionTitle}>Headlines Found ({selectedHeadlines.size} selected)</span>
                <span style={rebuildStyles.expandIcon}>{showHeadlines ? '▼' : '▶'}</span>
              </div>

              {showHeadlines && (
                <div style={rebuildStyles.sectionContent}>
                  <p style={rebuildStyles.sectionHint}>Select headlines to preserve (we'll improve the wording)</p>
                  <div style={rebuildStyles.headlinesList}>
                    {analysis.pageContent.headlines.slice(0, 10).map((headline, idx) => (
                      <label
                        key={idx}
                        style={{
                          ...rebuildStyles.headlineItem,
                          ...(selectedHeadlines.has(headline) ? rebuildStyles.headlineItemSelected : {})
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedHeadlines.has(headline)}
                          onChange={() => toggleHeadline(headline)}
                          style={rebuildStyles.headlineCheckbox}
                        />
                        <span style={rebuildStyles.headlineText}>"{headline}"</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION: Colors & Logo */}
          <div style={rebuildStyles.section}>
            <div style={rebuildStyles.sectionHeader}>
              <span style={rebuildStyles.sectionIcon}>🎨</span>
              <span style={rebuildStyles.sectionTitle}>Brand Elements</span>
            </div>
            <div style={rebuildStyles.sectionContent}>
              <div style={rebuildStyles.brandRow}>
                {/* Logo Toggle */}
                <div style={rebuildStyles.brandOption}>
                  <span style={rebuildStyles.brandLabel}>Logo</span>
                  <div style={rebuildStyles.toggleRow}>
                    <button
                      style={{
                        ...rebuildStyles.toggleBtn,
                        ...(keepLogo ? rebuildStyles.toggleBtnActive : {})
                      }}
                      onClick={() => setKeepLogo(true)}
                    >
                      Keep Current
                    </button>
                    <button
                      style={{
                        ...rebuildStyles.toggleBtn,
                        ...(!keepLogo ? rebuildStyles.toggleBtnActive : {})
                      }}
                      onClick={() => setKeepLogo(false)}
                    >
                      Upload New
                    </button>
                  </div>
                </div>

                {/* Colors Toggle */}
                <div style={rebuildStyles.brandOption}>
                  <span style={rebuildStyles.brandLabel}>Colors</span>
                  {analysis.designSystem?.colors?.length > 0 && (
                    <div style={rebuildStyles.colorPreview}>
                      {analysis.designSystem.colors.slice(0, 5).map((color, idx) => (
                        <div key={idx} style={{...rebuildStyles.colorDot, background: color}} title={color} />
                      ))}
                    </div>
                  )}
                  <div style={rebuildStyles.toggleRow}>
                    <button
                      style={{
                        ...rebuildStyles.toggleBtn,
                        ...(keepColors ? rebuildStyles.toggleBtnActive : {})
                      }}
                      onClick={() => setKeepColors(true)}
                    >
                      Keep These
                    </button>
                    <button
                      style={{
                        ...rebuildStyles.toggleBtn,
                        ...(!keepColors ? rebuildStyles.toggleBtnActive : {})
                      }}
                      onClick={() => setKeepColors(false)}
                    >
                      New Colors
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: What You LIKE */}
          <div style={rebuildStyles.section}>
            <div style={rebuildStyles.sectionHeader}>
              <span style={rebuildStyles.sectionIcon}>💚</span>
              <span style={rebuildStyles.sectionTitle}>What do you LIKE about your current site?</span>
            </div>
            <div style={rebuildStyles.sectionContent}>
              <p style={rebuildStyles.sectionHint}>We'll preserve these aspects</p>
              <div style={rebuildStyles.chipGrid}>
                {likeOptions.map(opt => (
                  <button
                    key={opt.id}
                    style={{
                      ...rebuildStyles.likeChip,
                      ...(likes.includes(opt.id) ? rebuildStyles.likeChipActive : {})
                    }}
                    onClick={() => toggleLike(opt.id)}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION: What Needs Improvement */}
          <div style={rebuildStyles.section}>
            <div style={rebuildStyles.sectionHeader}>
              <span style={rebuildStyles.sectionIcon}>🔧</span>
              <span style={rebuildStyles.sectionTitle}>What needs improvement?</span>
            </div>
            <div style={rebuildStyles.sectionContent}>
              <p style={rebuildStyles.sectionHint}>Select all that apply</p>
              <div style={rebuildStyles.chipGrid}>
                {dislikeOptions.map(opt => (
                  <button
                    key={opt.id}
                    style={{
                      ...rebuildStyles.dislikeChip,
                      ...(dislikes.includes(opt.id) ? rebuildStyles.dislikeChipActive : {})
                    }}
                    onClick={() => toggleDislike(opt.id)}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION: Notes & Vision */}
          <div style={rebuildStyles.section}>
            <div style={rebuildStyles.sectionHeader}>
              <span style={rebuildStyles.sectionIcon}>💭</span>
              <span style={rebuildStyles.sectionTitle}>Describe your ideal result</span>
            </div>
            <div style={rebuildStyles.sectionContent}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Make it feel more premium like a modern restaurant. Keep our family story but present it better. I want customers to trust us immediately..."
                style={rebuildStyles.notesTextarea}
                rows={3}
              />
            </div>
          </div>

          {/* SECTION: Inspiration Sites (Optional) */}
          <div style={rebuildStyles.section}>
            <div
              style={rebuildStyles.sectionHeader}
              onClick={() => setShowReferences(!showReferences)}
            >
              <span style={rebuildStyles.sectionIcon}>✨</span>
              <span style={rebuildStyles.sectionTitle}>Inspiration Sites (Optional)</span>
              <span style={rebuildStyles.expandIcon}>{showReferences ? '▼' : '▶'}</span>
            </div>

            {showReferences && (
              <div style={rebuildStyles.sectionContent}>
                <p style={rebuildStyles.sectionHint}>Show us sites you admire - we'll blend their best parts</p>
                {references.map((ref, idx) => (
                  <div key={idx} style={rebuildStyles.refSiteRow}>
                    <input
                      type="text"
                      value={ref.url}
                      onChange={(e) => {
                        const newRefs = [...references];
                        newRefs[idx].url = e.target.value;
                        setReferences(newRefs);
                      }}
                      placeholder="https://example.com"
                      style={rebuildStyles.refSiteInput}
                    />
                    {idx > 0 && (
                      <button
                        style={rebuildStyles.removeRefBtn}
                        onClick={() => setReferences(references.filter((_, i) => i !== idx))}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {references.length < 3 && (
                  <button
                    style={rebuildStyles.addRefBtn}
                    onClick={() => setReferences([...references, { url: '', likes: [], notes: '' }])}
                  >
                    + Add another site
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Continue Button */}
          <button style={rebuildStyles.continueBtn} onClick={handleContinue}>
            Continue to Customize →
          </button>
        </div>
      )}

      {/* Empty state */}
      {!analysis && !analyzing && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🌐</div>
          <p>Enter your website URL above</p>
          <p style={styles.emptyHint}>We'll extract your content, colors, images, and structure</p>
        </div>
      )}
    </div>
  );
}
