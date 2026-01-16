/**
 * Module Bundles and Industry Presets
 * Extracted from server.cjs
 */

const BUNDLES = {
  'core': {
    name: 'Core',
    description: 'Essential modules every platform needs',
    icon: '🔐',
    backend: ['auth', 'file-upload'],
    frontend: ['login-form', 'register-form', 'header-nav', 'footer-section', 'modal-system', 'auth-context']
  },
  'dashboard': {
    name: 'Dashboard',
    description: 'Admin dashboard with analytics',
    icon: '📊',
    backend: ['admin-dashboard', 'analytics'],
    frontend: ['stat-cards', 'data-table', 'admin-panel']
  },
  'commerce': {
    name: 'Commerce',
    description: 'E-commerce and payments',
    icon: '💳',
    backend: ['stripe-payments', 'payments', 'inventory', 'marketplace', 'vendor-system', 'transfers'],
    frontend: ['checkout-flow', 'pricing-table', 'marketplace-ui', 'trading-hub']
  },
  'social': {
    name: 'Social',
    description: 'Social features',
    icon: '💬',
    backend: ['notifications', 'chat', 'social-feed', 'posts'],
    frontend: ['card-components']
  },
  'collectibles': {
    name: 'Collectibles',
    description: 'Collection management + AI scanning',
    icon: '🃏',
    backend: ['ai-scanner', 'collections', 'ebay-integration', 'nfc-tags', 'showcase'],
    frontend: ['collection-grid', 'item-detail', 'file-uploader', 'image-gallery', 'search-filter']
  },
  'sports': {
    name: 'Sports',
    description: 'Sports/fantasy/betting features',
    icon: '🏈',
    backend: ['fantasy', 'betting', 'leaderboard', 'pools', 'schools'],
    frontend: []
  },
  'healthcare': {
    name: 'Healthcare',
    description: 'Healthcare/booking features',
    icon: '🏥',
    backend: ['booking'],
    frontend: ['settings-panel']
  },
  'family': {
    name: 'Family',
    description: 'Family management features',
    icon: '👨‍👩‍👧‍👦',
    backend: ['calendar', 'tasks', 'meals', 'kids-banking', 'family-groups', 'documents'],
    frontend: []
  },
  'gamification': {
    name: 'Gamification',
    description: 'Achievements and challenges',
    icon: '🏆',
    backend: ['achievements', 'portfolio'],
    frontend: []
  }
};

const INDUSTRY_PRESETS = {
  'restaurant': {
    name: 'Restaurant / Food Service',
    description: 'Menu management, reservations, online ordering',
    icon: '🍽️',
    bundles: ['core', 'commerce'],
    additionalBackend: ['booking', 'inventory', 'notifications'],
    additionalFrontend: ['image-gallery', 'search-filter']
  },
  'healthcare': {
    name: 'Healthcare / Medical',
    description: 'Patient management, appointments, telemedicine',
    icon: '🏥',
    bundles: ['core', 'dashboard', 'healthcare'],
    additionalBackend: ['notifications', 'chat', 'documents'],
    additionalFrontend: []
  },
  'ecommerce': {
    name: 'E-Commerce / Retail',
    description: 'Product catalog, cart, checkout, payments',
    icon: '🛒',
    bundles: ['core', 'commerce', 'dashboard'],
    additionalBackend: ['notifications'],
    additionalFrontend: ['search-filter', 'image-gallery']
  },
  'collectibles': {
    name: 'Collectibles / Trading Cards',
    description: 'AI scanning, collection management, eBay pricing',
    icon: '🃏',
    bundles: ['core', 'commerce', 'collectibles', 'dashboard'],
    additionalBackend: [],
    additionalFrontend: []
  },
  'sports': {
    name: 'Sports / Fantasy / Betting',
    description: 'Fantasy leagues, betting pools, leaderboards',
    icon: '🎮',
    bundles: ['core', 'social', 'sports', 'dashboard'],
    additionalBackend: ['notifications'],
    additionalFrontend: []
  },
  'saas': {
    name: 'SaaS / B2B Platform',
    description: 'Subscriptions, analytics, admin dashboard',
    icon: '🏢',
    bundles: ['core', 'commerce', 'dashboard', 'gamification'],
    additionalBackend: ['notifications', 'analytics'],
    additionalFrontend: []
  },
  'family': {
    name: 'Family / Community',
    description: 'Calendar, tasks, kids banking, meal planning',
    icon: '👨‍👩‍👧‍👦',
    bundles: ['core', 'family', 'social'],
    additionalBackend: [],
    additionalFrontend: []
  }
};

module.exports = {
  BUNDLES,
  INDUSTRY_PRESETS
};
