/**
 * UploadAssetsStep
 * Upload logo, photos, and menu/price list with color extraction
 */

import React, { useState } from 'react';
import { useWindowSize } from '../hooks';
import { getLayoutMode } from '../utils';
import { styles } from '../styles';

// Styles for improved Upload Assets Step
const uploadStyles = {
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  uploadCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '24px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  cardIcon: {
    fontSize: '28px'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    margin: 0
  },
  cardBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    background: 'rgba(34, 197, 94, 0.15)',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#22c55e',
    fontWeight: '500',
    marginTop: '4px'
  },
  cardBadgeOptional: {
    display: 'inline-block',
    padding: '2px 8px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#888',
    marginTop: '4px'
  },
  cardDesc: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '16px',
    lineHeight: '1.5'
  },
  tooltip: {
    fontSize: '16px',
    color: '#666',
    cursor: 'help'
  },
  // Dropzone styles
  dropzone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '32px 24px',
    background: 'rgba(0,0,0,0.2)',
    border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  dropzoneActive: {
    borderColor: '#22c55e',
    background: 'rgba(34, 197, 94, 0.1)',
    transform: 'scale(1.01)'
  },
  dropzoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  dropzoneMainIcon: {
    fontSize: '36px'
  },
  dropzoneMainText: {
    fontSize: '15px',
    color: '#e4e4e4',
    fontWeight: '500'
  },
  dropzoneHint: {
    fontSize: '12px',
    color: '#666'
  },
  // Example placeholder in dropzone
  exampleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    opacity: 0.5
  },
  exampleLogo: {
    width: '60px',
    height: '60px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px dashed rgba(255,255,255,0.2)'
  },
  exampleIcon: {
    fontSize: '24px',
    opacity: 0.5
  },
  exampleText: {
    fontSize: '12px',
    color: '#666'
  },
  // Progress bar
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'rgba(255,255,255,0.1)'
  },
  progressFill: {
    height: '100%',
    background: '#22c55e',
    transition: 'width 0.2s ease'
  },
  // Uploaded preview
  uploadedPreview: {
    display: 'flex',
    gap: '20px',
    padding: '16px',
    background: 'rgba(34, 197, 94, 0.08)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '12px'
  },
  logoPreviewContainer: {
    width: '100px',
    height: '100px',
    background: '#fff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    flexShrink: 0
  },
  logoPreview: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain'
  },
  uploadedDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  fileName: {
    fontSize: '14px',
    color: '#e4e4e4',
    fontWeight: '500'
  },
  extractingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#3b82f6'
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(59, 130, 246, 0.3)',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  extractedColors: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  extractedLabel: {
    fontSize: '12px',
    color: '#22c55e'
  },
  colorSwatches: {
    display: 'flex',
    gap: '8px'
  },
  colorSwatch: {
    width: '50px',
    height: '40px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: '4px',
    border: '2px solid rgba(255,255,255,0.2)'
  },
  colorLabel: {
    fontSize: '9px',
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    fontWeight: '600'
  },
  removeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '6px',
    color: '#ef4444',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '8px',
    width: 'fit-content'
  },
  // Photo grid
  photoGridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px'
  },
  photoItem: {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#1a1a2e'
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  photoOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
    ':hover': {
      background: 'rgba(0,0,0,0.5)'
    }
  },
  photoRemove: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '24px',
    height: '24px',
    background: 'rgba(0,0,0,0.7)',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
    transition: 'opacity 0.2s'
  },
  photoNumber: {
    position: 'absolute',
    bottom: '6px',
    left: '6px',
    width: '20px',
    height: '20px',
    background: 'rgba(0,0,0,0.7)',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  photoAddZone: {
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    background: 'rgba(255,255,255,0.03)',
    border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: '10px',
    cursor: 'pointer',
    color: '#888',
    transition: 'all 0.2s ease'
  },
  photoAddZoneActive: {
    borderColor: '#22c55e',
    background: 'rgba(34, 197, 94, 0.1)',
    color: '#22c55e'
  },
  photoAddIcon: {
    fontSize: '28px'
  },
  photoAddText: {
    fontSize: '11px'
  },
  photoCount: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    fontSize: '13px',
    color: '#888'
  },
  clearAllBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  // AI Generator
  aiGeneratorSection: {
    marginTop: '16px'
  },
  aiGeneratorBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '8px',
    color: '#a78bfa',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  aiGeneratorPanel: {
    marginTop: '12px',
    padding: '16px',
    background: 'rgba(139, 92, 246, 0.05)',
    borderRadius: '8px'
  },
  aiGeneratorDesc: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '12px',
    lineHeight: '1.5'
  },
  generateBtn: {
    width: '100%',
    padding: '10px',
    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  // Menu section
  menuDropzoneRow: {
    display: 'flex',
    gap: '20px',
    alignItems: 'stretch'
  },
  menuDropzone: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '24px',
    background: 'rgba(0,0,0,0.2)',
    border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  menuDropzoneIcon: {
    fontSize: '32px'
  },
  menuDropzoneText: {
    fontSize: '14px',
    color: '#e4e4e4'
  },
  menuExamples: {
    flex: 1,
    padding: '16px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '8px'
  },
  menuExamplesTitle: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '8px',
    display: 'block'
  },
  menuExamplesList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    color: '#666'
  },
  menuUploaded: {
    display: 'flex',
    gap: '20px',
    padding: '16px',
    background: 'rgba(34, 197, 94, 0.08)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '12px'
  },
  menuPreviewLarge: {
    width: '120px',
    height: '120px',
    background: '#fff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0
  },
  menuImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain'
  },
  pdfPreview: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    color: '#666'
  },
  pdfIcon: {
    fontSize: '36px'
  },
  menuDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  menuType: {
    fontSize: '12px',
    color: '#888',
    background: 'rgba(255,255,255,0.1)',
    padding: '2px 8px',
    borderRadius: '4px',
    width: 'fit-content'
  },
  menuHint: {
    fontSize: '13px',
    color: '#22c55e',
    margin: '8px 0'
  },
  // Style chips
  styleChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '12px'
  },
  styleChip: {
    padding: '6px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  styleChipActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
    color: '#22c55e'
  },
  styleTextarea: {
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
    lineHeight: '1.5'
  },
  // Detection banner
  detectionBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(34, 197, 94, 0.15))',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '12px',
    marginBottom: '24px'
  },
  detectionIcon: {
    fontSize: '24px'
  },
  detectionContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '14px',
    color: '#e4e4e4'
  },
  detectedStyle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#a78bfa'
  },
  changeStyleBtn: {
    padding: '6px 16px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    cursor: 'pointer'
  },
  // Asset summary
  assetSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '10px',
    marginTop: '24px'
  },
  summaryIcon: {
    fontSize: '20px'
  },
  summaryText: {
    fontSize: '14px',
    color: '#22c55e'
  },
  // Actions
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '32px',
    gap: '16px'
  },
  skipButton: {
    padding: '12px 24px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  continueButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

export function UploadAssetsStep({ projectData, updateProject, onContinue, onBack, onSkip }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [extractingColors, setExtractingColors] = useState(false);
  const [detectedStyle, setDetectedStyle] = useState(null);
  const [dragOver, setDragOver] = useState({ logo: false, photos: false, menu: false });
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  // Responsive layout detection
  const { width } = useWindowSize();
  const layoutMode = getLayoutMode(width);
  const isMobile = layoutMode === 'mobile';
  const isDesktop = layoutMode === 'desktop' || layoutMode === 'largeDesktop';

  // Visual style options for auto-detection
  const visualStyles = [
    { id: 'modern', label: 'Modern & Clean', keywords: ['sharp', 'geometric', 'minimal'] },
    { id: 'warm', label: 'Warm & Inviting', keywords: ['wood', 'earth', 'cozy'] },
    { id: 'bold', label: 'Bold & Dynamic', keywords: ['contrast', 'vibrant', 'energetic'] },
    { id: 'elegant', label: 'Elegant & Premium', keywords: ['luxury', 'refined', 'sophisticated'] },
    { id: 'playful', label: 'Playful & Fun', keywords: ['colorful', 'friendly', 'approachable'] },
    { id: 'minimal', label: 'Minimalist', keywords: ['simple', 'whitespace', 'focused'] },
  ];

  // Handle logo upload with drag-drop support
  const handleLogoUpload = async (e) => {
    const file = e.target?.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress({ ...uploadProgress, logo: 0 });

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => ({ ...prev, logo: Math.min((prev.logo || 0) + 20, 90) }));
    }, 100);

    const reader = new FileReader();
    reader.onload = async (event) => {
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, logo: 100 }));

      const base64 = event.target.result;

      updateProject({
        uploadedAssets: {
          ...projectData.uploadedAssets,
          logo: { file: file.name, base64, type: file.type }
        }
      });

      // Extract colors from logo
      setExtractingColors(true);
      try {
        const colors = await extractColorsFromImage(base64);
        if (colors) {
          updateProject({
            colors: {
              ...projectData.colors,
              primary: colors.primary || projectData.colors.primary,
              secondary: colors.secondary || projectData.colors.secondary,
              accent: colors.accent || projectData.colors.accent
            },
            colorMode: 'from-logo'
          });

          // Auto-detect visual style based on colors
          detectVisualStyle(colors);
        }
      } catch (err) {
        console.error('Color extraction failed:', err);
      }
      setExtractingColors(false);
      setUploading(false);
      setTimeout(() => setUploadProgress(prev => ({ ...prev, logo: null })), 500);
    };
    reader.readAsDataURL(file);
  };

  // Detect visual style based on colors
  const detectVisualStyle = (colors) => {
    const primary = colors.primary;
    const r = parseInt(primary.slice(1, 3), 16);
    const g = parseInt(primary.slice(3, 5), 16);
    const b = parseInt(primary.slice(5, 7), 16);

    // Simple heuristics for style detection
    const brightness = (r + g + b) / 3;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);

    let style = 'modern';
    if (saturation < 50 && brightness > 150) style = 'minimal';
    else if (r > 180 && g < 100) style = 'bold';
    else if (r > 150 && g > 100 && b < 100) style = 'warm';
    else if (saturation > 150) style = 'playful';
    else if (brightness < 80) style = 'elegant';

    setDetectedStyle(style);
    updateProject({ detectedVisualStyle: style });
  };

  // Handle photos upload with progress
  const handlePhotosUpload = async (e) => {
    const files = Array.from(e.target?.files || e.dataTransfer?.files || []).slice(0, 10);
    if (files.length === 0) return;

    setUploading(true);

    const promises = files.map((file, idx) => {
      return new Promise((resolve) => {
        setUploadProgress(prev => ({ ...prev, [`photo_${idx}`]: 0 }));

        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [`photo_${idx}`]: Math.min((prev[`photo_${idx}`] || 0) + 15, 90)
          }));
        }, 50);

        const reader = new FileReader();
        reader.onload = (event) => {
          clearInterval(progressInterval);
          setUploadProgress(prev => ({ ...prev, [`photo_${idx}`]: 100 }));
          resolve({ file: file.name, base64: event.target.result, type: file.type });
        };
        reader.readAsDataURL(file);
      });
    });

    const photos = await Promise.all(promises);
    updateProject({
      uploadedAssets: {
        ...projectData.uploadedAssets,
        photos: [...(projectData.uploadedAssets?.photos || []), ...photos].slice(0, 10)
      }
    });
    setUploading(false);
    setTimeout(() => setUploadProgress({}), 500);
  };

  // Handle menu upload
  const handleMenuUpload = (e) => {
    const file = e.target?.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress({ ...uploadProgress, menu: 0 });

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => ({ ...prev, menu: Math.min((prev.menu || 0) + 25, 90) }));
    }, 100);

    const reader = new FileReader();
    reader.onload = (event) => {
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, menu: 100 }));

      updateProject({
        uploadedAssets: {
          ...projectData.uploadedAssets,
          menu: { file: file.name, base64: event.target.result, type: file.type }
        }
      });
      setUploading(false);
      setTimeout(() => setUploadProgress(prev => ({ ...prev, menu: null })), 500);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e, zone) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(prev => ({ ...prev, [zone]: true }));
  };

  const handleDragLeave = (e, zone) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(prev => ({ ...prev, [zone]: false }));
  };

  const handleDrop = (e, zone, handler) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(prev => ({ ...prev, [zone]: false }));
    handler(e);
  };

  // Remove handlers
  const removePhoto = (index) => {
    const photos = [...(projectData.uploadedAssets?.photos || [])];
    photos.splice(index, 1);
    updateProject({ uploadedAssets: { ...projectData.uploadedAssets, photos } });
  };

  const removeLogo = () => {
    updateProject({
      uploadedAssets: { ...projectData.uploadedAssets, logo: null },
      colorMode: null
    });
    setDetectedStyle(null);
  };

  const removeMenu = () => {
    updateProject({ uploadedAssets: { ...projectData.uploadedAssets, menu: null } });
  };

  // Extract colors from image using canvas
  const extractColorsFromImage = (base64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const colors = [];
        const samplePoints = [
          { x: img.width * 0.25, y: img.height * 0.25 },
          { x: img.width * 0.5, y: img.height * 0.5 },
          { x: img.width * 0.75, y: img.height * 0.75 },
          { x: img.width * 0.1, y: img.height * 0.1 },
          { x: img.width * 0.9, y: img.height * 0.1 },
        ];

        samplePoints.forEach(point => {
          try {
            const data = ctx.getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1).data;
            if (data[3] > 50) {
              const hex = '#' + [data[0], data[1], data[2]].map(x => x.toString(16).padStart(2, '0')).join('');
              colors.push(hex);
            }
          } catch (e) {}
        });

        const validColors = colors.filter(c => {
          const r = parseInt(c.slice(1, 3), 16);
          const g = parseInt(c.slice(3, 5), 16);
          const b = parseInt(c.slice(5, 7), 16);
          const isGray = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30;
          const isTooLight = r > 240 && g > 240 && b > 240;
          const isTooDark = r < 15 && g < 15 && b < 15;
          return !isGray && !isTooLight && !isTooDark;
        });

        if (validColors.length >= 2) {
          resolve({ primary: validColors[0], secondary: validColors[1], accent: validColors[2] || validColors[0] });
        } else if (validColors.length === 1) {
          resolve({ primary: validColors[0], secondary: validColors[0], accent: validColors[0] });
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = base64;
    });
  };

  const assets = projectData.uploadedAssets || {};
  const hasAnyAssets = assets.logo || (assets.photos && assets.photos.length > 0) || assets.menu;

  // Responsive styles for upload step
  const uploadResponsiveStyles = {
    container: {
      maxWidth: isDesktop ? '1400px' : '100%',
      margin: '0 auto',
      padding: isMobile ? '16px' : '32px'
    },
    grid: {
      display: isDesktop ? 'grid' : 'flex',
      gridTemplateColumns: isDesktop ? '1fr 1fr' : undefined,
      flexDirection: isDesktop ? undefined : 'column',
      gap: isMobile ? '16px' : '24px'
    },
    fullWidth: {
      gridColumn: isDesktop ? 'span 2' : undefined
    }
  };

  return (
    <div style={{...styles.stepContainer, ...uploadResponsiveStyles.container}}>
      <button style={styles.backBtn} onClick={onBack}>← Back</button>

      <h1 style={{...styles.stepTitle, fontSize: isMobile ? '24px' : '32px'}}>
        📸 Upload Your Assets
      </h1>
      <p style={{...styles.stepSubtitle, maxWidth: '600px', margin: '0 auto 32px'}}>
        Your logo and photos will be used throughout your website. We'll automatically extract colors and detect your visual style.
      </p>

      {/* Smart Detection Banner - shown when style is detected */}
      {detectedStyle && (
        <div style={uploadStyles.detectionBanner}>
          <div style={uploadStyles.detectionIcon}>✨</div>
          <div style={uploadStyles.detectionContent}>
            <strong>Based on your uploads, we detected:</strong>
            <span style={uploadStyles.detectedStyle}>
              {visualStyles.find(s => s.id === detectedStyle)?.label || 'Modern & Clean'} Style
            </span>
          </div>
          <button
            style={uploadStyles.changeStyleBtn}
            onClick={() => setDetectedStyle(null)}
          >
            Change
          </button>
        </div>
      )}

      <div style={uploadResponsiveStyles.grid}>
        {/* LEFT COLUMN: Logo & Colors */}
        <div style={uploadStyles.column}>
          {/* Logo Upload */}
          <div style={uploadStyles.uploadCard}>
            <div style={uploadStyles.cardHeader}>
              <div style={uploadStyles.cardTitleRow}>
                <span style={uploadStyles.cardIcon}>🎨</span>
                <div>
                  <h3 style={uploadStyles.cardTitle}>Your Logo</h3>
                  <span style={uploadStyles.cardBadge}>Recommended</span>
                </div>
              </div>
              <div
                style={uploadStyles.tooltip}
                title="Your logo appears in the header, footer, and favicon. We'll also extract your brand colors from it."
              >
                ⓘ
              </div>
            </div>

            <p style={uploadStyles.cardDesc}>
              We'll extract brand colors and use it across your site header, footer, and favicon.
            </p>

            {assets.logo ? (
              <div style={uploadStyles.uploadedPreview}>
                <div style={uploadStyles.logoPreviewContainer}>
                  <img src={assets.logo.base64} alt="Logo" style={uploadStyles.logoPreview} />
                </div>
                <div style={uploadStyles.uploadedDetails}>
                  <span style={uploadStyles.fileName}>{assets.logo.file}</span>
                  {extractingColors && (
                    <div style={uploadStyles.extractingRow}>
                      <div style={uploadStyles.spinner} />
                      <span>Extracting colors...</span>
                    </div>
                  )}
                  {projectData.colorMode === 'from-logo' && !extractingColors && (
                    <div style={uploadStyles.extractedColors}>
                      <span style={uploadStyles.extractedLabel}>Extracted Colors:</span>
                      <div style={uploadStyles.colorSwatches}>
                        <div style={{...uploadStyles.colorSwatch, background: projectData.colors.primary}}>
                          <span style={uploadStyles.colorLabel}>Primary</span>
                        </div>
                        <div style={{...uploadStyles.colorSwatch, background: projectData.colors.secondary}}>
                          <span style={uploadStyles.colorLabel}>Secondary</span>
                        </div>
                        <div style={{...uploadStyles.colorSwatch, background: projectData.colors.accent}}>
                          <span style={uploadStyles.colorLabel}>Accent</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <button style={uploadStyles.removeButton} onClick={removeLogo}>
                    <span>✕</span> Remove & Re-upload
                  </button>
                </div>
              </div>
            ) : (
              <label
                style={{
                  ...uploadStyles.dropzone,
                  ...(dragOver.logo ? uploadStyles.dropzoneActive : {})
                }}
                onDragOver={(e) => handleDragOver(e, 'logo')}
                onDragLeave={(e) => handleDragLeave(e, 'logo')}
                onDrop={(e) => handleDrop(e, 'logo', handleLogoUpload)}
              >
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />

                {/* Example placeholder */}
                <div style={uploadStyles.exampleContainer}>
                  <div style={uploadStyles.exampleLogo}>
                    <span style={uploadStyles.exampleIcon}>🏢</span>
                  </div>
                  <span style={uploadStyles.exampleText}>Your logo here</span>
                </div>

                <div style={uploadStyles.dropzoneContent}>
                  <span style={uploadStyles.dropzoneMainIcon}>
                    {dragOver.logo ? '📥' : '📤'}
                  </span>
                  <span style={uploadStyles.dropzoneMainText}>
                    {dragOver.logo ? 'Drop your logo!' : 'Drag logo here or click to browse'}
                  </span>
                  <span style={uploadStyles.dropzoneHint}>
                    PNG, JPG, or SVG • Transparent background works best
                  </span>
                </div>

                {uploadProgress.logo !== undefined && uploadProgress.logo !== null && (
                  <div style={uploadStyles.progressBar}>
                    <div style={{...uploadStyles.progressFill, width: `${uploadProgress.logo}%`}} />
                  </div>
                )}
              </label>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Photos */}
        <div style={uploadStyles.column}>
          {/* Product Photos Upload */}
          <div style={uploadStyles.uploadCard}>
            <div style={uploadStyles.cardHeader}>
              <div style={uploadStyles.cardTitleRow}>
                <span style={uploadStyles.cardIcon}>🖼️</span>
                <div>
                  <h3 style={uploadStyles.cardTitle}>Product & Gallery Photos</h3>
                  <span style={uploadStyles.cardBadgeOptional}>Up to 10</span>
                </div>
              </div>
              <div
                style={uploadStyles.tooltip}
                title="These photos appear in your gallery, product sections, and as background images throughout the site."
              >
                ⓘ
              </div>
            </div>

            <p style={uploadStyles.cardDesc}>
              High-quality photos of your products, services, team, or location. These create the visual foundation of your site.
            </p>

            <div style={uploadStyles.photoGridContainer}>
              {/* Uploaded photos */}
              {(assets.photos || []).map((photo, index) => (
                <div key={index} style={uploadStyles.photoItem}>
                  <img src={photo.base64} alt={`Photo ${index + 1}`} style={uploadStyles.photoThumb} />
                  <div style={uploadStyles.photoOverlay}>
                    <button style={uploadStyles.photoRemove} onClick={() => removePhoto(index)}>✕</button>
                  </div>
                  <span style={uploadStyles.photoNumber}>{index + 1}</span>
                </div>
              ))}

              {/* Add more button */}
              {(!assets.photos || assets.photos.length < 10) && (
                <label
                  style={{
                    ...uploadStyles.photoAddZone,
                    ...(dragOver.photos ? uploadStyles.photoAddZoneActive : {})
                  }}
                  onDragOver={(e) => handleDragOver(e, 'photos')}
                  onDragLeave={(e) => handleDragLeave(e, 'photos')}
                  onDrop={(e) => handleDrop(e, 'photos', handlePhotosUpload)}
                >
                  <input type="file" accept="image/*" multiple onChange={handlePhotosUpload} style={{ display: 'none' }} />
                  <span style={uploadStyles.photoAddIcon}>+</span>
                  <span style={uploadStyles.photoAddText}>
                    {assets.photos?.length ? 'Add More' : 'Add Photos'}
                  </span>
                </label>
              )}
            </div>

            {assets.photos && assets.photos.length > 0 && (
              <div style={uploadStyles.photoCount}>
                <span>{assets.photos.length}/10 photos</span>
                <button style={uploadStyles.clearAllBtn} onClick={() => updateProject({ uploadedAssets: { ...assets, photos: [] }})}>
                  Clear all
                </button>
              </div>
            )}

            {/* AI Placeholder Generator */}
            {(!assets.photos || assets.photos.length === 0) && (
              <div style={uploadStyles.aiGeneratorSection}>
                <button
                  style={uploadStyles.aiGeneratorBtn}
                  onClick={() => setShowAIGenerator(!showAIGenerator)}
                >
                  <span>🤖</span>
                  <span>Don't have photos? Use AI placeholders</span>
                </button>

                {showAIGenerator && (
                  <div style={uploadStyles.aiGeneratorPanel}>
                    <p style={uploadStyles.aiGeneratorDesc}>
                      We'll generate professional placeholder images based on your business type.
                      You can replace them with real photos anytime.
                    </p>
                    <button
                      style={uploadStyles.generateBtn}
                      onClick={() => {
                        updateProject({ useAIPlaceholders: true });
                        setShowAIGenerator(false);
                      }}
                    >
                      ✨ Generate {projectData.industry?.name || 'Business'} Placeholders
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FULL WIDTH: Menu/Pricing */}
        <div style={{...uploadStyles.uploadCard, ...uploadResponsiveStyles.fullWidth}}>
          <div style={uploadStyles.cardHeader}>
            <div style={uploadStyles.cardTitleRow}>
              <span style={uploadStyles.cardIcon}>📋</span>
              <div>
                <h3 style={uploadStyles.cardTitle}>Menu or Price List</h3>
                <span style={uploadStyles.cardBadgeOptional}>Optional</span>
              </div>
            </div>
            <div
              style={uploadStyles.tooltip}
              title="If you have a menu, price list, or service catalog, upload it and our AI will extract the content for your website."
            >
              ⓘ
            </div>
          </div>

          {assets.menu ? (
            <div style={uploadStyles.menuUploaded}>
              <div style={uploadStyles.menuPreviewLarge}>
                {assets.menu.type.includes('image') ? (
                  <img src={assets.menu.base64} alt="Menu" style={uploadStyles.menuImage} />
                ) : (
                  <div style={uploadStyles.pdfPreview}>
                    <span style={uploadStyles.pdfIcon}>📄</span>
                    <span>PDF Document</span>
                  </div>
                )}
              </div>
              <div style={uploadStyles.menuDetails}>
                <span style={uploadStyles.fileName}>{assets.menu.file}</span>
                <span style={uploadStyles.menuType}>
                  {assets.menu.type.includes('pdf') ? 'PDF' : 'Image'}
                </span>
                <p style={uploadStyles.menuHint}>
                  ✨ AI will extract items and prices from this file
                </p>
                <button style={uploadStyles.removeButton} onClick={removeMenu}>
                  <span>✕</span> Remove
                </button>
              </div>
            </div>
          ) : (
            <div style={uploadStyles.menuDropzoneRow}>
              <label
                style={{
                  ...uploadStyles.menuDropzone,
                  ...(dragOver.menu ? uploadStyles.dropzoneActive : {})
                }}
                onDragOver={(e) => handleDragOver(e, 'menu')}
                onDragLeave={(e) => handleDragLeave(e, 'menu')}
                onDrop={(e) => handleDrop(e, 'menu', handleMenuUpload)}
              >
                <input type="file" accept="image/*,.pdf" onChange={handleMenuUpload} style={{ display: 'none' }} />
                <span style={uploadStyles.menuDropzoneIcon}>📋</span>
                <span style={uploadStyles.menuDropzoneText}>Drop menu or price list</span>
                <span style={uploadStyles.dropzoneHint}>PDF or Image</span>
              </label>

              <div style={uploadStyles.menuExamples}>
                <span style={uploadStyles.menuExamplesTitle}>Works great for:</span>
                <ul style={uploadStyles.menuExamplesList}>
                  <li>🍽️ Restaurant menus</li>
                  <li>💇 Service price lists</li>
                  <li>🏋️ Class schedules</li>
                  <li>📦 Product catalogs</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* FULL WIDTH: Visual Style Description */}
        <div style={{...uploadStyles.uploadCard, ...uploadResponsiveStyles.fullWidth}}>
          <div style={uploadStyles.cardHeader}>
            <div style={uploadStyles.cardTitleRow}>
              <span style={uploadStyles.cardIcon}>✨</span>
              <div>
                <h3 style={uploadStyles.cardTitle}>Describe Your Visual Style</h3>
                <span style={uploadStyles.cardBadgeOptional}>Optional</span>
              </div>
            </div>
          </div>

          <p style={uploadStyles.cardDesc}>
            Tell our AI what kind of look and feel you want. Be as specific as you like!
          </p>

          {/* Quick style chips */}
          <div style={uploadStyles.styleChips}>
            {['Modern & minimal', 'Warm & cozy', 'Bold & vibrant', 'Elegant & premium', 'Fun & playful', 'Dark & moody'].map(style => (
              <button
                key={style}
                style={{
                  ...uploadStyles.styleChip,
                  ...(projectData.imageDescription?.includes(style) ? uploadStyles.styleChipActive : {})
                }}
                onClick={() => {
                  const current = projectData.imageDescription || '';
                  if (current.includes(style)) {
                    updateProject({ imageDescription: current.replace(style, '').trim() });
                  } else {
                    updateProject({ imageDescription: current ? `${current}, ${style}` : style });
                  }
                }}
              >
                {style}
              </button>
            ))}
          </div>

          <textarea
            value={projectData.imageDescription || ''}
            onChange={(e) => updateProject({ imageDescription: e.target.value })}
            placeholder="Example: 'I want a warm, rustic feel with wood textures and earth tones. Think artisan coffee shop meets modern design studio. Lots of natural light and friendly vibes.'"
            style={uploadStyles.styleTextarea}
            rows={3}
          />
        </div>
      </div>

      {/* Asset Summary */}
      {hasAnyAssets && (
        <div style={uploadStyles.assetSummary}>
          <span style={uploadStyles.summaryIcon}>✅</span>
          <span style={uploadStyles.summaryText}>
            {assets.logo && '1 logo'}
            {assets.logo && assets.photos?.length ? ', ' : ''}
            {assets.photos?.length ? `${assets.photos.length} photo${assets.photos.length > 1 ? 's' : ''}` : ''}
            {(assets.logo || assets.photos?.length) && assets.menu ? ', ' : ''}
            {assets.menu && '1 menu/price list'}
            {' ready to use'}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div style={uploadStyles.actions}>
        <button
          style={uploadStyles.skipButton}
          onClick={onSkip}
        >
          Skip for now
        </button>
        <button
          style={{...uploadStyles.continueButton, opacity: uploading ? 0.5 : 1}}
          onClick={onContinue}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <div style={uploadStyles.buttonSpinner} />
              Uploading...
            </>
          ) : hasAnyAssets ? (
            'Continue with Assets →'
          ) : (
            'Continue →'
          )}
        </button>
      </div>
    </div>
  );
}
