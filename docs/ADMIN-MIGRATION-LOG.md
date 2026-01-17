# Admin Migration Log

This document tracks what was migrated from the monolithic admin system to the modular approach.

## Migration Date: 2026-01-16

## Previous System

### Files
- `src/admin/AdminApp.jsx` (2093 lines) - Monolithic 16-tab dashboard
- `src/admin/main.jsx` - Entry point
- `backend/blink-admin/routes/admin.js` (852 lines) - All admin API routes
- `backend/blink-admin/services/costTracker.js` - Cost tracking
- `backend/blink-admin/services/alertService.js` - Alert rules

### Structure
- Single AdminApp.jsx containing all 16 tabs as inline components
- Single routes file with all 28 endpoints
- No tier-based access control
- Same admin for all business types

## New Modular System

### Created Files

#### Configuration
- `configs/admin-tiers.json` - Tier definitions and module mappings
- `configs/industry-admin-mapping.json` - Industry to tier mappings

#### Module Loader
- `lib/services/admin-module-loader.cjs` - Module loading and assembly

#### Routes
- `lib/routes/admin-tiers.cjs` - Tier selection API

#### Modules Created
Each module has: `module.json`, `routes/index.js`, `components/*.jsx`, `index.js`

| Module | Migrated From | Status |
|--------|--------------|--------|
| admin-dashboard | AdminApp.jsx (OverviewPage) | Created |
| admin-customers | AdminApp.jsx (UsersPage) | Created |
| admin-content | New | Created |
| admin-settings | AdminApp.jsx (ConfigPage) | Created |
| admin-analytics | AdminApp.jsx (CostAnalyticsPage, RevenuePage, PerformancePage) | Created |
| admin-bookings | New | Created |
| admin-notifications | New | Created |
| admin-orders | New | Created |
| admin-products | New | Created |
| admin-marketing | AdminApp.jsx (ReferralsPage) | Created |
| admin-email | AdminApp.jsx (EmailPage) | Created |
| admin-seo | New | Created |
| admin-team | New | Created |
| admin-locations | New | Created |
| admin-api | New | Created |
| admin-whitelabel | New | Created |
| admin-generations | AdminApp.jsx (GenerationsPage) | Created (internal) |
| admin-industries | AdminApp.jsx (IndustriesPage) | Created (internal) |
| admin-errors | AdminApp.jsx (ErrorsPage) | Created (internal) |
| admin-alerts | AdminApp.jsx (AlertsPage) | Created (internal) |
| admin-system | AdminApp.jsx (SystemPage) | Created (internal) |
| _shared | AdminApp.jsx (shared components) | Created |

#### Documentation
- `docs/ADMIN-CURRENT-INVENTORY.md` - Pre-migration inventory
- `docs/ADMIN-MODULES.md` - Module documentation
- `docs/ADMIN-TIERS.md` - Tier documentation
- `docs/ADMIN-MIGRATION-LOG.md` - This file

## Code Changes

### services/orchestrator.cjs
- Added `suggestAdminTier()` call in `orchestrateBusiness()`
- Added `adminTier`, `adminModules`, `adminReason` to payload
- Added admin info to summary

### lib/routes/orchestrator.cjs
- Added admin tier logging
- Updated admin module copying to use modular system
- Updated brain.json generation to include admin config

### lib/generators/index.cjs
- Updated `generateBrainJson()` to accept admin config
- Added `admin` section to brain.json output

### server.cjs
- Added admin tiers route: `app.use('/api/admin/tiers', adminTiersRouter)`

## API Endpoints Migrated

| Old Endpoint | New Module | Status |
|--------------|-----------|--------|
| GET /api/admin/overview | admin-dashboard | Migrated |
| GET /api/admin/users | admin-customers | Migrated |
| GET /api/admin/users/:id | admin-customers | Migrated |
| PUT /api/admin/users/:id/tier | admin-customers | Migrated |
| PUT /api/admin/users/:id/ban | admin-customers | Migrated |
| DELETE /api/admin/users/:id | admin-customers | Migrated |
| GET /api/admin/cost-analytics | admin-analytics | Migrated |
| GET /api/admin/revenue | admin-analytics | Migrated |
| GET /api/admin/performance | admin-analytics | Migrated |
| GET /api/admin/generations | admin-generations | Internal |
| GET /api/admin/industries | admin-industries | Internal |
| GET /api/admin/modules | (removed) | N/A |
| GET /api/admin/errors | admin-errors | Internal |
| GET /api/admin/templates | (removed) | N/A |
| GET /api/admin/email/campaigns | admin-email | Migrated |
| POST /api/admin/email/campaigns | admin-email | Migrated |
| GET /api/admin/referrals | admin-marketing | Migrated |
| POST /api/admin/referrals | admin-marketing | Migrated |
| GET /api/admin/alerts | admin-alerts | Internal |
| PUT /api/admin/alerts/:id/resolve | admin-alerts | Internal |
| GET /api/admin/data-quality | admin-system | Internal |
| GET /api/admin/config | admin-settings | Migrated |
| PUT /api/admin/config/:key | admin-settings | Migrated |
| GET /api/admin/health | admin-system | Internal |
| GET /api/admin/export/users | admin-customers | Migrated |
| GET /api/admin/export/generations | admin-generations | Internal |

## New API Endpoints

| Endpoint | Module | Purpose |
|----------|--------|---------|
| GET /api/admin/tiers | admin-tiers | Get all tiers and suggestion |
| GET /api/admin/tiers/:tier/modules | admin-tiers | Get modules for tier |
| POST /api/admin/tiers/resolve | admin-tiers | Resolve dependencies |
| POST /api/admin/tiers/suggest | admin-tiers | Get AI suggestion |
| GET /api/admin/tiers/ui | admin-tiers | Get UI data for selector |

## Components Migrated

| Component | From | To |
|-----------|------|-----|
| StatCard | AdminApp.jsx | _shared/components |
| StatusBadge | AdminApp.jsx | _shared/components |
| TierBadge | AdminApp.jsx | _shared/components |
| LoadingSpinner | AdminApp.jsx | _shared/components |
| DataTable | AdminApp.jsx | _shared/components |
| Pagination | AdminApp.jsx | _shared/components |
| SearchBar | AdminApp.jsx | _shared/components |
| DateFilter | AdminApp.jsx | _shared/components |
| ExportButton | AdminApp.jsx | _shared/components |
| Card | New | _shared/components |
| BarChart | New | _shared/components |
| ConfirmDialog | New | _shared/components |

## Frontend Components Created

| Component | Purpose |
|-----------|---------|
| AdminTierSelector | Tier selection UI in customization screens |

## Testing Results

### Unit Tests Completed (2026-01-16)

Test file: `test-admin-tiers.cjs`

| Scenario | Industry | Expected | Result |
|----------|----------|----------|--------|
| Photography portfolio | photography | lite | ✓ PASS |
| Pizza restaurant with delivery | restaurant | standard | ✓ PASS |
| Yoga studio with class booking | yoga | standard | ✓ PASS |
| E-commerce store | ecommerce | pro | ✓ PASS |
| Restaurant franchise 5 locations | franchise | enterprise | ✓ PASS |
| Personal blog | personal-blog | lite | ✓ PASS |
| Hair salon | salon | standard | ✓ PASS |
| Retail store | retail | pro | ✓ PASS |
| Unknown industry with delivery keyword | unknown | pro | ✓ PASS |
| Unknown industry (fallback) | unknown | standard | ✓ PASS |

**All 10 tests passed.**

### Verified Functionality
- ✅ `suggestAdminTier()` returns correct tiers for 45+ mapped industries
- ✅ `getModulesForTier()` returns correct module lists
- ✅ `resolveModules()` properly resolves dependencies (e.g., admin-orders → admin-dashboard, admin-customers)
- ✅ Keyword detection adds appropriate modules (booking, delivery, shop, franchise, etc.)
- ✅ Default fallback to standard tier for unknown industries

### Bug Fixed During Testing
- Fixed tier resolution logic in keyword detection (was using `.reverse()` which mutated the original array and selected enterprise instead of minimum required tier)

## Remaining Work

### Files to Remove After Verification
- None yet - old files kept for fallback

### Integration Testing Required
1. ✅ Unit tests for suggestAdminTier - COMPLETED
2. Test orchestrator mode with live generation
3. Test quick start mode
4. Test rebuild mode
5. Test inspired mode
6. Verify user override works
7. Verify all admin features work in generated sites

## Rollback Plan

If issues occur:
1. The old `business-admin` module is still used as fallback
2. If modular admin fails, system falls back to copying old admin
3. Old AdminApp.jsx is not modified
4. Database schema unchanged

## Notes

- Platform-internal modules (admin-generations, admin-errors, etc.) marked with `platformOnly: true`
- These are NOT included in generated sites, only in Blink platform admin
- Industry mapping uses keyword detection for additional module suggestions
- User selections always override AI suggestions
