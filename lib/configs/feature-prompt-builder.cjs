/**
 * Feature Prompt Builder - Orchestrates feature detection and prompt injection
 *
 * This is the bridge between:
 * - User input (business description)
 * - Feature detection (what's needed)
 * - Pattern library (how to build it)
 * - Prompt construction (telling AI what to generate)
 */

const { detectFeatures, getFeatureSummary, getComplexityLevel } = require('./feature-detector.cjs');
const { buildFeaturePromptSection, buildCompactFeaturePrompt, FEATURE_PATTERNS } = require('./feature-patterns.cjs');

/**
 * Main entry point - analyze input and build feature prompt section
 *
 * @param {string} businessDescription - The user's business description
 * @param {string} industry - Detected or specified industry
 * @param {object} options - Additional options
 * @returns {object} Feature analysis and prompt section
 */
function buildFeatureContext(businessDescription, industry, options = {}) {
  const {
    explicitFeatures = [],    // Features explicitly requested
    compact = false,          // Use compact prompt for token efficiency
    includeBackend = true,    // Include backend generation guidance
    includeFrontend = true    // Include frontend generation guidance
  } = options;

  // 1. Detect features from input
  const detectedFeatures = detectFeatures(businessDescription, industry, explicitFeatures);

  // 2. Get feature summary with complexity
  const summary = getFeatureSummary(detectedFeatures);

  // 3. Build prompt section
  const promptSection = compact
    ? buildCompactFeaturePrompt(detectedFeatures)
    : buildFeaturePromptSection(detectedFeatures);

  // 4. Build generation mode guidance
  const modeGuidance = buildModeGuidance(summary, includeBackend, includeFrontend);

  return {
    features: detectedFeatures,
    complexity: summary.complexity,
    summary,
    promptSection,
    modeGuidance,
    needsStateManagement: summary.needsStateManagement,
    needsBackendAPI: summary.needsBackendAPI,
    needsRealtime: summary.needsRealtime
  };
}

/**
 * Build generation mode guidance based on complexity
 */
function buildModeGuidance(summary, includeBackend, includeFrontend) {
  const { complexity, needsStateManagement, needsBackendAPI, needsRealtime } = summary;

  let guidance = `\n\n## GENERATION COMPLEXITY: ${complexity.toUpperCase()}\n\n`;

  switch (complexity) {
    case 'full-saas':
      guidance += `This is a FULL APPLICATION, not just a landing page.\n\n`;
      guidance += `Required architecture:\n`;
      if (needsStateManagement) {
        guidance += `- React Context + useReducer for complex state\n`;
      }
      if (needsBackendAPI) {
        guidance += `- API client with fetch wrapper, error handling, auth headers\n`;
        guidance += `- Custom hooks for data fetching (loading, error, refetch)\n`;
      }
      if (needsRealtime) {
        guidance += `- Polling or WebSocket for real-time updates\n`;
      }
      guidance += `- Multi-page application with routing\n`;
      guidance += `- Form validation and multi-step workflows\n`;
      break;

    case 'interactive':
      guidance += `This site needs INTERACTIVE FEATURES beyond static content.\n\n`;
      guidance += `Required:\n`;
      if (needsStateManagement) {
        guidance += `- State management for user interactions\n`;
      }
      if (needsBackendAPI) {
        guidance += `- API integration for dynamic data\n`;
      }
      guidance += `- Form handling with validation\n`;
      guidance += `- Loading and error states\n`;
      break;

    case 'enhanced':
      guidance += `This site needs SOME DYNAMIC FEATURES.\n\n`;
      guidance += `Include:\n`;
      guidance += `- Basic interactivity (forms, modals)\n`;
      guidance += `- Contact form with validation\n`;
      guidance += `- Optional API integration\n`;
      break;

    case 'standard':
      guidance += `Standard business website with STATIC CONTENT.\n\n`;
      guidance += `Focus on:\n`;
      guidance += `- Strong visual design\n`;
      guidance += `- Clear information architecture\n`;
      guidance += `- Contact methods\n`;
      guidance += `- SEO-friendly structure\n`;
      break;

    default:
      guidance += `Minimal site - focus on core message and contact.\n`;
  }

  return guidance;
}

/**
 * Get a quick summary for logging/debugging
 */
function getQuickSummary(businessDescription, industry) {
  const features = detectFeatures(businessDescription, industry);
  const complexity = getComplexityLevel(features);

  return {
    industry,
    features: features.join(', '),
    complexity,
    featureCount: features.length
  };
}

/**
 * Check if a specific feature is needed
 */
function needsFeature(businessDescription, industry, featureName) {
  const features = detectFeatures(businessDescription, industry);
  return features.includes(featureName);
}

/**
 * Get pattern guidance for a specific feature (for targeted generation)
 */
function getFeaturePattern(featureName) {
  return FEATURE_PATTERNS[featureName] || null;
}

/**
 * Build file generation list based on features
 * Returns what files need to be generated for this feature set
 */
function getRequiredFiles(features) {
  const files = {
    // Always needed
    base: ['App.jsx', 'index.css'],

    // Conditionally needed
    context: [],
    hooks: [],
    lib: [],
    pages: [],
    components: []
  };

  // State management contexts
  if (features.includes('cart')) {
    files.context.push('CartContext.jsx');
  }
  if (features.includes('auth')) {
    files.context.push('AuthContext.jsx');
  }
  if (features.includes('booking')) {
    files.context.push('BookingContext.jsx');
  }

  // API and hooks
  if (features.some(f => ['cart', 'auth', 'booking', 'admin', 'tracking', 'search', 'reviews'].includes(f))) {
    files.lib.push('api.js');
    files.hooks.push('useApi.js');
  }

  // Pages based on features
  if (features.includes('cart') || features.includes('payments')) {
    files.pages.push('CheckoutPage.jsx');
  }
  if (features.includes('tracking')) {
    files.pages.push('OrderTrackingPage.jsx');
  }
  if (features.includes('admin')) {
    files.pages.push('AdminDashboard.jsx');
  }
  if (features.includes('booking')) {
    files.pages.push('BookingPage.jsx');
  }
  if (features.includes('auth')) {
    files.pages.push('LoginPage.jsx', 'RegisterPage.jsx', 'ProfilePage.jsx');
  }
  if (features.includes('search')) {
    files.components.push('SearchFilters.jsx');
  }
  if (features.includes('gallery')) {
    files.components.push('Gallery.jsx', 'Lightbox.jsx');
  }
  if (features.includes('reviews')) {
    files.components.push('Reviews.jsx', 'StarRating.jsx');
  }

  return files;
}

/**
 * Full feature analysis for a generation request
 */
function analyzeGenerationRequest(businessDescription, industry, options = {}) {
  const context = buildFeatureContext(businessDescription, industry, options);
  const requiredFiles = getRequiredFiles(context.features);

  return {
    ...context,
    requiredFiles,
    isSimpleSite: context.complexity === 'minimal' || context.complexity === 'standard',
    isInteractive: context.complexity === 'enhanced' || context.complexity === 'interactive',
    isFullApp: context.complexity === 'full-saas'
  };
}

module.exports = {
  buildFeatureContext,
  getQuickSummary,
  needsFeature,
  getFeaturePattern,
  getRequiredFiles,
  analyzeGenerationRequest
};
