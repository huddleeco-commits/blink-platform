/**
 * LayoutThumbnail Component
 * Mini layout preview thumbnail
 */

import React from 'react';
import { layoutThumbnailStyles } from './styles';

export function LayoutThumbnail({ layout, colors, isSelected }) {
  const preview = layout.preview;

  // Different thumbnail styles based on hero style
  const renderHero = () => {
    switch (preview.heroStyle) {
      case 'full':
      case 'dynamic':
      case 'elegant':
        return (
          <div style={{
            ...layoutThumbnailStyles.heroFull,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
          }}>
            <div style={layoutThumbnailStyles.heroText} />
            <div style={layoutThumbnailStyles.heroCta} />
          </div>
        );
      case 'split':
      case 'clean':
        return (
          <div style={layoutThumbnailStyles.heroSplit}>
            <div style={layoutThumbnailStyles.heroSplitLeft}>
              <div style={layoutThumbnailStyles.heroText} />
              <div style={{...layoutThumbnailStyles.heroCta, background: colors.primary}} />
            </div>
            <div style={{
              ...layoutThumbnailStyles.heroSplitRight,
              background: `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}40)`
            }} />
          </div>
        );
      case 'minimal':
      case 'corporate':
      case 'professional':
        return (
          <div style={layoutThumbnailStyles.heroMinimal}>
            <div style={{...layoutThumbnailStyles.navBar, background: colors.primary}} />
            <div style={layoutThumbnailStyles.heroTextLarge} />
            <div style={{...layoutThumbnailStyles.heroCta, background: colors.primary}} />
          </div>
        );
      case 'gallery':
      case 'portfolio':
        return (
          <div style={layoutThumbnailStyles.heroGallery}>
            <div style={{...layoutThumbnailStyles.galleryItem, background: `${colors.primary}30`}} />
            <div style={{...layoutThumbnailStyles.galleryItem, background: `${colors.secondary}30`}} />
            <div style={{...layoutThumbnailStyles.galleryItem, background: `${colors.accent}30`}} />
          </div>
        );
      default:
        return (
          <div style={{
            ...layoutThumbnailStyles.heroFull,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
          }}>
            <div style={layoutThumbnailStyles.heroText} />
            <div style={layoutThumbnailStyles.heroCta} />
          </div>
        );
    }
  };

  // Render content section
  const renderContent = () => {
    switch (preview.contentStyle) {
      case 'services':
      case 'features':
      case 'benefits':
        return (
          <div style={layoutThumbnailStyles.contentGrid}>
            <div style={{...layoutThumbnailStyles.contentCard, borderTop: `2px solid ${colors.accent}`}} />
            <div style={{...layoutThumbnailStyles.contentCard, borderTop: `2px solid ${colors.accent}`}} />
            <div style={{...layoutThumbnailStyles.contentCard, borderTop: `2px solid ${colors.accent}`}} />
          </div>
        );
      case 'testimonials':
      case 'trust':
        return (
          <div style={layoutThumbnailStyles.contentTestimonials}>
            <div style={layoutThumbnailStyles.testimonialCard}>
              <div style={layoutThumbnailStyles.testimonialQuote} />
            </div>
          </div>
        );
      default:
        return (
          <div style={layoutThumbnailStyles.contentDefault}>
            <div style={layoutThumbnailStyles.contentLine} />
            <div style={{...layoutThumbnailStyles.contentLine, width: '70%'}} />
          </div>
        );
    }
  };

  return (
    <div style={{
      ...layoutThumbnailStyles.container,
      ...(isSelected ? layoutThumbnailStyles.containerSelected : {})
    }}>
      {renderHero()}
      {renderContent()}
    </div>
  );
}
