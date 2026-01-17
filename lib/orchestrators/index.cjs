/**
 * Orchestrators Index
 *
 * Exports tier selection and hybrid generation utilities
 * These layer ON TOP of existing modes - they don't replace them
 */

const {
  selectTier,
  getTier,
  getAllTiers,
  validateTierForFeatures,
  quickRecommend,
  TIERS,
  COMPLEXITY_TO_TIER,
  TIER_REQUIREMENTS
} = require('./tier-selector.cjs');

const {
  buildGenerationPlan,
  enhanceConfig,
  getPageGenerationConfig,
  shouldUseModule,
  logPlan,
  buildPageList,
  buildModuleList,
  buildBackendPlan,
  buildContextList,
  getAdminModulesForTier
} = require('./hybrid-generator.cjs');

module.exports = {
  // Tier Selection
  selectTier,
  getTier,
  getAllTiers,
  validateTierForFeatures,
  quickRecommend,
  TIERS,
  COMPLEXITY_TO_TIER,
  TIER_REQUIREMENTS,

  // Hybrid Generation
  buildGenerationPlan,
  enhanceConfig,
  getPageGenerationConfig,
  shouldUseModule,
  logPlan,
  buildPageList,
  buildModuleList,
  buildBackendPlan,
  buildContextList,
  getAdminModulesForTier
};
