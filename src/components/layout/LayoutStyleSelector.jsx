/**
 * LayoutStyleSelector Component
 * Grid of layout options with visual thumbnails
 */

import React from 'react';
import { getLayoutsForIndustry } from '../../constants';
import { layoutSelectorStyles } from './styles';
import { LayoutThumbnail } from './LayoutThumbnail';

export function LayoutStyleSelector({ industryKey, selectedLayout, onSelectLayout, colors }) {
  const layouts = getLayoutsForIndustry(industryKey);

  return (
    <div style={layoutSelectorStyles.container}>
      <div style={layoutSelectorStyles.grid}>
        {layouts.map(layout => (
          <button
            key={layout.id}
            style={{
              ...layoutSelectorStyles.card,
              ...(selectedLayout === layout.id ? layoutSelectorStyles.cardActive : {})
            }}
            onClick={() => onSelectLayout(layout.id, layout.preview)}
          >
            {/* Mini Preview Thumbnail */}
            <div style={layoutSelectorStyles.thumbnailContainer}>
              <LayoutThumbnail
                layout={layout}
                colors={colors}
                isSelected={selectedLayout === layout.id}
              />
            </div>

            {/* Layout Info */}
            <div style={layoutSelectorStyles.info}>
              <div style={layoutSelectorStyles.name}>{layout.name}</div>
              <div style={layoutSelectorStyles.description}>{layout.description}</div>
            </div>

            {/* Selected Indicator */}
            {selectedLayout === layout.id && (
              <div style={layoutSelectorStyles.checkmark}>✓</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
