/**
 * Hybrid Generator - Orchestrates modules + AI generation
 *
 * SURGICAL ADDITION - Layers on top of existing system
 *
 * Core principle:
 * - MODULES provide proven code (auth, admin, payments)
 * - AI generates unique parts (pages, design, content)
 *
 * Visual freedom preserved:
 * - AI uses generation-variety.cjs for design choices
 * - AI uses feature-patterns.cjs for architecture guidance
 * - Patterns guide WHAT to build, AI decides HOW it looks
 */

const { selectTier, TIERS } = require('./tier-selector.cjs');
const { buildFeatureContext } = require('../configs/feature-prompt-builder.cjs');

// ============================================
// GENERATION PLAN BUILDER
// ============================================

/**
 * Build a generation plan based on tier
 *
 * This doesn't execute generation - it creates a PLAN that tells
 * the existing system what to do differently based on tier.
 *
 * @param {string} businessDescription - Business description
 * @param {string} industry - Detected industry
 * @param {object} options - Generation options
 * @returns {object} Generation plan for existing system to execute
 */
function buildGenerationPlan(businessDescription, industry, options = {}) {
  const {
    explicitTier = null,
    pageCount = null,
    enabledFeatures = []
  } = options;

  // Get tier recommendation
  const tierResult = selectTier(businessDescription, industry, { explicitTier });
  const tier = tierResult.tier;
  const tierCode = tierResult.recommended;

  // Get feature context for AI prompts
  const featureContext = buildFeatureContext(businessDescription, industry, {
    compact: tierCode === 'L1',  // Use compact prompts for simple sites
    includeBackend: tier.features.hasBackend,
    includeFrontend: true
  });

  // Build the generation plan
  const plan = {
    // Tier info
    tier: tierCode,
    tierName: tier.name,
    adminTier: tier.adminTier,

    // What gets generated
    generation: {
      // Pages AI will generate with full visual freedom
      aiPages: buildPageList(tierCode, industry, featureContext.features),

      // Modules to copy from module-library (not regenerate)
      modules: buildModuleList(tierCode, featureContext.features),

      // Backend routes to generate/copy
      backend: buildBackendPlan(tierCode, featureContext.features),

      // Contexts/hooks to include
      contexts: buildContextList(tierCode, featureContext.features)
    },

    // AI prompt enhancements
    prompts: {
      // Feature patterns for architectural guidance
      featurePromptSection: featureContext.promptSection,
      modeGuidance: featureContext.modeGuidance,

      // Visual freedom flags
      visualFreedom: {
        useVariety: true,           // Use generation-variety.cjs
        heroLayouts: true,          // Random hero layout
        colorVariations: true,      // Color scheme variations
        sectionOrdering: true,      // Industry-specific section order
        componentStyles: true       // Card/button style variations
      }
    },

    // Flags for existing system
    flags: {
      ...tier.features,
      skipAdminGeneration: tierCode === 'L1',  // L1 has no admin
      useModularAdmin: tierCode !== 'L1',      // L2+ use modular admin
      copyAuthModule: tier.features.hasAuth,   // Copy auth, don't generate
      copyPaymentsModule: tier.features.hasPayments
    },

    // Estimates
    estimates: {
      cost: tier.estimatedCost,
      time: tier.estimatedTime,
      lines: tier.estimatedLines,
      pages: tier.maxPages
    },

    // For UI display
    display: {
      includes: tier.includes,
      upgradeOptions: tierResult.upgradeOptions,
      downgradeOptions: tierResult.downgradeOptions
    }
  };

  return plan;
}

// ============================================
// PAGE LIST BUILDER
// ============================================

/**
 * Build list of pages AI should generate
 * These get FULL visual freedom
 */
function buildPageList(tierCode, industry, features) {
  const pages = [];

  // All tiers get home
  pages.push({
    id: 'home',
    name: 'Home',
    aiGenerated: true,
    visualFreedom: 'full',
    sections: getHomeSections(industry)
  });

  if (tierCode === 'L1') {
    // L1 is single page, home only
    return pages;
  }

  // L2+ get additional pages
  pages.push(
    { id: 'about', name: 'About', aiGenerated: true, visualFreedom: 'full' },
    { id: 'services', name: 'Services', aiGenerated: true, visualFreedom: 'full' },
    { id: 'contact', name: 'Contact', aiGenerated: true, visualFreedom: 'full' }
  );

  // Industry-specific pages
  if (['restaurant', 'pizza', 'cafe', 'bakery'].some(i => industry.includes(i))) {
    pages.push({ id: 'menu', name: 'Menu', aiGenerated: true, visualFreedom: 'full' });
  }

  if (['photography', 'wedding', 'portfolio', 'tattoo'].some(i => industry.includes(i))) {
    pages.push({ id: 'gallery', name: 'Gallery', aiGenerated: true, visualFreedom: 'full' });
  }

  if (['salon', 'spa', 'fitness', 'dental', 'medical'].some(i => industry.includes(i))) {
    pages.push({ id: 'team', name: 'Team', aiGenerated: true, visualFreedom: 'full' });
  }

  // L3+ get feature pages
  if (tierCode === 'L3' || tierCode === 'L4') {
    if (features.includes('booking')) {
      pages.push({
        id: 'booking',
        name: 'Book Now',
        aiGenerated: true,
        visualFreedom: 'full',
        usePattern: 'booking'  // Use booking pattern for architecture
      });
    }

    if (features.includes('auth')) {
      // Auth pages use module, but AI can customize styling
      pages.push(
        { id: 'login', name: 'Login', aiGenerated: false, useModule: 'auth-pages' },
        { id: 'register', name: 'Register', aiGenerated: false, useModule: 'auth-pages' },
        { id: 'account', name: 'Account', aiGenerated: true, visualFreedom: 'themed' }
      );
    }
  }

  // L4 gets e-commerce pages
  if (tierCode === 'L4') {
    if (features.includes('cart')) {
      pages.push(
        { id: 'checkout', name: 'Checkout', aiGenerated: true, visualFreedom: 'full', usePattern: 'cart' },
        { id: 'tracking', name: 'Order Tracking', aiGenerated: true, visualFreedom: 'full', usePattern: 'tracking' }
      );
    }
  }

  return pages;
}

/**
 * Get home page sections based on industry
 */
function getHomeSections(industry) {
  // Default sections - AI will style uniquely
  const sections = ['hero', 'features', 'about', 'testimonials', 'cta', 'footer'];

  // Industry-specific additions
  if (industry.includes('restaurant') || industry.includes('pizza')) {
    sections.splice(2, 0, 'menu-preview', 'specials');
  }

  if (industry.includes('salon') || industry.includes('spa')) {
    sections.splice(2, 0, 'services-grid', 'booking-cta');
  }

  return sections;
}

// ============================================
// MODULE LIST BUILDER
// ============================================

/**
 * Build list of modules to copy (not AI generate)
 * These are PROVEN code from module-library
 */
function buildModuleList(tierCode, features) {
  const modules = {
    frontend: [],
    backend: [],
    admin: []
  };

  // All tiers get effects
  modules.frontend.push('effects');

  if (tierCode === 'L1') {
    return modules;  // L1 needs minimal modules
  }

  // L2+ get admin modules based on tier
  const adminModules = getAdminModulesForTier(tierCode);
  modules.admin = adminModules;

  // L3+ get auth module
  if (features.includes('auth')) {
    modules.frontend.push('auth-pages');
    modules.backend.push('auth');
  }

  // L3+ get booking module
  if (features.includes('booking')) {
    modules.backend.push('booking');
    modules.admin.push('admin-bookings');
  }

  // L4 gets commerce modules
  if (features.includes('cart') || features.includes('payments')) {
    modules.frontend.push('checkout-flow');
    modules.backend.push('payments');
  }

  return modules;
}

/**
 * Get admin modules for tier (maps to existing admin tier system)
 */
function getAdminModulesForTier(tierCode) {
  const tierToAdmin = {
    L1: [],
    L2: ['admin-dashboard', 'admin-content', 'admin-settings'],
    L3: ['admin-dashboard', 'admin-content', 'admin-settings', 'admin-analytics', 'admin-customers', 'admin-bookings', 'admin-notifications'],
    L4: ['admin-dashboard', 'admin-content', 'admin-settings', 'admin-analytics', 'admin-customers', 'admin-bookings', 'admin-notifications']
    // L4 PRO tier adds more via existing admin-module-loader
  };

  return tierToAdmin[tierCode] || [];
}

// ============================================
// BACKEND PLAN BUILDER
// ============================================

/**
 * Build backend generation plan
 */
function buildBackendPlan(tierCode, features) {
  if (tierCode === 'L1' || tierCode === 'L2') {
    // L1/L2 have minimal/no backend
    return {
      generate: false,
      routes: [],
      copyModules: []
    };
  }

  const plan = {
    generate: true,
    routes: [],
    copyModules: []
  };

  // Core routes
  plan.routes.push('contact');  // Always have contact

  // Feature-based routes
  if (features.includes('auth')) {
    plan.copyModules.push('auth');  // Copy, don't generate
  }

  if (features.includes('booking')) {
    plan.copyModules.push('booking');
  }

  if (features.includes('admin')) {
    plan.copyModules.push('admin-api');
  }

  if (features.includes('payments')) {
    plan.copyModules.push('payments');
  }

  // L4 gets full order management
  if (tierCode === 'L4' && features.includes('cart')) {
    plan.routes.push('orders', 'menu', 'customers');
  }

  return plan;
}

// ============================================
// CONTEXT LIST BUILDER
// ============================================

/**
 * Build list of React contexts needed
 */
function buildContextList(tierCode, features) {
  const contexts = [];

  // Theme context for all
  contexts.push({ name: 'ThemeContext', source: 'generate' });

  if (features.includes('auth')) {
    contexts.push({ name: 'AuthContext', source: 'module', module: 'auth' });
  }

  if (features.includes('cart')) {
    contexts.push({ name: 'CartContext', source: 'pattern', pattern: 'cart' });
  }

  if (features.includes('booking')) {
    contexts.push({ name: 'BookingContext', source: 'pattern', pattern: 'booking' });
  }

  return contexts;
}

// ============================================
// INTEGRATION WITH EXISTING SYSTEM
// ============================================

/**
 * Enhance existing generation config with tier info
 *
 * This is the key integration point - it takes the existing
 * generation config and adds tier-aware enhancements
 *
 * @param {object} existingConfig - Config from Quick/Orchestrator/etc
 * @param {object} plan - Generation plan from buildGenerationPlan
 * @returns {object} Enhanced config for existing generators
 */
function enhanceConfig(existingConfig, plan) {
  return {
    ...existingConfig,

    // Add tier info
    tier: plan.tier,
    tierName: plan.tierName,

    // Override admin tier
    adminTier: plan.adminTier,

    // Add module flags
    modules: plan.generation.modules,

    // Add prompt enhancements
    promptEnhancements: plan.prompts,

    // Add feature flags
    features: plan.flags,

    // Keep everything else from existing config
    // This ensures backward compatibility
  };
}

/**
 * Get tier-aware page generation config
 *
 * Tells the AI generator which pages to create and how
 */
function getPageGenerationConfig(plan) {
  return {
    pages: plan.generation.aiPages,
    visualFreedom: plan.prompts.visualFreedom,
    featurePromptSection: plan.prompts.featurePromptSection,
    modeGuidance: plan.prompts.modeGuidance
  };
}

/**
 * Check if a component should use module vs AI generation
 */
function shouldUseModule(componentType, plan) {
  const moduleComponents = [
    'auth-pages',
    'admin-dashboard',
    'checkout-flow',
    'effects'
  ];

  // Check if this component type is in our modules list
  const allModules = [
    ...plan.generation.modules.frontend,
    ...plan.generation.modules.backend,
    ...plan.generation.modules.admin
  ];

  return moduleComponents.some(m =>
    componentType.includes(m) || allModules.includes(componentType)
  );
}

// ============================================
// LOGGING / DEBUGGING
// ============================================

/**
 * Log generation plan for debugging
 */
function logPlan(plan) {
  console.log('\n════════════════════════════════════════');
  console.log(`📊 GENERATION PLAN: ${plan.tierName} (${plan.tier})`);
  console.log('════════════════════════════════════════');
  console.log(`Admin Tier: ${plan.adminTier || 'None'}`);
  console.log(`Estimated: ${plan.estimates.time}, $${plan.estimates.cost}`);
  console.log('\n🎨 AI-Generated Pages:');
  plan.generation.aiPages.filter(p => p.aiGenerated).forEach(p => {
    console.log(`   - ${p.name} (${p.visualFreedom} freedom)`);
  });
  console.log('\n📦 Modules to Copy:');
  console.log(`   Frontend: ${plan.generation.modules.frontend.join(', ') || 'none'}`);
  console.log(`   Backend: ${plan.generation.modules.backend.join(', ') || 'none'}`);
  console.log(`   Admin: ${plan.generation.modules.admin.join(', ') || 'none'}`);
  console.log('\n🎯 Flags:');
  Object.entries(plan.flags).forEach(([k, v]) => {
    if (v) console.log(`   ✓ ${k}`);
  });
  console.log('════════════════════════════════════════\n');
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  buildGenerationPlan,
  enhanceConfig,
  getPageGenerationConfig,
  shouldUseModule,
  logPlan,

  // Helpers for existing system
  buildPageList,
  buildModuleList,
  buildBackendPlan,
  buildContextList,
  getAdminModulesForTier
};
