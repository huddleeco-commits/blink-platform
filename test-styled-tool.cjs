/**
 * Quick test to verify styled tool generation
 */

const { generateStyledTool, STYLE_PRESETS } = require('./lib/generators/styled-tool-generator.cjs');
const fs = require('fs');
const path = require('path');

console.log('Testing Styled Tool Generator...\n');

// Test Recipe Scaler in Luxury style
const config = {
  name: 'Recipe Scaler',
  style: 'luxury',
  colors: {
    primary: '#c9a962',
    primaryDark: '#b8984f',
    accent: '#d4b978',
    background: '#1a1a1a'
  },
  branding: {
    businessName: 'Artisan Bakery',
    logo: null
  }
};

console.log('Generating Recipe Scaler with Luxury style...');
const html = generateStyledTool('recipe-scaler', config);

if (html && html.includes('<!DOCTYPE html>')) {
  console.log('✅ Recipe Scaler generated successfully!');
  console.log(`   HTML length: ${html.length} characters`);

  // Check for key elements
  const checks = [
    ['Luxury styling', html.includes('Cormorant Garamond')],
    ['Gold color (#c9a962)', html.includes('#c9a962') || html.includes('c9a962')],
    ['Business name', html.includes('Artisan Bakery')],
    ['Form inputs', html.includes('form-input')],
    ['Result section', html.includes('result-card')],
    ['Calculate button', html.includes('btn-primary')],
    ['JavaScript logic', html.includes('<script>')]
  ];

  console.log('\nChecks:');
  checks.forEach(([name, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${name}`);
  });

  // Save to file for manual inspection
  const outputPath = path.join(__dirname, 'test-output-luxury-recipe-scaler.html');
  fs.writeFileSync(outputPath, html);
  console.log(`\n📄 Saved to: ${outputPath}`);
  console.log('   Open this file in a browser to see the result!');

} else {
  console.log('❌ Failed to generate Recipe Scaler');
  console.log('Output:', html?.substring(0, 200));
}

// Test available styles
console.log('\n\nAvailable Style Presets:');
Object.keys(STYLE_PRESETS).forEach(style => {
  console.log(`   - ${style}: ${STYLE_PRESETS[style].name}`);
});

console.log('\n✨ Test complete!');
