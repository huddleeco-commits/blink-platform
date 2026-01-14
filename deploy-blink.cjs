#!/usr/bin/env node
/**
 * BLINK Deployment Script
 * Deploys the BLINK Module Assembler to Railway with PostgreSQL
 */

require('dotenv').config();
const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;
const RAILWAY_TEAM_ID = process.env.RAILWAY_TEAM_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CLOUDFLARE_TOKEN = process.env.CLOUDFLARE_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

const GITHUB_USERNAME = 'huddleeco-commits';
const REPO_NAME = 'blink-platform';
const SUBDOMAIN = 'blink';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// GITHUB API
// ============================================

async function createGitHubRepo(repoName) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      name: repoName,
      description: 'BLINK - AI-powered full-stack project generator',
      private: false
    });

    const options = {
      hostname: 'api.github.com',
      path: '/user/repos',
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'BLINK-Deploy',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log(`   ✅ Created GitHub repo: ${repoName}`);
          resolve(JSON.parse(body));
        } else if (res.statusCode === 422) {
          console.log(`   ℹ️ Repo already exists: ${repoName}`);
          resolve({ name: repoName, clone_url: `https://github.com/${GITHUB_USERNAME}/${repoName}.git` });
        } else {
          reject(new Error(`GitHub error ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function pushToGitHub(localPath, repoName) {
  console.log(`   📤 Pushing code to GitHub...`);

  const gitUrl = `https://${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${repoName}.git`;

  // Clean up existing .git
  const gitDir = path.join(localPath, '.git');
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }

  // Create .gitignore
  const gitignore = `node_modules/
.env
.env.local
dist/
*.log
.DS_Store
`;
  fs.writeFileSync(path.join(localPath, '.gitignore'), gitignore);

  // Initialize and push
  try {
    execSync('git init', { cwd: localPath, stdio: 'pipe' });
    execSync('git add -A', { cwd: localPath, stdio: 'pipe' });
    execSync('git commit -m "BLINK Platform v2.0"', { cwd: localPath, stdio: 'pipe' });
    execSync('git branch -M main', { cwd: localPath, stdio: 'pipe' });
    execSync(`git remote add origin ${gitUrl}`, { cwd: localPath, stdio: 'pipe' });
    execSync('git push -u origin main --force', { cwd: localPath, stdio: 'pipe' });
    console.log(`   ✅ Code pushed to GitHub`);
    return true;
  } catch (err) {
    console.error(`   ❌ Git push failed:`, err.message);
    throw err;
  }
}

// ============================================
// RAILWAY API
// ============================================

async function railwayGraphQL(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });

    const options = {
      hostname: 'backboard.railway.app',
      path: '/graphql/v2',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.errors) {
            reject(new Error(result.errors[0].message));
          } else {
            resolve(result.data);
          }
        } catch (e) {
          reject(new Error(`Railway API error: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getWorkspaceId() {
  console.log(`   🔍 Getting Railway workspace...`);

  // Try to get teams first (newer API structure)
  const teamsQuery = `
    query {
      me {
        teams {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
  `;

  try {
    const result = await railwayGraphQL(teamsQuery);
    const teams = result.me.teams?.edges || [];

    if (teams.length > 0) {
      const team = teams[0].node;
      console.log(`   ✅ Using team: ${team.name}`);
      return team.id;
    }
  } catch (e) {
    console.log(`   ℹ️ Teams query failed, trying personal workspace...`);
  }

  // Fallback to personal workspace
  const meQuery = `
    query {
      me {
        id
        name
      }
    }
  `;

  const meResult = await railwayGraphQL(meQuery);
  console.log(`   ✅ Using personal workspace for: ${meResult.me.name || 'user'}`);

  // For personal workspaces, we can sometimes omit the teamId
  // Return null to indicate using personal workspace
  return null;
}

async function createRailwayProject(name) {
  console.log(`   🚂 Creating Railway project: ${name}`);

  // Use the team ID from environment
  if (!RAILWAY_TEAM_ID) {
    throw new Error('RAILWAY_TEAM_ID environment variable is required');
  }

  const query = `
    mutation projectCreate($input: ProjectCreateInput!) {
      projectCreate(input: $input) {
        id
        name
        environments {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
  `;

  const input = {
    name: name,
    teamId: RAILWAY_TEAM_ID
  };

  const result = await railwayGraphQL(query, { input });
  const project = result.projectCreate;
  const prodEnv = project.environments?.edges?.find(e => e.node.name === 'production') || project.environments?.edges?.[0];

  console.log(`   ✅ Railway project created: ${project.id}`);

  return {
    id: project.id,
    name: project.name,
    environmentId: prodEnv?.node?.id
  };
}

async function addPostgresToProject(projectId) {
  console.log(`   🗄️ Adding PostgreSQL database...`);

  // Get project environments first
  const envQuery = `
    query($projectId: String!) {
      project(id: $projectId) {
        environments {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
  `;

  const envResult = await railwayGraphQL(envQuery, { projectId });
  const envId = envResult.project.environments.edges[0]?.node?.id;

  if (!envId) {
    throw new Error('No environment found');
  }

  // Add Postgres using Railway's template
  const query = `
    mutation($projectId: String!) {
      templateDeploy(input: {
        projectId: $projectId,
        templateCode: "postgres"
      }) {
        projectId
      }
    }
  `;

  try {
    await railwayGraphQL(query, { projectId });
    console.log(`   ✅ PostgreSQL service created`);

    // Wait for DB to be ready and get DATABASE_URL
    await sleep(5000);
    return { environmentId: envId };
  } catch (err) {
    console.log(`   ⚠️ PostgreSQL template failed: ${err.message}, trying direct image...`);

    // Fallback to direct image
    const fallbackQuery = `
      mutation($projectId: String!) {
        serviceCreate(input: {
          projectId: $projectId,
          name: "postgres",
          source: { image: "postgres:15-alpine" }
        }) {
          id
        }
      }
    `;

    try {
      const result = await railwayGraphQL(fallbackQuery, { projectId });
      console.log(`   ✅ PostgreSQL service created (fallback)`);
      return { serviceId: result.serviceCreate.id, environmentId: envId };
    } catch (err2) {
      console.log(`   ⚠️ PostgreSQL creation failed completely, continuing...`);
      return { environmentId: envId };
    }
  }
}

async function deployFromGitHub(projectId, environmentId, repoFullName, branch = 'main') {
  console.log(`   🚀 Creating Railway service from GitHub...`);

  const query = `
    mutation($projectId: String!, $repo: String!, $branch: String!) {
      serviceCreate(input: {
        projectId: $projectId,
        name: "blink-server",
        source: { repo: $repo, branch: $branch }
      }) {
        id
        name
      }
    }
  `;

  const result = await railwayGraphQL(query, {
    projectId,
    repo: repoFullName,
    branch
  });

  console.log(`   ✅ Service created: ${result.serviceCreate.id}`);
  return result.serviceCreate;
}

async function setServiceVariables(projectId, serviceId, environmentId, variables) {
  console.log(`   ⚙️ Setting environment variables...`);

  for (const [name, value] of Object.entries(variables)) {
    const query = `
      mutation($projectId: String!, $serviceId: String!, $environmentId: String!, $name: String!, $value: String!) {
        variableUpsert(input: {
          projectId: $projectId,
          serviceId: $serviceId,
          environmentId: $environmentId,
          name: $name,
          value: $value
        })
      }
    `;

    await railwayGraphQL(query, {
      projectId,
      serviceId,
      environmentId,
      name,
      value
    });
  }

  console.log(`   ✅ Environment variables set`);
}

async function generateRailwayDomain(serviceId, environmentId) {
  console.log(`   🌐 Generating Railway domain...`);

  const query = `
    mutation($serviceId: String!, $environmentId: String!) {
      serviceDomainCreate(input: {
        serviceId: $serviceId,
        environmentId: $environmentId
      }) {
        domain
      }
    }
  `;

  const result = await railwayGraphQL(query, { serviceId, environmentId });
  console.log(`   ✅ Domain: ${result.serviceDomainCreate.domain}`);
  return result.serviceDomainCreate.domain;
}

// ============================================
// CLOUDFLARE DNS
// ============================================

async function cloudflareRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/zones/${CLOUDFLARE_ZONE_ID}${endpoint}`,
      method,
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Cloudflare error: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function setupCloudfareDNS(subdomain, railwayDomain) {
  console.log(`   🔷 Setting up Cloudflare DNS for ${subdomain}.be1st.io...`);

  // Delete existing record if any
  const existing = await cloudflareRequest('GET', `/dns_records?name=${subdomain}.be1st.io`);
  if (existing.result && existing.result.length > 0) {
    for (const record of existing.result) {
      await cloudflareRequest('DELETE', `/dns_records/${record.id}`);
      console.log(`   ✅ Deleted old DNS record`);
    }
  }

  // Create CNAME record
  const result = await cloudflareRequest('POST', '/dns_records', {
    type: 'CNAME',
    name: subdomain,
    content: railwayDomain,
    proxied: true,
    ttl: 1
  });

  if (result.success) {
    console.log(`   ✅ DNS configured: ${subdomain}.be1st.io -> ${railwayDomain}`);
    return true;
  } else {
    console.log(`   ⚠️ DNS setup failed:`, result.errors);
    return false;
  }
}

// ============================================
// MAIN DEPLOYMENT
// ============================================

async function deployBlink() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ⚡ BLINK Platform Deployment                           ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`);

  const projectPath = __dirname;

  // Validate environment
  if (!RAILWAY_TOKEN || !GITHUB_TOKEN) {
    console.error('❌ Missing required environment variables (RAILWAY_TOKEN, GITHUB_TOKEN)');
    process.exit(1);
  }

  try {
    // 1. Create GitHub repo
    console.log('\n📦 Step 1: GitHub Repository');
    await createGitHubRepo(REPO_NAME);
    await pushToGitHub(projectPath, REPO_NAME);

    // 2. Create Railway project
    console.log('\n🚂 Step 2: Railway Project');
    const project = await createRailwayProject('blink-platform');
    const environmentId = project.environmentId;

    // 3. Add PostgreSQL
    console.log('\n🗄️ Step 3: PostgreSQL Database');
    await addPostgresToProject(project.id);
    await sleep(5000); // Wait for Postgres to initialize

    // 4. Deploy from GitHub
    console.log('\n🚀 Step 4: Deploy Service');
    const service = await deployFromGitHub(project.id, environmentId, `${GITHUB_USERNAME}/${REPO_NAME}`);

    // 5. Set environment variables
    console.log('\n⚙️ Step 5: Environment Variables');
    await setServiceVariables(project.id, service.id, environmentId, {
      NODE_ENV: 'production',
      RAILWAY_TOKEN: RAILWAY_TOKEN,
      GITHUB_TOKEN: GITHUB_TOKEN,
      CLOUDFLARE_TOKEN: CLOUDFLARE_TOKEN || '',
      CLOUDFLARE_ZONE_ID: CLOUDFLARE_ZONE_ID || '',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@blink.be1st.io',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'changeme123',
      JWT_SECRET: process.env.JWT_SECRET || `blink-${Date.now()}-secret`
    });

    // 6. Generate domain
    console.log('\n🌐 Step 6: Domain Setup');
    const railwayDomain = await generateRailwayDomain(service.id, environmentId);

    // 7. Cloudflare DNS (if configured)
    if (CLOUDFLARE_TOKEN && CLOUDFLARE_ZONE_ID) {
      console.log('\n🔷 Step 7: Cloudflare DNS');
      await setupCloudfareDNS(SUBDOMAIN, railwayDomain);
    }

    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ✅ BLINK Deployment Complete!                          ║
║                                                          ║
║   Railway Domain: https://${railwayDomain.padEnd(32)}║
║   Custom Domain:  https://blink.be1st.io                 ║
║   Admin Panel:    https://blink.be1st.io/admin           ║
║                                                          ║
║   GitHub Repo:    github.com/${GITHUB_USERNAME}/${REPO_NAME}      ║
║   Railway:        railway.app/project/${project.id.substring(0, 8)}...         ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);

    return {
      success: true,
      projectId: project.id,
      railwayDomain,
      customDomain: 'blink.be1st.io'
    };

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  deployBlink();
}

module.exports = { deployBlink };
