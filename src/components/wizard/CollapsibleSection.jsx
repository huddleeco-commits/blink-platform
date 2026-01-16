/**
 * CollapsibleSection Component
 * Collapsible content section to reduce visual overwhelm
 */

import React, { useState } from 'react';
import { collapsibleStyles } from './styles';

export function CollapsibleSection({ title, icon, children, defaultOpen = true, badge, tooltip }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={collapsibleStyles.container}>
      <button
        style={collapsibleStyles.header}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={collapsibleStyles.headerLeft}>
          <span style={collapsibleStyles.icon}>{icon}</span>
          <span style={collapsibleStyles.title}>{title}</span>
          {badge && <span style={collapsibleStyles.badge}>{badge}</span>}
          {tooltip && (
            <span style={collapsibleStyles.tooltipTrigger} title={tooltip}>
              ⓘ
            </span>
          )}
        </div>
        <span style={{
          ...collapsibleStyles.chevron,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div style={collapsibleStyles.content}>
          {children}
        </div>
      )}
    </div>
  );
}
