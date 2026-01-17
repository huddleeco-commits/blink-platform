# Admin Modules Documentation

This document describes all available admin modules in the modular admin system.

## Module Structure

Each module follows this structure:
```
backend/admin-modules/
├── _shared/                    # Shared components and utilities
│   ├── components/index.jsx    # Reusable UI components
│   └── index.js               # Shared utilities and API helpers
├── admin-dashboard/
│   ├── module.json            # Module metadata
│   ├── index.js               # Module exports
│   ├── routes/index.js        # API endpoints
│   └── components/
│       └── DashboardPage.jsx  # React component
└── [other-modules]/
```

## Core Modules (Lite Tier)

### admin-dashboard
- **Description**: Core overview dashboard with statistics and quick actions
- **Features**: User counts, generation metrics, cost summary, 7-day trends
- **API Prefix**: `/api/admin/overview`

### admin-content
- **Description**: Page content editor and media management
- **Features**: Page editing, text formatting, image upload, media library
- **API Prefix**: `/api/admin/content`

### admin-settings
- **Description**: Basic business settings and branding
- **Features**: Business name, logo, colors, contact info, hours
- **API Prefix**: `/api/admin/settings`

## Standard Tier Modules

### admin-analytics
- **Description**: Traffic, conversions, and business analytics
- **Features**: Cost analytics, revenue tracking, performance metrics
- **API Prefix**: `/api/admin/analytics`

### admin-customers
- **Description**: Customer/user management
- **Features**: User search, tier management, ban/unban, export
- **API Prefix**: `/api/admin/users`

### admin-bookings
- **Description**: Appointment and reservation management
- **Features**: Calendar view, booking CRUD, time slots, reminders
- **API Prefix**: `/api/admin/bookings`
- **Industries**: salon, spa, fitness, healthcare, restaurant

### admin-notifications
- **Description**: Email and SMS notification templates
- **Features**: Template editor, variables, preview, history
- **API Prefix**: `/api/admin/notifications`

## Pro Tier Modules

### admin-orders
- **Description**: Order management and fulfillment
- **Features**: Order list, status updates, refunds, export
- **API Prefix**: `/api/admin/orders`
- **Industries**: restaurant, ecommerce, retail, food-delivery

### admin-products
- **Description**: Product catalog and inventory
- **Features**: Product CRUD, categories, pricing, stock alerts
- **API Prefix**: `/api/admin/products`
- **Industries**: ecommerce, retail, restaurant

### admin-marketing
- **Description**: Marketing campaigns and promotions
- **Features**: Referral codes, discounts, campaign tracking
- **API Prefix**: `/api/admin/marketing`

### admin-email
- **Description**: Email campaign builder
- **Features**: Campaign creation, segmentation, analytics
- **API Prefix**: `/api/admin/email`

### admin-seo
- **Description**: SEO management
- **Features**: Meta tags, sitemap, robots.txt, schema markup
- **API Prefix**: `/api/admin/seo`

### admin-team
- **Description**: Team/staff management
- **Features**: Team members, roles, permissions
- **API Prefix**: `/api/admin/team`

## Enterprise Tier Modules

### admin-locations
- **Description**: Multi-location/franchise management
- **Features**: Location management, per-location settings
- **API Prefix**: `/api/admin/locations`
- **Industries**: franchise, multi-location

### admin-api
- **Description**: API keys and webhooks
- **Features**: Key generation, rotation, webhooks, usage limits
- **API Prefix**: `/api/admin/api-settings`

### admin-whitelabel
- **Description**: White-label branding
- **Features**: Custom domain, branding removal, reseller options
- **API Prefix**: `/api/admin/whitelabel`

## Internal/Platform Modules

These modules are for the Blink platform admin, not generated sites:

### admin-generations
- **Description**: Site generation tracking
- **Tier**: internal

### admin-industries
- **Description**: Industry analytics
- **Tier**: internal

### admin-errors
- **Description**: Error monitoring
- **Tier**: internal

### admin-alerts
- **Description**: System alerts
- **Tier**: internal

### admin-system
- **Description**: System health monitoring
- **Tier**: internal

## Creating New Modules

1. Create directory: `backend/admin-modules/admin-[name]/`
2. Create `module.json`:
```json
{
  "name": "admin-[name]",
  "version": "1.0.0",
  "description": "Module description",
  "tier": "lite|standard|pro|enterprise",
  "category": "core|analytics|commerce|marketing|operations|developer",
  "icon": "LucideIconName",
  "order": 10,
  "dependencies": ["admin-dashboard"],
  "requiredTables": ["table_name"],
  "features": ["Feature 1", "Feature 2"],
  "routes": {
    "prefix": "/route-prefix",
    "file": "routes/index.js"
  },
  "components": {
    "main": "components/ModulePage.jsx",
    "sidebar": {
      "id": "module-id",
      "label": "Display Label",
      "icon": "LucideIconName"
    }
  }
}
```

3. Create `routes/index.js`:
```javascript
const express = require('express');
const router = express.Router();

module.exports = function(db, middleware) {
  const { authenticateToken, isAdmin } = middleware;
  router.use(authenticateToken);
  router.use(isAdmin);

  router.get('/', async (req, res) => {
    // Implementation
  });

  return router;
};
```

4. Create `components/ModulePage.jsx`:
```jsx
import React from 'react';
import { StatCard, DataTable } from '../../_shared/components/index.jsx';

export default function ModulePage() {
  return (
    <div className="admin-page">
      {/* Implementation */}
    </div>
  );
}
```

5. Create `index.js`:
```javascript
const routes = require('./routes/index.js');
const moduleConfig = require('./module.json');

module.exports = {
  name: moduleConfig.name,
  config: moduleConfig,
  routes,
  components: {
    MainPage: './components/ModulePage.jsx'
  }
};
```

## Module Dependencies

When a module has dependencies, those dependencies are automatically included when the module is selected. The dependency resolution happens in `admin-module-loader.cjs`.

Example: If `admin-orders` depends on `admin-dashboard` and `admin-customers`, selecting `admin-orders` will automatically include both dependencies.
