# Server.cjs Structure - AFTER Refactoring (Phase 1)

**File:** `module-assembler-ui/server.cjs`
**Original Lines:** 7,518
**Current Lines:** 7,163
**Lines Removed:** 355 (~5%)
**Date:** 2026-01-16

---

## Changes Made

### Phase 1: Utils and Configs Extraction

Successfully extracted pure helper functions and configuration constants to modular files.

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
│   └── sentry.cjs             # (existing)
│
└── server.cjs                 # Main server (7,163 lines)
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
```

---

## Remaining in Server.cjs

The following sections remain in server.cjs for future extraction:

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

### Routes (~3,500 lines)
- All `app.get/post` handlers
- Route middleware

---

## Testing Status

- [x] Utils module loads correctly
- [x] Configs module loads correctly
- [x] Server syntax valid
- [x] Frontend build succeeds
- [ ] Full endpoint testing (manual verification recommended)

---

## Git Commits

1. `6125769` - Extract utils to lib/utils/
2. `6c30f40` - Extract configs to lib/configs/

---

## Next Steps (Future Phases)

### Phase 2: Generators
Extract generateToolHtml, generateBrainJson, buildAppJsx to `lib/generators/`

### Phase 3: Prompt Builders
Extract all prompt builder functions to `lib/prompt-builders/`

### Phase 4: Services
Extract initialization and external API functions to `lib/services/`

### Phase 5: Routes
Break routes into route files under `routes/` directory

---

## Notes

- All extractions are backward-compatible
- Original functionality preserved
- No breaking changes to API endpoints
- Modular imports allow future tree-shaking
