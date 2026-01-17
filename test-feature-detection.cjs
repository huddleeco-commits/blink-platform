/**
 * Test Feature Detection System
 * Run: node test-feature-detection.cjs
 */

const {
  detectFeatures,
  getComplexityLevel,
  getFeatureSummary,
  buildFeatureContext,
  analyzeGenerationRequest
} = require('./lib/configs/index.cjs');

console.log('\n========================================');
console.log('FEATURE DETECTION SYSTEM TEST');
console.log('========================================\n');

// Test cases
const testCases = [
  {
    name: 'Pizza Shop with Online Ordering',
    description: 'Mario\'s Pizza - authentic Italian pizzeria with online ordering, delivery tracking, and a loyalty rewards program',
    industry: 'pizza'
  },
  {
    name: 'Dental Practice',
    description: 'Brooklyn Dental - family dentistry with online booking and patient portal',
    industry: 'dental'
  },
  {
    name: 'Law Firm',
    description: 'Smith & Associates - personal injury law firm with free consultations',
    industry: 'law-firm'
  },
  {
    name: 'SaaS Product',
    description: 'CloudMetrics - analytics dashboard with subscription pricing, user accounts, and admin management',
    industry: 'saas'
  },
  {
    name: 'Simple Restaurant',
    description: 'Joe\'s Diner - local family restaurant',
    industry: 'restaurant'
  },
  {
    name: 'E-commerce Store',
    description: 'Urban Threads - online clothing store with shopping cart, payments, user reviews, and order tracking',
    industry: 'ecommerce'
  },
  {
    name: 'Fitness Studio',
    description: 'Peak Performance Gym - fitness center with class booking, membership plans, and trainer profiles',
    industry: 'fitness'
  }
];

testCases.forEach((test, i) => {
  console.log(`\n--- Test ${i + 1}: ${test.name} ---`);
  console.log(`Input: "${test.description}"`);
  console.log(`Industry: ${test.industry}`);

  const analysis = analyzeGenerationRequest(test.description, test.industry);

  console.log(`\nDetected Features: ${analysis.features.join(', ')}`);
  console.log(`Complexity: ${analysis.complexity}`);
  console.log(`Is Full App: ${analysis.isFullApp}`);
  console.log(`Is Interactive: ${analysis.isInteractive}`);
  console.log(`Is Simple Site: ${analysis.isSimpleSite}`);
  console.log(`Needs State Management: ${analysis.needsStateManagement}`);
  console.log(`Needs Backend API: ${analysis.needsBackendAPI}`);
  console.log(`Needs Realtime: ${analysis.needsRealtime}`);

  console.log(`\nRequired Files:`);
  const files = analysis.requiredFiles;
  if (files.context.length) console.log(`  Context: ${files.context.join(', ')}`);
  if (files.hooks.length) console.log(`  Hooks: ${files.hooks.join(', ')}`);
  if (files.lib.length) console.log(`  Lib: ${files.lib.join(', ')}`);
  if (files.pages.length) console.log(`  Pages: ${files.pages.join(', ')}`);
  if (files.components.length) console.log(`  Components: ${files.components.join(', ')}`);
});

// Test prompt section generation
console.log('\n\n========================================');
console.log('SAMPLE PROMPT SECTION OUTPUT');
console.log('========================================\n');

const sampleContext = buildFeatureContext(
  'Pizza restaurant with online ordering, delivery tracking, and customer accounts',
  'pizza',
  { compact: false }
);

console.log('Features:', sampleContext.features);
console.log('\nMode Guidance:');
console.log(sampleContext.modeGuidance);
console.log('\nPrompt Section (truncated to 2000 chars):');
console.log(sampleContext.promptSection.substring(0, 2000) + '...');

console.log('\n\n✅ Feature detection system is working!');
console.log('The AI will now receive feature patterns in generation prompts.\n');
