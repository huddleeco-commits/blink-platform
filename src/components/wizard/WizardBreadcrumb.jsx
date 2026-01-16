/**
 * WizardBreadcrumb Component
 * Shows flow progress and allows jumping back
 */

import React from 'react';
import { wizardStyles } from './styles';

export function WizardBreadcrumb({ currentPath, completedSteps, onJumpTo }) {
  const allSteps = [
    { id: 'choose-path', label: 'Start', icon: '🚀' },
    { id: 'path', label: currentPath === 'rebuild' ? 'Rebuild' : currentPath === 'quick' ? 'Quick Start' : 'Reference', icon: currentPath === 'rebuild' ? '🔄' : currentPath === 'quick' ? '⚡' : '🎨' },
    { id: 'upload-assets', label: 'Assets', icon: '📁' },
    { id: 'customize', label: 'Customize', icon: '✨' },
    { id: 'generate', label: 'Generate', icon: '🎯' }
  ];

  return (
    <div style={wizardStyles.breadcrumbContainer}>
      <div style={wizardStyles.breadcrumbTrack}>
        {allSteps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === 'customize';
          const isClickable = isCompleted && step.id !== 'customize';

          return (
            <div key={step.id} style={wizardStyles.breadcrumbStep}>
              <button
                style={{
                  ...wizardStyles.breadcrumbDot,
                  ...(isCompleted ? wizardStyles.breadcrumbDotCompleted : {}),
                  ...(isCurrent ? wizardStyles.breadcrumbDotCurrent : {}),
                  cursor: isClickable ? 'pointer' : 'default'
                }}
                onClick={() => isClickable && onJumpTo(step.id)}
                disabled={!isClickable}
                title={isClickable ? `Go back to ${step.label}` : step.label}
              >
                {isCompleted ? '✓' : step.icon}
              </button>
              <span style={{
                ...wizardStyles.breadcrumbLabel,
                ...(isCurrent ? wizardStyles.breadcrumbLabelCurrent : {}),
                ...(isCompleted ? wizardStyles.breadcrumbLabelCompleted : {})
              }}>
                {step.label}
              </span>
              {index < allSteps.length - 1 && (
                <div style={{
                  ...wizardStyles.breadcrumbConnector,
                  ...(isCompleted ? wizardStyles.breadcrumbConnectorCompleted : {})
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
