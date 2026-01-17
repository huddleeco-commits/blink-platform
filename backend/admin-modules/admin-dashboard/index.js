/**
 * Admin Dashboard Module
 * Core overview and statistics
 */

const routes = require('./routes/index.js');
const moduleConfig = require('./module.json');

module.exports = {
  name: moduleConfig.name,
  config: moduleConfig,
  routes,
  components: {
    DashboardPage: './components/DashboardPage.jsx'
  }
};
