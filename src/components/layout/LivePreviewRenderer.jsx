/**
 * LivePreviewRenderer Component
 * Shows different layouts in the main preview
 */

import React from 'react';
import { livePreviewStyles } from './styles';

export function LivePreviewRenderer({ projectData, layoutPreview }) {
  const colors = projectData.colors;
  const heroStyle = layoutPreview?.heroStyle || 'standard';
  const contentStyle = layoutPreview?.contentStyle || 'balanced';

  // Render hero section based on style
  const renderHero = () => {
    switch (heroStyle) {
      case 'full':
      case 'dynamic':
      case 'elegant':
        // Full-width hero with centered content
        return (
          <div style={{
            ...livePreviewStyles.heroFull,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
          }}>
            <h2 style={livePreviewStyles.heroTitle}>{projectData.businessName || 'Your Business'}</h2>
            <p style={livePreviewStyles.heroSub}>{projectData.tagline || 'Your tagline goes here'}</p>
            <button style={{...livePreviewStyles.heroCta, background: '#fff', color: colors.primary}}>
              {projectData.primaryCTA === 'book' ? 'Book Now' :
               projectData.primaryCTA === 'call' ? 'Call Us' :
               projectData.primaryCTA === 'buy' ? 'Shop Now' : 'Get Started'}
            </button>
          </div>
        );

      case 'split':
      case 'clean':
        // Split hero with image on right
        return (
          <div style={livePreviewStyles.heroSplit}>
            <div style={livePreviewStyles.heroSplitLeft}>
              <h2 style={{...livePreviewStyles.heroTitle, textAlign: 'left', fontSize: '16px'}}>{projectData.businessName || 'Your Business'}</h2>
              <p style={{...livePreviewStyles.heroSub, textAlign: 'left', fontSize: '10px'}}>{projectData.tagline || 'Your tagline'}</p>
              <button style={{...livePreviewStyles.heroCtaSmall, background: colors.primary}}>
                {projectData.primaryCTA === 'book' ? 'Book' : 'Learn More'}
              </button>
            </div>
            <div style={{
              ...livePreviewStyles.heroSplitRight,
              background: `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}60)`
            }}>
              <div style={livePreviewStyles.heroImagePlaceholder}>📷</div>
            </div>
          </div>
        );

      case 'minimal':
      case 'corporate':
      case 'professional':
        // Minimal hero with nav emphasis
        return (
          <div style={livePreviewStyles.heroMinimal}>
            <div style={{...livePreviewStyles.navBar, background: colors.primary}}>
              <span style={livePreviewStyles.navLogo}>{projectData.businessName || 'Brand'}</span>
              <div style={livePreviewStyles.navLinks}>
                {projectData.selectedPages.slice(0, 3).map(p => (
                  <span key={p} style={livePreviewStyles.navLink}>{p}</span>
                ))}
              </div>
            </div>
            <div style={livePreviewStyles.heroMinimalContent}>
              <h2 style={{...livePreviewStyles.heroTitle, fontSize: '14px'}}>{projectData.businessName || 'Your Business'}</h2>
              <p style={{...livePreviewStyles.heroSub, fontSize: '9px'}}>{projectData.tagline || 'Your tagline'}</p>
              <button style={{...livePreviewStyles.heroCtaSmall, background: colors.primary}}>Contact Us</button>
            </div>
          </div>
        );

      case 'gallery':
      case 'portfolio':
        // Gallery-style hero
        return (
          <div style={livePreviewStyles.heroGallery}>
            <div style={{...livePreviewStyles.navBarSimple, borderBottom: `2px solid ${colors.primary}`}}>
              <span style={{...livePreviewStyles.navLogo, color: colors.primary}}>{projectData.businessName || 'Brand'}</span>
            </div>
            <div style={livePreviewStyles.galleryGrid}>
              <div style={{...livePreviewStyles.galleryItem, background: `${colors.primary}30`}} />
              <div style={{...livePreviewStyles.galleryItem, background: `${colors.secondary}30`}} />
              <div style={{...livePreviewStyles.galleryItem, background: `${colors.accent}30`}} />
              <div style={{...livePreviewStyles.galleryItem, background: `${colors.primary}20`}} />
            </div>
          </div>
        );

      default:
        // Standard hero (default)
        return (
          <>
            <div style={{...livePreviewStyles.navBarDefault, background: colors.primary}}>
              <span style={livePreviewStyles.navLogoSmall}>{projectData.businessName || 'Brand'}</span>
              <div style={livePreviewStyles.navLinksSmall}>
                {projectData.selectedPages.slice(0, 4).map(p => (
                  <span key={p} style={livePreviewStyles.navLinkSmall}>{p}</span>
                ))}
              </div>
            </div>
            <div style={{
              ...livePreviewStyles.heroDefault,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
            }}>
              <h2 style={livePreviewStyles.heroTitle}>{projectData.businessName || 'Your Business'}</h2>
              <p style={livePreviewStyles.heroSub}>{projectData.tagline || 'Your tagline goes here'}</p>
              <button style={{...livePreviewStyles.heroCta, background: '#fff', color: colors.primary}}>
                Get Started
              </button>
            </div>
          </>
        );
    }
  };

  // Render content section based on style
  const renderContent = () => {
    switch (contentStyle) {
      case 'services':
      case 'features':
      case 'benefits':
        return (
          <div style={livePreviewStyles.contentGrid}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{...livePreviewStyles.serviceCard, borderTop: `3px solid ${colors.accent}`}}>
                <div style={{...livePreviewStyles.cardIcon, background: `${colors.primary}20`, color: colors.primary}}>✦</div>
                <div style={livePreviewStyles.cardLines}>
                  <div style={livePreviewStyles.cardLine} />
                  <div style={{...livePreviewStyles.cardLine, width: '60%'}} />
                </div>
              </div>
            ))}
          </div>
        );

      case 'testimonials':
      case 'trust':
        return (
          <div style={livePreviewStyles.contentTestimonials}>
            <div style={livePreviewStyles.testimonialCard}>
              <div style={livePreviewStyles.testimonialQuote}>"</div>
              <div style={livePreviewStyles.testimonialLines}>
                <div style={livePreviewStyles.testimonialLine} />
                <div style={{...livePreviewStyles.testimonialLine, width: '80%'}} />
              </div>
              <div style={livePreviewStyles.testimonialAuthor}>
                <div style={{...livePreviewStyles.testimonialAvatar, background: colors.primary}} />
                <div style={livePreviewStyles.testimonialName} />
              </div>
            </div>
          </div>
        );

      case 'schedule':
      case 'menu':
        return (
          <div style={livePreviewStyles.contentList}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={livePreviewStyles.listItem}>
                <div style={{...livePreviewStyles.listDot, background: colors.accent}} />
                <div style={livePreviewStyles.listText} />
                <div style={{...livePreviewStyles.listPrice, color: colors.primary}}>$$</div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div style={livePreviewStyles.contentDefault}>
            <div style={livePreviewStyles.contentCards}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{...livePreviewStyles.defaultCard, borderTop: `3px solid ${colors.accent}`}}>
                  <div style={{...livePreviewStyles.cardIcon, background: `${colors.primary}20`, color: colors.primary}}>✦</div>
                  <div style={livePreviewStyles.cardLines}>
                    <div style={livePreviewStyles.cardLine} />
                    <div style={{...livePreviewStyles.cardLine, width: '60%'}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div style={livePreviewStyles.container}>
      {renderHero()}
      {renderContent()}
    </div>
  );
}
