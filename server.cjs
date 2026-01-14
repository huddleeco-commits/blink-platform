/**
 * Module Assembler Backend Server
 * 
 * Express server that provides API endpoints for the assembler UI
 * and executes the actual assembly script.
 * 
 * Save to: C:\Users\huddl\OneDrive\Desktop\module-library\module-assembler-ui\server.cjs
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Industry Layout System
const { INDUSTRY_LAYOUTS, buildLayoutContext, getLayoutConfig } = require('./config/industry-layouts.cjs');

// Database and Admin Routes
let db = null;
let adminRoutes = null;

async function initializeServices() {
  try {
    // Only initialize DB if DATABASE_URL is set
    if (process.env.DATABASE_URL) {
      db = require('./database/db.js');
      await db.initializeDatabase();
      console.log('   ✅ Database initialized');

      adminRoutes = require('./routes/admin-routes.cjs');
      console.log('   ✅ Admin routes loaded');
    } else {
      console.log('   ⚠️ DATABASE_URL not set - admin features disabled');
    }
  } catch (err) {
    console.error('   ⚠️ Service init error:', err.message);
  }
}

// PDF text extraction helper
async function extractPdfText(base64Data) {
  try {
    const pdf = require('pdf-parse');
    const buffer = Buffer.from(base64Data, 'base64');
    const data = await pdf(buffer);
    return data.text;
  } catch (err) {
    console.log('   ⚠️ PDF parsing failed:', err.message);
    return null;
  }
}

// Load prompt configs
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');
const INDUSTRIES = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, 'industries.json'), 'utf-8'));
const LAYOUTS = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, 'layouts.json'), 'utf-8'));
const EFFECTS = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, 'effects.json'), 'utf-8'));
const SECTIONS = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, 'sections.json'), 'utf-8'));

// ============================================
// UTILITY: Convert page ID to valid JS component name
// "franchise-opportunities" → "FranchiseOpportunities"
// ============================================
function toComponentName(pageId) {
  return pageId
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

function toNavLabel(pageId) {
  return pageId
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

// Homepage templates available as fallback if needed
// const { HOMEPAGE_TEMPLATES, getTemplateForIndustry, getContentPromptForTemplate } = require('../templates/homepage-templates.cjs');

// ============================================
// INDUSTRY DETECTION - Keyword-based matching
// ============================================
function detectIndustryFromDescription(description) {
  const text = description.toLowerCase();
  
  // Order matters - more specific matches first
  const patterns = [
    // Finance/Investment (BEFORE SaaS to catch investment firms)
    { industry: 'finance', keywords: ['investment', 'wealth management', 'portfolio', 'hedge fund', 'private equity', 'asset management', 'financial advisor', 'capital', 'securities', 'trading firm', 'brokerage'] },
    
    // Law
    { industry: 'law-firm', keywords: ['law firm', 'attorney', 'lawyer', 'legal', 'litigation', 'counsel'] },
    
    // Healthcare
    { industry: 'healthcare', keywords: ['medical', 'healthcare', 'clinic', 'hospital', 'physician', 'doctor office', 'health center'] },
    { industry: 'dental', keywords: ['dental', 'dentist', 'orthodont', 'oral surgery'] },
    { industry: 'chiropractic', keywords: ['chiropract', 'physical therapy', 'pt clinic', 'rehab center'] },
    { industry: 'spa-salon', keywords: ['spa', 'salon', 'beauty', 'nail', 'hair stylist', 'esthetician', 'massage therapy'] },
    
    // Food & Beverage
    { industry: 'restaurant', keywords: ['restaurant', 'dining', 'bistro', 'eatery', 'fine dining', 'steakhouse', 'seafood', 'bbq', 'barbecue', 'grill'] },
    { industry: 'cafe', keywords: ['coffee', 'cafe', 'espresso', 'tea house', 'roaster'] },
    { industry: 'bar', keywords: ['bar', 'nightclub', 'lounge', 'pub', 'brewery', 'cocktail', 'wine bar'] },
    { industry: 'bakery', keywords: ['bakery', 'pastry', 'cake shop', 'donut', 'bread'] },
    
    // Professional Services
    { industry: 'accounting', keywords: ['accounting', 'cpa', 'bookkeep', 'tax preparation', 'audit'] },
    { industry: 'consulting', keywords: ['consulting', 'consultant', 'advisory', 'strategy firm'] },
    { industry: 'real-estate', keywords: ['real estate', 'realtor', 'property', 'realty', 'broker'] },
    { industry: 'insurance', keywords: ['insurance', 'coverage', 'policy', 'claims'] },
    
    // Fitness & Wellness
    { industry: 'fitness', keywords: ['gym', 'fitness center', 'crossfit', 'personal training', 'workout'] },
    { industry: 'yoga', keywords: ['yoga', 'pilates', 'meditation studio', 'wellness studio'] },
    
    // Tech
    { industry: 'saas', keywords: ['saas', 'software', 'platform', 'app', 'tech startup', 'b2b', 'dashboard', 'analytics tool'] },
    { industry: 'startup', keywords: ['startup', 'disrupt', 'innovation lab', 'venture'] },
    { industry: 'agency', keywords: ['agency', 'marketing agency', 'design agency', 'creative agency', 'digital agency', 'seo', 'ppc'] },
    
    // Retail
    { industry: 'ecommerce', keywords: ['ecommerce', 'online store', 'shop', 'retail', 'boutique', 'merchandise'] },
    { industry: 'subscription-box', keywords: ['subscription box', 'monthly box', 'curated box'] },
    
    // Creative
    { industry: 'photography', keywords: ['photography', 'photographer', 'photo studio', 'headshot'] },
    { industry: 'wedding', keywords: ['wedding', 'event planner', 'bridal', 'event coordinator'] },
    { industry: 'portfolio', keywords: ['portfolio', 'freelance', 'designer portfolio', 'developer portfolio'] },
    
    // Organizations
    { industry: 'nonprofit', keywords: ['nonprofit', 'charity', 'foundation', 'ngo', 'cause'] },
    { industry: 'church', keywords: ['church', 'ministry', 'worship', 'congregation', 'faith'] },
    
    // Education
    { industry: 'school', keywords: ['school', 'academy', 'institute', 'university', 'college', 'education'] },
    { industry: 'online-course', keywords: ['online course', 'e-learning', 'bootcamp', 'training program', 'masterclass'] },
    
    // Trade Services
    { industry: 'construction', keywords: ['construction', 'contractor', 'builder', 'remodel', 'renovation', 'roofing'] },
    { industry: 'plumber', keywords: ['plumb', 'hvac', 'heating', 'cooling', 'air condition'] },
    { industry: 'electrician', keywords: ['electric', 'wiring', 'electrical contractor'] },
    { industry: 'landscaping', keywords: ['landscap', 'lawn care', 'garden', 'yard', 'tree service'] },
    { industry: 'cleaning', keywords: ['cleaning', 'maid', 'janitorial', 'housekeep'] },
    { industry: 'auto-repair', keywords: ['auto repair', 'mechanic', 'car service', 'automotive', 'body shop', 'oil change'] },
    
    // Other Services
    { industry: 'pet-services', keywords: ['pet', 'grooming', 'veterinar', 'dog walk', 'pet sit', 'kennel'] },
    { industry: 'moving', keywords: ['moving', 'movers', 'relocation', 'hauling'] },
    
    // Events & Hospitality
    { industry: 'event-venue', keywords: ['venue', 'banquet', 'event space', 'conference center', 'ballroom'] },
    { industry: 'hotel', keywords: ['hotel', 'resort', 'inn', 'lodging', 'hospitality', 'motel'] },
    { industry: 'travel', keywords: ['travel', 'tour', 'vacation', 'trip', 'adventure'] },
    
    // Entertainment
    { industry: 'musician', keywords: ['musician', 'band', 'artist', 'singer', 'dj', 'music producer'] },
    { industry: 'podcast', keywords: ['podcast', 'content creator', 'youtuber', 'streamer'] },
    { industry: 'gaming', keywords: ['gaming', 'esport', 'gamer', 'twitch'] },
  ];
  
  for (const { industry, keywords } of patterns) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        console.log(`   🎯 Detected industry: ${industry} (matched: "${keyword}")`);
        return industry;
      }
    }
  }
  
  // Default fallback
  console.log(`   🎯 No specific match, defaulting to: saas`);
  return 'saas';
}

// Build minimal prompt for AI - only includes what's needed
function buildPrompt(industryKey, layoutKey, selectedEffects) {
  const industry = INDUSTRIES[industryKey];
  if (!industry) return null;
  
  const layout = layoutKey ? LAYOUTS[layoutKey] : LAYOUTS[industry.defaultLayout] || LAYOUTS['hero-full-image'];
  const effects = (selectedEffects || industry.effects || []).map(e => EFFECTS[e]).filter(Boolean);
  const sections = (industry.sections || []).map(s => SECTIONS[s] || s);
  
  return {
    industry: {
      name: industry.name,
      vibe: industry.vibe,
      visualPrompt: industry.visualPrompt
    },
    colors: industry.colors,
    typography: industry.typography,
    imagery: industry.imagery,
    layout: {
      name: layout?.name || 'Hero Full Image',
      description: layout?.description || 'Full-width hero with background image',
      codeHint: layout?.codeHint || 'Full viewport hero section',
      heroHeight: layout?.heroHeight || '70vh'
    },
    effects: effects.map(e => ({ name: e.name, css: e.css, reactHint: e.reactHint })),
    sections: sections.map(s => typeof s === 'string' ? s : { name: s.name, elements: s.elements })
  };
}

const app = express();
const PORT = process.env.PORT || 3001;

// Paths - Environment-based with sensible defaults
// MODULE_LIBRARY: parent of module-assembler-ui (this file is in module-assembler-ui/)
// GENERATED_PROJECTS: sibling to module-library
const MODULE_LIBRARY = process.env.MODULE_LIBRARY_PATH || path.resolve(__dirname, '..');
const GENERATED_PROJECTS = process.env.OUTPUT_PATH || path.resolve(__dirname, '..', '..', 'generated-projects');
const ASSEMBLE_SCRIPT = path.join(MODULE_LIBRARY, 'scripts', 'assemble-project.cjs');

// Validate critical paths on startup
if (!fs.existsSync(MODULE_LIBRARY)) {
  console.error(`❌ MODULE_LIBRARY_PATH not found: ${MODULE_LIBRARY}`);
  process.exit(1);
}
if (!fs.existsSync(ASSEMBLE_SCRIPT)) {
  console.error(`❌ Assembler script not found: ${ASSEMBLE_SCRIPT}`);
  process.exit(1);
}
// Create output directory if needed
if (!fs.existsSync(GENERATED_PROJECTS)) {
  fs.mkdirSync(GENERATED_PROJECTS, { recursive: true });
  console.log(`📁 Created output directory: ${GENERATED_PROJECTS}`);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from dist (production build)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Admin routes (mounted after initialization)
app.use('/api/admin', (req, res, next) => {
  if (adminRoutes) {
    adminRoutes(req, res, next);
  } else {
    res.status(503).json({ success: false, error: 'Admin features not available - DATABASE_URL not configured' });
  }
});

// Admin page route
app.get('/admin', (req, res) => {
  const adminHtml = path.join(__dirname, 'dist', 'admin.html');
  if (fs.existsSync(adminHtml)) {
    res.sendFile(adminHtml);
  } else {
    // Fallback for development
    res.redirect('http://localhost:5173/admin.html');
  }
});

// ============================================
// CONFIGURATION
// ============================================

// VISUAL ARCHETYPES (Forces AI to use different structural molds)
const VISUAL_ARCHETYPES = {
  'bento': "Use a 'Bento Box' layout with varying card sizes, rounded corners (24px+), and subtle borders. Avoid standard full-width rows.",
  'split': "Use a heavy 'Split-Screen' approach where text is locked to one side and imagery/interactables are locked to the other.",
  'editorial': "Use an 'Editorial' style with massive overlapping typography, high whitespace (150px+ padding), and asymmetrical image placement.",
  'minimal-stack': "Use an ultra-minimal 'Center Stack'. Everything is centered, zero borders, using only typography and whitespace to create hierarchy.",
  'glassmorphic': "Use a 'Glassmorphic' depth style with frosted glass panels, soft blurs (backdrop-filter), and vibrant background gradients."
};

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

// ============================================
// API ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// PASSWORD VALIDATION ENDPOINTS
// ============================================
// Validate main access password
app.post('/api/auth/validate',
  body('password').isString().notEmpty().withMessage('Password is required'),
  handleValidationErrors,
  (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.BLINK_ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('❌ BLINK_ADMIN_PASSWORD not configured');
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    if (password === adminPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  }
);

// Validate developer access password
app.post('/api/auth/validate-dev',
  body('password').isString().notEmpty().withMessage('Password is required'),
  handleValidationErrors,
  (req, res) => {
    const { password } = req.body;
    const devPassword = process.env.BLINK_DEV_PASSWORD;

    if (!devPassword) {
      console.error('❌ BLINK_DEV_PASSWORD not configured');
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    if (password === devPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  }
);

// Get bundles
app.get('/api/bundles', (req, res) => {
  res.json({ success: true, bundles: BUNDLES });
});

// Get industries (from prompts config)
app.get('/api/industries', (req, res) => {
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
app.get('/api/industry/:key', (req, res) => {
  const { key } = req.params;
  const industry = INDUSTRIES[key];
  if (!industry) {
    return res.status(404).json({ success: false, error: 'Industry not found' });
  }
  res.json({ success: true, industry });
});

// Get layouts
app.get('/api/layouts', (req, res) => {
  res.json({ success: true, layouts: LAYOUTS });
});

// Get effects
app.get('/api/effects', (req, res) => {
  res.json({ success: true, effects: EFFECTS });
});

// Get sections
app.get('/api/sections', (req, res) => {
  res.json({ success: true, sections: SECTIONS });
});

// Build prompt for specific configuration
app.post('/api/build-prompt', (req, res) => {
  const { industryKey, layoutKey, effects } = req.body;
  const prompt = buildPrompt(industryKey, layoutKey, effects);
  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Invalid industry' });
  }
  res.json({ success: true, prompt });
});

// Get modules for an industry
app.get('/api/modules/industry/:industryKey', (req, res) => {
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
app.post('/api/modules/bundles', (req, res) => {
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
app.get('/api/projects', (req, res) => {
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
          } catch (e) {}
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

// ============================================
// BRAIN.JSON GENERATOR
// ============================================

function generateBrainJson(projectName, industryKey, industryConfig) {
  const cfg = industryConfig || {};
  
  const terminologyMap = {
    'restaurant': { product: 'Menu Item', products: 'Menu Items', customer: 'Guest', customers: 'Guests' },
    'healthcare': { product: 'Service', products: 'Services', customer: 'Patient', customers: 'Patients' },
    'dental': { product: 'Service', products: 'Services', customer: 'Patient', customers: 'Patients' },
    'ecommerce': { product: 'Product', products: 'Products', customer: 'Customer', customers: 'Customers' },
    'collectibles': { product: 'Item', products: 'Items', customer: 'Collector', customers: 'Collectors' },
    'saas': { product: 'Plan', products: 'Plans', customer: 'User', customers: 'Users' },
    'law-firm': { product: 'Service', products: 'Services', customer: 'Client', customers: 'Clients' },
    'fitness': { product: 'Class', products: 'Classes', customer: 'Member', customers: 'Members' },
    'spa-salon': { product: 'Treatment', products: 'Treatments', customer: 'Client', customers: 'Clients' },
    'real-estate': { product: 'Listing', products: 'Listings', customer: 'Client', customers: 'Clients' },
    'default': { product: 'Product', products: 'Products', customer: 'Customer', customers: 'Customers' }
  };

  const terminology = terminologyMap[industryKey] || terminologyMap['default'];
  const colors = cfg.colors || { primary: '#3b82f6', accent: '#8b5cf6' };

  return JSON.stringify({
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    industry: {
      type: industryKey || 'business',
      terminology: {
        product: terminology.product,
        products: terminology.products,
        order: 'Order',
        orders: 'Orders',
        customer: terminology.customer,
        customers: terminology.customers,
        inventory: 'Inventory',
        category: 'Category',
        categories: 'Categories'
      }
    },
    business: {
      name: projectName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      tagline: '',
      logo: null,
      currency: 'USD',
      currencySymbol: '$',
      timezone: 'America/New_York',
      locale: 'en-US',
      address: { street: '', city: '', state: '', zip: '', country: 'USA' },
      contact: { phone: '', email: '', website: '' },
      hours: {
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday: { open: '09:00', close: '17:00' },
        friday: { open: '09:00', close: '17:00' },
        saturday: { open: '10:00', close: '14:00' },
        sunday: { open: 'closed', close: 'closed' }
      },
      features: {
        onlineOrdering: true,
        reservations: industryKey === 'restaurant' || industryKey === 'spa-salon',
        loyaltyProgram: false,
        giftCards: false
      }
    },
    modules: {
      dashboard: { enabled: true },
      orders: { enabled: true },
      products: { enabled: true },
      customers: { enabled: true },
      inventory: { enabled: true },
      analytics: { enabled: true },
      marketing: { enabled: true },
      ai: { enabled: true },
      settings: { enabled: true }
    },
    infrastructure: {
      frontend: { provider: 'vercel', url: null },
      backend: { provider: 'railway', url: null },
      database: { provider: 'railway', type: 'postgresql' },
      storage: { provider: 'cloudinary' },
      payments: { provider: 'stripe', connected: false }
    },
    ai: {
      enabled: true,
      provider: 'anthropic',
      features: { insights: true, chat: true, automation: true, forecasting: true }
    },
    theme: {
      mode: 'dark',
      primaryColor: colors.primary || '#3b82f6',
      accentColor: colors.accent || '#8b5cf6'
    }
  }, null, 2);
}

function generateBrainRoutes() {
  return `/**
 * Brain API Routes - Single source of truth
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const BRAIN_PATH = path.join(__dirname, '..', '..', 'brain.json');

function readBrain() {
  try {
    if (fs.existsSync(BRAIN_PATH)) {
      return JSON.parse(fs.readFileSync(BRAIN_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading brain.json:', e.message);
  }
  return null;
}

function writeBrain(data) {
  try {
    fs.writeFileSync(BRAIN_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('Error writing brain.json:', e.message);
    return false;
  }
}

router.get('/', (req, res) => {
  const brain = readBrain();
  if (!brain) return res.status(500).json({ success: false, error: 'Could not read brain.json' });
  res.json({ success: true, brain });
});

router.get('/:section', (req, res) => {
  const brain = readBrain();
  if (!brain) return res.status(500).json({ success: false, error: 'Could not read brain.json' });
  const section = brain[req.params.section];
  if (!section) return res.status(404).json({ success: false, error: 'Section not found' });
  res.json({ success: true, [req.params.section]: section });
});

router.put('/:section', (req, res) => {
  const brain = readBrain();
  if (!brain) return res.status(500).json({ success: false, error: 'Could not read brain.json' });
  brain[req.params.section] = { ...brain[req.params.section], ...req.body };
  brain.lastUpdated = new Date().toISOString();
  if (writeBrain(brain)) {
    res.json({ success: true, message: 'Updated', [req.params.section]: brain[req.params.section] });
  } else {
    res.status(500).json({ success: false, error: 'Could not save changes' });
  }
});

router.patch('/', (req, res) => {
  const brain = readBrain();
  if (!brain) return res.status(500).json({ success: false, error: 'Could not read brain.json' });
  const deepMerge = (target, source) => {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  };
  deepMerge(brain, req.body);
  brain.lastUpdated = new Date().toISOString();
  if (writeBrain(brain)) {
    res.json({ success: true, message: 'Updated', brain });
  } else {
    res.status(500).json({ success: false, error: 'Could not save changes' });
  }
});

module.exports = router;
`;
}

function generateHealthRoutes() {
  return `/**
 * Health Check Routes
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', async (req, res) => {
  const checks = { timestamp: new Date().toISOString(), status: 'healthy', services: {} };
  const brainPath = path.join(__dirname, '..', '..', 'brain.json');
  checks.services.brain = { status: fs.existsSync(brainPath) ? 'healthy' : 'missing' };
  try {
    const db = require('../database/db');
    await db.query('SELECT 1');
    checks.services.database = { status: 'healthy' };
  } catch (e) {
    checks.services.database = { status: 'unhealthy', error: e.message };
  }
  const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
  const missingEnv = requiredEnvVars.filter(v => !process.env[v]);
  checks.services.environment = { status: missingEnv.length === 0 ? 'healthy' : 'warning', missing: missingEnv };
  checks.services.stripe = { status: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured' };
  checks.services.ai = { status: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured' };
  const hasUnhealthy = Object.values(checks.services).some(s => s.status === 'unhealthy');
  checks.status = hasUnhealthy ? 'unhealthy' : 'healthy';
  res.json(checks);
});

router.get('/quick', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
`;
}

function copyDirectorySync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    if (entry.isDirectory()) {
      copyDirectorySync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ============================================
// ASSEMBLY ENDPOINT
// ============================================

app.post('/api/assemble', async (req, res) => {
  const { name, industry, references, theme, description, autoDeploy } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Project name required' });
  }

  // Sanitize project name - SECURITY: Remove ALL shell-dangerous characters
  // Only allow alphanumeric, spaces, and dashes
  const sanitizedName = name
    .replace(/&/g, ' and ')           // Convert & to "and"
    .replace(/[^a-zA-Z0-9\s-]/g, '')  // Remove ALL special chars (prevents shell injection)
    .replace(/\s+/g, ' ')             // Collapse multiple spaces
    .trim()
    .substring(0, 100);               // Limit length

  if (!sanitizedName || sanitizedName.length < 2) {
    return res.status(400).json({ success: false, error: 'Project name must be at least 2 characters (alphanumeric only)' });
  }
  
  // Build command arguments
  const args = ['--name', sanitizedName];

  // Declare sanitizedIndustry in outer scope so it's accessible throughout
  let sanitizedIndustry = null;

  if (industry) {
    // Sanitize industry key - remove special chars, use lowercase with dashes
    sanitizedIndustry = industry
      .toLowerCase()
      .replace(/[&]/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Map unknown industries to closest available match
    const industryFallbacks = {
      // Shooting/Outdoor/Recreation
      'gun-range-and-sporting-grounds': 'fitness',
      'shooting-range-and-firearms-training': 'fitness',
      'shooting-range': 'fitness',
      'firearms': 'fitness',
      'gun-range': 'fitness',
      'gun-range-and-shooting-sports': 'fitness',
      'outdoor-range': 'fitness',
      'tactical-training': 'fitness',
      'sporting-clays': 'fitness',
      'archery': 'fitness',
      'hunting': 'fitness',
      'outdoor-recreation': 'fitness',
      'golf-course': 'fitness',
      'golf': 'fitness',
      'bowling': 'fitness',
      'skating-rink': 'fitness',
      'rock-climbing': 'fitness',
      'trampoline-park': 'fitness',
      'laser-tag': 'fitness',
      'paintball': 'fitness',
      'go-kart': 'fitness',
      'escape-room': 'fitness',
      'axe-throwing': 'fitness',
      
      // Retail/Ecommerce
      'sporting-goods': 'ecommerce',
      'retail-store': 'ecommerce',
      'shop': 'ecommerce',
      'boutique': 'ecommerce',
      'clothing-store': 'ecommerce',
      'jewelry-store': 'ecommerce',
      'gift-shop': 'ecommerce',
      'furniture-store': 'ecommerce',
      'electronics-store': 'ecommerce',
      'hardware-store': 'ecommerce',
      'pet-store': 'ecommerce',
      'bookstore': 'ecommerce',
      'toy-store': 'ecommerce',
      'antique-shop': 'ecommerce',
      'thrift-store': 'ecommerce',
      'dispensary': 'ecommerce',
      'smoke-shop': 'ecommerce',
      'vape-shop': 'ecommerce',
      'liquor-store': 'ecommerce',
      
      // Food & Beverage
      'cafe': 'restaurant',
      'coffee-shop': 'restaurant',
      'bakery': 'restaurant',
      'pizzeria': 'restaurant',
      'food-truck': 'restaurant',
      'catering': 'restaurant',
      'bar': 'restaurant',
      'brewery': 'restaurant',
      'winery': 'restaurant',
      'distillery': 'restaurant',
      'ice-cream-shop': 'restaurant',
      'juice-bar': 'restaurant',
      'deli': 'restaurant',
      'fast-food': 'restaurant',
      'fine-dining': 'restaurant',
      
      // Healthcare/Wellness
      'medical-practice': 'healthcare',
      'doctor': 'healthcare',
      'clinic': 'healthcare',
      'urgent-care': 'healthcare',
      'physical-therapy': 'healthcare',
      'chiropractic': 'healthcare',
      'chiropractor': 'healthcare',
      'dentist': 'dental',
      'orthodontist': 'dental',
      'optometrist': 'healthcare',
      'dermatologist': 'healthcare',
      'mental-health': 'healthcare',
      'therapist': 'healthcare',
      'counseling': 'healthcare',
      'acupuncture': 'spa-salon',
      'massage': 'spa-salon',
      'medspa': 'spa-salon',
      'wellness-center': 'spa-salon',
      
      // Fitness/Sports
      'gym': 'fitness',
      'personal-training': 'fitness',
      'crossfit': 'fitness',
      'pilates': 'fitness',
      'yoga-studio': 'fitness',
      'dance-studio': 'fitness',
      'martial-arts': 'fitness',
      'boxing': 'fitness',
      'swimming-pool': 'fitness',
      'tennis-club': 'fitness',
      'sports-league': 'fitness',
      
      // Professional Services
      'service-business': 'consulting',
      'professional-services': 'consulting',
      'marketing': 'agency',
      'advertising': 'agency',
      'pr-firm': 'agency',
      'web-design': 'agency',
      'graphic-design': 'agency',
      'it-services': 'saas',
      'managed-services': 'saas',
      'staffing': 'consulting',
      'recruiting': 'consulting',
      'hr-services': 'consulting',
      
      // Home Services
      'plumbing': 'plumber',
      'electrical': 'electrician',
      'hvac-services': 'plumber',
      'roofing': 'construction',
      'painting': 'construction',
      'flooring': 'construction',
      'remodeling': 'construction',
      'handyman': 'construction',
      'pest-control': 'cleaning',
      'pool-service': 'cleaning',
      'pressure-washing': 'cleaning',
      'window-cleaning': 'cleaning',
      'junk-removal': 'moving',
      'storage': 'moving',
      
      // Automotive
      'car-dealership': 'auto-repair',
      'auto-body': 'auto-repair',
      'tire-shop': 'auto-repair',
      'oil-change': 'auto-repair',
      'car-wash': 'auto-repair',
      'auto-detailing': 'auto-repair',
      'towing': 'auto-repair',
      
      // Real Estate
      'property-management': 'real-estate',
      'apartment-complex': 'real-estate',
      'mortgage': 'real-estate',
      'title-company': 'real-estate',
      'home-inspection': 'real-estate',
      
      // Legal/Financial
      'attorney': 'law-firm',
      'lawyer': 'law-firm',
      'legal-services': 'law-firm',
      'notary': 'law-firm',
      'cpa': 'accounting',
      'bookkeeper': 'accounting',
      'tax-services': 'accounting',
      'financial-planning': 'accounting',
      'wealth-management': 'accounting',
      
      // Education
      'tutoring': 'school',
      'driving-school': 'school',
      'music-lessons': 'school',
      'art-classes': 'school',
      'language-school': 'school',
      'preschool': 'school',
      'daycare': 'school',
      'afterschool': 'school',
      'summer-camp': 'school',
      'coding-bootcamp': 'online-course',
      
      // Events/Entertainment
      'wedding-venue': 'event-venue',
      'party-venue': 'event-venue',
      'conference-center': 'event-venue',
      'dj': 'musician',
      'band': 'musician',
      'photographer': 'photography',
      'videographer': 'photography',
      'photo-booth': 'photography',
      'florist': 'wedding',
      'event-planner': 'wedding',
      'caterer': 'wedding',
      
      // Hospitality
      'motel': 'hotel',
      'bed-and-breakfast': 'hotel',
      'vacation-rental': 'hotel',
      'airbnb': 'hotel',
      'campground': 'hotel',
      'rv-park': 'hotel',
      
      // Animals
      'veterinarian': 'pet-services',
      'vet': 'pet-services',
      'pet-grooming': 'pet-services',
      'dog-training': 'pet-services',
      'boarding': 'pet-services',
      'kennel': 'pet-services',
      'pet-sitting': 'pet-services',
      'dog-walking': 'pet-services',
      
      // Religious/Nonprofit
      'ministry': 'church',
      'synagogue': 'church',
      'mosque': 'church',
      'temple': 'church',
      'charity': 'nonprofit',
      'foundation': 'nonprofit',
      'association': 'nonprofit',
      
      // Sports Cards / Collectibles
      'sports-card-trading': 'collectibles',
      'sports-card-trading-and-collecting': 'collectibles',
      'sports-cards': 'collectibles',
      'trading-cards': 'collectibles',
      'card-shop': 'collectibles',
      'card-store': 'collectibles',
      'memorabilia': 'collectibles',
      
      // Default
      'unknown': 'saas',
      'other': 'saas',
      'business': 'saas'
    };
    
    // Check if industry exists, otherwise use fallback
    const validIndustries = Object.keys(INDUSTRIES);
    if (!validIndustries.includes(sanitizedIndustry)) {
      const fallback = industryFallbacks[sanitizedIndustry] || 'saas';
      console.log(`   ⚠️ Unknown industry "${sanitizedIndustry}" → using "${fallback}"`);
      sanitizedIndustry = fallback;
    }
    
    args.push('--industry', sanitizedIndustry);
  } else if (req.body.bundles && req.body.bundles.length > 0) {
    args.push('--bundles', req.body.bundles.join(','));
  } else if (req.body.modules && req.body.modules.length > 0) {
    args.push('--modules', req.body.modules.join(','));
  } else {
    return res.status(400).json({ success: false, error: 'Must provide industry, bundles, or modules' });
  }
  
  const startTime = Date.now();
  const ASSEMBLY_TIMEOUT = 5 * 60 * 1000; // 5 minute timeout
  let responded = false;

  console.log(`\n🚀 Assembling project: ${sanitizedName}`);
  console.log(`   Command: node ${ASSEMBLE_SCRIPT} ${args.join(' ')}`);

  // Execute the assembly script - SECURITY: shell: false prevents injection
  const childProcess = spawn(process.execPath, [ASSEMBLE_SCRIPT, ...args], {
    cwd: path.dirname(ASSEMBLE_SCRIPT),
    shell: false,  // CRITICAL: Never use shell: true with user input
    env: { ...process.env, MODULE_LIBRARY_PATH: MODULE_LIBRARY, OUTPUT_PATH: GENERATED_PROJECTS }
  });

  // Timeout handler - kill process if it takes too long
  const timeoutId = setTimeout(() => {
    if (!responded) {
      responded = true;
      childProcess.kill('SIGTERM');
      console.error(`❌ Assembly timeout after ${ASSEMBLY_TIMEOUT / 1000}s`);
      res.status(504).json({
        success: false,
        error: 'Assembly timeout - process took too long',
        duration: Date.now() - startTime
      });
    }
  }, ASSEMBLY_TIMEOUT);

  let output = '';
  let errorOutput = '';

  childProcess.stdout.on('data', (data) => {
    output += data.toString();
    console.log(data.toString());
  });

  childProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.error(data.toString());
  });

  // Handle spawn errors (e.g., ENOENT if node not found)
  childProcess.on('error', (err) => {
    clearTimeout(timeoutId);
    if (!responded) {
      responded = true;
      console.error(`❌ Spawn error: ${err.message}`);
      res.status(500).json({ success: false, error: `Failed to start assembly: ${err.message}` });
    }
  });

  childProcess.on('close', async (code) => {
    clearTimeout(timeoutId);
    if (responded) return; // Already responded (timeout or error)
    if (code === 0) {
      const projectPath = path.join(GENERATED_PROJECTS, sanitizedName);
      const manifestPath = path.join(projectPath, 'project-manifest.json');
      let manifest = null;
      
      if (fs.existsSync(manifestPath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        } catch (e) {}
      }

      // ============================================
      // GENERATE BRAIN.JSON & COPY ADMIN MODULE
      // ============================================
      
      // Determine industry key
      let resolvedIndustryKey = industry;
      if (!resolvedIndustryKey && description?.industryKey) {
        resolvedIndustryKey = description.industryKey;
      }
      if (!resolvedIndustryKey && description?.text) {
        resolvedIndustryKey = detectIndustryFromDescription(description.text);
      }
      resolvedIndustryKey = resolvedIndustryKey || 'saas';

      // Get industry config for brain.json
      const industryConfig = INDUSTRIES[resolvedIndustryKey] || null;

      // Generate brain.json at project root
      const brainJsonContent = generateBrainJson(name, resolvedIndustryKey, industryConfig);
      fs.writeFileSync(path.join(projectPath, 'brain.json'), brainJsonContent);
      console.log('   🧠 brain.json generated');

      // Save uploaded assets to project
      const uploadedAssets = description?.uploadedAssets;
      if (uploadedAssets) {
        const assetsDir = path.join(projectPath, 'frontend', 'public', 'uploads');
        if (!fs.existsSync(assetsDir)) {
          fs.mkdirSync(assetsDir, { recursive: true });
        }
        
        // Save logo
        if (uploadedAssets.logo?.base64) {
          try {
            const logoData = uploadedAssets.logo.base64.replace(/^data:image\/\w+;base64,/, '');
            const logoExt = uploadedAssets.logo.type?.split('/')[1] || 'png';
            fs.writeFileSync(path.join(assetsDir, `logo.${logoExt}`), Buffer.from(logoData, 'base64'));
            console.log('   🎨 Logo saved to uploads/logo.' + logoExt);
          } catch (e) {
            console.log('   ⚠️ Failed to save logo:', e.message);
          }
        }
        
        // Save photos
        if (uploadedAssets.photos && uploadedAssets.photos.length > 0) {
          uploadedAssets.photos.forEach((photo, index) => {
            try {
              const photoData = photo.base64.replace(/^data:image\/\w+;base64,/, '');
              const photoExt = photo.type?.split('/')[1] || 'jpg';
              fs.writeFileSync(path.join(assetsDir, `photo-${index + 1}.${photoExt}`), Buffer.from(photoData, 'base64'));
            } catch (e) {
              console.log(`   ⚠️ Failed to save photo ${index + 1}:`, e.message);
            }
          });
          console.log(`   🖼️ ${uploadedAssets.photos.length} photos saved to uploads/`);
        }
        
        // Save menu and extract text if PDF
        if (uploadedAssets.menu?.base64) {
          try {
            const menuData = uploadedAssets.menu.base64.replace(/^data:[^;]+;base64,/, '');
            const menuExt = uploadedAssets.menu.type?.includes('pdf') ? 'pdf' : 
                           uploadedAssets.menu.type?.split('/')[1] || 'jpg';
            fs.writeFileSync(path.join(assetsDir, `menu.${menuExt}`), Buffer.from(menuData, 'base64'));
            console.log('   📋 Menu saved to uploads/menu.' + menuExt);
            
            // Extract text from PDF
            if (menuExt === 'pdf') {
              try {
                const extractedText = await extractPdfText(menuData);
                if (extractedText) {
                  uploadedAssets.menu.extractedText = extractedText;
                  console.log(`   📝 Extracted ${extractedText.length} chars from menu PDF`);
                }
              } catch (pdfErr) {
                console.log('   ⚠️ Could not extract PDF text:', pdfErr.message);
              }
            }
          } catch (e) {
            console.log('   ⚠️ Failed to save menu:', e.message);
          }
        }
      }

      // Generate admin routes in backend
      const backendRoutesDir = path.join(projectPath, 'backend', 'routes');
      if (!fs.existsSync(backendRoutesDir)) {
        fs.mkdirSync(backendRoutesDir, { recursive: true });
      }
      fs.writeFileSync(path.join(backendRoutesDir, 'brain.js'), generateBrainRoutes());
      fs.writeFileSync(path.join(backendRoutesDir, 'health.js'), generateHealthRoutes());
      console.log('   🔌 Admin routes generated (brain.js, health.js)');

      // Copy business-admin module
      const businessAdminSrc = path.join(MODULE_LIBRARY, 'frontend', 'business-admin');
      const businessAdminDest = path.join(projectPath, 'admin');
      if (fs.existsSync(businessAdminSrc)) {
        copyDirectorySync(businessAdminSrc, businessAdminDest);
        
        // Copy brain.json to admin config folder
        const adminConfigDir = path.join(businessAdminDest, 'src', 'config');
        if (!fs.existsSync(adminConfigDir)) {
          fs.mkdirSync(adminConfigDir, { recursive: true });
        }
        fs.copyFileSync(path.join(projectPath, 'brain.json'), path.join(adminConfigDir, 'brain.json'));
        console.log('   🎛️ business-admin module copied');
      } else {
        console.log('   ⚠️ business-admin module not found at:', businessAdminSrc);
      }

      // Copy auth-pages module for industries that require authentication
      const authRequiredIndustries = ['survey-rewards', 'saas', 'ecommerce', 'collectibles', 'healthcare', 'family'];
      if (authRequiredIndustries.includes(sanitizedIndustry)) {
        const authPagesSrc = path.join(MODULE_LIBRARY, 'frontend', 'auth-pages');
        const authPagesDest = path.join(projectPath, 'frontend', 'src', 'modules', 'auth-pages');
        if (fs.existsSync(authPagesSrc)) {
          if (!fs.existsSync(authPagesDest)) {
            fs.mkdirSync(authPagesDest, { recursive: true });
          }
          copyDirectorySync(authPagesSrc, authPagesDest);
          console.log('   🔐 auth-pages module copied');
        } else {
          console.log('   ⚠️ auth-pages module not found at:', authPagesSrc);
        }
      }

      // ============================================
      // BUILD PROMPT CONFIG
      // ============================================
      
      // Build prompt config from selections - use detection if no explicit key
      let industryKey = description?.industryKey || industry;
      if (!industryKey && description?.text) {
        industryKey = detectIndustryFromDescription(description.text);
      }
      industryKey = industryKey || 'saas';
      const layoutKey = description?.layoutKey || null;
      const selectedEffects = description?.effects || null;
      const promptConfig = buildPrompt(industryKey, layoutKey, selectedEffects);
      
      // Save theme if provided (or create from promptConfig)
      const themeToUse = theme || (promptConfig ? {
        colors: promptConfig.colors,
        fonts: {
          heading: promptConfig.typography?.heading || "'Inter', sans-serif",
          body: promptConfig.typography?.body || "system-ui, sans-serif"
        },
        borderRadius: '8px'
      } : null);
      
      if (themeToUse) {
        try {
          const frontendSrcPath = path.join(projectPath, 'frontend', 'src');
          
          // Generate CSS variables from theme
          const themeCss = `/* Auto-generated theme from industry config */
:root {
  /* Colors */
  --color-primary: ${themeToUse.colors?.primary || '#6366f1'};
  --color-secondary: ${themeToUse.colors?.secondary || '#8b5cf6'};
  --color-accent: ${themeToUse.colors?.accent || '#06b6d4'};
  --color-background: ${themeToUse.colors?.background || '#ffffff'};
  --color-surface: ${themeToUse.colors?.surface || '#f8f9fa'};
  --color-text: ${themeToUse.colors?.text || '#1a1a2e'};
  --color-text-muted: ${themeToUse.colors?.textMuted || '#64748b'};
  
  /* Typography */
  --font-heading: ${themeToUse.fonts?.heading || "'Inter', sans-serif"};
  --font-body: ${themeToUse.fonts?.body || "system-ui, sans-serif"};
  
  /* Spacing & Borders */
  --border-radius: ${themeToUse.borderRadius || '8px'};
}

/* Utility Classes */
.bg-primary { background-color: var(--color-primary); }
.bg-secondary { background-color: var(--color-secondary); }
.bg-accent { background-color: var(--color-accent); }
.bg-surface { background-color: var(--color-surface); }
.text-primary { color: var(--color-primary); }
.text-accent { color: var(--color-accent); }
.text-muted { color: var(--color-text-muted); }

/* Button Styles */
.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-accent {
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

/* Card Styles */
.card {
  background: var(--color-surface);
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: var(--border-radius);
  padding: 24px;
}

body {
  margin: 0;
  font-family: var(--font-body);
  color: var(--color-text);
  background: var(--color-background);
}
`;
          
          if (fs.existsSync(frontendSrcPath)) {
            fs.writeFileSync(path.join(frontendSrcPath, 'theme.css'), themeCss);
            console.log('   🎨 Theme saved to frontend/src/theme.css');
            
            // Also save theme.json for reference
            fs.writeFileSync(
              path.join(frontendSrcPath, 'theme.json'), 
              JSON.stringify(themeToUse, null, 2)
            );
          }
        } catch (themeErr) {
          console.error('   ⚠️ Failed to save theme:', themeErr.message);
        }
      }
      
      // Generate AI pages if description provided
      if (description && description.pages && description.pages.length > 0) {
        try {
          console.log(`   🤖 Generating ${description.pages.length} AI pages...`);
          
          const apiKey = process.env.ANTHROPIC_API_KEY;
          const frontendSrcPath = path.join(projectPath, 'frontend', 'src');
          const pagesDir = path.join(frontendSrcPath, 'pages');
          
          // Create pages directory
          if (!fs.existsSync(pagesDir)) {
            fs.mkdirSync(pagesDir, { recursive: true });
          }
          
          if (apiKey) {
            const Anthropic = require('@anthropic-ai/sdk');
            const client = new Anthropic({ apiKey });
            
            // Generate all pages in parallel for speed
            console.log(`      ⚡ Generating ${description.pages.length} pages in parallel...`);
            
            const pagePromises = description.pages.map(async (pageId) => {
              const componentName = toComponentName(pageId);
              const maxRetries = 2;
              
              for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                  console.log(`      🎨 Generating ${pageId} → ${componentName}Page.jsx${attempt > 1 ? ` (retry ${attempt})` : ''}...`);
                
                // ALL PAGES get AI freedom
                const otherPages = description.pages.filter(p => p !== pageId).map(p => `/${p}`).join(', ');
                const isEnhanceMode = description.enhanceMode === true;
                const existingSiteData = description.existingSite || null;
                
                const pagePrompt = isEnhanceMode 
                  ? buildEnhanceModePrompt(pageId, componentName, existingSiteData, promptConfig) 
                  : buildFreshModePrompt(pageId, componentName, otherPages, description, promptConfig);

                const pageResponse = await client.messages.create({
                  model: 'claude-sonnet-4-20250514',
                  max_tokens: 16000,
                  messages: [{ role: 'user', content: pagePrompt }]
                });
                
                let pageCode = pageResponse.content[0].text;
                pageCode = pageCode.replace(/^```jsx?\n?/g, '').replace(/\n?```$/g, '').trim();
                
                // Validate and fix generated code
                const validation = validateGeneratedCode(pageCode, componentName);
                if (!validation.isValid) {
                  console.log(`      ⚠️ ${pageId} has issues: ${validation.errors.join(', ')}`);
                  pageCode = validation.fixedCode; // Use auto-fixed version
                }
                
                if (!pageCode.includes('export default')) {
                  console.log(`      ⚠️ ${pageId} incomplete, using fallback`);
                  pageCode = buildFallbackPage(componentName, pageId, promptConfig);
                }
                
                const pagePath = path.join(pagesDir, `${componentName}Page.jsx`);
                fs.writeFileSync(pagePath, pageCode);
                console.log(`      ✅ ${componentName}Page.jsx`);
                return { pageId, componentName, success: true };
                
              } catch (pageErr) {
                  console.error(`      ⚠️ ${pageId} attempt ${attempt} failed: ${pageErr.message}`);
                  
                  if (attempt === maxRetries) {
                    console.log(`      🔄 ${pageId}: Using fallback after ${maxRetries} attempts`);
                    const fallbackCode = buildFallbackPage(componentName, pageId, promptConfig);
                    fs.writeFileSync(path.join(pagesDir, `${componentName}Page.jsx`), fallbackCode);
                    return { pageId, componentName, success: false, fallback: true };
                  }
                  
                  // Wait 1 second before retry
                  await new Promise(r => setTimeout(r, 1000));
                }
              }
            });
            
            const results = await Promise.all(pagePromises);
            const successCount = results.filter(r => r.success).length;
            console.log(`      ✅ ${successCount}/${description.pages.length} pages complete`);
            
            // Generate updated App.jsx with routes to new pages
            const appJsx = buildAppJsx(name, description.pages, promptConfig, sanitizedIndustry);
            fs.writeFileSync(path.join(frontendSrcPath, 'App.jsx'), appJsx);
            console.log('   ✅ App.jsx updated with routes');
console.log(`   ⏱️ Total generation time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
            
            // Ensure theme.css exists
            const themeCssPath = path.join(frontendSrcPath, 'theme.css');
            if (!fs.existsSync(themeCssPath)) {
              const fallbackTheme = buildFallbackThemeCss(promptConfig);
              fs.writeFileSync(themeCssPath, fallbackTheme);
              console.log('   🎨 Created theme.css from industry config');
            }
            
          } else {
            console.log('   ⚠️ No API key - skipping AI page generation');
          }
          
        } catch (pagesErr) {
          console.error('   ⚠️ Page generation error:', pagesErr.message);
        }
      }
      
      // Check if auto-deploy requested
      let deployResult = null;
      if (autoDeploy && deployReady) {
        deployResult = await autoDeployProject(projectPath, name, 'admin@be1st.io');
      }

      responded = true;
      res.json({
        success: true,
        message: 'Project assembled successfully',
        project: {
          name: name,
          path: projectPath,
          manifest: manifest,
          admin: {
            included: true,
            path: path.join(projectPath, 'admin'),
            brainPath: path.join(projectPath, 'brain.json')
          },
          endpoints: {
            frontend: 'http://localhost:5173',
            admin: 'http://localhost:5174',
            api: 'http://localhost:5000',
            brain: 'http://localhost:5000/api/brain',
            health: 'http://localhost:5000/api/health'
          }
        },
        output: output,
        deployment: deployResult,
        duration: Date.now() - startTime
      });
    } else {
      responded = true;
      res.status(500).json({
        success: false,
        error: 'Assembly failed',
        output: output,
        errorOutput: errorOutput,
        duration: Date.now() - startTime
      });
    }
  });
});

// ============================================
// PROMPT BUILDERS - Use JSON Config
// ============================================

// Build context from existing site (REBUILD mode)
function buildRebuildContext(existingSite) {
  if (!existingSite) return '';
  
  let context = `
══════════════════════════════════════════════════════════════
REBUILD MODE - Upgrading existing site
══════════════════════════════════════════════════════════════
`;

  // Business info
  if (existingSite.businessName) {
    context += `EXISTING BUSINESS: ${existingSite.businessName}\n`;
  }
  
  // What they don't like (avoid these patterns)
  if (existingSite.dislikes && existingSite.dislikes.length > 0) {
    const dislikeMap = {
      'outdated': 'AVOID outdated design patterns - make it modern and fresh',
      'slow': 'PRIORITIZE performance - minimal animations, optimized layout',
      'mobile': 'MOBILE-FIRST design - ensure excellent responsive behavior',
      'colors': 'USE NEW COLOR SCHEME - do not replicate their old colors',
      'layout': 'COMPLETELY NEW LAYOUT - restructure the information hierarchy',
      'fonts': 'MODERN TYPOGRAPHY - use clean, professional font pairings',
      'images': 'BETTER IMAGERY - use high-quality Unsplash images',
      'navigation': 'INTUITIVE NAVIGATION - clear, simple menu structure',
      'content': 'IMPROVED COPY - more compelling headlines and CTAs',
      'trust': 'BUILD TRUST - add testimonials, credentials, social proof'
    };
    context += `\nIMPROVEMENTS REQUESTED:\n`;
    existingSite.dislikes.forEach(d => {
      if (dislikeMap[d]) context += `- ${dislikeMap[d]}\n`;
    });
  }
  
  // User notes
  if (existingSite.userNotes) {
    context += `\nUSER NOTES: "${existingSite.userNotes}"\n`;
  }
  
  // Existing content to potentially reuse
  if (existingSite.pageContent) {
    const { headlines, paragraphs, prices } = existingSite.pageContent;
    
    if (headlines && headlines.length > 0) {
      context += `\nEXISTING HEADLINES (rewrite better, keep meaning):\n`;
      headlines.slice(0, 5).forEach(h => {
        context += `- "${h}"\n`;
      });
    }
    
    if (prices && prices.length > 0) {
      context += `\nPRICING TO INCLUDE: ${prices.slice(0, 6).join(', ')}\n`;
    }
  }
  
  // Existing images to reuse - categorized for better placement
  const catImages = existingSite.designSystem?.categorizedImages;
  if (catImages) {
    context += `\n═══ EXISTING IMAGES BY CATEGORY (use these actual URLs) ═══\n`;
    
    if (catImages.logo?.length > 0) {
      context += `\nLOGO (use in header/nav):\n`;
      catImages.logo.slice(0, 2).forEach(img => {
        context += `  ${img.src}\n`;
      });
    }
    
    if (catImages.hero?.length > 0) {
      context += `\nHERO IMAGES (use as hero backgrounds or feature images):\n`;
      catImages.hero.slice(0, 4).forEach(img => {
        context += `  ${img.src}${img.alt ? ` - ${img.alt}` : ''}\n`;
      });
    }
    
    if (catImages.gallery?.length > 0) {
      context += `\nGALLERY IMAGES (use in gallery/portfolio sections):\n`;
      catImages.gallery.slice(0, 6).forEach(img => {
        context += `  ${img.src}\n`;
      });
    }
    
    if (catImages.product?.length > 0) {
      context += `\nPRODUCT/SERVICE IMAGES (use in service cards or product sections):\n`;
      catImages.product.slice(0, 6).forEach(img => {
        context += `  ${img.src}${img.alt ? ` - ${img.alt}` : ''}\n`;
      });
    }
    
    if (catImages.team?.length > 0) {
      context += `\nTEAM PHOTOS (use in about/team sections):\n`;
      catImages.team.slice(0, 4).forEach(img => {
        context += `  ${img.src}${img.alt ? ` - ${img.alt}` : ''}\n`;
      });
    }
    
    if (catImages.background?.length > 0) {
      context += `\nBACKGROUND IMAGES (use as section backgrounds):\n`;
      catImages.background.slice(0, 3).forEach(img => {
        context += `  ${img.src}\n`;
      });
    }
    
    // Fallback to general if no categorized images
    if (catImages.general?.length > 0 && 
        !catImages.hero?.length && !catImages.gallery?.length && !catImages.product?.length) {
      context += `\nGENERAL IMAGES (use where appropriate):\n`;
      catImages.general.slice(0, 6).forEach(img => {
        context += `  ${img.src}${img.alt ? ` - ${img.alt}` : ''}\n`;
      });
    }
    
    context += `\nIMPORTANT: Use these ACTUAL image URLs in your code. Do NOT use placeholder URLs or Unsplash unless no suitable image exists above.\n`;
  } else if (existingSite.designSystem?.images && existingSite.designSystem.images.length > 0) {
    // Fallback for old format
    context += `\nEXISTING IMAGES (use these actual URLs):\n`;
    existingSite.designSystem.images.slice(0, 8).forEach(img => {
      if (img.src && !img.src.includes('data:')) {
        context += `- ${img.src}${img.alt ? ` (${img.alt})` : ''}\n`;
      }
    });
  }
  
  // Reference inspiration sites
  if (existingSite.referenceInspiration && existingSite.referenceInspiration.length > 0) {
    context += `\nINSPIRATION SITES TO BLEND:\n`;
    existingSite.referenceInspiration.forEach(ref => {
      context += `- ${ref.url}\n`;
    });
  }
  
  return context;
}

// Build context from reference sites (INSPIRED mode)
function buildInspiredContext(referenceSites) {
  if (!referenceSites || referenceSites.length === 0) return '';
  
  let context = `
══════════════════════════════════════════════════════════════
INSPIRED MODE - Blend the best of these reference sites
══════════════════════════════════════════════════════════════
`;

  referenceSites.forEach((site, index) => {
    context += `\nREFERENCE ${index + 1}: ${site.url}\n`;
    
    // What they like about this site
    if (site.likes && site.likes.length > 0) {
      const likeMap = {
        'colors': 'COLOR SCHEME',
        'layout': 'LAYOUT STRUCTURE',
        'typography': 'TYPOGRAPHY STYLE',
        'animations': 'ANIMATIONS/TRANSITIONS',
        'hero': 'HERO SECTION DESIGN',
        'navigation': 'NAVIGATION PATTERN',
        'cards': 'CARD COMPONENT DESIGN',
        'spacing': 'WHITESPACE/SPACING',
        'images': 'IMAGE TREATMENT',
        'cta': 'CALL-TO-ACTION DESIGN',
        'footer': 'FOOTER DESIGN',
        'overall': 'OVERALL AESTHETIC'
      };
      context += `  ELEMENTS TO INCORPORATE:\n`;
      site.likes.forEach(like => {
        if (likeMap[like]) context += `    - ${likeMap[like]}\n`;
      });
    }
    
    // Specific notes
    if (site.notes) {
      context += `  SPECIFIC NOTES: "${site.notes}"\n`;
    }
    
    // Analysis data
    if (site.analysis) {
      if (site.analysis.colors) {
        context += `  EXTRACTED COLORS: Primary ${site.analysis.colors.primary}, Accent ${site.analysis.colors.accent}\n`;
      }
      if (site.analysis.style) {
        context += `  DETECTED STYLE: ${site.analysis.style}\n`;
      }
      if (site.analysis.mood) {
        context += `  MOOD: ${site.analysis.mood}\n`;
      }
    }
  });
  
  context += `\nBLEND INSTRUCTIONS: Create a UNIQUE design that incorporates the best elements from each reference while maintaining cohesion. Do NOT copy directly - synthesize into something new.\n`;
  
  return context;
}

// Build context from uploaded assets
function buildUploadedAssetsContext(uploadedAssets, imageDescription) {
  if (!uploadedAssets && !imageDescription) return '';
  
  let context = '';
  
  // Logo
  if (uploadedAssets?.logo) {
    const logoExt = uploadedAssets.logo.type?.split('/')[1] || 'png';
    context += `
══════════════════════════════════════════════════════════════
UPLOADED LOGO - USE THIS EXACT PATH
══════════════════════════════════════════════════════════════
The user has uploaded their logo. Use these extracted brand colors throughout the design.
Logo filename: ${uploadedAssets.logo.file}

CRITICAL: In the header/nav, use this EXACT image tag:
<img src="/uploads/logo.${logoExt}" alt="Logo" style={{ height: '40px' }} />

DO NOT use placeholder text or broken image references.
The logo file exists at: /uploads/logo.${logoExt}
`;
  }
  
  // Product/Gallery Photos
  if (uploadedAssets?.photos && uploadedAssets.photos.length > 0) {
    context += `
══════════════════════════════════════════════════════════════
UPLOADED PRODUCT/GALLERY PHOTOS (${uploadedAssets.photos.length} photos)
══════════════════════════════════════════════════════════════
The user has uploaded ${uploadedAssets.photos.length} photos of their products/work.
Photo files: ${uploadedAssets.photos.map(p => p.file).join(', ')}

CRITICAL: For gallery sections, product showcases, and hero backgrounds:
- Reference these as "uploaded photos" - the system will inject them
- Create image galleries that showcase these photos
- Use them in hero sections, about pages, and service showcases
- DO NOT use generic Unsplash URLs - use the uploaded photos instead
`;
  }
  
  // Menu/Pricing
  if (uploadedAssets?.menu) {
    let menuText = '';
    if (uploadedAssets.menu.extractedText) {
      menuText = uploadedAssets.menu.extractedText;
    }
    
    context += `
══════════════════════════════════════════════════════════════
UPLOADED MENU / PRICE LIST - USE THIS ACTUAL DATA
══════════════════════════════════════════════════════════════
The user has uploaded their menu or price list.
File: ${uploadedAssets.menu.file} (${uploadedAssets.menu.type.includes('pdf') ? 'PDF' : 'Image'})

${menuText ? `EXTRACTED MENU CONTENT (use these REAL items and prices):
${menuText.substring(0, 3000)}
` : ''}
CRITICAL: Use the actual menu items and prices shown above in your menu/pricing sections.
DO NOT make up menu items - use ONLY what's in the extracted content above.
If no items were extracted, create placeholder sections that say "Menu coming soon" or similar.
`;
  }
  
  // Image style description
  if (imageDescription && imageDescription.trim()) {
    context += `
══════════════════════════════════════════════════════════════
USER'S VISUAL STYLE PREFERENCES
══════════════════════════════════════════════════════════════
"${imageDescription.trim()}"

Apply this visual style throughout all pages - backgrounds, image treatments, overall mood.
`;
  }
  
  return context;
}

function buildFreshModePrompt(pageId, pageName, otherPages, description, promptConfig) {
  const cfg = promptConfig || {};
  const industry = cfg.industry || {};
  const colors = cfg.colors || { primary: '#6366f1', accent: '#06b6d4', text: '#1a1a2e', textMuted: '#64748b', background: '#ffffff' };
  const typography = cfg.typography || { heading: "'Inter', sans-serif", body: "system-ui, sans-serif" };
  
  // SELECT A RANDOM ARCHETYPE FOR VARIETY
  const archetypeKeys = Object.keys(VISUAL_ARCHETYPES);
  const selectedArchetype = VISUAL_ARCHETYPES[Math.floor(Math.random() * archetypeKeys.length)];

  // DYNAMIC SPACING BASED ON VIBE
  const isLuxury = industry.vibe?.toLowerCase().includes('luxury') || industry.vibe?.toLowerCase().includes('clean');
  const sectionPadding = isLuxury ? '140px' : '80px';
  
  // EXTRACT EXISTING SITE DATA (REBUILD MODE)
  const existingSite = description.existingSite || null;
  const rebuildContext = existingSite ? buildRebuildContext(existingSite) : '';
  
  // EXTRACT REFERENCE SITES DATA (INSPIRED MODE)
  const referenceSites = description.referenceSites || [];
  const inspiredContext = referenceSites.length > 0 ? buildInspiredContext(referenceSites) : '';
  
  // EXTRACT UPLOADED ASSETS
  const uploadedAssets = description.uploadedAssets || null;
  const imageDescription = description.imageDescription || '';
  const assetsContext = buildUploadedAssetsContext(uploadedAssets, imageDescription);
  
  // EXTRACT EXTRA DETAILS FROM USER
  const extraDetails = description.extraDetails || '';
  const extraDetailsContext = extraDetails.trim() ? `
══════════════════════════════════════════════════════════════
CUSTOM REQUIREMENTS FROM USER:
══════════════════════════════════════════════════════════════
${extraDetails}

IMPORTANT: Apply these custom requirements throughout the page design.
Replace any standard elements with the user's specified alternatives.
══════════════════════════════════════════════════════════════
` : '';

  // EXTRACT INDUSTRY LAYOUT CONFIG
  const industryLayoutKey = description.industryKey || null;
  const selectedLayoutKey = description.layoutKey || null;
  const layoutContext = industryLayoutKey ? buildLayoutContext(industryLayoutKey, selectedLayoutKey) : '';

  return `You are a high-end UI/UX Architect. Create a stunning, unique ${pageId} page.

BUSINESS: ${description.text || 'A professional business'}
INDUSTRY: ${industry.name || 'Business'}
VIBE: ${industry.vibe || 'Unique and modern'}
${rebuildContext}${inspiredContext}${assetsContext}${extraDetailsContext}${layoutContext}
══════════════════════════════════════════════════════════════
CORE VISUAL ARCHETYPE: ${selectedArchetype}
══════════════════════════════════════════════════════════════

DESIGN SYSTEM:
const THEME = {
  colors: { 
    primary: '${colors.primary}', 
    accent: '${colors.accent}', 
    background: '${colors.background}', 
    text: '${colors.text}', 
    surface: '${colors.surface || '#f8fafc'}' 
  },
  fonts: { heading: "${typography.heading}", body: "${typography.body}" },
  spacing: { sectionPadding: '${sectionPadding}' }
};

CRITICAL HERO TEXT RULES:
- If hero has dark/gradient background: text MUST be white (#ffffff) with textShadow: '0 2px 4px rgba(0,0,0,0.3)'
- If hero has light background: text MUST be dark (${colors.text})
- NEVER use low-contrast text colors on heroes

${getIndustryDesignGuidance(industry.name)}

PAGE REQUIREMENTS:
${getPageRequirements(pageId)}

══════════════════════════════════════════════════════════════
EFFECTS LIBRARY - ADD POLISH WITH THESE COMPONENTS
══════════════════════════════════════════════════════════════
Import from '../effects' and use these to make pages feel premium:

import { ScrollReveal, AnimatedCounter, StaggeredList, ParallaxSection, TiltCard, GlowEffect } from '../effects';

AVAILABLE EFFECTS:
- <ScrollReveal> - Wrap sections to fade-in on scroll
- <AnimatedCounter end={500} suffix="+" duration={2000} /> - Animate numbers counting up
- <StaggeredList items={array} renderItem={(item) => <Card />} /> - Stagger children animations
- <ParallaxSection imageSrc="url" height="60vh"> - Parallax background sections
- <TiltCard> - 3D tilt effect on hover for cards
- <GlowEffect color="#22c55e"> - Glowing border on hover

REQUIRED USAGE:
- Home pages: Use AnimatedCounter for ALL statistics (years, customers, etc.)
- Home pages: Wrap at least 2 sections with <ScrollReveal>
- Service/Menu pages: Use ScrollReveal on the cards grid
- About pages: AnimatedCounter for company stats

EXAMPLE:
<ScrollReveal>
  <section style={styles.stats}>
    <AnimatedCounter end={14} suffix=" Years" duration={2000} />
    <AnimatedCounter end={5000} suffix="+ Customers" duration={2500} />
  </section>
</ScrollReveal>

TECHNICAL RULES (MUST FOLLOW):
1. Use inline styles ONLY: style={{ }} - NO className or Tailwind.

   CRITICAL STYLE SYNTAX - FOLLOW EXACTLY:
   ✅ CORRECT: opacity: 0.7 (number, no quotes)
   ✅ CORRECT: fontSize: 16 (number, no quotes)
   ✅ CORRECT: fontSize: '16px' (string WITH quotes on BOTH sides)
   ✅ CORRECT: color: '#ffffff' (string WITH quotes on BOTH sides)
   ✅ CORRECT: padding: '20px 40px' (string WITH quotes on BOTH sides)

   ❌ WRONG: opacity: 0.7' (trailing quote with no opening quote)
   ❌ WRONG: fontSize: 16' (trailing quote on a number)
   ❌ WRONG: color: #ffffff (missing quotes around hex color)
   ❌ WRONG: padding: 20px 40px (missing quotes around CSS value)

   Rule: Numbers without units = no quotes. Anything with units or special chars = quotes on BOTH sides.

2. Use Lucide icons: import { IconName } from 'lucide-react'.
   VALID ICONS (use ONLY these): ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Check, X, Menu,
   ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Plus, Minus, Search, Filter,
   Star, Heart, Mail, Phone, MapPin, Clock, Calendar, User, Users, Settings,
   Home, Building, Briefcase, Shield, Award, Target, Zap, Sparkles, Crown,
   DollarSign, CreditCard, ShoppingCart, Package, Truck, Gift, Tag, Percent,
   Eye, EyeOff, Lock, Unlock, Key, Bell, MessageSquare, Send, Share, Download, Upload,
   Image, Camera, Play, Pause, Volume, VolumeX, Mic, Video, Music, File, FileText, Folder,
   Link, ExternalLink, Globe, Wifi, Database, Server, Code, Terminal, Cpu,
   Sun, Moon, Cloud, Thermometer, Droplet, Wind, Umbrella,
   Car, Plane, Ship, Train, Bike, MapPinned, Navigation, Compass,
   Utensils, Coffee, Wine, Pizza, Cake, Apple,
   Stethoscope, Activity, Pill, Syringe, Bone, Brain,
   GraduationCap, BookOpen, Pencil, Ruler, Calculator,
   Wrench, Hammer, Scissors, Paintbrush, Palette,
   Dog, Cat, Bird, Fish, Bug, Leaf, Flower, Tree,
   Facebook, Twitter, Instagram, Linkedin, Youtube, Github,
   AlertCircle, AlertTriangle, Info, HelpCircle, CheckCircle, XCircle,
   RefreshCw, RotateCw, Loader, MoreHorizontal, MoreVertical, Grip,
   Copy, Clipboard, Save, Trash, Edit, Edit2, Maximize, Minimize,
   LogIn, LogOut, UserPlus, UserMinus, UserCheck, Smile, Frown, Meh,
   ThumbsUp, ThumbsDown, Flag, Bookmark, Archive, Inbox, Layers,
   Layout, Grid, List, Table, BarChart, BarChart2, BarChart3, PieChart, LineChart, TrendingUp, TrendingDown,
   Quote, Hash, AtSign, Percent, Receipt, Wallet, Banknote, Coins,
   Headphones, Speaker, Radio, Tv, Monitor, Smartphone, Tablet, Watch, Printer,
   Power, Battery, BatteryCharging, Plug, Lightbulb, Flashlight, Flame,
   Anchor, Rocket, Award, Medal, Trophy, Crown, Gem, Diamond
   DO NOT use icons not in this list. If you need "Handshake", use "Users" or "Link" instead.
3. NAVIGATION: Use <Link to="/path"> from react-router-dom.
4. NO nav/footer - those are provided by App.jsx.
5. WHITESPACE: Use THEME.spacing.sectionPadding for top/bottom margins.
6. INNOVATION: Do not use standard vertical blocks. Experiment with the ARCHETYPE provided above.
7. APP PAGES: For dashboard/earn/rewards/wallet/profile/leaderboard pages, these are FUNCTIONAL APP PAGES not marketing pages. Build them with useState hooks, mock data arrays, and interactive elements. Create the full UI inline - do not import from ../modules/.
8. MOBILE-FIRST: Design for mobile screens FIRST (375px width). Use these patterns:
   - Single column layouts by default
   - Large touch targets (min 44px height for buttons)
   - Bottom navigation bar for app pages (fixed position)
   - Cards should be full-width on mobile with 16px padding
   - Font sizes: 16px minimum for body text (prevents zoom on iOS)
   - Use flexDirection: 'column' as default, switch to 'row' only with @media or window.innerWidth checks
   - Sticky headers with blur backdrop for app pages
   - Pull-to-refresh patterns where appropriate

Return ONLY valid JSX code.
Start with: import React from 'react';
End with: export default ${pageName}Page;`;
}

function getIndustryDesignGuidance(industryName) {
  const guidance = {
    'Law Firm': `
STYLE: Sophisticated, authoritative, trustworthy
HERO: Clean, minimal. White or light background preferred. No busy images.
TYPOGRAPHY: Serif headings (Georgia, Times). Thin weights. Large sizes (48-64px).
COLORS: Dark navy/charcoal primary. Gold/bronze accent. Lots of white space.
IMAGERY: Abstract patterns, city skylines, or no images. Never stock photos of "lawyers".
LAYOUT PATTERNS: Asymmetric grids, editorial layouts, generous margins.
SECTIONS: Practice areas with icons, attorney credentials, case results stats, testimonials.`,

    'Restaurant / Food Service': `
STYLE: Warm, inviting, sensory, appetizing
HERO: Full-bleed food photography or atmospheric restaurant shots. Dark overlays work well.
TYPOGRAPHY: Mix of serif (menu feel) and clean sans-serif. Can be more decorative.
COLORS: Warm tones - burgundy, gold, cream, forest green. Earthy palettes.
IMAGERY: High-quality food photos, interior shots, chef at work. Real Unsplash food images.
LAYOUT PATTERNS: Magazine-style, image-heavy, overlapping elements.
SECTIONS: Featured dishes, chef story, ambiance gallery, reservation CTA, location/hours.`,

    'SaaS / B2B Platform': `
STYLE: Modern, clean, innovative, trustworthy
HERO: Split layout (text + product screenshot) OR gradient background with floating UI elements.
TYPOGRAPHY: Clean sans-serif (Inter, SF Pro). Bold headlines, readable body.
COLORS: Purple/blue gradients popular. High contrast. Dark mode friendly.
IMAGERY: Product screenshots, dashboard mockups, abstract 3D shapes, isometric illustrations.
LAYOUT PATTERNS: Bento grids, feature cards, comparison tables, social proof strips.
SECTIONS: Logo cloud, feature grid, how-it-works steps, pricing cards, testimonials, integration logos.`,

    'Healthcare / Medical': `
STYLE: Clean, calming, professional, trustworthy
HERO: Soft, approachable. Light backgrounds. Minimal imagery or abstract health visuals.
TYPOGRAPHY: Clean, highly readable. Sans-serif preferred. Accessible sizes.
COLORS: Calming blues, teals, soft greens. White/light backgrounds. Avoid harsh contrasts.
IMAGERY: Abstract medical, caring professionals (tasteful), nature/wellness imagery.
LAYOUT PATTERNS: Card-based, clear information hierarchy, easy navigation cues.
SECTIONS: Services/specialties, provider profiles, patient resources, appointment booking, insurance info.`,

    'E-Commerce / Retail': `
STYLE: Dynamic, visual, conversion-focused
HERO: Product-focused. Large product images or lifestyle shots. Clear CTA.
TYPOGRAPHY: Bold, attention-grabbing headlines. Clean body text.
COLORS: Brand-dependent but high contrast CTAs. Sale/promo colors (red, orange).
IMAGERY: Product photography, lifestyle shots, user-generated content style.
LAYOUT PATTERNS: Grid-heavy, card-based products, sticky CTAs, urgency elements.
SECTIONS: Featured products, categories, bestsellers, reviews, trust badges, newsletter signup.`,

    'default': `
STYLE: Professional, modern, trustworthy
HERO: Clear value proposition, prominent CTA, relevant imagery
TYPOGRAPHY: Clean sans-serif, clear hierarchy
COLORS: Use the provided theme colors consistently
IMAGERY: High-quality, relevant Unsplash images
LAYOUT PATTERNS: Standard sections with clear visual breaks
SECTIONS: Hero, features/services, about snippet, testimonials, CTA`
  };

  return guidance[industryName] || guidance['default'];
}

function getPageRequirements(pageId) {
  const requirements = {
    home: `
- Create a Hero that feels unique to the ARCHETYPE (not just a background image).
- Include 3-4 sections that showcase the business value.
- Mix up the order: Consider starting with a "Stat Strip" or "Featured Work" before the features.
- Ensure a clear CTA at the end.`,
    
    about: `
- Tell the story using the ARCHETYPE layout.
- Include a "Values" section that doesn't use standard cards (try a list or large text blocks).
- Highlight the mission with a massive pull-quote.`,

    services: `
- Show 3-6 offerings. 
- If Bento archetype: Use different box sizes for different service tiers.
- If Editorial archetype: Use large images for each service with minimal text.`,

    contact: `
- Split layout: Contact form + Business details.
- Use Lucide icons for phone, email, and address.
- Minimal, high-contrast inputs.`,

    dashboard: `
APP PAGE - User Dashboard (Mobile-first, works great on desktop too)
- Top section: Large balance display with current earnings (centered, bold)
- Stats row: 3 stat cards in a row (use flexWrap: 'wrap' so they stack on mobile)
- Quick actions: Big tap-friendly buttons linking to /earn, /rewards, /wallet
- Recent activity feed showing last 5 transactions in a clean list
- Use Card components with shadows, rounded corners (borderRadius: 16px)
- All buttons minimum 48px height for touch targets
- Max-width 600px centered on desktop, full-width on mobile`,

    earn: `
APP PAGE - Earn/Surveys Page (Mobile-first, works great on desktop too)
- Header: "Earn Money" with horizontal scrolling filter tabs (All, Surveys, Tasks, Offers)
- Survey cards: Full-width cards with padding 16px, borderRadius 12px, subtle shadow
- Each card shows: provider logo (40px), title, reward in GREEN bold ($0.50), time estimate
- Cards are tappable (cursor: pointer, hover/active states)
- Use flexWrap: 'wrap' for desktop to show 2 cards per row, single column on mobile
- Max-width 800px centered on desktop
- Sticky header with blur effect (backdropFilter: 'blur(10px)')
- Empty state with friendly illustration if no surveys`,

    rewards: `
APP PAGE - Rewards/Spin Page (Mobile-first, works great on desktop too)
- Hero section: Daily spin wheel centered, max-width 320px (build a colorful wheel with CSS transforms)
- Big "SPIN NOW" button below wheel (green, 56px height, full-width max 300px)
- Countdown timer if spin not available ("Next spin in 4:32:15")
- Streak bonus display: "🔥 5-day streak! 2x multiplier active"
- Recent winners: horizontal scroll of small winner cards showing avatar + amount won
- Achievements grid at bottom: 3 columns of badge icons with labels
- Max-width 500px centered on desktop, full-width with 16px padding on mobile`,

    wallet: `
APP PAGE - Wallet/Cashout Page (Mobile-first, works great on desktop too)
- Balance hero: Large centered balance "$24.50" (48px font, bold, green)
- Subtitle: "Available to cash out" with progress bar to next threshold
- Cashout buttons: 3 large tap-friendly cards (PayPal, Gift Cards, Bank)
- Each cashout card: icon (32px), name, minimum amount, "2-3 days" processing time
- Cards use flexWrap so 3 columns on desktop, stacked on mobile
- Transaction history: Clean list with date, description, +$0.50 green or -$10.00 for cashouts
- Section headers: "Cash Out", "History" with subtle dividers
- Max-width 600px centered on desktop`,

    profile: `
APP PAGE - User Profile (Mobile-first, works great on desktop too)
- Profile header: Centered avatar (80px circle), username below, "Member since Jan 2024"
- Stats row: 3 cards showing Total Earned ($142.50), Surveys (89), Level (12)
- Referral section: "Invite Friends" card with referral code, big "Copy" button, "Earn $1 per friend"
- Settings list: Clean rows with ChevronRight icons (Notifications, Payment Methods, Help, Log Out)
- Each settings row: 48px height, border-bottom, tappable
- Achievement badges: Horizontal scroll of earned badges with labels
- Max-width 500px centered on desktop`,

    leaderboard: `
APP PAGE - Leaderboard (Mobile-first, works great on desktop too)
- Sticky header with filter tabs: Today, This Week, This Month, All Time (horizontal scroll)
- Top 3 podium: Special section with gold/silver/bronze styling, larger avatars, crown icon for #1
- Ranked list below: Each row shows rank #, avatar (36px), username, earnings in green
- Rows are 60px height with subtle border-bottom
- Current user row: Highlighted with accent background color, "YOU" badge
- Sticky bottom card: "Your Rank: #47" always visible when scrolling
- Max-width 500px centered on desktop
- Use alternating subtle background colors for rows`
  };

  return requirements[pageId] || `Create a unique ${pageId} page layout using the assigned archetype.`;
}

function buildEnhanceModePrompt(pageId, pageName, existingSiteData, promptConfig) {
  const colors = existingSiteData?.designSystem?.colors || [];
  const fonts = existingSiteData?.designSystem?.fonts || [];
  
  return `ENHANCE MODE: Recreate the ${pageId} page for ${existingSiteData?.businessName || 'Business'} with a MORE PREMIUM look while keeping their brand.

THEIR BRAND (USE THESE EXACT VALUES):
- Primary Color: ${colors[0] || '#3e3e3e'}
- Accent Color: ${colors[1] || '#ff0e36'}
- Font: ${fonts[0]?.split('%')[0] || 'Oswald'}, sans-serif
- Prices: ${existingSiteData?.pageContent?.prices?.join(', ') || 'N/A'}

THEIR IMAGES (USE THESE ACTUAL URLs):
${existingSiteData?.designSystem?.images?.slice(0, 6).map(i => i.src).join('\n') || 'No images extracted'}

THEIR HEADLINES (USE THESE):
${existingSiteData?.pageContent?.headlines?.slice(0, 6).join(' | ') || 'Business Headline'}

RULES:
- Inline styles (style={{ }}) - NO Tailwind
- Lucide React icons - NO emojis
- NO header/footer - App.jsx handles those
- <Link> from react-router-dom
- USE their image URLs in img tags

CRITICAL STYLE SYNTAX:
✅ opacity: 0.7 (number, no quotes)
✅ fontSize: '16px' (string with quotes BOTH sides)
❌ NEVER: opacity: 0.7' (trailing quote without opening)
Rule: Numbers alone = no quotes. Values with units = quotes on BOTH sides.

${getEnhancePageInstructions(pageId, existingSiteData)}

IMPROVEMENTS: 80px+ section padding, 48-64px headlines, shadows, hover effects.

Return ONLY valid JSX starting with imports, ending with export default ${pageName}Page.`;
}

function getPageSpecificInstructions(pageId, colors, layout) {
  const heroHeight = layout.heroHeight || '70vh';
  const primary = colors.primary || '#0a1628';
  const accent = colors.accent || '#c9a962';
  
  const instructions = {
    home: `
HOME PAGE REQUIREMENTS:
- HERO (${heroHeight}): Dark background (${primary}) with image overlay
  backgroundImage: 'linear-gradient(rgba(10, 22, 40, 0.85), rgba(10, 22, 40, 0.95)), url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920")'
  backgroundSize: 'cover', backgroundPosition: 'center'
- Accent line (width 60px, height 3px, background: ${accent}) above headline
- Main headline: large, font-weight 300
- Subheadline: 18-20px, opacity 0.9
- Two buttons: Filled primary CTA, outlined secondary
- INTRO SECTION: White/light background, value proposition, max-width 800px
- FEATURES: 3-4 cards with accent-colored Lucide icons
- TESTIMONIAL: Single quote with large Quote icon, italic text
- CTA SECTION: Dark background, compelling headline, accent button`,
    
    about: `
ABOUT PAGE REQUIREMENTS:
- HERO (50vh): Solid dark background (${primary}), centered content
- Small label "OUR STORY" uppercase, letter-spacing 3px, accent color (${accent})
- Company name large (48px)
- Stats row: three numbers (500+, 15+, 1000+) with labels below
- STORY SECTION: Light bg, two columns - text left, pull quote right
- VALUES: 4 cards with icons (Shield, Target, Users, Award)
- CREDENTIALS: Subtle section with certifications
- CTA at bottom`,
    
    services: `
SERVICES PAGE REQUIREMENTS:
- HERO (40vh): Gradient background, centered text
- Simple headline, brief tagline, NO buttons in hero
- SERVICE CARDS: Numbered (01, 02, 03, 04), accent-colored numbers
- Each card: title, description, bullet points with Check icons
- PROCESS SECTION: 4-step visual flow
- CTA: Accent button to contact`,
    
    contact: `
CONTACT PAGE REQUIREMENTS:
- HERO (30vh): Dark background, "GET IN TOUCH" label, simple headline
- Split layout below: Form (60%) left, Info (40%) right
- Form: First name, Last name, Email, Phone, Company, Message
- Clean inputs: subtle borders, accent focus state, accent submit button
- Info card: MapPin, Phone, Mail, Clock icons with details
- Business hours displayed`,
    
    pricing: `
PRICING PAGE REQUIREMENTS:
- HERO (35vh): Dark background, "PRICING" label
- Pricing cards: featured tier with accent border
- Check icons for features in accent color
- Clear pricing, CTA buttons
- FAQ section below if space`,
    
    faq: `
FAQ PAGE REQUIREMENTS:
- HERO (25vh): Light gray background, dark text
- Simple "Frequently Asked Questions" headline
- Accordion items with Plus/Minus icons (useState for expand/collapse)
- 8-10 relevant questions with detailed answers
- Accent color on expanded item border
- CTA at bottom for additional questions`,
    
    testimonials: `
TESTIMONIALS PAGE REQUIREMENTS:
- HERO (30vh): Dark background, "CLIENT SUCCESS" label
- Large testimonial cards with Quote icon
- Client initials in accent circle, name, title
- 4-6 testimonials in grid
- Stats section with success metrics`,
    
    team: `
TEAM PAGE REQUIREMENTS:
- HERO (40vh): Dark background, "OUR TEAM" label
- Team cards: initials in circle, name, title in accent
- 3-4 team members with short bios
- Credentials below each`,
    
    booking: `
BOOKING PAGE REQUIREMENTS:
- HERO (30vh): Dark background, "SCHEDULE" label
- Booking form with service selection, date preference
- Contact fields
- Right side: what to expect, benefits
- Accent submit button`
  };
  
  return instructions[pageId] || `
${pageId.toUpperCase()} PAGE:
- HERO (40vh): Appropriate for this page type
- Clear headline and description
- Relevant content sections
- CTA where appropriate`;
}

function getEnhancePageInstructions(pageId, existingSiteData) {
  // Simplified enhance instructions
  const images = existingSiteData?.designSystem?.images || [];
  
  if (pageId === 'home') {
    return `HOME PAGE - Create stunning hero with their product images, feature cards, testimonials, CTA sections.
Use their actual product images: ${images.slice(0, 8).map(i => i.src).join(', ') || 'none found'}`;
  }
  
  return `${pageId.toUpperCase()} PAGE - Create appropriate sections with their branding.`;
}

function buildFallbackPage(componentName, pageId, promptConfig) {
  const colors = promptConfig?.colors || { primary: '#0a1628', text: '#1a1a2e', textMuted: '#4a5568' };
  const typography = promptConfig?.typography || { heading: 'Georgia, serif' };
  const displayName = toNavLabel(pageId);
  
  return `import React from 'react';
import { Link } from 'react-router-dom';

const ${componentName}Page = () => {
  return (
    <div style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '36px', color: '${colors.primary}', fontFamily: "${typography.heading}", marginBottom: '20px' }}>${displayName}</h1>
      <p style={{ color: '${colors.textMuted}', fontSize: '18px', lineHeight: 1.7 }}>Welcome to the ${displayName} page.</p>
    </div>
  );
};

export default ${componentName}Page;`;
}

function buildAppJsx(name, pages, promptConfig, industry) {
  const colors = promptConfig?.colors || { primary: '#0a1628', text: '#1a1a2e', textMuted: '#4a5568' };
  const typography = promptConfig?.typography || { heading: "Georgia, 'Times New Roman', serif" };
  
  // Industries that require authentication
  const authRequiredIndustries = ['survey-rewards', 'saas', 'ecommerce', 'collectibles', 'healthcare', 'family'];
  const needsAuth = authRequiredIndustries.includes(industry);
  
  // Pages that require authentication (protected routes)
  const protectedPages = ['dashboard', 'earn', 'rewards', 'wallet', 'profile', 'settings', 'account'];
  
  const routeImports = pages.map(p => {
    const componentName = toComponentName(p) + 'Page';
    return `import ${componentName} from './pages/${componentName}';`;
  }).join('\n');
  
  const routeElements = pages.map(p => {
    const componentName = toComponentName(p) + 'Page';
    const routePath = p === 'home' ? '/' : `/${p}`;
    const isProtected = needsAuth && protectedPages.includes(p);
    
    if (isProtected) {
      return `              <Route path="${routePath}" element={<ProtectedRoute><${componentName} /></ProtectedRoute>} />`;
    }
    return `              <Route path="${routePath}" element={<${componentName} />} />`;
  }).join('\n');
  
  // Filter out login/register from nav links
  const navPages = pages.filter(p => !['login', 'register'].includes(p));
  const navLinks = navPages.map(p => {
    const label = toNavLabel(p);
    const navPath = p === 'home' ? '/' : `/${p}`;
    return `            <Link to="${navPath}" style={styles.navLink}>${label}</Link>`;
  }).join('\n');
  
  // Auth imports and components
  const authImports = needsAuth ? `
// Auth components
import { AuthProvider } from './modules/auth-pages/components/AuthProvider';
import { ProtectedRoute } from './modules/auth-pages/components/ProtectedRoute';
import { LoginPage } from './modules/auth-pages/components/LoginPage';
import { RegisterPage } from './modules/auth-pages/components/RegisterPage';
import { useAuth } from './modules/auth-pages/components/AuthProvider';` : '';

  const authRoutes = needsAuth ? `
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />` : '';

  const authNavButtons = needsAuth ? `
            <AuthButtons />` : '';

  const authButtonsComponent = needsAuth ? `
// Auth navigation buttons
function AuthButtons() {
  const { user, logout } = useAuth();
  
  if (user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ color: '${colors.textMuted}', fontSize: '14px' }}>
          {user.fullName || user.email}
        </span>
        <button onClick={logout} style={styles.logoutButton}>
          Logout
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <Link to="/login" style={styles.loginButton}>Login</Link>
      <Link to="/register" style={styles.registerButton}>Sign Up</Link>
    </div>
  );
}
` : '';

  const authStyles = needsAuth ? `
  loginButton: {
    color: '${colors.textMuted}',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  registerButton: {
    background: '#22c55e',
    color: '#000000',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  logoutButton: {
    background: 'transparent',
    color: '${colors.textMuted}',
    border: '1px solid #333',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },` : '';

  const appWrapper = needsAuth ? ['<AuthProvider>', '</AuthProvider>'] : ['', ''];

  return `/**
 * ${name} - Frontend App
 * Auto-generated by Module Library Assembler with AI
 */
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import './theme.css';
// Page imports
${routeImports}
${authImports}
${authButtonsComponent}
// Mobile menu wrapper component
function NavWrapper({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <>
      <nav style={styles.nav}>
        <Link to="/" style={styles.navBrand}>
          <span style={styles.brandText}>${name.replace(/-/g, ' ').replace(/\s+/g, ' ').trim()}</span>
        </Link>
        
        {isMobile ? (
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            style={styles.hamburger}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        ) : (
          <>
            <div style={styles.navLinks}>
${navLinks}
            </div>
            <div style={styles.navAuth}>
${authNavButtons}
            </div>
          </>
        )}
      </nav>
      
      {isMobile && menuOpen && (
        <div style={styles.mobileMenuOverlay} onClick={() => setMenuOpen(false)}>
          <div style={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
${navLinks.split('\n').map(link => link.replace('styles.navLink', 'styles.mobileNavLink')).join('\n')}
            <div style={styles.mobileAuthButtons}>
${authNavButtons}
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

function App() {
  return (
    ${appWrapper[0]}
    <BrowserRouter>
      <div style={styles.app}>
        <NavWrapper>
          {/* Main Content */}
          <main style={styles.main}>
            <Routes>
${routeElements}${authRoutes}
            </Routes>
          </main>
          {/* Footer */}
          <footer style={styles.footer}>
            <p>© ${new Date().getFullYear()} ${name}. All rights reserved.</p>
          </footer>
        </NavWrapper>
      </div>
    </BrowserRouter>
    ${appWrapper[1]}
  );
}
const styles = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#ffffff',
    color: '${colors.text}',
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: '#ffffff',
    borderBottom: '1px solid rgba(10, 22, 40, 0.1)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1000,
    boxSizing: 'border-box',
  },
  navBrand: {
    textDecoration: 'none',
  },
  brandText: {
    fontSize: '20px',
    fontWeight: '400',
    fontFamily: "${typography.heading}",
    color: '${colors.primary}',
    letterSpacing: '1px',
    textTransform: 'none',
  },
  navLinks: {
    display: 'flex',
    gap: '32px',
  },
  navAuth: {
    display: 'flex',
    alignItems: 'center',
  },
  navLink: {
    color: '${colors.textMuted}',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    transition: 'color 0.2s',
  },
  hamburger: {
    background: 'none',
    border: 'none',
    color: '${colors.text}',
    cursor: 'pointer',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '48px',
    minHeight: '48px',
    marginRight: '-12px',
  },
  mobileMenuOverlay: {
    position: 'fixed',
    top: '60px',
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  mobileMenu: {
    position: 'fixed',
    top: '60px',
    left: 0,
    right: 0,
    background: '#ffffff',
    borderBottom: '1px solid rgba(10, 22, 40, 0.1)',
    padding: '16px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: 999,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    maxHeight: 'calc(100vh - 60px)',
    overflowY: 'auto',
  },
  mobileNavLink: {
    color: '${colors.text}',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    padding: '16px 0',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    display: 'block',
    minHeight: '48px',
    lineHeight: '16px',
  },
  mobileAuthButtons: {
    paddingTop: '16px',
    borderTop: '1px solid rgba(0,0,0,0.1)',
  },${authStyles}
  main: {
    flex: 1,
    paddingTop: '60px',
  },
  footer: {
    padding: '40px 48px',
    background: '${colors.primary}',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    letterSpacing: '1px',
  },
};
export default App;
`;
}

// ============================================
// VALID LUCIDE ICONS - Whitelist for validation
// ============================================
const VALID_LUCIDE_ICONS = [
  'Activity', 'Airplay', 'AlertCircle', 'AlertTriangle', 'AlignCenter', 'AlignJustify', 'AlignLeft', 'AlignRight',
  'Anchor', 'Aperture', 'Archive', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowUpRight', 'ArrowDownRight',
  'Award', 'BarChart', 'BarChart2', 'Battery', 'BatteryCharging', 'Bell', 'BellOff', 'Bluetooth', 'Bold', 'Book',
  'BookOpen', 'Bookmark', 'Box', 'Briefcase', 'Building', 'Building2', 'Calendar', 'Camera', 'CameraOff',
  'Car', 'Check', 'CheckCircle', 'CheckCircle2', 'CheckSquare', 'ChevronDown', 'ChevronLeft', 'ChevronRight',
  'ChevronUp', 'ChevronsDown', 'ChevronsLeft', 'ChevronsRight', 'ChevronsUp', 'Chrome', 'Circle', 'Clipboard',
  'Clock', 'Cloud', 'CloudOff', 'Code', 'Coffee', 'Cog', 'Compass', 'Copy', 'CornerDownLeft', 'CornerDownRight',
  'CreditCard', 'Crop', 'Crosshair', 'Database', 'Delete', 'Disc', 'DollarSign', 'Download', 'Droplet', 'Edit',
  'Edit2', 'Edit3', 'ExternalLink', 'Eye', 'EyeOff', 'Facebook', 'FastForward', 'Feather', 'File', 'FileText',
  'Film', 'Filter', 'Flag', 'Folder', 'FolderOpen', 'Gift', 'GitBranch', 'GitCommit', 'GitMerge', 'Github',
  'Globe', 'Globe2', 'Grid', 'GripVertical', 'Hash', 'Headphones', 'Heart', 'HelpCircle', 'Home', 'Image',
  'Inbox', 'Info', 'Instagram', 'Italic', 'Key', 'Layers', 'Layout', 'LifeBuoy', 'Link', 'Link2', 'Linkedin',
  'List', 'Loader', 'Lock', 'LogIn', 'LogOut', 'Mail', 'Map', 'MapPin', 'Maximize', 'Maximize2', 'Menu',
  'MessageCircle', 'MessageSquare', 'Mic', 'MicOff', 'Minimize', 'Minimize2', 'Minus', 'MinusCircle', 'Monitor',
  'Moon', 'MoreHorizontal', 'MoreVertical', 'Mountain', 'Move', 'Music', 'Navigation', 'Navigation2', 'Octagon',
  'Package', 'Paperclip', 'Pause', 'PauseCircle', 'Pen', 'Percent', 'Phone', 'PhoneCall', 'PhoneIncoming',
  'PhoneOutgoing', 'PieChart', 'Pin', 'Play', 'PlayCircle', 'Plus', 'PlusCircle', 'PlusSquare', 'Pocket',
  'Power', 'Printer', 'Quote', 'Radio', 'RefreshCw', 'Repeat', 'Rewind', 'RotateCcw', 'RotateCw', 'Rss',
  'Save', 'Scissors', 'Search', 'Send', 'Server', 'Settings', 'Settings2', 'Share', 'Share2', 'Shield',
  'ShieldCheck', 'ShoppingBag', 'ShoppingCart', 'Shuffle', 'Sidebar', 'SkipBack', 'SkipForward', 'Slack',
  'Slash', 'Sliders', 'Smartphone', 'Smile', 'Speaker', 'Square', 'Star', 'StopCircle', 'Sun', 'Sunrise',
  'Sunset', 'Tablet', 'Tag', 'Target', 'Terminal', 'Thermometer', 'ThumbsDown', 'ThumbsUp', 'ToggleLeft',
  'ToggleRight', 'Tool', 'Trash', 'Trash2', 'TrendingDown', 'TrendingUp', 'Triangle', 'Truck', 'Tv', 'Twitter',
  'Type', 'Umbrella', 'Underline', 'Unlock', 'Upload', 'UploadCloud', 'User', 'UserCheck', 'UserMinus', 'UserPlus',
  'UserX', 'Users', 'Video', 'VideoOff', 'Voicemail', 'Volume', 'Volume1', 'Volume2', 'VolumeX', 'Watch',
  'Wifi', 'WifiOff', 'Wind', 'X', 'XCircle', 'XSquare', 'Youtube', 'Zap', 'ZapOff', 'ZoomIn', 'ZoomOut',
  'Sparkles', 'Rocket', 'Crown', 'Gem', 'Flame', 'Leaf', 'TreePine', 'Waves', 'Utensils', 'UtensilsCrossed',
  'Trophy', 'Handshake', 'Medal', 'PartyPopper', 'Gamepad2', 'Dumbbell', 'Timer', 'Wallet', 'Receipt', 'Scale',
  'Wine', 'Beer', 'Pizza', 'Sandwich', 'Salad', 'Soup', 'IceCream', 'Cake', 'Cookie', 'Apple', 'Banana',
  'Cherry', 'Grape', 'Citrus', 'Carrot', 'Beef', 'Fish', 'Egg', 'Milk', 'Wheat', 'Croissant', 'Popcorn',
  'Candy', 'Lollipop', 'ChefHat', 'CookingPot', 'Microwave', 'Refrigerator', 'Armchair', 'Bed', 'Bath',
  'Lamp', 'Sofa', 'DoorOpen', 'DoorClosed', 'Warehouse', 'Factory', 'Store', 'Hotel', 'School', 'Church',
  'Hospital', 'Landmark', 'Castle', 'Tent', 'TreeDeciduous', 'Trees', 'Flower', 'Flower2', 'Sprout',
  'Footprints', 'PawPrint', 'Bug', 'Bird', 'Cat', 'Dog', 'Rabbit', 'Squirrel', 'Turtle', 'Fish',
  'Accessibility', 'Baby', 'Backpack', 'Badge', 'Banknote', 'Barcode', 'Baseline', 'Beaker', 'BellRing',
  'Bike', 'Binary', 'Biohazard', 'Blinds', 'Blocks', 'Bluetooth', 'Bomb', 'Bone', 'BookCopy', 'BookMarked',
  'BotMessageSquare', 'Brain', 'BrickWall', 'Brush', 'BugOff', 'BugPlay', 'Calculator', 'CalendarCheck',
  'CalendarClock', 'CalendarDays', 'CalendarHeart', 'CalendarPlus', 'CalendarRange', 'CalendarSearch',
  'CandlestickChart', 'Captions', 'CarFront', 'Caravan', 'CaseLower', 'CaseUpper', 'CassetteTape',
  'Cast', 'ChartArea', 'ChartBar', 'ChartLine', 'ChartPie', 'CircleDot', 'CircleUser', 'Clapperboard',
  'ClipboardCheck', 'ClipboardList', 'ClipboardPen', 'CloudDownload', 'CloudUpload', 'Cloudy', 'Clover',
  'CodeXml', 'Coins', 'Columns', 'Combine', 'Command', 'Component', 'Computer', 'ConciergeBell', 'Cone',
  'Construction', 'Contact', 'Container', 'Contrast', 'Cookie', 'CopyCheck', 'Copyright', 'CornerLeftDown',
  'CornerLeftUp', 'CornerRightDown', 'CornerRightUp', 'CornerUpLeft', 'CornerUpRight', 'Cpu', 'CreativeCommons',
  'Crown', 'Cuboid', 'CupSoda', 'Currency', 'Cylinder',
  // Additional valid icons in lucide-react ^0.454.0
  'Hammer', 'Wrench', 'Paintbrush', 'Palette', 'Ruler', 'Pipette', 'Eraser',
  'PenTool', 'Highlighter', 'Stamp', 'Sticker', 'Wand', 'Wand2',
  'Plane', 'PlaneTakeoff', 'PlaneLanding', 'Ship', 'Sailboat', 'Train', 'Tram', 'Bus',
  'Ambulance', 'FireExtinguisher', 'Siren', 'Construction',
  'Pill', 'Stethoscope', 'Syringe', 'HeartPulse', 'Microscope', 'TestTube', 'Dna',
  'GraduationCap', 'Library', 'BookText', 'NotebookPen', 'FileQuestion',
  'Presentation', 'Projector', 'ScreenShare', 'MonitorPlay',
  'Gamepad', 'Joystick', 'Dice1', 'Dice2', 'Dice3', 'Dice4', 'Dice5', 'Dice6',
  'Piano', 'Guitar', 'Drum', 'Mic2', 'MicVocal', 'Headset',
  'Shirt', 'Watch', 'Glasses', 'Gem', 'Diamond', 'Crown', 'Ring',
  'Martini', 'GlassWater', 'CoffeeIcon', 'Soup', 'Drumstick',
  'Sunrise', 'Sunset', 'CloudRain', 'CloudSnow', 'CloudLightning', 'Snowflake',
  'Palmtree', 'Mountain', 'MountainSnow', 'Waves', 'Rainbow',
  'Fingerprint', 'Scan', 'ScanFace', 'QrCode', 'Barcode',
  'PlugZap', 'Cable', 'Usb', 'HardDrive', 'MemoryStick',
  'ShieldAlert', 'ShieldBan', 'ShieldOff', 'KeyRound', 'KeySquare',
  'Waypoints', 'Route', 'Signpost', 'SignpostBig', 'Milestone'
];

// Icon replacement map for invalid icons
// Note: Icons like Handshake, Trophy, Medal ARE valid in lucide-react ^0.454.0
// Only map truly non-existent or problematic icons
const ICON_REPLACEMENTS = {
  'Rifle': 'Target',
  'Gun': 'Crosshair',
  'Pistol': 'Circle',
  'Bullet': 'Circle',
  'Weapon': 'Shield',
  'Sword': 'Shield',
  'Axe': 'Wrench',
  'Drill': 'Wrench',
  'Saw': 'Wrench',
  'Screwdriver': 'Wrench',
  // Common AI hallucinations - map to valid alternatives
  'Partnership': 'Users',
  'Team': 'Users',
  'Group': 'Users',
  'People': 'Users',
  'Agreement': 'FileText',
  'Contract': 'FileText',
  'Document': 'FileText',
  'Paper': 'FileText',
  'Money': 'DollarSign',
  'Cash': 'Banknote',
  'Price': 'Tag',
  'Cost': 'Receipt',
  'Location': 'MapPin',
  'Address': 'MapPin',
  'Place': 'MapPin',
  'Time': 'Clock',
  'Duration': 'Clock',
  'Schedule': 'Calendar',
  'Date': 'Calendar',
  'Email': 'Mail',
  'Message': 'MessageSquare',
  'Chat': 'MessageSquare',
  'Call': 'Phone',
  'Telephone': 'Phone',
  'Website': 'Globe',
  'Internet': 'Globe',
  'Web': 'Globe',
  'Social': 'Share',
  'Network': 'Share',
  'Success': 'CheckCircle',
  'Complete': 'CheckCircle',
  'Done': 'Check',
  'Error': 'AlertCircle',
  'Warning': 'AlertTriangle',
  'Danger': 'AlertTriangle',
  'Info': 'Info',
  'Help': 'HelpCircle',
  'Question': 'HelpCircle'
};

// ============================================
// SYNTAX VALIDATION - Check AI-generated code
// ============================================
function validateGeneratedCode(code, componentName) {
  const errors = [];
  let fixedCode = code;
  
  // Check for invalid Lucide icons and fix them
  const iconImportMatch = fixedCode.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
  if (iconImportMatch) {
    const importedIcons = iconImportMatch[1].split(',').map(i => i.trim()).filter(Boolean);
    
    for (const icon of importedIcons) {
      if (!VALID_LUCIDE_ICONS.includes(icon)) {
        const replacement = ICON_REPLACEMENTS[icon] || 'Circle';
        // Replace in entire code
        const importRegex = new RegExp(`\\b${icon}\\b`, 'g');
        fixedCode = fixedCode.replace(importRegex, replacement);
        errors.push(`Invalid icon "${icon}" replaced with "${replacement}"`);
      }
    }
    
    // Deduplicate icons in import statement
    const newImportMatch = fixedCode.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
    if (newImportMatch) {
      const icons = newImportMatch[1].split(',').map(i => i.trim()).filter(Boolean);
      const uniqueIcons = [...new Set(icons)];
      if (icons.length !== uniqueIcons.length) {
        const oldImport = newImportMatch[0];
        const newImport = `import { ${uniqueIcons.join(', ')} } from 'lucide-react'`;
        fixedCode = fixedCode.replace(oldImport, newImport);
        errors.push(`Deduplicated icon imports`);
      }
    }
  }
  
  // Check for common AI mistakes
  if (fixedCode.includes('console log(')) {
    errors.push('Found "console log(" - should be "console.log("');
  }
  
  // Check for required structure
  if (!code.includes('import React')) {
    errors.push('Missing React import');
  }
  
  if (!code.includes('export default')) {
    errors.push('Missing export default');
  }
  
  // Check for balanced braces (simple check)
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
  }
  
  // Check for balanced parentheses
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
  }
  
  // Check for common syntax issues
  if (code.includes('style={{') && !code.includes('}}')) {
    errors.push('Potentially unclosed style object');
  }
  
  // Auto-fix common issues
  fixedCode = fixedCode.replace(/console log\(/g, 'console.log(');
  
  return {
    isValid: errors.length === 0,
    errors,
    fixedCode
  };
}

function buildFallbackThemeCss(promptConfig) {
  const colors = promptConfig?.colors || {};
  const typography = promptConfig?.typography || {};
  
  return `/* Auto-generated theme from industry config */
:root {
  --color-primary: ${colors.primary || '#6366f1'};
  --color-secondary: ${colors.secondary || '#8b5cf6'};
  --color-accent: ${colors.accent || '#06b6d4'};
  --color-background: ${colors.background || '#ffffff'};
  --color-surface: ${colors.surface || '#f8f9fa'};
  --color-text: ${colors.text || '#1a1a2e'};
  --color-text-muted: ${colors.textMuted || '#64748b'};
  --font-heading: ${typography.heading || "'Inter', sans-serif"};
  --font-body: ${typography.body || "system-ui, sans-serif"};
  --border-radius: 8px;
}
body { margin: 0; font-family: var(--font-body); color: var(--color-text); }
`;
}

// ============================================
// UTILITY ENDPOINTS
// ============================================

// Open folder in explorer
app.post('/api/open-folder', (req, res) => {
  const { path: folderPath } = req.body;

  if (!folderPath) {
    return res.status(400).json({ success: false, error: 'Path required' });
  }

  // SECURITY: Validate path is within allowed directories
  const normalizedPath = path.resolve(folderPath);
  const isAllowedPath = normalizedPath.startsWith(GENERATED_PROJECTS) ||
                        normalizedPath.startsWith(MODULE_LIBRARY);
  if (!isAllowedPath) {
    return res.status(403).json({ success: false, error: 'Access denied - path outside allowed directories' });
  }

  if (!fs.existsSync(normalizedPath)) {
    return res.status(404).json({ success: false, error: 'Path does not exist' });
  }

  // Use shell: true for Windows explorer, but path is validated above
  spawn('explorer', [normalizedPath], { shell: true, detached: true });
  res.json({ success: true });
});

// Open in VS Code
app.post('/api/open-vscode', (req, res) => {
  const { path: folderPath } = req.body;

  if (!folderPath) {
    return res.status(400).json({ success: false, error: 'Path required' });
  }

  // SECURITY: Validate path is within allowed directories
  const normalizedPath = path.resolve(folderPath);
  const isAllowedPath = normalizedPath.startsWith(GENERATED_PROJECTS) ||
                        normalizedPath.startsWith(MODULE_LIBRARY);
  if (!isAllowedPath) {
    return res.status(403).json({ success: false, error: 'Access denied - path outside allowed directories' });
  }

  if (!fs.existsSync(normalizedPath)) {
    return res.status(404).json({ success: false, error: 'Path does not exist' });
  }

  // Use shell: true for Windows 'code' command, but path is validated above
  spawn('code', [normalizedPath], { shell: true, detached: true });
  res.json({ success: true });
});

// ============================================
// AI SITE ANALYSIS ENDPOINT
// ============================================

app.post('/api/analyze-site', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL required' });
  }
  
  console.log(`🔍 Analyzing site: ${url}`);
  
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.log('   ⚠️ No ANTHROPIC_API_KEY - returning mock analysis');
      return res.json({
        success: true,
        analysis: {
          url: url,
          colors: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#06b6d4', background: '#0f172a', text: '#e2e8f0' },
          fonts: { heading: 'Inter', body: 'Inter' },
          style: 'modern',
          mood: 'professional',
          mock: true
        }
      });
    }
    
    const Anthropic = require('@anthropic-ai/sdk');
    const axios = require('axios');
    const client = new Anthropic({ apiKey });
    
    const screenshotUrl = `https://image.thum.io/get/width/1280/crop/800/png/${url}`;
    
    let imageBase64;
    let mediaType = 'image/png';
    try {
      const imageResponse = await axios.get(screenshotUrl, { 
        responseType: 'arraybuffer', 
        timeout: 20000,
        headers: { 'Accept': 'image/png' }
      });
      const buffer = Buffer.from(imageResponse.data);
      imageBase64 = buffer.toString('base64');
      
      const contentType = imageResponse.headers['content-type'];
      if (contentType && contentType.includes('jpeg')) {
        mediaType = 'image/jpeg';
      } else if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        mediaType = 'image/jpeg';
      }
      
      console.log(`   📸 Screenshot captured (${mediaType}, ${buffer.length} bytes)`);
    } catch (imgErr) {
      console.log('   ⚠️ Screenshot failed - using URL analysis only');
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Analyze the website ${url} and suggest a design theme. Return ONLY valid JSON with this structure:
{
  "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex" },
  "fonts": { "heading": "font name", "body": "font name" },
  "style": "modern|minimal|bold|elegant|playful",
  "mood": "professional|friendly|luxurious|energetic|calm"
}`
        }]
      });
      
      const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      
      return res.json({
        success: true,
        analysis: { url: url, ...analysis, mock: false, method: 'url-only' }
      });
    }
    
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          { type: 'text', text: `Analyze this website screenshot and extract the design system. Return ONLY valid JSON with this exact structure:
{
  "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex" },
  "fonts": { "heading": "font name", "body": "font name" },
  "style": "modern|minimal|bold|elegant|playful",
  "mood": "professional|friendly|luxurious|energetic|calm"
}` }
        ]
      }]
    });
    
    const responseText = response.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    console.log(`   ✅ Analysis complete for ${url}`);
    
    res.json({
      success: true,
      analysis: { url: url, ...analysis, mock: false, method: 'vision' }
    });
    
  } catch (err) {
    console.error(`   ❌ Analysis error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generate theme from references
app.post('/api/generate-theme', async (req, res) => {
  const { references } = req.body;
  
  if (!references || !Array.isArray(references) || references.length === 0) {
    return res.status(400).json({ success: false, error: 'References array required' });
  }
  
  console.log(`🎨 Generating theme from ${references.length} references`);
  
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    const refDescriptions = references.map((ref, i) => {
      const likes = ref.selectedStyles?.join(', ') || 'overall design';
      const notes = ref.notes || '';
      const analysis = ref.analysis ? JSON.stringify(ref.analysis) : 'not analyzed';
      return `Reference ${i + 1}: ${ref.url}\n  Likes: ${likes}\n  Notes: ${notes}\n  Analysis: ${analysis}`;
    }).join('\n\n');
    
    if (!apiKey) {
      console.log('   ⚠️ No ANTHROPIC_API_KEY - returning mock theme');
      return res.json({
        success: true,
        theme: {
          colors: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#06b6d4', background: '#0f172a', surface: '#1e293b', text: '#e2e8f0', textMuted: '#94a3b8' },
          fonts: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
          borderRadius: '12px',
          style: 'modern',
          mock: true
        }
      });
    }
    
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });
    
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Based on these reference sites and what the user likes about each, generate a cohesive design theme.

${refDescriptions}

Return ONLY valid JSON with this structure:
{
  "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "surface": "#hex", "text": "#hex", "textMuted": "#hex" },
  "fonts": { "heading": "font-family string", "body": "font-family string" },
  "borderRadius": "Npx",
  "style": "description"
}`
      }]
    });
    
    const responseText = response.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Could not parse theme response');
    }
    
    const theme = JSON.parse(jsonMatch[0]);
    console.log(`   ✅ Theme generated`);
    
    res.json({ success: true, theme: { ...theme, mock: false } });
    
  } catch (err) {
    console.error(`   ❌ Theme generation error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// ANALYZE EXISTING SITE ENDPOINT
// ============================================

app.post('/api/analyze-existing-site', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL required' });
  }
  
  console.log(`🔍 Analyzing existing site: ${url}`);
  
  try {
    const axios = require('axios');
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    let siteUrl = url.trim();
    if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
      siteUrl = 'https://' + siteUrl;
    }
    
    let html = '';
    try {
      const response = await axios.get(siteUrl, { 
        timeout: 15000,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      });
      html = response.data;
    } catch (fetchErr) {
      try {
        const altUrl = siteUrl.replace('https://', 'http://');
        const altResponse = await axios.get(altUrl, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        html = altResponse.data;
      } catch (altErr) {
        console.log(`   ⚠️ Failed to fetch site: ${fetchErr.message}`);
        html = '';
      }
    }
    
    console.log(`   📄 Fetched ${html.length} characters`);

    // Extract design system with enhanced image categorization
    const extractDesignSystem = (html, baseUrl) => {
      const design = { colors: [], fonts: [], images: [], categorizedImages: {}, sections: [], cssVariables: {} };
      
      // Parse base URL for making absolute URLs
      let urlBase = '';
      try {
        const urlObj = new URL(baseUrl);
        urlBase = urlObj.origin;
      } catch (e) {
        urlBase = baseUrl.replace(/\/[^\/]*$/, '');
      }
      
      // Helper to make absolute URL
      const makeAbsolute = (src) => {
        if (!src) return null;
        if (src.startsWith('data:')) return null;
        if (src.startsWith('//')) return 'https:' + src;
        if (src.startsWith('http://') || src.startsWith('https://')) return src;
        if (src.startsWith('/')) return urlBase + src;
        return urlBase + '/' + src;
      };
      
      // Filter out junk images
      const isJunkImage = (src, alt) => {
        const junkPatterns = [
          'pixel', 'tracking', 'spacer', 'blank', 'transparent',
          'facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'pinterest',
          'google-analytics', 'gtm', 'fbevents', 'analytics',
          'icon-', 'ico-', 'favicon', '.ico', '.svg',
          'loading', 'spinner', 'ajax', 'loader',
          'gravatar', 'avatar-default', 'placeholder',
          '1x1', '2x2', 'pixel.gif', 'clear.gif',
          'wp-content/plugins', 'wp-includes'
        ];
        const srcLower = (src || '').toLowerCase();
        const altLower = (alt || '').toLowerCase();
        return junkPatterns.some(p => srcLower.includes(p) || altLower.includes(p));
      };
      
      // Categorize image based on context
      const categorizeImage = (src, alt, context) => {
        const srcLower = (src || '').toLowerCase();
        const altLower = (alt || '').toLowerCase();
        const ctxLower = (context || '').toLowerCase();
        
        // Logo detection
        if (srcLower.includes('logo') || altLower.includes('logo') || ctxLower.includes('logo') ||
            ctxLower.includes('brand') || ctxLower.includes('site-title')) {
          return 'logo';
        }
        
        // Hero/banner detection
        if (ctxLower.includes('hero') || ctxLower.includes('banner') || ctxLower.includes('slider') ||
            ctxLower.includes('carousel') || ctxLower.includes('jumbotron') || srcLower.includes('hero') ||
            srcLower.includes('banner') || srcLower.includes('slide')) {
          return 'hero';
        }
        
        // Team/staff detection
        if (altLower.includes('team') || altLower.includes('staff') || altLower.includes('employee') ||
            ctxLower.includes('team') || ctxLower.includes('about-us') || altLower.includes('ceo') ||
            altLower.includes('founder') || altLower.includes('owner') || altLower.includes('manager')) {
          return 'team';
        }
        
        // Gallery detection
        if (ctxLower.includes('gallery') || ctxLower.includes('portfolio') || ctxLower.includes('lightbox') ||
            ctxLower.includes('grid') || srcLower.includes('gallery')) {
          return 'gallery';
        }
        
        // Product detection
        if (ctxLower.includes('product') || ctxLower.includes('item') || ctxLower.includes('shop') ||
            ctxLower.includes('menu-item') || ctxLower.includes('service') || srcLower.includes('product')) {
          return 'product';
        }
        
        // Background detection
        if (ctxLower.includes('background') || ctxLower.includes('bg-') || srcLower.includes('background') ||
            srcLower.includes('-bg')) {
          return 'background';
        }
        
        return 'general';
      };
      
      // Extract colors
      const colorRegex = /#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g;
      const colorMatches = html.match(colorRegex) || [];
      const colorCounts = {};
      colorMatches.forEach(c => { const n = c.toLowerCase(); colorCounts[n] = (colorCounts[n] || 0) + 1; });
      design.colors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c]) => c);
      
      // Extract fonts
      const fontRegex = /font-family:\s*([^;}"']+)/gi;
      let fontMatch;
      const fontSet = new Set();
      while ((fontMatch = fontRegex.exec(html)) !== null) {
        const font = fontMatch[1].trim().split(',')[0].replace(/["']/g, '').trim();
        if (font && font.length < 50) fontSet.add(font);
      }
      design.fonts = Array.from(fontSet).slice(0, 5);
      
      // Enhanced image extraction with context
      const imgRegex = /<(?:img|source)[^>]+(?:src|srcset)=["']([^"']+)["'][^>]*>/gi;
      const bgImageRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
      let imgMatch;
      const seenUrls = new Set();
      
      // Initialize categories
      design.categorizedImages = {
        logo: [],
        hero: [],
        team: [],
        gallery: [],
        product: [],
        background: [],
        general: []
      };
      
      // Extract <img> and <source> tags with surrounding context
      while ((imgMatch = imgRegex.exec(html)) !== null) {
        let src = imgMatch[1].split(',')[0].split(' ')[0]; // Handle srcset
        src = makeAbsolute(src);
        
        if (!src || seenUrls.has(src)) continue;
        
        const altMatch = imgMatch[0].match(/alt=["']([^"']*?)["']/i);
        const alt = altMatch ? altMatch[1] : '';
        
        if (isJunkImage(src, alt)) continue;
        
        // Get surrounding context (100 chars before the img tag)
        const imgIndex = imgMatch.index;
        const context = html.substring(Math.max(0, imgIndex - 200), imgIndex);
        
        const category = categorizeImage(src, alt, context);
        const imgData = { src, alt, category };
        
        seenUrls.add(src);
        design.images.push(imgData);
        design.categorizedImages[category].push(imgData);
      }
      
      // Extract CSS background images
      while ((imgMatch = bgImageRegex.exec(html)) !== null) {
        let src = imgMatch[1];
        src = makeAbsolute(src);
        
        if (!src || seenUrls.has(src) || isJunkImage(src, '')) continue;
        
        // Get surrounding context
        const bgIndex = imgMatch.index;
        const context = html.substring(Math.max(0, bgIndex - 200), bgIndex + 200);
        
        const category = categorizeImage(src, '', context);
        const imgData = { src, alt: '', category, isBgImage: true };
        
        seenUrls.add(src);
        design.images.push(imgData);
        design.categorizedImages[category].push(imgData);
      }
      
      // Also check for Open Graph / meta images (often high quality)
      const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
      if (ogImageMatch) {
        const src = makeAbsolute(ogImageMatch[1]);
        if (src && !seenUrls.has(src)) {
          const imgData = { src, alt: 'OG Image', category: 'hero', isOgImage: true };
          design.images.unshift(imgData); // Put at front - usually best quality
          design.categorizedImages.hero.unshift(imgData);
        }
      }
      
      // Limit images per category
      Object.keys(design.categorizedImages).forEach(cat => {
        design.categorizedImages[cat] = design.categorizedImages[cat].slice(0, 10);
      });
      design.images = design.images.slice(0, 30);
      
      console.log(`   📸 Images extracted: ${design.images.length} total`);
      console.log(`      Logo: ${design.categorizedImages.logo.length}, Hero: ${design.categorizedImages.hero.length}, Gallery: ${design.categorizedImages.gallery.length}`);
      
      return design;
    };

    const extractContent = (html) => {
      const content = { headlines: [], paragraphs: [], prices: [] };
      
      const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
      const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
      content.headlines = [...h1Matches, ...h2Matches].map(h => h.replace(/<[^>]+>/g, '').trim()).filter(h => h.length > 2 && h.length < 200);
      
      const pMatches = html.match(/<p[^>]*>([^<]{20,500})<\/p>/gi) || [];
      content.paragraphs = pMatches.map(p => p.replace(/<[^>]+>/g, '').trim()).filter(p => p.length > 20).slice(0, 20);
      
      const priceMatches = html.match(/\$\d+(?:\.\d{2})?/g) || [];
      content.prices = [...new Set(priceMatches)];
      
      return content;
    };

    if (html.length === 0 && !apiKey) {
      return res.status(400).json({ success: false, error: 'Could not fetch website and no API key for fallback' });
    }
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    const phoneRegex = /(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
    const phones = html.match(phoneRegex) || [];
    const phone = phones[0] || '';
    
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = html.match(emailRegex) || [];
    const email = emails.find(e => !e.includes('example') && !e.includes('wordpress')) || '';
    
    const designSystem = extractDesignSystem(html, siteUrl);
    const pageContent = extractContent(html);
    
    if (!apiKey) {
      return res.json({
        success: true,
        analysis: {
          url: siteUrl,
          businessName: title.split('|')[0].split('-')[0].trim(),
          phone, email,
          industry: 'unknown',
          designSystem, pageContent,
          mock: true
        }
      });
    }
    
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });
    
    const truncatedHtml = html.substring(0, 15000);
    
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Analyze this website HTML and extract business information. Return ONLY valid JSON.

Website URL: ${siteUrl}
Title: ${title}
Phone: ${phone}
Email: ${email}

HTML Content (truncated):
${truncatedHtml}

Return JSON with this structure:
{
  "businessName": "extracted business name",
  "industry": "detected industry",
  "phone": "phone number",
  "email": "email address", 
  "address": "physical address if found",
  "description": "2-3 sentence description",
  "keyServices": ["service1", "service2"],
  "recommendations": {
    "pages": ["home", "about", "services", "contact"],
    "improvements": ["improvement1", "improvement2"]
  }
}`
      }]
    });
    
    const responseText = response.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    console.log(`   ✅ Analysis complete: ${analysis.businessName}`);
    
    res.json({
      success: true,
      analysis: { url: siteUrl, ...analysis, designSystem, pageContent, mock: false }
    });
    
  } catch (err) {
    console.error(`   ❌ Analysis error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// DEPLOY ENDPOINT
// ============================================

const deployService = require('./services/deploy-service.cjs');

// Check deploy credentials on startup
const deployReady = deployService.checkCredentials();

// Auto-deploy helper function
async function autoDeployProject(projectPath, projectName, adminEmail) {
  if (!deployReady) {
    console.log('⚠️ Auto-deploy skipped: Deploy service not configured');
    return null;
  }
  
  console.log(`\n🚀 Auto-deploying: ${projectName}`);
  try {
    const result = await deployService.deployProject(projectPath, projectName, {
      adminEmail: adminEmail || 'admin@be1st.io'
    });
    return result;
  } catch (error) {
    console.error('Auto-deploy error:', error.message);
    return { success: false, error: error.message };
  }
}

// Deploy a generated project
app.post('/api/deploy', async (req, res) => {
  const { projectPath, projectName, adminEmail } = req.body;

  if (!deployReady) {
    return res.status(500).json({ 
      success: false, 
      error: 'Deploy service not configured. Check .env for missing credentials.' 
    });
  }

  if (!projectPath || !projectName) {
    return res.status(400).json({ 
      success: false, 
      error: 'projectPath and projectName required' 
    });
  }

  // Check project exists
  if (!fs.existsSync(projectPath)) {
    return res.status(400).json({ 
      success: false, 
      error: `Project not found: ${projectPath}` 
    });
  }

  console.log(`\n🚀 Deploy request received for: ${projectName}`);

  try {
    const result = await deployService.deployProject(projectPath, projectName, {
      adminEmail: adminEmail || 'admin@be1st.io'
    });

    res.json(result);
  } catch (error) {
    console.error('Deploy error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Check deploy status
app.get('/api/deploy/status', (req, res) => {
  res.json({
    ready: deployReady,
    services: {
      railway: !!process.env.RAILWAY_TOKEN,
      github: !!process.env.GITHUB_TOKEN,
      cloudflare: !!process.env.CLOUDFLARE_TOKEN && !!process.env.CLOUDFLARE_ZONE_ID
    }
  });
});

// ============================================
// START SERVER
// ============================================
async function startServer() {
  // Initialize database and admin services
  await initializeServices();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ⚡ BLINK Module Assembler v2.0                         ║
║                                                          ║
║   Server:    http://localhost:${PORT}                      ║
║   API:       http://localhost:${PORT}/api                  ║
║   Admin:     http://localhost:${PORT}/admin                ║
║                                                          ║
║   ✅ Prompt configs loaded:                              ║
║      - ${Object.keys(INDUSTRIES).length} industries                                   ║
║      - ${Object.keys(LAYOUTS).length} layouts                                      ║
║      - ${Object.keys(EFFECTS).length} effects                                      ║
║      - ${Object.keys(SECTIONS).length} sections                                     ║
║   ${db ? '✅ Database connected' : '⚠️  No database (admin disabled)'}                           ║
║                                                          ║
║   Endpoints:                                             ║
║   - GET  /api/health           Health check              ║
║   - GET  /api/bundles          List all bundles          ║
║   - GET  /api/industries       List all industries       ║
║   - GET  /api/layouts          List all layouts          ║
║   - GET  /api/effects          List all effects          ║
║   - GET  /api/sections         List all sections         ║
║   - GET  /api/projects         List generated projects   ║
║   - POST /api/build-prompt     Build prompt from config  ║
║   - POST /api/assemble         Assemble a new project    ║
║   - POST /api/analyze-site     Analyze reference site    ║
║   - POST /api/analyze-existing-site  Analyze for enhance ║
║   - POST /api/generate-theme   Generate theme            ║
║   - POST /api/open-folder      Open folder in explorer   ║
║   - POST /api/open-vscode      Open folder in VS Code    ║
║                                                          ║
║   Press Ctrl+C to stop                                   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.`);
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });

  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down server...');
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  });
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
