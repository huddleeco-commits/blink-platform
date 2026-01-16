/**
 * IndustryBanner Component
 * Industry detection banner with change option
 */

import React from 'react';
import { industryBannerStyles } from './styles';

export function IndustryBanner({ industry, industryKey, onChangeClick, industries }) {
  if (!industry) return null;

  return (
    <div style={industryBannerStyles.container}>
      <div style={industryBannerStyles.left}>
        <span style={industryBannerStyles.icon}>{industry.icon || '✨'}</span>
        <div style={industryBannerStyles.info}>
          <span style={industryBannerStyles.detected}>Detected Industry</span>
          <span style={industryBannerStyles.name}>{industry.name}</span>
        </div>
      </div>
      <button style={industryBannerStyles.changeBtn} onClick={onChangeClick}>
        Change Industry
      </button>
    </div>
  );
}
