/**
 * BE1st Project Cleanup Tool
 * Deletes a project from: GitHub, Railway, Cloudflare DNS, and local folder
 * 
 * Usage: node cleanup-project.cjs <project-name>
 * Example: node cleanup-project.cjs booklyns-best-pizza
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from your module-assembler-ui .env
require('dotenv').config({ path: 'C:\\Users\\huddl\\OneDrive\\Desktop\\module-library\\module-assembler-ui\\.env' });

const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CLOUDFLARE_TOKEN = process.env.CLOUDFLARE_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const GITHUB_USERNAME = 'huddleeco-commits';
const GENERATED_PROJECTS_PATH = 'C:\\Users\\huddl\\OneDrive\\Desktop\\generated-projects';

// ============================================
// GITHUB API
// ============================================

async function deleteGitHubRepo(repoName) {
  console.log(`🗑️  Deleting GitHub repo: ${GITHUB_USERNAME}/${repoName}`);
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_USERNAME}/${repoName}`,
      method: 'DELETE',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'BE1st-Cleanup',
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 204) {
          console.log(`   ✅ GitHub repo deleted`);
          resolve(true);
        } else if (res.statusCode === 404) {
          console.log(`   ⚠️ GitHub repo not found (already deleted?)`);
          resolve(false);
        } else {
          console.log(`   ❌ GitHub error: ${res.statusCode} - ${body}`);
          resolve(false);
        }
      });
    });
    req.on('error', (err) => {
      console.log(`   ❌ GitHub error: ${err.message}`);
      resolve(false);
    });
    req.end();
  });
}

// ============================================
// RAILWAY API
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

async function findRailwayProject(projectName) {
  console.log(`🔍 Searching for Railway project: ${projectName}`);
  
  const query = `
    query projects {
      projects {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `;
  
  try {
    const result = await railwayGraphQL(query);
    const projects = result.projects.edges.map(e => e.node);
    const found = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
    
    if (found) {
      console.log(`   ✅ Found project: ${found.id}`);
      return found;
    } else {
      console.log(`   ⚠️ Project not found`);
      return null;
    }
  } catch (err) {
    console.log(`   ❌ Railway search error: ${err.message}`);
    return null;
  }
}

async function deleteRailwayProject(projectId) {
  console.log(`🗑️  Deleting Railway project: ${projectId}`);
  
  const query = `
    mutation projectDelete($id: String!) {
      projectDelete(id: $id)
    }
  `;
  
  try {
    await railwayGraphQL(query, { id: projectId });
    console.log(`   ✅ Railway project deleted`);
    return true;
  } catch (err) {
    console.log(`   ❌ Railway delete error: ${err.message}`);
    return false;
  }
}

// ============================================
// CLOUDFLARE API
// ============================================

async function getCloudflareDNSRecords() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.cloudflare.com',
      path: `/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?per_page=100`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.success) {
            resolve(result.result);
          } else {
            reject(new Error(result.errors[0]?.message || 'Cloudflare API error'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function deleteCloudflareDNSRecord(recordId, recordName) {
  console.log(`   🗑️  Deleting DNS record: ${recordName}`);
  
  return new Promise((resolve, reject) => {
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
        const result = JSON.parse(body);
        if (result.success) {
          console.log(`      ✅ Deleted`);
          resolve(true);
        } else {
          console.log(`      ❌ Failed: ${result.errors[0]?.message}`);
          resolve(false);
        }
      });
    });
    req.on('error', (err) => {
      console.log(`      ❌ Error: ${err.message}`);
      resolve(false);
    });
    req.end();
  });
}

async function deleteCloudfareDNSForProject(projectName) {
  console.log(`🗑️  Deleting Cloudflare DNS records for: ${projectName}`);
  
  const subdomain = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const recordsToDelete = [
    subdomain,
    `api.${subdomain}`
  ];
  
  try {
    const allRecords = await getCloudflareDNSRecords();
    let deleted = 0;
    
    for (const record of allRecords) {
      const recordSubdomain = record.name.replace('.be1st.io', '');
      if (recordsToDelete.includes(recordSubdomain)) {
        const success = await deleteCloudflareDNSRecord(record.id, record.name);
        if (success) deleted++;
      }
    }
    
    if (deleted === 0) {
      console.log(`   ⚠️ No DNS records found for ${projectName}`);
    } else {
      console.log(`   ✅ Deleted ${deleted} DNS record(s)`);
    }
    return deleted > 0;
  } catch (err) {
    console.log(`   ❌ Cloudflare error: ${err.message}`);
    return false;
  }
}

// ============================================
// LOCAL FOLDER
// ============================================

function deleteLocalFolder(projectName) {
  const patterns = [
    projectName,
    projectName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/ /g, '-'),
    projectName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-'),
    projectName.toLowerCase(),
    projectName.toUpperCase()
  ];
  
  console.log(`🗑️  Deleting local folder...`);
  
  for (const pattern of patterns) {
    const folderPath = path.join(GENERATED_PROJECTS_PATH, pattern);
    if (fs.existsSync(folderPath)) {
      console.log(`   Found: ${folderPath}`);
      try {
        fs.rmSync(folderPath, { recursive: true, force: true });
        console.log(`   ✅ Local folder deleted`);
        return true;
      } catch (err) {
        console.log(`   ❌ Delete error: ${err.message}`);
        return false;
      }
    }
  }
  
  console.log(`   ⚠️ Local folder not found`);
  return false;
}

// ============================================
// LIST PROJECTS
// ============================================

async function listAllProjects() {
  console.log('\n📋 LISTING ALL PROJECTS\n');
  
  // Railway projects
  console.log('🚂 Railway Projects:');
  try {
    const query = `
      query projects {
        projects {
          edges {
            node {
              id
              name
              createdAt
            }
          }
        }
      }
    `;
    const result = await railwayGraphQL(query);
    const projects = result.projects.edges.map(e => e.node);
    projects.forEach(p => {
      console.log(`   • ${p.name} (${p.id})`);
    });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
  
  // Cloudflare DNS
  console.log('\n🌐 Cloudflare DNS Records (be1st.io subdomains):');
  try {
    const records = await getCloudflareDNSRecords();
    const subdomains = records.filter(r => 
      r.type === 'CNAME' && 
      r.name.endsWith('.be1st.io') && 
      !r.name.startsWith('www') &&
      !r.name.startsWith('_') &&
      !r.name.startsWith('pay')
    );
    subdomains.forEach(r => {
      const name = r.name.replace('.be1st.io', '');
      console.log(`   • ${name} → ${r.content.substring(0, 30)}...`);
    });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
  
  // Local folders
  console.log('\n📁 Local Generated Projects:');
  try {
    const folders = fs.readdirSync(GENERATED_PROJECTS_PATH);
    folders.forEach(f => {
      const stats = fs.statSync(path.join(GENERATED_PROJECTS_PATH, f));
      if (stats.isDirectory()) {
        console.log(`   • ${f}`);
      }
    });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
  
  console.log('');
}

// ============================================
// MAIN CLEANUP
// ============================================

async function cleanupProject(projectName) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`🧹 CLEANING UP: ${projectName}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  
  const subdomain = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const results = {
    github: false,
    railway: false,
    cloudflare: false,
    local: false
  };
  
  // 1. Delete GitHub repo
  results.github = await deleteGitHubRepo(subdomain);
  
  // 2. Find and delete Railway project
  const railwayProject = await findRailwayProject(subdomain);
  if (railwayProject) {
    results.railway = await deleteRailwayProject(railwayProject.id);
  }
  
  // 3. Delete Cloudflare DNS records
  results.cloudflare = await deleteCloudfareDNSForProject(projectName);
  
  // 4. Delete local folder
  results.local = deleteLocalFolder(projectName);
  
  // Summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 CLEANUP SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   GitHub:     ${results.github ? '✅ Deleted' : '⚠️ Not found or failed'}`);
  console.log(`   Railway:    ${results.railway ? '✅ Deleted' : '⚠️ Not found or failed'}`);
  console.log(`   Cloudflare: ${results.cloudflare ? '✅ Deleted' : '⚠️ Not found or failed'}`);
  console.log(`   Local:      ${results.local ? '✅ Deleted' : '⚠️ Not found or failed'}`);
  console.log('');
  
  return results;
}

// ============================================
// BULK CLEANUP
// ============================================

async function bulkCleanup(projectNames) {
  console.log(`\n🧹 BULK CLEANUP: ${projectNames.length} projects\n`);
  
  for (const name of projectNames) {
    await cleanupProject(name);
    console.log('\n---\n');
  }
}

// ============================================
// CLI
// ============================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              BE1st Project Cleanup Tool                       ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Usage:                                                       ║
║    node cleanup-project.cjs <project-name>                    ║
║    node cleanup-project.cjs --list                            ║
║    node cleanup-project.cjs --bulk name1 name2 name3          ║
║                                                               ║
║  Examples:                                                    ║
║    node cleanup-project.cjs booklyns-best-pizza               ║
║    node cleanup-project.cjs common-cents                      ║
║    node cleanup-project.cjs --list                            ║
║    node cleanup-project.cjs --bulk pizza-shop coffee-house    ║
║                                                               ║
║  Deletes from:                                                ║
║    • GitHub repo                                              ║
║    • Railway project                                          ║
║    • Cloudflare DNS records                                   ║
║    • Local generated-projects folder                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
    return;
  }
  
  if (args[0] === '--list') {
    await listAllProjects();
    return;
  }
  
  if (args[0] === '--bulk') {
    const projects = args.slice(1);
    if (projects.length === 0) {
      console.log('❌ No project names provided for bulk cleanup');
      return;
    }
    await bulkCleanup(projects);
    return;
  }
  
  // Single project cleanup
  await cleanupProject(args[0]);
}

main().catch(console.error);
