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

// ===========================================
// EXTRACTED ROUTES
// ===========================================
const {
  createAuthRoutes,
  createConfigRoutes,
  createUtilityRoutes,
  createDeployRoutes,
  createOrchestratorRoutes
} = require('./lib/routes/index.cjs');


// ===========================================
// EXTRACTED SERVICES
// ===========================================
const {
  extractPdfText,
  fetchPexelsVideo,
  getIndustryVideo
} = require('./lib/services/index.cjs');

// ===========================================
// EXTRACTED PROMPT BUILDERS
// ===========================================
const {
  initPromptBuilders,
  detectIndustryFromDescription,
  buildPrompt,
  buildSmartContextGuide,
  buildLayoutContextFromPreview,
  extractBusinessStats,
  generateDefaultStats,
  getIndustryImageUrls,
  buildRebuildContext,
  buildInspiredContext,
  buildUploadedAssetsContext,
  buildFreshModePrompt,
  getIndustryDesignGuidance,
  getPageRequirements,
  buildEnhanceModePrompt,
  getPageSpecificInstructions,
  getEnhancePageInstructions,
  buildOrchestratorPagePrompt,
  buildFallbackPage,
  getIndustryHeaderConfig,
  buildFallbackThemeCss
} = require('./lib/prompt-builders/index.cjs');

// ===========================================
// EXTRACTED GENERATORS
// ===========================================
const {
  generateBrainJson,
  generateToolHtml,
  generateBrainRoutes,
  generateHealthRoutes,
  buildAppJsx,
  validateGeneratedCode
} = require('./lib/generators/index.cjs');

// ===========================================
// DEPLOY SERVICE (needed early for autoDeploy)
// ===========================================
const deployService = require('./services/deploy-service.cjs');
const deployReady = deployService.checkCredentials();

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

// Load prompt configs
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');
const INDUSTRIES = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, 'industries.json'), 'utf-8'));
const LAYOUTS = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, 'layouts.json'), 'utf-8'));
const EFFECTS = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, 'effects.json'), 'utf-8'));
const SECTIONS = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, 'sections.json'), 'utf-8'));

// Initialize prompt builders with loaded configs
initPromptBuilders({ INDUSTRIES, LAYOUTS, EFFECTS, SECTIONS });

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
// MOUNTED ROUTE MODULES
// ============================================

// Utility routes (open-folder, open-vscode, analyze-site, generate-theme, analyze-existing-site)
const utilityRouter = createUtilityRoutes({
  GENERATED_PROJECTS,
  MODULE_LIBRARY,
  db
});
app.use('/api', utilityRouter);

// Auth routes (health, validate, validate-dev, login)
const authRouter = createAuthRoutes({ db });
app.use('/api', authRouter);

// Config routes (bundles, industries, layouts, effects, sections, modules, projects)
const configRouter = createConfigRoutes({
  BUNDLES,
  INDUSTRIES,
  LAYOUTS,
  EFFECTS,
  SECTIONS,
  INDUSTRY_PRESETS,
  buildPrompt,
  GENERATED_PROJECTS
});
app.use('/api', configRouter);

// Deploy routes (deploy, deploy/status, deploy/railway-status)
const deployRouter = createDeployRoutes({
  deployService,
  deployReady
});
app.use('/api', deployRouter);

// Orchestrator routes (orchestrate, orchestrate/detect-intent, etc.)
const orchestratorRouter = createOrchestratorRoutes({
  INDUSTRIES,
  LAYOUTS,
  EFFECTS,
  SECTIONS,
  buildPrompt,
  buildOrchestratorPagePrompt,
  getIndustryImageUrls,
  getIndustryDesignGuidance,
  buildFallbackPage,
  buildFallbackThemeCss,
  generateBrainJson,
  generateToolHtml,
  generateBrainRoutes,
  generateHealthRoutes,
  buildAppJsx,
  toComponentName,
  toPageFileName,
  toRoutePath,
  toNavLabel,
  copyDirectorySync,
  GENERATED_PROJECTS,
  MODULE_LIBRARY,
  ASSEMBLE_SCRIPT,
  autoDeployProject,
  db,
  INDUSTRY_LAYOUTS,
  buildLayoutContext,
  getLayoutConfig
});
app.use('/api', orchestratorRouter);

// ============================================
// API ENDPOINTS (remaining inline routes)
// ============================================

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

// Auto-deploy helper function (uses deployService defined at top)
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
