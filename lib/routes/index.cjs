/**
 * Routes Index
 * Re-exports all route factory functions
 */

const { createAuthRoutes } = require('./auth.cjs');
const { createConfigRoutes } = require('./config.cjs');
const { createUtilityRoutes } = require('./utility.cjs');
const { createDeployRoutes, autoDeployProject } = require('./deploy.cjs');

module.exports = {
  createAuthRoutes,
  createConfigRoutes,
  createUtilityRoutes,
  createDeployRoutes,
  autoDeployProject
};
