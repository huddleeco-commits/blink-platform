/**
 * ToolSuiteBuilderScreen
 * Configure and build a multi-tool suite with shared branding
 */

import React, { useState } from 'react';
import { API_BASE } from '../constants';

const suiteStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    minHeight: '70vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#666'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
    width: '100%',
    maxWidth: '1000px'
  },
  section: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e2e8f0'
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#1f2937'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: '500',
    marginBottom: '8px',
    color: '#4b5563'
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '0.95rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none'
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '0.95rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    background: 'white'
  },
  colorPicker: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  colorInput: {
    width: '50px',
    height: '40px',
    padding: '2px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  colorPresets: {
    display: 'flex',
    gap: '8px'
  },
  colorPreset: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '2px solid transparent'
  },
  toolList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  toolItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0'
  },
  toolIcon: {
    fontSize: '1.5rem'
  },
  toolInfo: {
    flex: 1
  },
  toolName: {
    fontWeight: '600',
    fontSize: '0.95rem'
  },
  toolDesc: {
    fontSize: '0.8rem',
    color: '#666'
  },
  toolActions: {
    display: 'flex',
    gap: '4px'
  },
  toolBtn: {
    padding: '6px 8px',
    background: '#e2e8f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem'
  },
  removeBtn: {
    padding: '6px 8px',
    background: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem'
  },
  orgOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  orgOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#f8fafc',
    borderRadius: '10px',
    border: '2px solid #e2e8f0',
    cursor: 'pointer'
  },
  orgOptionSelected: {
    borderColor: '#8b5cf6',
    background: '#f5f3ff'
  },
  orgRadio: {
    width: '18px',
    height: '18px',
    accentColor: '#8b5cf6'
  },
  orgLabel: {
    flex: 1
  },
  orgTitle: {
    fontWeight: '600',
    fontSize: '0.9rem'
  },
  orgDesc: {
    fontSize: '0.8rem',
    color: '#666'
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '32px',
    width: '100%',
    maxWidth: '1000px'
  },
  backBtn: {
    padding: '14px 28px',
    fontSize: '0.95rem',
    background: 'transparent',
    border: '1px solid #ddd',
    borderRadius: '10px',
    cursor: 'pointer',
    color: '#666'
  },
  buildBtn: {
    padding: '14px 40px',
    fontSize: '1rem',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  buildBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  error: {
    color: '#dc2626',
    background: '#fee2e2',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '0.9rem'
  },
  building: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '60px'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #8b5cf6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  styleGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  styleOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  styleOptionSelected: {
    borderColor: '#8b5cf6',
    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.15)'
  },
  styleIcon: {
    fontSize: '1.5rem',
    width: '40px',
    textAlign: 'center'
  },
  styleInfo: {
    flex: 1
  },
  styleName: {
    fontWeight: '600',
    fontSize: '0.95rem',
    marginBottom: '2px'
  },
  styleDesc: {
    fontSize: '0.8rem',
    color: '#666'
  },
  styleCheck: {
    color: '#8b5cf6',
    fontWeight: 'bold',
    fontSize: '1.1rem'
  }
};

const colorPresets = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#1f2937'];

export function ToolSuiteBuilderScreen({ selectedTools, recommendations, industry, onBuild, onBack }) {
  const [businessName, setBusinessName] = useState(industry ? `${industry.charAt(0).toUpperCase() + industry.slice(1)} Tools` : 'My Tool Suite');
  const [stylePreset, setStylePreset] = useState('modern');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [organization, setOrganization] = useState('auto');
  const [toolOrder, setToolOrder] = useState(selectedTools);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState(null);

  // Get full tool info from recommendations
  const tools = toolOrder.map(toolType => {
    const rec = recommendations.find(r => r.toolType === toolType);
    return rec || { toolType, name: toolType, icon: '🔧', description: '' };
  });

  const moveToolUp = (index) => {
    if (index <= 0) return;
    const newOrder = [...toolOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setToolOrder(newOrder);
  };

  const moveToolDown = (index) => {
    if (index >= toolOrder.length - 1) return;
    const newOrder = [...toolOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setToolOrder(newOrder);
  };

  const removeTool = (toolType) => {
    setToolOrder(prev => prev.filter(t => t !== toolType));
  };

  const handleBuildSuite = async () => {
    if (toolOrder.length < 2) {
      setError('At least 2 tools required for a suite');
      return;
    }

    setBuilding(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/orchestrate/build-suite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: tools.map(t => ({
            toolType: t.toolType,
            name: t.name,
            icon: t.icon,
            description: t.description,
            category: t.category
          })),
          branding: {
            businessName,
            colors: { primary: primaryColor, accent: primaryColor },
            style: stylePreset
          },
          options: {
            organization: organization === 'auto' ? null : organization,
            toolOrder
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        onBuild(data);
      } else {
        setError(data.error || 'Failed to build suite');
      }
    } catch (err) {
      setError(`Build failed: ${err.message}`);
    } finally {
      setBuilding(false);
    }
  };

  // Determine suggested organization
  const suggestedOrg = toolOrder.length <= 4 ? 'tabbed' : toolOrder.length <= 8 ? 'grid' : 'sidebar';

  if (building) {
    return (
      <div style={suiteStyles.container}>
        <div style={suiteStyles.building}>
          <div style={suiteStyles.spinner} />
          <h2>Building Your Tool Suite</h2>
          <p style={{ color: '#666' }}>Generating {toolOrder.length} tools with shared branding...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={suiteStyles.container}>
      <div style={suiteStyles.header}>
        <h1 style={suiteStyles.title}>🧰 Build Tool Suite</h1>
        <p style={suiteStyles.subtitle}>
          Customize your {toolOrder.length}-tool suite with unified branding
        </p>
      </div>

      {error && <div style={suiteStyles.error}>{error}</div>}

      <div style={suiteStyles.content}>
        {/* Left Column - Branding */}
        <div style={suiteStyles.section}>
          <h3 style={suiteStyles.sectionTitle}>✨ Branding</h3>

          <div style={suiteStyles.formGroup}>
            <label style={suiteStyles.label}>Business/Suite Name</label>
            <input
              type="text"
              style={suiteStyles.input}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="My Business Tools"
            />
          </div>

          <div style={suiteStyles.formGroup}>
            <label style={suiteStyles.label}>Brand Color</label>
            <div style={suiteStyles.colorPicker}>
              <input
                type="color"
                style={suiteStyles.colorInput}
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
              <div style={suiteStyles.colorPresets}>
                {colorPresets.map(color => (
                  <div
                    key={color}
                    style={{
                      ...suiteStyles.colorPreset,
                      background: color,
                      borderColor: primaryColor === color ? '#333' : 'transparent'
                    }}
                    onClick={() => setPrimaryColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={suiteStyles.formGroup}>
            <label style={suiteStyles.label}>Visual Style</label>
            <div style={suiteStyles.styleGrid}>
              {[
                { id: 'modern', name: 'Modern', icon: '✨', desc: 'Clean lines, subtle shadows, rounded corners' },
                { id: 'classic', name: 'Classic', icon: '📜', desc: 'Traditional, serif fonts, structured layout' },
                { id: 'futuristic', name: 'Futuristic', icon: '🚀', desc: 'Gradients, glows, animated elements' },
                { id: 'luxury', name: 'Luxury', icon: '👑', desc: 'Gold accents, elegant typography, premium feel' },
                { id: 'minimal', name: 'Minimal', icon: '○', desc: 'Lots of whitespace, simple, focused' }
              ].map(style => (
                <div
                  key={style.id}
                  style={{
                    ...suiteStyles.styleOption,
                    ...(stylePreset === style.id ? suiteStyles.styleOptionSelected : {})
                  }}
                  onClick={() => setStylePreset(style.id)}
                >
                  <span style={suiteStyles.styleIcon}>{style.icon}</span>
                  <div style={suiteStyles.styleInfo}>
                    <div style={suiteStyles.styleName}>{style.name}</div>
                    <div style={suiteStyles.styleDesc}>{style.desc}</div>
                  </div>
                  {stylePreset === style.id && <span style={suiteStyles.styleCheck}>✓</span>}
                </div>
              ))}
            </div>
          </div>

          <div style={suiteStyles.formGroup}>
            <label style={suiteStyles.label}>Layout Organization</label>
            <div style={suiteStyles.orgOptions}>
              <div
                style={{
                  ...suiteStyles.orgOption,
                  ...(organization === 'auto' ? suiteStyles.orgOptionSelected : {})
                }}
                onClick={() => setOrganization('auto')}
              >
                <input
                  type="radio"
                  checked={organization === 'auto'}
                  onChange={() => setOrganization('auto')}
                  style={suiteStyles.orgRadio}
                />
                <div style={suiteStyles.orgLabel}>
                  <div style={suiteStyles.orgTitle}>Auto ({suggestedOrg})</div>
                  <div style={suiteStyles.orgDesc}>Best layout for {toolOrder.length} tools</div>
                </div>
              </div>
              <div
                style={{
                  ...suiteStyles.orgOption,
                  ...(organization === 'tabbed' ? suiteStyles.orgOptionSelected : {})
                }}
                onClick={() => setOrganization('tabbed')}
              >
                <input
                  type="radio"
                  checked={organization === 'tabbed'}
                  onChange={() => setOrganization('tabbed')}
                  style={suiteStyles.orgRadio}
                />
                <div style={suiteStyles.orgLabel}>
                  <div style={suiteStyles.orgTitle}>Tabbed (All-in-One)</div>
                  <div style={suiteStyles.orgDesc}>Single page with tabs, best for 2-4 tools</div>
                </div>
              </div>
              <div
                style={{
                  ...suiteStyles.orgOption,
                  ...(organization === 'grid' ? suiteStyles.orgOptionSelected : {})
                }}
                onClick={() => setOrganization('grid')}
              >
                <input
                  type="radio"
                  checked={organization === 'grid'}
                  onChange={() => setOrganization('grid')}
                  style={suiteStyles.orgRadio}
                />
                <div style={suiteStyles.orgLabel}>
                  <div style={suiteStyles.orgTitle}>Grid Index</div>
                  <div style={suiteStyles.orgDesc}>Dashboard with separate pages, best for 5-8 tools</div>
                </div>
              </div>
              <div
                style={{
                  ...suiteStyles.orgOption,
                  ...(organization === 'sidebar' ? suiteStyles.orgOptionSelected : {})
                }}
                onClick={() => setOrganization('sidebar')}
              >
                <input
                  type="radio"
                  checked={organization === 'sidebar'}
                  onChange={() => setOrganization('sidebar')}
                  style={suiteStyles.orgRadio}
                />
                <div style={suiteStyles.orgLabel}>
                  <div style={suiteStyles.orgTitle}>Sidebar Navigation</div>
                  <div style={suiteStyles.orgDesc}>Categorized sidebar, best for 9+ tools</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Tool Selection */}
        <div style={suiteStyles.section}>
          <h3 style={suiteStyles.sectionTitle}>🛠️ Tools ({toolOrder.length})</h3>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '16px' }}>
            Drag to reorder, or use arrows
          </p>

          <div style={suiteStyles.toolList}>
            {tools.map((tool, index) => (
              <div key={tool.toolType} style={suiteStyles.toolItem}>
                <span style={suiteStyles.toolIcon}>{tool.icon || '🔧'}</span>
                <div style={suiteStyles.toolInfo}>
                  <div style={suiteStyles.toolName}>{tool.name}</div>
                  <div style={suiteStyles.toolDesc}>{tool.description?.substring(0, 50)}...</div>
                </div>
                <div style={suiteStyles.toolActions}>
                  <button
                    style={suiteStyles.toolBtn}
                    onClick={() => moveToolUp(index)}
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    style={suiteStyles.toolBtn}
                    onClick={() => moveToolDown(index)}
                    disabled={index === tools.length - 1}
                  >
                    ↓
                  </button>
                  {toolOrder.length > 2 && (
                    <button
                      style={suiteStyles.removeBtn}
                      onClick={() => removeTool(tool.toolType)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={suiteStyles.actions}>
        <button style={suiteStyles.backBtn} onClick={onBack}>
          ← Back to Selection
        </button>
        <button
          style={{
            ...suiteStyles.buildBtn,
            ...(toolOrder.length < 2 ? suiteStyles.buildBtnDisabled : {})
          }}
          onClick={handleBuildSuite}
          disabled={toolOrder.length < 2}
        >
          🧰 Build Suite ({toolOrder.length} tools)
        </button>
      </div>
    </div>
  );
}
