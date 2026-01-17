/**
 * Admin Module Loader
 * Loads and assembles admin modules based on tier and customization
 */

const fs = require('fs');
const path = require('path');

// Load tier configurations
const ADMIN_TIERS_PATH = path.join(__dirname, '../../configs/admin-tiers.json');
const INDUSTRY_MAPPING_PATH = path.join(__dirname, '../../configs/industry-admin-mapping.json');
const ADMIN_MODULES_PATH = path.join(__dirname, '../../backend/admin-modules');

let adminTiers = null;
let industryMapping = null;

function loadConfigs() {
  if (!adminTiers) {
    adminTiers = JSON.parse(fs.readFileSync(ADMIN_TIERS_PATH, 'utf8'));
  }
  if (!industryMapping) {
    industryMapping = JSON.parse(fs.readFileSync(INDUSTRY_MAPPING_PATH, 'utf8'));
  }
  return { adminTiers, industryMapping };
}

/**
 * Get available admin tiers with their modules
 */
function getAdminTiers() {
  const { adminTiers } = loadConfigs();
  return adminTiers.tiers;
}

/**
 * Get module information
 */
function getModuleInfo() {
  const { adminTiers } = loadConfigs();
  return adminTiers.moduleInfo;
}

/**
 * Suggest admin tier based on industry
 * @param {string} industry - The industry type
 * @param {string} businessDescription - Optional business description for keyword matching
 * @returns {object} - Suggested tier and modules with reasoning
 */
function suggestAdminTier(industry, businessDescription = '') {
  const { adminTiers, industryMapping } = loadConfigs();
  const desc = (businessDescription || '').toLowerCase();

  // Track detected modules and reasons
  let detectedModules = new Set();
  let reasons = [];
  let baseTier = 'standard';
  let tierSource = 'default';

  // Check direct industry mapping first
  const industryConfig = industryMapping.industries[industry?.toLowerCase()];
  if (industryConfig) {
    baseTier = industryConfig.defaultTier;
    tierSource = 'industry-mapping';
    reasons.push(industryConfig.reason);

    // Add industry's suggested modules
    for (const mod of industryConfig.suggestedModules || []) {
      detectedModules.add(mod);
    }
  }

  // Keyword matching from business description - always apply for additional modules
  if (desc) {
    for (const [keyword, modules] of Object.entries(industryMapping.keywords || {})) {
      if (desc.includes(keyword.toLowerCase())) {
        modules.forEach(m => detectedModules.add(m));
      }
    }

    // Check for tier bump keywords - these override the base tier
    const tierBumpKeywords = industryMapping.tierBumpKeywords || {};

    // Check enterprise bump keywords
    for (const keyword of tierBumpKeywords.enterprise || []) {
      if (desc.includes(keyword.toLowerCase())) {
        if (baseTier !== 'enterprise') {
          baseTier = 'enterprise';
          tierSource = 'keyword-bump';
          reasons.push(`Detected "${keyword}" - requires enterprise tier`);
        }
        break;
      }
    }

    // Check pro bump keywords (only if not already enterprise)
    if (baseTier !== 'enterprise') {
      for (const keyword of tierBumpKeywords.pro || []) {
        if (desc.includes(keyword.toLowerCase())) {
          if (baseTier === 'lite' || baseTier === 'standard') {
            baseTier = 'pro';
            tierSource = 'keyword-bump';
            reasons.push(`Detected "${keyword}" - requires pro tier`);
          }
          break;
        }
      }
    }
  }

  // Get the tier configuration
  const tierConfig = adminTiers.tiers[baseTier];
  if (!tierConfig) {
    console.warn(`Unknown tier: ${baseTier}, falling back to standard`);
    baseTier = 'standard';
  }

  // Start with tier's modules
  let modules = [...(adminTiers.tiers[baseTier]?.modules || [])];

  // Add any detected modules not already in the tier
  detectedModules.forEach(m => {
    if (!modules.includes(m)) {
      modules.push(m);
    }
  });

  // If we detected modules via keywords, add that to reasons
  if (detectedModules.size > 0 && tierSource !== 'keyword-bump') {
    const moduleNames = [...detectedModules].map(m => {
      const info = adminTiers.moduleInfo?.[m];
      return info?.name || m.replace('admin-', '');
    });
    if (reasons.length === 0) {
      reasons.push(`Detected features: ${moduleNames.join(', ')}`);
    }
  }

  // Build final reason
  let finalReason = reasons.length > 0 ? reasons.join('. ') : 'Default tier for unknown industry';

  return {
    tier: baseTier,
    tierName: adminTiers.tiers[baseTier]?.name || baseTier,
    modules,
    moduleCount: modules.length,
    reason: finalReason,
    source: tierSource,
    detectedKeywords: [...detectedModules]
  };
}

/**
 * Get modules for a specific tier
 * @param {string} tier - The tier name (lite, standard, pro, enterprise)
 * @returns {string[]} - List of module names
 */
function getModulesForTier(tier) {
  const { adminTiers } = loadConfigs();
  const tierConfig = adminTiers.tiers[tier];
  if (!tierConfig) {
    console.warn(`Unknown tier: ${tier}, falling back to standard`);
    return adminTiers.tiers.standard.modules;
  }
  return tierConfig.modules;
}

/**
 * Validate and resolve module list
 * Ensures dependencies are included and removes invalid modules
 * @param {string[]} requestedModules - List of requested module names
 * @returns {string[]} - Resolved module list with dependencies
 */
function resolveModules(requestedModules) {
  const resolved = new Set();
  const moduleConfigs = {};

  // Load all module configs
  const moduleDirs = fs.readdirSync(ADMIN_MODULES_PATH);
  for (const dir of moduleDirs) {
    if (dir.startsWith('_')) continue;
    const configPath = path.join(ADMIN_MODULES_PATH, dir, 'module.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      moduleConfigs[config.name] = config;
    }
  }

  // Resolve dependencies recursively
  function addWithDeps(moduleName) {
    if (resolved.has(moduleName)) return;
    if (!moduleConfigs[moduleName]) {
      console.warn(`Unknown module: ${moduleName}`);
      return;
    }

    const config = moduleConfigs[moduleName];
    // Add dependencies first
    for (const dep of config.dependencies || []) {
      addWithDeps(dep);
    }
    resolved.add(moduleName);
  }

  // Add all requested modules with their dependencies
  for (const mod of requestedModules) {
    addWithDeps(mod);
  }

  // Sort by order
  const sortedModules = [...resolved].sort((a, b) => {
    const orderA = moduleConfigs[a]?.order || 99;
    const orderB = moduleConfigs[b]?.order || 99;
    return orderA - orderB;
  });

  return sortedModules;
}

/**
 * Load module files for assembly
 * @param {string[]} modules - List of module names to load
 * @returns {object} - Module data for assembly
 */
function loadModulesForAssembly(modules) {
  const resolvedModules = resolveModules(modules);
  const moduleData = {
    modules: [],
    routes: [],
    components: [],
    sidebar: []
  };

  for (const moduleName of resolvedModules) {
    const modulePath = path.join(ADMIN_MODULES_PATH, moduleName);
    const configPath = path.join(modulePath, 'module.json');

    if (!fs.existsSync(configPath)) {
      console.warn(`Module not found: ${moduleName}`);
      continue;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Skip platform-only modules for client sites
    if (config.platformOnly) continue;

    // Load component if exists
    const componentPath = path.join(modulePath, 'components');
    let componentCode = null;
    if (fs.existsSync(componentPath)) {
      const mainComponent = config.components?.main || 'index.jsx';
      const mainPath = path.join(modulePath, mainComponent);
      if (fs.existsSync(mainPath)) {
        componentCode = fs.readFileSync(mainPath, 'utf8');
      }
    }

    // Load routes if exists
    const routesPath = path.join(modulePath, 'routes', 'index.js');
    let routeCode = null;
    if (fs.existsSync(routesPath)) {
      routeCode = fs.readFileSync(routesPath, 'utf8');
    }

    moduleData.modules.push({
      name: moduleName,
      config,
      componentCode,
      routeCode
    });

    if (config.routes) {
      moduleData.routes.push({
        prefix: config.routes.prefix,
        moduleName
      });
    }

    if (config.components?.sidebar) {
      moduleData.sidebar.push(config.components.sidebar);
    }
  }

  return moduleData;
}

/**
 * Generate admin tier selection UI data
 * @param {string} suggestedTier - The AI-suggested tier
 * @param {string[]} suggestedModules - The AI-suggested modules
 * @returns {object} - Data for tier selection UI
 */
function generateTierSelectionUI(suggestedTier, suggestedModules) {
  const { adminTiers } = loadConfigs();
  const moduleInfo = adminTiers.moduleInfo;

  const tiers = adminTiers.tierOrder.map(tierKey => {
    const tier = adminTiers.tiers[tierKey];
    return {
      key: tierKey,
      name: tier.name,
      description: tier.description,
      moduleCount: tier.moduleCount,
      modules: tier.modules.map(m => ({
        key: m,
        name: moduleInfo[m]?.name || m,
        description: moduleInfo[m]?.description || '',
        icon: moduleInfo[m]?.icon || 'Box',
        included: tier.modules.includes(m),
        suggested: suggestedModules.includes(m)
      })),
      isSuggested: tierKey === suggestedTier,
      isDefault: tier.default || false
    };
  });

  return {
    tiers,
    suggestedTier,
    suggestedModules,
    moduleInfo
  };
}

/**
 * Generate admin App.jsx based on selected modules
 * @param {string[]} modules - List of module names
 * @param {object} branding - Business branding info
 * @returns {string} - Generated App.jsx code
 */
function generateAdminAppJsx(modules, branding = {}) {
  const resolvedModules = resolveModules(modules);
  const moduleData = loadModulesForAssembly(resolvedModules);

  const imports = [];
  const routes = [];
  const sidebarItems = [];

  for (const mod of moduleData.modules) {
    const config = mod.config;
    const componentName = config.name.replace(/-/g, '').replace('admin', '') + 'Page';
    const pascalName = componentName.charAt(0).toUpperCase() + componentName.slice(1);

    // Use the main component path from module.json instead of hardcoding index.jsx
    const mainComponent = config.components?.main || 'components/index.jsx';
    imports.push(`import ${pascalName} from './modules/${config.name}/${mainComponent}';`);

    if (config.components?.sidebar) {
      const sb = config.components.sidebar;
      sidebarItems.push(`  { id: '${sb.id}', label: '${sb.label}', icon: <${sb.icon} size={20} />, component: ${pascalName} }`);
    }
  }

  const businessName = branding.businessName || 'Admin Dashboard';

  return `/**
 * Admin Dashboard - Generated for ${businessName}
 * Modules: ${resolvedModules.join(', ')}
 * Generated: ${new Date().toISOString()}
 */

import React, { useState } from 'react';
import {
  LayoutDashboard, Users, FileText, Settings, BarChart3, Calendar,
  Bell, ShoppingCart, Package, Megaphone, Mail, Search, UserCog,
  MapPin, Key, Palette, LogOut
} from 'lucide-react';

${imports.join('\n')}

const sidebarItems = [
${sidebarItems.join(',\n')}
];

export default function AdminApp() {
  const [currentPage, setCurrentPage] = useState(sidebarItems[0]?.id || 'dashboard');

  const CurrentComponent = sidebarItems.find(item => item.id === currentPage)?.component || (() => <div>Page not found</div>);

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">${businessName}</span>
        </div>
        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              className={\`nav-item \${currentPage === item.id ? 'active' : ''}\`}
              onClick={() => setCurrentPage(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button className="nav-item logout" onClick={() => localStorage.removeItem('admin_token')}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>
      <main className="admin-main">
        <CurrentComponent />
      </main>
    </div>
  );
}
`;
}

module.exports = {
  getAdminTiers,
  getModuleInfo,
  suggestAdminTier,
  getModulesForTier,
  resolveModules,
  loadModulesForAssembly,
  generateTierSelectionUI,
  generateAdminAppJsx,
  loadConfigs
};
