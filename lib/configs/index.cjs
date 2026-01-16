/**
 * Configs Index
 * Re-exports all configuration constants
 */

const { BUNDLES, INDUSTRY_PRESETS } = require('./bundles.cjs');
const { VISUAL_ARCHETYPES } = require('./visual-archetypes.cjs');
const { VALID_LUCIDE_ICONS, ICON_REPLACEMENTS } = require('./lucide-icons.cjs');

module.exports = {
  BUNDLES,
  INDUSTRY_PRESETS,
  VISUAL_ARCHETYPES,
  VALID_LUCIDE_ICONS,
  ICON_REPLACEMENTS
};
