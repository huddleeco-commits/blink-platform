#!/usr/bin/env node
/**
 * Blink Self-Deploy Script
 *
 * Deploys the Blink platform itself to Railway + Cloudflare
 * Uses the existing GitHub repo: huddleeco-commits/module-library
 *
 * Usage:
 *   node scripts/self-deploy.cjs staging    # Deploy to staging.blink.be1st.io
 *   node scripts/self-deploy.cjs production # Deploy to blink.be1st.io
 *
 * Prerequisites:
 *   - RAILWAY_TOKEN in .env
 *   - GITHUB_TOKEN in .env
 *   - CLOUDFLARE_TOKEN in .env
 *   - CLOUDFLARE_ZONE_ID in .env
 *   - Code pushed to GitHub
 */

const https = require('https');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CLOUDFLARE_TOKEN = process.env.CLOUDFLARE_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const RAILWAY_TEAM_ID = process.env.RAILWAY_TEAM_ID;

// Configuration
const GITHUB_REPO = 'huddleeco-commits/blink-platform';
const GITHUB_BRANCH = 'main';
const ROOT_DIRECTORY = null; // Not a monorepo - code is at repo root

const ENVIRONMENTS = {
  staging: {
    name: 'blink-platform-staging',
    subdomain: 'staging.blink',
    railwayEnv: 'staging'
  },
  production: {
    name: 'blink-platform-prod',
    subdomain: 'blink',
    railwayEnv: 'production'
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(icon, message) {
  console.log(`${icon} ${message}`);
}

// ============================================
// RAILWAY API (GraphQL)
// ============================================

async function railwayGraphQL(query, variables = {}) {
  const data = JSON.stringify({ query, variables });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'backboard.railway.app',
      path: '/graphql/v2',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
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
          reject(new Error(`Railway API parse error: ${body.substring(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function findExistingProject(name) {
  log('🔍', `Looking for existing project: ${name}`);

  // If RAILWAY_TEAM_ID is set, query projects in that workspace
  // Otherwise query personal projects under me
  let query, queryPath;

  if (RAILWAY_TEAM_ID && RAILWAY_TEAM_ID.length > 0) {
    query = `
      query workspaceProjects($id: String!) {
        workspace(id: $id) {
          projects {
            edges {
              node {
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
          }
        }
      }
    `;
    queryPath = 'workspace.projects';
  } else {
    query = `
      query projects {
        me {
          projects {
            edges {
              node {
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
          }
        }
      }
    `;
    queryPath = 'me.projects';
  }

  try {
    const variables = RAILWAY_TEAM_ID ? { id: RAILWAY_TEAM_ID } : {};
    const result = await railwayGraphQL(query, variables);

    // Navigate to projects based on query path
    let projects;
    if (queryPath === 'workspace.projects') {
      projects = result.workspace?.projects?.edges || [];
    } else {
      projects = result.me?.projects?.edges || [];
    }

    const existing = projects.find(p => p.node.name === name);

    if (existing) {
      const project = existing.node;
      const prodEnv = project.environments.edges.find(e => e.node.name === 'production')
        || project.environments.edges[0];

      log('✅', `Found existing project: ${project.id}`);
      return {
        id: project.id,
        name: project.name,
        environmentId: prodEnv?.node?.id
      };
    }

    return null;
  } catch (error) {
    log('⚠️', `Could not search projects: ${error.message}`);
    return null;
  }
}

async function createRailwayProject(name) {
  log('🚂', `Creating Railway project: ${name}`);

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
  // Only add workspaceId if explicitly set and not empty
  if (RAILWAY_TEAM_ID && RAILWAY_TEAM_ID.length > 0) {
    input.workspaceId = RAILWAY_TEAM_ID;
  }

  const result = await railwayGraphQL(query, { input });
  const project = result.projectCreate;
  const prodEnv = project.environments.edges.find(e => e.node.name === 'production')
    || project.environments.edges[0];

  log('✅', `Project created: ${project.id}`);

  return {
    id: project.id,
    name: project.name,
    environmentId: prodEnv?.node?.id
  };
}

async function findExistingService(projectId, serviceName) {
  const query = `
    query project($id: String!) {
      project(id: $id) {
        services {
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
    const result = await railwayGraphQL(query, { id: projectId });
    const services = result.project.services.edges;
    const existing = services.find(s => s.node.name === serviceName);
    return existing ? existing.node : null;
  } catch (error) {
    return null;
  }
}

async function createRailwayService(projectId, environmentId, serviceName, githubRepo, rootDirectory) {
  log('🔧', `Creating service: ${serviceName}`);

  // Check if service already exists
  const existing = await findExistingService(projectId, serviceName);
  if (existing) {
    log('✅', `Service already exists: ${existing.id}`);
    return existing;
  }

  // Step 1: Create the service (without rootDirectory - Railway API doesn't accept it in serviceCreate)
  const createQuery = `
    mutation serviceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
      }
    }
  `;

  const result = await railwayGraphQL(createQuery, {
    input: {
      projectId: projectId,
      name: serviceName,
      source: { repo: githubRepo }
    }
  });

  const serviceId = result.serviceCreate.id;
  log('✅', `Service created: ${serviceId}`);

  // Step 2: Update service instance to set root directory and branch
  if (rootDirectory) {
    log('⚙️', `Setting root directory: ${rootDirectory}`);

    const updateQuery = `
      mutation serviceInstanceUpdate($input: ServiceInstanceUpdateInput!) {
        serviceInstanceUpdate(input: $input)
      }
    `;

    // Try multiple approaches to set root directory
    let rootDirSet = false;

    // Approach 1: serviceInstanceUpdate with environmentId
    try {
      const instanceQuery = `
        mutation serviceInstanceUpdate($environmentId: String!, $input: ServiceInstanceUpdateInput!) {
          serviceInstanceUpdate(environmentId: $environmentId, input: $input)
        }
      `;
      await railwayGraphQL(instanceQuery, {
        environmentId: environmentId,
        input: {
          serviceId: serviceId,
          rootDirectory: rootDirectory
        }
      });
      log('✅', `Root directory configured via serviceInstanceUpdate`);
      rootDirSet = true;
    } catch (err1) {
      log('⚠️', `serviceInstanceUpdate failed: ${err1.message}`);
    }

    // Approach 2: serviceUpdate mutation
    if (!rootDirSet) {
      try {
        const serviceUpdateQuery = `
          mutation serviceUpdate($id: String!, $input: ServiceUpdateInput!) {
            serviceUpdate(id: $id, input: $input) {
              id
            }
          }
        `;
        await railwayGraphQL(serviceUpdateQuery, {
          id: serviceId,
          input: {
            rootDirectory: rootDirectory
          }
        });
        log('✅', `Root directory configured via serviceUpdate`);
        rootDirSet = true;
      } catch (err2) {
        log('⚠️', `serviceUpdate failed: ${err2.message}`);
      }
    }

    // Approach 3: Just proceed - railway.json in the subdirectory may work
    if (!rootDirSet) {
      log('⚠️', `Could not set root directory via API. Will rely on railway.json if present.`);
      log('💡', `You may need to manually set root directory in Railway dashboard.`);
    }
  }

  return result.serviceCreate;
}

async function createPostgresService(projectId, environmentId) {
  log('🗄️', 'Creating PostgreSQL database...');

  // Check if postgres already exists
  const existing = await findExistingService(projectId, 'postgres');
  if (existing) {
    log('✅', 'PostgreSQL already exists');
    // We need to get the connection string - for now return a placeholder
    // The actual connection is set via Railway's internal networking
    return {
      id: existing.id,
      connectionString: '${{Postgres.DATABASE_URL}}'
    };
  }

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
      name: 'postgres',
      source: { image: 'postgres:15' }
    }
  });

  const postgresId = result.serviceCreate.id;

  // Set postgres environment variables
  const dbPassword = require('crypto').randomBytes(16).toString('hex');

  await setRailwayVariables(projectId, environmentId, postgresId, {
    POSTGRES_USER: 'postgres',
    POSTGRES_PASSWORD: dbPassword,
    POSTGRES_DB: 'blink',
    PGPASSWORD: dbPassword
  });

  log('✅', `PostgreSQL created: ${postgresId}`);

  return {
    id: postgresId,
    connectionString: `postgresql://postgres:${dbPassword}@postgres.railway.internal:5432/blink?sslmode=disable`
  };
}

async function setRailwayVariables(projectId, environmentId, serviceId, variables) {
  log('⚙️', `Setting ${Object.keys(variables).length} environment variables...`);

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

  log('✅', 'Environment variables set');
}

async function deployService(environmentId, serviceId) {
  log('🚀', 'Triggering deployment...');

  const query = `
    mutation serviceInstanceRedeploy($environmentId: String!, $serviceId: String!) {
      serviceInstanceRedeploy(environmentId: $environmentId, serviceId: $serviceId)
    }
  `;

  try {
    await railwayGraphQL(query, { environmentId, serviceId });
    log('✅', 'Deployment triggered');
  } catch (error) {
    log('⚠️', `Deploy trigger failed: ${error.message} (Railway may auto-deploy)`);
  }
}

async function generateServiceDomain(projectId, environmentId, serviceId) {
  log('🌐', 'Generating Railway domain...');

  const query = `
    mutation serviceDomainCreate($input: ServiceDomainCreateInput!) {
      serviceDomainCreate(input: $input) {
        id
        domain
      }
    }
  `;

  try {
    const result = await railwayGraphQL(query, {
      input: {
        environmentId: environmentId,
        serviceId: serviceId
      }
    });
    log('✅', `Domain: ${result.serviceDomainCreate.domain}`);
    return result.serviceDomainCreate.domain;
  } catch (error) {
    log('⚠️', `Could not generate domain: ${error.message}`);
    return null;
  }
}

async function addCustomDomain(projectId, environmentId, serviceId, domain) {
  log('🔗', `Adding custom domain: ${domain}`);

  const query = `
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
    const result = await railwayGraphQL(query, {
      input: {
        projectId: projectId,
        environmentId: environmentId,
        serviceId: serviceId,
        domain: domain
      }
    });

    const dnsRecords = result.customDomainCreate.status?.dnsRecords || [];
    const target = dnsRecords.find(r => r.requiredValue)?.requiredValue;

    log('✅', `Custom domain added, target: ${target}`);
    return target;
  } catch (error) {
    log('⚠️', `Custom domain error: ${error.message}`);
    return null;
  }
}

// ============================================
// CLOUDFLARE API
// ============================================

async function deleteCloudflareDNS(name) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.cloudflare.com',
      path: `/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=${name}.be1st.io`,
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
          if (result.success && result.result?.length > 0) {
            for (const record of result.result) {
              await deleteRecord(record.id);
            }
          }
        } catch (e) {}
        resolve();
      });
    });
    req.on('error', () => resolve());
    req.end();
  });
}

async function deleteRecord(recordId) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.cloudflare.com',
      path: `/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${recordId}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_TOKEN}`
      }
    }, () => resolve());
    req.on('error', () => resolve());
    req.end();
  });
}

async function addCloudflareDNS(name, target, proxied = true) {
  log('📡', `Adding DNS: ${name}.be1st.io → ${target}`);

  await deleteCloudflareDNS(name);

  const data = JSON.stringify({
    type: 'CNAME',
    name: name,
    content: target,
    ttl: 1,
    proxied: proxied
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.cloudflare.com',
      path: `/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.success) {
            log('✅', 'DNS record added');
            resolve(result.result);
          } else {
            log('⚠️', `DNS error: ${result.errors?.[0]?.message}`);
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.write(data);
    req.end();
  });
}

// ============================================
// MAIN DEPLOY FUNCTION
// ============================================

async function deploy(environment) {
  const config = ENVIRONMENTS[environment];
  if (!config) {
    console.error(`❌ Unknown environment: ${environment}`);
    console.error('   Use: staging or production');
    process.exit(1);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`🚀 BLINK SELF-DEPLOY: ${environment.toUpperCase()}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`   GitHub Repo:  ${GITHUB_REPO}`);
  console.log(`   Branch:       ${GITHUB_BRANCH}`);
  console.log(`   Root Dir:     ${ROOT_DIRECTORY}`);
  console.log(`   Subdomain:    ${config.subdomain}.be1st.io`);
  console.log('');

  // Check credentials
  const missing = [];
  if (!RAILWAY_TOKEN) missing.push('RAILWAY_TOKEN');
  if (!GITHUB_TOKEN) missing.push('GITHUB_TOKEN');
  if (!CLOUDFLARE_TOKEN) missing.push('CLOUDFLARE_TOKEN');
  if (!CLOUDFLARE_ZONE_ID) missing.push('CLOUDFLARE_ZONE_ID');

  if (missing.length > 0) {
    console.error(`❌ Missing credentials: ${missing.join(', ')}`);
    process.exit(1);
  }

  try {
    // 1. Find or create Railway project
    let project = await findExistingProject(config.name);
    if (!project) {
      project = await createRailwayProject(config.name);
    }

    // 2. Create PostgreSQL database
    const postgres = await createPostgresService(project.id, project.environmentId);

    // 3. Create the Blink service (monolithic - serves both API and frontend)
    const blinkService = await createRailwayService(
      project.id,
      project.environmentId,
      'blink',
      GITHUB_REPO,
      ROOT_DIRECTORY
    );

    // 4. Set environment variables
    const jwtSecret = require('crypto').randomBytes(32).toString('hex');

    // Read existing .env for API keys
    const envPath = path.join(__dirname, '..', '.env');
    let anthropicKey = process.env.ANTHROPIC_API_KEY || '';
    let pexelsKey = process.env.PEXELS_API_KEY || '';
    let sentryDsn = process.env.SENTRY_DSN_BACKEND || '';

    await setRailwayVariables(project.id, project.environmentId, blinkService.id, {
      NODE_ENV: 'production',
      PORT: '3001',

      // Database - use Railway's reference variable for internal networking
      DATABASE_URL: postgres.connectionString,

      // Auth
      JWT_SECRET: jwtSecret,
      BLINK_ADMIN_PASSWORD: process.env.BLINK_ADMIN_PASSWORD || 'blink2026',
      BLINK_DEV_PASSWORD: process.env.BLINK_DEV_PASSWORD || 'dev2026',
      ADMIN_EMAIL: 'admin@blink.be1st.io',
      ADMIN_PASSWORD: require('crypto').randomBytes(8).toString('hex'),

      // API Keys (from local .env)
      ANTHROPIC_API_KEY: anthropicKey,
      PEXELS_API_KEY: pexelsKey,
      SENTRY_DSN_BACKEND: sentryDsn,

      // Deploy credentials (for generated projects)
      RAILWAY_TOKEN: RAILWAY_TOKEN,
      GITHUB_TOKEN: GITHUB_TOKEN,
      CLOUDFLARE_TOKEN: CLOUDFLARE_TOKEN,
      CLOUDFLARE_ZONE_ID: CLOUDFLARE_ZONE_ID,

      // URLs
      FRONTEND_URL: `https://${config.subdomain}.be1st.io`
    });

    // 5. Generate Railway domain and add custom domain
    const railwayDomain = await generateServiceDomain(project.id, project.environmentId, blinkService.id);
    const customTarget = await addCustomDomain(project.id, project.environmentId, blinkService.id, `${config.subdomain}.be1st.io`);

    // 6. Set up Cloudflare DNS
    const dnsTarget = customTarget || railwayDomain;
    if (dnsTarget) {
      await addCloudflareDNS(config.subdomain, dnsTarget, true);
    }

    // 7. Trigger deployment
    log('⏳', 'Waiting for Railway to connect to GitHub...');
    await sleep(10000);
    await deployService(project.environmentId, blinkService.id);

    // Done!
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ DEPLOYMENT INITIATED');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('🔗 URLs:');
    console.log(`   App:      https://${config.subdomain}.be1st.io`);
    console.log(`   Railway:  https://railway.app/project/${project.id}`);
    if (railwayDomain) {
      console.log(`   Direct:   https://${railwayDomain}`);
    }
    console.log('');
    console.log('⏱️  Build takes 2-3 minutes. Check Railway dashboard for status.');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ DEPLOYMENT FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================
// CLI
// ============================================

const args = process.argv.slice(2);
const environment = args[0] || 'staging';

deploy(environment);
