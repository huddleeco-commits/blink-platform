/**
 * Feature Detector - Analyzes business input to detect required features
 * Maps business concepts to technical feature requirements
 *
 * This is NOT about templates - it's about detecting what the AI needs to generate
 */

// Feature keywords and phrases that trigger detection
const FEATURE_SIGNALS = {
  // E-commerce / Ordering
  cart: [
    'ordering', 'order online', 'buy', 'purchase', 'shop', 'store', 'e-commerce',
    'ecommerce', 'cart', 'checkout', 'add to cart', 'shopping', 'sell', 'products',
    'menu ordering', 'food ordering', 'online store'
  ],

  // Payments
  payments: [
    'payment', 'pay online', 'credit card', 'stripe', 'checkout', 'purchase',
    'buy now', 'pricing', 'subscription', 'billing', 'invoice', 'pay'
  ],

  // Booking / Scheduling
  booking: [
    'booking', 'appointment', 'schedule', 'reservation', 'reserve', 'book now',
    'availability', 'calendar', 'time slot', 'consultation', 'session'
  ],

  // User Accounts
  auth: [
    'login', 'sign up', 'account', 'register', 'member', 'membership', 'profile',
    'dashboard', 'my orders', 'order history', 'saved', 'favorites', 'user'
  ],

  // Real-time / Tracking
  tracking: [
    'tracking', 'track order', 'status', 'real-time', 'live', 'updates',
    'delivery tracking', 'order status', 'progress', 'eta', 'where is my'
  ],

  // Admin / Management
  admin: [
    'admin', 'dashboard', 'manage', 'management', 'analytics', 'reports',
    'inventory', 'staff', 'employees', 'back office', 'cms', 'control panel'
  ],

  // Search / Discovery
  search: [
    'search', 'filter', 'find', 'browse', 'catalog', 'directory', 'explore',
    'categories', 'tags', 'sort'
  ],

  // Reviews / Social Proof
  reviews: [
    'review', 'rating', 'testimonial', 'feedback', 'stars', 'comment',
    'social proof', 'customer reviews', 'what people say'
  ],

  // Contact / Communication
  contact: [
    'contact', 'message', 'chat', 'support', 'help', 'inquiry', 'quote',
    'get in touch', 'reach out', 'email us', 'call us'
  ],

  // Location / Multi-location
  locations: [
    'locations', 'branches', 'stores', 'find us', 'near me', 'map',
    'directions', 'multiple locations', 'franchises'
  ],

  // Notifications
  notifications: [
    'notification', 'alert', 'email', 'sms', 'text', 'remind', 'reminder',
    'subscribe', 'newsletter', 'updates'
  ],

  // Media / Gallery
  gallery: [
    'gallery', 'portfolio', 'photos', 'images', 'video', 'media',
    'showcase', 'work', 'projects', 'before after'
  ],

  // Pricing / Plans
  pricing: [
    'pricing', 'plans', 'packages', 'tiers', 'subscription', 'monthly',
    'annual', 'free trial', 'premium', 'pro', 'enterprise'
  ]
};

// Industry to likely features mapping (defaults, can be overridden by signals)
const INDUSTRY_FEATURE_DEFAULTS = {
  restaurant: ['cart', 'payments', 'tracking', 'admin', 'reviews', 'locations'],
  pizza: ['cart', 'payments', 'tracking', 'admin', 'reviews'],
  cafe: ['cart', 'payments', 'locations', 'gallery'],
  bakery: ['cart', 'payments', 'gallery', 'contact'],

  retail: ['cart', 'payments', 'auth', 'search', 'reviews', 'admin'],
  clothing: ['cart', 'payments', 'auth', 'search', 'gallery', 'reviews'],
  jewelry: ['cart', 'payments', 'gallery', 'contact', 'reviews'],

  salon: ['booking', 'auth', 'gallery', 'reviews', 'pricing', 'contact'],
  spa: ['booking', 'auth', 'gallery', 'pricing', 'contact'],
  barbershop: ['booking', 'gallery', 'pricing', 'reviews'],

  medical: ['booking', 'auth', 'contact', 'locations'],
  dental: ['booking', 'auth', 'contact', 'reviews'],
  fitness: ['booking', 'auth', 'pricing', 'gallery', 'reviews'],
  yoga: ['booking', 'auth', 'pricing', 'gallery'],

  law: ['booking', 'contact', 'reviews'],
  accounting: ['booking', 'contact', 'auth'],
  consulting: ['booking', 'contact', 'pricing', 'reviews'],

  photography: ['booking', 'gallery', 'pricing', 'contact', 'reviews'],
  wedding: ['booking', 'gallery', 'contact', 'reviews'],

  realestate: ['search', 'gallery', 'contact', 'locations'],
  property: ['search', 'gallery', 'contact', 'auth'],

  saas: ['auth', 'payments', 'pricing', 'admin', 'notifications'],
  software: ['auth', 'pricing', 'contact'],

  education: ['booking', 'auth', 'pricing', 'gallery'],
  coaching: ['booking', 'auth', 'pricing', 'reviews', 'contact'],

  nonprofit: ['contact', 'gallery', 'notifications'],
  church: ['contact', 'gallery', 'locations', 'notifications'],

  construction: ['gallery', 'contact', 'reviews'],
  plumbing: ['booking', 'contact', 'reviews', 'locations'],
  electrical: ['booking', 'contact', 'reviews'],
  hvac: ['booking', 'contact', 'reviews', 'locations'],

  auto: ['booking', 'contact', 'reviews', 'gallery'],
  mechanic: ['booking', 'contact', 'reviews'],

  hotel: ['booking', 'payments', 'gallery', 'reviews', 'locations'],
  vacation: ['booking', 'payments', 'gallery', 'search', 'reviews'],

  default: ['contact', 'gallery']
};

// Feature dependencies - if you have X, you probably need Y
const FEATURE_DEPENDENCIES = {
  cart: ['payments'],           // Cart needs payment processing
  payments: ['auth'],           // Payments usually need accounts (optional)
  booking: ['notifications'],   // Bookings need confirmations
  tracking: ['auth'],           // Tracking needs order/user context
  admin: ['auth'],              // Admin needs authentication
  pricing: ['payments']         // Pricing pages usually lead to payment
};

/**
 * Detect features from business description and industry
 */
function detectFeatures(businessDescription, industry, explicitFeatures = []) {
  const description = (businessDescription || '').toLowerCase();
  const industryLower = (industry || '').toLowerCase();

  const detected = new Set(explicitFeatures);

  // 1. Add industry defaults
  const industryKey = Object.keys(INDUSTRY_FEATURE_DEFAULTS).find(key =>
    industryLower.includes(key)
  ) || 'default';

  INDUSTRY_FEATURE_DEFAULTS[industryKey].forEach(f => detected.add(f));

  // 2. Scan description for feature signals
  for (const [feature, signals] of Object.entries(FEATURE_SIGNALS)) {
    for (const signal of signals) {
      if (description.includes(signal)) {
        detected.add(feature);
        break;
      }
    }
  }

  // 3. Add dependencies
  let addedDeps = true;
  while (addedDeps) {
    addedDeps = false;
    for (const [feature, deps] of Object.entries(FEATURE_DEPENDENCIES)) {
      if (detected.has(feature)) {
        for (const dep of deps) {
          if (!detected.has(dep)) {
            detected.add(dep);
            addedDeps = true;
          }
        }
      }
    }
  }

  return Array.from(detected);
}

/**
 * Get feature complexity level
 * Used to determine how much the AI needs to generate
 */
function getComplexityLevel(features) {
  const complexFeatures = ['cart', 'payments', 'booking', 'auth', 'admin', 'tracking'];
  const simpleFeatures = ['contact', 'gallery', 'reviews', 'locations'];

  const complexCount = features.filter(f => complexFeatures.includes(f)).length;
  const simpleCount = features.filter(f => simpleFeatures.includes(f)).length;

  if (complexCount >= 4) return 'full-saas';      // Full application
  if (complexCount >= 2) return 'interactive';    // Interactive features
  if (complexCount >= 1) return 'enhanced';       // Some dynamic features
  if (simpleCount >= 2) return 'standard';        // Standard website
  return 'minimal';                                // Basic landing page
}

/**
 * Categorize features by generation phase
 */
function categorizeFeatures(features) {
  return {
    // Core state management needed
    stateFeatures: features.filter(f =>
      ['cart', 'auth', 'booking'].includes(f)
    ),

    // Backend API needed
    apiFeatures: features.filter(f =>
      ['cart', 'payments', 'booking', 'auth', 'admin', 'tracking', 'search', 'reviews'].includes(f)
    ),

    // Real-time/polling needed
    realtimeFeatures: features.filter(f =>
      ['tracking', 'notifications', 'admin'].includes(f)
    ),

    // UI components
    uiFeatures: features.filter(f =>
      ['gallery', 'reviews', 'contact', 'locations', 'pricing', 'search'].includes(f)
    ),

    // Third-party integrations
    integrationFeatures: features.filter(f =>
      ['payments', 'notifications', 'locations'].includes(f)
    )
  };
}

/**
 * Generate feature summary for prompt injection
 */
function getFeatureSummary(features) {
  const complexity = getComplexityLevel(features);
  const categories = categorizeFeatures(features);

  return {
    features,
    complexity,
    categories,
    needsStateManagement: categories.stateFeatures.length > 0,
    needsBackendAPI: categories.apiFeatures.length > 0,
    needsRealtime: categories.realtimeFeatures.length > 0,
    needsIntegrations: categories.integrationFeatures.length > 0
  };
}

module.exports = {
  detectFeatures,
  getComplexityLevel,
  categorizeFeatures,
  getFeatureSummary,
  FEATURE_SIGNALS,
  INDUSTRY_FEATURE_DEFAULTS,
  FEATURE_DEPENDENCIES
};
