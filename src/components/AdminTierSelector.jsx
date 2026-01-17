/**
 * Admin Tier Selector Component
 * Shows available admin tiers with detailed module breakdown
 * Allows customization of individual modules
 */

import React, { useState, useEffect } from 'react';
import { API_BASE } from '../constants';

// Icons mapping (simplified for now, can use lucide-react later)
const ICON_MAP = {
  LayoutDashboard: '📊',
  FileText: '📄',
  Settings: '⚙️',
  BarChart3: '📈',
  Users: '👥',
  Calendar: '📅',
  Bell: '🔔',
  ShoppingCart: '🛒',
  Package: '📦',
  Megaphone: '📣',
  Mail: '✉️',
  Search: '🔍',
  UserCog: '👤',
  MapPin: '📍',
  Key: '🔑',
  Palette: '🎨'
};

export default function AdminTierSelector({
  industry,
  businessDescription,
  selectedTier,
  selectedModules,
  onTierChange,
  onModulesChange,
  compact = false
}) {
  const [tierData, setTierData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCustomize, setShowCustomize] = useState(false);

  // Load tier data and get suggestion based on industry
  useEffect(() => {
    async function loadTierData() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/admin/tiers?industry=${industry || ''}&description=${encodeURIComponent(businessDescription || '')}`);
        const data = await res.json();
        if (data.success) {
          setTierData(data);
          // Auto-select suggested tier if none selected
          if (!selectedTier && data.suggestion) {
            onTierChange(data.suggestion.tier);
            onModulesChange(data.suggestion.modules);
          }
        }
      } catch (err) {
        console.error('Failed to load tier data:', err);
        // Fallback to standard tier
        if (!selectedTier) {
          onTierChange('standard');
        }
      } finally {
        setLoading(false);
      }
    }
    loadTierData();
  }, [industry, businessDescription]);

  if (loading || !tierData) {
    return (
      <div style={styles.loading}>
        Loading admin options...
      </div>
    );
  }

  const { tiers, suggestion, moduleInfo } = tierData;
  const currentTierConfig = tiers[selectedTier] || tiers.standard;

  // Get modules to display based on current tier
  const displayModules = selectedModules || currentTierConfig.modules;

  const handleTierSelect = (tierKey) => {
    onTierChange(tierKey);
    onModulesChange(tiers[tierKey].modules);
    setShowCustomize(false);
  };

  const handleModuleToggle = (moduleName) => {
    const newModules = displayModules.includes(moduleName)
      ? displayModules.filter(m => m !== moduleName)
      : [...displayModules, moduleName];
    onModulesChange(newModules);
  };

  if (compact) {
    return (
      <div style={styles.compact}>
        <div style={styles.compactHeader}>
          <span style={styles.compactLabel}>Admin Dashboard:</span>
          <select
            value={selectedTier}
            onChange={(e) => handleTierSelect(e.target.value)}
            style={styles.compactSelect}
          >
            {Object.entries(tiers).map(([key, tier]) => (
              <option key={key} value={key}>
                {tier.name} ({tier.moduleCount} modules)
                {key === suggestion?.tier ? ' - Suggested' : ''}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.compactModules}>
          {displayModules.map(mod => (
            <span key={mod} style={styles.compactModule}>
              {ICON_MAP[moduleInfo[mod]?.icon] || '📋'} {moduleInfo[mod]?.name || mod}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Admin Dashboard</span>
        {suggestion && (
          <span style={styles.suggestion}>
            Suggested: {suggestion.tierName} - {suggestion.reason}
          </span>
        )}
      </div>

      {/* Tier Selection */}
      <div style={styles.tierGrid}>
        {Object.entries(tiers).map(([key, tier]) => (
          <div
            key={key}
            style={{
              ...styles.tierCard,
              ...(selectedTier === key ? styles.tierCardSelected : {}),
              ...(key === suggestion?.tier ? styles.tierCardSuggested : {})
            }}
            onClick={() => handleTierSelect(key)}
          >
            {key === suggestion?.tier && (
              <span style={styles.suggestedBadge}>Suggested</span>
            )}
            {tier.default && key !== suggestion?.tier && (
              <span style={styles.defaultBadge}>Default</span>
            )}
            <div style={styles.tierName}>{tier.name}</div>
            <div style={styles.tierModuleCount}>{tier.moduleCount} modules</div>
            <div style={styles.tierDescription}>{tier.description}</div>
          </div>
        ))}
      </div>

      {/* Module Preview */}
      <div style={styles.modulePreview}>
        <div style={styles.modulePreviewHeader}>
          <span style={styles.modulePreviewTitle}>
            Included Modules ({displayModules.length})
          </span>
          <button
            style={styles.customizeBtn}
            onClick={() => setShowCustomize(!showCustomize)}
          >
            {showCustomize ? 'Done' : 'Customize'}
          </button>
        </div>

        <div style={styles.moduleList}>
          {Object.entries(moduleInfo).map(([modKey, mod]) => {
            const isIncluded = displayModules.includes(modKey);
            const isInTier = currentTierConfig.modules.includes(modKey);
            const requiredTier = mod.tier;

            return (
              <div
                key={modKey}
                style={{
                  ...styles.moduleItem,
                  ...(isIncluded ? styles.moduleItemIncluded : styles.moduleItemExcluded),
                  ...(showCustomize ? styles.moduleItemClickable : {})
                }}
                onClick={showCustomize ? () => handleModuleToggle(modKey) : undefined}
              >
                <span style={styles.moduleIcon}>{ICON_MAP[mod.icon] || '📋'}</span>
                <span style={styles.moduleName}>{mod.name}</span>
                {!isInTier && isIncluded && (
                  <span style={styles.moduleAdded}>+added</span>
                )}
                {!isIncluded && (
                  <span style={styles.moduleTierRequired}>
                    {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}+
                  </span>
                )}
                {showCustomize && (
                  <span style={styles.moduleToggle}>
                    {isIncluded ? '✓' : '+'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#fff'
  },
  suggestion: {
    fontSize: '0.85rem',
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.1)',
    padding: '4px 12px',
    borderRadius: '20px'
  },
  tierGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '20px'
  },
  tierCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid transparent',
    borderRadius: '10px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative'
  },
  tierCardSelected: {
    borderColor: '#6366f1',
    background: 'rgba(99, 102, 241, 0.1)'
  },
  tierCardSuggested: {
    borderColor: 'rgba(16, 185, 129, 0.5)'
  },
  suggestedBadge: {
    position: 'absolute',
    top: '-8px',
    right: '8px',
    background: '#10b981',
    color: '#fff',
    fontSize: '0.7rem',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: '600'
  },
  defaultBadge: {
    position: 'absolute',
    top: '-8px',
    right: '8px',
    background: '#6366f1',
    color: '#fff',
    fontSize: '0.7rem',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: '600'
  },
  tierName: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '4px'
  },
  tierModuleCount: {
    fontSize: '0.85rem',
    color: '#6366f1',
    marginBottom: '8px'
  },
  tierDescription: {
    fontSize: '0.8rem',
    color: '#888',
    lineHeight: '1.4'
  },
  modulePreview: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    padding: '16px'
  },
  modulePreviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  modulePreviewTitle: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#fff'
  },
  customizeBtn: {
    background: 'transparent',
    border: '1px solid #6366f1',
    color: '#6366f1',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  moduleList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '8px'
  },
  moduleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    transition: 'all 0.2s ease'
  },
  moduleItemIncluded: {
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981'
  },
  moduleItemExcluded: {
    background: 'rgba(255, 255, 255, 0.03)',
    color: '#666',
    opacity: 0.7
  },
  moduleItemClickable: {
    cursor: 'pointer'
  },
  moduleIcon: {
    fontSize: '1rem'
  },
  moduleName: {
    flex: 1
  },
  moduleAdded: {
    fontSize: '0.7rem',
    background: '#6366f1',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  moduleTierRequired: {
    fontSize: '0.7rem',
    color: '#888'
  },
  moduleToggle: {
    fontSize: '1rem',
    fontWeight: 'bold'
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    color: '#888'
  },
  compact: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '12px'
  },
  compactHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px'
  },
  compactLabel: {
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  compactSelect: {
    background: '#1a1a2e',
    border: '1px solid #333',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem'
  },
  compactModules: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  compactModule: {
    background: 'rgba(99, 102, 241, 0.1)',
    color: '#6366f1',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem'
  }
};
