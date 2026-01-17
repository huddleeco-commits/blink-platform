/**
 * Admin Tiers API Routes
 * Provides tier information and suggestions for the frontend
 */

const express = require('express');
const router = express.Router();
const {
  getAdminTiers,
  getModuleInfo,
  suggestAdminTier,
  getModulesForTier,
  resolveModules,
  generateTierSelectionUI
} = require('../services/admin-module-loader.cjs');

// GET /api/admin/tiers - Get all tiers and suggestion for industry
router.get('/', async (req, res) => {
  try {
    const { industry, description } = req.query;

    const tiers = getAdminTiers();
    const moduleInfo = getModuleInfo();
    const suggestion = suggestAdminTier(industry, description);

    res.json({
      success: true,
      tiers,
      moduleInfo,
      suggestion,
      tierOrder: ['lite', 'standard', 'pro', 'enterprise']
    });
  } catch (error) {
    console.error('Error getting admin tiers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/tiers/:tier/modules - Get modules for a specific tier
router.get('/:tier/modules', async (req, res) => {
  try {
    const { tier } = req.params;
    const modules = getModulesForTier(tier);

    res.json({
      success: true,
      tier,
      modules
    });
  } catch (error) {
    console.error('Error getting tier modules:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/admin/tiers/resolve - Resolve module dependencies
router.post('/resolve', async (req, res) => {
  try {
    const { modules } = req.body;

    if (!modules || !Array.isArray(modules)) {
      return res.status(400).json({
        success: false,
        error: 'modules array is required'
      });
    }

    const resolvedModules = resolveModules(modules);

    res.json({
      success: true,
      originalModules: modules,
      resolvedModules,
      addedDependencies: resolvedModules.filter(m => !modules.includes(m))
    });
  } catch (error) {
    console.error('Error resolving modules:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/admin/tiers/suggest - Get AI suggestion for admin tier
router.post('/suggest', async (req, res) => {
  try {
    const { industry, businessDescription, businessName, keywords } = req.body;

    // Build description from all inputs
    let fullDescription = businessDescription || '';
    if (businessName) fullDescription += ` Business: ${businessName}`;
    if (keywords && keywords.length) fullDescription += ` Keywords: ${keywords.join(', ')}`;

    const suggestion = suggestAdminTier(industry, fullDescription);

    res.json({
      success: true,
      suggestion
    });
  } catch (error) {
    console.error('Error suggesting tier:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/tiers/ui - Get complete UI data for tier selection
router.get('/ui', async (req, res) => {
  try {
    const { industry, description } = req.query;

    const suggestion = suggestAdminTier(industry, description);
    const uiData = generateTierSelectionUI(suggestion.tier, suggestion.modules);

    res.json({
      success: true,
      ...uiData,
      suggestion
    });
  } catch (error) {
    console.error('Error getting tier UI data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
