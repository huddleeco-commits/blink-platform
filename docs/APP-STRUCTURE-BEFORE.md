# App.jsx Structure - BEFORE Refactoring

**Total Lines: 13,781**
**Date: 2026-01-16**

## Overview

The App.jsx file contains the entire Blink Module Assembler UI application in a single file. This document maps the structure before extraction into modules.

---

## Section Map

### IMPORTS & CONSTANTS (Lines 1-65)
| Line | Item | Type | Description |
|------|------|------|-------------|
| 1-7 | File header | Comment | JSDoc header |
| 8-9 | React imports | Import | React, useState, useEffect, industry-layouts |
| 11 | `API_BASE` | Constant | API base URL |
| 16-22 | `BREAKPOINTS` | Constant | Responsive breakpoint values |
| 57-64 | `TAGLINES` | Constant | Rotating header taglines |

### HOOKS (Lines 24-52)
| Line | Item | Type | Description |
|------|------|------|-------------|
| 24-45 | `useWindowSize()` | Hook | Tracks window dimensions |
| 47-52 | `getLayoutMode()` | Function | Returns layout mode based on width |

### AUTH COMPONENTS (Lines 69-217)
| Line | Item | Type | Description |
|------|------|------|-------------|
| 69-135 | `PasswordGate` | Component | Main password gate screen |
| 136-152 | `gateStyles` | Styles | Styles for PasswordGate |
| 157-204 | `DevPasswordModal` | Component | Developer unlock modal |
| 206-217 | `modalStyles` | Styles | Styles for DevPasswordModal |

### MAIN APP (Lines 222-1309)
| Line | Item | Type | Description |
|------|------|------|-------------|
| 222-1309 | `App` | Component | Main application component with all state and routing |

**App Component State (~100+ state variables):**
- Authentication state (unlocked, devUnlocked)
- Step navigation (step, path, completedSteps)
- Project data (projectData, result)
- UI state (generating, steps, currentStep, startTime)
- Orchestrator state (orchestratorChoice, detectedInfo)
- Tool state (toolMode, toolResult, recommendations)
- Deploy state (deploying, deployStatus, deployReady)
- Shared context (sharedContext)

### STEP COMPONENTS (Lines 1314-8313)

| Line Range | Component | Lines | Description |
|------------|-----------|-------|-------------|
| 1314-1425 | `ChoosePathStep` | 112 | Path selection (Quick/Inspired/Rebuild/Orchestrator) |
| 1430-1939 | `OrchestratorStep` | 510 | AI-powered single input mode |
| 1944-2460 | `RebuildStep` | 517 | Import existing site flow |
| 2462-2765 | `rebuildStyles` | 304 | Styles for RebuildStep |
| 2770-2924 | `QuickStep` | 155 | Quick description path |
| 2929-3606 | `UploadAssetsStep` | 678 | Logo/photo/menu upload |
| 3608-4220 | `uploadStyles` | 613 | Styles for UploadAssetsStep |
| 4225-4814 | `ReferenceStep` | 590 | Inspiration/reference sites |
| 4816-5258 | `inspiredStyles` | 443 | Styles for ReferenceStep |

### WIZARD UI COMPONENTS (Lines 5265-6044)
| Line Range | Component | Lines | Description |
|------------|-----------|-------|-------------|
| 5265-5317 | `WizardBreadcrumb` | 53 | Progress breadcrumb navigation |
| 5319-5353 | `CollapsibleSection` | 35 | Collapsible content section |
| 5355-5374 | `Tooltip` | 20 | Hover tooltip component |
| 5376-5426 | `WhatYouGetCard` | 51 | Summary card showing selections |
| 5428-5445 | `IndustryBanner` | 18 | Industry detection banner |

### LAYOUT SYSTEM (Lines 5452-6237)
| Line Range | Item | Lines | Description |
|------------|------|-------|-------------|
| 5452-5700 | `LAYOUT_OPTIONS` | 249 | Layout configuration object |
| 5703-5706 | `getLayoutsForIndustry()` | 4 | Layout helper function |
| 5708-5748 | `LayoutStyleSelector` | 41 | Layout selection component |
| 5750-5856 | `LayoutThumbnail` | 107 | Mini layout preview |
| 5858-5919 | `layoutSelectorStyles` | 62 | Styles for LayoutStyleSelector |
| 5921-6043 | `layoutThumbnailStyles` | 123 | Styles for LayoutThumbnail |
| 6045-6237 | `LivePreviewRenderer` | 193 | Full layout preview renderer |
| 6239-6523 | `livePreviewStyles` | 285 | Styles for LivePreviewRenderer |

### WIZARD STYLES (Lines 6525-6785)
| Line Range | Item | Lines | Description |
|------------|------|-------|-------------|
| 6525-6591 | `wizardStyles` | 67 | General wizard styles |
| 6592-6648 | `collapsibleStyles` | 57 | Styles for CollapsibleSection |
| 6649-6680 | `tooltipStyles` | 32 | Styles for Tooltip |
| 6681-6738 | `whatYouGetStyles` | 58 | Styles for WhatYouGetCard |
| 6739-6785 | `industryBannerStyles` | 47 | Styles for IndustryBanner |

### CUSTOMIZE STEP (Lines 6789-8079)
| Line Range | Item | Lines | Description |
|------------|------|-------|-------------|
| 6789-7829 | `CustomizeStep` | 1041 | Main customization editor |
| 7831-8079 | `customizeStyles` | 249 | Styles for CustomizeStep |
| 8081-8197 | `p1Styles` | 117 | P1 visual improvement styles |
| 8199-8313 | `layoutStyles` | 115 | Layout selection styles |

### GENERATION & COMPLETION (Lines 8317-9117)
| Line Range | Component | Lines | Description |
|------------|-----------|-------|-------------|
| 8317-8390 | `GeneratingStep` | 74 | Generation progress display |
| 8392-8451 | `genStepStyles` | 60 | Styles for GeneratingStep |
| 8455-8624 | `CompleteStep` | 170 | Site completion screen |
| 8629-9117 | `ToolCompleteScreen` | 489 | Tool completion screen |

### CHOICE & CUSTOMIZATION SCREENS (Lines 9121-10410)
| Line Range | Component | Lines | Description |
|------------|-----------|-------|-------------|
| 9121-9334 | `ChoiceScreen` | 214 | Ambiguous input choice |
| 9341-9390 | `INDUSTRY_PAGES` | 50 | Industry page config |
| 9392-9428 | `PAGE_LABELS` | 37 | Page label mappings |
| 9430-9439 | `COLOR_PRESETS` | 10 | Color preset options |
| 9441-9446 | `STYLE_OPTIONS` | 6 | Style options |
| 9448-9452 | `ADMIN_LEVELS` | 5 | Admin level options |
| 9454-10058 | `SiteCustomizationScreen` | 605 | Full site customization |
| 10063-10409 | `ToolCustomizationScreen` | 347 | Single tool customization |

### TOOL SCREENS (Lines 10414-11576)
| Line Range | Component | Lines | Description |
|------------|-----------|-------|-------------|
| 10414-10700 | `RecommendedToolsScreen` | 287 | Tool recommendations |
| 10703-11247 | `ToolSuiteBuilderScreen` | 545 | Multi-tool suite builder |
| 11251-11576 | `SuiteCompleteScreen` | 326 | Suite completion screen |

### DEPLOY SCREENS (Lines 11580-11984)
| Line Range | Component | Lines | Description |
|------------|-----------|-------|-------------|
| 11580-11803 | `DeployingStep` | 224 | Deploy progress screen |
| 11806-11960 | `DeployCompleteStep` | 155 | Deploy success screen |
| 11963-11985 | `DeployErrorStep` | 23 | Deploy error screen |
| 11988-12019 | `ErrorStep` | 32 | General error screen |

### MAIN STYLES (Lines 12025-13781)
| Line Range | Item | Lines | Description |
|------------|------|-------|-------------|
| 12025-13736 | `styles` | 1712 | Main application styles object |
| 13737-13781 | Keyframes | 45 | CSS keyframe animations |

---

## Extraction Plan (Logical Groupings)

### 1. Constants (`src/constants/`)
- `API_BASE` → `api.js`
- `BREAKPOINTS` → `breakpoints.js`
- `TAGLINES` → `taglines.js`
- `LAYOUT_OPTIONS` → `layouts.js`
- `INDUSTRY_PAGES`, `PAGE_LABELS` → `industry-config.js`
- `COLOR_PRESETS`, `STYLE_OPTIONS`, `ADMIN_LEVELS` → `customization-options.js`

### 2. Utils (`src/utils/`)
- `getLayoutMode()` → `layout.js`
- `getLayoutsForIndustry()` → `layout.js`

### 3. Hooks (`src/hooks/`)
- `useWindowSize()` → `useWindowSize.js`

### 4. Components (`src/components/`)
**Auth:**
- `PasswordGate` → `auth/PasswordGate.jsx`
- `DevPasswordModal` → `auth/DevPasswordModal.jsx`

**Wizard UI:**
- `WizardBreadcrumb` → `wizard/WizardBreadcrumb.jsx`
- `CollapsibleSection` → `wizard/CollapsibleSection.jsx`
- `Tooltip` → `common/Tooltip.jsx`
- `WhatYouGetCard` → `wizard/WhatYouGetCard.jsx`
- `IndustryBanner` → `wizard/IndustryBanner.jsx`

**Layout:**
- `LayoutStyleSelector` → `layout/LayoutStyleSelector.jsx`
- `LayoutThumbnail` → `layout/LayoutThumbnail.jsx`
- `LivePreviewRenderer` → `layout/LivePreviewRenderer.jsx`

**Generation:**
- `GeneratingStep` → `generation/GeneratingStep.jsx`

**Deploy:**
- `DeployingStep` → `deploy/DeployingStep.jsx`
- `DeployCompleteStep` → `deploy/DeployCompleteStep.jsx`
- `DeployErrorStep` → `deploy/DeployErrorStep.jsx`
- `ErrorStep` → `common/ErrorStep.jsx`

### 5. Screens (`src/screens/`)
- `ChoosePathStep` → `ChoosePathScreen.jsx`
- `OrchestratorStep` → `OrchestratorScreen.jsx`
- `RebuildStep` → `RebuildScreen.jsx`
- `QuickStep` → `QuickScreen.jsx`
- `UploadAssetsStep` → `UploadAssetsScreen.jsx`
- `ReferenceStep` → `ReferenceScreen.jsx`
- `CustomizeStep` → `CustomizeScreen.jsx`
- `CompleteStep` → `CompleteScreen.jsx`
- `ToolCompleteScreen` → `ToolCompleteScreen.jsx`
- `ChoiceScreen` → `ChoiceScreen.jsx`
- `SiteCustomizationScreen` → `SiteCustomizationScreen.jsx`
- `ToolCustomizationScreen` → `ToolCustomizationScreen.jsx`
- `RecommendedToolsScreen` → `RecommendedToolsScreen.jsx`
- `ToolSuiteBuilderScreen` → `ToolSuiteBuilderScreen.jsx`
- `SuiteCompleteScreen` → `SuiteCompleteScreen.jsx`

### 6. Styles (`src/styles/`)
- `styles` → `main.js`
- Component-specific styles bundled with components

---

## Dependencies Between Sections

```
App.jsx
├── Constants (no deps)
├── Hooks (depends on: Constants/BREAKPOINTS)
├── Utils (no deps)
├── Auth Components (no deps)
├── Wizard Components (depends on: Styles)
├── Layout Components (depends on: Constants/LAYOUT_OPTIONS, Styles)
├── Screens (depends on: Components, Constants, Hooks, Utils, Styles)
└── Main App (depends on: ALL)
```

---

## Extraction Order (Safest First)

1. **Constants** - No dependencies, pure data
2. **Utils** - Simple helper functions
3. **Hooks** - May depend on constants
4. **Styles** - Large but simple objects
5. **Small Components** - Tooltip, CollapsibleSection, etc.
6. **Layout Components** - LayoutThumbnail, LayoutStyleSelector, LivePreviewRenderer
7. **Wizard Components** - WizardBreadcrumb, WhatYouGetCard, IndustryBanner
8. **Auth Components** - PasswordGate, DevPasswordModal
9. **Generation/Deploy Components** - GeneratingStep, DeployingStep, etc.
10. **Screens** - Largest components, most dependencies
11. **Main App** - Final cleanup, should be ~300 lines

---

## Component Count Summary

| Category | Count | Est. Lines |
|----------|-------|------------|
| Constants | 9 | ~400 |
| Utils | 2 | ~20 |
| Hooks | 1 | ~25 |
| Auth Components | 2 | ~200 |
| Wizard Components | 5 | ~180 |
| Layout Components | 3 | ~350 |
| Step/Screen Components | 15 | ~5,500 |
| Deploy Components | 4 | ~450 |
| Main App | 1 | ~1,100 |
| Styles | 12 objects | ~3,500 |
| **Total** | **54 items** | **~13,781** |
