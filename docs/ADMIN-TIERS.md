# Admin Tiers Documentation

This document describes the admin tier system and how it works across different website generation modes.

## Overview

The admin tier system provides right-sized admin dashboards for generated websites. Instead of a one-size-fits-all approach, businesses get admin features appropriate for their industry and needs.

## Available Tiers

### Lite (3 modules)
- **Target**: Portfolios, blogs, landing pages, non-profits
- **Modules**: Dashboard, Content Editor, Settings
- **Features**:
  - Basic overview statistics
  - Page content management
  - Business information settings
  - Logo and branding

### Standard (7 modules) - DEFAULT
- **Target**: Service businesses, restaurants, salons, fitness
- **Modules**: All Lite + Analytics, Customers, Bookings, Notifications
- **Features**:
  - Traffic and conversion analytics
  - Customer management
  - Appointment scheduling
  - Email/SMS notifications

### Pro (13 modules)
- **Target**: E-commerce, retail, agencies, SaaS
- **Modules**: All Standard + Orders, Products, Marketing, Email, SEO, Team
- **Features**:
  - Order management
  - Product/inventory catalog
  - Marketing campaigns
  - Email campaign builder
  - SEO tools
  - Team permissions

### Enterprise (16 modules)
- **Target**: Franchises, multi-location businesses, agencies
- **Modules**: All Pro + Locations, API, White Label
- **Features**:
  - Multi-location management
  - API keys and webhooks
  - White-label branding
  - Custom domain mapping

## Generation Mode Integration

### Orchestrator Mode ("One sentence. Done.")

```
User: "I'm starting a pizza delivery business in Brooklyn"
AI Analysis:
  - Industry: restaurant/food-delivery
  - Detected keywords: delivery, business
  - Suggested tier: Standard
  - Additional modules: admin-orders (from food-delivery keyword)

Result:
  - Admin tier: Standard + orders
  - Reason: Food delivery requires order management
```

### Quick Start Mode ("Tell me what you're building")

1. User describes business
2. AI suggests appropriate tier
3. Tier shown in customization screen
4. User can accept or change

### Rebuild Mode ("I have a website already")

1. User provides existing site URL
2. System analyzes site to detect industry
3. Suggests tier based on detected industry
4. User can adjust before rebuild

### Inspired Mode ("Show me sites I like")

1. User adds inspiration sites
2. System detects common industry themes
3. Suggests appropriate tier
4. User can customize before build

### NOT Applicable To

- **Build a Tool**: Invoice Generator, Calculator, QR Code, etc. - no admin needed
- **Custom Tool**: Single-page tools don't require admin

## User Override

Users can always override the AI suggestion:

```
┌─────────────────────────────────────────┐
│ Admin Dashboard: Standard               │
│ ├── ✅ Dashboard                        │
│ ├── ✅ Content Editor                   │
│ ├── ✅ Settings                         │
│ ├── ✅ Analytics                        │
│ ├── ✅ Customers                        │
│ ├── ✅ Bookings ← detected from input   │
│ ├── ❌ Orders (Pro+)                    │
│ ├── ❌ Products (Pro+)                  │
│ └── ❌ Marketing (Pro+)                 │
│                                         │
│ [Change Tier ▼] [Customize Modules]     │
└─────────────────────────────────────────┘
```

Options:
1. **Change Tier**: Select different tier (Lite/Standard/Pro/Enterprise)
2. **Customize Modules**: Add/remove individual modules regardless of tier

## Industry Mapping

See `configs/industry-admin-mapping.json` for complete mapping.

### Examples:

| Industry | Default Tier | Additional Modules | Reason |
|----------|-------------|-------------------|--------|
| restaurant | standard | orders | Order management for dine-in/takeout |
| salon | standard | bookings | Appointment scheduling critical |
| ecommerce | pro | orders, products, marketing | Full commerce needs |
| portfolio | lite | - | Simple content display |
| franchise | enterprise | locations | Multi-site management |

## API Endpoints

### Get Tiers and Suggestion
```
GET /api/admin/tiers?industry=restaurant&description=pizza+delivery
```

Response:
```json
{
  "success": true,
  "tiers": { ... },
  "moduleInfo": { ... },
  "suggestion": {
    "tier": "standard",
    "modules": ["admin-dashboard", "admin-content", "admin-settings", "admin-analytics", "admin-customers", "admin-bookings", "admin-notifications", "admin-orders"],
    "reason": "Food delivery requires order management"
  }
}
```

### Get Modules for Tier
```
GET /api/admin/tiers/standard/modules
```

### Resolve Module Dependencies
```
POST /api/admin/tiers/resolve
Body: { "modules": ["admin-orders"] }
```

Response includes all required dependencies.

## Configuration Files

### configs/admin-tiers.json
Defines tiers and their included modules.

### configs/industry-admin-mapping.json
Maps industries to default tiers and suggested modules.

## Brain.json Integration

Admin configuration is stored in the generated site's `brain.json`:

```json
{
  "admin": {
    "tier": "standard",
    "modules": ["admin-dashboard", "admin-content", ...],
    "reason": "Detected restaurant industry",
    "enabled": true
  }
}
```

## Testing Scenarios

### By Mode:
1. **Orchestrator**: "Photography portfolio" → Lite (3 modules)
2. **Orchestrator**: "Pizza restaurant with delivery" → Standard + orders
3. **Orchestrator**: "E-commerce store" → Pro
4. **Quick Start**: User describes "coffee shop" → Standard suggested
5. **Rebuild**: Salon website URL → Standard + bookings detected

### User Override:
1. AI suggests Pro, user selects Lite → Lite wins
2. User on Standard manually adds "orders" → Standard + orders

For each test:
- Correct modules included
- No extra modules
- Admin UI shows correct tabs
- All features work
