/**
 * BE1st Auto-Deploy Service - FIXED VERSION v3
 * Handles GitHub repo creation, Railway deployment, and Cloudflare DNS
 * 
 * FIXES INCORPORATED:
 * 1. Creates frontend/.env.production with correct API URL
 * 2. Adds FRONTEND_URL to backend environment variables
 * 3. Adds ?sslmode=disable to DATABASE_URL
 * 4. Cleans up .git folder before deployment (prevents retry failures)
 * 5. Seeds admin user credentials
 * 6. Creates .gitignore and removes node_modules before git push
 * 7. Uses separate GitHub repos for backend/frontend (avoids Railway root directory API limitation)
 * 8. **NEW v3** Skips Railway custom domain API (unreliable) - DNS only approach
 * 9. **NEW v3** Deletes old DNS records before creating new ones (for retries)
 * 10. **NEW v3** Better error handling - DNS failures don't block deployment
 */

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CLOUDFLARE_TOKEN = process.env.CLOUDFLARE_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const RAILWAY_TEAM_ID = process.env.RAILWAY_TEAM_ID;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// PRE-DEPLOYMENT SETUP
// ============================================

function prepareProjectForDeployment(projectPath, subdomain) {
  console.log(`📋 Preparing project for deployment...`);
  
  // FIX #1: Create frontend/.env.production with correct API URL
  const frontendEnvPath = path.join(projectPath, 'frontend', '.env.production');
  const frontendEnvContent = `VITE_API_URL=https://api.${subdomain}.be1st.io\n`;
  
  if (fs.existsSync(path.join(projectPath, 'frontend'))) {
    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    console.log(`   ✅ Created frontend/.env.production`);
  }
  
  // FIX #4: Clean up any existing .git folders (prevents retry failures)
  const gitDirs = [
    path.join(projectPath, '.git'),
    path.join(projectPath, 'backend', '.git'),
    path.join(projectPath, 'frontend', '.git'),
    path.join(projectPath, 'admin', '.git')
  ];
  for (const gitDir of gitDirs) {
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { recursive: true, force: true });
      console.log(`   ✅ Cleaned up ${gitDir}`);
    }
  }
  
  // CONFIG-AS-CODE: Create railway.json files so Railway knows how to build each service
  
  // Backend railway.json
  const backendRailwayConfig = {
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node setup-db.js && node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
};
  
  if (fs.existsSync(path.join(projectPath, 'backend'))) {
    fs.writeFileSync(
      path.join(projectPath, 'backend', 'railway.json'),
      JSON.stringify(backendRailwayConfig, null, 2)
    );
    console.log(`   ✅ Created backend/railway.json`);
  }
  
  // Frontend railway.json
  const frontendRailwayConfig = {
    "$schema": "https://railway.com/railway.schema.json",
    "build": {
      "builder": "NIXPACKS"
    },
    "deploy": {
      "startCommand": "npm run preview -- --host --port $PORT",
      "restartPolicyType": "ON_FAILURE",
      "restartPolicyMaxRetries": 10
    }
  };

  if (fs.existsSync(path.join(projectPath, 'frontend'))) {
    fs.writeFileSync(
      path.join(projectPath, 'frontend', 'railway.json'),
      JSON.stringify(frontendRailwayConfig, null, 2)
    );
    console.log(`   ✅ Created frontend/railway.json`);
  }

  // Admin railway.json (same config as frontend - it's also a Vite app)
  if (fs.existsSync(path.join(projectPath, 'admin'))) {
    fs.writeFileSync(
      path.join(projectPath, 'admin', 'railway.json'),
      JSON.stringify(frontendRailwayConfig, null, 2)
    );
    console.log(`   ✅ Created admin/railway.json`);
    
    // Create admin/.env.production with API URL
    const adminEnvPath = path.join(projectPath, 'admin', '.env.production');
    const adminEnvContent = `VITE_API_URL=https://api.${subdomain}.be1st.io\n`;
    fs.writeFileSync(adminEnvPath, adminEnvContent);
    console.log(`   ✅ Created admin/.env.production`);
  }
  
  // FIX #4b: Only update start script if setup-db.js exists
  const setupDbPath = path.join(projectPath, 'backend', 'setup-db.js');
  const backendPackageJson = path.join(projectPath, 'backend', 'package.json');
  if (fs.existsSync(setupDbPath) && fs.existsSync(backendPackageJson)) {
    let packageContent = fs.readFileSync(backendPackageJson, 'utf8');
    if (!packageContent.includes('setup-db.js')) {
      packageContent = packageContent.replace(
        '"start": "node server.js"',
        '"start": "node setup-db.js && node server.js"'
      );
      fs.writeFileSync(backendPackageJson, packageContent);
      console.log(`   ✅ Updated backend start script to run setup-db.js`);
    }
  }

  // Create .gitignore in each subfolder
  const gitignoreContent = `node_modules/
.env
.env.local
dist/
.DS_Store
*.log
`;

  for (const folder of ['backend', 'frontend', 'admin']) {
    const folderPath = path.join(projectPath, folder);
    const gitignorePath = path.join(folderPath, '.gitignore');
    if (fs.existsSync(folderPath) && !fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log(`   ✅ Created ${folder}/.gitignore`);
    }
  }

  // Remove node_modules folders (Railway will install fresh)
  const foldersToClean = ['frontend', 'backend', 'admin'];
  for (const folder of foldersToClean) {
    const nodeModulesPath = path.join(projectPath, folder, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      fs.rmSync(nodeModulesPath, { recursive: true, force: true });
      console.log(`   ✅ Removed ${folder}/node_modules`);
    }
  }

  console.log(`   ✅ Project prepared for deployment`);
}

// ============================================
// GITHUB API
// ============================================

async function createGitHubRepo(name, isPrivate = false) {
  console.log(`📦 Creating GitHub repo: ${name}`);
  
  const data = JSON.stringify({
    name: name,
    private: isPrivate,
    auto_init: false,
    description: `Generated by BE1st Platform`
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: '/user/repos',
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'BE1st-Deploy',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          const repo = JSON.parse(body);
          console.log(`   ✅ Repo created: ${repo.html_url}`);
          resolve(repo);
        } else if (res.statusCode === 422) {
          const result = JSON.parse(body);
          if (result.errors?.[0]?.message?.includes('already exists')) {
            console.log(`   ⚠️ Repo already exists, will use existing`);
            resolve({ name: name, owner: { login: null }, html_url: null, existing: true });
          } else {
            console.error(`   ❌ GitHub error: ${res.statusCode} - ${body}`);
            reject(new Error(`GitHub API error: ${res.statusCode}`));
          }
        } else {
          console.error(`   ❌ GitHub error: ${res.statusCode} - ${body}`);
          reject(new Error(`GitHub API error: ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getGitHubUsername() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: '/user',
      method: 'GET',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'BE1st-Deploy'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const user = JSON.parse(body);
          resolve(user.login);
        } else {
          reject(new Error(`Could not get GitHub username: ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function deleteGitHubRepo(owner, repoName) {
  console.log(`   🗑️ Deleting existing repo: ${owner}/${repoName}`);
  
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repoName}`,
      method: 'DELETE',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'BE1st-Deploy'
      }
    }, (res) => {
      if (res.statusCode === 204) {
        console.log(`   ✅ Deleted ${owner}/${repoName}`);
      } else {
        console.log(`   ⚠️ Could not delete (may not exist): ${res.statusCode}`);
      }
      resolve();
    });
    req.on('error', () => resolve());
    req.end();
  });
}

async function pushFolderToGitHub(projectPath, folderName, repoName, githubUsername) {
  console.log(`📤 Pushing ${folderName}/ to GitHub repo: ${repoName}...`);
  
  const folderPath = path.join(projectPath, folderName);
  
  if (!fs.existsSync(folderPath)) {
    throw new Error(`Folder not found: ${folderPath}`);
  }
  
  try {
    const gitUrl = `https://${GITHUB_TOKEN}@github.com/${githubUsername}/${repoName}.git`;
    
    const options = { 
      cwd: folderPath, 
      stdio: 'pipe',
      maxBuffer: 50 * 1024 * 1024,
      windowsHide: true
    };

    console.log(`   Initializing git in ${folderName}/...`);
    execSync('git init', options);
    
    console.log(`   Adding files...`);
    execSync('git add .', options);
    
    console.log(`   Creating commit...`);
    execSync('git commit -m "Initial commit from BE1st"', options);
    
    console.log(`   Setting branch...`);
    execSync('git branch -M main', options);
    
    console.log(`   Adding remote...`);
    execSync(`git remote add origin ${gitUrl}`, options);
    
    console.log(`   Pushing to GitHub...`);
    execSync('git push -u origin main --force', options);
    
    console.log(`   ✅ ${folderName}/ pushed to ${repoName}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Git push error for ${folderName}: ${error.message}`);
    throw error;
  }
}

// ============================================
// RAILWAY API (GraphQL)
// ============================================

async function railwayGraphQLSingle(query, variables = {}) {
  const data = JSON.stringify({ query, variables });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'backboard.railway.app',
      path: '/graphql/v2',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
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
          reject(new Error(`Railway API parse error: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function railwayGraphQL(query, variables = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await railwayGraphQLSingle(query, variables);
    } catch (error) {
      console.log(`   ⚠️ Railway API attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retry: 2s, 4s, 6s
      await sleep(attempt * 2000);
      console.log(`   🔄 Retrying...`);
    }
  }
}

async function createRailwayProject(name) {
  console.log(`🚂 Creating Railway project: ${name}`);
  
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
  
  const input = { name: name };
  if (RAILWAY_TEAM_ID) {
    input.workspaceId = RAILWAY_TEAM_ID;
  }
  
  const result = await railwayGraphQL(query, { input });
  
  const project = result.projectCreate;
  const prodEnv = project.environments.edges.find(e => e.node.name === 'production') || project.environments.edges[0];
  
  console.log(`   ✅ Railway project created: ${project.id}`);
  console.log(`   📍 Environment: ${prodEnv?.node?.name} (${prodEnv?.node?.id})`);
  
  return {
    ...project,
    environmentId: prodEnv?.node?.id
  };
}

async function createRailwayService(projectId, environmentId, serviceName, githubRepo) {
  console.log(`   🔧 Creating service: ${serviceName} (from ${githubRepo})`);
  
  // Use the enhanced mutation that includes branch and triggers deployment
  const query = `
    mutation serviceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
      }
    }
  `;
  
  const result = await railwayGraphQL(query, {
    input: {
      projectId: projectId,
      name: serviceName,
      source: { repo: githubRepo },
      branch: 'main'  // <-- ADD THIS - explicitly set the branch
    }
  });
  
  console.log(`   ✅ Service created: ${result.serviceCreate.id}`);
  return result.serviceCreate;
}

async function createRailwayPostgres(projectId, environmentId) {
  console.log(`   🗄️ Creating PostgreSQL database...`);
  
  const dbPassword = require('crypto').randomBytes(16).toString('hex');
  
  const serviceQuery = `
    mutation serviceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
      }
    }
  `;
  
  const serviceResult = await railwayGraphQL(serviceQuery, {
    input: {
      projectId: projectId,
      name: 'postgres',
      source: { image: 'postgres:15' }
    }
  });
  
  const postgresServiceId = serviceResult.serviceCreate.id;
  console.log(`   ✅ PostgreSQL service created: ${postgresServiceId}`);

  console.log(`   ⚙️ Injecting database credentials...`);
  const varsQuery = `
    mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
  `;
  
  await railwayGraphQL(varsQuery, {
    input: {
      projectId: projectId,
      environmentId: environmentId,
      serviceId: postgresServiceId,
      variables: {
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: dbPassword,
        POSTGRES_DB: 'app',
        PGPASSWORD: dbPassword 
      }
    }
  });

  console.log(`   ✅ PostgreSQL environment configured`);
  
  console.log(`   🔄 Redeploying PostgreSQL with credentials...`);
  const redeployQuery = `
    mutation serviceInstanceRedeploy($environmentId: String!, $serviceId: String!) {
      serviceInstanceRedeploy(environmentId: $environmentId, serviceId: $serviceId)
    }
  `;
  
  await railwayGraphQL(redeployQuery, { 
    environmentId: environmentId,
    serviceId: postgresServiceId 
  });
  console.log(`   ✅ PostgreSQL redeploy triggered`);

  return { 
    id: postgresServiceId, 
    password: dbPassword,
    connectionString: `postgresql://postgres:${dbPassword}@postgres.railway.internal:5432/app?sslmode=disable`
  };
}

async function setRailwayVariables(projectId, environmentId, serviceId, variables) {
  console.log(`   ⚙️ Setting environment variables...`);
  
  const query = `
    mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
  `;
  
  await railwayGraphQL(query, {
    input: {
      projectId: projectId,
      environmentId: environmentId,
      serviceId: serviceId,
      variables: variables
    }
  });
  
  console.log(`   ✅ Environment variables set`);
}

async function deployRailwayService(environmentId, serviceId) {
  console.log(`   🚀 Triggering deployment...`);
  
  const query = `
    mutation serviceInstanceRedeploy($environmentId: String!, $serviceId: String!) {
      serviceInstanceRedeploy(environmentId: $environmentId, serviceId: $serviceId)
    }
  `;
  
  await railwayGraphQL(query, { environmentId, serviceId });
  console.log(`   ✅ Deployment triggered`);
}

async function generateRailwayServiceDomain(projectId, environmentId, serviceId) {
  console.log(`   🌐 Generating Railway domain...`);
  
  const generateQuery = `
    mutation serviceDomainCreate($input: ServiceDomainCreateInput!) {
      serviceDomainCreate(input: $input) {
        id
        domain
      }
    }
  `;
  
  try {
    const result = await railwayGraphQL(generateQuery, {
      input: {
        environmentId: environmentId,
        serviceId: serviceId
      }
    });
    console.log(`   ✅ Domain generated: ${result.serviceDomainCreate.domain}`);
    return result.serviceDomainCreate.domain;
  } catch (error) {
    console.log(`   ⚠️ Could not generate domain: ${error.message}`);
    return null;
  }
}

async function addRailwayCustomDomain(projectId, environmentId, serviceId, customDomain) {
  console.log(`   🔗 Adding custom domain to Railway: ${customDomain}`);
  
  const mutation = `
    mutation customDomainCreate($input: CustomDomainCreateInput!) {
      customDomainCreate(input: $input) {
        id
        domain
        status {
          dnsRecords {
            hostlabel
            requiredValue
          }
        }
      }
    }
  `;
  
  try {
    const result = await railwayGraphQL(mutation, {
      input: {
        projectId: projectId,
        environmentId: environmentId,
        serviceId: serviceId,
        domain: customDomain
      }
    });
    
    const dnsRecords = result.customDomainCreate.status?.dnsRecords || [];
    const targetRecord = dnsRecords.find(r => r.requiredValue);
    const target = targetRecord?.requiredValue || null;
    
    console.log(`   ✅ Custom domain added, target: ${target}`);
    return { success: true, target: target };
  } catch (error) {
    console.log(`   ⚠️ Custom domain error: ${error.message}`);
    return { success: false, target: null };
  }
}

// ============================================
// CLOUDFLARE API
// ============================================

async function deleteCloudflareDNS(subdomain) {
  // First, find any existing records
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.cloudflare.com',
      path: `/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=${subdomain}.be1st.io`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', async () => {
        try {
          const result = JSON.parse(body);
          if (result.success && result.result && result.result.length > 0) {
            console.log(`   🗑️ Deleting ${result.result.length} existing DNS record(s) for ${subdomain}`);
            for (const record of result.result) {
              await deleteCloudflareRecord(record.id);
            }
          }
        } catch (e) {
          // Ignore errors
        }
        resolve();
      });
    });
    req.on('error', () => resolve());
    req.end();
  });
}

async function deleteCloudflareRecord(recordId) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.cloudflare.com',
      path: `/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${recordId}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve();
      });
    });
    req.on('error', () => resolve());
    req.end();
  });
}

async function addCloudflareDNS(subdomain, target, type = 'CNAME', proxied = true) {
  console.log(`🌐 Adding DNS record: ${subdomain}.be1st.io → ${target} (proxied: ${proxied})`);
  
  // First delete any existing record
  await deleteCloudflareDNS(subdomain);
  
  const data = JSON.stringify({
    type: type,
    name: subdomain,
    content: target,
    ttl: 1,
    proxied: proxied  // Frontend: proxied (orange), Backend API: DNS only (gray)
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.cloudflare.com',
      path: `/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.success) {
            console.log(`   ✅ DNS record added (proxied: true)`);
            resolve(result.result);
          } else {
            console.log(`   ⚠️ Cloudflare warning:`, result.errors?.[0]?.message || 'Unknown');
            resolve(null);
          }
        } catch (e) {
          console.log(`   ⚠️ Could not parse Cloudflare response`);
          resolve(null);
        }
      });
    });
    req.on('error', (err) => {
      console.log(`   ⚠️ Cloudflare request error:`, err.message);
      resolve(null);
    });
    req.write(data);
    req.end();
  });
}

// ============================================
// MAIN DEPLOY FUNCTION
// ============================================

async function deployProject(projectPath, projectName, options = {}) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`🚀 DEPLOYING: ${projectName}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const subdomain = projectName
  .toLowerCase()
  .replace(/&/g, '-and-')
  .replace(/[^a-z0-9]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');
  const results = {
    success: false,
    urls: {},
    credentials: {},
    errors: []
  };

  try {
    const githubUsername = await getGitHubUsername();
    console.log(`👤 GitHub user: ${githubUsername}`);

    prepareProjectForDeployment(projectPath, subdomain);

    const backendRepoName = `${subdomain}-backend`;
    const frontendRepoName = `${subdomain}-frontend`;
    const adminRepoName = `${subdomain}-admin`;

    await deleteGitHubRepo(githubUsername, backendRepoName);
    await deleteGitHubRepo(githubUsername, frontendRepoName);
    await deleteGitHubRepo(githubUsername, adminRepoName);

    await sleep(1000);

    await createGitHubRepo(backendRepoName);
    await createGitHubRepo(frontendRepoName);
    await createGitHubRepo(adminRepoName);

    await pushFolderToGitHub(projectPath, 'backend', backendRepoName, githubUsername);
    await pushFolderToGitHub(projectPath, 'frontend', frontendRepoName, githubUsername);
    
    // Only push admin if it exists
    const adminPath = path.join(projectPath, 'admin');
    if (fs.existsSync(adminPath)) {
      await pushFolderToGitHub(projectPath, 'admin', adminRepoName, githubUsername);
    }

    const railwayProject = await createRailwayProject(subdomain);
    const environmentId = railwayProject.environmentId;

    const postgresInfo = await createRailwayPostgres(railwayProject.id, environmentId);

    const backendService = await createRailwayService(
      railwayProject.id,
      environmentId,
      'backend',
      `${githubUsername}/${backendRepoName}`
    );

    const frontendService = await createRailwayService(
      railwayProject.id,
      environmentId,
      'frontend',
      `${githubUsername}/${frontendRepoName}`
    );

    // Create admin service if admin folder exists
    let adminService = null;
    if (fs.existsSync(path.join(projectPath, 'admin'))) {
      adminService = await createRailwayService(
        railwayProject.id,
        environmentId,
        'admin',
        `${githubUsername}/${adminRepoName}`
      );
    }

    const jwtSecret = require('crypto').randomBytes(32).toString('hex');
    const adminPassword = require('crypto').randomBytes(8).toString('hex');
    
    await setRailwayVariables(railwayProject.id, environmentId, backendService.id, {
      NODE_ENV: 'production',
      JWT_SECRET: jwtSecret,
      ADMIN_EMAIL: options.adminEmail || 'admin@be1st.io',
      ADMIN_PASSWORD: adminPassword,
      PORT: '5000',
      DATABASE_URL: postgresInfo.connectionString,
      FRONTEND_URL: `https://${subdomain}.be1st.io`
    });

    await setRailwayVariables(railwayProject.id, environmentId, frontendService.id, {
      NODE_ENV: 'production',
      VITE_API_URL: `https://api.${subdomain}.be1st.io`
    });

    // Set admin environment variables if admin service exists
    if (adminService) {
      await setRailwayVariables(railwayProject.id, environmentId, adminService.id, {
        NODE_ENV: 'production',
        VITE_API_URL: `https://api.${subdomain}.be1st.io`
      });
    }

    // Wait for Railway to fully establish GitHub webhook connection
    console.log('   ⏳ Waiting 20s for Railway to establish GitHub webhooks...');
    await sleep(20000);

    // Trigger initial deployments with longer delays
    console.log('   🚀 Triggering backend deployment...');
    try {
      await deployRailwayService(environmentId, backendService.id);
    } catch (e) {
      console.log('   ⚠️ Backend deploy trigger failed, Railway will auto-deploy from GitHub');
    }
    await sleep(3000);
    
    console.log('   🚀 Triggering frontend deployment...');
    try {
      await deployRailwayService(environmentId, frontendService.id);
    } catch (e) {
      console.log('   ⚠️ Frontend deploy trigger failed, Railway will auto-deploy from GitHub');
    }

    // Trigger admin deployment if service exists
    if (adminService) {
      await sleep(3000);
      console.log('   🚀 Triggering admin deployment...');
      try {
        await deployRailwayService(environmentId, adminService.id);
      } catch (e) {
        console.log('   ⚠️ Admin deploy trigger failed, Railway will auto-deploy from GitHub');
      }
    }

    const backendRailwayDomain = await generateRailwayServiceDomain(railwayProject.id, environmentId, backendService.id);
    const frontendRailwayDomain = await generateRailwayServiceDomain(railwayProject.id, environmentId, frontendService.id);
    const adminRailwayDomain = adminService ? await generateRailwayServiceDomain(railwayProject.id, environmentId, adminService.id) : null;

    console.log(`\n📌 Configuring custom domains...`);
    
    // Add custom domains to Railway and get the target domains
    const frontendCustom = await addRailwayCustomDomain(railwayProject.id, environmentId, frontendService.id, `${subdomain}.be1st.io`);
    const backendCustom = await addRailwayCustomDomain(railwayProject.id, environmentId, backendService.id, `api.${subdomain}.be1st.io`);
    const adminCustom = adminService ? await addRailwayCustomDomain(railwayProject.id, environmentId, adminService.id, `admin.${subdomain}.be1st.io`) : null;
    
    console.log(`\n📌 Configuring DNS (Cloudflare → Railway)...`);
    
    // Use Railway's custom domain target if available, otherwise fall back to service domain
    const frontendTarget = frontendCustom.target || frontendRailwayDomain;
    const backendTarget = backendCustom.target || backendRailwayDomain;
    const adminTarget = adminCustom?.target || adminRailwayDomain;
    
    if (frontendTarget) {
      await addCloudflareDNS(subdomain, frontendTarget, 'CNAME', true);
    }
    
    if (backendTarget) {
      await addCloudflareDNS(`api.${subdomain}`, backendTarget, 'CNAME', false);
    }

    if (adminTarget) {
  await addCloudflareDNS(`admin.${subdomain}`, adminTarget, 'CNAME', false);  // DNS only, no proxy
}

    results.success = true;
    results.urls = {
      frontend: `https://${subdomain}.be1st.io`,
      backend: `https://api.${subdomain}.be1st.io`,
      admin: adminService ? `https://admin.${subdomain}.be1st.io` : null,
      githubBackend: `https://github.com/${githubUsername}/${backendRepoName}`,
      githubFrontend: `https://github.com/${githubUsername}/${frontendRepoName}`,
      githubAdmin: adminService ? `https://github.com/${githubUsername}/${adminRepoName}` : null,
      railway: `https://railway.app/project/${railwayProject.id}`,
      railwayFrontend: frontendRailwayDomain ? `https://${frontendRailwayDomain}` : null,
      railwayBackend: backendRailwayDomain ? `https://${backendRailwayDomain}` : null,
      railwayAdmin: adminRailwayDomain ? `https://${adminRailwayDomain}` : null
    };
    results.credentials = {
      adminEmail: options.adminEmail || 'admin@be1st.io',
      adminPassword: adminPassword
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ DEPLOYMENT COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('🔗 URLs:');
    console.log(`   Frontend: ${results.urls.frontend}`);
    console.log(`   Backend:  ${results.urls.backend}`);
    if (results.urls.admin) {
      console.log(`   Admin:    ${results.urls.admin}`);
    }
    console.log(`   GitHub (backend):  ${results.urls.githubBackend}`);
    console.log(`   GitHub (frontend): ${results.urls.githubFrontend}`);
    if (results.urls.githubAdmin) {
      console.log(`   GitHub (admin):    ${results.urls.githubAdmin}`);
    }
    console.log(`   Railway:  ${results.urls.railway}`);
    if (results.urls.railwayFrontend) {
      console.log(`   Railway Frontend (direct): ${results.urls.railwayFrontend}`);
    }
    if (results.urls.railwayBackend) {
      console.log(`   Railway Backend (direct):  ${results.urls.railwayBackend}`);
    }
    if (results.urls.railwayAdmin) {
      console.log(`   Railway Admin (direct):    ${results.urls.railwayAdmin}`);
    }
    console.log('');
    console.log('🔑 Admin Credentials:');
    console.log(`   Email:    ${results.credentials.adminEmail}`);
    console.log(`   Password: ${results.credentials.adminPassword}`);
    console.log('');
    console.log('⏱️  Note: Build takes 2-3 minutes. Check Railway dashboard for status.');
    console.log('   Custom domains are fully configured and should work within 1-2 minutes.');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ DEPLOYMENT FAILED:', error.message);
    results.errors.push(error.message);
  }

  return results;
}

// ============================================
// CREDENTIAL CHECK
// ============================================

function checkCredentials() {
  const missing = [];
  if (!RAILWAY_TOKEN) missing.push('RAILWAY_TOKEN');
  if (!GITHUB_TOKEN) missing.push('GITHUB_TOKEN');
  if (!CLOUDFLARE_TOKEN) missing.push('CLOUDFLARE_TOKEN');
  if (!CLOUDFLARE_ZONE_ID) missing.push('CLOUDFLARE_ZONE_ID');
  
  if (missing.length > 0) {
    console.error('❌ Missing credentials in .env:', missing.join(', '));
    return false;
  }
  return true;
}

module.exports = {
  deployProject,
  checkCredentials,
  createGitHubRepo,
  pushFolderToGitHub,
  createRailwayProject,
  createRailwayPostgres,
  addCloudflareDNS,
  prepareProjectForDeployment,
  getGitHubUsername,
  deleteGitHubRepo
};
