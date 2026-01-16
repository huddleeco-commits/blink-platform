# Server.cjs Structure - AFTER Refactoring (Phase 2)

**File:** `module-assembler-ui/server.cjs`
**Original Lines:** 7,518
**Current Lines:** 6,534
**Lines Removed:** 984 (~13%)
**Date:** 2026-01-16

---

## Changes Made

### Phase 1: Utils and Configs Extraction
Successfully extracted pure helper functions and configuration constants to modular files.

### Phase 2: Routes Extraction
Successfully extracted utility route handlers to modular route files with factory pattern.

---

## New File Structure

```
module-assembler-ui/
├── lib/
│   ├── utils/
│   │   ├── index.cjs          # Re-exports all utils
│   │   ├── password.cjs       # Password validation
│   │   ├── page-names.cjs     # Page name conversions
│   │   └── file-utils.cjs     # File system utilities
│   │
│   ├── configs/
│   │   ├── index.cjs          # Re-exports all configs
│   │   ├── bundles.cjs        # BUNDLES, INDUSTRY_PRESETS
│   │   ├── visual-archetypes.cjs  # VISUAL_ARCHETYPES
│   │   └── lucide-icons.cjs   # VALID_LUCIDE_ICONS, ICON_REPLACEMENTS
│   │
│   ├── routes/
│   │   ├── index.cjs          # Re-exports all route factories
│   │   ├── auth.cjs           # Health check, password validation, login
│   │   ├── config.cjs         # Bundles, industries, layouts, effects, modules
│   │   ├── utility.cjs        # open-folder, open-vscode, analyze-site, generate-theme
│   │   └── deploy.cjs         # deploy, deploy/status, railway-status
│   │
│   └── sentry.cjs             # (existing)
│
└── server.cjs                 # Main server (6,534 lines)
```

---

## Extracted Functions & Constants

### lib/utils/password.cjs
- `PASSWORD_MIN_LENGTH`
- `PASSWORD_REQUIREMENTS`
- `validatePasswordStrength(password)`

### lib/utils/page-names.cjs
- `toComponentName(pageId)` - Convert to PascalCase
- `toPageFileName(pageId)` - Convert to file name
- `toRoutePath(pageId)` - Convert to URL path
- `toNavLabel(pageId)` - Convert to display label

### lib/utils/file-utils.cjs
- `copyDirectorySync(src, dest)` - Recursive directory copy

### lib/configs/bundles.cjs
- `BUNDLES` - Module bundle configurations
- `INDUSTRY_PRESETS` - Industry-specific module presets

### lib/configs/visual-archetypes.cjs
- `VISUAL_ARCHETYPES` - Layout style definitions

### lib/configs/lucide-icons.cjs
- `VALID_LUCIDE_ICONS` - Whitelist of valid icons (~510 icons)
- `ICON_REPLACEMENTS` - Mapping for invalid/hallucinated icons

---

## Extracted Route Modules

### lib/routes/auth.cjs
Factory: `createAuthRoutes({ db })`
- `GET /health` - Health check endpoint
- `POST /auth/validate` - Main access password validation
- `POST /auth/validate-dev` - Developer password validation
- `POST /auth/login` - JWT-based admin login

### lib/routes/config.cjs
Factory: `createConfigRoutes({ BUNDLES, INDUSTRIES, LAYOUTS, EFFECTS, SECTIONS, INDUSTRY_PRESETS, buildPrompt, GENERATED_PROJECTS })`
- `GET /bundles` - List all bundles
- `GET /industries` - List all industries
- `GET /industry/:key` - Get specific industry
- `GET /layouts` - List all layouts
- `GET /effects` - List all effects
- `GET /sections` - List all sections
- `POST /build-prompt` - Build prompt from config
- `GET /modules/industry/:industryKey` - Get modules for industry
- `POST /modules/bundles` - Get modules for bundle array
- `GET /projects` - List generated projects

### lib/routes/utility.cjs
Factory: `createUtilityRoutes({ GENERATED_PROJECTS, MODULE_LIBRARY, db })`
- `POST /open-folder` - Open folder in explorer
- `POST /open-vscode` - Open folder in VS Code
- `POST /analyze-site` - Analyze reference site with AI vision
- `POST /generate-theme` - Generate theme from references
- `POST /analyze-existing-site` - Analyze existing site for enhance mode

### lib/routes/deploy.cjs
Factory: `createDeployRoutes({ deployService, deployReady })`
- `POST /deploy` - Deploy project with optional SSE streaming
- `GET /deploy/status` - Check deploy service status
- `GET /deploy/railway-status/:projectId` - Check Railway deployment status

---

## Server.cjs Imports (New)

```javascript
// EXTRACTED UTILITIES
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

// EXTRACTED CONFIGS
const {
  BUNDLES,
  INDUSTRY_PRESETS,
  VISUAL_ARCHETYPES,
  VALID_LUCIDE_ICONS,
  ICON_REPLACEMENTS
} = require('./lib/configs/index.cjs');

// EXTRACTED ROUTES
const {
  createAuthRoutes,
  createConfigRoutes,
  createUtilityRoutes,
  createDeployRoutes
} = require('./lib/routes/index.cjs');
```

---

## Currently Mounted Routes

```javascript
// Utility routes (open-folder, open-vscode, analyze-site, generate-theme, analyze-existing-site)
const utilityRouter = createUtilityRoutes({
  GENERATED_PROJECTS,
  MODULE_LIBRARY,
  db
});
app.use('/api', utilityRouter);
```

---

## Remaining in Server.cjs

The following sections remain in server.cjs for future extraction:

### Auth & Config Routes (Still Inline) (~200 lines)
- These have route factories created but not yet mounted
- Health check, password validation, login
- Bundles, industries, layouts, effects, sections

### Deploy Routes (Still Inline) (~200 lines)
- Route factory created but not yet mounted
- Deploy, deploy/status, railway-status

### Orchestrator Routes (~1,000 lines)
- `/api/orchestrate` - Main orchestration endpoint
- `/api/orchestrate/detect-intent` - Intent detection
- `/api/orchestrate/recommend` - Tool recommendations
- `/api/orchestrate/build-tool` - Single tool builder
- `/api/orchestrate/build-suite` - Suite builder
- `/api/orchestrate/download-suite` - Suite download

### Assemble Route (~800 lines)
- `/api/assemble` - Main project assembly

### Generators (~600 lines)
- `generateToolHtml()` - Single-page tool HTML generator
- `generateBrainJson()` - Brain.json config generator
- `generateBrainRoutes()` - Brain API routes generator
- `generateHealthRoutes()` - Health check routes
- `buildAppJsx()` - Main App.jsx generator

### Prompt Builders (~1,500 lines)
- `buildSmartContextGuide()`
- `buildLayoutContextFromPreview()`
- `extractBusinessStats()`
- `generateDefaultStats()`
- `getIndustryImageUrls()`
- `buildRebuildContext()`
- `buildInspiredContext()`
- `buildUploadedAssetsContext()`
- `buildFreshModePrompt()`
- `buildEnhanceModePrompt()`
- `buildOrchestratorPagePrompt()`
- `getIndustryDesignGuidance()`
- `getPageRequirements()`
- `getPageSpecificInstructions()`
- `getIndustryHeaderConfig()`
- `buildFallbackPage()`
- `buildFallbackThemeCss()`

### Industry Detection (~100 lines)
- `detectIndustryFromDescription()`
- `buildPrompt()`

### Validation (~80 lines)
- `validateGeneratedCode()`

### Services (~150 lines)
- `initializeServices()`
- `extractPdfText()`
- `fetchPexelsVideo()`
- `getIndustryVideo()`
- `readBrain()` / `writeBrain()`

---

## Testing Status

- [x] Utils module loads correctly
- [x] Configs module loads correctly
- [x] Routes module loads correctly
- [x] Server syntax valid
- [x] Frontend build succeeds
- [x] Utility routes working (via router)
- [ ] Full endpoint testing (manual verification recommended)

---

## Git Commits

1. `6125769` - Extract utils to lib/utils/
2. `6c30f40` - Extract configs to lib/configs/
3. `773b415` - Add server refactoring documentation
4. `0dee304` - Extract utility routes to lib/routes/

---

## Next Steps (Future Phases)

### Phase 3: Prompt Builders
Extract all prompt builder functions to `lib/prompt-builders/`

### Phase 4: Generators
Extract generateToolHtml, generateBrainJson, buildAppJsx to `lib/generators/`

### Phase 5: Services
Extract initialization and external API functions to `lib/services/`

### Phase 6: Complete Route Migration
- Mount auth, config, and deploy routers
- Remove remaining inline route definitions

---

## Notes

- All extractions are backward-compatible
- Original functionality preserved
- No breaking changes to API endpoints
- Modular imports allow future tree-shaking
- Route factories use dependency injection for testability
