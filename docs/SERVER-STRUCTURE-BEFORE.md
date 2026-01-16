# Server.cjs Structure - BEFORE Refactoring

**File:** `module-assembler-ui/server.cjs`
**Total Lines:** 7,518
**Date:** 2026-01-16

---

## Table of Contents

1. [Imports & Initialization](#imports--initialization)
2. [Security & Password Validation](#security--password-validation)
3. [Utility Functions](#utility-functions)
4. [Industry Detection](#industry-detection)
5. [Configuration Constants](#configuration-constants)
6. [Security Middleware](#security-middleware)
7. [API Endpoints](#api-endpoints)
8. [Generators](#generators)
9. [Prompt Builders](#prompt-builders)
10. [Orchestrator Logic](#orchestrator-logic)
11. [Deployment](#deployment)

---

## 1. Imports & Initialization (Lines 1-30)

```
Line 1-9:     File header comments
Line 10:      dotenv config
Line 13-19:   Sentry imports
Line 21-29:   Express, cors, helmet, path, fs, bcrypt, jwt imports
```

**Dependencies:**
- dotenv, express, cors, helmet
- child_process (spawn)
- path, fs
- express-validator
- bcryptjs, jsonwebtoken
- ./lib/sentry.cjs

---

## 2. Security & Password Validation (Lines 31-97)

```
Line 31-41:   PASSWORD_REQUIREMENTS constants
Line 48-97:   function validatePasswordStrength(password)
```

**Functions:**
- `validatePasswordStrength(password)` → { valid: boolean, errors: string[] }

---

## 3. Utility Functions (Lines 100-280)

```
Line 100-118:  async function initializeServices()
Line 120-134:  async function extractPdfText(base64Data)
Line 136-188:  async function fetchPexelsVideo(searchQuery)
Line 190-233:  async function getIndustryVideo(industryName, businessName)
```

### Page Name Utilities (Lines 235-280)
```
Line 241-251:  function toComponentName(pageId)
Line 253-258:  function toPageFileName(pageId)
Line 260-268:  function toRoutePath(pageId)
Line 270-280:  function toNavLabel(pageId)
```

**Functions:**
- `initializeServices()` - Initialize Anthropic client
- `extractPdfText(base64Data)` - Extract text from PDF
- `fetchPexelsVideo(searchQuery)` - Fetch video from Pexels API
- `getIndustryVideo(industryName, businessName)` - Get video for industry
- `toComponentName(pageId)` - Convert page ID to PascalCase
- `toPageFileName(pageId)` - Convert page ID to file name
- `toRoutePath(pageId)` - Convert page ID to URL route
- `toNavLabel(pageId)` - Convert page ID to display label

---

## 4. Industry Detection (Lines 283-437)

```
Line 286-378:  function detectIndustryFromDescription(description)
Line 380-437:  function buildPrompt(industryKey, layoutKey, selectedEffects)
```

**Functions:**
- `detectIndustryFromDescription(description)` - Keyword-based industry detection
- `buildPrompt(industryKey, layoutKey, selectedEffects)` - Build generation prompt

---

## 5. Security Middleware (Lines 439-519)

```
Line 442-519:  Rate limiters, CORS, Helmet, Express setup
```

**Middleware:**
- Rate limiters (orchestrateRateLimiter, globalRateLimiter)
- CORS configuration
- Helmet security headers
- Body parser
- Static file serving
- Sentry handlers

---

## 6. Configuration Constants (Lines 521-657)

```
Line 526-532:  VISUAL_ARCHETYPES
Line 534-598:  BUNDLES
Line 600-657:  INDUSTRY_PRESETS
```

**Constants:**
- `VISUAL_ARCHETYPES` - Layout style definitions
- `BUNDLES` - Module bundle configurations
- `INDUSTRY_PRESETS` - Industry-specific module presets

---

## 7. API Endpoints

### Health & Auth (Lines 659-924)
```
Line 664:      GET /api/health
Line 672:      POST /api/auth/validate
Line 693:      POST /api/auth/validate-dev
Line 714:      POST /api/auth/login
Line 775:      GET /api/bundles
Line 780:      GET /api/industries
Line 796:      GET /api/industry/:key
Line 806:      GET /api/layouts
Line 811:      GET /api/effects
Line 816:      GET /api/sections
Line 821:      POST /api/build-prompt
Line 831:      GET /api/modules/industry/:industryKey
Line 863:      POST /api/modules/bundles
Line 891:      GET /api/projects
```

### Assembly Endpoint (Lines 1535-2316)
```
Line 1539:     POST /api/assemble (main assembly endpoint)
```

### Orchestrator Endpoints (Lines 5514-6527)
```
Line 5532:     POST /api/orchestrate
Line 6042:     POST /api/orchestrate/detect-intent
Line 6137:     POST /api/orchestrate/recommend
Line 6199:     POST /api/orchestrate/build-tool
Line 6320:     POST /api/orchestrate/build-suite
Line 6503:     GET /api/orchestrate/download-suite/:projectName
```

### Utility Endpoints (Lines 6528-6824)
```
Line 6533:     POST /api/open-folder
Line 6558:     POST /api/open-vscode
Line 6586:     POST /api/analyze-site
Line 6736:     POST /api/generate-theme
Line 6829:     POST /api/analyze-existing-site
```

### Deploy Endpoints (Lines 7180-7406)
```
Line 7210:     POST /api/deploy
Line 7279:     GET /api/deploy/status
Line 7291:     GET /api/deploy/railway-status/:projectId
```

### Test Endpoints (Lines 7407-7421)
```
Line 7410:     GET /api/sentry-test
Line 7414:     POST /api/sentry-test
```

---

## 8. Generators (Lines 925-1534)

### Brain.json Generator (Lines 925-1022)
```
Line 929-1021:  function generateBrainJson(projectName, industryKey, industryConfig)
```

### Tool HTML Generator (Lines 1023-1534)
```
Line 1027-1393:  function generateToolHtml(payload)
Line 1395-1404:  function generateBrainRoutes()
Line 1406-1415:  function readBrain()
Line 1417-1478:  function writeBrain(data)
Line 1480-1516:  function generateHealthRoutes()
Line 1518-1532:  function copyDirectorySync(src, dest)
```

**Functions:**
- `generateBrainJson()` - Generate brain.json config
- `generateToolHtml()` - Generate single-page tool HTML
- `generateBrainRoutes()` - Generate brain API routes
- `readBrain()` / `writeBrain()` - Brain file I/O
- `generateHealthRoutes()` - Generate health check routes
- `copyDirectorySync()` - Recursive directory copy

---

## 9. Prompt Builders (Lines 2319-4475)

### Smart Context (Lines 2327-2660)
```
Line 2327-2513:  function buildSmartContextGuide(businessInput, industryName)
Line 2515-2574:  function buildLayoutContextFromPreview(layoutId, previewConfig, industryKey)
Line 2576-2659:  function extractBusinessStats(businessText, industryName)
Line 2661-2725:  function generateDefaultStats(industryName)
```

### Industry Context (Lines 2727-3284)
```
Line 2727-3013:  function getIndustryImageUrls(industryName)
Line 3015-3147:  function buildRebuildContext(existingSite)
Line 3149-3206:  function buildInspiredContext(referenceSites)
Line 3208-3284:  function buildUploadedAssetsContext(uploadedAssets, imageDescription)
```

### Page Prompt Builders (Lines 3286-4475)
```
Line 3286-3763:  async function buildFreshModePrompt(pageId, pageName, otherPages, description, promptConfig)
Line 3765-4024:  function getIndustryDesignGuidance(industryName)
Line 4026-4114:  function getPageRequirements(pageId)
Line 4116-4152:  function buildEnhanceModePrompt(pageId, pageName, existingSiteData, promptConfig)
Line 4154-4368:  function getPageSpecificInstructions(pageId, colors, layout)
Line 4370-4384:  function getEnhancePageInstructions(pageId, existingSiteData)
Line 4386-4455:  function buildOrchestratorPagePrompt(pageId, componentName, otherPages, description, promptConfig)
Line 4457-4475:  function buildFallbackPage(componentName, pageId, promptConfig)
```

---

## 10. Industry & App Builders (Lines 4477-5512)

### Industry Header Config (Lines 4477-4638)
```
Line 4480-4638:  function getIndustryHeaderConfig(industry)
```

### App.jsx Builder (Lines 4640-5289)
```
Line 4640-5288:  function buildAppJsx(name, pages, promptConfig, industry)
```

### Lucide Icons Whitelist (Lines 5290-5412)
```
Line 5293-5412:  const VALID_LUCIDE_ICONS = [...]
```

### Syntax Validation (Lines 5414-5512)
```
Line 5417-5491:  function validateGeneratedCode(code, componentName)
Line 5493-5512:  function buildFallbackThemeCss(promptConfig)
```

---

## 11. Deployment (Lines 7180-7406)

```
Line 7190-7208:  async function autoDeployProject(projectPath, projectName, adminEmail)
Line 7210-7277:  POST /api/deploy endpoint
Line 7279-7289:  GET /api/deploy/status endpoint
Line 7291-7405:  GET /api/deploy/railway-status/:projectId endpoint
```

---

## 12. Server Startup (Lines 7450-7518)

```
Line 7453-7516:  async function startServer()
Line 7518:       startServer() call
```

---

## Proposed Extraction Groups

### Group 1: Utils (Pure helpers, no dependencies)
- `validatePasswordStrength`
- `toComponentName`, `toPageFileName`, `toRoutePath`, `toNavLabel`
- `copyDirectorySync`

### Group 2: Configs (Constants)
- `PASSWORD_REQUIREMENTS`
- `VISUAL_ARCHETYPES`
- `BUNDLES`
- `INDUSTRY_PRESETS`
- `VALID_LUCIDE_ICONS`

### Group 3: Generators
- `generateBrainJson`
- `generateToolHtml`
- `generateBrainRoutes`, `generateHealthRoutes`
- `buildAppJsx`
- `buildFallbackPage`, `buildFallbackThemeCss`

### Group 4: Prompt Builders
- `buildSmartContextGuide`
- `buildLayoutContextFromPreview`
- `extractBusinessStats`, `generateDefaultStats`
- `getIndustryImageUrls`
- `buildRebuildContext`, `buildInspiredContext`, `buildUploadedAssetsContext`
- `buildFreshModePrompt`, `buildEnhanceModePrompt`, `buildOrchestratorPagePrompt`
- `getIndustryDesignGuidance`, `getPageRequirements`, `getPageSpecificInstructions`
- `getIndustryHeaderConfig`

### Group 5: Industry Detection
- `detectIndustryFromDescription`

### Group 6: Validation
- `validateGeneratedCode`

### Group 7: Services
- `initializeServices`
- `extractPdfText`
- `fetchPexelsVideo`, `getIndustryVideo`
- `readBrain`, `writeBrain`

### Group 8: Routes (Keep in server.cjs but slim down)
- All `app.get/post/etc` handlers

---

## Notes

- The orchestrator.cjs service already exists and handles orchestration logic
- Many prompt builders are tightly coupled and should stay together
- Industry configs could be moved to JSON files
- Tool HTML generator is self-contained and can be extracted
