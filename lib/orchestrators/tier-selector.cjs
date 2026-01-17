/**
 * Tier Selector - Recommends output tier based on detected features
 *
 * SURGICAL ADDITION - Does not modify existing modes
 *
 * Takes feature detection output → Returns tier recommendation
 * Maps to existing admin tiers (LITE/STANDARD/PRO)
 * Provides cost/time estimates and what's included
 */

const { detectFeatures, getComplexityLevel, getFeatureSummary } = require('../configs/feature-detector.cjs');

// ============================================
// TIER DEFINITIONS
// ============================================

const TIERS = {
  L1: {
    name: 'Landing',
    code: 'L1',
    description: 'Single-page marketing site',
    adminTier: null,  // No admin
    maxPages: 1,
    estimatedCost: 0.05,
    estimatedTime: '30 seconds',
    estimatedLines: 500,
    features: {
      pages: ['home'],
      hasBackend: false,
      hasAdmin: false,
      hasAuth: false,
      hasPayments: false,
      hasDynamicFeatures: false
    },
    includes: [
      'Single landing page',
      'Contact form (third-party)',
      'SEO meta tags',
      'Mobile responsive',
      'Visual effects'
    ],
    modules: []  // No modules needed
  },

  L2: {
    name: 'Presence',
    code: 'L2',
    description: 'Professional multi-page website',
    adminTier: 'LITE',
    maxPages: 6,
    estimatedCost: 0.20,
    estimatedTime: '2 minutes',
    estimatedLines: 2000,
    features: {
      pages: ['home', 'about', 'services', 'contact'],
      hasBackend: false,
      hasAdmin: true,
      hasAuth: false,
      hasPayments: false,
      hasDynamicFeatures: false
    },
    includes: [
      '3-6 pages (Home, About, Services, Contact, etc.)',
      'Basic admin dashboard',
      'Content management',
      'Contact form with storage',
      'Image gallery',
      'SEO optimized'
    ],
    modules: [
      'admin-dashboard',
      'admin-content',
      'admin-settings'
    ]
  },

  L3: {
    name: 'Interactive',
    code: 'L3',
    description: 'Dynamic site with user interactions',
    adminTier: 'STANDARD',
    maxPages: 10,
    estimatedCost: 0.80,
    estimatedTime: '5 minutes',
    estimatedLines: 4000,
    features: {
      pages: ['home', 'about', 'services', 'booking', 'contact'],
      hasBackend: true,
      hasAdmin: true,
      hasAuth: true,
      hasPayments: false,
      hasDynamicFeatures: true
    },
    includes: [
      'All L2 features',
      'User accounts (login/register)',
      'Booking/appointment system',
      'Customer management',
      'Email notifications',
      'Analytics dashboard',
      'API backend'
    ],
    modules: [
      'admin-dashboard',
      'admin-content',
      'admin-settings',
      'admin-analytics',
      'admin-customers',
      'admin-bookings',
      'admin-notifications',
      'auth'
    ]
  },

  L4: {
    name: 'Full BaaS',
    code: 'L4',
    description: 'Complete business application',
    adminTier: 'PRO',
    maxPages: 15,
    estimatedCost: 3.00,
    estimatedTime: '15 minutes',
    estimatedLines: 8000,
    features: {
      pages: ['home', 'menu', 'checkout', 'tracking', 'account', 'admin'],
      hasBackend: true,
      hasAdmin: true,
      hasAuth: true,
      hasPayments: true,
      hasDynamicFeatures: true
    },
    includes: [
      'All L3 features',
      'Shopping cart / ordering',
      'Payment processing (Stripe)',
      'Order tracking (real-time)',
      'Inventory management',
      'Advanced analytics',
      'Kitchen/staff dashboard',
      'Delivery management'
    ],
    modules: [
      'admin-dashboard',
      'admin-content',
      'admin-settings',
      'admin-analytics',
      'admin-customers',
      'admin-bookings',
      'admin-notifications',
      'auth',
      'checkout-flow',
      'payments'
    ]
  }
};

// ============================================
// COMPLEXITY TO TIER MAPPING
// ============================================

const COMPLEXITY_TO_TIER = {
  'minimal': 'L1',
  'standard': 'L2',
  'enhanced': 'L3',
  'interactive': 'L3',
  'full-saas': 'L4'
};

// ============================================
// FEATURE-BASED TIER REQUIREMENTS
// ============================================

// Features that REQUIRE certain tiers
const TIER_REQUIREMENTS = {
  // These features require at least L4
  L4_REQUIRED: ['cart', 'payments', 'tracking'],

  // These features require at least L3
  L3_REQUIRED: ['booking', 'auth', 'admin'],

  // These features work with L2
  L2_COMPATIBLE: ['gallery', 'reviews', 'contact', 'locations', 'pricing'],

  // These features work with L1
  L1_COMPATIBLE: ['contact']
};

// ============================================
// MAIN TIER SELECTION FUNCTION
// ============================================

/**
 * Select the appropriate tier based on detected features
 *
 * @param {string} businessDescription - The business description
 * @param {string} industry - Detected or specified industry
 * @param {object} options - Additional options
 * @returns {object} Tier recommendation with details
 */
function selectTier(businessDescription, industry, options = {}) {
  const {
    explicitTier = null,      // User can force a tier
    allowDowngrade = true,    // Can recommend lower than detected
    allowUpgrade = true       // Show upgrade options
  } = options;

  // If user explicitly requested a tier, validate and return it
  if (explicitTier && TIERS[explicitTier]) {
    return buildTierResponse(explicitTier, [], 'explicit');
  }

  // Detect features from input
  const features = detectFeatures(businessDescription, industry);
  const featureSummary = getFeatureSummary(features);
  const complexity = featureSummary.complexity;

  // Start with complexity-based recommendation
  let recommendedTier = COMPLEXITY_TO_TIER[complexity] || 'L2';

  // Check if any features REQUIRE a higher tier
  const hasL4Required = features.some(f => TIER_REQUIREMENTS.L4_REQUIRED.includes(f));
  const hasL3Required = features.some(f => TIER_REQUIREMENTS.L3_REQUIRED.includes(f));

  if (hasL4Required) {
    recommendedTier = 'L4';
  } else if (hasL3Required && recommendedTier === 'L1') {
    recommendedTier = 'L3';
  } else if (hasL3Required && recommendedTier === 'L2') {
    recommendedTier = 'L3';
  }

  return buildTierResponse(recommendedTier, features, 'detected', {
    complexity,
    featureSummary,
    allowDowngrade,
    allowUpgrade
  });
}

/**
 * Build the full tier response object
 */
function buildTierResponse(tierCode, features, selectionMethod, context = {}) {
  const tier = TIERS[tierCode];
  const { complexity, featureSummary, allowDowngrade, allowUpgrade } = context;

  // Build upgrade/downgrade options
  const tierOrder = ['L1', 'L2', 'L3', 'L4'];
  const currentIndex = tierOrder.indexOf(tierCode);

  const upgradeOptions = allowUpgrade !== false
    ? tierOrder.slice(currentIndex + 1).map(t => ({
        tier: t,
        name: TIERS[t].name,
        additionalCost: (TIERS[t].estimatedCost - tier.estimatedCost).toFixed(2),
        additionalFeatures: TIERS[t].includes.filter(i => !tier.includes.includes(i))
      }))
    : [];

  const downgradeOptions = allowDowngrade !== false && currentIndex > 0
    ? tierOrder.slice(0, currentIndex).reverse().map(t => ({
        tier: t,
        name: TIERS[t].name,
        savings: (tier.estimatedCost - TIERS[t].estimatedCost).toFixed(2),
        featuresLost: tier.includes.filter(i => !TIERS[t].includes.includes(i))
      }))
    : [];

  // Determine which features will be AI-generated vs module-provided
  const moduleProvided = tier.modules || [];
  const aiGenerated = getAIGeneratedParts(tierCode, features);

  return {
    // Core recommendation
    recommended: tierCode,
    tier: tier,

    // Selection context
    selectionMethod,  // 'explicit', 'detected', 'default'
    detectedFeatures: features,
    complexity: complexity || 'unknown',

    // What user gets
    includes: tier.includes,
    estimatedCost: `$${tier.estimatedCost.toFixed(2)}`,
    estimatedTime: tier.estimatedTime,
    estimatedLines: tier.estimatedLines,
    maxPages: tier.maxPages,

    // Admin tier mapping (for existing system)
    adminTier: tier.adminTier,

    // Module vs AI breakdown
    generation: {
      modules: moduleProvided,      // Copied from module-library
      aiGenerated: aiGenerated      // Created fresh by AI
    },

    // Options
    upgradeOptions,
    downgradeOptions,
    canUpgrade: upgradeOptions.length > 0,
    canDowngrade: downgradeOptions.length > 0,

    // Feature flags for generation
    flags: {
      hasBackend: tier.features.hasBackend,
      hasAdmin: tier.features.hasAdmin,
      hasAuth: tier.features.hasAuth,
      hasPayments: tier.features.hasPayments,
      hasDynamicFeatures: tier.features.hasDynamicFeatures
    }
  };
}

/**
 * Determine what AI will generate (vs what modules provide)
 */
function getAIGeneratedParts(tierCode, features) {
  const aiParts = {
    pages: [],
    components: [],
    styles: ['theme.css', 'custom styles'],
    content: ['copy/text', 'images', 'layout decisions']
  };

  // AI always generates pages with visual freedom
  switch (tierCode) {
    case 'L1':
      aiParts.pages = ['Landing page (full creative freedom)'];
      aiParts.components = ['Hero', 'About section', 'Services', 'Contact', 'Footer'];
      break;

    case 'L2':
      aiParts.pages = ['Home', 'About', 'Services', 'Gallery', 'Contact'];
      aiParts.components = ['All page sections', 'Cards', 'Navigation'];
      break;

    case 'L3':
      aiParts.pages = ['Home', 'About', 'Services', 'Booking', 'Contact', 'Account'];
      aiParts.components = ['Booking form', 'Date/time pickers', 'Page sections'];
      // Note: Auth pages come from module, but AI can style them
      break;

    case 'L4':
      aiParts.pages = ['Home', 'Menu/Products', 'Checkout', 'Order Tracking', 'Account'];
      aiParts.components = ['Menu display', 'Cart UI', 'Order timeline', 'Page sections'];
      // Note: Admin dashboard comes from module
      break;
  }

  return aiParts;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get tier by code
 */
function getTier(tierCode) {
  return TIERS[tierCode] || null;
}

/**
 * Get all tiers for display
 */
function getAllTiers() {
  return Object.entries(TIERS).map(([code, tier]) => ({
    code,
    name: tier.name,
    description: tier.description,
    estimatedCost: tier.estimatedCost,
    estimatedTime: tier.estimatedTime
  }));
}

/**
 * Validate if a tier can support required features
 */
function validateTierForFeatures(tierCode, features) {
  const tier = TIERS[tierCode];
  if (!tier) return { valid: false, reason: 'Invalid tier code' };

  const hasL4Required = features.some(f => TIER_REQUIREMENTS.L4_REQUIRED.includes(f));
  const hasL3Required = features.some(f => TIER_REQUIREMENTS.L3_REQUIRED.includes(f));

  if (hasL4Required && tierCode !== 'L4') {
    return {
      valid: false,
      reason: `Features ${TIER_REQUIREMENTS.L4_REQUIRED.filter(f => features.includes(f)).join(', ')} require L4`,
      suggestedTier: 'L4'
    };
  }

  if (hasL3Required && (tierCode === 'L1' || tierCode === 'L2')) {
    return {
      valid: false,
      reason: `Features ${TIER_REQUIREMENTS.L3_REQUIRED.filter(f => features.includes(f)).join(', ')} require L3+`,
      suggestedTier: 'L3'
    };
  }

  return { valid: true };
}

/**
 * Quick tier recommendation (for API response)
 */
function quickRecommend(businessDescription, industry) {
  const result = selectTier(businessDescription, industry);
  return {
    tier: result.recommended,
    name: result.tier.name,
    cost: result.estimatedCost,
    time: result.estimatedTime,
    features: result.detectedFeatures,
    adminTier: result.adminTier
  };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  selectTier,
  getTier,
  getAllTiers,
  validateTierForFeatures,
  quickRecommend,
  TIERS,
  COMPLEXITY_TO_TIER,
  TIER_REQUIREMENTS
};
