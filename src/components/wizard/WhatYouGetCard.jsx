/**
 * WhatYouGetCard Component
 * Preview card showing what the user will get
 */

import React from 'react';
import { whatYouGetStyles } from './styles';

export function WhatYouGetCard({ projectData }) {
  const pageCount = projectData.selectedPages.length;
  const hasAppPages = projectData.selectedPages.some(p =>
    ['dashboard', 'earn', 'rewards', 'wallet', 'profile', 'leaderboard'].includes(p)
  );

  return (
    <div style={whatYouGetStyles.container}>
      <h3 style={whatYouGetStyles.title}>✨ What You'll Get</h3>
      <div style={whatYouGetStyles.grid}>
        <div style={whatYouGetStyles.item}>
          <span style={whatYouGetStyles.itemIcon}>📄</span>
          <span style={whatYouGetStyles.itemLabel}>{pageCount} Complete Pages</span>
        </div>
        <div style={whatYouGetStyles.item}>
          <span style={whatYouGetStyles.itemIcon}>📱</span>
          <span style={whatYouGetStyles.itemLabel}>Mobile Responsive</span>
        </div>
        <div style={whatYouGetStyles.item}>
          <span style={whatYouGetStyles.itemIcon}>🎨</span>
          <span style={whatYouGetStyles.itemLabel}>Custom Colors</span>
        </div>
        {hasAppPages && (
          <div style={whatYouGetStyles.item}>
            <span style={whatYouGetStyles.itemIcon}>⚡</span>
            <span style={whatYouGetStyles.itemLabel}>Interactive App Features</span>
          </div>
        )}
        <div style={whatYouGetStyles.item}>
          <span style={whatYouGetStyles.itemIcon}>📝</span>
          <span style={whatYouGetStyles.itemLabel}>AI-Written Content</span>
        </div>
        <div style={whatYouGetStyles.item}>
          <span style={whatYouGetStyles.itemIcon}>🚀</span>
          <span style={whatYouGetStyles.itemLabel}>Ready to Deploy</span>
        </div>
      </div>
      <div style={whatYouGetStyles.pageList}>
        <span style={whatYouGetStyles.pageListLabel}>Pages:</span>
        <div style={whatYouGetStyles.pageChips}>
          {projectData.selectedPages.map(page => (
            <span key={page} style={whatYouGetStyles.pageChip}>
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
