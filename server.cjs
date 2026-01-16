/**
 * Module Assembler Backend Server
 *
 * Express server that provides API endpoints for the assembler UI
 * and executes the actual assembly script.
 *
 * Save to: C:\Users\huddl\OneDrive\Desktop\module-library\module-assembler-ui\server.cjs
 */

require('dotenv').config();

// Initialize Sentry FIRST - before any other code
const {
  initSentry,
  sentryRequestHandler,
  sentryErrorHandler,
  captureException,
  addBreadcrumb
} = require('./lib/sentry.cjs');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ===========================================
// EXTRACTED UTILITIES
// ===========================================
const {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS,
  validatePasswordStrength,
  toComponentName,
  toPageFileName,
  toRoutePath,
  toNavLabel,
  copyDirectorySync
} = require('./lib/utils/index.cjs');

// ===========================================
// EXTRACTED CONFIGS
// ===========================================
const {
  BUNDLES,
  INDUSTRY_PRESETS,
  VISUAL_ARCHETYPES,
  VALID_LUCIDE_ICONS,
  ICON_REPLACEMENTS
} = require('./lib/configs/index.cjs');

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
      db = require('./database/db.cjs');
      await db.initializeDatabase();
      console.log('   ✅ Database initialized');

      // Use the full blink-admin routes that match the frontend
      adminRoutes = require('../backend/blink-admin/routes/admin');
      console.log('   ✅ Admin routes loaded (blink-admin)');
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

// Dynamic video cache (in-memory, resets on server restart)
const videoCache = new Map();

// Fetch video from Pexels API based on search query
async function fetchPexelsVideo(searchQuery) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey || apiKey === 'your_pexels_api_key_here') {
    console.log('   ⚠️ Pexels API key not configured');
    return null;
  }

  // Check cache first
  const cacheKey = searchQuery.toLowerCase().trim();
  if (videoCache.has(cacheKey)) {
    console.log(`   📹 Using cached video for: ${searchQuery}`);
    return videoCache.get(cacheKey);
  }

  try {
    console.log(`   🔍 Searching Pexels for video: ${searchQuery}`);
    const response = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`,
      {
        headers: {
          'Authorization': apiKey
        }
      }
    );

    if (!response.ok) {
      console.log(`   ⚠️ Pexels API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data.videos && data.videos.length > 0) {
      // Find HD or higher quality video file
      const video = data.videos[0];
      const hdFile = video.video_files.find(f => f.quality === 'hd' || f.quality === 'uhd' || f.height >= 720);
      const videoUrl = hdFile ? hdFile.link : video.video_files[0].link;

      console.log(`   ✅ Found Pexels video: ${videoUrl.substring(0, 60)}...`);

      // Cache the result
      videoCache.set(cacheKey, videoUrl);

      return videoUrl;
    }

    console.log(`   ⚠️ No Pexels videos found for: ${searchQuery}`);
    return null;
  } catch (err) {
    console.log(`   ⚠️ Pexels API fetch error: ${err.message}`);
    return null;
  }
}

// Get video URL for an industry - tries dynamic fetch first, falls back to hardcoded
async function getIndustryVideo(industryName, businessName = '') {
  // Build search terms based on industry and business name
  const searchTerms = [];

  // Add industry-specific terms
  const industryLower = industryName.toLowerCase();
  if (industryLower.includes('pizza')) searchTerms.push('pizza making', 'pizzeria');
  else if (industryLower.includes('restaurant') || industryLower.includes('food')) searchTerms.push('restaurant cooking', 'chef cooking');
  else if (industryLower.includes('spa') || industryLower.includes('wellness')) searchTerms.push('spa massage', 'wellness relaxation');
  else if (industryLower.includes('fitness') || industryLower.includes('gym')) searchTerms.push('gym workout', 'fitness training');
  else if (industryLower.includes('salon') || industryLower.includes('hair')) searchTerms.push('hair salon', 'hairstylist');
  else if (industryLower.includes('plumb')) searchTerms.push('plumber working', 'plumbing repair');
  else if (industryLower.includes('electric')) searchTerms.push('electrician working', 'electrical work');
  else if (industryLower.includes('construct')) searchTerms.push('construction site', 'building construction');
  else if (industryLower.includes('dental') || industryLower.includes('dentist')) searchTerms.push('dental office', 'dentist');
  else if (industryLower.includes('landscap') || industryLower.includes('lawn')) searchTerms.push('landscaping garden', 'lawn care');
  else if (industryLower.includes('clean')) searchTerms.push('cleaning service', 'house cleaning');
  else if (industryLower.includes('auto') || industryLower.includes('mechanic')) searchTerms.push('auto repair', 'mechanic working');
  else if (industryLower.includes('pet') || industryLower.includes('vet')) searchTerms.push('pet grooming', 'veterinary');
  else if (industryLower.includes('hotel') || industryLower.includes('hospitality')) searchTerms.push('luxury hotel', 'hotel lobby');
  else if (industryLower.includes('real estate')) searchTerms.push('luxury home', 'real estate');
  else if (industryLower.includes('law') || industryLower.includes('attorney')) searchTerms.push('law office', 'lawyer');
  else if (industryLower.includes('cafe') || industryLower.includes('coffee')) searchTerms.push('coffee shop', 'barista coffee');
  else if (industryLower.includes('bakery') || industryLower.includes('pastry')) searchTerms.push('bakery', 'baking bread');
  else if (industryLower.includes('tattoo')) searchTerms.push('tattoo artist', 'tattoo studio');
  else if (industryLower.includes('barber')) searchTerms.push('barber shop', 'barber haircut');
  else searchTerms.push(industryName); // Use industry name as search term

  // Try to fetch from Pexels
  for (const term of searchTerms) {
    const videoUrl = await fetchPexelsVideo(term);
    if (videoUrl) return videoUrl;
  }

  // Fallback: return null (will use hardcoded or no video)
  return null;
}

// Load prompt configs
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');
const INDUSTRIES = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, 'industries.json'), 'utf-8'));
const LAYOUTS = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, 'layouts.json'), 'utf-8'));
const EFFECTS = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, 'effects.json'), 'utf-8'));
const SECTIONS = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, 'sections.json'), 'utf-8'));

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
    
    // Food & Beverage (pizza FIRST - more specific than restaurant)
    { industry: 'pizza', keywords: ['pizza', 'pizzeria', 'pie shop', 'slice'] },
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

// Initialize Sentry error tracking
initSentry(app);

// Sentry request handler - MUST be first middleware
app.use(sentryRequestHandler());

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

// ===========================================
// SECURITY MIDDLEWARE
// ===========================================

// Helmet security headers - MUST be early in middleware chain
app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // React needs these
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      mediaSrc: ["'self'", "https://player.vimeo.com", "https://*.pexels.com"],
      connectSrc: ["'self'", "https://api.anthropic.com", "https://api.pexels.com", "https://*.sentry.io"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  // Cross-Origin settings
  crossOriginEmbedderPolicy: false, // Needed for external images/videos
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // Prevent MIME type sniffing
  noSniff: true,
  // XSS protection
  xssFilter: true,
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // Don't advertise Express
  hidePoweredBy: true
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL, /\.be1st\.io$/]
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
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

// Admin login endpoint (JWT-based)
app.post('/api/auth/login',
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isString().notEmpty().withMessage('Password is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!db) {
        return res.status(500).json({ success: false, error: 'Database not available' });
      }

      // Find user by email
      const result = await db.query(
        'SELECT id, email, password_hash, name, subscription_tier, is_admin FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      // Check if admin
      if (!user.is_admin) {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      // Generate JWT - use is_admin (snake_case) to match auth middleware
      const token = jwt.sign(
        { id: user.id, email: user.email, is_admin: user.is_admin },
        process.env.JWT_SECRET || 'blink-default-secret',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscription_tier: user.subscription_tier,
          is_admin: user.is_admin
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: 'Login failed' });
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

// ============================================
// TOOL HTML GENERATOR
// ============================================

function generateToolHtml(payload) {
  const { name, toolTemplate, toolCategory, toolFeatures = [], toolFields = [], theme = {} } = payload;
  const colors = theme.colors || { primary: '#3b82f6', accent: '#8b5cf6', background: '#f8fafc' };

  // Generate form fields HTML
  const fieldsHtml = toolFields.map(field => {
    const fieldId = field.name.toLowerCase().replace(/\s+/g, '-');

    if (field.type === 'text') {
      return `
        <div class="form-group">
          <label for="${fieldId}">${field.label}</label>
          <input type="text" id="${fieldId}" name="${field.name}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>
        </div>`;
    }

    if (field.type === 'number') {
      return `
        <div class="form-group">
          <label for="${fieldId}">${field.label}</label>
          <input type="number" id="${fieldId}" name="${field.name}" placeholder="${field.placeholder || '0'}" step="${field.step || '1'}" ${field.required ? 'required' : ''}>
        </div>`;
    }

    if (field.type === 'textarea') {
      return `
        <div class="form-group">
          <label for="${fieldId}">${field.label}</label>
          <textarea id="${fieldId}" name="${field.name}" rows="4" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>
        </div>`;
    }

    if (field.type === 'select' && field.options) {
      const optionsHtml = field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
      return `
        <div class="form-group">
          <label for="${fieldId}">${field.label}</label>
          <select id="${fieldId}" name="${field.name}" ${field.required ? 'required' : ''}>
            <option value="">Select...</option>
            ${optionsHtml}
          </select>
        </div>`;
    }

    if (field.type === 'date') {
      return `
        <div class="form-group">
          <label for="${fieldId}">${field.label}</label>
          <input type="date" id="${fieldId}" name="${field.name}" ${field.required ? 'required' : ''}>
        </div>`;
    }

    if (field.type === 'line-items') {
      return `
        <div class="form-group line-items">
          <label>${field.label}</label>
          <div id="${fieldId}-container" class="line-items-container">
            <div class="line-item">
              <input type="text" placeholder="Description" class="item-desc">
              <input type="number" placeholder="Qty" class="item-qty" value="1" min="1">
              <input type="number" placeholder="Price" class="item-price" step="0.01">
              <button type="button" class="remove-item" onclick="removeLineItem(this)">×</button>
            </div>
          </div>
          <button type="button" class="add-item-btn" onclick="addLineItem('${fieldId}-container')">+ Add Item</button>
        </div>`;
    }

    // Default to text input
    return `
      <div class="form-group">
        <label for="${fieldId}">${field.label}</label>
        <input type="text" id="${fieldId}" name="${field.name}" ${field.required ? 'required' : ''}>
      </div>`;
  }).join('\n');

  // Feature badges
  const featureBadges = toolFeatures.map(f =>
    `<span class="feature-badge">${f.replace(/-/g, ' ')}</span>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <style>
    :root {
      --primary: ${colors.primary};
      --accent: ${colors.accent};
      --background: ${colors.background};
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--background);
      min-height: 100vh;
      padding: 2rem;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      margin-bottom: 2rem;
    }

    h1 {
      color: var(--primary);
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .tool-category {
      color: #64748b;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .features {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 1rem;
    }

    .feature-badge {
      background: var(--accent);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      text-transform: capitalize;
    }

    .tool-card {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    input, select, textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--primary);
    }

    .line-items-container {
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 0.5rem;
    }

    .line-item {
      display: grid;
      grid-template-columns: 2fr 80px 100px 40px;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .line-item input {
      padding: 0.5rem;
    }

    .remove-item {
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 0.25rem;
      cursor: pointer;
      font-size: 1.25rem;
    }

    .add-item-btn {
      background: var(--accent);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: opacity 0.2s;
    }

    .btn-primary:hover {
      opacity: 0.9;
    }

    .result-section {
      display: none;
      background: #f0fdf4;
      border: 2px solid #22c55e;
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin-top: 1.5rem;
    }

    .result-section.visible {
      display: block;
    }

    .result-section h3 {
      color: #16a34a;
      margin-bottom: 1rem;
    }

    #result-content {
      background: white;
      padding: 1rem;
      border-radius: 0.25rem;
      font-family: monospace;
      white-space: pre-wrap;
    }

    footer {
      text-align: center;
      color: #9ca3af;
      font-size: 0.75rem;
      margin-top: 2rem;
    }

    @media (max-width: 640px) {
      .line-item {
        grid-template-columns: 1fr;
      }

      h1 {
        font-size: 1.75rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <p class="tool-category">${toolCategory}</p>
      <h1>${name}</h1>
      <div class="features">
        ${featureBadges}
      </div>
    </header>

    <div class="tool-card">
      <form id="tool-form">
        ${fieldsHtml}

        <button type="submit" class="btn-primary">Generate</button>
      </form>

      <div id="result" class="result-section">
        <h3>Result</h3>
        <div id="result-content"></div>
      </div>
    </div>

    <footer>
      <p>Generated by Blink | Powered by AI</p>
    </footer>
  </div>

  <script>
    // Line item management
    function addLineItem(containerId) {
      const container = document.getElementById(containerId);
      const item = document.createElement('div');
      item.className = 'line-item';
      item.innerHTML = \`
        <input type="text" placeholder="Description" class="item-desc">
        <input type="number" placeholder="Qty" class="item-qty" value="1" min="1">
        <input type="number" placeholder="Price" class="item-price" step="0.01">
        <button type="button" class="remove-item" onclick="removeLineItem(this)">×</button>
      \`;
      container.appendChild(item);
    }

    function removeLineItem(btn) {
      const container = btn.closest('.line-items-container');
      if (container.querySelectorAll('.line-item').length > 1) {
        btn.closest('.line-item').remove();
      }
    }

    // Form submission
    document.getElementById('tool-form').addEventListener('submit', function(e) {
      e.preventDefault();

      const formData = new FormData(this);
      const data = {};

      // Collect form data
      formData.forEach((value, key) => {
        data[key] = value;
      });

      // Collect line items if present
      const lineItems = [];
      document.querySelectorAll('.line-item').forEach(item => {
        const desc = item.querySelector('.item-desc')?.value;
        const qty = item.querySelector('.item-qty')?.value;
        const price = item.querySelector('.item-price')?.value;
        if (desc && qty && price) {
          lineItems.push({ description: desc, quantity: parseInt(qty), price: parseFloat(price) });
        }
      });

      if (lineItems.length > 0) {
        data.lineItems = lineItems;
        data.subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        data.total = data.subtotal;
      }

      // Display result
      const resultSection = document.getElementById('result');
      const resultContent = document.getElementById('result-content');
      resultContent.textContent = JSON.stringify(data, null, 2);
      resultSection.classList.add('visible');
    });
  </script>
</body>
</html>`;
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
        } catch (e) {
          console.warn(`   ⚠️ Failed to parse project manifest:`, e.message);
          captureException(e, { tags: { component: 'manifest-parser' } });
        }
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
      // Support both layoutKey and layoutStyleId (frontend sends layoutStyleId)
      const layoutKey = description?.layoutStyleId || description?.layoutKey || null;
      const selectedEffects = description?.effects || null;
      const promptConfig = buildPrompt(industryKey, layoutKey, selectedEffects);

      // Log layout selection for debugging
      if (layoutKey) {
        console.log(`   🎨 Using layout style: ${layoutKey} for industry: ${industryKey}`);
      }
      
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

            // Cost tracking for this generation
            let totalInputTokens = 0;
            let totalOutputTokens = 0;
            let totalCost = 0;
            const MODEL_NAME = 'claude-sonnet-4-20250514';

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
                  : await buildFreshModePrompt(pageId, componentName, otherPages, description, promptConfig);

                const pageResponse = await client.messages.create({
                  model: MODEL_NAME,
                  max_tokens: 16000,
                  messages: [{ role: 'user', content: pagePrompt }]
                });

                // Track API usage from response
                if (pageResponse.usage) {
                  const inputTokens = pageResponse.usage.input_tokens || 0;
                  const outputTokens = pageResponse.usage.output_tokens || 0;
                  totalInputTokens += inputTokens;
                  totalOutputTokens += outputTokens;
                  // Calculate cost: Claude Sonnet = $3/M input, $15/M output
                  const pageCost = (inputTokens / 1000000) * 3.0 + (outputTokens / 1000000) * 15.0;
                  totalCost += pageCost;
                }

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

            // Log and save API cost tracking
            if (totalCost > 0) {
              console.log(`      💰 API Cost: $${totalCost.toFixed(4)} (${totalInputTokens} in / ${totalOutputTokens} out tokens)`);

              // Save to database if available
              if (db && db.trackApiUsage) {
                try {
                  await db.trackApiUsage({
                    projectId: null, // No project ID tracked yet
                    endpoint: 'claude-api',
                    operation: 'page-generation',
                    tokensUsed: totalInputTokens + totalOutputTokens,
                    inputTokens: totalInputTokens,
                    outputTokens: totalOutputTokens,
                    cost: totalCost,
                    durationMs: Date.now() - startTime,
                    responseStatus: 200
                  });
                  console.log(`      ✅ Cost tracked in database`);
                } catch (dbErr) {
                  console.error(`      ⚠️ Failed to track cost: ${dbErr.message}`);
                }
              }
            }

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

/**
 * Build smart context guide for AI to infer realistic content from minimal input
 * This helps Claude generate specific, realistic content even when user provides minimal details
 */
function buildSmartContextGuide(businessInput, industryName) {
  const input = (businessInput || '').toLowerCase();
  const industry = (industryName || '').toLowerCase();

  // Detect business type from input keywords
  const contextHints = [];

  // Restaurant/Food detection
  if (input.includes('pizza') || input.includes('pizzeria') || industry.includes('restaurant')) {
    contextHints.push(`
DETECTED: PIZZA/ITALIAN RESTAURANT
Generate these specific elements:
- MENU: Create 15-20 actual menu items with names like "Margherita", "Meat Lovers Supreme", "Brooklyn Special"
- PRICES: Pizzas $14-24, Appetizers $8-14, Salads $10-15, Drinks $3-5, Desserts $6-9
- SECTIONS: Pizzas, Specialty Pizzas, Calzones, Salads, Appetizers, Drinks, Desserts
- HOURS: Mon-Thu 11am-10pm, Fri-Sat 11am-11pm, Sun 12pm-9pm
- FEATURES: Dine-in, Takeout, Delivery, Catering available
- ATMOSPHERE: Family-friendly, casual Italian dining
`);
  }

  if (input.includes('dental') || input.includes('dentist') || industry.includes('dental')) {
    contextHints.push(`
DETECTED: DENTAL PRACTICE
Generate these specific elements:
- SERVICES: General Dentistry, Cosmetic Dentistry, Teeth Whitening, Dental Implants, Invisalign, Emergency Care
- TEAM: Create 3-4 dentist/hygienist profiles with realistic names and specialties
- INSURANCE: "We accept most major insurance plans including Delta, Cigna, Aetna, MetLife"
- HOURS: Mon-Fri 8am-5pm, Sat 9am-2pm (by appointment)
- FEATURES: New patient specials, Same-day appointments, Sedation dentistry available
- ATMOSPHERE: Modern, comfortable, family-friendly practice
`);
  }

  if (input.includes('law') || input.includes('attorney') || input.includes('legal') || industry.includes('legal') || industry.includes('law')) {
    contextHints.push(`
DETECTED: LAW FIRM
Generate these specific elements:
- PRACTICE AREAS: Personal Injury, Family Law, Criminal Defense, Estate Planning, Business Law
- TEAM: Create 3-5 attorney profiles with JD credentials, bar admissions, years of experience
- STATS: "Over $50M recovered for clients", "500+ cases won", "35+ years combined experience"
- CONSULTATION: Free initial consultation, No fee unless we win (for PI cases)
- HOURS: Mon-Fri 9am-6pm, 24/7 for emergencies
- ATMOSPHERE: Professional, trustworthy, client-focused
`);
  }

  if (input.includes('gym') || input.includes('fitness') || input.includes('crossfit') || industry.includes('fitness')) {
    contextHints.push(`
DETECTED: FITNESS/GYM
Generate these specific elements:
- CLASSES: CrossFit, HIIT, Spin, Yoga, Strength Training, Boxing, Personal Training
- MEMBERSHIP: Basic $29/mo, Premium $49/mo, VIP $79/mo with specific features for each
- AMENITIES: Free weights, Cardio machines, Locker rooms, Showers, Sauna, Smoothie bar
- HOURS: Mon-Fri 5am-10pm, Sat-Sun 7am-8pm
- FEATURES: Free trial class, No contract options, Personal training available
- ATMOSPHERE: Motivating, high-energy, supportive community
`);
  }

  if (input.includes('salon') || input.includes('spa') || input.includes('beauty') || industry.includes('spa') || industry.includes('salon')) {
    contextHints.push(`
DETECTED: SALON/SPA
Generate these specific elements:
- SERVICES: Haircuts $35-75, Color $85-150, Highlights $120-200, Facials $75-150, Massage $80-150, Nails $25-65
- TEAM: Create 4-6 stylist profiles with specialties and experience
- PACKAGES: Bridal packages, Spa day packages, Monthly memberships
- HOURS: Tue-Sat 9am-7pm, Sun-Mon closed
- FEATURES: Online booking, Gift cards, Loyalty program
- ATMOSPHERE: Relaxing, upscale, luxurious pampering experience
`);
  }

  if (input.includes('plumb') || input.includes('hvac') || input.includes('electric') || industry.includes('plumber') || industry.includes('home-services')) {
    contextHints.push(`
DETECTED: HOME SERVICES (Plumbing/HVAC/Electrical)
Generate these specific elements:
- SERVICES: Emergency repairs, Installation, Maintenance, Inspections
- PRICING: Service call $89, specific job estimates on common repairs
- AVAILABILITY: 24/7 emergency service, Same-day appointments
- COVERAGE: List 5-10 cities/neighborhoods served
- TRUST: Licensed, bonded, insured, background-checked technicians
- GUARANTEES: Satisfaction guaranteed, Upfront pricing, No overtime charges
`);
  }

  if (input.includes('auto') || input.includes('car') || input.includes('mechanic') || industry.includes('auto')) {
    contextHints.push(`
DETECTED: AUTO REPAIR/DEALERSHIP
Generate these specific elements:
- SERVICES: Oil changes $39.99, Brake service, Tire rotation, Engine diagnostics, A/C repair
- BRANDS: All makes and models, or specific brand specialization
- WARRANTIES: 12-month/12,000-mile warranty on repairs
- HOURS: Mon-Fri 7:30am-6pm, Sat 8am-4pm
- FEATURES: Free estimates, Loaner cars available, Shuttle service
- TRUST: ASE certified technicians, BBB A+ rating
`);
  }

  if (input.includes('tattoo') || input.includes('ink') || input.includes('body art') || industry.includes('tattoo')) {
    contextHints.push(`
DETECTED: TATTOO STUDIO
Generate these specific elements:
- ARTISTS: Create 3-5 tattoo artist profiles with UNIQUE names (like "Marcus 'Blackout' Rodriguez"), each with a specialty:
  * Traditional & Neo-Traditional
  * Photorealistic Portraits
  * Blackwork & Geometric
  * Japanese/Irezumi
  * Watercolor & Abstract
- PRICING: Custom quotes start at $150/hour, minimum $80-100, large pieces by consultation
- SERVICES: Custom tattoos, Cover-ups, Touch-ups, Consultations (free)
- HOURS: Tue-Sat 12pm-10pm, Sun-Mon by appointment only
- POLICIES: 18+ with valid ID, Deposit required, 48-hour cancellation policy
- AFTERCARE: Detailed aftercare instructions provided, Free touch-ups within 6 months
- ATMOSPHERE: Professional, clean, sterile environment, Walk-ins welcome (when available)
`);
  }

  if (input.includes('barber') || input.includes('grooming') || industry.includes('barber')) {
    contextHints.push(`
DETECTED: BARBERSHOP
Generate these specific elements:
- BARBERS: Create 3-5 barber profiles with names and specialties (fades, classic cuts, beard work)
- SERVICES: Haircut $25-35, Beard trim $15, Hot towel shave $30, Kids cut $20, Full service $50
- HOURS: Tue-Fri 9am-7pm, Sat 8am-5pm, Sun-Mon closed
- FEATURES: Walk-ins welcome, Appointments available, Cash and card accepted
- PRODUCTS: Premium pomades, beard oils, grooming kits for sale
- ATMOSPHERE: Classic barbershop vibe, sports on TV, friendly conversation
`);
  }

  if (input.includes('preschool') || input.includes('montessori') || input.includes('daycare') ||
      input.includes('childcare') || input.includes('nursery') || input.includes('kindergarten') ||
      industry.includes('preschool') || industry.includes('montessori') || industry.includes('daycare')) {
    contextHints.push(`
DETECTED: PRESCHOOL/MONTESSORI/DAYCARE
Generate these specific elements:
- PROGRAMS: Infant (6wks-12mo), Toddler (1-2yrs), Preschool (3-4yrs), Pre-K (4-5yrs), Before/After School
- CURRICULUM: Play-based learning, Montessori method, STEM activities, Art & Music, Outdoor play
- TEACHERS: Create 4-6 warm, friendly teacher profiles with education credentials (ECE certified, CPR trained)
- HOURS: Mon-Fri 6:30am-6:30pm, Year-round or School-year options
- TUITION: Full-time $1,200-1,800/mo, Part-time options available, Sibling discounts
- FEATURES: Low student-teacher ratios (1:4 for infants, 1:8 for preschool), Organic snacks, Daily reports via app
- SAFETY: Licensed, Background-checked staff, Secure entry, Video monitoring
- GALLERY: Show children learning, art projects, playground activities, circle time, reading corners
- ATMOSPHERE: Nurturing, educational, safe, fun learning environment
`);
  }

  if (input.includes('education') || input.includes('school') || input.includes('academy') ||
      input.includes('tutoring') || input.includes('learning center') ||
      industry.includes('education') || industry.includes('tutoring')) {
    contextHints.push(`
DETECTED: EDUCATION/TUTORING CENTER
Generate these specific elements:
- PROGRAMS: Math tutoring, Reading/Writing, Test prep (SAT/ACT), STEM enrichment, Language classes
- GRADE LEVELS: Elementary, Middle School, High School, College prep
- INSTRUCTORS: Create 4-6 teacher profiles with degrees and teaching experience
- FORMATS: 1-on-1 tutoring, Small groups (3-5 students), Online sessions, In-home tutoring
- PRICING: $50-100/hour for individual, $30-50/hour for group sessions, Package discounts
- HOURS: Mon-Fri 3pm-8pm, Sat 9am-5pm (peak after-school hours)
- RESULTS: "Students improve 2+ grade levels", "95% see improvement within 3 months"
- FEATURES: Free assessment, Progress tracking, Homework help, Flexible scheduling
- GALLERY: Show students studying, classroom activities, graduation celebrations
- ATMOSPHERE: Supportive, encouraging, academic excellence focus
`);
  }

  // Default guidance if no specific type detected
  if (contextHints.length === 0) {
    contextHints.push(`
GENERAL BUSINESS - Infer from the name and industry:
- Create 6-10 specific services/products with realistic prices
- Generate 3-4 team member profiles with realistic names and roles
- Include specific business hours appropriate for the industry
- Add realistic stats: years in business (10-25), customers served (1000+), rating (4.8+ stars)
- Create 3-4 testimonials with first names and specific praise
- Include specific location/service area details
`);
  }

  return contextHints.join('\n');
}

/**
 * Build layout context from frontend preview configuration
 * This converts the frontend's layoutStylePreview into AI prompt instructions
 */
function buildLayoutContextFromPreview(layoutId, previewConfig, industryKey) {
  const heroStyleMap = {
    'full': 'Full-bleed hero image with overlay text',
    'split': 'Split layout with text on left, image on right',
    'minimal': 'Minimal hero with clean typography focus',
    'corporate': 'Professional corporate hero with subtle imagery',
    'warm': 'Warm, welcoming hero with friendly imagery',
    'clean': 'Clean, modern hero with plenty of whitespace',
    'team': 'Team-focused hero showcasing professionals',
    'overlay': 'Image with gradient overlay and centered text'
  };

  const contentStyleMap = {
    'formal': 'Formal, professional content presentation',
    'results': 'Results-driven with case studies and testimonials',
    'services': 'Services-focused with clear offerings grid',
    'caring': 'Warm, compassionate content for patient/client trust',
    'personal': 'Personal, human-centered content approach'
  };

  const ctaStyleMap = {
    'overlay': 'CTA button overlaid on hero image',
    'button': 'Prominent CTA buttons below hero',
    'prominent': 'Large, eye-catching CTA section',
    'subtle': 'Subtle, professional CTA placement',
    'consultation': 'Free consultation CTA emphasis',
    'booking': 'Easy booking/appointment CTA'
  };

  const heroDesc = heroStyleMap[previewConfig.heroStyle] || 'Modern hero section';
  const contentDesc = contentStyleMap[previewConfig.contentStyle] || '';
  const ctaDesc = ctaStyleMap[previewConfig.ctaStyle] || 'Clear call-to-action';
  const menuPosition = previewConfig.menuPosition ? `Menu position: ${previewConfig.menuPosition}` : '';

  return `
═══════════════════════════════════════════════════════════════
SELECTED LAYOUT STYLE: ${layoutId.replace(/-/g, ' ').toUpperCase()}
═══════════════════════════════════════════════════════════════

HERO SECTION STYLE:
${heroDesc}
${previewConfig.heroStyle === 'full' ? '- Use a dramatic full-width background image\n- Text should be white with text-shadow for readability\n- Include gradient overlay for text contrast' : ''}
${previewConfig.heroStyle === 'split' ? '- Two-column layout: compelling headline on left, visual on right\n- Clean separation between text and image areas' : ''}
${previewConfig.heroStyle === 'minimal' ? '- Focus on typography, minimal imagery\n- Lots of whitespace, clean and elegant\n- Let the copy speak for itself' : ''}

${contentDesc ? `CONTENT STYLE:\n${contentDesc}` : ''}

CTA APPROACH:
${ctaDesc}
${menuPosition}

IMPORTANT: The user specifically chose the "${layoutId.replace(/-/g, ' ')}" layout.
Follow these style guidelines closely when generating the hero and page structure.
═══════════════════════════════════════════════════════════════
`;
}

/**
 * Extract statistics from business description text
 * Parses numbers and context to provide realistic stats for the AI
 */
function extractBusinessStats(businessText, industryName) {
  if (!businessText) {
    return generateDefaultStats(industryName);
  }

  const stats = [];
  const text = businessText.toLowerCase();

  // Pattern matchers for common stat phrases
  const patterns = [
    // Years of experience
    { regex: /(\d+)\+?\s*(?:years?|yrs?)(?:\s+(?:of\s+)?(?:experience|in business|combined))?/gi, label: 'Years Experience', suffix: '+ Years' },
    { regex: /(?:since|established|founded|opened)\s*(?:in\s+)?(\d{4})/gi, type: 'year', label: 'Years in Business', suffix: '+ Years' },
    { regex: /(\d+)\+?\s*(?:years?|yrs?)\s*(?:combined|of combined)/gi, label: 'Combined Experience', suffix: '+ Years' },

    // Reviews and ratings
    { regex: /(\d+)\+?\s*(?:5-star|five star|★+)\s*reviews?/gi, label: 'Reviews', suffix: '+ 5-Star Reviews' },
    { regex: /(\d+)\+?\s*reviews?/gi, label: 'Reviews', suffix: '+ Reviews' },
    { regex: /(\d+(?:\.\d+)?)\s*(?:star|★)\s*(?:rating|average)/gi, label: 'Rating', suffix: ' Stars' },

    // Customers/Clients
    { regex: /(\d+(?:,\d{3})*)\+?\s*(?:happy\s+)?(?:customers?|clients?|families|patients?)/gi, label: 'Customers', suffix: '+ Happy Customers' },
    { regex: /served\s+(?:over\s+)?(\d+(?:,\d{3})*)\+?/gi, label: 'Customers Served', suffix: '+ Served' },

    // Projects/Jobs
    { regex: /(\d+(?:,\d{3})*)\+?\s*(?:projects?|jobs?|homes?|cases?|installations?)/gi, label: 'Projects', suffix: '+ Projects' },
    { regex: /completed\s+(?:over\s+)?(\d+(?:,\d{3})*)\+?/gi, label: 'Completed', suffix: '+ Completed' },

    // Team
    { regex: /(\d+)\+?\s*(?:team\s+members?|employees?|staff|professionals?|experts?|technicians?)/gi, label: 'Team', suffix: '+ Team Members' },

    // Satisfaction
    { regex: /(\d+)%\s*(?:satisfaction|success|retention|customer\s+satisfaction)/gi, label: 'Satisfaction', suffix: '% Satisfaction' },

    // Awards
    { regex: /(\d+)\+?\s*awards?/gi, label: 'Awards', suffix: '+ Awards' },

    // Locations
    { regex: /(\d+)\+?\s*locations?/gi, label: 'Locations', suffix: '+ Locations' },

    // Products/Services
    { regex: /(\d+)\+?\s*(?:products?|services?|menu items?)/gi, label: 'Products', suffix: '+ Products' }
  ];

  const foundStats = {};

  for (const pattern of patterns) {
    const matches = [...businessText.matchAll(pattern.regex)];
    for (const match of matches) {
      let value = match[1];

      // Handle "since YEAR" pattern
      if (pattern.type === 'year') {
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        value = currentYear - year;
      } else {
        // Remove commas and parse
        value = parseInt(value.replace(/,/g, ''));
      }

      if (value > 0 && !foundStats[pattern.label]) {
        foundStats[pattern.label] = { value, suffix: pattern.suffix };
      }
    }
  }

  // Build the stats context string
  if (Object.keys(foundStats).length > 0) {
    let result = 'EXTRACTED STATS FROM BUSINESS DESCRIPTION (USE THESE!):\n';
    for (const [label, data] of Object.entries(foundStats)) {
      result += `- ${label}: ${data.value}${data.suffix}\n`;
      stats.push(`<AnimatedCounter end={${data.value}} suffix="${data.suffix}" duration={2} />`);
    }
    result += '\nUSE THESE EXACT NUMBERS in AnimatedCounter components!\n';
    return result;
  }

  // No stats found - generate industry-appropriate defaults
  return generateDefaultStats(industryName);
}

/**
 * Generate realistic default stats based on industry
 */
function generateDefaultStats(industryName) {
  const industry = (industryName || '').toLowerCase();

  let defaults = {
    years: 15,
    customers: 1000,
    satisfaction: 98,
    extra: null
  };

  // Industry-specific defaults
  if (industry.includes('tattoo') || industry.includes('ink') || industry.includes('body art')) {
    defaults = { years: 8, customers: 5000, satisfaction: 99, extra: { label: 'Custom Designs', value: 10000 } };
  } else if (industry.includes('barber') || industry.includes('hair') || industry.includes('salon') || industry.includes('grooming')) {
    defaults = { years: 12, customers: 2700, satisfaction: 98, extra: { label: 'Master Barbers', value: 4 } };
  } else if (industry.includes('law') || industry.includes('legal')) {
    defaults = { years: 25, customers: 500, satisfaction: 98, extra: { label: 'Cases Won', value: 250 } };
  } else if (industry.includes('restaurant') || industry.includes('food') || industry.includes('pizza')) {
    defaults = { years: 10, customers: 5000, satisfaction: 97, extra: { label: 'Dishes Served', value: 50000 } };
  } else if (industry.includes('fitness') || industry.includes('gym')) {
    defaults = { years: 8, customers: 2000, satisfaction: 96, extra: { label: 'Transformations', value: 500 } };
  } else if (industry.includes('medical') || industry.includes('health') || industry.includes('dental')) {
    defaults = { years: 20, customers: 3000, satisfaction: 99, extra: { label: 'Procedures', value: 10000 } };
  } else if (industry.includes('plumb') || industry.includes('hvac') || industry.includes('electric')) {
    defaults = { years: 15, customers: 2500, satisfaction: 98, extra: { label: 'Jobs Completed', value: 5000 } };
  } else if (industry.includes('bowl') || industry.includes('arcade') || industry.includes('entertainment')) {
    defaults = { years: 12, customers: 10000, satisfaction: 95, extra: { label: 'Parties Hosted', value: 2000 } };
  } else if (industry.includes('retail') || industry.includes('shop')) {
    defaults = { years: 10, customers: 5000, satisfaction: 96, extra: { label: 'Products', value: 500 } };
  } else if (industry.includes('consult') || industry.includes('professional')) {
    defaults = { years: 20, customers: 300, satisfaction: 99, extra: { label: 'Projects', value: 150 } };
  } else if (industry.includes('auto') || industry.includes('car') || industry.includes('mechanic')) {
    defaults = { years: 18, customers: 4000, satisfaction: 97, extra: { label: 'Vehicles Serviced', value: 8000 } };
  } else if (industry.includes('spa') || industry.includes('beauty') || industry.includes('wellness')) {
    defaults = { years: 10, customers: 3500, satisfaction: 98, extra: { label: 'Treatments', value: 15000 } };
  } else if (industry.includes('pet') || industry.includes('vet') || industry.includes('grooming')) {
    defaults = { years: 8, customers: 2000, satisfaction: 99, extra: { label: 'Happy Pets', value: 5000 } };
  } else if (industry.includes('preschool') || industry.includes('montessori') || industry.includes('daycare') ||
             industry.includes('childcare') || industry.includes('nursery') || industry.includes('kindergarten')) {
    defaults = { years: 12, customers: 500, satisfaction: 99, extra: { label: 'Graduates', value: 1500 } };
  } else if (industry.includes('education') || industry.includes('school') || industry.includes('academy') ||
             industry.includes('tutoring') || industry.includes('learning')) {
    defaults = { years: 15, customers: 1000, satisfaction: 97, extra: { label: 'Students Taught', value: 5000 } };
  }

  let result = `NO SPECIFIC STATS FOUND - USE THESE REALISTIC DEFAULTS FOR ${industryName || 'BUSINESS'}:
- Years in Business: ${defaults.years}+ Years
- Customers Served: ${defaults.customers}+ Happy Customers
- Satisfaction Rate: ${defaults.satisfaction}%+ Satisfaction`;

  if (defaults.extra) {
    result += `\n- ${defaults.extra.label}: ${defaults.extra.value}+`;
  }

  result += `

IMPORTANT: These are MINIMUM realistic values. Feel free to adjust slightly higher.
NEVER use 0 or placeholder text like "X" - always use real numbers!`;

  return result;
}

/**
 * Generate CONTEXT-AWARE industry-specific image URLs
 * Returns different images for hero, team, gallery, services based on context
 */
function getIndustryImageUrls(industryName) {
  const industry = (industryName || '').toLowerCase();

  // Context-aware image configurations - different images for different page sections
  const imageConfig = {
    tattoo: {
      hero: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=1920', // Tattoo studio interior
      heroVideo: 'https://videos.pexels.com/video-files/5319884/5319884-hd_1920_1080_30fps.mp4', // Tattoo artist working
      team: [
        'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800', // Tattoo artist working
        'https://images.unsplash.com/photo-1590246814883-57764f7f17c9?w=800', // Tattooed person portrait
        'https://images.unsplash.com/photo-1542727365-19732a80dcfd?w=800', // Artist with tattoo machine
        'https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?w=800'  // Tattooed professional
      ],
      gallery: [
        'https://images.unsplash.com/photo-1562962230-16e4623d36e6?w=800', // Tattoo closeup
        'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=800', // Arm tattoo
        'https://images.unsplash.com/photo-1475403614135-5f1aa0eb5015?w=800', // Back tattoo
        'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800'  // Detailed tattoo work
      ],
      services: [
        'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800', // Tattooing in progress
        'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800'  // Studio setup
      ],
      searchTerms: ['tattoo artist', 'tattoo studio', 'tattooing', 'tattoo art', 'inked']
    },
    barbershop: {
      hero: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920',
      heroVideo: 'https://videos.pexels.com/video-files/3993451/3993451-uhd_2560_1440_25fps.mp4', // Barber cutting hair
      team: [
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800', // Barber at work
        'https://images.unsplash.com/photo-1567894340315-735d7c361db0?w=800', // Barber portrait
        'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800', // Barber styling
        'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=800'  // Barber with client
      ],
      gallery: [
        'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800', // Barber tools
        'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800', // Shop interior
        'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800'  // Styling
      ],
      services: [
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800',
        'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800'
      ],
      searchTerms: ['barbershop', 'barber cutting hair', 'mens grooming', 'barber portrait']
    },
    salon: {
      hero: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920',
      team: [
        'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800', // Stylist working
        'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800', // Hairstylist portrait
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'  // Salon professional
      ],
      gallery: [
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
        'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800'
      ],
      services: [
        'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800',
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'
      ],
      searchTerms: ['hair salon', 'hairstylist', 'hair cutting', 'salon professional']
    },
    restaurant: {
      hero: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920',
      heroVideo: 'https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4', // Chef plating food
      team: [
        'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800', // Chef portrait
        'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=800', // Chef cooking
        'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800'  // Kitchen staff
      ],
      gallery: [
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800', // Food plating
        'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800', // Dish
        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800'  // Food
      ],
      services: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800'
      ],
      searchTerms: ['restaurant interior', 'chef cooking', 'fine dining', 'chef portrait']
    },
    pizza: {
      hero: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=1920',
      heroVideo: 'https://videos.pexels.com/video-files/4253291/4253291-uhd_2560_1440_25fps.mp4', // Pizza being made
      team: [
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', // Pizza chef
        'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800'  // Pizza making
      ],
      gallery: [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
        'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800'
      ],
      services: [
        'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=800'
      ],
      searchTerms: ['pizza chef', 'pizzeria', 'pizza making', 'italian restaurant']
    },
    dental: {
      hero: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1920',
      team: [
        'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800', // Dentist portrait
        'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800', // Dental team
        'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800'  // Dentist working
      ],
      gallery: [
        'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800',
        'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800'
      ],
      services: [
        'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800'
      ],
      searchTerms: ['dentist', 'dental office', 'dental team', 'dental professional']
    },
    fitness: {
      hero: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920',
      heroVideo: 'https://videos.pexels.com/video-files/4761434/4761434-uhd_2560_1440_25fps.mp4', // Gym workout
      team: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', // Personal trainer
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', // Trainer portrait
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800'  // Fitness coach
      ],
      gallery: [
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800'
      ],
      services: [
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'
      ],
      searchTerms: ['personal trainer', 'fitness coach', 'gym trainer', 'workout instructor']
    },
    auto: {
      hero: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920',
      team: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', // Mechanic
        'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800'  // Auto tech
      ],
      gallery: [
        'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
      ],
      services: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
      ],
      searchTerms: ['auto mechanic', 'car repair', 'mechanic portrait', 'auto technician']
    },
    law: {
      hero: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920',
      team: [
        'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800', // Attorney portrait
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800', // Lawyer
        'https://images.unsplash.com/photo-1521791055366-0d553872125f?w=800'  // Legal professional
      ],
      gallery: [
        'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800',
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800'
      ],
      services: [
        'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800'
      ],
      searchTerms: ['attorney', 'law firm', 'lawyer portrait', 'legal professional']
    },
    spa: {
      hero: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920',
      heroVideo: 'https://videos.pexels.com/video-files/3188167/3188167-uhd_2560_1440_25fps.mp4', // Spa massage treatment
      team: [
        'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800', // Spa therapist
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800'  // Wellness professional
      ],
      gallery: [
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800'
      ],
      services: [
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800'
      ],
      searchTerms: ['spa therapist', 'massage therapist', 'wellness professional', 'spa treatment']
    },
    // Education - Preschool, Montessori, Daycare, Learning Centers
    education: {
      hero: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1920', // Children learning
      team: [
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800', // Teacher with students
        'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800', // Teacher smiling
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800', // Educator portrait
        'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800'  // Teacher helping student
      ],
      gallery: [
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', // Children learning
        'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800', // Art project
        'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800', // Classroom activities
        'https://images.unsplash.com/photo-1564429238607-4a7e00ead26a?w=800', // Children playing
        'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800', // Reading time
        'https://images.unsplash.com/photo-1602052793312-b99c2a9ee797?w=800'  // Group activity
      ],
      services: [
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800'
      ],
      searchTerms: ['preschool classroom', 'children learning', 'montessori', 'daycare activities', 'kids art project']
    },
    // Preschool/Montessori specific (alias with child-specific images)
    preschool: {
      hero: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1920', // Kids in classroom
      team: [
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800', // Teacher with children
        'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800', // Teacher reading
        'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800', // Friendly teacher
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800'  // Educator
      ],
      gallery: [
        'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800', // Art activity
        'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800', // Circle time
        'https://images.unsplash.com/photo-1564429238607-4a7e00ead26a?w=800', // Playground
        'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800', // Story time
        'https://images.unsplash.com/photo-1602052793312-b99c2a9ee797?w=800', // Music class
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', // Learning center
        'https://images.unsplash.com/photo-1567057419565-4349c49d8a04?w=800', // Sensory play
        'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800'  // Happy children
      ],
      services: [
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
        'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800'
      ],
      searchTerms: ['preschool', 'montessori classroom', 'toddler activities', 'early childhood', 'daycare']
    },
    default: {
      hero: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920',
      team: [
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800', // Business team
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', // Professional portrait
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800'  // Team member
      ],
      gallery: [
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800'
      ],
      services: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'
      ],
      searchTerms: ['business professional', 'team portrait', 'office', 'professional headshot']
    }
  };

  // Match industry to config with expanded matching
  let config = imageConfig.default;
  if (industry.includes('tattoo') || industry.includes('ink') || industry.includes('body art')) {
    config = imageConfig.tattoo;
  } else if (industry.includes('barber') || industry.includes('grooming')) {
    config = imageConfig.barbershop;
  } else if (industry.includes('salon') || industry.includes('hair') || industry.includes('beauty')) {
    config = imageConfig.salon;
  } else if (industry.includes('pizza') || industry.includes('pizzeria')) {
    config = imageConfig.pizza;
  } else if (industry.includes('restaurant') || industry.includes('food') || industry.includes('dining') || industry.includes('cafe')) {
    config = imageConfig.restaurant;
  } else if (industry.includes('dental') || industry.includes('dentist')) {
    config = imageConfig.dental;
  } else if (industry.includes('fitness') || industry.includes('gym') || industry.includes('yoga')) {
    config = imageConfig.fitness;
  } else if (industry.includes('auto') || industry.includes('car') || industry.includes('mechanic')) {
    config = imageConfig.auto;
  } else if (industry.includes('law') || industry.includes('legal') || industry.includes('attorney')) {
    config = imageConfig.law;
  } else if (industry.includes('spa') || industry.includes('wellness') || industry.includes('massage')) {
    config = imageConfig.spa;
  } else if (industry.includes('preschool') || industry.includes('montessori') || industry.includes('daycare') ||
             industry.includes('childcare') || industry.includes('nursery') || industry.includes('early childhood') ||
             industry.includes('kindergarten') || industry.includes('toddler')) {
    config = imageConfig.preschool;
  } else if (industry.includes('education') || industry.includes('school') || industry.includes('academy') ||
             industry.includes('tutoring') || industry.includes('learning center')) {
    config = imageConfig.education;
  }

  // Return with backward compatibility (hero and secondary) PLUS new context-specific fields
  return {
    hero: config.hero,
    heroVideo: config.heroVideo || null, // Video background for supported industries
    secondary: config.gallery || config.team, // Backward compat
    team: config.team,
    gallery: config.gallery,
    services: config.services,
    searchTerms: config.searchTerms
  };
}

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

async function buildFreshModePrompt(pageId, pageName, otherPages, description, promptConfig) {
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

  // EXTRACT INDUSTRY LAYOUT CONFIG (support both layoutKey and layoutStyleId from frontend)
  const industryLayoutKey = description.industryKey || null;
  const selectedLayoutKey = description.layoutStyleId || description.layoutKey || null;
  const layoutStylePreview = description.layoutStylePreview || null;

  // Build layout context - prefer frontend preview config, fallback to industry-layouts.cjs
  let layoutContext = '';
  if (layoutStylePreview && selectedLayoutKey) {
    // Use the frontend's preview configuration directly
    layoutContext = buildLayoutContextFromPreview(selectedLayoutKey, layoutStylePreview, industryLayoutKey);
  } else if (industryLayoutKey) {
    // Fallback to industry-layouts.cjs
    layoutContext = buildLayoutContext(industryLayoutKey, selectedLayoutKey);
  }

  // Extract stats from business description
  const businessText = description.text || '';
  const extractedStats = extractBusinessStats(businessText, industry.name);

  // Build smart context inference for minimal input
  const businessInput = description.text || 'A professional business';
  const smartContextGuide = buildSmartContextGuide(businessInput, industry.name);

  // Get industry-specific CONTEXT-AWARE image URLs
  const industryImages = getIndustryImageUrls(industry.name || businessInput);

  // Check if user enabled video hero (from UI toggle)
  const enableVideoHero = description.enableVideoHero === true;

  // If no hardcoded video available but video is enabled, try dynamic Pexels fetch
  if (enableVideoHero && !industryImages.heroVideo) {
    console.log('   🎬 No hardcoded video - trying dynamic Pexels fetch...');
    const dynamicVideoUrl = await getIndustryVideo(industry.name || '', businessInput);
    if (dynamicVideoUrl) {
      industryImages.heroVideo = dynamicVideoUrl;
      console.log('   ✅ Using dynamic Pexels video');
    }
  }

  const hasVideoAvailable = !!industryImages.heroVideo;

  // Build video context ONLY if video is enabled AND available
  let videoContext = '';
  if (enableVideoHero && hasVideoAvailable) {
    videoContext = `
══════════════════════════════════════════════════════════════
🎬 VIDEO BACKGROUND ENABLED - USE THIS FOR HOME PAGE HERO!
══════════════════════════════════════════════════════════════
The user has ENABLED video background for the home page hero!

VIDEO URL: ${industryImages.heroVideo}
POSTER IMAGE (fallback): ${industryImages.hero}

HOW TO USE VideoBackground COMPONENT:
import { VideoBackground } from '../effects';

<VideoBackground
  videoSrc="${industryImages.heroVideo}"
  posterImage="${industryImages.hero}"
  overlay="linear-gradient(rgba(10, 22, 40, 0.7), rgba(10, 22, 40, 0.85))"
  height="100vh"
>
  {/* Hero content goes here */}
  <h1>Your Headline</h1>
  <p>Your tagline</p>
  <button>CTA Button</button>
</VideoBackground>

IMPORTANT VIDEO RULES:
1. USE VideoBackground on the HOME PAGE hero section (user requested this!)
2. Other pages should use static images (ParallaxSection or regular backgrounds)
3. The video autoplays muted and loops - perfect for ambiance
4. On mobile, it automatically falls back to the poster image
5. Always include a dark overlay for text readability
══════════════════════════════════════════════════════════════
`;
  } else if (hasVideoAvailable && !enableVideoHero) {
    // Video available but user disabled it
    videoContext = `
NOTE: Video background is available for this industry but user has DISABLED it.
Use static image backgrounds instead (ParallaxSection or backgroundImage).
`;
  }

  const imageContext = `
══════════════════════════════════════════════════════════════
CONTEXT-AWARE IMAGES - USE THE RIGHT IMAGE FOR EACH SECTION
══════════════════════════════════════════════════════════════
${videoContext}
🎯 HERO/HEADER SECTION - Use atmospheric, wide shots:
${industryImages.hero}

👥 TEAM/ARTIST/STAFF SECTION - Use portraits of ACTUAL professionals in this industry:
${(industryImages.team || []).map((url, i) => `Team Member ${i + 1}: ${url}`).join('\n')}
CRITICAL: For tattoo studios, use tattoo artist photos. For barbershops, use barber photos.
NEVER use random stock photos of people stretching or unrelated activities!

🖼️ GALLERY/PORTFOLIO SECTION - Use work examples:
${(industryImages.gallery || []).map((url, i) => `Gallery ${i + 1}: ${url}`).join('\n')}

🛠️ SERVICES SECTION - Use action shots of the work being done:
${(industryImages.services || []).map((url, i) => `Service ${i + 1}: ${url}`).join('\n')}

🔍 SEARCH TERMS for additional images: ${industryImages.searchTerms.join(', ')}

══════════════════════════════════════════════════════════════
CRITICAL IMAGE MATCHING RULES:
══════════════════════════════════════════════════════════════
1. TEAM PAGES: Use ONLY the team images above - they show actual professionals in this industry
2. HERO: Use the hero image for big background sections
3. GALLERY: Use gallery images for portfolio/work showcases
4. SERVICES: Use service images to illustrate what you offer
5. NEVER mix contexts - don't put a yoga stretch photo on a tattoo artist page!
6. NEVER use generic Unsplash URLs - always use the industry-specific ones above
7. Format: url("IMAGE_URL") for CSS backgrounds or src="IMAGE_URL" for img tags

For TATTOO STUDIOS specifically:
- Team section: Use photos of tattoo artists working or portraits of tattooed professionals
- Gallery: Use closeup shots of completed tattoos
- Hero: Use studio interior with tattoo equipment visible

For PRESCHOOLS/MONTESSORI/DAYCARE specifically:
- Team section: Use photos of teachers with children, warm educator portraits
- Gallery: Use photos of children learning, art projects, classroom activities, playground
- Hero: Use bright, colorful classroom or children engaged in activities
- NEVER use generic stock business photos - always show children and educators

For EDUCATION/SCHOOLS specifically:
- Team section: Use photos of teachers, educators, tutors in teaching environments
- Gallery: Use photos of students learning, classroom settings, study groups
- Hero: Use academic settings with students engaged in learning
══════════════════════════════════════════════════════════════
`;

  // ==========================================
  // NEW: High-impact question context
  // ==========================================
  const teamSize = description.teamSize || null;
  const priceRange = description.priceRange || null;
  const yearsEstablished = description.yearsEstablished || null;
  const inferredDetails = description.inferredDetails || null;
  const location = description.location || null;
  const targetAudience = description.targetAudience || [];
  const primaryCTA = description.primaryCTA || 'contact';
  const tone = description.tone || 'balanced';

  // Build business context from high-impact questions
  let businessContext = '';

  if (teamSize || priceRange || yearsEstablished || location) {
    businessContext = `
══════════════════════════════════════════════════════════════
BUSINESS DETAILS - USE THESE FOR ACCURATE CONTENT
══════════════════════════════════════════════════════════════
`;
    if (location) {
      businessContext += `📍 LOCATION: ${location} - Customize content for this area\n`;
    }
    if (teamSize) {
      const teamSizeMap = {
        'solo': '1 person (solo operator) - use "I" language, personal touch',
        'small': '2-4 people - use "our small team" language, close-knit feel',
        'medium': '5-10 people - use "our team" language, established feel',
        'large': '10+ people - use "our professionals" language, corporate feel'
      };
      businessContext += `👥 TEAM SIZE: ${teamSizeMap[teamSize] || teamSize}\n`;
    }
    if (priceRange) {
      const priceMap = {
        'budget': 'Budget-friendly ($) - emphasize value, affordability, competitive pricing',
        'mid': 'Mid-range ($$) - balance quality and value, mainstream pricing',
        'premium': 'Premium ($$$) - emphasize quality, expertise, worth the investment',
        'luxury': 'Luxury ($$$$) - exclusive, high-end, bespoke, elite experience'
      };
      businessContext += `💰 PRICE RANGE: ${priceMap[priceRange] || priceRange}\n`;
    }
    if (yearsEstablished) {
      const yearsMap = {
        'new': 'Just starting - emphasize fresh perspective, modern approach, passion',
        'growing': '1-5 years - emphasize momentum, proven results, growing reputation',
        'established': '5-15 years - emphasize experience, track record, trusted expertise',
        'veteran': '15+ years - emphasize legacy, unmatched experience, industry leader'
      };
      businessContext += `⏱️ EXPERIENCE: ${yearsMap[yearsEstablished] || yearsEstablished}\n`;
    }
    if (targetAudience.length > 0) {
      businessContext += `🎯 TARGET AUDIENCE: ${targetAudience.join(', ')}\n`;
    }
    if (primaryCTA && primaryCTA !== 'contact') {
      const ctaMap = {
        'book': 'Book Appointment - make booking CTA prominent',
        'call': 'Call Now - show phone number prominently',
        'quote': 'Get a Quote - emphasize free quotes/estimates',
        'buy': 'Buy/Order Now - shopping/ordering focus',
        'visit': 'Visit Location - directions and map prominent'
      };
      businessContext += `👆 PRIMARY CTA: ${ctaMap[primaryCTA] || primaryCTA}\n`;
    }
    businessContext += `🎭 TONE: ${tone}\n`;
    businessContext += `══════════════════════════════════════════════════════════════\n`;
  }

  return `You are a high-end UI/UX Architect. Create a stunning, unique ${pageId} page.

BUSINESS INPUT: ${businessInput}
INDUSTRY: ${industry.name || 'Business'}
VIBE: ${industry.vibe || 'Unique and modern'}
${businessContext}

══════════════════════════════════════════════════════════════
CRITICAL: SMART CONTENT INFERENCE - USE COMMON SENSE!
══════════════════════════════════════════════════════════════
${smartContextGuide}

INFERENCE RULES:
1. If the user only gave a name like "Mario's Pizza" - YOU must infer:
   - It's a pizzeria/Italian restaurant
   - Create a realistic menu with actual pizza names, prices ($14-22), toppings
   - Include appetizers, salads, drinks, desserts with realistic prices
   - Add realistic hours (11am-10pm), delivery info, location feel

2. If minimal input like "Brooklyn Dental" - YOU must infer:
   - It's a dental practice
   - List services: cleanings, fillings, crowns, whitening, implants
   - Add insurance info, new patient specials, emergency care
   - Professional but welcoming atmosphere

3. KEYWORD EXPANSION - If user provides keywords or short phrases, EXPAND them into full content:
   - "fast, reliable, 24/7" → "Your emergency is our priority. Available 24/7, our team arrives fast and fixes it right the first time."
   - "family owned, 30 years" → "Family-owned and operated since 1994, we've built our reputation on honest work and lasting relationships."
   - "organic, locally sourced" → "We source our ingredients from local organic farms, ensuring every dish is fresh, sustainable, and bursting with natural flavor."
   - Take any keywords the user provides and weave them into compelling, professional copy.

4. NEVER generate generic placeholder content like:
   - "Lorem ipsum" or "[Business Name]"
   - "Service 1, Service 2, Service 3"
   - "$XX.XX" or "Call for pricing"
   - "123 Main Street" (use realistic addresses)

4. ALWAYS generate specific, realistic, industry-appropriate content:
   - Real menu items with creative names and accurate prices
   - Specific service descriptions with typical pricing
   - Realistic business hours for the industry
   - Genuine-sounding testimonials with first names

${rebuildContext}${inspiredContext}${assetsContext}${extraDetailsContext}${layoutContext}${imageContext}
══════════════════════════════════════════════════════════════
CRITICAL: STATISTICS & NUMBERS - NEVER USE ZEROS!
══════════════════════════════════════════════════════════════
${extractedStats}

STAT RULES - FOLLOW EXACTLY:
1. NEVER show "0", "0+", "1%", or single-digit numbers (except for team size)
2. ALWAYS use numbers from above OR these industry-appropriate minimums:
   - Years in business: 10+ to 25+ (never below 5)
   - Customers served: 2,000+ to 10,000+ (never below 500)
   - Satisfaction rate: 95% to 99% (never below 90%)
   - Team members: 4 to 25 (realistic for business size)

CORRECT AnimatedCounter EXAMPLES - COPY THIS EXACT PATTERN:
<AnimatedCounter end={12} suffix="+ Years" duration={2} />
<AnimatedCounter end={2700} suffix="+ Happy Clients" duration={2.5} />
<AnimatedCounter end={98} suffix="%" duration={2} />  {/* For percentages */}
<AnimatedCounter end={4} suffix=" Master Barbers" duration={1.5} />

NOTE: duration is in SECONDS (not milliseconds). Use 2 for 2 seconds.

WRONG EXAMPLES - NEVER DO THIS:
<AnimatedCounter end={0} suffix="+ Years" />  ❌ Zero is broken
<AnimatedCounter end={27} suffix="+ Clients" />  ❌ Too small, use 2700
<AnimatedCounter end={1} suffix="%" />  ❌ 1% satisfaction is insulting
<AnimatedCounter end={12} duration={2000} />  ❌ 2000 seconds is way too long!

FOR A BARBERSHOP, USE THESE EXACT STATS:
- Years: 12+ Years Experience
- Clients: 2,700+ Satisfied Clients
- Team: 4 Master Barbers
- Rating: 98% Client Satisfaction

══════════════════════════════════════════════════════════════
CRITICAL: INDUSTRY-SPECIFIC DESIGN - NOT A GENERIC TEMPLATE!
══════════════════════════════════════════════════════════════
DO NOT use the same layout structure for every industry. A bowling alley should look COMPLETELY DIFFERENT from a law firm.

LAYOUT VARIATION RULES:
1. READ the industry guidance below and FOLLOW IT - each industry has specific section orders and emphasis.
2. VARY the section structure based on what matters most to THIS business type:
   - Entertainment venues: Fun first! Bold colors, large booking CTAs, party packages prominent
   - Professional services: Trust first! Credentials, testimonials, case studies prominent
   - Restaurants: Menu first! Food imagery, reservation CTA, ambiance gallery
   - Fitness: Motivation first! Action imagery, class schedules, membership comparisons
   - Retail: Products first! Large product grids, shopping CTAs, featured items

3. DIFFERENT industries need DIFFERENT hero treatments:
   - Fun venues: Neon effects, bold headlines, animated elements, video backgrounds
   - Professionals: Clean, minimal, trust-focused, subtle imagery
   - Restaurants: Full-bleed food photography, warm overlays
   - Fitness: Dynamic action shots, dark/dramatic, motivational text
   - Retail: Product-focused, clean grids, shopping-oriented

4. SECTION ORDER should vary by industry - don't always do Hero → About → Services → Contact

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

import { ScrollReveal, AnimatedCounter, StaggeredList, ParallaxSection, TiltCard, GlowEffect, VideoBackground } from '../effects';

AVAILABLE EFFECTS:
- <ScrollReveal> - Wrap sections to fade-in on scroll
- <AnimatedCounter end={500} suffix="+" duration={2} /> - Animate numbers counting up (duration in SECONDS)
- <StaggeredList items={array} renderItem={(item) => <Card />} /> - Stagger children animations
- <ParallaxSection imageSrc="url" height="60vh"> - Parallax background sections
- <TiltCard> - 3D tilt effect on hover for cards
- <GlowEffect color="#22c55e"> - Glowing border on hover
- <VideoBackground videoSrc="url" posterImage="url" overlay="rgba()" height="100vh"> - Video hero backgrounds (HOME PAGE ONLY)

REQUIRED USAGE:
- Home pages: Use AnimatedCounter for ALL statistics (years, customers, etc.)
- Home pages: Wrap at least 2 sections with <ScrollReveal>
- Home pages: If VIDEO URL is provided above, use VideoBackground for the hero!
- Service/Menu pages: Use ScrollReveal on the cards grid
- About pages: AnimatedCounter for company stats

EXAMPLE (Static Hero):
<ScrollReveal>
  <section style={styles.stats}>
    <AnimatedCounter end={14} suffix=" Years" duration={2} />
    <AnimatedCounter end={5000} suffix="+ Customers" duration={2.5} />
  </section>
</ScrollReveal>

EXAMPLE (Video Hero - for HOME PAGE when video URL available):
<VideoBackground
  videoSrc="VIDEO_URL_FROM_ABOVE"
  posterImage="HERO_IMAGE_URL"
  overlay="linear-gradient(rgba(10, 22, 40, 0.7), rgba(10, 22, 40, 0.85))"
  height="100vh"
>
  <div style={{ textAlign: 'center', color: 'white', maxWidth: '800px', padding: '0 20px' }}>
    <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Headline</h1>
    <p style={{ fontSize: '20px', opacity: 0.9, marginBottom: '30px' }}>Tagline</p>
    <button style={{ padding: '15px 40px', fontSize: '18px' }}>CTA</button>
  </div>
</VideoBackground>

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
SECTIONS: Featured dishes with photos, chef story, ambiance gallery, reservation CTA prominently placed, location/hours sticky.
UNIQUE: Menu should be THE STAR - consider tabbed menu categories, hoverable dish cards, or a visual menu grid.`,

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
SECTIONS: Featured products grid, category tiles, bestsellers carousel, reviews with stars, trust badges, newsletter signup.
UNIQUE: Product showcase is KING - use large image cards, hover effects, quick-view patterns.`,

    // ENTERTAINMENT & FUN VENUES
    'Entertainment': `
STYLE: Bold, playful, energetic, FUN - this is NOT a corporate site!
HERO: Large action imagery, neon/glow effects, animated elements, video backgrounds work great.
TYPOGRAPHY: Bold, chunky fonts. Can be playful/quirky. Large impactful headlines.
COLORS: Bright, bold colors - neon pink, electric blue, bright orange, lime green. Dark backgrounds with glowing accents.
IMAGERY: People having fun, action shots, neon lights, bowling pins flying, arcade games, celebrations.
LAYOUT PATTERNS: Asymmetric, overlapping elements, floating cards, gamified UI elements, progress bars, achievement badges.
SECTIONS: "What's On" with large event cards, pricing/packages with visual comparisons, photo gallery mosaic, party booking CTA (BIG and bold), hours with fun icons.
UNIQUE: Make it feel like an EXPERIENCE - use hover animations, playful icons, maybe even a mini-game element or leaderboard teaser.`,

    'Bowling Alley': `
STYLE: Retro-fun meets modern, neon glow, energetic party vibe
HERO: Bowling action shot with neon overlay effects, lanes lit up, pins flying. Video loop of strikes.
TYPOGRAPHY: Bold, chunky, retro-inspired fonts. Think arcade vibes. Glowing text effects.
COLORS: Neon pink, electric blue, black backgrounds, glowing orange accents. Retro color palette.
IMAGERY: Glowing lanes, pins exploding, people celebrating strikes, cosmic bowling atmosphere.
LAYOUT PATTERNS: Floating neon-bordered cards, asymmetric grids, gamified elements like score displays.
SECTIONS: "Book Your Lane" CTA front-and-center, party packages with fun illustrations, cosmic bowling showcase, league info with leaderboard style, arcade/bar area highlight, birthday party section with confetti.
UNIQUE: Add gamification - maybe a "Strike Counter" AnimatedCounter, glow effects on buttons, retro arcade styling. Make visitors WANT to bowl!`,

    'Arcade': `
STYLE: Retro gaming, pixel art vibes, neon, 80s throwback with modern twist
HERO: Arcade cabinet imagery, pixel art elements, neon grids, controller icons.
TYPOGRAPHY: Pixel fonts for headers, retro gaming typography, 8-bit style numbers.
COLORS: Neon purple, hot pink, cyan, black backgrounds, CRT scan line effects.
IMAGERY: Arcade cabinets, joysticks, tokens, high score screens, multiplayer action.
LAYOUT PATTERNS: Pixel-bordered cards, CRT monitor styled sections, high-score table layouts.
SECTIONS: Game showcase grid, token/credit packages, party room booking, high scores leaderboard, birthday packages.
UNIQUE: Add score-like AnimatedCounters, pixel art icons, maybe a fake "INSERT COIN" button.`,

    // FITNESS & WELLNESS
    'Fitness': `
STYLE: High-energy, motivational, powerful, action-oriented
HERO: Dynamic action shots - people mid-workout, weights in motion, intense focus. Dark/dramatic.
TYPOGRAPHY: Bold, strong, condensed fonts. IMPACT. All-caps for key headlines.
COLORS: Dark backgrounds (black, charcoal), bold accent (red, orange, electric blue), high contrast.
IMAGERY: Athletes in action, gym equipment, sweat and determination, transformation photos.
LAYOUT PATTERNS: Strong geometric shapes, diagonal lines, bold dividers, before/after layouts.
SECTIONS: Class schedule (prominent, interactive if possible), membership tiers as bold comparison cards, trainer profiles with stats, transformation gallery, free trial CTA.
UNIQUE: Make it MOTIVATING - use strong action verbs, progress-style layouts, maybe countdown timers for challenges.`,

    'Gym': `
STYLE: Powerful, results-focused, community-driven, no-nonsense
HERO: Weight room action, people pushing limits, dramatic lighting on equipment.
TYPOGRAPHY: Bold condensed sans-serif, industrial feel, strong headlines.
COLORS: Black, dark gray, red or orange accents, metallic touches.
IMAGERY: Free weights, cable machines, group classes in action, focused athletes.
LAYOUT PATTERNS: Grid-based equipment/class showcase, membership comparison tables, strong geometric sections.
SECTIONS: "Join Now" prominent CTA, membership tiers with clear pricing, class schedule table/tabs, trainer team, equipment showcase, testimonial transformations.
UNIQUE: Show the RESULTS - before/after transformations, member stats, community achievements.`,

    'Yoga Studio': `
STYLE: Calm, serene, mindful, balanced, natural
HERO: Peaceful poses, natural light, plants, minimalist space. Soft, dreamy.
TYPOGRAPHY: Light, airy fonts. Thin weights. Generous letter-spacing. Lowercase feels right.
COLORS: Soft sage green, dusty rose, cream, warm white, terracotta, natural tones.
IMAGERY: Yoga poses in beautiful spaces, nature elements, plants, morning light, meditation.
LAYOUT PATTERNS: Lots of whitespace, organic shapes, flowing curves, asymmetric balance.
SECTIONS: Class schedule with easy-to-read times, instructor profiles with philosophy, workshop/retreat highlights, pricing as simple cards, new student offer.
UNIQUE: Breathe CALM into the design - gentle animations, flowing transitions, peaceful imagery.`,

    // CREATIVE & EDGY INDUSTRIES
    'Tattoo Studio': `
STYLE: Bold, edgy, artistic, dark, authentic - NOT corporate or clean
HERO: Dark, atmospheric studio shot OR dramatic tattoo closeup with moody lighting. Video of tattooing works great.
TYPOGRAPHY: Bold, often condensed or distressed fonts. Can be slightly grungy. Uppercase for impact.
COLORS: BLACK is dominant. Accent with crimson red, deep gold, or muted metallics. High contrast.
IMAGERY: CRITICAL - Use ONLY tattoo-specific images:
  - Team photos: Tattoo artists AT WORK or portrait shots of tattooed professionals
  - Gallery: Closeup shots of completed tattoos on skin
  - NOT yoga people, NOT hairstylists, NOT generic stock photos
LAYOUT PATTERNS: Dark backgrounds, bold dividers, asymmetric galleries, hoverable portfolio items.
SECTIONS: Artist profiles (with their specialty styles), portfolio gallery (organized by style - traditional, realism, geometric, etc.), booking/consultation CTA, aftercare info, FAQs, shop policies.
UNIQUE: The PORTFOLIO is everything - make it visually striking. Show the artists' individual styles. Dark theme with dramatic lighting effects. Instagram integration for latest work.`,

    'Barbershop': `
STYLE: Masculine, vintage-meets-modern, confident, classic
HERO: Classic barbershop interior OR barber at work with dramatic lighting. Leather, wood, chrome vibes.
TYPOGRAPHY: Bold serif or strong sans-serif. Vintage touches work well. All-caps for headings.
COLORS: Dark backgrounds (charcoal, navy), warm accents (gold, cream, burgundy), masculine palette.
IMAGERY: Barbers cutting hair, vintage tools, leather chairs, pomade, grooming products.
LAYOUT PATTERNS: Clean but bold grids, service cards, team profiles with specialties.
SECTIONS: Services with prices, the barbers (with their chair/specialty), booking CTA prominent, gallery of cuts/styles, shop story.
UNIQUE: Classic masculinity - think vintage signs, straight razors, leather textures. Make booking EASY.`,

    // PROFESSIONAL SERVICES
    'Professional Services': `
STYLE: Trustworthy, credible, sophisticated, results-oriented
HERO: Clean, minimal, text-focused. Abstract imagery or subtle patterns. No cheesy stock photos.
TYPOGRAPHY: Professional serif or clean sans-serif. Traditional feels trustworthy.
COLORS: Navy, charcoal, white, gold/bronze accents. Conservative palette.
IMAGERY: Abstract, city skylines, handshakes (tasteful), office environments, success imagery.
LAYOUT PATTERNS: Clean grids, generous whitespace, editorial layouts, credential showcases.
SECTIONS: Services overview, credentials/certifications, case studies or results stats, team bios, testimonials from named clients, consultation CTA.
UNIQUE: TRUST is everything - show certifications, years in business, client logos, specific results numbers.`,

    'Consulting': `
STYLE: Strategic, intellectual, results-driven, premium
HERO: Minimal, sophisticated. Data visualization elements, abstract strategy imagery.
TYPOGRAPHY: Clean, modern sans-serif. Professional but not stuffy.
COLORS: Deep blues, white, subtle gold accents, muted professional palette.
IMAGERY: Abstract strategy visuals, charts/graphs (stylized), meeting rooms, city views.
LAYOUT PATTERNS: Case study cards, results metrics prominently displayed, process timelines.
SECTIONS: Expertise areas, methodology/process steps, case studies with metrics, team credentials, client logos, discovery call CTA.
UNIQUE: Show EXPERTISE and RESULTS - use AnimatedCounters for client results, showcase methodology.`,

    'Accounting': `
STYLE: Precise, trustworthy, organized, approachable
HERO: Clean, professional, maybe abstract financial imagery or clean office.
TYPOGRAPHY: Clean, highly readable. Numbers should be prominent and well-designed.
COLORS: Blues, greens (money), white, conservative accents.
IMAGERY: Abstract financial, organized documents, calculators, professional settings.
LAYOUT PATTERNS: Clean service grids, pricing tables, credential badges, organized information.
SECTIONS: Services (tax, bookkeeping, advisory), credentials/certifications, about the team, client testimonials, free consultation CTA, deadline reminders.
UNIQUE: Emphasize TRUST and ACCURACY - certifications prominent, years experience, client count.`,

    // TRADES & HOME SERVICES
    'Home Services': `
STYLE: Reliable, local, trustworthy, urgent-friendly
HERO: Before/after project photos, workers in action, completed work showcase.
TYPOGRAPHY: Bold, clear, easy to read. Phone numbers LARGE.
COLORS: Blues, oranges, greens - trustworthy trade colors. High contrast for CTAs.
IMAGERY: Completed projects, uniformed workers, tools, happy homeowners, before/after.
LAYOUT PATTERNS: Service cards with icons, trust badges prominent, quote forms accessible.
SECTIONS: Services grid with icons, service areas map, trust badges (licensed, insured, bonded), reviews carousel, FREE ESTIMATE button everywhere, emergency service callout.
UNIQUE: Make CALLING/BOOKING easy - phone number in header, quote forms prominent, urgency messaging.`,

    'Plumbing': `
STYLE: Emergency-ready, trustworthy, local, fast response
HERO: Professional plumber at work, or clean bathroom result. Clear "CALL NOW" messaging.
TYPOGRAPHY: Bold, urgent, phone numbers prominent. Clear service headlines.
COLORS: Blues (water), white, orange/red for emergency CTAs.
IMAGERY: Professional work, tools, fixtures, happy homeowners, before/after.
LAYOUT PATTERNS: Service icons grid, emergency banner, trust badges, quick quote form.
SECTIONS: Emergency services highlighted, service list, service areas, trust badges, reviews, call-to-action with phone number HUGE.
UNIQUE: EMERGENCY messaging prominent - "24/7 Service", "Fast Response", "Same Day Service".`,

    'Landscaping': `
STYLE: Natural, transformative, seasonal, curb appeal focused
HERO: Beautiful completed landscape, dramatic before/after, lush greenery.
TYPOGRAPHY: Clean, natural feel. Can be slightly organic/earthy.
COLORS: Greens, browns, earth tones, with clean white backgrounds.
IMAGERY: Stunning landscaping projects, seasonal variety, before/after transformations, happy families in yards.
LAYOUT PATTERNS: Project gallery mosaic, seasonal services, before/after sliders.
SECTIONS: Services by season, project gallery (large images), design consultation offer, maintenance packages, testimonials with project photos.
UNIQUE: Show TRANSFORMATIONS - before/after comparisons, gallery of best work, seasonal tips.`,

    'default': `
STYLE: Professional, modern, trustworthy
HERO: Clear value proposition, prominent CTA, relevant imagery
TYPOGRAPHY: Clean sans-serif, clear hierarchy
COLORS: Use the provided theme colors consistently
IMAGERY: High-quality, relevant Unsplash images
LAYOUT PATTERNS: Standard sections with clear visual breaks
SECTIONS: Hero, features/services, about snippet, testimonials, CTA`
  };

  // Try exact match first, then partial match
  if (guidance[industryName]) {
    return guidance[industryName];
  }

  // Try partial matching for broader categories
  const lowerName = (industryName || '').toLowerCase();

  if (lowerName.includes('bowl') || lowerName.includes('arcade') || lowerName.includes('entertainment') || lowerName.includes('fun') || lowerName.includes('laser') || lowerName.includes('trampoline') || lowerName.includes('go-kart') || lowerName.includes('mini golf')) {
    return guidance['Entertainment'];
  }
  if (lowerName.includes('gym') || lowerName.includes('fitness') || lowerName.includes('crossfit') || lowerName.includes('workout')) {
    return guidance['Fitness'];
  }
  if (lowerName.includes('yoga') || lowerName.includes('pilates') || lowerName.includes('meditation')) {
    return guidance['Yoga Studio'];
  }
  if (lowerName.includes('restaurant') || lowerName.includes('food') || lowerName.includes('dining') || lowerName.includes('cafe') || lowerName.includes('bistro')) {
    return guidance['Restaurant / Food Service'];
  }
  if (lowerName.includes('law') || lowerName.includes('legal') || lowerName.includes('attorney')) {
    return guidance['Law Firm'];
  }
  if (lowerName.includes('consult') || lowerName.includes('advisory')) {
    return guidance['Consulting'];
  }
  if (lowerName.includes('account') || lowerName.includes('tax') || lowerName.includes('cpa') || lowerName.includes('bookkeep')) {
    return guidance['Accounting'];
  }
  if (lowerName.includes('plumb') || lowerName.includes('hvac') || lowerName.includes('electric') || lowerName.includes('roof')) {
    return guidance['Home Services'];
  }
  if (lowerName.includes('landscap') || lowerName.includes('lawn') || lowerName.includes('garden')) {
    return guidance['Landscaping'];
  }
  if (lowerName.includes('health') || lowerName.includes('medical') || lowerName.includes('clinic') || lowerName.includes('dental')) {
    return guidance['Healthcare / Medical'];
  }
  if (lowerName.includes('shop') || lowerName.includes('store') || lowerName.includes('retail') || lowerName.includes('ecommerce') || lowerName.includes('boutique')) {
    return guidance['E-Commerce / Retail'];
  }
  if (lowerName.includes('saas') || lowerName.includes('software') || lowerName.includes('platform') || lowerName.includes('app') || lowerName.includes('tech')) {
    return guidance['SaaS / B2B Platform'];
  }
  if (lowerName.includes('tattoo') || lowerName.includes('ink') || lowerName.includes('body art') || lowerName.includes('piercing')) {
    return guidance['Tattoo Studio'];
  }
  if (lowerName.includes('barber') || lowerName.includes('grooming')) {
    return guidance['Barbershop'];
  }

  return guidance['default'];
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

  // Page-specific animation styles - IMPORTANT: Each page should have DIFFERENT animations
  const pageAnimations = {
    home: `
ANIMATION STYLE FOR HOME - "DRAMATIC ENTRANCE":
- Wrap hero content in <ScrollReveal animation="fade-up" delay={0.2}>
- Use <ParallaxSection> for the hero background image
- Stats: Use <AnimatedCounter> with staggered delays (0, 0.2, 0.4)
- Feature cards: Wrap in <StaggeredList> for sequential reveal
- Add subtle <GlowEffect> to primary CTA button`,

    about: `
ANIMATION STYLE FOR ABOUT - "STORYTELLING FLOW":
- Hero: <ScrollReveal animation="fade-in" delay={0.1}> - simple, elegant
- Story section: Use <ScrollReveal animation="slide-right"> for text, <ScrollReveal animation="slide-left"> for images
- Values cards: <StaggeredList delay={0.15}> - gentle stagger
- Timeline elements: Alternate <ScrollReveal animation="slide-left"> and "slide-right"
- Team photos: <TiltCard> for subtle 3D hover effect`,

    services: `
ANIMATION STYLE FOR SERVICES - "CARD CASCADE":
- Hero: Minimal animation - just <ScrollReveal animation="fade-in">
- Service cards: Use <StaggeredList delay={0.1}> with <TiltCard> wrappers
- Process steps: <ScrollReveal animation="zoom-in"> for each step icon
- Pricing tiers: Stagger with delays 0.1, 0.2, 0.3
- NO parallax on this page - keep it professional and scannable`,

    gallery: `
ANIMATION STYLE FOR GALLERY - "MASONRY REVEAL":
- Hero: Short, simple <ScrollReveal animation="fade-in">
- Gallery images: <StaggeredList delay={0.05}> for rapid cascade effect
- Each image: Add subtle hover zoom (transform: scale(1.03))
- Lightbox overlay: CSS transition for smooth open
- Categories: Horizontal scroll or filter pills with fade transitions`,

    contact: `
ANIMATION STYLE FOR CONTACT - "CLEAN & DIRECT":
- Hero: Simple <ScrollReveal animation="fade-in">
- Contact form: <ScrollReveal animation="slide-up"> - single reveal for whole form
- Info cards: <ScrollReveal animation="fade-in" delay={0.2}> - subtle
- Map (if present): Fade in after form loads
- MINIMAL animations - users want to contact you, not watch effects`,

    pricing: `
ANIMATION STYLE FOR PRICING - "SPOTLIGHT TIERS":
- Hero: <ScrollReveal animation="fade-in">
- Pricing cards: <StaggeredList> with center card having <GlowEffect>
- Featured tier: Add subtle pulsing border animation (CSS @keyframes)
- Feature checkmarks: Stagger within each card
- Comparison table rows: <ScrollReveal animation="fade-up"> per row`,

    testimonials: `
ANIMATION STYLE FOR TESTIMONIALS - "QUOTE THEATER":
- Hero: <ScrollReveal animation="fade-in">
- Quote cards: <StaggeredList delay={0.15}> with <TiltCard> wrappers
- Large quote icons: <ScrollReveal animation="zoom-in">
- Star ratings: Animate in sequence (CSS @keyframes)
- Client photos: Subtle border glow on hover`,

    team: `
ANIMATION STYLE FOR TEAM - "PROFESSIONAL INTRODUCTION":
- Hero: <ScrollReveal animation="fade-in">
- Team cards: <StaggeredList delay={0.12}>
- Photos: <TiltCard> with subtle 3D effect on hover
- Social icons: Fade in on card hover (CSS transition)
- Bio text: <ScrollReveal animation="fade-up"> per section`,

    menu: `
ANIMATION STYLE FOR MENU - "APPETIZING DISPLAY":
- Hero: <ParallaxSection> with food imagery background
- Menu categories: <ScrollReveal animation="slide-up"> for headers
- Menu items: <StaggeredList delay={0.08}> for rapid display
- Prices: <AnimatedCounter> for any featured prices
- Food images: Scale-up hover effect (transform: scale(1.05))`,

    booking: `
ANIMATION STYLE FOR BOOKING - "GUIDED EXPERIENCE":
- Hero: Simple <ScrollReveal animation="fade-in">
- Booking form: <ScrollReveal animation="slide-up">
- Available slots: Subtle pulse animation on available times
- Calendar: CSS transition for date selection
- Confirmation: <ScrollReveal animation="zoom-in"> for success state`,

    faq: `
ANIMATION STYLE FOR FAQ - "ACCORDION FLOW":
- Hero: <ScrollReveal animation="fade-in">
- FAQ items: <StaggeredList delay={0.08}>
- Accordion expand: CSS max-height transition (0.3s ease)
- Plus/minus icons: Rotate transform on toggle
- Related questions: Fade in at bottom`
  };

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
- CTA SECTION: Dark background, compelling headline, accent button
${pageAnimations.home}`,

    about: `
ABOUT PAGE REQUIREMENTS:
- HERO (50vh): Solid dark background (${primary}), centered content
- Small label "OUR STORY" uppercase, letter-spacing 3px, accent color (${accent})
- Company name large (48px)
- Stats row: three numbers (500+, 15+, 1000+) with labels below
- STORY SECTION: Light bg, two columns - text left, pull quote right
- VALUES: 4 cards with icons (Shield, Target, Users, Award)
- CREDENTIALS: Subtle section with certifications
- CTA at bottom
${pageAnimations.about}`,

    services: `
SERVICES PAGE REQUIREMENTS:
- HERO (40vh): Gradient background, centered text
- Simple headline, brief tagline, NO buttons in hero
- SERVICE CARDS: Numbered (01, 02, 03, 04), accent-colored numbers
- Each card: title, description, bullet points with Check icons
- PROCESS SECTION: 4-step visual flow
- CTA: Accent button to contact
${pageAnimations.services}`,

    contact: `
CONTACT PAGE REQUIREMENTS:
- HERO (30vh): Dark background, "GET IN TOUCH" label, simple headline
- Split layout below: Form (60%) left, Info (40%) right
- Form: First name, Last name, Email, Phone, Company, Message
- Clean inputs: subtle borders, accent focus state, accent submit button
- Info card: MapPin, Phone, Mail, Clock icons with details
- Business hours displayed
${pageAnimations.contact}`,

    pricing: `
PRICING PAGE REQUIREMENTS:
- HERO (35vh): Dark background, "PRICING" label
- Pricing cards: featured tier with accent border
- Check icons for features in accent color
- Clear pricing, CTA buttons
- FAQ section below if space
${pageAnimations.pricing}`,

    faq: `
FAQ PAGE REQUIREMENTS:
- HERO (25vh): Light gray background, dark text
- Simple "Frequently Asked Questions" headline
- Accordion items with Plus/Minus icons (useState for expand/collapse)
- 8-10 relevant questions with detailed answers
- Accent color on expanded item border
- CTA at bottom for additional questions
${pageAnimations.faq}`,

    testimonials: `
TESTIMONIALS PAGE REQUIREMENTS:
- HERO (30vh): Dark background, "CLIENT SUCCESS" label
- Large testimonial cards with Quote icon
- Client initials in accent circle, name, title
- 4-6 testimonials in grid
- Stats section with success metrics
${pageAnimations.testimonials}`,

    team: `
TEAM PAGE REQUIREMENTS:
- HERO (40vh): Dark background, "OUR TEAM" label
- Team cards: initials in circle, name, title in accent
- 3-4 team members with short bios
- Credentials below each
${pageAnimations.team}`,

    booking: `
BOOKING PAGE REQUIREMENTS:
- HERO (30vh): Dark background, "SCHEDULE" label
- Booking form with service selection, date preference
- Contact fields
- Right side: what to expect, benefits
- Accent submit button
${pageAnimations.booking}`,

    gallery: `
GALLERY PAGE REQUIREMENTS:
- HERO (30vh): Dark background, "OUR WORK" or "GALLERY" label
- Gallery grid: masonry or uniform grid layout
- Lightbox on click for full-size images
- Categories/filters if multiple types of work
- High-quality images showcasing best work
${pageAnimations.gallery}`,

    menu: `
MENU PAGE REQUIREMENTS:
- HERO (35vh): Food imagery background with overlay
- Menu categories clearly labeled
- Items with descriptions and prices
- Dietary icons (vegetarian, gluten-free, etc.)
- Featured/popular items highlighted
${pageAnimations.menu}`
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

/**
 * Build page prompt specifically for Orchestrator mode
 * Streamlined version optimized for orchestrator-generated businesses
 */
function buildOrchestratorPagePrompt(pageId, componentName, otherPages, description, promptConfig) {
  const businessName = description.businessName || promptConfig.businessName || 'Our Business';
  const tagline = description.tagline || '';
  const cta = description.callToAction || 'Get Started';
  const industry = promptConfig.industry?.name || description.industryKey || 'business';
  const location = description.location || '';
  const colors = promptConfig.colors || { primary: '#6366f1', accent: '#06b6d4' };

  // Get industry-specific images
  const industryImages = getIndustryImageUrls(industry);

  const pageTypeGuide = {
    home: `HERO SECTION with impactful headline, tagline, and CTA button. FEATURES/SERVICES preview. TESTIMONIALS. About preview. Contact CTA.`,
    about: `Company story and mission. Team section with photos. Values/philosophy. Timeline or milestones. Trust badges.`,
    services: `Service cards with icons, descriptions, pricing hints. Process/how-it-works section. FAQ. Service area coverage.`,
    contact: `Contact form (name, email, phone, message). Business hours. Location map placeholder. Phone and email displayed prominently.`,
    pricing: `Pricing tiers/packages. Feature comparison. FAQ about pricing. Money-back guarantee badge. CTA to contact.`,
    gallery: `Image grid showcasing work. Before/after if applicable. Category filters. Lightbox-style presentation.`,
    'book-online': `Booking form or calendar integration placeholder. Service selection. Date/time picker mockup. Confirmation info.`,
    'service-areas': `Map or list of service areas. Coverage radius. Area-specific info. CTA per area.`,
    team: `Team member cards with photos, names, roles, bios. Company culture section.`,
    testimonials: `Customer reviews with photos, names, ratings. Video testimonial placeholders. Trust indicators.`,
    faq: `Accordion-style FAQ sections organized by category. Contact CTA for more questions.`,
    blog: `Blog post previews in card grid. Categories sidebar. Search placeholder. Featured posts.`
  };

  const pageGuide = pageTypeGuide[pageId] || `Create appropriate content sections for a ${pageId} page.`;

  return `You are an expert React developer creating a ${pageId.toUpperCase()} page for "${businessName}".

BUSINESS CONTEXT:
- Business Name: ${businessName}
- Industry: ${industry}
- Tagline: "${tagline}"
- Primary CTA: "${cta}"
- Location: ${location || 'Not specified'}

PAGE REQUIREMENTS:
${pageGuide}

OTHER PAGES IN THIS SITE: ${otherPages || 'none'}

DESIGN SYSTEM:
- Primary Color: ${colors.primary}
- Accent Color: ${colors.accent}
- Use modern, clean design with plenty of whitespace
- Mobile-first responsive design
- Smooth hover animations

IMAGES TO USE:
- Hero: ${industryImages.hero}
- Gallery: ${(industryImages.gallery || []).slice(0, 4).join(', ')}
- Services: ${(industryImages.services || []).slice(0, 3).join(', ')}

TECHNICAL REQUIREMENTS:
1. Export a single React functional component named ${componentName}Page
2. Use inline styles with JavaScript objects (no CSS imports except theme.css)
3. Import { Link } from 'react-router-dom' for navigation
4. Use semantic HTML (header, main, section, footer)
5. Include responsive breakpoints using CSS-in-JS
6. Add smooth scroll behavior for anchor links

CRITICAL:
- Return ONLY the JSX code, no markdown code blocks
- The component must be a complete, working React component
- Include proper export default statement
- Use actual image URLs provided, not placeholders

Generate the complete ${componentName}Page.jsx component:`;
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

// ============================================
// INDUSTRY HEADER CONFIGURATIONS
// ============================================
function getIndustryHeaderConfig(industry) {
  const lowerIndustry = (industry || '').toLowerCase();

  // Tattoo/Creative/Edgy Industries (Tattoo, Piercing, Motorcycle, Custom)
  if (lowerIndustry.includes('tattoo') || lowerIndustry.includes('ink') ||
      lowerIndustry.includes('piercing') || lowerIndustry.includes('motorcycle') ||
      lowerIndustry.includes('custom') || lowerIndustry.includes('body art')) {
    return {
      type: 'creative',
      showEmergencyBanner: false,
      primaryCta: { text: 'Book Consultation', icon: 'Calendar', action: 'link', href: '/booking' },
      secondaryCta: { text: 'View Portfolio', icon: 'Image', action: 'link', href: '/gallery' },
      headerStyle: 'edgy',
      glowEffect: true,
      mobilePhoneVisible: false
    };
  }

  // Barbershop/Grooming - masculine, bold
  if (lowerIndustry.includes('barber') || lowerIndustry.includes('grooming')) {
    return {
      type: 'barbershop',
      showEmergencyBanner: false,
      primaryCta: { text: 'Book Now', icon: 'Calendar', action: 'link', href: '/booking' },
      secondaryCta: { text: 'Our Services', icon: 'Scissors', action: 'link', href: '/services' },
      headerStyle: 'bold',
      mobilePhoneVisible: true
    };
  }

  // Emergency Services (Plumber, HVAC, Electrician, Locksmith)
  if (lowerIndustry.includes('plumb') || lowerIndustry.includes('hvac') ||
      lowerIndustry.includes('electric') || lowerIndustry.includes('locksmith') ||
      lowerIndustry.includes('roofing') || lowerIndustry.includes('emergency')) {
    return {
      type: 'emergency',
      showEmergencyBanner: true,
      emergencyText: '24/7 Emergency Service',
      showPhoneProminent: true,
      phoneNumber: '(555) 123-4567',
      primaryCta: { text: 'Call Now', icon: 'Phone', action: 'tel' },
      secondaryCta: { text: 'Get Quote', icon: 'FileText', action: 'link', href: '/contact' },
      showBadge: true,
      badgeText: '24/7',
      headerStyle: 'emergency',
      mobilePhoneVisible: true
    };
  }

  // Entertainment (Bowling, Arcade, Mini Golf, Trampoline)
  if (lowerIndustry.includes('bowl') || lowerIndustry.includes('arcade') ||
      lowerIndustry.includes('golf') || lowerIndustry.includes('trampoline') ||
      lowerIndustry.includes('laser') || lowerIndustry.includes('entertainment') ||
      lowerIndustry.includes('fun') || lowerIndustry.includes('go-kart')) {
    return {
      type: 'entertainment',
      showEmergencyBanner: false,
      showSocialIcons: true,
      primaryCta: { text: 'Book Now', icon: 'Calendar', action: 'link', href: '/book' },
      secondaryCta: { text: 'Parties', icon: 'PartyPopper', action: 'link', href: '/parties' },
      headerStyle: 'playful',
      glowEffect: true,
      mobilePhoneVisible: false
    };
  }

  // Restaurants/Food
  if (lowerIndustry.includes('restaurant') || lowerIndustry.includes('food') ||
      lowerIndustry.includes('dining') || lowerIndustry.includes('cafe') ||
      lowerIndustry.includes('bistro') || lowerIndustry.includes('bar') ||
      lowerIndustry.includes('grill') || lowerIndustry.includes('kitchen')) {
    return {
      type: 'restaurant',
      showEmergencyBanner: false,
      showHours: true,
      hoursText: 'Open today: 11am - 10pm',
      showLocation: true,
      primaryCta: { text: 'Order Online', icon: 'ShoppingBag', action: 'link', href: '/order' },
      secondaryCta: { text: 'Reservations', icon: 'Calendar', action: 'link', href: '/reservations' },
      headerStyle: 'warm',
      mobilePhoneVisible: true
    };
  }

  // Professional Services (Law, Accounting, Consulting)
  if (lowerIndustry.includes('law') || lowerIndustry.includes('legal') ||
      lowerIndustry.includes('attorney') || lowerIndustry.includes('account') ||
      lowerIndustry.includes('consult') || lowerIndustry.includes('advisory') ||
      lowerIndustry.includes('financial') || lowerIndustry.includes('cpa')) {
    return {
      type: 'professional',
      showEmergencyBanner: false,
      showCredentials: true,
      credentialsText: 'BBB A+ Rated',
      primaryCta: { text: 'Free Consultation', icon: 'Calendar', action: 'link', href: '/contact' },
      headerStyle: 'minimal',
      mobilePhoneVisible: true
    };
  }

  // Retail/E-commerce
  if (lowerIndustry.includes('retail') || lowerIndustry.includes('ecommerce') ||
      lowerIndustry.includes('shop') || lowerIndustry.includes('store') ||
      lowerIndustry.includes('boutique')) {
    return {
      type: 'retail',
      showEmergencyBanner: false,
      showSearch: true,
      showCart: true,
      primaryCta: { text: 'Shop Now', icon: 'ShoppingBag', action: 'link', href: '/shop' },
      showPromoBanner: true,
      promoText: 'Free Shipping on Orders $50+',
      headerStyle: 'modern',
      mobilePhoneVisible: false
    };
  }

  // Healthcare/Medical
  if (lowerIndustry.includes('health') || lowerIndustry.includes('medical') ||
      lowerIndustry.includes('clinic') || lowerIndustry.includes('dental') ||
      lowerIndustry.includes('doctor') || lowerIndustry.includes('hospital') ||
      lowerIndustry.includes('therapy') || lowerIndustry.includes('wellness')) {
    return {
      type: 'healthcare',
      showEmergencyBanner: false,
      showPhoneProminent: true,
      phoneNumber: '(555) 123-4567',
      primaryCta: { text: 'Book Appointment', icon: 'Calendar', action: 'link', href: '/appointment' },
      secondaryCta: { text: 'Patient Portal', icon: 'User', action: 'link', href: '/portal' },
      showCredentials: true,
      credentialsText: 'HIPAA Compliant',
      headerStyle: 'calming',
      mobilePhoneVisible: true
    };
  }

  // Fitness/Gym
  if (lowerIndustry.includes('fitness') || lowerIndustry.includes('gym') ||
      lowerIndustry.includes('yoga') || lowerIndustry.includes('crossfit') ||
      lowerIndustry.includes('workout') || lowerIndustry.includes('personal train')) {
    return {
      type: 'fitness',
      showEmergencyBanner: false,
      primaryCta: { text: 'Start Free Trial', icon: 'Zap', action: 'link', href: '/join' },
      secondaryCta: { text: 'Class Schedule', icon: 'Calendar', action: 'link', href: '/schedule' },
      headerStyle: 'bold',
      mobilePhoneVisible: false
    };
  }

  // Default
  return {
    type: 'default',
    showEmergencyBanner: false,
    primaryCta: { text: 'Contact Us', icon: 'Mail', action: 'link', href: '/contact' },
    headerStyle: 'default',
    mobilePhoneVisible: false
  };
}

function buildAppJsx(name, pages, promptConfig, industry) {
  const colors = promptConfig?.colors || { primary: '#0a1628', text: '#1a1a2e', textMuted: '#4a5568' };
  const typography = promptConfig?.typography || { heading: "Georgia, 'Times New Roman', serif" };

  // Get industry-specific header configuration
  const headerConfig = getIndustryHeaderConfig(industry);

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
    const routePath = toRoutePath(p);
    const isProtected = needsAuth && protectedPages.includes(p.toLowerCase().replace(/\s+/g, '-'));

    if (isProtected) {
      return `              <Route path="${routePath}" element={<ProtectedRoute><${componentName} /></ProtectedRoute>} />`;
    }
    return `              <Route path="${routePath}" element={<${componentName} />} />`;
  }).join('\n');

  // Filter out login/register from nav links
  const navPages = pages.filter(p => !['login', 'register'].includes(p.toLowerCase()));
  const navLinks = navPages.map(p => {
    const label = toNavLabel(p);
    const navPath = toRoutePath(p);
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

  // Build industry-specific header icons
  const headerIcons = ['Menu', 'X'];
  if (headerConfig.primaryCta?.icon) headerIcons.push(headerConfig.primaryCta.icon);
  if (headerConfig.secondaryCta?.icon) headerIcons.push(headerConfig.secondaryCta.icon);
  if (headerConfig.showPhoneProminent) headerIcons.push('Phone');
  if (headerConfig.showSearch) headerIcons.push('Search');
  if (headerConfig.showCart) headerIcons.push('ShoppingCart');
  if (headerConfig.showSocialIcons) headerIcons.push('Facebook', 'Instagram');
  if (headerConfig.showHours) headerIcons.push('Clock');
  if (headerConfig.showLocation) headerIcons.push('MapPin');
  if (headerConfig.showCredentials) headerIcons.push('Shield');
  const uniqueIcons = [...new Set(headerIcons)].join(', ');

  // Build emergency banner if needed
  const emergencyBanner = headerConfig.showEmergencyBanner ? `
      {/* Emergency Banner */}
      <div style={styles.emergencyBanner}>
        <span style={styles.emergencyBadge}>${headerConfig.badgeText || '24/7'}</span>
        <span style={styles.emergencyText}>${headerConfig.emergencyText || '24/7 Emergency Service'}</span>
        <a href="tel:${(headerConfig.phoneNumber || '').replace(/[^0-9]/g, '')}" style={styles.emergencyPhone}>
          <Phone size={16} />
          ${headerConfig.phoneNumber || '(555) 123-4567'}
        </a>
      </div>` : '';

  // Build promo banner for retail
  const promoBanner = headerConfig.showPromoBanner ? `
      {/* Promo Banner */}
      <div style={styles.promoBanner}>
        ${headerConfig.promoText || 'Free Shipping on Orders $50+'}
      </div>` : '';

  // Build primary CTA button
  const primaryCtaCode = headerConfig.primaryCta ? `
            ${headerConfig.primaryCta.action === 'tel'
              ? `<a href="tel:${(headerConfig.phoneNumber || '').replace(/[^0-9]/g, '')}" style={styles.primaryCta}>
              <${headerConfig.primaryCta.icon} size={16} />
              ${headerConfig.primaryCta.text}
            </a>`
              : `<Link to="${headerConfig.primaryCta.href || '/contact'}" style={styles.primaryCta}>
              <${headerConfig.primaryCta.icon} size={16} />
              ${headerConfig.primaryCta.text}
            </Link>`
            }` : '';

  // Build secondary CTA button
  const secondaryCtaCode = headerConfig.secondaryCta ? `
            <Link to="${headerConfig.secondaryCta.href || '/contact'}" style={styles.secondaryCta}>
              <${headerConfig.secondaryCta.icon} size={16} />
              ${headerConfig.secondaryCta.text}
            </Link>` : '';

  // Build phone button for mobile
  const mobilePhoneBtn = headerConfig.mobilePhoneVisible && headerConfig.phoneNumber ? `
          <a href="tel:${(headerConfig.phoneNumber || '').replace(/[^0-9]/g, '')}" style={styles.mobilePhoneBtn}>
            <Phone size={20} />
          </a>` : '';

  // Build search for retail
  const searchBox = headerConfig.showSearch ? `
            <div style={styles.searchBox}>
              <Search size={18} style={styles.searchIcon} />
              <input type="text" placeholder="Search..." style={styles.searchInput} />
            </div>` : '';

  // Build cart for retail
  const cartIcon = headerConfig.showCart ? `
            <Link to="/cart" style={styles.cartLink}>
              <ShoppingCart size={20} />
              <span style={styles.cartBadge}>0</span>
            </Link>` : '';

  // Build hours for restaurant
  const hoursDisplay = headerConfig.showHours ? `
            <span style={styles.hoursDisplay}>
              <Clock size={14} />
              ${headerConfig.hoursText || 'Open today: 11am - 10pm'}
            </span>` : '';

  // Build credentials badge
  const credentialsBadge = headerConfig.showCredentials ? `
            <span style={styles.credentialsBadge}>
              <Shield size={14} />
              ${headerConfig.credentialsText || 'Certified'}
            </span>` : '';

  // Build social icons for entertainment
  const socialIcons = headerConfig.showSocialIcons ? `
            <div style={styles.socialIcons}>
              <a href="#" style={styles.socialLink}><Facebook size={18} /></a>
              <a href="#" style={styles.socialLink}><Instagram size={18} /></a>
            </div>` : '';

  return `/**
 * ${name} - Frontend App
 * Auto-generated by Module Library Assembler with AI
 * Header Type: ${headerConfig.type}
 */
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ${uniqueIcons} } from 'lucide-react';
import './theme.css';
// Page imports
${routeImports}
${authImports}
${authButtonsComponent}
// Mobile menu wrapper component with industry-specific header
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
    <>${emergencyBanner}${promoBanner}
      <nav style={styles.nav}>
        <Link to="/" style={styles.navBrand}>
          <span style={styles.brandText}>${name.replace(/-/g, ' ').replace(/\s+/g, ' ').trim()}</span>
        </Link>

        {isMobile ? (
          <div style={styles.mobileActions}>${mobilePhoneBtn}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={styles.hamburger}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        ) : (
          <>
            ${headerConfig.type === 'retail' ? searchBox : ''}
            <div style={styles.navLinks}>
${navLinks}
            </div>
            <div style={styles.navActions}>
              ${hoursDisplay}
              ${credentialsBadge}
              ${socialIcons}
              ${cartIcon}
              ${primaryCtaCode}
              ${secondaryCtaCode}
${authNavButtons}
            </div>
          </>
        )}
      </nav>

      {isMobile && menuOpen && (
        <div style={styles.mobileMenuOverlay} onClick={() => setMenuOpen(false)}>
          <div style={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
${navLinks.split('\n').map(link => link.replace('styles.navLink', 'styles.mobileNavLink')).join('\n')}
            <div style={styles.mobileCtas}>
              ${headerConfig.primaryCta ? `<Link to="${headerConfig.primaryCta.href || '/contact'}" style={styles.mobilePrimaryCta}>${headerConfig.primaryCta.text}</Link>` : ''}
              ${headerConfig.secondaryCta ? `<Link to="${headerConfig.secondaryCta.href || '/contact'}" style={styles.mobileSecondaryCta}>${headerConfig.secondaryCta.text}</Link>` : ''}
            </div>
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
// Calculate top offset based on banners
const topOffset = ${headerConfig.showEmergencyBanner ? '100' : headerConfig.showPromoBanner ? '92' : '60'};

const styles = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#ffffff',
    color: '${colors.text}',
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  // Emergency banner (for service businesses)
  emergencyBanner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)',
    color: '#ffffff',
    padding: '8px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    zIndex: 1001,
    fontSize: '14px',
    fontWeight: '500',
  },
  emergencyBadge: {
    background: '#ffffff',
    color: '#dc2626',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '700',
  },
  emergencyText: {
    display: 'none',
    '@media (min-width: 640px)': { display: 'inline' },
  },
  emergencyPhone: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: '700',
    background: 'rgba(255,255,255,0.2)',
    padding: '4px 12px',
    borderRadius: '4px',
  },
  // Promo banner (for retail)
  promoBanner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: '${colors.primary}',
    color: '#ffffff',
    padding: '8px 24px',
    textAlign: 'center',
    zIndex: 1001,
    fontSize: '13px',
    fontWeight: '500',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: '${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? (headerConfig.headerStyle === 'edgy' ? 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)' : headerConfig.headerStyle === 'bold' ? '#1a1a2e' : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)') : '#ffffff'}',
    borderBottom: '${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? 'none' : '1px solid rgba(10, 22, 40, 0.1)'}',
    position: 'fixed',
    top: ${headerConfig.showEmergencyBanner ? '40px' : headerConfig.showPromoBanner ? '32px' : '0'},
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1000,
    boxSizing: 'border-box',
    ${headerConfig.glowEffect ? "boxShadow: '0 0 20px rgba(147, 51, 234, 0.3)'," : headerConfig.headerStyle === 'edgy' ? "boxShadow: '0 2px 20px rgba(220, 38, 38, 0.2)'," : ''}
  },
  navBrand: {
    textDecoration: 'none',
  },
  brandText: {
    fontSize: '20px',
    fontWeight: '${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? '700' : '400'}',
    fontFamily: "${typography.heading}",
    color: '${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? '#ffffff' : colors.primary}',
    letterSpacing: '${headerConfig.headerStyle === 'edgy' ? '2px' : '1px'}',
    textTransform: '${headerConfig.headerStyle === 'edgy' ? 'uppercase' : 'none'}',
    ${headerConfig.glowEffect ? "textShadow: '0 0 10px rgba(147, 51, 234, 0.5)'," : headerConfig.headerStyle === 'edgy' ? "textShadow: '0 0 10px rgba(220, 38, 38, 0.3)'," : ''}
  },
  navLinks: {
    display: 'flex',
    gap: '32px',
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navAuth: {
    display: 'flex',
    alignItems: 'center',
  },
  navLink: {
    color: '${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? 'rgba(255,255,255,0.8)' : colors.textMuted}',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '${headerConfig.headerStyle === 'edgy' ? '600' : '500'}',
    letterSpacing: '${headerConfig.headerStyle === 'edgy' ? '2px' : '1px'}',
    textTransform: 'uppercase',
    transition: 'color 0.2s',
  },
  // Primary CTA button
  primaryCta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: '${headerConfig.type === 'emergency' ? '#dc2626' : headerConfig.type === 'entertainment' ? 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' : headerConfig.type === 'creative' ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : headerConfig.type === 'barbershop' ? '#1a1a2e' : '#22c55e'}',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: '${headerConfig.headerStyle === 'edgy' ? '4px' : '8px'}',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
    ${headerConfig.glowEffect ? "boxShadow: '0 0 15px rgba(147, 51, 234, 0.4)'," : headerConfig.type === 'creative' ? "boxShadow: '0 0 15px rgba(220, 38, 38, 0.4)'," : ''}
  },
  // Secondary CTA button
  secondaryCta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'transparent',
    color: '${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? '#ffffff' : colors.primary}',
    border: '1px solid ${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}',
    textDecoration: 'none',
    borderRadius: '${headerConfig.headerStyle === 'edgy' ? '4px' : '8px'}',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  // Hours display (restaurant)
  hoursDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '${colors.textMuted}',
    fontSize: '13px',
    padding: '6px 12px',
    background: 'rgba(0,0,0,0.05)',
    borderRadius: '4px',
  },
  // Credentials badge (professional)
  credentialsBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#059669',
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 10px',
    background: 'rgba(5, 150, 105, 0.1)',
    borderRadius: '4px',
  },
  // Social icons (entertainment)
  socialIcons: {
    display: 'flex',
    gap: '8px',
  },
  socialLink: {
    color: '${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? 'rgba(255,255,255,0.7)' : colors.textMuted}',
    transition: 'color 0.2s',
  },
  // Search box (retail)
  searchBox: {
    position: 'relative',
    marginRight: '24px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
  },
  searchInput: {
    padding: '10px 12px 10px 40px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    width: '240px',
    fontSize: '14px',
    outline: 'none',
  },
  // Cart link (retail)
  cartLink: {
    position: 'relative',
    color: '${colors.text}',
    padding: '8px',
  },
  cartBadge: {
    position: 'absolute',
    top: '0',
    right: '0',
    background: '#dc2626',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '600',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Mobile actions container
  mobileActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  // Mobile phone button (service businesses)
  mobilePhoneBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    background: '${headerConfig.type === 'emergency' ? '#dc2626' : '#22c55e'}',
    color: '#ffffff',
    borderRadius: '50%',
    textDecoration: 'none',
  },
  hamburger: {
    background: 'none',
    border: 'none',
    color: '${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? '#ffffff' : colors.text}',
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
    top: topOffset + 'px',
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  mobileMenu: {
    position: 'fixed',
    top: topOffset + 'px',
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
    maxHeight: 'calc(100vh - ' + topOffset + 'px)',
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
  mobileCtas: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingTop: '16px',
  },
  mobilePrimaryCta: {
    display: 'block',
    padding: '16px',
    background: '${headerConfig.type === 'emergency' ? '#dc2626' : headerConfig.type === 'entertainment' ? 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' : '#22c55e'}',
    color: '#ffffff',
    textDecoration: 'none',
    textAlign: 'center',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '16px',
  },
  mobileSecondaryCta: {
    display: 'block',
    padding: '16px',
    background: 'transparent',
    border: '1px solid #e5e7eb',
    color: '${colors.text}',
    textDecoration: 'none',
    textAlign: 'center',
    borderRadius: '8px',
    fontWeight: '500',
    fontSize: '16px',
  },
  mobileAuthButtons: {
    paddingTop: '16px',
    borderTop: '1px solid rgba(0,0,0,0.1)',
  },${authStyles}
  main: {
    flex: 1,
    paddingTop: topOffset + 'px',
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
// ORCHESTRATOR ENDPOINT
// ============================================

// Rate limiter for orchestrate endpoint (same as assemble)
const orchestrateRateLimiter = require('express-rate-limit')({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { success: false, error: 'Too many requests. Please wait a moment before trying again.' }
});

/**
 * POST /api/orchestrate
 * Takes a single sentence and autonomously creates a complete website
 *
 * Request: { input: "Create a website for Mario's Pizza in Brooklyn" }
 * Response: Same as /api/assemble (project URL, deployment status, etc.)
 */
app.post('/api/orchestrate', orchestrateRateLimiter, async (req, res) => {
  const { input, autoDeploy = false } = req.body;
  const startTime = Date.now();

  // Validate input
  if (!input || typeof input !== 'string' || input.trim().length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a description of the website you want to create (minimum 3 characters)'
    });
  }

  const userInput = input.trim();
  console.log('\n' + '='.repeat(60));
  console.log('⚡ ORCHESTRATOR MODE');
  console.log('='.repeat(60));
  console.log(`📝 Input: "${userInput}"`);
  console.log('');

  try {
    // Load orchestrator service
    const { orchestrate, validatePayload } = require('./services/orchestrator.cjs');

    // Run orchestration - AI infers all details
    console.log('🤖 AI Analysis in progress...');
    const orchestratorResult = await orchestrate(userInput);

    if (!orchestratorResult.success) {
      return res.status(400).json({
        success: false,
        error: orchestratorResult.error || 'Orchestration failed'
      });
    }

    const { payload, summary } = orchestratorResult;

    // Helper for safe array joining
    const safeJoin = (arr, separator = ', ') => {
      if (!arr || !Array.isArray(arr)) return 'none';
      return arr.length > 0 ? arr.join(separator) : 'none';
    };

    // ========================================
    // HANDLE TOOL TYPE - Single page generation
    // ========================================
    if (orchestratorResult.type === 'tool') {
      // Import specialized HTML generators and tool tester
      const { generateSpecializedToolHTML } = require('./services/orchestrator.cjs');
      const { testTool, logTestResults } = require('./services/tool-tester.cjs');

      const toolKey = payload.toolKey || summary.toolKey;
      const toolConfig = payload.toolConfig || {};

      // Log TOOL-specific AI decisions
      console.log('');
      console.log('📊 AI DECISIONS (TOOL):');
      console.log('─'.repeat(40));
      console.log(`   🛠️ Tool Type: ${toolKey}`);
      console.log(`   📦 Tool Category: ${payload.toolCategory || summary.toolCategory || 'general'}`);
      console.log(`   📝 Tool Name: ${payload.name || summary.toolName || 'Unnamed Tool'}`);
      console.log(`   ✨ Features: ${safeJoin(toolConfig.features)}`);
      console.log(`   📋 Fields: ${safeJoin(toolConfig.fields?.map(f => f.label || f.name))}`);
      console.log(`   🎨 Colors: Primary ${toolConfig.colors?.primary || payload.theme?.colors?.primary || 'default'}`);
      console.log(`   📦 Modules needed: none (pure frontend)`);
      console.log(`   🎯 Confidence: ${summary.confidence || 'high'}`);
      console.log('─'.repeat(40));
      console.log('');

      const duration = Date.now() - startTime;

      // Create tool project directory
      const toolName = payload.name
        .replace(/&/g, ' and ')
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
        .substring(0, 50);

      const projectPath = path.join(GENERATED_PROJECTS, toolName);

      // Create project directory if it doesn't exist
      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
      }

      // Generate specialized HTML using orchestrator's generators
      const toolHtml = generateSpecializedToolHTML(toolKey, {
        name: payload.name,
        icon: toolConfig.icon,
        description: toolConfig.description,
        features: toolConfig.features,
        fields: toolConfig.fields,
        colors: toolConfig.colors || payload.theme?.colors
      });

      // ========================================
      // RUN AUTOMATED TOOL TESTS
      // ========================================
      console.log('');
      console.log('🧪 RUNNING TOOL VALIDATION TESTS');
      console.log('─'.repeat(40));

      const testResults = testTool(toolHtml, toolKey);
      logTestResults(testResults);

      console.log('─'.repeat(40));
      console.log('');

      // Save the HTML file
      fs.writeFileSync(path.join(projectPath, 'index.html'), toolHtml);

      // Generate tool-specific metadata
      const toolMeta = {
        generatedAt: new Date().toISOString(),
        originalInput: userInput,
        type: 'tool',
        toolKey: toolKey,
        toolCategory: payload.toolCategory || summary.toolCategory,
        toolConfig: toolConfig,
        theme: payload.theme,
        processingTimeMs: duration
      };

      // Save tool metadata
      fs.writeFileSync(
        path.join(projectPath, 'tool-meta.json'),
        JSON.stringify(toolMeta, null, 2)
      );

      console.log('');
      console.log('✅ TOOL GENERATION COMPLETE');
      console.log(`   ⏱️ Total time: ${(duration / 1000).toFixed(1)}s`);
      console.log(`   📁 Path: ${projectPath}`);
      console.log('='.repeat(60));

      return res.json({
        success: true,
        type: 'tool',
        project: {
          name: toolName,
          path: projectPath
        },
        tool: {
          originalInput: userInput,
          toolKey: toolKey,
          name: payload.name,
          category: payload.toolCategory || summary.toolCategory,
          icon: toolConfig.icon,
          description: toolConfig.description,
          features: toolConfig.features,
          fields: toolConfig.fields,
          colors: toolConfig.colors || payload.theme?.colors
        },
        // Include the HTML for preview/download/copy
        html: toolHtml,
        // Include test results for UI display
        testResults: {
          passed: testResults.passed,
          failed: testResults.failed,
          warnings: testResults.warnings,
          allPassed: testResults.allPassed,
          details: testResults.details
        },
        duration: duration
      });
    }

    // ========================================
    // HANDLE BUSINESS TYPE - Multi-page assembly
    // ========================================

    // Log BUSINESS-specific AI decisions
    console.log('');
    console.log('📊 AI DECISIONS (BUSINESS):');
    console.log('─'.repeat(40));
    console.log(`   🏢 Business Name: ${summary.businessName || payload.name || 'Unknown'}`);
    console.log(`   🏭 Industry: ${summary.industryName || 'Unknown'} (${payload.industry || 'unknown'})`);
    console.log(`   📍 Location: ${summary.location || 'Not specified'}`);
    console.log(`   📄 Pages (${summary.pages || 0}): ${safeJoin(payload.pages)}`);
    console.log(`   🔧 Modules (${summary.modules || 0}): ${safeJoin(payload.modules)}`);
    console.log(`   🎨 Colors: Primary ${payload.theme?.colors?.primary || 'default'}, Accent ${payload.theme?.colors?.accent || 'default'}`);
    console.log(`   🎯 Confidence: ${summary.confidence || 'unknown'}`);
    if (payload.metadata?.inferredDetails) {
      console.log(`   💬 Tagline: "${payload.metadata.inferredDetails.tagline || 'N/A'}"`);
      console.log(`   📢 CTA: "${payload.metadata.inferredDetails.callToAction || 'N/A'}"`);
    }
    console.log('─'.repeat(40));
    console.log('');

    // Validate the payload for business sites
    const validation = validatePayload(payload);
    if (!validation.valid) {
      console.log('❌ Validation failed:', safeJoin(validation.errors));
      return res.status(400).json({
        success: false,
        error: `Invalid configuration: ${safeJoin(validation.errors)}`
      });
    }

    console.log('🏢 BUSINESS MODE - Starting multi-page assembly');

    // Now execute the assembly by calling the same logic as /api/assemble
    // We'll forward the orchestrated payload to the internal assembly logic
    console.log('🚀 Starting assembly with orchestrated configuration...');

    // Sanitize project name - same as /api/assemble
    const sanitizedName = payload.name
      .replace(/&/g, ' and ')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);

    if (!sanitizedName || sanitizedName.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Generated project name is invalid'
      });
    }

    // Build command arguments
    const args = ['--name', sanitizedName];

    // Add industry
    const sanitizedIndustry = payload.industry
      .toLowerCase()
      .replace(/[&]/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    args.push('--industry', sanitizedIndustry);

    console.log(`   📦 Project: ${sanitizedName}`);
    console.log(`   🏭 Industry: ${sanitizedIndustry}`);

    const ASSEMBLY_TIMEOUT = 5 * 60 * 1000; // 5 minute timeout
    let responded = false;

    // Execute the assembly script
    const childProcess = spawn(process.execPath, [ASSEMBLE_SCRIPT, ...args], {
      cwd: path.dirname(ASSEMBLE_SCRIPT),
      shell: false,
      env: { ...process.env, MODULE_LIBRARY_PATH: MODULE_LIBRARY, OUTPUT_PATH: GENERATED_PROJECTS }
    });

    // Timeout handler
    const timeoutId = setTimeout(() => {
      if (!responded) {
        responded = true;
        childProcess.kill('SIGTERM');
        console.error('❌ Assembly timeout');
        res.status(504).json({
          success: false,
          error: 'Assembly timeout - process took too long',
          orchestratorSummary: summary
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

    childProcess.on('error', (err) => {
      clearTimeout(timeoutId);
      if (!responded) {
        responded = true;
        console.error(`❌ Spawn error: ${err.message}`);
        res.status(500).json({
          success: false,
          error: `Failed to start assembly: ${err.message}`,
          orchestratorSummary: summary
        });
      }
    });

    childProcess.on('close', async (code) => {
      clearTimeout(timeoutId);
      if (responded) return;
      responded = true;

      const duration = Date.now() - startTime;

      if (code === 0) {
        const projectPath = path.join(GENERATED_PROJECTS, sanitizedName);

        // Generate brain.json with orchestrator metadata
        const industryConfig = INDUSTRIES[sanitizedIndustry] || INDUSTRIES['consulting'] || {};
        const brainJsonContent = generateBrainJson(sanitizedName, sanitizedIndustry, industryConfig);
        fs.writeFileSync(path.join(projectPath, 'brain.json'), brainJsonContent);
        console.log('   🧠 brain.json generated');

        // Save orchestrator metadata
        const orchestratorMeta = {
          generatedAt: new Date().toISOString(),
          originalInput: userInput,
          aiDecisions: summary,
          payload: payload,
          processingTimeMs: duration
        };
        fs.writeFileSync(
          path.join(projectPath, 'orchestrator-meta.json'),
          JSON.stringify(orchestratorMeta, null, 2)
        );
        console.log('   📋 orchestrator-meta.json saved');

        // Copy business-admin module
        const businessAdminSrc = path.join(MODULE_LIBRARY, 'frontend', 'business-admin');
        const businessAdminDest = path.join(projectPath, 'admin');
        if (fs.existsSync(businessAdminSrc)) {
          copyDirectorySync(businessAdminSrc, businessAdminDest);
          console.log('   🎛️ business-admin module copied');
        }

        // ========================================
        // GENERATE FRONTEND PAGES (like Quick Start)
        // ========================================
        if (payload.pages && payload.pages.length > 0) {
          console.log('');
          console.log('🎨 GENERATING FRONTEND PAGES');
          console.log('─'.repeat(40));

          const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
          const frontendSrcPath = path.join(projectPath, 'frontend', 'src');
          const pagesDir = path.join(frontendSrcPath, 'pages');

          // Create pages directory
          if (!fs.existsSync(pagesDir)) {
            fs.mkdirSync(pagesDir, { recursive: true });
          }

          // Build prompt config from orchestrator data
          const promptConfig = {
            businessName: summary.businessName,
            industry: industryConfig,
            colors: payload.theme?.colors || { primary: '#6366f1', accent: '#06b6d4' },
            typography: payload.theme?.typography || { heading: "'Inter', sans-serif", body: "system-ui, sans-serif" }
          };

          // Build description object for page generation
          const description = {
            text: `${summary.businessName} - ${payload.metadata?.inferredDetails?.tagline || ''} ${payload.metadata?.inferredDetails?.description || ''}`,
            pages: payload.pages,
            businessName: summary.businessName,
            tagline: payload.metadata?.inferredDetails?.tagline,
            callToAction: payload.metadata?.inferredDetails?.callToAction,
            industryKey: sanitizedIndustry,
            location: summary.location
          };

          if (apiKey) {
            try {
              const { default: Anthropic } = await import('@anthropic-ai/sdk');
              const client = new Anthropic({ apiKey });
              const MODEL_NAME = 'claude-sonnet-4-20250514';

              console.log(`   ⚡ Generating ${payload.pages.length} pages in parallel...`);

              // Generate pages in parallel
              const pagePromises = payload.pages.map(async (pageId) => {
                const componentName = toComponentName(pageId);
                try {
                  console.log(`   🎨 Generating ${pageId} → ${componentName}Page.jsx...`);

                  const otherPages = payload.pages.filter(p => p !== pageId).map(p => `/${p}`).join(', ');

                  // Build orchestrator-specific page prompt
                  const pagePrompt = buildOrchestratorPagePrompt(pageId, componentName, otherPages, description, promptConfig);

                  const pageResponse = await client.messages.create({
                    model: MODEL_NAME,
                    max_tokens: 16000,
                    messages: [{ role: 'user', content: pagePrompt }]
                  });

                  let pageCode = pageResponse.content[0].text;
                  pageCode = pageCode.replace(/^```jsx?\n?/g, '').replace(/\n?```$/g, '').trim();

                  // Validate generated code
                  const validation = validateGeneratedCode(pageCode, componentName);
                  if (!validation.isValid) {
                    console.log(`   ⚠️ ${pageId} has issues: ${validation.errors.join(', ')}`);
                    pageCode = validation.fixedCode;
                  }

                  if (!pageCode.includes('export default')) {
                    console.log(`   ⚠️ ${pageId} incomplete, using fallback`);
                    pageCode = buildFallbackPage(componentName, pageId, promptConfig);
                  }

                  const pagePath = path.join(pagesDir, `${componentName}Page.jsx`);
                  fs.writeFileSync(pagePath, pageCode);
                  console.log(`   ✅ ${componentName}Page.jsx`);
                  return { pageId, componentName, success: true };

                } catch (pageErr) {
                  console.error(`   ⚠️ ${pageId} failed: ${pageErr.message}`);
                  const fallbackCode = buildFallbackPage(componentName, pageId, promptConfig);
                  fs.writeFileSync(path.join(pagesDir, `${componentName}Page.jsx`), fallbackCode);
                  return { pageId, componentName, success: false, fallback: true };
                }
              });

              const results = await Promise.all(pagePromises);
              const successCount = results.filter(r => r.success).length;
              console.log(`   ✅ ${successCount}/${payload.pages.length} pages generated`);

              // Generate App.jsx with routes
              const appJsx = buildAppJsx(sanitizedName, payload.pages, promptConfig, sanitizedIndustry);
              fs.writeFileSync(path.join(frontendSrcPath, 'App.jsx'), appJsx);
              console.log('   ✅ App.jsx updated with routes');

              // Ensure theme.css exists
              const themeCssPath = path.join(frontendSrcPath, 'theme.css');
              if (!fs.existsSync(themeCssPath)) {
                const fallbackTheme = buildFallbackThemeCss(promptConfig);
                fs.writeFileSync(themeCssPath, fallbackTheme);
                console.log('   🎨 Created theme.css');
              }

            } catch (pageGenErr) {
              console.error('   ⚠️ Page generation error:', pageGenErr.message);
              // Continue with assembly even if page generation fails
            }
          } else {
            console.log('   ⚠️ No API key - skipping AI page generation');
            // Generate basic fallback pages
            for (const pageId of payload.pages) {
              const componentName = toComponentName(pageId);
              const fallbackCode = buildFallbackPage(componentName, pageId, promptConfig);
              fs.writeFileSync(path.join(pagesDir, `${componentName}Page.jsx`), fallbackCode);
            }
            const appJsx = buildAppJsx(sanitizedName, payload.pages, promptConfig, sanitizedIndustry);
            fs.writeFileSync(path.join(frontendSrcPath, 'App.jsx'), appJsx);
            console.log('   ✅ Fallback pages and App.jsx created');
          }

          console.log('─'.repeat(40));
        }

        console.log('');
        console.log('✅ ORCHESTRATION COMPLETE');
        console.log(`   ⏱️ Total time: ${(duration / 1000).toFixed(1)}s`);
        console.log('='.repeat(60));

        res.json({
          success: true,
          project: {
            name: sanitizedName,
            path: projectPath
          },
          orchestrator: {
            originalInput: userInput,
            summary: summary,
            decisions: {
              businessName: summary.businessName,
              industry: summary.industry,
              industryName: summary.industryName,
              location: summary.location,
              pages: payload.pages,
              modules: payload.modules,
              colors: payload.theme?.colors,
              tagline: payload.metadata?.inferredDetails?.tagline,
              callToAction: payload.metadata?.inferredDetails?.callToAction,
              confidence: summary.confidence
            }
          },
          duration: duration
        });
      } else {
        console.error(`❌ Assembly failed with code ${code}`);
        res.status(500).json({
          success: false,
          error: 'Assembly failed',
          details: errorOutput || output,
          orchestratorSummary: summary
        });
      }
    });

  } catch (error) {
    console.error('❌ Orchestrator error:', error.message);
    captureException(error, { tags: { component: 'orchestrator' } });
    res.status(500).json({
      success: false,
      error: `Orchestration failed: ${error.message}`
    });
  }
});

// ============================================
// INTENT DETECTION ENDPOINT
// ============================================

/**
 * POST /api/orchestrate/detect-intent
 * Detect intent type from user input without starting full orchestration
 * Used to determine if we should show choice screen
 *
 * Request: { input: "I'm starting a bakery" }
 * Response: { type: 'ambiguous' | 'tool' | 'business' | 'recommendations', detectedIndustry, ... }
 */
app.post('/api/orchestrate/detect-intent', async (req, res) => {
  const { input } = req.body;

  if (!input || input.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Input is required'
    });
  }

  try {
    const { detectIntentType, VALID_INDUSTRIES, INDUSTRY_KEYWORDS } = require('./services/orchestrator.cjs');

    const intent = detectIntentType(input);

    // Get a display-friendly industry name
    let industryDisplay = intent.detectedIndustry;
    if (industryDisplay) {
      // Convert kebab-case to Title Case
      industryDisplay = industryDisplay
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    // Get industry icon
    const industryIcons = {
      'bakery': '🥐',
      'restaurant': '🍽️',
      'pizza': '🍕',
      'cafe': '☕',
      'bar': '🍺',
      'fitness': '💪',
      'yoga': '🧘',
      'spa-salon': '💆',
      'dental': '🦷',
      'healthcare': '🏥',
      'law-firm': '⚖️',
      'accounting': '📊',
      'real-estate': '🏠',
      'consulting': '💼',
      'photography': '📸',
      'freelance': '💻',
      'agency': '🎨',
      'startup': '🚀',
      'saas': '☁️',
      'ecommerce': '🛒',
      'plumbing': '🔧',
      'hvac': '❄️',
      'electrical': '⚡',
      'landscaping': '🌳',
      'cleaning': '🧹',
      'auto': '🚗',
      'pet': '🐾',
      'education': '📚',
      'nonprofit': '❤️',
      'church': '⛪',
      'wedding': '💒'
    };

    const icon = industryIcons[intent.detectedIndustry] || '🏢';

    console.log(`[detect-intent] "${input}" → ${intent.type} (industry: ${intent.detectedIndustry || 'none'})`);

    return res.json({
      success: true,
      type: intent.type,
      toolKey: intent.toolKey,
      confidence: intent.confidence,
      detectedIndustry: intent.detectedIndustry,
      industryDisplay,
      industryIcon: icon,
      originalInput: input
    });

  } catch (error) {
    console.error('❌ Intent detection error:', error);
    return res.status(500).json({
      success: false,
      error: `Detection failed: ${error.message}`
    });
  }
});

// ============================================
// TOOL RECOMMENDATIONS ENDPOINT
// ============================================

/**
 * POST /api/orchestrate/recommend
 * Get tool recommendations for an industry/profession
 *
 * Request: { input: "I'm a plumber" } or { industry: "plumbing" }
 * Response: { recommendations: [...], industry: "plumbing" }
 */
app.post('/api/orchestrate/recommend', orchestrateRateLimiter, async (req, res) => {
  const { input, industry } = req.body;
  const startTime = Date.now();

  // Validate input
  const userInput = input?.trim() || industry?.trim();
  if (!userInput || userInput.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Please provide an industry or description (minimum 2 characters)'
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('💡 TOOL RECOMMENDATIONS');
  console.log('='.repeat(60));
  console.log(`📝 Input: "${userInput}"`);

  try {
    const { recommendTools, detectRecommendationIntent } = require('./services/orchestrator.cjs');

    // Detect intent if full input provided
    let industryToUse = industry;
    if (input && !industry) {
      const intent = detectRecommendationIntent(input);
      if (intent.industry) {
        industryToUse = intent.industry;
        console.log(`🎯 Detected industry: ${industryToUse}`);
      } else {
        industryToUse = input; // Use raw input for AI inference
      }
    }

    // Get recommendations
    const result = await recommendTools(industryToUse || userInput);
    const duration = Date.now() - startTime;

    console.log(`✅ Got ${result.recommendations.length} recommendations in ${duration}ms`);
    console.log(`   Source: ${result.source}`);
    console.log('='.repeat(60));

    return res.json({
      success: true,
      ...result,
      duration
    });
  } catch (error) {
    console.error('❌ Recommendation error:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to get recommendations: ${error.message}`
    });
  }
});

/**
 * POST /api/orchestrate/build-tool
 * Build a specific tool by toolType (used from recommendations)
 *
 * Request: { toolType: "tip-calculator", name: "My Tip Calculator" }
 * Response: Same as /api/orchestrate for tool type
 */
app.post('/api/orchestrate/build-tool', orchestrateRateLimiter, async (req, res) => {
  const { toolType, name, customization } = req.body;
  const startTime = Date.now();

  if (!toolType) {
    return res.status(400).json({
      success: false,
      error: 'Tool type is required'
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('🔧 BUILD SPECIFIC TOOL');
  console.log('='.repeat(60));
  console.log(`📝 Tool Type: ${toolType}`);
  console.log(`📛 Name: ${name || 'default'}`);

  try {
    const { TOOL_TEMPLATES, generateSpecializedToolHTML } = require('./services/orchestrator.cjs');

    // Get tool template
    const template = TOOL_TEMPLATES[toolType];
    if (!template) {
      // Fall back to generic prompt-based generation
      console.log('   Using AI generation for unknown tool type');
      const { orchestrate } = require('./services/orchestrator.cjs');
      const result = await orchestrate(`Create a ${toolType.replace(/-/g, ' ')}`);

      if (!result.success || result.type !== 'tool') {
        return res.status(400).json({
          success: false,
          error: `Could not generate tool: ${toolType}`
        });
      }

      // Generate HTML
      const toolHtml = generateSpecializedToolHTML(result.payload.toolKey, {
        name: name || result.payload.name,
        ...result.payload.toolConfig
      });

      const duration = Date.now() - startTime;

      return res.json({
        success: true,
        type: 'tool',
        tool: {
          toolKey: result.payload.toolKey,
          name: name || result.payload.name,
          ...result.payload.toolConfig
        },
        html: toolHtml,
        duration
      });
    }

    // Generate from known template
    const toolConfig = {
      name: name || template.name,
      icon: template.icon,
      description: template.description,
      features: template.features,
      fields: template.fields,
      colors: customization?.colors || template.colors
    };

    const toolHtml = generateSpecializedToolHTML(toolType, toolConfig);
    const duration = Date.now() - startTime;

    // Create project directory
    const toolName = (name || template.name)
      .replace(/&/g, ' and ')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 50);

    const projectPath = path.join(GENERATED_PROJECTS, toolName);
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }
    fs.writeFileSync(path.join(projectPath, 'index.html'), toolHtml);

    console.log('✅ Tool built successfully');
    console.log(`   ⏱️ Time: ${duration}ms`);
    console.log('='.repeat(60));

    return res.json({
      success: true,
      type: 'tool',
      project: {
        name: toolName,
        path: projectPath
      },
      tool: {
        toolKey: toolType,
        ...toolConfig
      },
      html: toolHtml,
      duration
    });
  } catch (error) {
    console.error('❌ Build tool error:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to build tool: ${error.message}`
    });
  }
});

/**
 * POST /api/orchestrate/build-suite
 * Build a Tool Suite with multiple tools
 *
 * Request: {
 *   tools: [{ toolType: "calculator", name: "Calculator" }, ...],
 *   branding: { businessName: "My Business", colors: {...}, style: "modern" },
 *   options: { organization: "grid", toolOrder: [...], categoryGroups: {...} }
 * }
 * Response: { success, files, zipPath, suiteConfig }
 */
app.post('/api/orchestrate/build-suite', orchestrateRateLimiter, async (req, res) => {
  const { tools, branding, options } = req.body;
  const startTime = Date.now();

  console.log('');
  console.log('='.repeat(60));
  console.log('🧰 TOOL SUITE BUILDER');
  console.log('='.repeat(60));

  try {
    // Validate input
    if (!tools || !Array.isArray(tools) || tools.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 tools are required for a suite'
      });
    }

    if (tools.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 20 tools per suite'
      });
    }

    const { generateToolSuite, getSuiteOrganization, TOOL_TEMPLATES } = require('./services/orchestrator.cjs');

    // Process tools - get full config for each
    const processedTools = tools.map(tool => {
      const template = TOOL_TEMPLATES[tool.toolType] || TOOL_TEMPLATES['generic'] || {
        name: tool.name || 'Tool',
        icon: '🔧',
        description: 'A useful tool'
      };

      return {
        key: tool.toolType,
        toolKey: tool.toolType,
        name: tool.name || template.name,
        icon: tool.icon || template.icon,
        description: tool.description || template.description,
        category: tool.category || template.category || 'General',
        features: tool.features || template.features || [],
        fields: tool.fields || template.fields || []
      };
    });

    // Determine organization if not specified
    const organization = options?.organization
      ? { type: options.organization, description: `${options.organization} layout` }
      : getSuiteOrganization(processedTools.length);

    console.log(`   🏢 Business: ${branding?.businessName || 'Tool Suite'}`);
    console.log(`   🛠️ Tools: ${processedTools.length}`);
    console.log(`   📊 Organization: ${organization.type}`);
    console.log(`   🎨 Style: ${branding?.style || 'modern'}`);
    console.log('─'.repeat(40));

    // Log each tool
    processedTools.forEach((tool, i) => {
      console.log(`   ${i + 1}. ${tool.icon} ${tool.name} (${tool.key})`);
    });
    console.log('─'.repeat(40));

    // Generate the suite
    const suiteResult = generateToolSuite(processedTools, branding, {
      organization,
      toolOrder: options?.toolOrder,
      categoryGroups: options?.categoryGroups
    });

    // Create suite directory
    const suiteName = (branding?.businessName || 'tool-suite')
      .replace(/&/g, ' and ')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 50);

    const suiteDir = path.join(GENERATED_PROJECTS, `${suiteName}-suite`);

    // Clean and create directory
    if (fs.existsSync(suiteDir)) {
      fs.rmSync(suiteDir, { recursive: true, force: true });
    }
    fs.mkdirSync(suiteDir, { recursive: true });

    // Create tools subdirectory if needed
    if (organization.type !== 'tabbed') {
      fs.mkdirSync(path.join(suiteDir, 'tools'), { recursive: true });
    }

    // Write all files
    const fileList = [];
    for (const [filename, content] of Object.entries(suiteResult.files)) {
      const filePath = path.join(suiteDir, filename);
      // Ensure parent directory exists
      const parentDir = path.dirname(filePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(filePath, content);
      fileList.push(filename);
      console.log(`   ✅ Created: ${filename}`);
    }

    // Generate ZIP file
    let zipPath = null;
    try {
      const archiver = require('archiver');
      zipPath = path.join(suiteDir, `${suiteName}-suite.zip`);

      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);

        // Add all files except the zip itself
        for (const [filename, content] of Object.entries(suiteResult.files)) {
          archive.append(content, { name: filename });
        }

        archive.finalize();
      });

      console.log(`   📦 ZIP created: ${path.basename(zipPath)}`);
    } catch (zipError) {
      console.log('   ⚠️ ZIP creation skipped (archiver not available)');
    }

    const duration = Date.now() - startTime;

    console.log('');
    console.log('✅ TOOL SUITE COMPLETE');
    console.log(`   ⏱️ Time: ${duration}ms`);
    console.log(`   📁 Path: ${suiteDir}`);
    console.log(`   📄 Files: ${fileList.length}`);
    console.log('='.repeat(60));

    // Read index.html for preview
    const indexHtml = suiteResult.files['index.html'];

    return res.json({
      success: true,
      type: 'suite',
      project: {
        name: `${suiteName}-suite`,
        path: suiteDir
      },
      suite: {
        businessName: branding?.businessName || 'Tool Suite',
        organization: organization.type,
        toolCount: processedTools.length,
        tools: processedTools.map(t => ({
          key: t.key,
          name: t.name,
          icon: t.icon,
          category: t.category
        }))
      },
      files: fileList,
      html: indexHtml,
      zipPath: zipPath,
      zipFilename: zipPath ? `${suiteName}-suite.zip` : null,
      duration
    });

  } catch (error) {
    console.error('❌ Build suite error:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to build suite: ${error.message}`
    });
  }
});

/**
 * GET /api/orchestrate/download-suite/:projectName
 * Download the suite ZIP file
 */
app.get('/api/orchestrate/download-suite/:projectName', (req, res) => {
  const { projectName } = req.params;

  if (!projectName) {
    return res.status(400).json({ success: false, error: 'Project name required' });
  }

  // Security: sanitize project name
  const safeName = projectName.replace(/[^a-zA-Z0-9-]/g, '');
  const suiteDir = path.join(GENERATED_PROJECTS, safeName);
  const zipPath = path.join(suiteDir, `${safeName}.zip`);

  if (!fs.existsSync(zipPath)) {
    // Try to find any zip in the directory
    const files = fs.readdirSync(suiteDir);
    const zipFile = files.find(f => f.endsWith('.zip'));
    if (zipFile) {
      return res.download(path.join(suiteDir, zipFile), zipFile);
    }
    return res.status(404).json({ success: false, error: 'ZIP file not found' });
  }

  res.download(zipPath, `${safeName}.zip`);
});

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

      // Track API cost
      if (response.usage && db && db.trackApiUsage) {
        const inputTokens = response.usage.input_tokens || 0;
        const outputTokens = response.usage.output_tokens || 0;
        const cost = (inputTokens / 1000000) * 3.0 + (outputTokens / 1000000) * 15.0;
        console.log(`   💰 API Cost: $${cost.toFixed(4)} (${inputTokens} in / ${outputTokens} out)`);
        try {
          await db.trackApiUsage({
            endpoint: 'claude-api', operation: 'analyze-site-url',
            tokensUsed: inputTokens + outputTokens, inputTokens, outputTokens, cost, responseStatus: 200
          });
        } catch (trackingErr) {
          console.warn('   ⚠️ API usage tracking failed:', trackingErr.message);
        }
      }

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

    // Track API cost
    if (response.usage && db && db.trackApiUsage) {
      const inputTokens = response.usage.input_tokens || 0;
      const outputTokens = response.usage.output_tokens || 0;
      const cost = (inputTokens / 1000000) * 3.0 + (outputTokens / 1000000) * 15.0;
      console.log(`   💰 API Cost: $${cost.toFixed(4)} (${inputTokens} in / ${outputTokens} out)`);
      try {
        await db.trackApiUsage({
          endpoint: 'claude-api', operation: 'analyze-site-vision',
          tokensUsed: inputTokens + outputTokens, inputTokens, outputTokens, cost, responseStatus: 200
        });
      } catch (trackingErr) {
          console.warn('   ⚠️ API usage tracking failed:', trackingErr.message);
        }
    }

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

    // Track API cost
    if (response.usage && db && db.trackApiUsage) {
      const inputTokens = response.usage.input_tokens || 0;
      const outputTokens = response.usage.output_tokens || 0;
      const cost = (inputTokens / 1000000) * 3.0 + (outputTokens / 1000000) * 15.0;
      console.log(`   💰 API Cost: $${cost.toFixed(4)} (${inputTokens} in / ${outputTokens} out)`);
      try {
        await db.trackApiUsage({
          endpoint: 'claude-api', operation: 'generate-theme',
          tokensUsed: inputTokens + outputTokens, inputTokens, outputTokens, cost, responseStatus: 200
        });
      } catch (trackingErr) {
          console.warn('   ⚠️ API usage tracking failed:', trackingErr.message);
        }
    }

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

    // Track API cost
    if (response.usage && db && db.trackApiUsage) {
      const inputTokens = response.usage.input_tokens || 0;
      const outputTokens = response.usage.output_tokens || 0;
      const cost = (inputTokens / 1000000) * 3.0 + (outputTokens / 1000000) * 15.0;
      console.log(`   💰 API Cost: $${cost.toFixed(4)} (${inputTokens} in / ${outputTokens} out)`);
      try {
        await db.trackApiUsage({
          endpoint: 'claude-api', operation: 'analyze-existing-site',
          tokensUsed: inputTokens + outputTokens, inputTokens, outputTokens, cost, responseStatus: 200
        });
      } catch (trackingErr) {
          console.warn('   ⚠️ API usage tracking failed:', trackingErr.message);
        }
    }

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
// Deploy endpoint with Server-Sent Events for real-time progress
app.post('/api/deploy', async (req, res) => {
  const { projectPath, projectName, adminEmail, stream } = req.body;

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

  // If streaming requested, use SSE
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const result = await deployService.deployProject(projectPath, projectName, {
        adminEmail: adminEmail || 'admin@be1st.io',
        onProgress: (progress) => {
          res.write(`data: ${JSON.stringify(progress)}\n\n`);
        }
      });

      // Send final result
      res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Deploy error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  } else {
    // Non-streaming mode (original behavior)
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

// Poll Railway deployment status
app.get('/api/deploy/railway-status/:projectId', async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({ success: false, error: 'Project ID required' });
  }

  if (!process.env.RAILWAY_TOKEN) {
    return res.status(500).json({ success: false, error: 'Railway token not configured' });
  }

  try {
    // GraphQL query to get all services and their deployment status
    const query = `
      query($projectId: String!) {
        project(id: $projectId) {
          id
          name
          services {
            edges {
              node {
                id
                name
                deployments(first: 1) {
                  edges {
                    node {
                      id
                      status
                      createdAt
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://backboard.railway.app/graphql/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RAILWAY_TOKEN}`
      },
      body: JSON.stringify({ query, variables: { projectId } })
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'Railway API error');
    }

    const project = data.data?.project;
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Map services to their status
    const services = {};
    let allDeployed = true;
    let hasFailure = false;

    for (const edge of (project.services?.edges || [])) {
      const service = edge.node;
      const latestDeployment = service.deployments?.edges?.[0]?.node;
      const status = latestDeployment?.status || 'PENDING';

      // Normalize service names (postgres, backend, frontend, admin)
      let serviceName = service.name.toLowerCase();
      if (serviceName.includes('postgres') || serviceName.includes('database')) {
        serviceName = 'postgres';
      } else if (serviceName.includes('backend') || serviceName.includes('api')) {
        serviceName = 'backend';
      } else if (serviceName.includes('admin')) {
        serviceName = 'admin';
      } else if (serviceName.includes('frontend')) {
        serviceName = 'frontend';
      }

      services[serviceName] = {
        name: service.name,
        status: status,
        isDeployed: status === 'SUCCESS',
        isFailed: status === 'FAILED' || status === 'CRASHED',
        isBuilding: status === 'BUILDING' || status === 'DEPLOYING' || status === 'INITIALIZING'
      };

      if (status !== 'SUCCESS') {
        allDeployed = false;
      }
      if (status === 'FAILED' || status === 'CRASHED') {
        hasFailure = true;
      }
    }

    res.json({
      success: true,
      projectId: project.id,
      projectName: project.name,
      services,
      allDeployed,
      hasFailure,
      serviceCount: Object.keys(services).length
    });

  } catch (error) {
    console.error('Railway status check failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check Railway status'
    });
  }
});

// ============================================
// SENTRY TEST ENDPOINT (for verification)
// ============================================
app.get('/api/sentry-test', (req, res) => {
  throw new Error('Sentry test error - this is intentional!');
});

app.post('/api/sentry-test', (req, res) => {
  const { message } = req.body;
  captureException(new Error(message || 'Manual test error'), {
    tags: { type: 'manual-test' },
    extra: { timestamp: new Date().toISOString() }
  });
  res.json({ success: true, message: 'Error sent to Sentry' });
});

// ============================================
// SENTRY ERROR HANDLER - Must be AFTER all routes
// ============================================
app.use(sentryErrorHandler());

// Global error handler (after Sentry captures the error)
app.use((err, req, res, next) => {
  console.error('🔴 Server error:', err.message);

  // Capture to Sentry if not already captured
  captureException(err, {
    tags: { handler: 'global-error-handler' },
    extra: {
      url: req.url,
      method: req.method,
      body: req.body
    }
  });

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
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
