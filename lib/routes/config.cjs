/**
 * Configuration Routes
 * Extracted from server.cjs
 *
 * Handles: bundles, industries, layouts, effects, sections, modules, projects
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

/**
 * Create config routes
 * @param {Object} deps - Dependencies
 * @param {Object} deps.BUNDLES - Bundle configurations
 * @param {Object} deps.INDUSTRIES - Industry configurations
 * @param {Object} deps.LAYOUTS - Layout configurations
 * @param {Object} deps.EFFECTS - Effects configurations
 * @param {Object} deps.SECTIONS - Sections configurations
 * @param {Object} deps.INDUSTRY_PRESETS - Industry presets
 * @param {Function} deps.buildPrompt - Prompt builder function
 * @param {string} deps.GENERATED_PROJECTS - Path to generated projects
 */
function createConfigRoutes(deps) {
  const router = express.Router();
  const {
    BUNDLES,
    INDUSTRIES,
    LAYOUTS,
    EFFECTS,
    SECTIONS,
    INDUSTRY_PRESETS,
    buildPrompt,
    GENERATED_PROJECTS
  } = deps;

  // Get bundles
  router.get('/bundles', (req, res) => {
    res.json({ success: true, bundles: BUNDLES });
  });

  // Get industries (from prompts config)
  router.get('/industries', (req, res) => {
    const industryList = {};
    for (const [key, value] of Object.entries(INDUSTRIES)) {
      industryList[key] = {
        name: value.name,
        icon: value.icon,
        category: value.category,
        layouts: value.layouts,
        defaultLayout: value.defaultLayout,
        vibe: value.vibe
      };
    }
    res.json({ success: true, industries: industryList });
  });

  // Get full industry config for assembly
  router.get('/industry/:key', (req, res) => {
    const { key } = req.params;
    const industry = INDUSTRIES[key];
    if (!industry) {
      return res.status(404).json({ success: false, error: 'Industry not found' });
    }
    res.json({ success: true, industry });
  });

  // Get layouts
  router.get('/layouts', (req, res) => {
    res.json({ success: true, layouts: LAYOUTS });
  });

  // Get effects
  router.get('/effects', (req, res) => {
    res.json({ success: true, effects: EFFECTS });
  });

  // Get sections
  router.get('/sections', (req, res) => {
    res.json({ success: true, sections: SECTIONS });
  });

  // Build prompt for specific configuration
  router.post('/build-prompt', (req, res) => {
    const { industryKey, layoutKey, effects } = req.body;
    const prompt = buildPrompt(industryKey, layoutKey, effects);
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Invalid industry' });
    }
    res.json({ success: true, prompt });
  });

  // Get modules for an industry
  router.get('/modules/industry/:industryKey', (req, res) => {
    const { industryKey } = req.params;
    const industry = INDUSTRY_PRESETS[industryKey];

    if (!industry) {
      return res.status(404).json({ success: false, error: 'Industry not found' });
    }

    const backend = new Set();
    const frontend = new Set();

    for (const bundleKey of industry.bundles) {
      const bundle = BUNDLES[bundleKey];
      if (bundle) {
        bundle.backend.forEach(m => backend.add(m));
        bundle.frontend.forEach(m => frontend.add(m));
      }
    }

    industry.additionalBackend?.forEach(m => backend.add(m));
    industry.additionalFrontend?.forEach(m => frontend.add(m));

    res.json({
      success: true,
      modules: {
        backend: Array.from(backend),
        frontend: Array.from(frontend)
      }
    });
  });

  // Get modules for bundles
  router.post('/modules/bundles', (req, res) => {
    const { bundles } = req.body;

    if (!bundles || !Array.isArray(bundles)) {
      return res.status(400).json({ success: false, error: 'Bundles array required' });
    }

    const backend = new Set();
    const frontend = new Set();

    for (const bundleKey of bundles) {
      const bundle = BUNDLES[bundleKey];
      if (bundle) {
        bundle.backend.forEach(m => backend.add(m));
        bundle.frontend.forEach(m => frontend.add(m));
      }
    }

    res.json({
      success: true,
      modules: {
        backend: Array.from(backend),
        frontend: Array.from(frontend)
      }
    });
  });

  // List generated projects
  router.get('/projects', (req, res) => {
    try {
      if (!fs.existsSync(GENERATED_PROJECTS)) {
        return res.json({ success: true, projects: [] });
      }

      const dirs = fs.readdirSync(GENERATED_PROJECTS, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => {
          const projectPath = path.join(GENERATED_PROJECTS, d.name);
          const manifestPath = path.join(projectPath, 'project-manifest.json');

          let manifest = null;
          if (fs.existsSync(manifestPath)) {
            try {
              manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            } catch (e) {
              console.warn(`   ⚠️ Failed to parse manifest for ${d.name}:`, e.message);
            }
          }

          return {
            name: d.name,
            path: projectPath,
            manifest: manifest
          };
        });

      res.json({ success: true, projects: dirs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

module.exports = { createConfigRoutes };
