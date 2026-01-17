/**
 * Main App Styles
 * Shared styles used across all screens and components
 */

// Error step specific styles
export const errorStepStyles = {
  hint: {
    color: '#888',
    fontSize: '14px',
    marginTop: '8px',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
    borderLeft: '3px solid #f59e0b'
  }
};

// Main styles object
export const styles = {
  // Container
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
    color: '#e4e4e4',
    fontFamily: "'Inter', -apple-system, sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },

  // Header
  header: {
    padding: '20px 32px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoImage: {
    height: '40px',
    width: 'auto',
    objectFit: 'contain',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '4px',
    background: 'linear-gradient(135deg, #fff, #888)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  headerTagline: {
    color: '#22c55e',
    fontSize: '14px',
    fontWeight: '500',
    minWidth: '280px',
    textAlign: 'right',
  },
  logoutBtn: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
  },
  tagline: {
    color: '#888',
    fontSize: '14px',
    margin: 0,
  },

  // Main
  main: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '40px 32px',
  },

  // Footer
  footer: {
    padding: '16px 32px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    color: '#666',
    fontSize: '13px',
  },

  // Step container
  stepContainer: {
    width: '100%',
    maxWidth: '1100px',
  },

  // Hero titles
  heroTitle: {
    fontSize: '42px',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: '12px',
    background: 'linear-gradient(135deg, #22c55e, #3b82f6, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '18px',
    color: '#888',
    textAlign: 'center',
    marginBottom: '48px',
  },

  // Path selection
  pathGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
    maxWidth: '1100px',
  },
  pathCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '28px 24px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
    position: 'relative',
  },
  pathCardFeatured: {
    background: 'rgba(34, 197, 94, 0.05)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  pathCardLocked: {
    opacity: 0.7,
  },
  lockedBadge: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
  },
  featuredBadge: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
  },
  pathCardOrchestrator: {
    background: 'rgba(102, 126, 234, 0.08)',
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  newBadge: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
  },
  pathCardFullControl: {
    background: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  proBadge: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
  },
  pathIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  pathTitle: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#fff',
  },
  pathDesc: {
    fontSize: '14px',
    color: '#22c55e',
    marginBottom: '12px',
  },
  pathDetails: {
    fontSize: '13px',
    color: '#888',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  pathArrow: {
    fontSize: '20px',
    color: '#22c55e',
  },
  bottomHint: {
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
  },

  // Section containers (Build a Business / Build a Tool)
  sectionContainer: {
    marginBottom: '48px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionIcon: {
    fontSize: '24px',
  },
  sectionSubtitle: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '20px',
  },

  // Tool cards grid
  toolGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    maxWidth: '1100px',
  },
  toolCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '20px 16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
    position: 'relative',
  },
  toolCardCustom: {
    background: 'rgba(168, 85, 247, 0.08)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  toolIcon: {
    fontSize: '36px',
    marginBottom: '12px',
  },
  toolName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '6px',
  },
  toolDesc: {
    fontSize: '12px',
    color: '#888',
    lineHeight: '1.4',
  },
  customBadge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
    color: '#fff',
    padding: '3px 8px',
    borderRadius: '8px',
    fontSize: '9px',
    fontWeight: '700',
  },

  // Back button
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '24px',
    padding: '8px 0',
  },

  // Step titles
  stepTitle: {
    fontSize: '32px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '8px',
  },
  stepSubtitle: {
    fontSize: '16px',
    color: '#888',
    textAlign: 'center',
    marginBottom: '32px',
  },

  // Input row
  inputRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  bigInput: {
    flex: 1,
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '18px',
    outline: 'none',
  },
  primaryBtn: {
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  secondaryBtn: {
    padding: '16px 32px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
  },

  // Examples
  examples: {
    textAlign: 'center',
  },
  examplesLabel: {
    color: '#666',
    fontSize: '13px',
    marginBottom: '12px',
  },
  exampleChips: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  exampleChip: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    color: '#aaa',
    fontSize: '13px',
    cursor: 'pointer',
  },

  // Error text
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: '16px',
  },

  // Analysis card
  analysisCard: {
    background: 'rgba(34, 197, 94, 0.05)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '16px',
    padding: '24px',
    marginTop: '24px',
  },
  analysisHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    fontSize: '18px',
    fontWeight: '600',
  },
  checkIcon: {
    fontSize: '24px',
  },
  analysisGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '20px',
  },
  analysisItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  analysisLabel: {
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase',
  },
  analysisValue: {
    fontSize: '15px',
    color: '#e4e4e4',
  },
  analysisDesc: {
    fontSize: '14px',
    color: '#aaa',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  continueBtn: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyHint: {
    fontSize: '13px',
    color: '#555',
    marginTop: '8px',
  },

  // Feedback section (Rebuild)
  feedbackSection: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  feedbackLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#e4e4e4',
    marginBottom: '12px',
  },
  dislikeGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  dislikeChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dislikeChipActive: {
    background: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
  },
  notesTextarea: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
  },
  toggleRefBtn: {
    background: 'transparent',
    border: 'none',
    color: '#3b82f6',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '0',
  },
  refSitesContainer: {
    marginTop: '12px',
    padding: '16px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
  },
  refHintText: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '12px',
  },
  refSiteRow: {
    marginBottom: '8px',
  },
  refSiteInput: {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
  },
  addRefBtn: {
    background: 'transparent',
    border: '1px dashed rgba(255,255,255,0.2)',
    borderRadius: '6px',
    color: '#666',
    fontSize: '12px',
    padding: '8px 16px',
    cursor: 'pointer',
    width: '100%',
  },

  // Inspired mode enhancements
  inspiredBusinessSection: {
    marginBottom: '24px',
  },
  siteHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  removeSiteBtn: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '4px',
    color: '#ef4444',
    fontSize: '12px',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likesSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  likesLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#e4e4e4',
    marginBottom: '10px',
  },
  likesGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  likeChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#888',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  likeChipActive: {
    background: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    color: '#22c55e',
  },

  // Detected card
  detectedCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    background: 'rgba(34, 197, 94, 0.05)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '16px',
    padding: '24px',
    marginTop: '32px',
  },
  detectedIcon: {
    fontSize: '48px',
  },
  detectedContent: {
    flex: 1,
  },
  detectedTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  detectedDesc: {
    color: '#888',
    fontSize: '14px',
  },

  // Reference sites
  sitesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  siteCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '20px',
  },
  siteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  siteNumber: {
    fontWeight: '600',
    color: '#e4e4e4',
  },
  analyzedBadge: {
    color: '#22c55e',
    fontSize: '13px',
  },
  siteInput: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    marginBottom: '12px',
    outline: 'none',
  },
  siteNotes: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
  },
  analyzeBtn: {
    padding: '10px 20px',
    background: 'rgba(59, 130, 246, 0.2)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
    color: '#3b82f6',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '12px',
  },
  siteAnalysis: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  extractedColors: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#888',
  },
  colorDot: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)',
  },
  extractedStyle: {
    fontSize: '13px',
    color: '#22c55e',
  },
  addSiteBtn: {
    padding: '16px',
    background: 'transparent',
    border: '2px dashed rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
  },
  refFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  refHint: {
    color: '#666',
    fontSize: '13px',
  },

  // Upload Assets Step
  uploadSection: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
  },
  uploadHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
  },
  uploadIcon: {
    fontSize: '24px',
  },
  uploadTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#e4e4e4',
    marginBottom: '4px',
  },
  uploadDesc: {
    fontSize: '13px',
    color: '#888',
  },
  uploadDropzone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '32px 20px',
    background: 'rgba(0,0,0,0.2)',
    border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#888',
    fontSize: '14px',
  },
  dropzoneIcon: {
    fontSize: '32px',
    marginBottom: '4px',
  },
  dropzoneHint: {
    fontSize: '12px',
    color: '#666',
  },
  uploadedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '10px',
  },
  uploadedLogo: {
    width: '60px',
    height: '60px',
    objectFit: 'contain',
    borderRadius: '8px',
    background: '#fff',
  },
  uploadedInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '14px',
    color: '#e4e4e4',
  },
  extractingText: {
    fontSize: '12px',
    color: '#3b82f6',
  },
  extractedColorsPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#22c55e',
  },
  colorDotSmall: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)',
  },
  removeBtn: {
    width: '28px',
    height: '28px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '6px',
    color: '#ef4444',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px',
  },
  photoItem: {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '20px',
    height: '20px',
    background: 'rgba(0,0,0,0.7)',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddBtn: {
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    background: 'rgba(255,255,255,0.03)',
    border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#888',
    fontSize: '24px',
  },
  photoAddText: {
    fontSize: '10px',
  },
  photoCount: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#888',
  },
  menuPreview: {
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    borderRadius: '6px',
  },
  menuThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '6px',
  },
  menuFileIcon: {
    fontSize: '24px',
  },
  menuTypeTag: {
    fontSize: '11px',
    padding: '2px 6px',
    background: 'rgba(59, 130, 246, 0.2)',
    borderRadius: '4px',
    color: '#3b82f6',
  },
  styleTextarea: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.5',
  },
  uploadActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '24px',
  },
  skipBtn: {
    padding: '14px 24px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#888',
    fontSize: '15px',
    cursor: 'pointer',
  },
  uploadHint: {
    textAlign: 'center',
    marginTop: '16px',
    fontSize: '13px',
    color: '#666',
  },

  // Customize step
  customizeContainer: {
    width: '100%',
    maxWidth: '1200px',
  },
  customizeTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '32px',
    textAlign: 'center',
  },
  customizeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
    marginBottom: '32px',
  },
  customizeForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  formLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e4e4e4',
  },
  formInput: {
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
  },
  formSelect: {
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    cursor: 'pointer',
  },
  extraDetailsTextarea: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.5',
  },
  extraDetailsHint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '8px',
  },

  // Color presets
  colorPresets: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '16px',
  },
  colorPreset: {
    padding: '12px',
    background: 'rgba(255,255,255,0.03)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  colorPresetActive: {
    borderColor: '#22c55e',
    background: 'rgba(34, 197, 94, 0.1)',
  },
  presetSwatches: {
    display: 'flex',
    gap: '4px',
    marginBottom: '8px',
    justifyContent: 'center',
  },
  presetSwatch: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)',
  },
  presetName: {
    fontSize: '12px',
    color: '#aaa',
  },
  customColors: {
    display: 'flex',
    gap: '16px',
  },
  colorPickerGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
  },
  colorPicker: {
    width: '100%',
    height: '40px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    background: 'transparent',
  },

  // Page grid
  pageGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  pageChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  pageChipActive: {
    background: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    color: '#22c55e',
  },

  // Preview
  previewContainer: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    fontSize: '13px',
    color: '#888',
  },
  previewDots: {
    display: 'flex',
    gap: '6px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
  },
  previewFrame: {
    background: '#fff',
    minHeight: '500px',
    maxHeight: '700px',
    overflow: 'auto',
  },
  previewNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
  },
  previewLogo: {
    color: '#fff',
    fontWeight: '600',
    fontSize: '14px',
  },
  previewNavLinks: {
    display: 'flex',
    gap: '16px',
  },
  previewNavLink: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '12px',
    textTransform: 'capitalize',
  },
  previewHero: {
    padding: '40px 20px',
    textAlign: 'center',
  },
  previewHeroTitle: {
    color: '#fff',
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  previewHeroSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '13px',
    marginBottom: '16px',
  },
  previewCta: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  previewContent: {
    padding: '24px 20px',
    background: '#f8f9fa',
  },
  previewCards: {
    display: 'flex',
    gap: '12px',
  },
  previewCard: {
    flex: 1,
    background: '#fff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  previewCardIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    fontSize: '14px',
  },
  previewCardLines: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  previewLine: {
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
  },

  // Generate section
  generateSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
  },
  generateSummary: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: '#888',
  },
  generateBtn: {
    padding: '18px 48px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
  },

  // Generating
  generatingContainer: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  blinkQuestion: {
    fontSize: '18px',
    color: '#22c55e',
    marginBottom: '32px',
    fontWeight: '600',
  },
  generatingIcon: {
    fontSize: '64px',
    marginBottom: '24px',
    animation: 'pulse 1s infinite',
  },
  generatingTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '32px',
  },
  progressBar: {
    width: '100%',
    maxWidth: '400px',
    height: '8px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    margin: '0 auto 16px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #22c55e, #3b82f6)',
    borderRadius: '4px',
    transition: 'width 0.3s',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginBottom: '24px',
  },
  progressText: {
    fontSize: '14px',
    color: '#888',
  },
  blinkCounter: {
    fontSize: '14px',
    color: '#3b82f6',
    fontWeight: '600',
  },
  generatingHint: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '24px',
  },
  activeIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#22c55e',
  },
  pulsingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22c55e',
    animation: 'pulse 1s infinite',
  },

  // Complete
  completeContainer: {
    textAlign: 'center',
    maxWidth: '600px',
  },
  completeIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  blinkResult: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '16px 24px',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '12px',
    marginBottom: '24px',
    fontSize: '20px',
    fontWeight: '700',
    color: '#3b82f6',
  },
  blinkSubtext: {
    fontSize: '13px',
    fontWeight: '400',
    color: '#888',
  },
  completeTitle: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #22c55e, #3b82f6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  completeSubtitle: {
    color: '#888',
    marginBottom: '32px',
  },
  resultCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    fontSize: '14px',
  },
  resultPath: {
    color: '#22c55e',
    fontSize: '12px',
    wordBreak: 'break-all',
  },
  nextSteps: {
    textAlign: 'left',
    marginBottom: '24px',
  },
  codeBlock: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#22c55e',
  },
  completeActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  actionBtn: {
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  actionBtnSecondary: {
    padding: '14px 24px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    color: '#e4e4e4',
    fontSize: '15px',
    cursor: 'pointer',
  },

  // Deploy section in CompleteStep
  deploySection: {
    marginTop: '32px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  deployDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  deployDividerText: {
    flex: 1,
    textAlign: 'center',
    color: '#888',
    fontSize: '14px',
    position: 'relative',
  },
  deployBtn: {
    padding: '20px 48px',
    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    border: 'none',
    borderRadius: '14px',
    color: '#fff',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 24px rgba(139, 92, 246, 0.4)',
    transition: 'all 0.2s',
  },
  deployHint: {
    marginTop: '12px',
    fontSize: '13px',
    color: '#888',
  },

  // Deploying step
  deployingContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    maxWidth: '500px',
    margin: '0 auto',
  },
  deployingIcon: {
    fontSize: '72px',
    marginBottom: '24px',
    animation: 'bounce 1s infinite',
  },
  deployingTitle: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  deployingSubtitle: {
    color: '#888',
    fontSize: '16px',
    marginBottom: '32px',
  },
  deployingStatusCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '20px 32px',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  deployingSpinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(139, 92, 246, 0.2)',
    borderTop: '3px solid #8b5cf6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  deployingStatus: {
    fontSize: '16px',
    color: '#e4e4e4',
    fontWeight: '500',
  },
  deployingTimeline: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    marginBottom: '24px',
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#888',
  },
  timelineIcon: {
    fontSize: '16px',
  },
  deployingWarning: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'rgba(249, 115, 22, 0.1)',
    border: '1px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
    color: '#f97316',
  },
  warningIcon: {
    fontSize: '16px',
  },
  deployingSteps: {
    padding: '20px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
  },
  stepsTitle: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '12px',
  },
  stepsList: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#e4e4e4',
    flexWrap: 'wrap',
  },

  // Deploy complete
  deployCompleteContainer: {
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto',
  },
  deployCompleteIcon: {
    fontSize: '80px',
    marginBottom: '16px',
  },
  deployCompleteTitle: {
    fontSize: '42px',
    fontWeight: '800',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #22c55e, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  deployCompleteSubtitle: {
    color: '#888',
    fontSize: '18px',
    marginBottom: '32px',
  },
  liveUrlCard: {
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))',
    border: '2px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
  },
  liveUrlLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  liveUrlLink: {
    display: 'block',
    fontSize: '24px',
    fontWeight: '700',
    color: '#22c55e',
    textDecoration: 'none',
    marginBottom: '16px',
    wordBreak: 'break-all',
  },
  visitBtn: {
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  allUrlsCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  allUrlsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e4e4e4',
    marginBottom: '16px',
  },
  urlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  urlLabel: {
    width: '80px',
    fontSize: '13px',
    color: '#888',
  },
  urlValue: {
    flex: 1,
    fontSize: '13px',
    color: '#3b82f6',
    textDecoration: 'none',
    wordBreak: 'break-all',
  },
  copyBtn: {
    padding: '6px 10px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#888',
    fontSize: '12px',
    cursor: 'pointer',
  },
  credentialsCard: {
    background: 'rgba(249, 115, 22, 0.05)',
    border: '1px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  credentialsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f97316',
    marginBottom: '16px',
  },
  credentialRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
  },
  credentialLabel: {
    width: '80px',
    fontSize: '13px',
    color: '#888',
  },
  credentialValue: {
    flex: 1,
    fontSize: '14px',
    color: '#e4e4e4',
    fontFamily: 'monospace',
  },
  credentialHint: {
    fontSize: '12px',
    color: '#888',
    marginTop: '12px',
    fontStyle: 'italic',
  },
  deployCompleteActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  dnsNote: {
    fontSize: '13px',
    color: '#666',
  },

  // Error
  errorContainer: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  errorIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  errorTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: '12px',
  },
  errorMessage: {
    color: '#888',
    marginBottom: '32px',
  },
  errorActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
};

// Initialize global styles
export function initGlobalStyles() {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, sans-serif;
    }

    input::placeholder, textarea::placeholder {
      color: #666;
    }

    button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    button:active {
      transform: translateY(0);
    }
  `;
  document.head.appendChild(styleSheet);
}
