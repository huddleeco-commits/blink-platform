/**
 * Layout Component Styles
 * Styles for layout selector, thumbnails, and live preview
 */

// Styles for Layout Selector - Prominent visual thumbnails
export const layoutSelectorStyles = {
  container: {
    width: '100%'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px'
  },
  card: {
    position: 'relative',
    padding: '16px',
    background: 'rgba(255,255,255,0.03)',
    border: '2px solid rgba(255,255,255,0.12)',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left'
  },
  cardActive: {
    borderColor: '#22c55e',
    background: 'rgba(34, 197, 94, 0.12)',
    boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)'
  },
  thumbnailContainer: {
    marginBottom: '14px',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)'
  },
  info: {
    padding: '0 4px'
  },
  name: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '6px'
  },
  description: {
    fontSize: '12px',
    color: '#999',
    lineHeight: '1.4'
  },
  checkmark: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#22c55e',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
  }
};

// Styles for Layout Thumbnails (mini previews) - Made larger for prominence
export const layoutThumbnailStyles = {
  container: {
    width: '100%',
    height: '100px',
    background: '#1a1a2e',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  containerSelected: {
    boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.3)'
  },
  // Hero styles - scaled up
  heroFull: {
    height: '55px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px'
  },
  heroSplit: {
    height: '55px',
    display: 'flex'
  },
  heroSplitLeft: {
    flex: 1,
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '5px'
  },
  heroSplitRight: {
    width: '40%'
  },
  heroMinimal: {
    height: '55px',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  heroGallery: {
    height: '55px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '3px',
    padding: '5px'
  },
  navBar: {
    height: '10px',
    borderRadius: '3px'
  },
  heroText: {
    width: '60%',
    height: '7px',
    background: 'rgba(255,255,255,0.9)',
    borderRadius: '2px'
  },
  heroTextLarge: {
    width: '70%',
    height: '8px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '2px'
  },
  heroCta: {
    width: '35%',
    height: '7px',
    background: 'rgba(255,255,255,0.3)',
    borderRadius: '2px'
  },
  galleryItem: {
    borderRadius: '3px'
  },
  // Content styles - scaled up
  contentGrid: {
    height: '45px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '5px',
    padding: '8px'
  },
  contentCard: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px'
  },
  contentTestimonials: {
    height: '45px',
    padding: '8px',
    display: 'flex',
    justifyContent: 'center'
  },
  testimonialCard: {
    width: '70%',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '3px',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  testimonialQuote: {
    width: '80%',
    height: '4px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '2px'
  },
  contentDefault: {
    height: '35px',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  contentLine: {
    width: '90%',
    height: '4px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '2px'
  }
};

// Styles for Live Preview
export const livePreviewStyles = {
  container: {
    width: '100%',
    height: '100%',
    background: '#fff',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  layoutBadge: {
    padding: '3px 8px',
    background: 'rgba(34, 197, 94, 0.15)',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#22c55e',
    marginLeft: '8px'
  },
  // Hero Full
  heroFull: {
    height: '100px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px'
  },
  heroTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#fff',
    margin: '0 0 4px 0',
    textAlign: 'center'
  },
  heroSub: {
    fontSize: '9px',
    color: 'rgba(255,255,255,0.8)',
    margin: '0 0 8px 0',
    textAlign: 'center'
  },
  heroCta: {
    padding: '4px 12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '8px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  heroCtaSmall: {
    padding: '3px 8px',
    border: 'none',
    borderRadius: '3px',
    fontSize: '7px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer'
  },
  // Hero Split
  heroSplit: {
    height: '100px',
    display: 'flex'
  },
  heroSplitLeft: {
    flex: 1,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    background: '#f8f9fa'
  },
  heroSplitRight: {
    width: '45%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroImagePlaceholder: {
    fontSize: '24px',
    opacity: 0.5
  },
  // Hero Minimal
  heroMinimal: {
    height: '100px'
  },
  navBar: {
    height: '24px',
    padding: '0 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  navBarSimple: {
    height: '24px',
    padding: '0 10px',
    display: 'flex',
    alignItems: 'center',
    background: '#fff'
  },
  navBarDefault: {
    height: '20px',
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  navLogo: {
    fontSize: '8px',
    fontWeight: '700',
    color: '#fff'
  },
  navLogoSmall: {
    fontSize: '7px',
    fontWeight: '700',
    color: '#fff'
  },
  navLinks: {
    display: 'flex',
    gap: '8px'
  },
  navLinksSmall: {
    display: 'flex',
    gap: '6px'
  },
  navLink: {
    fontSize: '6px',
    color: 'rgba(255,255,255,0.8)'
  },
  navLinkSmall: {
    fontSize: '5px',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'capitalize'
  },
  heroMinimalContent: {
    height: '76px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8f9fa'
  },
  // Hero Gallery
  heroGallery: {
    height: '100px'
  },
  galleryGrid: {
    height: '76px',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '2px',
    padding: '4px'
  },
  galleryItem: {
    borderRadius: '2px'
  },
  // Hero Default
  heroDefault: {
    height: '80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px'
  },
  // Content sections
  contentGrid: {
    padding: '8px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px'
  },
  serviceCard: {
    padding: '8px',
    background: '#f8f9fa',
    borderRadius: '4px'
  },
  cardIcon: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    marginBottom: '4px'
  },
  cardLines: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  cardLine: {
    width: '100%',
    height: '3px',
    background: '#e5e7eb',
    borderRadius: '1px'
  },
  // Testimonials
  contentTestimonials: {
    padding: '8px',
    display: 'flex',
    justifyContent: 'center'
  },
  testimonialCard: {
    width: '80%',
    padding: '8px',
    background: '#f8f9fa',
    borderRadius: '4px',
    textAlign: 'center'
  },
  testimonialQuote: {
    fontSize: '14px',
    color: '#ccc',
    marginBottom: '4px'
  },
  testimonialLines: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    marginBottom: '6px'
  },
  testimonialLine: {
    width: '90%',
    height: '3px',
    background: '#e5e7eb',
    borderRadius: '1px'
  },
  testimonialAuthor: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  testimonialAvatar: {
    width: '12px',
    height: '12px',
    borderRadius: '50%'
  },
  testimonialName: {
    width: '30px',
    height: '3px',
    background: '#e5e7eb',
    borderRadius: '1px'
  },
  // List content
  contentList: {
    padding: '8px'
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  listDot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%'
  },
  listText: {
    flex: 1,
    height: '3px',
    background: '#e5e7eb',
    borderRadius: '1px'
  },
  listPrice: {
    fontSize: '6px',
    fontWeight: '600'
  },
  // Default content
  contentDefault: {
    padding: '8px'
  },
  contentCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px'
  },
  defaultCard: {
    padding: '8px',
    background: '#f8f9fa',
    borderRadius: '4px'
  }
};
