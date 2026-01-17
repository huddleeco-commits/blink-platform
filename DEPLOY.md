# BLINK Deployment Guide

Deploy BLINK to Railway with PostgreSQL and configure blink.be1st.io domain.

## Prerequisites

1. Railway account (https://railway.app)
2. GitHub repo: `huddleeco-commits/blink-platform`
3. Cloudflare access for be1st.io domain

## Step 1: Update Railway Workspace ID

1. Go to https://railway.app/dashboard
2. Look at the URL - it should contain your team/workspace ID
3. Update `RAILWAY_TEAM_ID` in `module-assembler-ui/.env`:
   ```
   RAILWAY_TEAM_ID=your-workspace-id-from-url
   ```

## Step 2: Deploy to Railway

### Option A: Railway Dashboard (Recommended)

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select `huddleeco-commits/blink-platform`
4. Railway will auto-detect the project

### Option B: Railway CLI

```bash
cd module-assembler-ui
railway login
railway init
railway link
railway up
```

### Option C: Automated Script

After updating RAILWAY_TEAM_ID:
```bash
cd module-assembler-ui
node deploy-blink.cjs
```

## Step 3: Add PostgreSQL

1. In Railway dashboard, click your project
2. Click "New" → "Database" → "PostgreSQL"
3. Wait for database to provision
4. Copy the `DATABASE_URL` from the PostgreSQL service

## Step 4: Configure Environment Variables

In Railway dashboard, set these variables for your main service:

```
NODE_ENV=production
DATABASE_URL=<from-postgresql-service>
ADMIN_EMAIL=admin@blink.be1st.io
ADMIN_PASSWORD=<strong-password>
JWT_SECRET=<random-secret-key>
RAILWAY_TOKEN=<your-railway-token>
GITHUB_TOKEN=<your-github-token>
CLOUDFLARE_TOKEN=<your-cloudflare-token>
CLOUDFLARE_ZONE_ID=<your-zone-id>
ANTHROPIC_API_KEY=<your-claude-api-key>
```

## Step 5: Generate Railway Domain

1. In Railway, click your service
2. Go to Settings → Networking
3. Click "Generate Domain"
4. Copy the generated domain (e.g., `blink-platform-xxx.up.railway.app`)

## Step 6: Configure Cloudflare DNS

1. Go to Cloudflare dashboard for be1st.io
2. Navigate to DNS settings
3. Add CNAME record:
   - Name: `blink`
   - Target: `<your-railway-domain>`
   - Proxy: ON (orange cloud)

Or use the CLI:
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"blink","content":"YOUR-RAILWAY-DOMAIN","proxied":true}'
```

## Step 7: Verify Deployment

1. Visit https://blink.be1st.io
2. Admin dashboard: https://blink.be1st.io/admin
3. Login with your ADMIN_EMAIL and ADMIN_PASSWORD

## Admin Dashboard Features

- **Dashboard**: MRR, project counts, API costs, profit margin
- **Projects**: All generated projects with status, domain, costs
- **Subscribers**: User management, plans, revenue tracking
- **Usage**: API usage breakdown (Claude tokens, etc.)
- **Costs**: Fixed vs variable cost tracking
- **Analytics**: Growth metrics, monthly trends

## Troubleshooting

### "Workspace not found" error
- Update RAILWAY_TEAM_ID from your Railway dashboard URL

### Database connection errors
- Ensure DATABASE_URL is set correctly
- Check PostgreSQL service is running in Railway

### Admin login fails
- Run database schema: `node -e "require('./database/db.js').initializeDatabase()"`
- Check ADMIN_EMAIL and ADMIN_PASSWORD in env vars

### Build fails
- Ensure all dependencies installed: `npm install`
- Build frontend: `npm run build`
