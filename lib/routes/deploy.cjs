/**
 * Deploy Routes
 * Extracted from server.cjs
 *
 * Handles: deploy, deploy/status, deploy/railway-status
 */

const express = require('express');
const fs = require('fs');

/**
 * Create deploy routes
 * @param {Object} deps - Dependencies
 * @param {Object} deps.deployService - Deploy service module
 * @param {boolean} deps.deployReady - Whether deploy is configured
 */
function createDeployRoutes(deps) {
  const router = express.Router();
  const { deployService, deployReady } = deps;

  // Deploy a generated project with optional SSE streaming
  router.post('/deploy', async (req, res) => {
    const { projectPath, projectName, adminEmail, stream } = req.body;

    if (!deployReady) {
      return res.status(500).json({
        success: false,
        error: 'Deploy service not configured. Check .env for missing credentials.'
      });
    }

    if (!projectPath || !projectName) {
      return res.status(400).json({
        success: false,
        error: 'projectPath and projectName required'
      });
    }

    // Check project exists
    if (!fs.existsSync(projectPath)) {
      return res.status(400).json({
        success: false,
        error: `Project not found: ${projectPath}`
      });
    }

    console.log(`\n🚀 Deploy request received for: ${projectName}`);

    // If streaming requested, use SSE
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      try {
        const result = await deployService.deployProject(projectPath, projectName, {
          adminEmail: adminEmail || 'admin@be1st.io',
          onProgress: (progress) => {
            res.write(`data: ${JSON.stringify(progress)}\n\n`);
          }
        });

        // Send final result
        res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
        res.end();
      } catch (error) {
        console.error('Deploy error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming mode (original behavior)
      try {
        const result = await deployService.deployProject(projectPath, projectName, {
          adminEmail: adminEmail || 'admin@be1st.io'
        });

        res.json(result);
      } catch (error) {
        console.error('Deploy error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  });

  // Check deploy status
  router.get('/deploy/status', (req, res) => {
    res.json({
      ready: deployReady,
      services: {
        railway: !!process.env.RAILWAY_TOKEN,
        github: !!process.env.GITHUB_TOKEN,
        cloudflare: !!process.env.CLOUDFLARE_TOKEN && !!process.env.CLOUDFLARE_ZONE_ID
      }
    });
  });

  // Poll Railway deployment status
  router.get('/deploy/railway-status/:projectId', async (req, res) => {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID required' });
    }

    if (!process.env.RAILWAY_TOKEN) {
      return res.status(500).json({ success: false, error: 'Railway token not configured' });
    }

    try {
      // GraphQL query to get all services and their deployment status
      const query = `
        query($projectId: String!) {
          project(id: $projectId) {
            id
            name
            services {
              edges {
                node {
                  id
                  name
                  deployments(first: 1) {
                    edges {
                      node {
                        id
                        status
                        createdAt
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://backboard.railway.app/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RAILWAY_TOKEN}`
        },
        body: JSON.stringify({ query, variables: { projectId } })
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'Railway API error');
      }

      const project = data.data?.project;
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      // Map services to their status
      const services = {};
      let allDeployed = true;
      let hasFailure = false;

      for (const edge of (project.services?.edges || [])) {
        const service = edge.node;
        const latestDeployment = service.deployments?.edges?.[0]?.node;
        const status = latestDeployment?.status || 'PENDING';

        // Normalize service names (postgres, backend, frontend, admin)
        let serviceName = service.name.toLowerCase();
        if (serviceName.includes('postgres') || serviceName.includes('database')) {
          serviceName = 'postgres';
        } else if (serviceName.includes('backend') || serviceName.includes('api')) {
          serviceName = 'backend';
        } else if (serviceName.includes('admin')) {
          serviceName = 'admin';
        } else if (serviceName.includes('frontend')) {
          serviceName = 'frontend';
        }

        services[serviceName] = {
          name: service.name,
          status: status,
          isDeployed: status === 'SUCCESS',
          isFailed: status === 'FAILED' || status === 'CRASHED',
          isBuilding: status === 'BUILDING' || status === 'DEPLOYING' || status === 'INITIALIZING'
        };

        if (status !== 'SUCCESS') {
          allDeployed = false;
        }
        if (status === 'FAILED' || status === 'CRASHED') {
          hasFailure = true;
        }
      }

      res.json({
        success: true,
        projectId: project.id,
        projectName: project.name,
        services,
        allDeployed,
        hasFailure,
        serviceCount: Object.keys(services).length
      });

    } catch (error) {
      console.error('Railway status check failed:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to check Railway status'
      });
    }
  });

  return router;
}

/**
 * Auto-deploy helper function
 * @param {string} projectPath - Path to the project
 * @param {string} projectName - Project name
 * @param {string} adminEmail - Admin email
 * @param {Object} deployService - Deploy service module
 * @param {boolean} deployReady - Whether deploy is configured
 */
async function autoDeployProject(projectPath, projectName, adminEmail, deployService, deployReady) {
  if (!deployReady) {
    console.log('⚠️ Auto-deploy skipped: Deploy service not configured');
    return null;
  }

  console.log(`\n🚀 Auto-deploying: ${projectName}`);
  try {
    const result = await deployService.deployProject(projectPath, projectName, {
      adminEmail: adminEmail || 'admin@be1st.io'
    });
    return result;
  } catch (error) {
    console.error('Auto-deploy error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { createDeployRoutes, autoDeployProject };
