/**
 * PageCustomizer Component
 * Main page-by-page customization screen combining all controls
 */

import React, { useState, useEffect } from 'react';
import LayoutPicker from './LayoutPicker.jsx';
import SectionToggles from './SectionToggles.jsx';
import AIPageChat from './AIPageChat.jsx';
import { VISUAL_STYLES, PAGE_SECTIONS, PAGE_ICONS } from '../constants';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px'
  },
  pageIcon: {
    fontSize: '2rem'
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#fff'
  },
  pageSubtitle: {
    fontSize: '0.9rem',
    color: '#888',
    marginTop: '4px'
  },
  pageNav: {
    display: 'flex',
    gap: '8px',
    marginLeft: 'auto'
  },
  navBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  navBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  navBtnPrimary: {
    background: '#6366f1',
    borderColor: '#6366f1'
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '24px'
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  section: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '20px'
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  stylesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '10px'
  },
  styleOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 8px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '2px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  styleOptionSelected: {
    borderColor: '#6366f1',
    background: 'rgba(99, 102, 241, 0.1)'
  },
  styleColors: {
    display: 'flex',
    gap: '4px',
    marginBottom: '8px'
  },
  colorDot: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.2)'
  },
  styleName: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center'
  },
  styleDescription: {
    fontSize: '0.7rem',
    color: '#888',
    textAlign: 'center',
    marginTop: '2px'
  },
  colorOverride: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  colorLabel: {
    fontSize: '0.85rem',
    color: '#aaa',
    width: '80px'
  },
  colorInput: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  colorPicker: {
    width: '40px',
    height: '32px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    background: 'transparent'
  },
  colorHex: {
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '0.85rem',
    width: '100px',
    fontFamily: 'monospace'
  },
  progressBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  progressDots: {
    display: 'flex',
    gap: '6px',
    flex: 1
  },
  progressDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)',
    transition: 'all 0.2s ease'
  },
  progressDotActive: {
    background: '#6366f1'
  },
  progressDotComplete: {
    background: '#10b981'
  },
  progressText: {
    fontSize: '0.8rem',
    color: '#888'
  },
  quickActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  quickAction: {
    padding: '8px 14px',
    fontSize: '0.8rem',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '20px',
    color: '#a5b4fc',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  applyToAllBtn: {
    padding: '10px 16px',
    fontSize: '0.85rem',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '8px',
    color: '#10b981',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '8px'
  },
  summary: {
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    marginTop: 'auto'
  },
  summaryTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '12px'
  },
  summaryItem: {
    fontSize: '0.8rem',
    color: '#aaa',
    marginBottom: '6px',
    display: 'flex',
    justifyContent: 'space-between'
  },
  summaryValue: {
    color: '#fff',
    fontWeight: '500'
  }
};

export default function PageCustomizer({
  pages,
  currentPageIndex,
  pageSettings,
  businessContext,
  onPageSettingsChange,
  onPreviousPage,
  onNextPage,
  onApplyToAll
}) {
  const currentPage = pages[currentPageIndex];
  const currentSettings = pageSettings[currentPage] || getDefaultSettings(currentPage);
  const pageIcon = PAGE_ICONS[currentPage] || PAGE_ICONS.default;
  const pageName = formatPageName(currentPage);

  function getDefaultSettings(pageType) {
    const defaultSections = (PAGE_SECTIONS[pageType] || PAGE_SECTIONS.default)
      .filter(s => s.default)
      .map(s => s.id);

    return {
      layout: null,
      style: 'modern',
      sections: defaultSections,
      colors: {
        primary: VISUAL_STYLES[0].colors.primary,
        accent: VISUAL_STYLES[0].colors.accent
      }
    };
  }

  function formatPageName(pageType) {
    return pageType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  const updateSettings = (key, value) => {
    onPageSettingsChange(currentPage, {
      ...currentSettings,
      [key]: value
    });
  };

  const handleStyleChange = (styleId) => {
    const style = VISUAL_STYLES.find(s => s.id === styleId);
    if (style) {
      onPageSettingsChange(currentPage, {
        ...currentSettings,
        style: styleId,
        colors: { ...style.colors }
      });
    }
  };

  const handleColorChange = (colorType, value) => {
    onPageSettingsChange(currentPage, {
      ...currentSettings,
      colors: {
        ...currentSettings.colors,
        [colorType]: value
      }
    });
  };

  const handleApplySuggestions = (suggestions) => {
    const updatedSettings = { ...currentSettings };
    if (suggestions.layout) updatedSettings.layout = suggestions.layout;
    if (suggestions.style) updatedSettings.style = suggestions.style;
    if (suggestions.sections) updatedSettings.sections = suggestions.sections;
    if (suggestions.colors) updatedSettings.colors = suggestions.colors;
    onPageSettingsChange(currentPage, updatedSettings);
  };

  const handleApplyStyleToAll = () => {
    if (onApplyToAll) {
      onApplyToAll({
        style: currentSettings.style,
        colors: currentSettings.colors
      });
    }
  };

  return (
    <div style={styles.container}>
      {/* Progress Bar */}
      <div style={styles.progressBar}>
        <div style={styles.progressDots}>
          {pages.map((page, idx) => (
            <div
              key={page}
              style={{
                ...styles.progressDot,
                ...(idx === currentPageIndex ? styles.progressDotActive : {}),
                ...(idx < currentPageIndex ? styles.progressDotComplete : {})
              }}
              title={formatPageName(page)}
            />
          ))}
        </div>
        <span style={styles.progressText}>
          Page {currentPageIndex + 1} of {pages.length}
        </span>
      </div>

      {/* Page Header */}
      <div style={styles.pageHeader}>
        <span style={styles.pageIcon}>{pageIcon}</span>
        <div>
          <div style={styles.pageTitle}>{pageName} Page</div>
          <div style={styles.pageSubtitle}>
            Customize the layout, style, and sections
          </div>
        </div>
        <div style={styles.pageNav}>
          <button
            style={{
              ...styles.navBtn,
              ...(currentPageIndex === 0 ? styles.navBtnDisabled : {})
            }}
            onClick={onPreviousPage}
            disabled={currentPageIndex === 0}
          >
            Previous
          </button>
          <button
            style={{
              ...styles.navBtn,
              ...styles.navBtnPrimary,
              ...(currentPageIndex === pages.length - 1 ? styles.navBtnDisabled : {})
            }}
            onClick={onNextPage}
            disabled={currentPageIndex === pages.length - 1}
          >
            Next Page
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={styles.mainContent}>
        {/* Left Column - Settings */}
        <div style={styles.leftColumn}>
          {/* Layout Section */}
          <div style={styles.section}>
            <LayoutPicker
              pageType={currentPage}
              selectedLayout={currentSettings.layout}
              onLayoutChange={(layout) => updateSettings('layout', layout)}
            />
          </div>

          {/* Visual Style Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Visual Style</div>
            <div style={styles.stylesGrid}>
              {VISUAL_STYLES.map(style => (
                <div
                  key={style.id}
                  style={{
                    ...styles.styleOption,
                    ...(currentSettings.style === style.id ? styles.styleOptionSelected : {})
                  }}
                  onClick={() => handleStyleChange(style.id)}
                >
                  <div style={styles.styleColors}>
                    <div
                      style={{
                        ...styles.colorDot,
                        background: style.colors.primary
                      }}
                    />
                    <div
                      style={{
                        ...styles.colorDot,
                        background: style.colors.accent
                      }}
                    />
                  </div>
                  <div style={styles.styleName}>{style.name}</div>
                  <div style={styles.styleDescription}>{style.description}</div>
                </div>
              ))}
            </div>

            {/* Color Override */}
            <div style={{ ...styles.colorOverride, marginTop: '20px' }}>
              <div style={styles.sectionTitle}>Color Override</div>
              <div style={styles.colorRow}>
                <span style={styles.colorLabel}>Primary</span>
                <div style={styles.colorInput}>
                  <input
                    type="color"
                    value={currentSettings.colors?.primary || '#3b82f6'}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    style={styles.colorPicker}
                  />
                  <input
                    type="text"
                    value={currentSettings.colors?.primary || '#3b82f6'}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    style={styles.colorHex}
                  />
                </div>
              </div>
              <div style={styles.colorRow}>
                <span style={styles.colorLabel}>Accent</span>
                <div style={styles.colorInput}>
                  <input
                    type="color"
                    value={currentSettings.colors?.accent || '#10b981'}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    style={styles.colorPicker}
                  />
                  <input
                    type="text"
                    value={currentSettings.colors?.accent || '#10b981'}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    style={styles.colorHex}
                  />
                </div>
              </div>
              <button
                style={styles.applyToAllBtn}
                onClick={handleApplyStyleToAll}
              >
                Apply this style to all pages
              </button>
            </div>
          </div>

          {/* Sections Toggle */}
          <div style={styles.section}>
            <SectionToggles
              pageType={currentPage}
              selectedSections={currentSettings.sections || []}
              onSectionsChange={(sections) => updateSettings('sections', sections)}
            />
          </div>
        </div>

        {/* Right Column - AI Chat & Summary */}
        <div style={styles.rightColumn}>
          {/* AI Chat Panel */}
          <AIPageChat
            pageType={currentPage}
            pageName={pageName}
            businessContext={businessContext}
            currentSettings={currentSettings}
            onApplySuggestions={handleApplySuggestions}
          />

          {/* Quick Actions */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Quick Actions</div>
            <div style={styles.quickActions}>
              <button style={styles.quickAction}>
                Reset to defaults
              </button>
              <button style={styles.quickAction}>
                Copy from Home
              </button>
              <button style={styles.quickAction}>
                AI auto-fill
              </button>
            </div>
          </div>

          {/* Current Settings Summary */}
          <div style={styles.summary}>
            <div style={styles.summaryTitle}>Current Settings</div>
            <div style={styles.summaryItem}>
              <span>Layout:</span>
              <span style={styles.summaryValue}>
                {currentSettings.layout || 'Not selected'}
              </span>
            </div>
            <div style={styles.summaryItem}>
              <span>Style:</span>
              <span style={styles.summaryValue}>
                {VISUAL_STYLES.find(s => s.id === currentSettings.style)?.name || 'Modern'}
              </span>
            </div>
            <div style={styles.summaryItem}>
              <span>Sections:</span>
              <span style={styles.summaryValue}>
                {currentSettings.sections?.length || 0} selected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
