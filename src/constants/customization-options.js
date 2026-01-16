/**
 * Customization Options
 * Color presets, style options, and admin levels
 */

export const COLOR_PRESETS = [
  { name: 'Ocean Blue', color: '#3b82f6' },
  { name: 'Forest Green', color: '#22c55e' },
  { name: 'Sunset Orange', color: '#f97316' },
  { name: 'Royal Purple', color: '#8b5cf6' },
  { name: 'Rose Pink', color: '#ec4899' },
  { name: 'Warm Gold', color: '#B8860B' },
  { name: 'Classic Red', color: '#dc2626' },
  { name: 'Slate Gray', color: '#64748b' }
];

export const STYLE_OPTIONS = [
  { key: 'modern', label: 'Modern', description: 'Clean lines, bold typography' },
  { key: 'minimal', label: 'Minimal', description: 'Simple, spacious, elegant' },
  { key: 'warm', label: 'Warm', description: 'Inviting, cozy, friendly' },
  { key: 'professional', label: 'Professional', description: 'Corporate, trustworthy' }
];

export const ADMIN_LEVELS = [
  { key: 'lite', label: 'Lite', description: '3 modules - Basic content management' },
  { key: 'standard', label: 'Standard', description: '7 modules - Full admin features', recommended: true },
  { key: 'pro', label: 'Pro', description: '12+ modules - Advanced analytics & tools' }
];
