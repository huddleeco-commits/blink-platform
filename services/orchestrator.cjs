/**
 * Orchestrator Mode - Fourth Generation Mode for Blink
 *
 * Takes a SINGLE sentence from the user and autonomously generates
 * either a complete website OR a micro-tool/utility.
 *
 * Supports two modes:
 * - "business" — full multi-page website (default)
 * - "tool" — single-page utility/micro-tool
 *
 * @example
 * orchestrate("Create a website for Mario's Pizza in Brooklyn")
 * // Returns business website payload
 *
 * @example
 * orchestrate("Make me a tip calculator")
 * // Returns tool payload with single page
 */

// Note: @anthropic-ai/sdk is an ES module, loaded via dynamic import in async functions
const fs = require('fs');
const path = require('path');

// Import styled tool generator
const { generateStyledTool, STYLE_PRESETS } = require('../lib/generators/styled-tool-generator.cjs');

// Import tier selector for L1-L4 recommendations
const { selectTier, buildGenerationPlan } = require('../lib/orchestrators/index.cjs');

// Load industries config
const INDUSTRIES = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../prompts/industries.json'), 'utf8')
);

// Get list of valid industry keys
const VALID_INDUSTRIES = Object.keys(INDUSTRIES);

// ============================================
// TOOL DETECTION
// ============================================

// Tool keyword patterns for detection
const TOOL_KEYWORDS = {
  // Direct tool nouns
  calculator: 'calculator',
  converter: 'converter',
  generator: 'generator',
  tracker: 'tracker',
  timer: 'timer',
  counter: 'counter',
  stopwatch: 'timer',
  clock: 'timer',

  // Specific tools
  invoice: 'invoice-generator',
  receipt: 'receipt-generator',
  'qr code': 'qr-generator',
  qr: 'qr-generator',
  password: 'password-generator',
  countdown: 'countdown',
  pomodoro: 'pomodoro',
  habit: 'habit-tracker',
  expense: 'expense-tracker',
  'time tracking': 'time-tracker',
  timesheet: 'time-tracker',
  bmi: 'bmi-calculator',
  calorie: 'calorie-calculator',
  'tip splitter': 'tip-calculator',
  'tip calculator': 'tip-calculator',
  'split bill': 'tip-calculator',
  'recipe scaler': 'recipe-scaler',
  'recipe scaling': 'recipe-scaler',
  'recipe converter': 'recipe-scaler',
  'serving calculator': 'recipe-scaler',
  'ingredient scaler': 'recipe-scaler',
  mortgage: 'mortgage-calculator',
  loan: 'loan-calculator',
  compound: 'compound-calculator',
  interest: 'interest-calculator',
  'unit converter': 'unit-converter',
  temperature: 'temperature-converter',
  currency: 'currency-converter',
  'color picker': 'color-picker',
  'color palette': 'color-generator',
  'todo list': 'todo-tracker',
  'to-do': 'todo-tracker',
  checklist: 'todo-tracker',
  'word counter': 'word-counter',
  'character counter': 'word-counter',
  'grade calculator': 'grade-calculator',
  gpa: 'gpa-calculator',
  'age calculator': 'age-calculator',
  'date calculator': 'date-calculator',
  'percentage': 'percentage-calculator',
  'discount': 'discount-calculator',
  'savings': 'savings-calculator',
  'budget': 'budget-tracker',
  'water intake': 'water-tracker',
  'sleep': 'sleep-tracker',
  'workout': 'workout-tracker',
  'reading': 'reading-tracker',
  'mood': 'mood-tracker'
};

// Patterns that indicate tool intent
const TOOL_PATTERNS = [
  /^(make|build|create|generate)\s+(me\s+)?a\s+/i,
  /\b(calculator|converter|generator|tracker|timer|counter)\b/i,
  /\b(invoice|receipt|qr\s*code|password|countdown|pomodoro)\b/i,
  /\b(habit|expense|time\s*track|bmi|calorie|tip\s*(splitter|calculator))\b/i,
  /\b(split\s*bill|mortgage|loan|compound|interest)\b/i,
  /\b(todo|to-do|checklist|word\s*count|grade|gpa)\b/i,
  /\b(simple|quick|basic)\s+(tool|utility|app|page)\b/i
];

// Tool categories
const TOOL_CATEGORIES = {
  calculator: ['tip-calculator', 'bmi-calculator', 'calorie-calculator', 'mortgage-calculator',
               'loan-calculator', 'compound-calculator', 'interest-calculator', 'percentage-calculator',
               'discount-calculator', 'savings-calculator', 'grade-calculator', 'gpa-calculator',
               'age-calculator', 'date-calculator'],
  generator: ['invoice-generator', 'receipt-generator', 'qr-generator', 'password-generator', 'color-generator'],
  converter: ['unit-converter', 'temperature-converter', 'currency-converter'],
  tracker: ['habit-tracker', 'expense-tracker', 'time-tracker', 'todo-tracker', 'budget-tracker',
            'water-tracker', 'sleep-tracker', 'workout-tracker', 'reading-tracker', 'mood-tracker'],
  timer: ['countdown', 'pomodoro', 'timer', 'stopwatch'],
  utility: ['color-picker', 'word-counter']
};

// ============================================
// MODULE-TOOL MAPPING
// Maps tool types to relevant backend modules from the module library
// ============================================
const MODULE_TOOL_MAPPING = {
  // Generators that benefit from backend modules
  'invoice-generator': ['user-balance', 'pdf'],
  'receipt-generator': ['user-balance', 'pdf'],

  // Trackers that need data persistence and gamification
  'habit-tracker': ['streaks', 'achievements', 'auth'],
  'expense-tracker': ['user-balance', 'auth'],
  'budget-tracker': ['user-balance', 'auth'],
  'time-tracker': ['streaks', 'auth'],
  'todo-tracker': ['achievements', 'auth'],
  'water-tracker': ['streaks', 'achievements'],
  'sleep-tracker': ['streaks', 'achievements'],
  'workout-tracker': ['streaks', 'achievements'],
  'reading-tracker': ['streaks', 'achievements'],
  'mood-tracker': ['streaks', 'achievements'],

  // Booking/scheduling tools
  'booking-tool': ['booking', 'notifications', 'auth'],
  'appointment-scheduler': ['booking', 'notifications', 'auth'],

  // Pure frontend tools (no modules needed)
  'calculator': [],
  'tip-calculator': [],
  'recipe-scaler': [],
  'bmi-calculator': [],
  'calorie-calculator': [],
  'mortgage-calculator': [],
  'loan-calculator': [],
  'compound-calculator': [],
  'interest-calculator': [],
  'percentage-calculator': [],
  'discount-calculator': [],
  'savings-calculator': [],
  'grade-calculator': [],
  'gpa-calculator': [],
  'age-calculator': [],
  'date-calculator': [],
  'countdown': [],
  'pomodoro': [],
  'timer': [],
  'stopwatch': [],
  'qr-generator': [],
  'password-generator': [],
  'color-generator': [],
  'color-picker': [],
  'unit-converter': [],
  'temperature-converter': [],
  'currency-converter': [],
  'word-counter': []
};

/**
 * Get detailed module information for a tool type
 * @param {string} toolKey - The tool type key
 * @returns {Object} - Module details including names, features, and patterns
 */
function getModulesForTool(toolKey) {
  const moduleNames = MODULE_TOOL_MAPPING[toolKey] || [];
  if (moduleNames.length === 0) {
    return { modules: [], hasBackend: false, patterns: [] };
  }

  const modulesDir = path.join(__dirname, '../../backend');
  const moduleDetails = [];
  const patterns = [];

  for (const moduleName of moduleNames) {
    const moduleDir = path.join(modulesDir, moduleName);
    if (!fs.existsSync(moduleDir)) continue;

    // Try to read module.json
    const moduleJsonPath = path.join(moduleDir, 'module.json');
    let moduleInfo = { name: moduleName, features: [], endpoints: [], description: '' };

    if (fs.existsSync(moduleJsonPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
        moduleInfo = {
          name: data.name || moduleName,
          description: data.description || '',
          features: data.features || [],
          endpoints: data.endpoints || []
        };
      } catch (e) {
        // Use defaults
      }
    }

    // Try to extract code patterns from the module
    const routesDir = path.join(moduleDir, 'routes');
    const dbFile = path.join(moduleDir, 'database', 'db.js');
    const dbFileCjs = path.join(moduleDir, 'database', 'db.cjs');

    // Read route patterns
    if (fs.existsSync(routesDir)) {
      try {
        const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js') || f.endsWith('.cjs'));
        for (const routeFile of routeFiles.slice(0, 2)) { // Limit to first 2 route files
          const routePath = path.join(routesDir, routeFile);
          const routeContent = fs.readFileSync(routePath, 'utf8');
          // Extract route definitions
          const routeMatches = routeContent.match(/router\.(get|post|put|delete)\s*\(['"]([^'"]+)['"]/gi) || [];
          patterns.push({
            module: moduleName,
            type: 'routes',
            patterns: routeMatches.slice(0, 10).map(m => m.replace(/router\./i, ''))
          });
        }
      } catch (e) {
        // Skip if can't read
      }
    }

    // Read DB function patterns
    const dbPath = fs.existsSync(dbFileCjs) ? dbFileCjs : (fs.existsSync(dbFile) ? dbFile : null);
    if (dbPath) {
      try {
        const dbContent = fs.readFileSync(dbPath, 'utf8');
        // Extract exported function names
        const funcMatches = dbContent.match(/(?:async\s+)?function\s+(\w+)|(\w+)\s*:\s*async/g) || [];
        const funcNames = funcMatches.map(m => m.replace(/async\s+function\s+|:\s*async/g, '').trim());
        patterns.push({
          module: moduleName,
          type: 'database',
          functions: funcNames.slice(0, 15) // Limit to first 15 functions
        });
      } catch (e) {
        // Skip if can't read
      }
    }

    moduleDetails.push(moduleInfo);
  }

  return {
    modules: moduleDetails,
    hasBackend: moduleDetails.length > 0,
    patterns: patterns,
    moduleNames: moduleNames
  };
}

// Tool templates with features and fields
const TOOL_TEMPLATES = {
  'invoice-generator': {
    name: 'Invoice Generator',
    icon: '📄',
    category: 'generator',
    description: 'Create professional invoices',
    features: ['client-info', 'line-items', 'tax-calculation', 'total', 'pdf-export', 'print'],
    fields: [
      { name: 'businessName', type: 'text', label: 'Your Business Name' },
      { name: 'clientName', type: 'text', label: 'Client Name' },
      { name: 'clientEmail', type: 'email', label: 'Client Email' },
      { name: 'invoiceNumber', type: 'text', label: 'Invoice #', auto: true },
      { name: 'invoiceDate', type: 'date', label: 'Invoice Date' },
      { name: 'dueDate', type: 'date', label: 'Due Date' },
      { name: 'items', type: 'line-items', label: 'Items' },
      { name: 'taxRate', type: 'number', label: 'Tax Rate (%)', default: 0 },
      { name: 'notes', type: 'textarea', label: 'Notes' }
    ],
    colors: { primary: '#2563eb', accent: '#3b82f6', background: '#f8fafc' }
  },

  'receipt-generator': {
    name: 'Receipt Generator',
    icon: '🧾',
    category: 'generator',
    description: 'Generate simple receipts',
    features: ['business-info', 'items', 'total', 'print'],
    fields: [
      { name: 'businessName', type: 'text', label: 'Business Name' },
      { name: 'receiptNumber', type: 'text', label: 'Receipt #', auto: true },
      { name: 'date', type: 'date', label: 'Date' },
      { name: 'items', type: 'line-items', label: 'Items' },
      { name: 'paymentMethod', type: 'select', label: 'Payment Method', options: ['Cash', 'Card', 'Check'] }
    ],
    colors: { primary: '#059669', accent: '#10b981', background: '#f0fdf4' }
  },

  'qr-generator': {
    name: 'QR Code Generator',
    icon: '📱',
    category: 'generator',
    description: 'Generate QR codes for URLs, text, or contact info',
    features: ['text-input', 'qr-display', 'download-png', 'download-svg', 'size-options'],
    fields: [
      { name: 'content', type: 'textarea', label: 'Content (URL, text, or contact info)' },
      { name: 'size', type: 'select', label: 'Size', options: ['128x128', '256x256', '512x512'], default: '256x256' },
      { name: 'foreground', type: 'color', label: 'Foreground Color', default: '#000000' },
      { name: 'background', type: 'color', label: 'Background Color', default: '#ffffff' }
    ],
    colors: { primary: '#7c3aed', accent: '#8b5cf6', background: '#faf5ff' }
  },

  'password-generator': {
    name: 'Password Generator',
    icon: '🔐',
    category: 'generator',
    description: 'Generate secure passwords',
    features: ['length-slider', 'character-options', 'strength-meter', 'copy-button', 'history'],
    fields: [
      { name: 'length', type: 'range', label: 'Length', min: 8, max: 64, default: 16 },
      { name: 'uppercase', type: 'checkbox', label: 'Uppercase (A-Z)', default: true },
      { name: 'lowercase', type: 'checkbox', label: 'Lowercase (a-z)', default: true },
      { name: 'numbers', type: 'checkbox', label: 'Numbers (0-9)', default: true },
      { name: 'symbols', type: 'checkbox', label: 'Symbols (!@#$)', default: true },
      { name: 'excludeSimilar', type: 'checkbox', label: 'Exclude similar (l, 1, I, O, 0)', default: false }
    ],
    colors: { primary: '#dc2626', accent: '#ef4444', background: '#fef2f2' }
  },

  'tip-calculator': {
    name: 'Tip Calculator',
    icon: '💰',
    category: 'calculator',
    description: 'Calculate tips and split bills',
    features: ['bill-input', 'tip-percentage', 'split-count', 'per-person', 'quick-tips'],
    fields: [
      { name: 'billAmount', type: 'number', label: 'Bill Amount ($)', step: 0.01 },
      { name: 'tipPercent', type: 'range', label: 'Tip %', min: 0, max: 30, default: 18 },
      { name: 'splitCount', type: 'number', label: 'Split Between', min: 1, default: 1 }
    ],
    quickTips: [15, 18, 20, 25],
    colors: { primary: '#059669', accent: '#10b981', background: '#f0fdf4' }
  },

  'recipe-scaler': {
    name: 'Recipe Scaler',
    icon: '🍳',
    category: 'calculator',
    description: 'Scale recipes up or down to any serving size',
    features: ['ingredient-list', 'serving-size', 'fraction-display', 'scale-buttons', 'custom-scale'],
    fields: [
      { name: 'originalServings', type: 'number', label: 'Original Servings', default: 4 },
      { name: 'ingredients', type: 'line-items', label: 'Ingredients' },
      { name: 'targetServings', type: 'number', label: 'Target Servings' }
    ],
    colors: { primary: '#f59e0b', accent: '#fbbf24', background: '#fffbeb' }
  },

  'bmi-calculator': {
    name: 'BMI Calculator',
    icon: '⚖️',
    category: 'calculator',
    description: 'Calculate Body Mass Index',
    features: ['unit-toggle', 'height-input', 'weight-input', 'bmi-result', 'category-display', 'chart'],
    fields: [
      { name: 'unit', type: 'toggle', label: 'Units', options: ['Imperial', 'Metric'], default: 'Imperial' },
      { name: 'height', type: 'height', label: 'Height' },
      { name: 'weight', type: 'number', label: 'Weight' }
    ],
    colors: { primary: '#0891b2', accent: '#06b6d4', background: '#ecfeff' }
  },

  'calorie-calculator': {
    name: 'Calorie Calculator',
    icon: '🔥',
    category: 'calculator',
    description: 'Calculate daily calorie needs',
    features: ['personal-info', 'activity-level', 'goal-selection', 'macros-breakdown'],
    fields: [
      { name: 'age', type: 'number', label: 'Age', min: 15, max: 100 },
      { name: 'gender', type: 'select', label: 'Gender', options: ['Male', 'Female'] },
      { name: 'height', type: 'height', label: 'Height' },
      { name: 'weight', type: 'number', label: 'Weight' },
      { name: 'activity', type: 'select', label: 'Activity Level',
        options: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extra Active'] },
      { name: 'goal', type: 'select', label: 'Goal', options: ['Lose Weight', 'Maintain', 'Gain Weight'] }
    ],
    colors: { primary: '#ea580c', accent: '#f97316', background: '#fff7ed' }
  },

  'countdown': {
    name: 'Countdown Timer',
    icon: '⏰',
    category: 'timer',
    description: 'Countdown to a specific date/time',
    features: ['date-picker', 'live-countdown', 'days-hours-mins-secs', 'event-name', 'share'],
    fields: [
      { name: 'eventName', type: 'text', label: 'Event Name' },
      { name: 'targetDate', type: 'datetime-local', label: 'Target Date & Time' },
      { name: 'showSeconds', type: 'checkbox', label: 'Show Seconds', default: true }
    ],
    colors: { primary: '#7c3aed', accent: '#8b5cf6', background: '#faf5ff' }
  },

  'pomodoro': {
    name: 'Pomodoro Timer',
    icon: '🍅',
    category: 'timer',
    description: 'Productivity timer with work/break cycles',
    features: ['work-timer', 'break-timer', 'session-counter', 'sound-alerts', 'settings'],
    fields: [
      { name: 'workDuration', type: 'number', label: 'Work Duration (min)', default: 25 },
      { name: 'shortBreak', type: 'number', label: 'Short Break (min)', default: 5 },
      { name: 'longBreak', type: 'number', label: 'Long Break (min)', default: 15 },
      { name: 'sessionsUntilLong', type: 'number', label: 'Sessions Until Long Break', default: 4 },
      { name: 'autoStart', type: 'checkbox', label: 'Auto-start Breaks', default: false },
      { name: 'soundEnabled', type: 'checkbox', label: 'Sound Alerts', default: true }
    ],
    colors: { primary: '#dc2626', accent: '#ef4444', background: '#fef2f2' }
  },

  'habit-tracker': {
    name: 'Habit Tracker',
    icon: '✅',
    category: 'tracker',
    description: 'Track daily habits and streaks',
    features: ['habit-list', 'daily-check', 'streak-display', 'calendar-view', 'stats'],
    fields: [
      { name: 'habits', type: 'habit-list', label: 'Your Habits' }
    ],
    colors: { primary: '#059669', accent: '#10b981', background: '#f0fdf4' }
  },

  'expense-tracker': {
    name: 'Expense Tracker',
    icon: '💳',
    category: 'tracker',
    description: 'Track income and expenses',
    features: ['transaction-list', 'categories', 'balance', 'charts', 'export'],
    fields: [
      { name: 'description', type: 'text', label: 'Description' },
      { name: 'amount', type: 'number', label: 'Amount', step: 0.01 },
      { name: 'type', type: 'select', label: 'Type', options: ['Income', 'Expense'] },
      { name: 'category', type: 'select', label: 'Category',
        options: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'] },
      { name: 'date', type: 'date', label: 'Date' }
    ],
    colors: { primary: '#2563eb', accent: '#3b82f6', background: '#eff6ff' }
  },

  'time-tracker': {
    name: 'Time Tracker',
    icon: '⏱️',
    category: 'tracker',
    description: 'Track time spent on tasks',
    features: ['task-input', 'timer', 'history', 'daily-total', 'export'],
    fields: [
      { name: 'taskName', type: 'text', label: 'Task Name' },
      { name: 'project', type: 'text', label: 'Project (optional)' }
    ],
    colors: { primary: '#0891b2', accent: '#06b6d4', background: '#ecfeff' }
  },

  'todo-tracker': {
    name: 'Todo List',
    icon: '📝',
    category: 'tracker',
    description: 'Simple todo list with priorities',
    features: ['add-task', 'complete-toggle', 'priority', 'due-date', 'filter', 'clear-completed'],
    fields: [
      { name: 'task', type: 'text', label: 'Task' },
      { name: 'priority', type: 'select', label: 'Priority', options: ['Low', 'Medium', 'High'] },
      { name: 'dueDate', type: 'date', label: 'Due Date (optional)' }
    ],
    colors: { primary: '#7c3aed', accent: '#8b5cf6', background: '#faf5ff' }
  },

  'mortgage-calculator': {
    name: 'Mortgage Calculator',
    icon: '🏠',
    category: 'calculator',
    description: 'Calculate monthly mortgage payments',
    features: ['loan-amount', 'interest-rate', 'term', 'payment-breakdown', 'amortization'],
    fields: [
      { name: 'loanAmount', type: 'number', label: 'Loan Amount ($)' },
      { name: 'interestRate', type: 'number', label: 'Interest Rate (%)', step: 0.1 },
      { name: 'loanTerm', type: 'select', label: 'Loan Term', options: ['15 years', '20 years', '30 years'] },
      { name: 'downPayment', type: 'number', label: 'Down Payment ($)', default: 0 },
      { name: 'propertyTax', type: 'number', label: 'Annual Property Tax ($)', default: 0 },
      { name: 'insurance', type: 'number', label: 'Annual Insurance ($)', default: 0 }
    ],
    colors: { primary: '#0d9488', accent: '#14b8a6', background: '#f0fdfa' }
  },

  'unit-converter': {
    name: 'Unit Converter',
    icon: '🔄',
    category: 'converter',
    description: 'Convert between different units',
    features: ['category-select', 'from-unit', 'to-unit', 'swap', 'common-conversions'],
    fields: [
      { name: 'category', type: 'select', label: 'Category',
        options: ['Length', 'Weight', 'Temperature', 'Volume', 'Area', 'Speed', 'Time'] },
      { name: 'value', type: 'number', label: 'Value' },
      { name: 'fromUnit', type: 'select', label: 'From' },
      { name: 'toUnit', type: 'select', label: 'To' }
    ],
    colors: { primary: '#6366f1', accent: '#818cf8', background: '#eef2ff' }
  },

  'currency-converter': {
    name: 'Currency Converter',
    icon: '💱',
    category: 'converter',
    description: 'Convert between currencies',
    features: ['amount-input', 'currency-select', 'live-rates', 'swap', 'popular-pairs'],
    fields: [
      { name: 'amount', type: 'number', label: 'Amount' },
      { name: 'fromCurrency', type: 'select', label: 'From' },
      { name: 'toCurrency', type: 'select', label: 'To' }
    ],
    colors: { primary: '#059669', accent: '#10b981', background: '#f0fdf4' }
  },

  'word-counter': {
    name: 'Word Counter',
    icon: '📊',
    category: 'utility',
    description: 'Count words, characters, and more',
    features: ['text-input', 'word-count', 'character-count', 'sentence-count', 'reading-time'],
    fields: [
      { name: 'text', type: 'textarea', label: 'Enter your text' }
    ],
    colors: { primary: '#2563eb', accent: '#3b82f6', background: '#eff6ff' }
  },

  'color-picker': {
    name: 'Color Picker',
    icon: '🎨',
    category: 'utility',
    description: 'Pick colors and get codes',
    features: ['color-wheel', 'hex-code', 'rgb-code', 'hsl-code', 'copy-button', 'palette'],
    fields: [
      { name: 'color', type: 'color', label: 'Pick a Color' }
    ],
    colors: { primary: '#ec4899', accent: '#f472b6', background: '#fdf2f8' }
  },

  'percentage-calculator': {
    name: 'Percentage Calculator',
    icon: '%',
    category: 'calculator',
    description: 'Calculate percentages easily',
    features: ['what-is-x-of-y', 'x-is-what-percent-of-y', 'percent-change'],
    fields: [
      { name: 'calculationType', type: 'select', label: 'Calculate',
        options: ['What is X% of Y?', 'X is what % of Y?', '% change from X to Y'] },
      { name: 'value1', type: 'number', label: 'Value 1' },
      { name: 'value2', type: 'number', label: 'Value 2' }
    ],
    colors: { primary: '#7c3aed', accent: '#8b5cf6', background: '#faf5ff' }
  },

  'budget-tracker': {
    name: 'Budget Tracker',
    icon: '📈',
    category: 'tracker',
    description: 'Track your monthly budget',
    features: ['income', 'expense-categories', 'progress-bars', 'remaining', 'alerts'],
    fields: [
      { name: 'monthlyIncome', type: 'number', label: 'Monthly Income ($)' },
      { name: 'categories', type: 'budget-categories', label: 'Budget Categories' }
    ],
    colors: { primary: '#059669', accent: '#10b981', background: '#f0fdf4' }
  },

  'calculator': {
    name: 'Calculator',
    icon: '🧮',
    category: 'calculator',
    description: 'Simple calculator for basic math operations',
    features: ['number-input', 'basic-operations', 'clear', 'equals', 'decimal', 'memory'],
    fields: [
      { name: 'display', type: 'display', label: 'Display' },
      { name: 'operation', type: 'buttons', label: 'Operations', options: ['+', '-', '×', '÷', '=', 'C'] }
    ],
    colors: { primary: '#6366f1', accent: '#818cf8', background: '#eef2ff' }
  }
};

// Default/generic tool template
const DEFAULT_TOOL_TEMPLATE = {
  name: 'Custom Tool',
  icon: '🛠️',
  category: 'utility',
  description: 'A simple utility tool',
  features: ['main-input', 'calculate', 'result-display'],
  fields: [
    { name: 'input', type: 'text', label: 'Input' }
  ],
  colors: { primary: '#6366f1', accent: '#818cf8', background: '#eef2ff' }
};

// ============================================
// BUSINESS WEBSITE CONFIGURATION
// ============================================

// Load available backend modules
function getAvailableModules() {
  const modulesDir = path.join(__dirname, '../../backend');
  const modules = [];

  try {
    const dirs = fs.readdirSync(modulesDir, { withFileTypes: true });

    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const moduleJsonPath = path.join(modulesDir, dir.name, 'module.json');
        if (fs.existsSync(moduleJsonPath)) {
          try {
            const moduleData = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
            modules.push({
              name: moduleData.name || dir.name,
              description: moduleData.description || '',
              features: moduleData.features || [],
              endpoints: moduleData.endpoints || []
            });
          } catch (err) {
            // Skip malformed module.json files
          }
        }
      }
    }
  } catch (err) {
    console.error('[orchestrator] Error loading modules:', err.message);
  }

  return modules;
}

// Industry keyword mapping for faster inference
const INDUSTRY_KEYWORDS = {
  // Food & Beverage
  'pizza': 'pizza',
  'pizzeria': 'pizza',
  'restaurant': 'restaurant',
  'cafe': 'cafe',
  'coffee': 'cafe',
  'bar': 'bar',
  'lounge': 'bar',
  'nightclub': 'bar',
  'bakery': 'bakery',
  'pastry': 'bakery',

  // Professional Services
  'law': 'law-firm',
  'attorney': 'law-firm',
  'lawyer': 'law-firm',
  'legal': 'law-firm',
  'accounting': 'accounting',
  'cpa': 'accounting',
  'tax': 'accounting',
  'consulting': 'consulting',
  'consultant': 'consulting',
  'real estate': 'real-estate',
  'realtor': 'real-estate',
  'insurance': 'insurance',

  // Healthcare
  'healthcare': 'healthcare',
  'medical': 'healthcare',
  'doctor': 'healthcare',
  'clinic': 'healthcare',
  'dental': 'dental',
  'dentist': 'dental',
  'chiropractic': 'chiropractic',
  'chiropractor': 'chiropractic',
  'spa': 'spa-salon',
  'salon': 'spa-salon',
  'massage': 'spa-salon',

  // Fitness & Wellness
  'gym': 'fitness',
  'fitness': 'fitness',
  'crossfit': 'fitness',
  'yoga': 'yoga',
  'pilates': 'yoga',

  // Technology
  'saas': 'saas',
  'software': 'saas',
  'app': 'saas',
  'startup': 'startup',
  'tech': 'startup',
  'agency': 'agency',
  'marketing': 'agency',
  'digital': 'agency',

  // Retail
  'ecommerce': 'ecommerce',
  'store': 'ecommerce',
  'shop': 'ecommerce',
  'subscription': 'subscription-box',

  // Creative
  'photography': 'photography',
  'photographer': 'photography',
  'wedding': 'wedding',
  'event planner': 'wedding',
  'portfolio': 'portfolio',
  'designer': 'portfolio',

  // Organizations
  'nonprofit': 'nonprofit',
  'charity': 'nonprofit',
  'church': 'church',
  'school': 'school',
  'education': 'school',
  'course': 'online-course',

  // Trade Services
  'construction': 'construction',
  'contractor': 'construction',
  'plumber': 'plumber',
  'plumbing': 'plumber',
  'hvac': 'plumber',
  'electrician': 'electrician',
  'electrical': 'electrician',
  'landscaping': 'landscaping',
  'lawn': 'landscaping',
  'cleaning': 'cleaning',
  'maid': 'cleaning',
  'auto': 'auto-repair',
  'mechanic': 'auto-repair',
  'car repair': 'auto-repair',

  // Other
  'pet': 'pet-services',
  'grooming': 'pet-services',
  'vet': 'pet-services',
  'moving': 'moving',
  'movers': 'moving',
  'event venue': 'event-venue',
  'banquet': 'event-venue',
  'hotel': 'hotel',
  'hospitality': 'hotel',
  'travel': 'travel',
  'tour': 'travel',
  'musician': 'musician',
  'band': 'musician',
  'podcast': 'podcast',
  'gaming': 'gaming',
  'esports': 'gaming',
  'finance': 'finance',
  'investment': 'finance'
};

// Page recommendations by industry category
const PAGE_RECOMMENDATIONS = {
  'food-beverage': ['home', 'menu', 'about', 'gallery', 'contact', 'order', 'reservations'],
  'professional-services': ['home', 'services', 'about', 'team', 'testimonials', 'contact', 'faq'],
  'healthcare': ['home', 'services', 'providers', 'patient-info', 'appointments', 'contact', 'testimonials'],
  'fitness': ['home', 'classes', 'membership', 'trainers', 'schedule', 'contact', 'gallery'],
  'technology': ['home', 'features', 'pricing', 'about', 'blog', 'contact', 'demo'],
  'retail': ['home', 'products', 'categories', 'about', 'contact', 'faq', 'shipping'],
  'creative': ['home', 'portfolio', 'services', 'about', 'pricing', 'contact'],
  'trade-services': ['home', 'services', 'projects', 'about', 'testimonials', 'contact', 'quote'],
  'default': ['home', 'about', 'services', 'contact', 'testimonials', 'faq']
};

// Module recommendations by industry
const MODULE_RECOMMENDATIONS = {
  'restaurant': ['auth', 'booking', 'payments', 'notifications'],
  'pizza': ['auth', 'booking', 'payments', 'notifications'],
  'cafe': ['auth', 'payments', 'notifications'],
  'bar': ['auth', 'booking', 'payments', 'notifications'],
  'healthcare': ['auth', 'booking', 'notifications', 'documents'],
  'dental': ['auth', 'booking', 'notifications', 'documents'],
  'fitness': ['auth', 'booking', 'payments', 'notifications', 'calendar'],
  'yoga': ['auth', 'booking', 'payments', 'calendar'],
  'spa-salon': ['auth', 'booking', 'payments', 'notifications'],
  'law-firm': ['auth', 'booking', 'documents', 'notifications'],
  'consulting': ['auth', 'booking', 'documents', 'notifications'],
  'real-estate': ['auth', 'booking', 'documents', 'notifications'],
  'ecommerce': ['auth', 'payments', 'inventory', 'notifications', 'stripe-payments'],
  'saas': ['auth', 'payments', 'stripe-payments', 'analytics', 'notifications'],
  'startup': ['auth', 'analytics', 'notifications'],
  'photography': ['auth', 'booking', 'payments', 'file-upload'],
  'wedding': ['auth', 'booking', 'documents', 'payments'],
  'construction': ['auth', 'booking', 'documents', 'file-upload'],
  'default': ['auth', 'notifications']
};

// ============================================
// DETECTION FUNCTIONS
// ============================================

// Patterns that explicitly indicate user wants a WEBSITE
const EXPLICIT_WEBSITE_PATTERNS = [
  /\b(create|build|make|generate|design|develop)\s+(a\s+)?(website|site|web\s*site|webpage)/i,
  /\b(website|site)\s+(for|about)/i,
  /\bneed\s+(a\s+)?(website|site)/i,
  /\bwant\s+(a\s+)?(website|site)/i,
  /\bget\s+(a\s+)?(website|site)/i,
  /\blaunch\s+(a\s+)?(website|site)/i,
  /\bwith\s+(pages|multiple\s*pages|admin|dashboard|backend)/i,
  /\bfull\s+(website|site)/i
];

// Patterns that explicitly indicate user wants TOOL RECOMMENDATIONS
const EXPLICIT_TOOLS_PATTERNS = [
  /\b(what|which|suggest|recommend)\s+tools/i,
  /\btools\s+(for|that)/i,
  /\bget\s+(me\s+)?tools/i,
  /\bneed\s+tools/i,
  /\bbusiness\s+tools/i,
  /\butilities\s+for/i
];

/**
 * Detect if the input is requesting a tool vs a business website
 * Now also detects ambiguous inputs that could be either
 * @param {string} input - User input
 * @returns {{ type: 'tool' | 'business' | 'ambiguous' | 'recommendations', toolKey: string | null, confidence: string, detectedIndustry: string | null }}
 */
function detectIntentType(input) {
  const lowerInput = input.toLowerCase();

  // Check for explicit tool recommendation requests first
  for (const pattern of EXPLICIT_TOOLS_PATTERNS) {
    if (pattern.test(lowerInput)) {
      const detectedIndustry = detectIndustryFromInput(lowerInput);
      console.log(`[orchestrator] Tool recommendations requested for: ${detectedIndustry || 'general'}`);
      return { type: 'recommendations', toolKey: null, confidence: 'high', detectedIndustry };
    }
  }

  // Check for explicit tool patterns (specific tool requested)
  for (const pattern of TOOL_PATTERNS) {
    if (pattern.test(lowerInput)) {
      // Found a tool pattern, now identify which tool
      for (const [keyword, toolKey] of Object.entries(TOOL_KEYWORDS)) {
        if (lowerInput.includes(keyword)) {
          console.log(`[orchestrator] Tool detected: "${toolKey}" (keyword: "${keyword}")`);
          return { type: 'tool', toolKey, confidence: 'high', detectedIndustry: null };
        }
      }
      // Pattern matched but no specific tool - infer from context
      return { type: 'tool', toolKey: null, confidence: 'medium', detectedIndustry: null };
    }
  }

  // Check for direct tool keywords without patterns
  for (const [keyword, toolKey] of Object.entries(TOOL_KEYWORDS)) {
    if (lowerInput.includes(keyword)) {
      // Make sure it's not a business context
      const businessIndicators = ['website', 'business', 'company', 'store', 'shop', 'restaurant', 'firm', 'practice'];
      const hasBusinessIndicator = businessIndicators.some(ind => lowerInput.includes(ind));

      if (!hasBusinessIndicator) {
        console.log(`[orchestrator] Tool detected: "${toolKey}" (keyword match)`);
        return { type: 'tool', toolKey, confidence: 'medium', detectedIndustry: null };
      }
    }
  }

  // Check for explicit website request
  for (const pattern of EXPLICIT_WEBSITE_PATTERNS) {
    if (pattern.test(lowerInput)) {
      console.log(`[orchestrator] Explicit website request detected`);
      return { type: 'business', toolKey: null, confidence: 'high', detectedIndustry: null };
    }
  }

  // Check if we can detect an industry - if so, this might be ambiguous
  const detectedIndustry = detectIndustryFromInput(lowerInput);

  if (detectedIndustry) {
    // Industry detected but no explicit intent - this is ambiguous
    // User said something like "I'm starting a bakery" or "I'm a freelancer"
    console.log(`[orchestrator] Ambiguous input - industry "${detectedIndustry}" detected but no clear intent`);
    return { type: 'ambiguous', toolKey: null, confidence: 'medium', detectedIndustry };
  }

  // Default to business website for anything else
  return { type: 'business', toolKey: null, confidence: 'high', detectedIndustry: null };
}

/**
 * Detect industry from input text
 */
function detectIndustryFromInput(input) {
  const lowerInput = input.toLowerCase();

  // Check INDUSTRY_KEYWORDS first (more specific)
  for (const [keyword, industry] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (lowerInput.includes(keyword)) {
      return industry;
    }
  }

  // Check RECOMMENDATION_INDUSTRIES for profession/role matches
  for (const [keyword, industry] of Object.entries(RECOMMENDATION_INDUSTRIES)) {
    if (lowerInput.includes(keyword)) {
      return industry;
    }
  }

  return null;
}

/**
 * Get tool category from tool key
 */
function getToolCategory(toolKey) {
  for (const [category, tools] of Object.entries(TOOL_CATEGORIES)) {
    if (tools.includes(toolKey)) {
      return category;
    }
  }
  return 'utility';
}

/**
 * Extract business name from input
 */
function extractBusinessName(input) {
  const quotedMatch = input.match(/["']([^"']+)["']/);
  if (quotedMatch) {
    return quotedMatch[1].trim();
  }

  const forMatch = input.match(/for\s+([A-Z][a-zA-Z']+(?:\s+[A-Z][a-zA-Z']+)*)/);
  if (forMatch) {
    return forMatch[1].trim();
  }

  const calledMatch = input.match(/called\s+([A-Z][a-zA-Z']+(?:\s+[A-Z][a-zA-Z']+)*)/);
  if (calledMatch) {
    return calledMatch[1].trim();
  }

  return null;
}

/**
 * Extract tool name from input
 */
function extractToolName(input) {
  // Try to extract a custom name
  const quotedMatch = input.match(/["']([^"']+)["']/);
  if (quotedMatch) {
    return quotedMatch[1].trim();
  }

  const calledMatch = input.match(/called\s+([A-Za-z\s]+?)(?:\s+that|\s+with|\s+for|$)/i);
  if (calledMatch) {
    return calledMatch[1].trim();
  }

  return null;
}

/**
 * Quick industry detection from keywords
 */
function detectIndustryFromKeywords(input) {
  const lowerInput = input.toLowerCase();

  for (const [keyword, industry] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (lowerInput.includes(keyword)) {
      return industry;
    }
  }

  return null;
}

/**
 * Get industry category for page/module recommendations
 */
function getIndustryCategory(industry) {
  const categories = {
    'food-beverage': ['pizza', 'restaurant', 'cafe', 'bar', 'bakery'],
    'professional-services': ['law-firm', 'accounting', 'consulting', 'real-estate', 'insurance'],
    'healthcare': ['healthcare', 'dental', 'chiropractic', 'spa-salon'],
    'fitness': ['fitness', 'yoga'],
    'technology': ['saas', 'startup', 'agency'],
    'retail': ['ecommerce', 'subscription-box'],
    'creative': ['photography', 'wedding', 'portfolio', 'musician', 'podcast'],
    'trade-services': ['construction', 'plumber', 'electrician', 'landscaping', 'cleaning', 'auto-repair', 'moving']
  };

  for (const [category, industries] of Object.entries(categories)) {
    if (industries.includes(industry)) {
      return category;
    }
  }

  return 'default';
}

// ============================================
// ORCHESTRATION FUNCTIONS
// ============================================

/**
 * Orchestrate a tool creation
 */
async function orchestrateTool(input, toolKey) {
  console.log(`[orchestrator] Building tool: ${toolKey || 'custom'}`);

  const template = TOOL_TEMPLATES[toolKey] || DEFAULT_TOOL_TEMPLATE;
  const customName = extractToolName(input);
  const toolCategory = getToolCategory(toolKey || 'utility');

  // Get relevant modules from the module library
  const moduleInfo = getModulesForTool(toolKey);
  const moduleNamesStr = (moduleInfo.moduleNames && moduleInfo.moduleNames.length > 0)
    ? moduleInfo.moduleNames.join(', ')
    : 'none (pure frontend)';
  console.log(`[orchestrator] Available modules for ${toolKey}: ${moduleNamesStr}`);

  // Build module context for AI prompt
  let moduleContext = '';
  if (moduleInfo.hasBackend && moduleInfo.modules && moduleInfo.modules.length > 0) {
    moduleContext = `\n\nAVAILABLE BACKEND MODULES FROM MODULE LIBRARY:
${moduleInfo.modules.map(m => `- ${m.name}: ${m.description}
  Features: ${(m.features && Array.isArray(m.features)) ? m.features.join(', ') : 'general'}
  Endpoints: ${(m.endpoints && Array.isArray(m.endpoints)) ? m.endpoints.join(', ') : 'standard CRUD'}`).join('\n')}

CODE PATTERNS YOU CAN LEVERAGE:
${(moduleInfo.patterns || []).map(p => {
  if (p.type === 'routes' && p.patterns && Array.isArray(p.patterns)) {
    return `- ${p.module} routes: ${p.patterns.slice(0, 5).join(', ')}`;
  } else if (p.type === 'database' && p.functions && Array.isArray(p.functions)) {
    return `- ${p.module} db functions: ${p.functions.slice(0, 8).join(', ')}`;
  }
  return '';
}).filter(Boolean).join('\n')}

When designing this tool, consider how to integrate these modules for:
- Data persistence (if using auth or user modules)
- Gamification (if using streaks or achievements)
- Transactions (if using user-balance)`;
  }

  // If we have Claude API, use it to enhance the tool config
  let aiEnhanced = null;
  if (process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY) {
    try {
      // Dynamic import for ES module compatibility
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({
        apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
      });

      const systemPrompt = `You are a micro-tool designer with access to a module library. Given a user request for a tool, enhance the configuration.
${moduleContext}

Return ONLY valid JSON with these fields:
{
  "name": "Tool display name",
  "tagline": "Short catchy description",
  "features": ["list of key features"],
  "customFields": [optional extra fields if needed],
  "colorScheme": "warm|cool|neutral|vibrant",
  "moduleIntegration": ${moduleInfo.hasBackend ? '["which modules to integrate and why"]' : 'null (pure frontend tool)'},
  "backendSuggestions": ${moduleInfo.hasBackend ? '["API endpoints or DB functions to use"]' : 'null'}
}`;

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `User request: "${input}"\nBase tool type: ${toolKey || 'custom tool'}\n${moduleInfo.hasBackend && moduleInfo.moduleNames?.length > 0 ? `\nAvailable modules: ${moduleInfo.moduleNames.join(', ')}` : ''}\nEnhance this tool configuration.`
        }]
      });

      const responseText = response.content[0]?.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiEnhanced = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.log('[orchestrator] AI enhancement skipped:', err.message);
    }
  }

  // Build the tool payload
  const toolPayload = {
    type: 'tool',
    name: customName || aiEnhanced?.name || template.name,
    toolKey: toolKey || 'custom',
    toolCategory: toolCategory,

    // Tool-specific config
    toolConfig: {
      icon: template.icon,
      description: aiEnhanced?.tagline || template.description,
      features: aiEnhanced?.features || template.features,
      fields: template.fields,
      colors: template.colors
    },

    // Single page layout
    pages: ['tool'],
    layout: 'single-page-tool',

    // Modules from the module library (if applicable)
    modules: moduleInfo.moduleNames,
    hasBackend: moduleInfo.hasBackend,

    // Theme based on tool
    theme: {
      colors: template.colors,
      typography: {
        heading: 'Inter',
        body: 'Inter'
      },
      borderRadius: '12px'
    },

    // Metadata with module attribution
    metadata: {
      orchestratorVersion: '2.0',
      generatedAt: new Date().toISOString(),
      type: 'tool',
      originalInput: input,
      aiEnhanced: !!aiEnhanced,

      // Module library attribution
      moduleLibrary: {
        modulesUsed: moduleInfo.moduleNames,
        moduleDetails: moduleInfo.modules.map(m => ({
          name: m.name,
          description: m.description,
          features: m.features
        })),
        patterns: moduleInfo.patterns,
        integrationSuggestions: aiEnhanced?.moduleIntegration || null,
        backendSuggestions: aiEnhanced?.backendSuggestions || null
      }
    }
  };

  // Log module usage for tracking
  if (moduleInfo.hasBackend && moduleInfo.moduleNames && moduleInfo.moduleNames.length > 0) {
    console.log(`[orchestrator] Tool will use modules: ${moduleInfo.moduleNames.join(', ')}`);
    if (aiEnhanced?.moduleIntegration && Array.isArray(aiEnhanced.moduleIntegration)) {
      console.log(`[orchestrator] AI integration suggestions: ${aiEnhanced.moduleIntegration.join('; ')}`);
    }
  }

  return {
    success: true,
    type: 'tool',
    payload: toolPayload,
    summary: {
      type: 'tool',
      name: toolPayload.name,
      toolKey: toolKey,
      toolCategory: toolCategory,
      features: (toolPayload.toolConfig.features && Array.isArray(toolPayload.toolConfig.features)) ? toolPayload.toolConfig.features.length : 0,
      fields: (toolPayload.toolConfig.fields && Array.isArray(toolPayload.toolConfig.fields)) ? toolPayload.toolConfig.fields.length : 0,
      modulesUsed: moduleInfo.moduleNames || [],
      hasBackend: moduleInfo.hasBackend || false,
      confidence: toolKey ? 'high' : 'medium'
    }
  };
}

/**
 * Orchestrate a business website creation
 */
async function orchestrateBusiness(input) {
  // Quick local inference first
  const quickBusinessName = extractBusinessName(input);
  const quickIndustry = detectIndustryFromKeywords(input);

  // Build context for Claude
  const availableModules = getAvailableModules();
  const moduleList = availableModules.map(m => `- ${m.name}: ${m.description}`).join('\n');

  // Initialize Anthropic client (dynamic import for ES module compatibility)
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
  });

  const systemPrompt = `You are a website configuration expert for Blink, an AI website builder. Your job is to take a simple user request and infer ALL details needed to create a professional website.

CRITICAL RULES:
1. Make CONFIDENT decisions - never ask for clarification
2. Use common sense and industry knowledge to fill in realistic details
3. Return ONLY valid JSON - no explanations, no apologies
4. Every field must have a value - no nulls unless truly unknown

AVAILABLE INDUSTRIES (use exact key):
${VALID_INDUSTRIES.join(', ')}

AVAILABLE MODULES:
${moduleList}

INDUSTRY CONFIGS contain: colors, typography, layouts, effects, sections, and visual prompts.

When inferring:
- Business names in quotes or after "for" should be extracted exactly
- Industry should match one of the available keys
- Location can be inferred from city/state/country mentions
- Target audience should match the industry type
- Tone should match industry norms (e.g., law firms = professional, pizzerias = warm/friendly)
- Pages should be 5-8, appropriate for the industry
- Modules should include auth + industry-relevant features
- Colors can use the industry default or be customized based on vibe words`;

  const userPrompt = `Analyze this request and return a complete website configuration:

"${input}"

${quickBusinessName ? `Detected business name: "${quickBusinessName}"` : ''}
${quickIndustry ? `Likely industry: "${quickIndustry}"` : ''}

Return ONLY this JSON structure (no other text):
{
  "businessName": "The business name (infer professional name if not specified)",
  "industry": "exact industry key from available list",
  "location": {
    "city": "city or null",
    "state": "state/province or null",
    "country": "country (default USA)"
  },
  "targetAudience": "primary audience (e.g., 'families', 'young professionals', 'businesses')",
  "tone": "brand voice (e.g., 'professional', 'friendly', 'luxurious', 'energetic')",
  "pages": ["array of 5-8 page names"],
  "modules": ["array of module names from available list"],
  "colorOverride": {
    "useDefault": true,
    "primary": "#hex or null",
    "accent": "#hex or null"
  },
  "layoutPreference": "preferred layout style or null",
  "effects": ["suggested effects from industry config"],
  "specialFeatures": {
    "hasBooking": true/false,
    "hasEcommerce": true/false,
    "hasPortfolio": true/false,
    "hasBlog": true/false
  },
  "inferredDetails": {
    "tagline": "a catchy tagline for the business",
    "heroHeadline": "compelling headline for homepage",
    "callToAction": "primary CTA text",
    "uniqueSellingPoints": ["3-4 key differentiators"]
  },
  "confidence": "high/medium/low"
}`;

  try {
    const startTime = Date.now();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ],
      system: systemPrompt
    });

    const durationMs = Date.now() - startTime;
    console.log(`[orchestrator] Claude response in ${durationMs}ms`);

    // Extract JSON from response
    const responseText = response.content[0]?.text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const aiConfig = JSON.parse(jsonMatch[0]);
    console.log(`[orchestrator] Inferred: ${aiConfig.businessName} (${aiConfig.industry})`);

    // Validate and fill in any missing pieces
    const industry = VALID_INDUSTRIES.includes(aiConfig.industry)
      ? aiConfig.industry
      : (quickIndustry || 'consulting');

    const industryConfig = INDUSTRIES[industry] || INDUSTRIES['consulting'];
    const category = getIndustryCategory(industry);

    // Suggest admin tier based on industry
    let adminTierSuggestion = { tier: 'standard', modules: [], reason: 'Default' };
    try {
      const { suggestAdminTier } = require('../lib/services/admin-module-loader.cjs');
      adminTierSuggestion = suggestAdminTier(industry, input);
      console.log(`[orchestrator] Admin tier suggested: ${adminTierSuggestion.tier} (${adminTierSuggestion.reason})`);
    } catch (err) {
      console.warn('[orchestrator] Admin tier suggestion failed, using default:', err.message);
    }

    // SELECT OUTPUT TIER (L1-L4) based on detected features
    let tierRecommendation = { recommended: 'L2', tier: { name: 'Presence' }, estimatedCost: '$0.20', estimatedTime: '2 minutes' };
    let generationPlan = null;
    try {
      tierRecommendation = selectTier(input, industry);
      generationPlan = buildGenerationPlan(input, industry);
      console.log(`[orchestrator] Tier recommended: ${tierRecommendation.recommended} (${tierRecommendation.tier.name})`);
      console.log(`[orchestrator] Features detected: ${tierRecommendation.detectedFeatures?.join(', ') || 'none'}`);

      // Override admin tier if L1-L4 tier suggests different
      if (tierRecommendation.adminTier && tierRecommendation.adminTier !== adminTierSuggestion.tier) {
        console.log(`[orchestrator] Overriding admin tier: ${adminTierSuggestion.tier} → ${tierRecommendation.adminTier}`);
        adminTierSuggestion.tier = tierRecommendation.adminTier;
      }
    } catch (err) {
      console.warn('[orchestrator] Tier selection failed, using default L2:', err.message);
    }

    // Build the final payload for /api/assemble
    const assemblePayload = {
      type: 'business',
      name: aiConfig.businessName || quickBusinessName || 'New Business',
      industry: industry,

      // Admin configuration
      adminTier: adminTierSuggestion.tier,
      adminModules: adminTierSuggestion.modules,
      adminReason: adminTierSuggestion.reason,

      // Output tier (L1-L4) configuration
      outputTier: tierRecommendation.recommended,
      outputTierName: tierRecommendation.tier?.name || 'Presence',
      outputTierCost: tierRecommendation.estimatedCost || '$0.20',
      outputTierTime: tierRecommendation.estimatedTime || '2 minutes',
      detectedFeatures: tierRecommendation.detectedFeatures || [],
      generationPlan: generationPlan,

      // Theme configuration
      theme: {
        colors: aiConfig.colorOverride?.useDefault !== false
          ? industryConfig.colors
          : {
              ...industryConfig.colors,
              primary: aiConfig.colorOverride?.primary || industryConfig.colors.primary,
              accent: aiConfig.colorOverride?.accent || industryConfig.colors.accent
            },
        typography: industryConfig.typography,
        layout: aiConfig.layoutPreference || industryConfig.defaultLayout,
        effects: aiConfig.effects?.length > 0 ? aiConfig.effects : industryConfig.effects
      },

      // Content configuration
      description: aiConfig.inferredDetails?.tagline || industryConfig.vibe,

      // Location
      location: aiConfig.location?.city ? aiConfig.location : null,

      // Pages and modules
      pages: aiConfig.pages?.length > 0
        ? aiConfig.pages
        : PAGE_RECOMMENDATIONS[category] || PAGE_RECOMMENDATIONS.default,

      modules: aiConfig.modules?.length > 0
        ? aiConfig.modules
        : MODULE_RECOMMENDATIONS[industry] || MODULE_RECOMMENDATIONS.default,

      // Additional metadata
      metadata: {
        orchestratorVersion: '2.0',
        generatedAt: new Date().toISOString(),
        type: 'business',
        confidence: aiConfig.confidence || 'medium',
        targetAudience: aiConfig.targetAudience,
        tone: aiConfig.tone,
        specialFeatures: aiConfig.specialFeatures,
        inferredDetails: aiConfig.inferredDetails,
        originalInput: input,
        processingTimeMs: durationMs,
        tokenUsage: response.usage
      },

      // Auto-deploy setting (can be overridden by caller)
      autoDeploy: false,

      // Reference the industry config for the generator
      industryConfig: {
        name: industryConfig.name,
        icon: industryConfig.icon,
        category: industryConfig.category,
        vibe: industryConfig.vibe,
        visualPrompt: industryConfig.visualPrompt,
        imagery: industryConfig.imagery
      }
    };

    return {
      success: true,
      type: 'business',
      payload: assemblePayload,
      summary: {
        type: 'business',
        businessName: assemblePayload.name,
        industry: industry,
        industryName: industryConfig.name,
        pages: assemblePayload.pages.length,
        modules: assemblePayload.modules.length,
        adminTier: adminTierSuggestion.tier,
        adminModuleCount: adminTierSuggestion.modules.length,
        location: aiConfig.location?.city
          ? `${aiConfig.location.city}${aiConfig.location.state ? ', ' + aiConfig.location.state : ''}`
          : 'Not specified',
        confidence: aiConfig.confidence,
        // Output tier (L1-L4) for UI display
        outputTier: tierRecommendation.recommended,
        outputTierName: tierRecommendation.tier?.name || 'Presence',
        outputTierCost: tierRecommendation.estimatedCost || '$0.20',
        outputTierTime: tierRecommendation.estimatedTime || '2 minutes',
        detectedFeatures: tierRecommendation.detectedFeatures || [],
        canUpgrade: tierRecommendation.upgradeOptions?.length > 0,
        canDowngrade: tierRecommendation.downgradeOptions?.length > 0
      }
    };

  } catch (error) {
    console.error('[orchestrator] Error:', error.message);

    // Fallback to local inference if Claude fails
    if (quickIndustry || quickBusinessName) {
      console.log('[orchestrator] Using fallback local inference');

      const industry = quickIndustry || 'consulting';
      const industryConfig = INDUSTRIES[industry] || INDUSTRIES['consulting'];
      const category = getIndustryCategory(industry);

      // Get fallback admin tier
      let fallbackAdminTier = { tier: 'standard', modules: [], reason: 'Fallback default' };
      try {
        const { suggestAdminTier } = require('../lib/services/admin-module-loader.cjs');
        fallbackAdminTier = suggestAdminTier(industry, input);
      } catch (err) {}

      // Get fallback tier recommendation
      let fallbackTier = { recommended: 'L2', tier: { name: 'Presence' }, estimatedCost: '$0.20', estimatedTime: '2 minutes', detectedFeatures: [] };
      try {
        fallbackTier = selectTier(input, industry);
      } catch (err) {}

      return {
        success: true,
        type: 'business',
        payload: {
          type: 'business',
          name: quickBusinessName || 'New Business',
          industry: industry,
          adminTier: fallbackAdminTier.tier,
          adminModules: fallbackAdminTier.modules,
          adminReason: fallbackAdminTier.reason,
          theme: {
            colors: industryConfig.colors,
            typography: industryConfig.typography,
            layout: industryConfig.defaultLayout,
            effects: industryConfig.effects
          },
          description: industryConfig.vibe,
          pages: PAGE_RECOMMENDATIONS[category] || PAGE_RECOMMENDATIONS.default,
          modules: MODULE_RECOMMENDATIONS[industry] || MODULE_RECOMMENDATIONS.default,
          autoDeploy: false,
          // Output tier (L1-L4) configuration
          outputTier: fallbackTier.recommended,
          outputTierName: fallbackTier.tier?.name || 'Presence',
          outputTierCost: fallbackTier.estimatedCost || '$0.20',
          outputTierTime: fallbackTier.estimatedTime || '2 minutes',
          detectedFeatures: fallbackTier.detectedFeatures || [],
          generationPlan: null,
          metadata: {
            orchestratorVersion: '2.0',
            generatedAt: new Date().toISOString(),
            type: 'business',
            confidence: 'low',
            fallbackUsed: true,
            originalInput: input,
            error: error.message
          },
          industryConfig: {
            name: industryConfig.name,
            icon: industryConfig.icon,
            category: industryConfig.category,
            vibe: industryConfig.vibe,
            visualPrompt: industryConfig.visualPrompt,
            imagery: industryConfig.imagery
          }
        },
        summary: {
          type: 'business',
          businessName: quickBusinessName || 'New Business',
          industry: industry,
          industryName: industryConfig.name,
          pages: (PAGE_RECOMMENDATIONS[category] || PAGE_RECOMMENDATIONS.default).length,
          modules: (MODULE_RECOMMENDATIONS[industry] || MODULE_RECOMMENDATIONS.default).length,
          adminTier: fallbackAdminTier.tier,
          adminModuleCount: fallbackAdminTier.modules.length,
          location: 'Not specified',
          confidence: 'low',
          fallbackUsed: true,
          // Output tier (L1-L4) for UI display
          outputTier: fallbackTier.recommended,
          outputTierName: fallbackTier.tier?.name || 'Presence',
          outputTierCost: fallbackTier.estimatedCost || '$0.20',
          outputTierTime: fallbackTier.estimatedTime || '2 minutes',
          detectedFeatures: fallbackTier.detectedFeatures || [],
          canUpgrade: fallbackTier.upgradeOptions?.length > 0,
          canDowngrade: fallbackTier.downgradeOptions?.length > 0
        }
      };
    }

    throw new Error(`Orchestration failed: ${error.message}`);
  }
}

/**
 * Main orchestration function
 * Takes a single sentence and returns a complete payload
 *
 * @param {string} userInput - Single sentence describing what to create
 * @returns {Promise<Object>} Complete payload for /api/assemble or /api/tool
 */
async function orchestrate(userInput) {
  if (!userInput || typeof userInput !== 'string' || userInput.trim().length < 3) {
    throw new Error('Please provide a description of what you want to create');
  }

  const input = userInput.trim();
  console.log(`[orchestrator] Processing: "${input}"`);

  // Detect intent type (tool vs business)
  const intent = detectIntentType(input);
  console.log(`[orchestrator] Detected type: ${intent.type} (confidence: ${intent.confidence})`);

  if (intent.type === 'tool') {
    return orchestrateTool(input, intent.toolKey);
  } else {
    return orchestrateBusiness(input);
  }
}

/**
 * Validate an orchestrator result before sending to assemble
 */
function validatePayload(payload) {
  const errors = [];

  if (payload.type === 'tool') {
    if (!payload.name || payload.name.length < 2) {
      errors.push('Tool name is required (min 2 characters)');
    }
    if (!payload.toolConfig || !payload.toolConfig.fields) {
      errors.push('Tool configuration is required');
    }
  } else {
    if (!payload.name || payload.name.length < 2) {
      errors.push('Business name is required (min 2 characters)');
    }
    if (!payload.industry || !VALID_INDUSTRIES.includes(payload.industry)) {
      errors.push(`Invalid industry. Must be one of: ${VALID_INDUSTRIES.slice(0, 10).join(', ')}...`);
    }
    if (!payload.pages || !Array.isArray(payload.pages) || payload.pages.length < 1) {
      errors.push('At least one page is required');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get a preview of what the orchestrator would generate
 */
async function preview(userInput) {
  const result = await orchestrate(userInput);

  if (result.type === 'tool') {
    return {
      type: 'tool',
      name: result.summary.name,
      toolCategory: result.summary.toolCategory,
      features: result.payload.toolConfig?.features || [],
      fields: (result.payload.toolConfig?.fields && Array.isArray(result.payload.toolConfig.fields)) ? result.payload.toolConfig.fields.length : 0,
      colors: result.payload.theme?.colors || {},
      confidence: result.summary.confidence
    };
  }

  return {
    type: 'business',
    businessName: result.summary.businessName,
    industry: result.summary.industryName,
    pages: result.payload.pages,
    modules: result.payload.modules,
    colors: result.payload.theme.colors,
    tagline: result.payload.metadata?.inferredDetails?.tagline,
    confidence: result.summary.confidence
  };
}

// ============================================
// RECOMMENDATION DETECTION
// ============================================

// Patterns that indicate user wants recommendations (not a specific build)
const RECOMMENDATION_PATTERNS = [
  /^i'?m\s+a\s+/i,                           // "I'm a plumber", "I'm a freelancer"
  /^i'?m\s+starting\s+/i,                    // "I'm starting a bakery"
  /^what\s+tools?\s+/i,                      // "What tools do I need"
  /^what\s+do\s+i\s+need/i,                  // "What do I need for..."
  /^tools?\s+for\s+/i,                       // "Tools for restaurants"
  /^help\s+(me\s+)?with\s+/i,                // "Help me with my business"
  /^suggest\s+/i,                            // "Suggest tools for..."
  /^recommend\s+/i,                          // "Recommend tools"
  /^i\s+need\s+help/i,                       // "I need help with..."
  /^i\s+run\s+a\s+/i,                        // "I run a restaurant"
  /^i\s+own\s+a\s+/i,                        // "I own a salon"
  /^i\s+have\s+a\s+/i,                       // "I have a small business"
];

// Industry keywords for recommendation context
const RECOMMENDATION_INDUSTRIES = {
  // Freelance/Creative
  'freelancer': 'freelance',
  'freelance': 'freelance',
  'consultant': 'consulting',
  'designer': 'design',
  'developer': 'development',
  'writer': 'writing',
  'photographer': 'photography',
  'videographer': 'video',
  'artist': 'creative',

  // Service Businesses
  'plumber': 'plumbing',
  'electrician': 'electrical',
  'contractor': 'construction',
  'landscaper': 'landscaping',
  'cleaner': 'cleaning',
  'mechanic': 'automotive',
  'handyman': 'home-services',

  // Food & Hospitality
  'restaurant': 'restaurant',
  'cafe': 'cafe',
  'bakery': 'bakery',
  'food truck': 'food-truck',
  'caterer': 'catering',
  'bar': 'bar',

  // Health & Wellness
  'trainer': 'fitness',
  'gym': 'fitness',
  'yoga': 'yoga',
  'therapist': 'therapy',
  'coach': 'coaching',
  'spa': 'spa',
  'salon': 'salon',

  // Professional Services
  'lawyer': 'legal',
  'attorney': 'legal',
  'accountant': 'accounting',
  'realtor': 'real-estate',
  'agent': 'real-estate',

  // Retail
  'shop': 'retail',
  'store': 'retail',
  'ecommerce': 'ecommerce',
  'online store': 'ecommerce',

  // General
  'small business': 'small-business',
  'startup': 'startup',
  'agency': 'agency',
};

// Tool recommendations by industry
const INDUSTRY_TOOL_SUGGESTIONS = {
  'freelance': ['invoice-generator', 'time-tracker', 'expense-tracker', 'project-tracker'],
  'consulting': ['invoice-generator', 'booking-tool', 'time-tracker', 'client-tracker'],
  'design': ['invoice-generator', 'project-tracker', 'time-tracker', 'color-picker'],
  'development': ['time-tracker', 'invoice-generator', 'project-tracker', 'todo-tracker'],
  'writing': ['word-counter', 'invoice-generator', 'time-tracker', 'deadline-tracker'],
  'photography': ['booking-tool', 'invoice-generator', 'gallery-generator', 'contract-generator'],
  'video': ['project-tracker', 'invoice-generator', 'time-tracker', 'booking-tool'],
  'creative': ['invoice-generator', 'project-tracker', 'time-tracker', 'portfolio-tool'],

  'plumbing': ['invoice-generator', 'booking-tool', 'quote-calculator', 'job-tracker'],
  'electrical': ['invoice-generator', 'booking-tool', 'quote-calculator', 'job-tracker'],
  'construction': ['quote-calculator', 'invoice-generator', 'project-tracker', 'expense-tracker'],
  'landscaping': ['quote-calculator', 'booking-tool', 'invoice-generator', 'weather-tracker'],
  'cleaning': ['booking-tool', 'invoice-generator', 'checklist-generator', 'time-tracker'],
  'automotive': ['invoice-generator', 'booking-tool', 'vehicle-tracker', 'parts-calculator'],
  'home-services': ['booking-tool', 'invoice-generator', 'quote-calculator', 'job-tracker'],

  'restaurant': ['tip-calculator', 'inventory-tracker', 'booking-tool', 'menu-generator'],
  'cafe': ['tip-calculator', 'inventory-tracker', 'expense-tracker', 'menu-generator'],
  'bakery': ['recipe-calculator', 'inventory-tracker', 'order-tracker', 'expense-tracker'],
  'food-truck': ['tip-calculator', 'inventory-tracker', 'expense-tracker', 'location-tracker'],
  'catering': ['quote-calculator', 'booking-tool', 'invoice-generator', 'event-tracker'],
  'bar': ['tip-calculator', 'inventory-tracker', 'expense-tracker', 'shift-tracker'],

  'fitness': ['booking-tool', 'workout-tracker', 'client-tracker', 'payment-tracker'],
  'yoga': ['booking-tool', 'class-scheduler', 'client-tracker', 'payment-tracker'],
  'therapy': ['booking-tool', 'session-tracker', 'invoice-generator', 'note-tracker'],
  'coaching': ['booking-tool', 'session-tracker', 'invoice-generator', 'goal-tracker'],
  'spa': ['booking-tool', 'service-menu', 'client-tracker', 'inventory-tracker'],
  'salon': ['booking-tool', 'client-tracker', 'inventory-tracker', 'tip-calculator'],

  'legal': ['time-tracker', 'invoice-generator', 'document-tracker', 'client-tracker'],
  'accounting': ['invoice-generator', 'expense-tracker', 'time-tracker', 'tax-calculator'],
  'real-estate': ['mortgage-calculator', 'commission-calculator', 'client-tracker', 'property-tracker'],

  'retail': ['inventory-tracker', 'expense-tracker', 'discount-calculator', 'sales-tracker'],
  'ecommerce': ['inventory-tracker', 'shipping-calculator', 'discount-calculator', 'order-tracker'],

  'small-business': ['invoice-generator', 'expense-tracker', 'booking-tool', 'time-tracker'],
  'startup': ['expense-tracker', 'time-tracker', 'project-tracker', 'invoice-generator'],
  'agency': ['time-tracker', 'invoice-generator', 'project-tracker', 'client-tracker'],
};

/**
 * Detect if input is asking for recommendations vs a specific build
 */
function detectRecommendationIntent(input) {
  const lowerInput = input.toLowerCase().trim();

  // Check recommendation patterns
  for (const pattern of RECOMMENDATION_PATTERNS) {
    if (pattern.test(lowerInput)) {
      // Extract industry context
      for (const [keyword, industry] of Object.entries(RECOMMENDATION_INDUSTRIES)) {
        if (lowerInput.includes(keyword)) {
          return {
            type: 'recommendation',
            industry: industry,
            keyword: keyword,
            confidence: 'high'
          };
        }
      }
      // Pattern matched but no specific industry
      return {
        type: 'recommendation',
        industry: null,
        confidence: 'medium'
      };
    }
  }

  // Check for industry-only input (just "restaurant" or "plumber")
  for (const [keyword, industry] of Object.entries(RECOMMENDATION_INDUSTRIES)) {
    if (lowerInput === keyword || lowerInput === `a ${keyword}` || lowerInput === `my ${keyword}`) {
      return {
        type: 'recommendation',
        industry: industry,
        keyword: keyword,
        confidence: 'medium'
      };
    }
  }

  return { type: 'build', industry: null, confidence: 'high' };
}

/**
 * Get tool recommendations for an industry using Claude AI
 */
async function recommendTools(industryOrInput) {
  const lowerInput = (industryOrInput || '').toLowerCase().trim();

  // Try to match to a known industry
  let industry = RECOMMENDATION_INDUSTRIES[lowerInput] || lowerInput;

  // Get base suggestions from our mapping
  const baseSuggestions = INDUSTRY_TOOL_SUGGESTIONS[industry] || INDUSTRY_TOOL_SUGGESTIONS['small-business'];

  // Use Claude to enhance recommendations
  if (process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({
        apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
      });

      const systemPrompt = `You are a business tools expert. Given an industry or profession, recommend 4-6 useful micro-tools that would help that business operate more efficiently.

Focus on practical, everyday tools like:
- Calculators (tip, mortgage, discount, quote)
- Generators (invoice, receipt, QR code, password)
- Trackers (time, expense, habit, inventory)
- Timers (pomodoro, countdown)
- Converters (unit, currency)

Return ONLY valid JSON array with this exact structure:
[
  {
    "toolType": "invoice-generator",
    "name": "Client Invoice Generator",
    "description": "Create professional invoices for your clients in seconds",
    "icon": "📄",
    "priority": 1
  }
]

Rules:
- Return 4-6 tools maximum
- Priority 1 = most useful, higher = less critical
- Use descriptive names that include the business context
- Keep descriptions to one short sentence
- Use relevant emoji icons
- toolType should match common patterns: *-calculator, *-generator, *-tracker, *-timer, *-converter`;

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Recommend the most useful micro-tools for: "${industryOrInput}"\n\nThink about their daily tasks, client interactions, and business operations.`
        }]
      });

      const responseText = response.content[0]?.text || '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const aiRecommendations = JSON.parse(jsonMatch[0]);
        console.log(`[orchestrator] AI recommended ${aiRecommendations.length} tools for "${industryOrInput}"`);
        return {
          success: true,
          industry: industry,
          originalInput: industryOrInput,
          recommendations: aiRecommendations.sort((a, b) => (a.priority || 5) - (b.priority || 5)),
          source: 'ai'
        };
      }
    } catch (err) {
      console.log('[orchestrator] AI recommendation failed, using defaults:', err.message);
    }
  }

  // Fallback to static recommendations
  const staticRecommendations = baseSuggestions.map((toolType, index) => {
    const template = TOOL_TEMPLATES[toolType] || DEFAULT_TOOL_TEMPLATE;
    return {
      toolType: toolType,
      name: template.name || toolType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: template.description || `A useful ${toolType.replace(/-/g, ' ')} for your business`,
      icon: template.icon || '🛠️',
      priority: index + 1
    };
  });

  return {
    success: true,
    industry: industry,
    originalInput: industryOrInput,
    recommendations: staticRecommendations,
    source: 'static'
  };
}

// ============================================
// TOOL HTML GENERATION
// ============================================

/**
 * Generate a self-contained HTML file for a tool
 */
function generateToolHTML(toolConfig) {
  const { name, icon, description, features, fields, colors } = toolConfig;

  const primaryColor = colors?.primary || '#6366f1';
  const accentColor = colors?.accent || '#818cf8';
  const bgColor = colors?.background || '#f8fafc';

  // Generate field inputs HTML
  const fieldsHTML = (fields || []).map(field => {
    switch (field.type) {
      case 'number':
        return `
          <div class="field">
            <label for="${field.name}">${field.label}</label>
            <input type="number" id="${field.name}" name="${field.name}"
                   ${field.min !== undefined ? `min="${field.min}"` : ''}
                   ${field.max !== undefined ? `max="${field.max}"` : ''}
                   ${field.step ? `step="${field.step}"` : ''}
                   ${field.default !== undefined ? `value="${field.default}"` : ''}
                   placeholder="Enter ${field.label.toLowerCase()}">
          </div>`;
      case 'text':
        return `
          <div class="field">
            <label for="${field.name}">${field.label}</label>
            <input type="text" id="${field.name}" name="${field.name}"
                   placeholder="Enter ${field.label.toLowerCase()}">
          </div>`;
      case 'textarea':
        return `
          <div class="field">
            <label for="${field.name}">${field.label}</label>
            <textarea id="${field.name}" name="${field.name}" rows="4"
                      placeholder="Enter ${field.label.toLowerCase()}"></textarea>
          </div>`;
      case 'select':
        const options = (field.options || []).map(opt =>
          `<option value="${opt}">${opt}</option>`
        ).join('');
        return `
          <div class="field">
            <label for="${field.name}">${field.label}</label>
            <select id="${field.name}" name="${field.name}">
              <option value="">Select ${field.label.toLowerCase()}</option>
              ${options}
            </select>
          </div>`;
      case 'range':
        return `
          <div class="field">
            <label for="${field.name}">${field.label}: <span id="${field.name}-value">${field.default || field.min || 0}</span></label>
            <input type="range" id="${field.name}" name="${field.name}"
                   min="${field.min || 0}" max="${field.max || 100}"
                   value="${field.default || field.min || 0}"
                   oninput="document.getElementById('${field.name}-value').textContent = this.value">
          </div>`;
      case 'checkbox':
        return `
          <div class="field checkbox-field">
            <label>
              <input type="checkbox" id="${field.name}" name="${field.name}"
                     ${field.default ? 'checked' : ''}>
              ${field.label}
            </label>
          </div>`;
      case 'date':
        return `
          <div class="field">
            <label for="${field.name}">${field.label}</label>
            <input type="date" id="${field.name}" name="${field.name}">
          </div>`;
      case 'color':
        return `
          <div class="field">
            <label for="${field.name}">${field.label}</label>
            <input type="color" id="${field.name}" name="${field.name}"
                   value="${field.default || '#000000'}">
          </div>`;
      default:
        return `
          <div class="field">
            <label for="${field.name}">${field.label}</label>
            <input type="text" id="${field.name}" name="${field.name}">
          </div>`;
    }
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: ${bgColor};
      min-height: 100vh;
      padding: 2rem;
    }

    .container {
      max-width: 500px;
      margin: 0 auto;
    }

    .tool-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .tool-header {
      background: linear-gradient(135deg, ${primaryColor}, ${accentColor});
      color: white;
      padding: 2rem;
      text-align: center;
    }

    .tool-icon {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }

    .tool-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .tool-description {
      opacity: 0.9;
      font-size: 0.9rem;
    }

    .tool-body {
      padding: 1.5rem;
    }

    .field {
      margin-bottom: 1rem;
    }

    .field label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: #374151;
    }

    .field input[type="text"],
    .field input[type="number"],
    .field input[type="date"],
    .field input[type="email"],
    .field textarea,
    .field select {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .field input:focus,
    .field textarea:focus,
    .field select:focus {
      outline: none;
      border-color: ${primaryColor};
      box-shadow: 0 0 0 3px ${primaryColor}20;
    }

    .field input[type="range"] {
      width: 100%;
      height: 8px;
      border-radius: 4px;
      background: #e5e7eb;
      cursor: pointer;
      accent-color: ${primaryColor};
    }

    .field input[type="color"] {
      width: 100%;
      height: 50px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      padding: 4px;
    }

    .checkbox-field label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-field input {
      width: 18px;
      height: 18px;
      accent-color: ${primaryColor};
    }

    .btn {
      width: 100%;
      padding: 1rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.1s, box-shadow 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, ${primaryColor}, ${accentColor});
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px ${primaryColor}40;
    }

    .btn-primary:active {
      transform: translateY(0);
    }

    .result {
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: ${bgColor};
      border-radius: 12px;
      text-align: center;
      display: none;
    }

    .result.show {
      display: block;
      animation: fadeIn 0.3s ease;
    }

    .result-label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .result-value {
      font-size: 2rem;
      font-weight: 700;
      color: ${primaryColor};
    }

    .result-detail {
      margin-top: 0.5rem;
      font-size: 0.9rem;
      color: #4b5563;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .footer {
      text-align: center;
      margin-top: 1rem;
      padding: 1rem;
      color: #9ca3af;
      font-size: 0.75rem;
    }

    .footer a {
      color: ${primaryColor};
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="tool-card">
      <div class="tool-header">
        <div class="tool-icon">${icon || '🛠️'}</div>
        <h1 class="tool-title">${name}</h1>
        <p class="tool-description">${description || ''}</p>
      </div>

      <div class="tool-body">
        <form id="toolForm">
          ${fieldsHTML}

          <button type="submit" class="btn btn-primary">
            Calculate
          </button>
        </form>

        <div id="result" class="result">
          <div class="result-label">Result</div>
          <div class="result-value" id="resultValue">-</div>
          <div class="result-detail" id="resultDetail"></div>
        </div>
      </div>
    </div>

    <div class="footer">
      Built with <a href="#">Blink</a>
    </div>
  </div>

  <script>
    // Tool functionality
    const form = document.getElementById('toolForm');
    const resultDiv = document.getElementById('result');
    const resultValue = document.getElementById('resultValue');
    const resultDetail = document.getElementById('resultDetail');

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Convert numeric fields
      for (const [key, value] of Object.entries(data)) {
        if (!isNaN(value) && value !== '') {
          data[key] = parseFloat(value);
        }
      }

      // Calculate result based on tool type
      let result = calculate(data);

      // Show result
      resultValue.textContent = result.value;
      resultDetail.textContent = result.detail || '';
      resultDiv.classList.add('show');
    });

    function calculate(data) {
      // Generic calculation logic - can be customized per tool
      const values = Object.values(data).filter(v => typeof v === 'number');

      if (values.length === 0) {
        return { value: 'Enter values', detail: '' };
      }

      // Default: sum values
      const sum = values.reduce((a, b) => a + b, 0);

      return {
        value: formatNumber(sum),
        detail: \`Sum of \${values.length} values\`
      };
    }

    function formatNumber(num) {
      if (typeof num !== 'number' || isNaN(num)) return '-';

      // Format as currency if likely a money value
      if (num >= 1) {
        return num.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }

      return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
      });
    }
  </script>
</body>
</html>`;

  return html;
}

/**
 * Generate specialized HTML based on tool type
 * Now supports styled generation with visual style presets
 */
function generateSpecializedToolHTML(toolKey, toolConfig) {
  // If style is provided, use the new styled generator
  const style = toolConfig.style || toolConfig.branding?.style;
  if (style && STYLE_PRESETS[style]) {
    // Normalize colors
    const colors = {
      primary: toolConfig.colors?.primary || toolConfig.branding?.colors?.primary || '#6366f1',
      primaryDark: toolConfig.colors?.secondary || toolConfig.branding?.colors?.secondary || '#4f46e5',
      accent: toolConfig.colors?.accent || toolConfig.branding?.colors?.accent || '#8b5cf6',
      background: toolConfig.colors?.background || '#f8fafc'
    };

    // Try styled generator first
    const styledConfig = {
      name: toolConfig.name,
      style: style,
      colors: colors,
      branding: {
        businessName: toolConfig.branding?.businessName || toolConfig.businessName,
        logo: toolConfig.branding?.logo || toolConfig.logo
      },
      fields: toolConfig.fields,
      features: toolConfig.features
    };

    const styledHtml = generateStyledTool(toolKey, styledConfig);
    if (styledHtml) {
      return styledHtml;
    }
  }

  // For specific tool types, generate more tailored HTML (legacy)
  const specializedGenerators = {
    'tip-calculator': generateTipCalculatorHTML,
    'calculator': generateBasicCalculatorHTML,
    'bmi-calculator': generateBMICalculatorHTML,
    'percentage-calculator': generatePercentageCalculatorHTML,
    'countdown': generateCountdownHTML,
    'pomodoro': generatePomodoroHTML,
    'word-counter': generateWordCounterHTML,
    'password-generator': generatePasswordGeneratorHTML,
  };

  const generator = specializedGenerators[toolKey];
  if (generator) {
    return generator(toolConfig);
  }

  // Fall back to generic HTML
  return generateToolHTML(toolConfig);
}

// Specialized tool generators
function generateTipCalculatorHTML(config) {
  const { name, colors } = config;
  const primaryColor = colors?.primary || '#059669';
  const accentColor = colors?.accent || '#10b981';
  const bgColor = colors?.background || '#f0fdf4';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || 'Tip Calculator'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${bgColor};
      min-height: 100vh;
      padding: 2rem;
    }
    .container { max-width: 400px; margin: 0 auto; }
    .card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, ${primaryColor}, ${accentColor});
      color: white;
      padding: 2rem;
      text-align: center;
    }
    .header h1 { font-size: 1.5rem; }
    .body { padding: 1.5rem; }
    .field { margin-bottom: 1.25rem; }
    .field label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151; }
    .field input {
      width: 100%;
      padding: 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 1.25rem;
      text-align: center;
    }
    .field input:focus { outline: none; border-color: ${primaryColor}; }
    .tip-buttons {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }
    .tip-btn {
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      background: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tip-btn:hover { border-color: ${primaryColor}; }
    .tip-btn.active { background: ${primaryColor}; color: white; border-color: ${primaryColor}; }
    .results {
      background: ${bgColor};
      border-radius: 16px;
      padding: 1.5rem;
      margin-top: 1.5rem;
    }
    .result-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .result-row:last-child { border-bottom: none; font-size: 1.25rem; font-weight: 700; color: ${primaryColor}; }
    .result-label { color: #6b7280; }
    .result-value { font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>💰 Tip Calculator</h1>
      </div>
      <div class="body">
        <div class="field">
          <label>Bill Amount</label>
          <input type="number" id="bill" placeholder="0.00" step="0.01">
        </div>

        <label style="display:block;font-weight:600;margin-bottom:0.5rem;color:#374151;">Tip Percentage</label>
        <div class="tip-buttons">
          <button class="tip-btn" data-tip="15">15%</button>
          <button class="tip-btn active" data-tip="18">18%</button>
          <button class="tip-btn" data-tip="20">20%</button>
          <button class="tip-btn" data-tip="25">25%</button>
        </div>

        <div class="field">
          <label>Split Between</label>
          <input type="number" id="split" value="1" min="1">
        </div>

        <div class="results">
          <div class="result-row">
            <span class="result-label">Tip Amount</span>
            <span class="result-value" id="tipAmount">$0.00</span>
          </div>
          <div class="result-row">
            <span class="result-label">Total</span>
            <span class="result-value" id="total">$0.00</span>
          </div>
          <div class="result-row">
            <span class="result-label">Per Person</span>
            <span class="result-value" id="perPerson">$0.00</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script>
    let tipPercent = 18;
    const tipBtns = document.querySelectorAll('.tip-btn');
    const billInput = document.getElementById('bill');
    const splitInput = document.getElementById('split');

    tipBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tipBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tipPercent = parseInt(btn.dataset.tip);
        calculate();
      });
    });

    billInput.addEventListener('input', calculate);
    splitInput.addEventListener('input', calculate);

    function calculate() {
      const bill = parseFloat(billInput.value) || 0;
      const split = parseInt(splitInput.value) || 1;
      const tip = bill * (tipPercent / 100);
      const total = bill + tip;
      const perPerson = total / split;

      document.getElementById('tipAmount').textContent = '$' + tip.toFixed(2);
      document.getElementById('total').textContent = '$' + total.toFixed(2);
      document.getElementById('perPerson').textContent = '$' + perPerson.toFixed(2);
    }
  </script>
</body>
</html>`;
}

function generateBasicCalculatorHTML(config) {
  const { name, colors } = config;
  const primaryColor = colors?.primary || '#6366f1';
  const accentColor = colors?.accent || '#818cf8';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || 'Calculator'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, ${primaryColor}, ${accentColor});
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .calculator {
      background: #1f2937;
      border-radius: 24px;
      padding: 1.5rem;
      box-shadow: 0 25px 50px rgba(0,0,0,0.3);
      width: 100%;
      max-width: 320px;
    }
    .display {
      background: #111827;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      text-align: right;
    }
    .display-expr { color: #9ca3af; font-size: 0.9rem; min-height: 1.2rem; }
    .display-value { color: white; font-size: 2.5rem; font-weight: 300; word-break: break-all; }
    .buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
    .btn {
      padding: 1.25rem;
      border: none;
      border-radius: 12px;
      font-size: 1.25rem;
      font-weight: 500;
      cursor: pointer;
      transition: transform 0.1s, opacity 0.1s;
    }
    .btn:hover { opacity: 0.9; }
    .btn:active { transform: scale(0.95); }
    .btn-num { background: #374151; color: white; }
    .btn-op { background: ${primaryColor}; color: white; }
    .btn-clear { background: #ef4444; color: white; }
    .btn-eq { background: ${accentColor}; color: white; grid-column: span 2; }
  </style>
</head>
<body>
  <div class="calculator">
    <div class="display">
      <div class="display-expr" id="expr"></div>
      <div class="display-value" id="display">0</div>
    </div>
    <div class="buttons">
      <button class="btn btn-clear" onclick="clearCalc()">C</button>
      <button class="btn btn-op" onclick="addOp('/')">/</button>
      <button class="btn btn-op" onclick="addOp('*')">×</button>
      <button class="btn btn-op" onclick="backspace()">⌫</button>
      <button class="btn btn-num" onclick="addNum('7')">7</button>
      <button class="btn btn-num" onclick="addNum('8')">8</button>
      <button class="btn btn-num" onclick="addNum('9')">9</button>
      <button class="btn btn-op" onclick="addOp('-')">-</button>
      <button class="btn btn-num" onclick="addNum('4')">4</button>
      <button class="btn btn-num" onclick="addNum('5')">5</button>
      <button class="btn btn-num" onclick="addNum('6')">6</button>
      <button class="btn btn-op" onclick="addOp('+')">+</button>
      <button class="btn btn-num" onclick="addNum('1')">1</button>
      <button class="btn btn-num" onclick="addNum('2')">2</button>
      <button class="btn btn-num" onclick="addNum('3')">3</button>
      <button class="btn btn-num" onclick="addNum('.')">.</button>
      <button class="btn btn-num" onclick="addNum('0')">0</button>
      <button class="btn btn-eq" onclick="calculate()">=</button>
    </div>
  </div>
  <script>
    let current = '0';
    let expr = '';
    let shouldReset = false;

    function updateDisplay() {
      document.getElementById('display').textContent = current;
      document.getElementById('expr').textContent = expr;
    }

    function addNum(n) {
      if (shouldReset) { current = '0'; shouldReset = false; }
      if (n === '.' && current.includes('.')) return;
      current = current === '0' && n !== '.' ? n : current + n;
      updateDisplay();
    }

    function addOp(op) {
      expr = current + ' ' + op + ' ';
      shouldReset = true;
      updateDisplay();
    }

    function calculate() {
      if (!expr) return;
      try {
        const result = eval(expr + current);
        expr = '';
        current = String(parseFloat(result.toFixed(10)));
        shouldReset = true;
        updateDisplay();
      } catch(e) { current = 'Error'; updateDisplay(); }
    }

    function clearCalc() { current = '0'; expr = ''; updateDisplay(); }
    function backspace() { current = current.slice(0,-1) || '0'; updateDisplay(); }
  </script>
</body>
</html>`;
}

function generateBMICalculatorHTML(config) {
  return generateToolHTML({ ...config, name: config.name || 'BMI Calculator' });
}

function generatePercentageCalculatorHTML(config) {
  return generateToolHTML({ ...config, name: config.name || 'Percentage Calculator' });
}

function generateCountdownHTML(config) {
  const { name, colors } = config;
  const primaryColor = colors?.primary || '#7c3aed';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || 'Countdown Timer'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, ${primaryColor}, #ec4899);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .container { text-align: center; color: white; }
    .title { font-size: 1.5rem; margin-bottom: 2rem; opacity: 0.9; }
    .countdown {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 2rem;
    }
    .time-box {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 1.5rem 1rem;
      min-width: 80px;
    }
    .time-value { font-size: 3rem; font-weight: 700; }
    .time-label { font-size: 0.75rem; text-transform: uppercase; opacity: 0.8; }
    .input-group {
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    input[type="datetime-local"], input[type="text"] {
      background: rgba(255,255,255,0.2);
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      color: white;
      font-size: 1rem;
      width: 100%;
      margin-top: 0.5rem;
    }
    input::placeholder { color: rgba(255,255,255,0.5); }
  </style>
</head>
<body>
  <div class="container">
    <input type="text" id="eventName" placeholder="Event name..." style="margin-bottom:1rem;max-width:300px;">
    <h1 class="title" id="title">Countdown</h1>
    <div class="countdown">
      <div class="time-box"><div class="time-value" id="days">00</div><div class="time-label">Days</div></div>
      <div class="time-box"><div class="time-value" id="hours">00</div><div class="time-label">Hours</div></div>
      <div class="time-box"><div class="time-value" id="mins">00</div><div class="time-label">Minutes</div></div>
      <div class="time-box"><div class="time-value" id="secs">00</div><div class="time-label">Seconds</div></div>
    </div>
    <input type="datetime-local" id="targetDate" style="max-width:300px;">
  </div>
  <script>
    const targetInput = document.getElementById('targetDate');
    const nameInput = document.getElementById('eventName');
    let targetDate = new Date(Date.now() + 86400000);

    targetInput.addEventListener('change', (e) => { targetDate = new Date(e.target.value); });
    nameInput.addEventListener('input', (e) => {
      document.getElementById('title').textContent = e.target.value || 'Countdown';
    });

    function update() {
      const now = new Date();
      const diff = Math.max(0, targetDate - now);
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      document.getElementById('days').textContent = String(d).padStart(2,'0');
      document.getElementById('hours').textContent = String(h).padStart(2,'0');
      document.getElementById('mins').textContent = String(m).padStart(2,'0');
      document.getElementById('secs').textContent = String(s).padStart(2,'0');
    }
    setInterval(update, 1000);
    update();
  </script>
</body>
</html>`;
}

function generatePomodoroHTML(config) {
  const { name, colors } = config;
  const primaryColor = colors?.primary || '#dc2626';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || 'Pomodoro Timer'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #fef2f2;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container { text-align: center; padding: 2rem; }
    .timer-display {
      font-size: 6rem;
      font-weight: 200;
      color: ${primaryColor};
      margin: 2rem 0;
    }
    .mode-tabs { display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 2rem; }
    .tab {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 999px;
      background: #fee2e2;
      color: ${primaryColor};
      font-weight: 500;
      cursor: pointer;
    }
    .tab.active { background: ${primaryColor}; color: white; }
    .controls { display: flex; gap: 1rem; justify-content: center; }
    .btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-start { background: ${primaryColor}; color: white; }
    .btn-reset { background: #fee2e2; color: ${primaryColor}; }
    .sessions { margin-top: 2rem; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <h1 style="color:${primaryColor};margin-bottom:1rem;">🍅 Pomodoro</h1>
    <div class="mode-tabs">
      <button class="tab active" onclick="setMode('work')">Work</button>
      <button class="tab" onclick="setMode('short')">Short Break</button>
      <button class="tab" onclick="setMode('long')">Long Break</button>
    </div>
    <div class="timer-display" id="timer">25:00</div>
    <div class="controls">
      <button class="btn btn-start" id="startBtn" onclick="toggleTimer()">Start</button>
      <button class="btn btn-reset" onclick="resetTimer()">Reset</button>
    </div>
    <div class="sessions">Sessions: <span id="sessions">0</span></div>
  </div>
  <script>
    const times = { work: 25*60, short: 5*60, long: 15*60 };
    let mode = 'work', timeLeft = times.work, running = false, sessions = 0, interval;

    function updateDisplay() {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      document.getElementById('timer').textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    }

    function setMode(m) {
      mode = m;
      timeLeft = times[m];
      running = false;
      clearInterval(interval);
      document.getElementById('startBtn').textContent = 'Start';
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      event.target.classList.add('active');
      updateDisplay();
    }

    function toggleTimer() {
      running = !running;
      document.getElementById('startBtn').textContent = running ? 'Pause' : 'Start';
      if (running) {
        interval = setInterval(() => {
          timeLeft--;
          if (timeLeft <= 0) {
            clearInterval(interval);
            running = false;
            if (mode === 'work') sessions++;
            document.getElementById('sessions').textContent = sessions;
            alert((mode === 'work' ? 'Work' : 'Break') + ' complete!');
          }
          updateDisplay();
        }, 1000);
      } else { clearInterval(interval); }
    }

    function resetTimer() { timeLeft = times[mode]; running = false; clearInterval(interval); document.getElementById('startBtn').textContent = 'Start'; updateDisplay(); }
    updateDisplay();
  </script>
</body>
</html>`;
}

function generateWordCounterHTML(config) {
  const { colors } = config;
  const primaryColor = colors?.primary || '#2563eb';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Word Counter</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #eff6ff;
      min-height: 100vh;
      padding: 2rem;
    }
    .container { max-width: 700px; margin: 0 auto; }
    h1 { color: ${primaryColor}; margin-bottom: 1.5rem; }
    textarea {
      width: 100%;
      height: 300px;
      padding: 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 1rem;
      resize: vertical;
    }
    textarea:focus { outline: none; border-color: ${primaryColor}; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .stat {
      background: white;
      padding: 1.25rem;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .stat-value { font-size: 2rem; font-weight: 700; color: ${primaryColor}; }
    .stat-label { font-size: 0.8rem; color: #6b7280; margin-top: 0.25rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Word Counter</h1>
    <textarea id="text" placeholder="Paste or type your text here..."></textarea>
    <div class="stats">
      <div class="stat"><div class="stat-value" id="words">0</div><div class="stat-label">Words</div></div>
      <div class="stat"><div class="stat-value" id="chars">0</div><div class="stat-label">Characters</div></div>
      <div class="stat"><div class="stat-value" id="sentences">0</div><div class="stat-label">Sentences</div></div>
      <div class="stat"><div class="stat-value" id="paragraphs">0</div><div class="stat-label">Paragraphs</div></div>
      <div class="stat"><div class="stat-value" id="readTime">0</div><div class="stat-label">Min Read</div></div>
    </div>
  </div>
  <script>
    const textarea = document.getElementById('text');
    textarea.addEventListener('input', count);

    function count() {
      const text = textarea.value;
      const words = text.trim() ? text.trim().split(/\\s+/).length : 0;
      const chars = text.length;
      const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
      const paragraphs = text.split(/\\n\\n+/).filter(p => p.trim()).length;
      const readTime = Math.ceil(words / 200);

      document.getElementById('words').textContent = words;
      document.getElementById('chars').textContent = chars;
      document.getElementById('sentences').textContent = sentences;
      document.getElementById('paragraphs').textContent = paragraphs;
      document.getElementById('readTime').textContent = readTime;
    }
  </script>
</body>
</html>`;
}

function generatePasswordGeneratorHTML(config) {
  const { colors } = config;
  const primaryColor = colors?.primary || '#dc2626';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Generator</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #fef2f2;
      min-height: 100vh;
      padding: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 2rem;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    h1 { color: ${primaryColor}; margin-bottom: 1.5rem; text-align: center; }
    .password-display {
      background: #f3f4f6;
      padding: 1rem;
      border-radius: 12px;
      font-family: monospace;
      font-size: 1.25rem;
      text-align: center;
      word-break: break-all;
      margin-bottom: 1rem;
      min-height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-copy {
      width: 100%;
      padding: 1rem;
      background: ${primaryColor};
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-bottom: 1.5rem;
    }
    .option { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .option input[type="checkbox"] { width: 20px; height: 20px; accent-color: ${primaryColor}; }
    .option label { flex: 1; }
    .slider-container { margin-top: 1rem; }
    .slider-label { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    input[type="range"] { width: 100%; accent-color: ${primaryColor}; }
    .btn-generate {
      width: 100%;
      padding: 1rem;
      background: #fee2e2;
      color: ${primaryColor};
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔐 Password Generator</h1>
    <div class="password-display" id="password">Click Generate</div>
    <button class="btn-copy" onclick="copyPassword()">Copy to Clipboard</button>

    <div class="option">
      <input type="checkbox" id="upper" checked>
      <label for="upper">Uppercase (A-Z)</label>
    </div>
    <div class="option">
      <input type="checkbox" id="lower" checked>
      <label for="lower">Lowercase (a-z)</label>
    </div>
    <div class="option">
      <input type="checkbox" id="numbers" checked>
      <label for="numbers">Numbers (0-9)</label>
    </div>
    <div class="option">
      <input type="checkbox" id="symbols" checked>
      <label for="symbols">Symbols (!@#$)</label>
    </div>

    <div class="slider-container">
      <div class="slider-label">
        <span>Length</span>
        <span id="lengthValue">16</span>
      </div>
      <input type="range" id="length" min="8" max="64" value="16" oninput="document.getElementById('lengthValue').textContent=this.value">
    </div>

    <button class="btn-generate" onclick="generate()">Generate Password</button>
  </div>
  <script>
    function generate() {
      const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lower = 'abcdefghijklmnopqrstuvwxyz';
      const nums = '0123456789';
      const syms = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      let chars = '';
      if (document.getElementById('upper').checked) chars += upper;
      if (document.getElementById('lower').checked) chars += lower;
      if (document.getElementById('numbers').checked) chars += nums;
      if (document.getElementById('symbols').checked) chars += syms;

      if (!chars) { alert('Select at least one option'); return; }

      const len = document.getElementById('length').value;
      let password = '';
      for (let i = 0; i < len; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      document.getElementById('password').textContent = password;
    }

    function copyPassword() {
      const pw = document.getElementById('password').textContent;
      if (pw && pw !== 'Click Generate') {
        navigator.clipboard.writeText(pw);
        alert('Copied!');
      }
    }

    generate();
  </script>
</body>
</html>`;
}

// ============================================
// TOOL SUITE GENERATION
// ============================================

/**
 * Determines the best organization style based on tool count
 */
function getSuiteOrganization(toolCount) {
  if (toolCount <= 4) {
    return { type: 'tabbed', description: 'Tabbed interface - all tools on one page' };
  } else if (toolCount <= 8) {
    return { type: 'grid', description: 'Index grid with separate pages' };
  } else {
    return { type: 'sidebar', description: 'Categorized sidebar navigation' };
  }
}

/**
 * Groups tools by category for sidebar navigation
 */
function groupToolsByCategory(tools) {
  const groups = {};
  tools.forEach(tool => {
    const category = tool.category || 'General';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(tool);
  });
  return groups;
}

/**
 * Generates shared CSS for the suite
 */
function generateSuiteStyles(branding) {
  const primary = branding?.colors?.primary || '#6366f1';
  const accent = branding?.colors?.accent || '#8b5cf6';
  const style = branding?.style || 'modern';

  const stylePresets = {
    modern: {
      radius: '12px',
      shadow: '0 4px 20px rgba(0,0,0,0.1)',
      font: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontImport: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
    },
    minimal: {
      radius: '4px',
      shadow: '0 1px 3px rgba(0,0,0,0.08)',
      font: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
      fontImport: null
    },
    playful: {
      radius: '20px',
      shadow: '0 8px 30px rgba(0,0,0,0.12)',
      font: "'Poppins', 'Comic Sans MS', sans-serif",
      fontImport: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
    },
    professional: {
      radius: '6px',
      shadow: '0 2px 8px rgba(0,0,0,0.06)',
      font: "'Roboto', 'Helvetica Neue', sans-serif",
      fontImport: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
    },
    luxury: {
      radius: '8px',
      shadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
      font: "'Montserrat', sans-serif",
      titleFont: "'Cormorant Garamond', serif",
      fontImport: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Montserrat:wght@300;400;500;600&display=swap",
      darkMode: true
    },
    classic: {
      radius: '6px',
      shadow: '0 4px 16px rgba(0,0,0,0.08)',
      font: "'Merriweather', Georgia, serif",
      fontImport: "https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap"
    },
    futuristic: {
      radius: '0px',
      shadow: '0 0 30px rgba(99, 102, 241, 0.3)',
      font: "'Orbitron', monospace",
      fontImport: "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&display=swap"
    }
  };

  const preset = stylePresets[style] || stylePresets.modern;
  const isDarkMode = preset.darkMode === true;
  const fontImport = preset.fontImport ? `@import url('${preset.fontImport}');` : '';

  return `
    ${fontImport}

    :root {
      --primary: ${primary};
      --accent: ${accent};
      --primary-light: ${primary}20;
      --radius: ${preset.radius};
      --shadow: ${preset.shadow};
      --font: ${preset.font};
      ${preset.titleFont ? `--title-font: ${preset.titleFont};` : ''}
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: var(--font);
      background: ${isDarkMode ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' : 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)'};
      min-height: 100vh;
      color: ${isDarkMode ? '#e0e0e0' : '#333'};
    }

    .suite-header {
      background: ${isDarkMode ? '#1f1f1f' : 'white'};
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: var(--shadow);
      position: sticky;
      ${isDarkMode ? 'border-bottom: 1px solid rgba(201, 169, 98, 0.3);' : ''}
      top: 0;
      z-index: 100;
    }

    .suite-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .suite-logo img {
      height: 40px;
      width: auto;
    }

    .suite-logo-placeholder {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: white;
    }

    .suite-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: ${isDarkMode ? 'var(--primary)' : '#333'};
      ${isDarkMode && preset.titleFont ? 'font-family: var(--title-font);' : ''}
    }

    .suite-nav {
      display: flex;
      gap: 8px;
    }

    .suite-nav a {
      padding: 8px 16px;
      text-decoration: none;
      color: ${isDarkMode ? '#aaa' : '#666'};
      border-radius: var(--radius);
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .suite-nav a:hover, .suite-nav a.active {
      background: ${isDarkMode ? 'rgba(201, 169, 98, 0.15)' : 'var(--primary-light)'};
      color: var(--primary);
    }

    .suite-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    .suite-hero {
      text-align: center;
      padding: 40px 20px;
      margin-bottom: 32px;
    }

    .suite-hero h1 {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 12px;
      ${isDarkMode ? `color: var(--primary); font-family: var(--title-font);` : `background: linear-gradient(135deg, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;`}
    }

    .suite-hero p {
      font-size: 1.1rem;
      color: ${isDarkMode ? '#888' : '#666'};
      max-width: 600px;
      margin: 0 auto;
    }

    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .tool-card {
      background: ${isDarkMode ? 'linear-gradient(145deg, #1f1f1f 0%, #2a2a2a 100%)' : 'white'};
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      transition: all 0.3s ease;
      text-decoration: none;
      color: inherit;
      display: block;
      ${isDarkMode ? 'border: 1px solid rgba(201, 169, 98, 0.2);' : ''}
    }

    .tool-card:hover {
      transform: translateY(-4px);
      box-shadow: ${isDarkMode ? '0 12px 40px rgba(0,0,0,0.3)' : '0 12px 40px rgba(0,0,0,0.15)'};
      ${isDarkMode ? 'border-color: var(--primary);' : ''}
    }

    .tool-card-icon {
      width: 56px;
      height: 56px;
      background: var(--primary-light);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      margin-bottom: 16px;
    }

    .tool-card h3 {
      font-size: 1.15rem;
      font-weight: 600;
      margin-bottom: 8px;
      ${isDarkMode && preset.titleFont ? 'font-family: var(--title-font);' : ''}
    }

    .tool-card p {
      font-size: 0.9rem;
      color: ${isDarkMode ? '#888' : '#666'};
      line-height: 1.5;
    }

    .tool-card-arrow {
      margin-top: 16px;
      color: var(--primary);
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Tabbed interface styles */
    .tabs-container {
      background: ${isDarkMode ? 'linear-gradient(145deg, #1f1f1f 0%, #2a2a2a 100%)' : 'white'};
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
      ${isDarkMode ? 'border: 1px solid rgba(201, 169, 98, 0.3);' : ''}
    }

    .tabs-nav {
      display: flex;
      background: ${isDarkMode ? '#1a1a1a' : '#f8fafc'};
      border-bottom: 1px solid ${isDarkMode ? 'rgba(201, 169, 98, 0.2)' : '#e2e8f0'};
      overflow-x: auto;
    }

    .tab-btn {
      padding: 16px 24px;
      border: none;
      background: none;
      font-size: 0.95rem;
      font-weight: 500;
      color: ${isDarkMode ? '#888' : '#666'};
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      color: var(--primary);
      background: ${isDarkMode ? 'rgba(201, 169, 98, 0.1)' : 'var(--primary-light)'};
    }

    .tab-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
      background: ${isDarkMode ? '#2a2a2a' : 'white'};
    }

    .tab-content {
      display: none;
      padding: 24px;
    }

    .tab-content.active {
      display: block;
    }

    /* Sidebar navigation styles */
    .suite-layout-sidebar {
      display: grid;
      grid-template-columns: 260px 1fr;
      min-height: calc(100vh - 72px);
    }

    .suite-sidebar {
      background: ${isDarkMode ? '#1f1f1f' : 'white'};
      border-right: 1px solid ${isDarkMode ? 'rgba(201, 169, 98, 0.2)' : '#e2e8f0'};
      padding: 24px 0;
      position: sticky;
      top: 72px;
      height: calc(100vh - 72px);
      overflow-y: auto;
    }

    .sidebar-category {
      margin-bottom: 24px;
    }

    .sidebar-category-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #999;
      padding: 0 24px;
      margin-bottom: 8px;
    }

    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 24px;
      text-decoration: none;
      color: #555;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .sidebar-link:hover, .sidebar-link.active {
      background: var(--primary-light);
      color: var(--primary);
    }

    .sidebar-link-icon {
      font-size: 1.2rem;
    }

    .suite-main {
      padding: 32px;
    }

    /* Tool page styles */
    .tool-page-header {
      margin-bottom: 24px;
    }

    .tool-page-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .tool-page-header p {
      color: #666;
      margin-top: 8px;
    }

    .tool-frame {
      background: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 24px;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--primary);
      text-decoration: none;
      font-size: 0.9rem;
      margin-bottom: 24px;
    }

    .back-link:hover {
      text-decoration: underline;
    }
  `;
}

/**
 * Generates the tabbed interface HTML (for 2-4 tools)
 */
function generateTabbedSuite(tools, branding) {
  const businessName = branding?.businessName || 'Tool Suite';
  const logo = branding?.logo;

  const tabsHtml = tools.map((tool, i) => `
    <button class="tab-btn ${i === 0 ? 'active' : ''}" onclick="showTab('tab-${i}')">
      <span>${tool.icon || '🔧'}</span>
      ${tool.name}
    </button>
  `).join('');

  const contentHtml = tools.map((tool, i) => `
    <div id="tab-${i}" class="tab-content ${i === 0 ? 'active' : ''}">
      ${generateEmbeddedTool(tool, branding)}
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName} - Tools</title>
  <style>${generateSuiteStyles(branding)}</style>
</head>
<body>
  <header class="suite-header">
    <div class="suite-logo">
      ${logo ? `<img src="${logo}" alt="${businessName}">` : `<div class="suite-logo-placeholder">${businessName.charAt(0)}</div>`}
      <span class="suite-title">${businessName}</span>
    </div>
  </header>

  <div class="suite-container">
    <div class="suite-hero">
      <h1>${businessName} Tools</h1>
      <p>Your complete toolkit with ${tools.length} essential tools</p>
    </div>

    <div class="tabs-container">
      <div class="tabs-nav">
        ${tabsHtml}
      </div>
      ${contentHtml}
    </div>
  </div>

  <script>
    function showTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      event.target.closest('.tab-btn').classList.add('active');
    }
  </script>
</body>
</html>`;
}

/**
 * Generates the grid index page HTML (for 5-8 tools)
 */
function generateGridSuiteIndex(tools, branding) {
  const businessName = branding?.businessName || 'Tool Suite';
  const logo = branding?.logo;

  const cardsHtml = tools.map((tool, i) => `
    <a href="tools/${tool.key || tool.name.toLowerCase().replace(/\s+/g, '-')}.html" class="tool-card">
      <div class="tool-card-icon">${tool.icon || '🔧'}</div>
      <h3>${tool.name}</h3>
      <p>${tool.description || 'A useful tool for your business'}</p>
      <div class="tool-card-arrow">Open tool →</div>
    </a>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName} - Tools</title>
  <style>${generateSuiteStyles(branding)}</style>
</head>
<body>
  <header class="suite-header">
    <div class="suite-logo">
      ${logo ? `<img src="${logo}" alt="${businessName}">` : `<div class="suite-logo-placeholder">${businessName.charAt(0)}</div>`}
      <span class="suite-title">${businessName}</span>
    </div>
    <nav class="suite-nav">
      <a href="index.html" class="active">All Tools</a>
    </nav>
  </header>

  <div class="suite-container">
    <div class="suite-hero">
      <h1>${businessName} Toolkit</h1>
      <p>Your complete suite of ${tools.length} professional tools</p>
    </div>

    <div class="tools-grid">
      ${cardsHtml}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates the sidebar navigation index HTML (for 9+ tools)
 */
function generateSidebarSuiteIndex(tools, branding) {
  const businessName = branding?.businessName || 'Tool Suite';
  const logo = branding?.logo;
  const grouped = groupToolsByCategory(tools);

  const sidebarHtml = Object.entries(grouped).map(([category, categoryTools]) => `
    <div class="sidebar-category">
      <div class="sidebar-category-title">${category}</div>
      ${categoryTools.map(tool => `
        <a href="tools/${tool.key || tool.name.toLowerCase().replace(/\s+/g, '-')}.html" class="sidebar-link">
          <span class="sidebar-link-icon">${tool.icon || '🔧'}</span>
          ${tool.name}
        </a>
      `).join('')}
    </div>
  `).join('');

  const cardsHtml = tools.map(tool => `
    <a href="tools/${tool.key || tool.name.toLowerCase().replace(/\s+/g, '-')}.html" class="tool-card">
      <div class="tool-card-icon">${tool.icon || '🔧'}</div>
      <h3>${tool.name}</h3>
      <p>${tool.description || 'A useful tool for your business'}</p>
      <div class="tool-card-arrow">Open tool →</div>
    </a>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName} - Tools</title>
  <style>${generateSuiteStyles(branding)}</style>
</head>
<body>
  <header class="suite-header">
    <div class="suite-logo">
      ${logo ? `<img src="${logo}" alt="${businessName}">` : `<div class="suite-logo-placeholder">${businessName.charAt(0)}</div>`}
      <span class="suite-title">${businessName}</span>
    </div>
  </header>

  <div class="suite-layout-sidebar">
    <aside class="suite-sidebar">
      ${sidebarHtml}
    </aside>

    <main class="suite-main">
      <div class="suite-hero" style="text-align: left; padding: 0; margin-bottom: 32px;">
        <h1>${businessName} Toolkit</h1>
        <p>Browse your ${tools.length} professional tools by category</p>
      </div>

      <div class="tools-grid">
        ${cardsHtml}
      </div>
    </main>
  </div>
</body>
</html>`;
}

/**
 * Generates an individual tool page with suite navigation
 */
function generateSuiteToolPage(tool, allTools, branding, organization) {
  const businessName = branding?.businessName || 'Tool Suite';
  const logo = branding?.logo;
  const toolKey = tool.key || tool.name.toLowerCase().replace(/\s+/g, '-');

  // Generate navigation based on organization type
  let navHtml = '';
  if (organization.type === 'grid') {
    navHtml = `
      <nav class="suite-nav">
        <a href="../index.html">← All Tools</a>
        ${allTools.map(t => {
          const key = t.key || t.name.toLowerCase().replace(/\s+/g, '-');
          return `<a href="${key}.html" class="${key === toolKey ? 'active' : ''}">${t.icon || '🔧'} ${t.name}</a>`;
        }).join('')}
      </nav>
    `;
  } else if (organization.type === 'sidebar') {
    const grouped = groupToolsByCategory(allTools);
    navHtml = `
      <nav class="suite-nav">
        <a href="../index.html">← Dashboard</a>
      </nav>
    `;
  }

  // Get the specialized HTML for this tool (with style support)
  const toolHtml = generateSpecializedToolHTML(tool.key || tool.toolKey || 'generic', {
    name: tool.name,
    icon: tool.icon,
    description: tool.description,
    features: tool.features,
    fields: tool.fields,
    colors: branding?.colors,
    style: branding?.style || 'modern',
    branding: branding
  });

  // Extract body content, styles, and scripts from the tool HTML
  const bodyMatch = toolHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const styleMatch = toolHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  const scriptMatch = toolHtml.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);

  const toolBodyContent = bodyMatch ? bodyMatch[1] : toolHtml;
  const toolStyles = styleMatch ? styleMatch.join('\n') : '';
  const toolScripts = scriptMatch ? scriptMatch.join('\n') : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tool.name} - ${businessName}</title>
  <style>${generateSuiteStyles(branding)}</style>
  ${toolStyles}
  <style>
    .tool-embed { padding: 0; }
    .tool-embed .container { max-width: 100%; }
    .tool-embed .tool-container { margin: 0; max-width: 100%; }
  </style>
</head>
<body>
  <header class="suite-header">
    <div class="suite-logo">
      ${logo ? `<img src="${logo}" alt="${businessName}">` : `<div class="suite-logo-placeholder">${businessName.charAt(0)}</div>`}
      <span class="suite-title">${businessName}</span>
    </div>
    ${navHtml}
  </header>

  <div class="suite-container">
    <a href="../index.html" class="back-link">← Back to all tools</a>

    <div class="tool-page-header">
      <h1><span>${tool.icon || '🔧'}</span> ${tool.name}</h1>
      <p>${tool.description || ''}</p>
    </div>

    <div class="tool-frame tool-embed">
      ${toolBodyContent}
    </div>
  </div>
  ${toolScripts}
</body>
</html>`;
}

/**
 * Generates an embedded tool for tabbed interface (inline, no iframe)
 */
function generateEmbeddedTool(tool, branding = {}) {
  // Get the specialized HTML for this tool (with style support)
  const toolHtml = generateSpecializedToolHTML(tool.key || tool.toolKey || 'generic', {
    name: tool.name,
    icon: tool.icon,
    description: tool.description,
    features: tool.features,
    fields: tool.fields,
    colors: branding?.colors || tool.colors,
    style: branding?.style || 'modern',
    branding: branding
  });

  // Extract just the body content
  const bodyMatch = toolHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const styleMatch = toolHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  const scriptMatch = toolHtml.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);

  const toolContent = bodyMatch ? bodyMatch[1] : '';
  const toolStyles = styleMatch ? styleMatch.join('\n') : '';
  const toolScripts = scriptMatch ? scriptMatch.join('\n') : '';

  return `
    <div class="embedded-tool" id="tool-${tool.key || tool.name.toLowerCase().replace(/\s+/g, '-')}">
      ${toolStyles}
      ${toolContent}
      ${toolScripts}
    </div>
  `;
}

/**
 * Generates suite configuration JSON
 */
function generateSuiteConfig(tools, branding, organization) {
  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    businessName: branding?.businessName || 'Tool Suite',
    organization: organization.type,
    branding: {
      logo: branding?.logo || null,
      colors: branding?.colors || { primary: '#6366f1', accent: '#8b5cf6' },
      style: branding?.style || 'modern'
    },
    tools: tools.map(tool => ({
      key: tool.key || tool.name.toLowerCase().replace(/\s+/g, '-'),
      name: tool.name,
      icon: tool.icon,
      category: tool.category || 'General',
      description: tool.description,
      features: tool.features || []
    })),
    files: organization.type === 'tabbed'
      ? ['index.html', 'config.json']
      : ['index.html', 'config.json', ...tools.map(t => `tools/${t.key || t.name.toLowerCase().replace(/\s+/g, '-')}.html`)]
  };
}

/**
 * Main function to generate a complete Tool Suite
 * Returns an object with all generated files
 */
function generateToolSuite(tools, branding = {}, options = {}) {
  const organization = options.organization || getSuiteOrganization(tools.length);
  const files = {};

  // Ensure tools have keys
  const processedTools = tools.map(tool => ({
    ...tool,
    key: tool.key || tool.toolKey || tool.name.toLowerCase().replace(/\s+/g, '-'),
    category: tool.category || 'General'
  }));

  // Apply any custom ordering
  if (options.toolOrder && Array.isArray(options.toolOrder)) {
    processedTools.sort((a, b) => {
      const aIdx = options.toolOrder.indexOf(a.key);
      const bIdx = options.toolOrder.indexOf(b.key);
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  }

  // Apply category groupings if provided
  if (options.categoryGroups) {
    processedTools.forEach(tool => {
      if (options.categoryGroups[tool.key]) {
        tool.category = options.categoryGroups[tool.key];
      }
    });
  }

  // Generate index page based on organization
  if (organization.type === 'tabbed') {
    files['index.html'] = generateTabbedSuite(processedTools, branding);
  } else if (organization.type === 'grid') {
    files['index.html'] = generateGridSuiteIndex(processedTools, branding);
    // Generate individual tool pages
    processedTools.forEach(tool => {
      const filename = `tools/${tool.key}.html`;
      files[filename] = generateSuiteToolPage(tool, processedTools, branding, organization);
    });
  } else { // sidebar
    files['index.html'] = generateSidebarSuiteIndex(processedTools, branding);
    // Generate individual tool pages
    processedTools.forEach(tool => {
      const filename = `tools/${tool.key}.html`;
      files[filename] = generateSuiteToolPage(tool, processedTools, branding, organization);
    });
  }

  // Generate config
  files['config.json'] = JSON.stringify(generateSuiteConfig(processedTools, branding, organization), null, 2);

  return {
    files,
    organization,
    toolCount: processedTools.length,
    tools: processedTools
  };
}

module.exports = {
  orchestrate,
  validatePayload,
  preview,
  detectIntentType,
  detectIndustryFromInput,
  detectRecommendationIntent,
  recommendTools,
  generateToolHTML,
  generateSpecializedToolHTML,
  getModulesForTool,
  // Tool Suite exports
  generateToolSuite,
  getSuiteOrganization,
  generateSuiteStyles,
  generateSuiteConfig,
  groupToolsByCategory,
  // Constants
  VALID_INDUSTRIES,
  INDUSTRY_KEYWORDS,
  TOOL_KEYWORDS,
  TOOL_TEMPLATES,
  TOOL_CATEGORIES,
  MODULE_TOOL_MAPPING,
  RECOMMENDATION_INDUSTRIES,
  INDUSTRY_TOOL_SUGGESTIONS
};
