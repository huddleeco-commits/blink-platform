# Admin System Current Inventory

**Audit Date:** 2026-01-16
**Purpose:** Complete documentation of all existing admin functionality before modular migration

---

## 1. FRONTEND FILES

### 1.1 Main Application Files

| File | Location | Lines | Purpose |
|------|----------|-------|---------|
| admin.html | module-assembler-ui/ | ~20 | Entry HTML file for admin dashboard |
| main.jsx | src/admin/ | ~10 | Admin app entry point, renders AdminApp |
| AdminApp.jsx | src/admin/ | 2093 | Complete 16-tab admin dashboard |

### 1.2 Admin Dashboard Tabs (16 Total)

| Tab # | ID | Label | Icon | Component | Purpose |
|-------|-----|-------|------|-----------|---------|
| 1 | overview | Overview | LayoutDashboard | OverviewPage | Key metrics, quick stats, recent activity |
| 2 | users | Users | Users | UsersPage | User management, tiers, bans |
| 3 | generations | Generations | Layers | GenerationsPage | Site generation tracking |
| 4 | costs | API Costs | DollarSign | CostAnalyticsPage | API cost analytics |
| 5 | revenue | Revenue | TrendingUp | RevenuePage | MRR, revenue tracking |
| 6 | industries | Industries | Building2 | IndustriesPage | Industry analytics |
| 7 | modules | Modules | Package | ModulesPage | Module usage analytics |
| 8 | errors | Errors | AlertTriangle | ErrorsPage | Error monitoring |
| 9 | performance | Performance | Gauge | PerformancePage | Performance metrics |
| 10 | templates | Templates | FileCode | TemplatesPage | Template analytics |
| 11 | email | Email | Mail | EmailPage | Email campaign builder |
| 12 | referrals | Referrals | Gift | ReferralsPage | Referral code management |
| 13 | alerts | Alerts | Bell | AlertsPage | System alerts |
| 14 | data-quality | Data Quality | CheckCircle2 | DataQualityPage | Data integrity checks |
| 15 | config | Config | Settings | ConfigPage | Platform configuration |
| 16 | system | System | Server | SystemPage | System health monitoring |

### 1.3 Shared Components (in AdminApp.jsx)

| Component | Lines | Purpose |
|-----------|-------|---------|
| StatCard | 67-85 | Display metrics with icons, values, trends |
| StatusBadge | 87-106 | Render status badges (completed/failed/active/pending) |
| TierBadge | 108-121 | Render subscription tier badges (admin/dealer/power/free) |
| LoadingSpinner | 123-130 | Loading indicator |
| DataTable | 132-158 | Generic table with columns, pagination support |
| Pagination | 160-183 | Page navigation component |
| SearchBar | 185-200 | Search input with clear button |
| DateFilter | ~201-230 | Date range filtering |
| ExportButton | ~231-250 | CSV export functionality |
| Sidebar | 1496-1545 | Navigation menu with 16 tabs |
| LoginPage | 1416-1490 | Admin authentication form |

---

## 2. BACKEND API ROUTES

### 2.1 Route Files

| File | Location | Lines | Purpose |
|------|----------|-------|---------|
| admin.js | backend/blink-admin/routes/ | 852 | Main admin API endpoints |
| admin-routes.cjs | module-assembler-ui/routes/ | 365 | Alternative admin routes (JWT auth) |

### 2.2 API Endpoints (28 Total)

| Method | Endpoint | Line | Purpose |
|--------|----------|------|---------|
| GET | /api/admin/overview | 34 | Dashboard overview metrics |
| GET | /api/admin/users | 130 | User list with pagination, search, filtering |
| GET | /api/admin/users/:id | 184 | Individual user details |
| PUT | /api/admin/users/:id/tier | 203 | Change user subscription tier |
| PUT | /api/admin/users/:id/ban | 224 | Ban/unban users |
| DELETE | /api/admin/users/:id | 240 | Delete user (soft/hard) |
| GET | /api/admin/generations | 270 | Generations list with filtering |
| GET | /api/admin/cost-analytics | 322 | Cost breakdown by operation and model |
| GET | /api/admin/revenue | 386 | Revenue metrics (MRR, ARR, etc.) |
| GET | /api/admin/industries | 430 | Industry analytics |
| GET | /api/admin/modules | 456 | Module usage analytics |
| GET | /api/admin/errors | 489 | Error tracking and patterns |
| GET | /api/admin/performance | 523 | Performance metrics |
| GET | /api/admin/templates | 568 | Template analytics |
| GET | /api/admin/email/campaigns | 594 | List email campaigns |
| POST | /api/admin/email/campaigns | 604 | Create email campaign |
| GET | /api/admin/referrals | 622 | List referral codes |
| POST | /api/admin/referrals | 634 | Create referral code |
| GET | /api/admin/alerts | 650 | List system alerts |
| PUT | /api/admin/alerts/:id/resolve | 662 | Resolve an alert |
| POST | /api/admin/alerts/check | 673 | Run alert rule checks |
| GET | /api/admin/data-quality | 687 | Data quality status |
| POST | /api/admin/data-quality/fix/:type | 705 | Fix data quality issues |
| GET | /api/admin/config | 731 | Get platform configuration |
| PUT | /api/admin/config/:key | 744 | Update configuration value |
| GET | /api/admin/health | 764 | System health status |
| GET | /api/admin/export/users | 797 | Export users as CSV |
| GET | /api/admin/export/generations | 810 | Export generations as CSV |

---

## 3. BACKEND SERVICES

### 3.1 Service Files

| File | Location | Purpose |
|------|----------|---------|
| index.js | backend/blink-admin/ | Module initialization |
| module.json | backend/blink-admin/ | Module metadata and feature list |
| costTracker.js | backend/blink-admin/services/ | API cost tracking and calculation |
| alertService.js | backend/blink-admin/services/ | Alert monitoring and generation |

### 3.2 Cost Tracker Functions

| Function | Purpose |
|----------|---------|
| calculateCost(inputTokens, outputTokens, model) | Calculate cost based on Claude pricing |
| trackApiCall(params) | Log API call with tokens, cost, model |
| startGeneration(params) | Begin generation lifecycle tracking |
| completeGeneration(generationId, params) | End generation with metrics |
| getUserCostSummary(userId) | Get user's cost breakdown |
| checkUserLimits(userId) | Verify user hasn't exceeded limits |
| createAlert(params) | Create system alert |
| updateUserActivity(userId) | Update last_active_at timestamp |

### 3.3 Alert Service Rules

| Rule | Metric | Condition | Action |
|------|--------|-----------|--------|
| Error Rate | error_rate | > 10% in 1 hour | Warning alert |
| Daily Cost | daily_cost | > $100 | Warning alert |
| Signup Gap | signup_gap | > 24 hours | Info alert |
| Generation Time | avg_gen_time | > 60 seconds | Warning alert |
| Success Rate | success_rate | < 90% | Critical alert |

---

## 4. DATABASE SCHEMA

### 4.1 Database Files

| File | Location | Lines | Purpose |
|------|----------|-------|---------|
| schema.sql | database/ | ~50 | Core admin tables |
| 001_admin_dashboard.sql | database/migrations/ | 491 | Comprehensive migration |
| db.cjs | database/ | ~200 | Database connection and helpers |

### 4.2 User Table Extensions (via migration)

| Column | Type | Purpose |
|--------|------|---------|
| banned | BOOLEAN | User ban status |
| ban_reason | TEXT | Reason for ban |
| generations_used | INTEGER | Count of generations |
| generations_limit | INTEGER | Limit per period |
| subscription_status | TEXT | Subscription state |
| stripe_customer_id | VARCHAR | Stripe customer reference |
| stripe_subscription_id | VARCHAR | Stripe subscription reference |
| last_active_at | TIMESTAMP | Last activity timestamp |
| login_count | INTEGER | Total login count |
| source | VARCHAR | Acquisition source (organic/referral/paid_ad) |

### 4.3 Admin-Specific Tables (15 Total)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| generations | Site generation log | user_id, site_name, industry, template_used, modules_selected, pages_generated, total_cost, status, generation_time_ms |
| api_usage | API call tracking | user_id, generation_id, api_name, operation_type, input_tokens, output_tokens, cost, model_used |
| system_alerts | Real-time alerts | alert_type, severity, metric_name, metric_value, threshold_value, resolved |
| alert_rules | Alert thresholds | metric, operator, threshold, time_window_hours, notification_channels |
| email_campaigns | Email marketing | name, subject, body_html, segment, status, opens_count, clicks_count |
| email_sends | Email delivery | campaign_id, user_id, status (sent/delivered/opened/clicked/bounced) |
| industry_stats | Monthly aggregates | industry, generation_count, success_count, avg_generation_time_ms, total_cost |
| module_stats | Module analytics | module_name, usage_count, unique_users, popular_with_industries |
| template_stats | Template analytics | template_name, usage_count, success_rate |
| referral_codes | Referral management | code, discount_percent, max_uses, times_used, total_revenue_generated |
| platform_config | Dynamic config | key, value (JSON), category |
| data_quality_log | Integrity checks | check_type, records_found, records_fixed, run_by |
| system_health | Health snapshots | cpu_percent, memory_percent, disk_percent, db_connections, active_users |
| daily_stats | Daily aggregates | date, new_signups, active_users, generations_completed, api_cost_total, mrr |
| admin_audit_log | Audit trail | admin_id, action, target_type, old_value, new_value, ip_address |

### 4.4 Database Functions

| Function | Purpose |
|----------|---------|
| compute_daily_stats(target_date) | Pre-compute daily aggregates |
| check_alert_rules() | Check all alert rules and create alerts |
| update_monthly_stats() | Monthly statistics aggregation |

---

## 5. ADMIN LEVELS FOR GENERATED SITES

### 5.1 Configuration Source

**File:** `src/constants/customization-options.js`

### 5.2 Current Tier Definitions

| Tier | Key | Modules | Description |
|------|-----|---------|-------------|
| Lite | lite | 3 | Basic content management |
| Standard | standard | 7 | Full admin features (RECOMMENDED) |
| Pro | pro | 12+ | Advanced analytics & tools |

### 5.3 Module Mapping (Implied from codebase)

**Lite (3 modules):**
- Dashboard
- Content Editor
- Basic Settings

**Standard (7 modules):**
- All Lite modules +
- Analytics
- Customers
- Notifications
- Bookings/Appointments

**Pro (12+ modules):**
- All Standard modules +
- Orders
- Products/Inventory
- Marketing
- Email Campaigns
- SEO
- Team/Users
- Advanced Settings

---

## 6. AUTHENTICATION

### 6.1 Login Flow

1. User enters email/password on LoginPage
2. POST to `/api/auth/login`
3. Server validates credentials
4. JWT token generated with admin role
5. Token stored in localStorage (`blink_admin_token`)
6. All API calls include `Authorization: Bearer {token}` header

### 6.2 Middleware

| Middleware | Location | Purpose |
|------------|----------|---------|
| authenticateToken | backend/auth/middleware/auth | Verify JWT token |
| isAdmin | backend/auth/middleware/auth | Verify admin role |

---

## 7. METRICS TRACKED

### 7.1 User Metrics

- Total users, paid vs. free
- Signups today/week/month
- Banned users count
- Conversion rate (free to paid)
- User tier distribution
- Last active timestamps
- Login counts
- Acquisition sources

### 7.2 Generation Metrics

- Total generations, by status
- Pages generated
- Generation time (avg, P95)
- Success rate
- Failure patterns
- Cost per generation
- Industry breakdown
- Template usage

### 7.3 Cost Metrics

- Daily/monthly API costs
- Cost by API provider (Claude, OpenAI)
- Cost by operation type
- Cost by model used
- Token usage tracking
- Cost per generation

### 7.4 Revenue Metrics

- MRR (Monthly Recurring Revenue)
- ARR (Annual Run Rate)
- Total lifetime revenue
- Net profit, profit margin
- Revenue by subscription tier
- Monthly revenue trends
- Churn metrics

### 7.5 Performance Metrics

- Response times (avg, P95)
- Throughput (requests/hour)
- Error rates
- Generation success rate
- Database query performance
- System health (CPU, memory, disk)

---

## 8. INTEGRATION POINTS

### 8.1 Server Integration (server.cjs)

- Admin routes registered at `/api/admin`
- Admin HTML served at `/admin` endpoint
- Admin email: admin@be1st.io
- Business admin module integration
- Auto-deployment with admin credentials

### 8.2 Generation Integration

**File:** `src/App.jsx`

Admin level passed to generation prompt:
```javascript
"Admin level: ${config.adminLevel}"
```

### 8.3 Customization Integration

**File:** `src/screens/SiteCustomizationScreen.jsx`

- Admin level selection in customization form
- Three options: Lite, Standard (recommended), Pro

---

## 9. EXPORT CAPABILITIES

| Export | Endpoint | Format | Contents |
|--------|----------|--------|----------|
| Users | GET /api/admin/export/users | CSV | id, email, tier, created_at, last_active, generations_used |
| Generations | GET /api/admin/export/generations | CSV | id, site_name, industry, status, cost, created_at |

---

## 10. FEATURES BY TAB (Detailed)

### Tab 1: Overview Dashboard
- Total users stat card
- Active users (24h)
- Monthly revenue (MRR)
- API costs (month to date)
- Generations today/this month
- Success rate percentage
- Profit margin
- Tier distribution chart
- Recent generations list
- 7-day trends chart

### Tab 2: Users Management
- User search by email
- Pagination (20 per page)
- Filter by tier (all/free/power/dealer/admin)
- Change user tier
- Ban/unban users
- Soft/hard delete
- View user details
- Export to CSV

### Tab 3: Generations Tracking
- List all generations
- Filter by status
- Filter by industry
- Search by site name
- View generation details
- Download links
- Live site links
- Error messages for failures

### Tab 4: API Cost Analytics
- Cost by operation type (bar chart)
- Cost by model used (pie chart)
- Daily cost trends (14-day chart)
- Date range filtering
- Token usage breakdown
- Top expensive operations

### Tab 5: Revenue Analytics
- MRR stat card
- ARR calculation
- Lifetime revenue
- Net profit
- Profit margin %
- Revenue by tier (breakdown)
- Monthly trends chart
- New vs. churned revenue

### Tab 6: Industry Analytics
- Generations per industry
- Industry success rates
- Average pages per industry
- Industry costs
- Popular modules per industry
- Industry growth trends

### Tab 7: Module Usage Analytics
- Module name and usage count
- Industries where module is used
- Average cost per module
- Success rate per module
- Module combinations

### Tab 8: Error Monitoring
- Error count (24 hours)
- Error rate percentage
- Error patterns/types
- Affected users per error
- Recent error logs
- Error resolution tracking

### Tab 9: Performance Metrics
- Average generation time
- P95 response time
- Throughput (req/hour)
- Success rate
- Performance by operation
- Historical trends

### Tab 10: Template Analytics
- Template usage count
- Industries using each template
- Average pages per template
- Success rate per template
- Template performance metrics

### Tab 11: Email Campaigns
- Campaign list
- Create new campaign
- Campaign name, subject, body
- Target tier selection
- Schedule/send
- Open rates
- Click rates
- Unsubscribe tracking

### Tab 12: Referral Codes
- Create referral codes
- Set discount percentage
- Set max uses
- Track usage count
- Revenue per code
- Expiration dates
- Active/inactive status

### Tab 13: System Alerts
- Active alerts list
- Alert severity (info/warning/critical)
- Alert type
- Metric value vs. threshold
- Resolve alerts
- Alert history
- Configure alert rules

### Tab 14: Data Quality
- Data quality score
- Issues found count
- Check types (orphaned records, invalid emails, duplicates)
- Last check timestamp
- Fix issues button
- Historical checks

### Tab 15: Platform Config
- Key-value configuration
- Category organization
- Free tier limits
- Power tier limits
- Dealer tier limits
- Maintenance mode toggle
- Default AI model
- Update timestamps

### Tab 16: System Health
- CPU usage %
- Memory usage %
- Disk usage %
- Database pool status
- Active connections
- Uptime
- Recent errors
- Recent activity log

---

## 11. AUDIT TRAIL

### Actions Logged

| Action | Target Type | Data Captured |
|--------|-------------|---------------|
| user_banned | user | user_id, ban_reason |
| user_unbanned | user | user_id |
| tier_changed | user | user_id, old_tier, new_tier |
| user_deleted | user | user_id, delete_type (soft/hard) |
| config_updated | config | key, old_value, new_value |
| campaign_created | campaign | campaign_id, name |
| alert_resolved | alert | alert_id, resolution |
| referral_created | referral | code, discount |

---

## 12. CHECKLIST FOR MIGRATION

Each item below MUST be migrated to a module:

### Frontend Components
- [ ] OverviewPage
- [ ] UsersPage
- [ ] GenerationsPage
- [ ] CostAnalyticsPage
- [ ] RevenuePage
- [ ] IndustriesPage
- [ ] ModulesPage
- [ ] ErrorsPage
- [ ] PerformancePage
- [ ] TemplatesPage
- [ ] EmailPage
- [ ] ReferralsPage
- [ ] AlertsPage
- [ ] DataQualityPage
- [ ] ConfigPage
- [ ] SystemPage
- [ ] StatCard
- [ ] StatusBadge
- [ ] TierBadge
- [ ] DataTable
- [ ] Pagination
- [ ] SearchBar
- [ ] DateFilter
- [ ] ExportButton
- [ ] Sidebar
- [ ] LoginPage

### API Endpoints
- [ ] GET /overview
- [ ] GET /users
- [ ] GET /users/:id
- [ ] PUT /users/:id/tier
- [ ] PUT /users/:id/ban
- [ ] DELETE /users/:id
- [ ] GET /generations
- [ ] GET /cost-analytics
- [ ] GET /revenue
- [ ] GET /industries
- [ ] GET /modules
- [ ] GET /errors
- [ ] GET /performance
- [ ] GET /templates
- [ ] GET /email/campaigns
- [ ] POST /email/campaigns
- [ ] GET /referrals
- [ ] POST /referrals
- [ ] GET /alerts
- [ ] PUT /alerts/:id/resolve
- [ ] POST /alerts/check
- [ ] GET /data-quality
- [ ] POST /data-quality/fix/:type
- [ ] GET /config
- [ ] PUT /config/:key
- [ ] GET /health
- [ ] GET /export/users
- [ ] GET /export/generations

### Database Tables
- [ ] generations
- [ ] api_usage
- [ ] system_alerts
- [ ] alert_rules
- [ ] email_campaigns
- [ ] email_sends
- [ ] industry_stats
- [ ] module_stats
- [ ] template_stats
- [ ] referral_codes
- [ ] platform_config
- [ ] data_quality_log
- [ ] system_health
- [ ] daily_stats
- [ ] admin_audit_log

### Services
- [ ] costTracker.js
- [ ] alertService.js

---

## 13. NOTES

1. **Current system is monolithic** - All 16 tabs in single AdminApp.jsx file
2. **No tier-based access** - All admin users see all tabs
3. **No industry-specific modules** - Same admin for all business types
4. **Three generation tiers exist** but modules not clearly defined
5. **Database is well-structured** - Good foundation for modular migration
6. **API routes are comprehensive** - Can be split into module-specific files
7. **Audit logging exists** - Should be preserved in migration

---

*This inventory must be referenced during migration to ensure no functionality is lost.*
