/**
 * ToolCustomizationScreen
 * Single tool customization with branding options
 */

import React, { useState } from 'react';
import { COLOR_PRESETS } from '../constants';

const toolStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    minHeight: '70vh',
    maxWidth: '600px',
    margin: '0 auto'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  icon: {
    fontSize: '3rem',
    marginBottom: '12px'
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
  input: {
    padding: '12px 16px',
    fontSize: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.2s ease'
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
    padding: '14px 10px',
    background: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  styleOptionSelected: {
    borderColor: '#f59e0b',
    background: '#fffbeb'
  },
  logoDropzone: {
    padding: '20px',
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: '#f9fafb'
  },
  logoDropzoneActive: {
    borderColor: '#f59e0b',
    background: '#fffbeb'
  },
  logoPreview: {
    maxWidth: '100px',
    maxHeight: '60px',
    objectFit: 'contain',
    marginBottom: '8px'
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '24px',
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
  skipBtn: {
    padding: '12px 24px',
    fontSize: '0.95rem',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    fontWeight: '500',
    textDecoration: 'underline'
  },
  generateBtn: {
    padding: '14px 28px',
    fontSize: '1.05rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
  }
};

export function ToolCustomizationScreen({
  tool,
  toolName,
  toolIcon,
  sharedContext,
  onGenerate,
  onBack,
  onSkip,
  onUpdateContext
}) {
  const [businessName, setBusinessName] = useState(sharedContext?.businessName || '');
  const [brandColor, setBrandColor] = useState(sharedContext?.brandColor || '#3b82f6');
  const [style, setStyle] = useState(sharedContext?.style || 'modern');
  const [logo, setLogo] = useState(sharedContext?.logo || null);
  const [dragOver, setDragOver] = useState(false);

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
    if (onUpdateContext) {
      onUpdateContext({
        ...sharedContext,
        businessName,
        brandColor,
        style,
        logo
      });
    }
    onGenerate({
      businessName,
      brandColor,
      style,
      logo,
      tool
    });
  };

  return (
    <div style={toolStyles.container}>
      <div style={toolStyles.header}>
        <div style={toolStyles.icon}>{toolIcon || '🔧'}</div>
        <h1 style={toolStyles.title}>{toolName || 'Your Tool'}</h1>
        <p style={toolStyles.subtitle}>Customize your tool (optional)</p>
      </div>

      <div style={toolStyles.form}>
        <div style={toolStyles.inputGroup}>
          <label style={toolStyles.label}>Business Name</label>
          <input
            type="text"
            placeholder="e.g., Sunrise Bakery"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            style={toolStyles.input}
            onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        <div style={toolStyles.inputGroup}>
          <label style={toolStyles.label}>Brand Color</label>
          <div style={toolStyles.colorSection}>
            <div style={toolStyles.colorPicker}>
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                style={toolStyles.colorInput}
              />
              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>{brandColor}</span>
            </div>
            <div style={toolStyles.colorPresets}>
              {COLOR_PRESETS.map((preset) => (
                <div
                  key={preset.color}
                  title={preset.name}
                  style={{
                    ...toolStyles.colorSwatch,
                    background: preset.color,
                    ...(brandColor === preset.color ? toolStyles.colorSwatchSelected : {})
                  }}
                  onClick={() => setBrandColor(preset.color)}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={toolStyles.inputGroup}>
          <label style={toolStyles.label}>Style</label>
          <div style={toolStyles.styleOptions}>
            {['Modern', 'Minimal', 'Playful', 'Professional'].map((opt) => (
              <div
                key={opt.toLowerCase()}
                style={{
                  ...toolStyles.styleOption,
                  ...(style === opt.toLowerCase() ? toolStyles.styleOptionSelected : {})
                }}
                onClick={() => setStyle(opt.toLowerCase())}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>

        <div style={toolStyles.inputGroup}>
          <label style={toolStyles.label}>Logo</label>
          <div
            style={{
              ...toolStyles.logoDropzone,
              ...(dragOver ? toolStyles.logoDropzoneActive : {})
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleLogoDrop}
            onClick={() => document.getElementById('tool-logo-input').click()}
          >
            {logo ? (
              <>
                <img src={logo} alt="Logo preview" style={toolStyles.logoPreview} />
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Click or drop to replace</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>📁</div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Drop image or click to browse</div>
              </>
            )}
            <input
              id="tool-logo-input"
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div style={toolStyles.actions}>
          <button style={toolStyles.backBtn} onClick={onBack}>
            ← Back
          </button>
          <button style={toolStyles.skipBtn} onClick={onSkip}>
            Skip Customization
          </button>
          <button style={toolStyles.generateBtn} onClick={handleGenerate}>
            ⚡ BLINK →
          </button>
        </div>
      </div>
    </div>
  );
}
