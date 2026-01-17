/**
 * Configs Index
 * Re-exports all configuration constants
 */

const { BUNDLES, INDUSTRY_PRESETS } = require('./bundles.cjs');
const { VISUAL_ARCHETYPES } = require('./visual-archetypes.cjs');
const { VALID_LUCIDE_ICONS, ICON_REPLACEMENTS } = require('./lucide-icons.cjs');
const {
  HERO_LAYOUTS,
  COLOR_VARIATIONS,
  SECTION_ORDERS,
  COMPONENT_STYLES,
  getGenerationVariety,
  buildVarietyPrompt,
  getIndustryType
} = require('./generation-variety.cjs');

// Feature detection and patterns
const {
  detectFeatures,
  getComplexityLevel,
  categorizeFeatures,
  getFeatureSummary,
  FEATURE_SIGNALS,
  INDUSTRY_FEATURE_DEFAULTS
} = require('./feature-detector.cjs');

const {
  FEATURE_PATTERNS,
  getPatternGuidance,
  getPatternsForFeatures,
  buildFeaturePromptSection,
  buildCompactFeaturePrompt
} = require('./feature-patterns.cjs');

const {
  buildFeatureContext,
  getQuickSummary,
  needsFeature,
  getFeaturePattern,
  getRequiredFiles,
  analyzeGenerationRequest
} = require('./feature-prompt-builder.cjs');

module.exports = {
  BUNDLES,
  INDUSTRY_PRESETS,
  VISUAL_ARCHETYPES,
  VALID_LUCIDE_ICONS,
  ICON_REPLACEMENTS,
  // Generation variety exports
  HERO_LAYOUTS,
  COLOR_VARIATIONS,
  SECTION_ORDERS,
  COMPONENT_STYLES,
  getGenerationVariety,
  buildVarietyPrompt,
  getIndustryType,
  // Feature detection exports
  detectFeatures,
  getComplexityLevel,
  categorizeFeatures,
  getFeatureSummary,
  FEATURE_SIGNALS,
  INDUSTRY_FEATURE_DEFAULTS,
  // Feature patterns exports
  FEATURE_PATTERNS,
  getPatternGuidance,
  getPatternsForFeatures,
  buildFeaturePromptSection,
  buildCompactFeaturePrompt,
  // Feature prompt builder exports
  buildFeatureContext,
  getQuickSummary,
  needsFeature,
  getFeaturePattern,
  getRequiredFiles,
  analyzeGenerationRequest
};
