/**
 * Tool Tester Service
 *
 * Validates generated tool HTML for structure, functionality, and best practices.
 * Similar to site validation but specifically for self-contained HTML tools.
 */

// ============================================
// TEST RESULT TYPES
// ============================================

/**
 * @typedef {Object} TestResult
 * @property {string} name - Test name
 * @property {boolean} passed - Whether the test passed
 * @property {'error'|'warning'|'info'} severity - Severity level
 * @property {string} message - Description of result
 */

/**
 * @typedef {Object} TestSummary
 * @property {number} passed - Number of passed tests
 * @property {number} failed - Number of failed tests
 * @property {number} warnings - Number of warnings
 * @property {TestResult[]} details - Individual test results
 * @property {boolean} allPassed - Whether all critical tests passed
 */

// ============================================
// HTML PARSING UTILITIES
// ============================================

/**
 * Simple HTML parser to extract elements and content
 */
function parseHTML(html) {
  const result = {
    hasHtmlTag: /<html[\s>]/i.test(html),
    hasHeadTag: /<head[\s>]/i.test(html),
    hasBodyTag: /<body[\s>]/i.test(html),
    hasDoctype: /<!DOCTYPE\s+html>/i.test(html),

    // Extract title
    title: (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || null,

    // Check for viewport meta
    hasViewport: /<meta[^>]*viewport[^>]*>/i.test(html),

    // Check for embedded styles
    hasEmbeddedCSS: /<style[\s>]/i.test(html),
    styleContent: (html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []).join('\n'),

    // Check for embedded scripts
    hasEmbeddedJS: /<script[\s>]/i.test(html),
    scriptContent: (html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || []).join('\n'),

    // Check for external dependencies
    hasExternalCSS: /<link[^>]*rel=["']stylesheet["'][^>]*href=["']https?:\/\//i.test(html),
    hasExternalJS: /<script[^>]*src=["']https?:\/\//i.test(html),

    // Check for broken asset references
    hasLocalAssetRefs: /(?:src|href)=["'](?!https?:\/\/|data:|#|javascript:)[^"']+["']/gi.test(html),

    // Form elements
    hasForm: /<form[\s>]/i.test(html),
    hasInputs: /<input[\s>]/i.test(html),
    hasButtons: /<button[\s>]/i.test(html),
    hasSubmitButton: /<button[^>]*type=["']submit["'][^>]*>|<input[^>]*type=["']submit["'][^>]*>/i.test(html),

    // Specific input types
    hasNumberInputs: /<input[^>]*type=["']number["'][^>]*>/i.test(html),
    hasTextInputs: /<input[^>]*type=["']text["'][^>]*>/i.test(html),
    hasTextarea: /<textarea[\s>]/i.test(html),
    hasCheckboxes: /<input[^>]*type=["']checkbox["'][^>]*>/i.test(html),
    hasRangeInputs: /<input[^>]*type=["']range["'][^>]*>/i.test(html),
    hasDateInputs: /<input[^>]*type=["']date["'][^>]*>/i.test(html),
    hasColorInputs: /<input[^>]*type=["']color["'][^>]*>/i.test(html),

    // Display elements
    hasResultDisplay: /id=["']result|class=["'][^"']*result|\.result[-\s{]/i.test(html),
    hasDisplayElement: /id=["']display|class=["'][^"']*display|\.display[-\s{]/i.test(html),

    // Interactive elements
    hasClickHandlers: /onclick=["']/i.test(html) || /addEventListener\s*\(\s*["']click["']/i.test(html),
    hasEventListeners: /addEventListener/i.test(html),

    // Timer-specific
    hasTimerDisplay: /id=["']timer|class=["'][^"']*timer|setInterval|setTimeout/i.test(html),
    hasStartStopButtons: /(start|stop|pause|resume)/i.test(html),

    // Copy functionality
    hasCopyButton: /(copy|clipboard)/i.test(html),
    hasClipboardAPI: /navigator\.clipboard/i.test(html),

    // Print/Download
    hasPrintButton: /(print|download)/i.test(html),

    // Line items (for invoices)
    hasLineItems: /(line-item|lineitem|item-row|addItem|removeItem)/i.test(html),
    hasTotalCalculation: /(total|sum|subtotal|grand)/i.test(html),

    // Data entry/history
    hasDataEntry: /<form|<input|<textarea/i.test(html),
    hasHistoryArea: /(history|log|entries|records|list)/i.test(html),

    // Validation
    hasFormValidation: /(required|pattern=|minlength|maxlength|min=|max=|validate)/i.test(html),

    // Raw HTML for deeper analysis
    raw: html
  };

  return result;
}

/**
 * Check for potential JavaScript errors by scanning for common issues
 */
function checkJavaScriptIssues(scriptContent) {
  const issues = [];

  // Check for undefined variable references
  if (/\bundefined\b/.test(scriptContent) && !/typeof\s+\w+\s*===?\s*["']undefined["']/.test(scriptContent)) {
    issues.push('Potential undefined variable usage');
  }

  // Check for missing semicolons (potential issue)
  // This is a loose check - just flag if there are very few semicolons
  const lines = scriptContent.split('\n').filter(l => l.trim() && !l.trim().startsWith('//'));
  const semicolonCount = (scriptContent.match(/;/g) || []).length;
  if (lines.length > 10 && semicolonCount < lines.length / 3) {
    // This might be intentional (ASI), so just a warning
  }

  // Check for console.error usage (might indicate error handling)
  if (/console\.(error|warn)/.test(scriptContent)) {
    issues.push('Contains error/warning logging (not necessarily an issue)');
  }

  // Check for unclosed functions
  const openBraces = (scriptContent.match(/\{/g) || []).length;
  const closeBraces = (scriptContent.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    issues.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
  }

  return issues;
}

// ============================================
// UNIVERSAL TESTS (All Tools)
// ============================================

function runUniversalTests(parsed) {
  const results = [];

  // Test 1: Valid HTML structure
  results.push({
    name: 'Valid HTML structure',
    passed: parsed.hasHtmlTag && parsed.hasHeadTag && parsed.hasBodyTag,
    severity: 'error',
    message: parsed.hasHtmlTag && parsed.hasHeadTag && parsed.hasBodyTag
      ? 'Has required <html>, <head>, and <body> tags'
      : `Missing: ${!parsed.hasHtmlTag ? '<html> ' : ''}${!parsed.hasHeadTag ? '<head> ' : ''}${!parsed.hasBodyTag ? '<body>' : ''}`
  });

  // Test 2: DOCTYPE declaration
  results.push({
    name: 'DOCTYPE declaration',
    passed: parsed.hasDoctype,
    severity: 'warning',
    message: parsed.hasDoctype
      ? 'Has <!DOCTYPE html> declaration'
      : 'Missing DOCTYPE declaration (recommended for standards mode)'
  });

  // Test 3: Has title tag
  results.push({
    name: 'Has <title> tag',
    passed: !!parsed.title,
    severity: 'warning',
    message: parsed.title
      ? `Title: "${parsed.title}"`
      : 'Missing <title> tag (important for accessibility and SEO)'
  });

  // Test 4: Embedded CSS (no external deps)
  results.push({
    name: 'Has embedded CSS',
    passed: parsed.hasEmbeddedCSS,
    severity: 'error',
    message: parsed.hasEmbeddedCSS
      ? 'CSS is embedded in <style> tags (self-contained)'
      : 'No embedded CSS found - tool may not be styled'
  });

  // Test 5: No external CSS dependencies
  results.push({
    name: 'No external CSS dependencies',
    passed: !parsed.hasExternalCSS,
    severity: 'warning',
    message: parsed.hasExternalCSS
      ? 'Has external CSS links - may not work offline'
      : 'No external CSS dependencies (works offline)'
  });

  // Test 6: Embedded JS (no external deps)
  results.push({
    name: 'Has embedded JavaScript',
    passed: parsed.hasEmbeddedJS,
    severity: 'error',
    message: parsed.hasEmbeddedJS
      ? 'JavaScript is embedded in <script> tags (self-contained)'
      : 'No embedded JavaScript found - tool may not be interactive'
  });

  // Test 7: No external JS dependencies
  results.push({
    name: 'No external JS dependencies',
    passed: !parsed.hasExternalJS,
    severity: 'warning',
    message: parsed.hasExternalJS
      ? 'Has external script links - may not work offline'
      : 'No external JavaScript dependencies (works offline)'
  });

  // Test 8: Responsive viewport meta
  results.push({
    name: 'Responsive viewport',
    passed: parsed.hasViewport,
    severity: 'warning',
    message: parsed.hasViewport
      ? 'Has responsive viewport meta tag'
      : 'Missing viewport meta tag (may not display well on mobile)'
  });

  // Test 9: No broken local asset references
  // This is tricky - we want to ensure no src="./something" that won't work
  const hasProblematicRefs = /(?:src|href)=["']\.?\//i.test(parsed.raw);
  results.push({
    name: 'No broken asset references',
    passed: !hasProblematicRefs,
    severity: 'warning',
    message: hasProblematicRefs
      ? 'Contains relative asset references that may not work standalone'
      : 'No problematic asset references'
  });

  // Test 10: JavaScript syntax check
  const jsIssues = checkJavaScriptIssues(parsed.scriptContent);
  const hasCriticalJsIssues = jsIssues.some(i => i.includes('Mismatched braces'));
  results.push({
    name: 'JavaScript syntax check',
    passed: !hasCriticalJsIssues,
    severity: hasCriticalJsIssues ? 'error' : 'info',
    message: jsIssues.length === 0
      ? 'No obvious JavaScript issues detected'
      : `Potential issues: ${jsIssues.join('; ')}`
  });

  return results;
}

// ============================================
// TOOL-SPECIFIC TESTS
// ============================================

function runCalculatorTests(parsed) {
  const results = [];

  results.push({
    name: 'Calculator: Has number inputs',
    passed: parsed.hasNumberInputs || parsed.hasTextInputs,
    severity: 'error',
    message: parsed.hasNumberInputs
      ? 'Has number input fields'
      : parsed.hasTextInputs
        ? 'Has text input fields (acceptable for calculator)'
        : 'Missing input fields for calculations'
  });

  results.push({
    name: 'Calculator: Has calculate button',
    passed: parsed.hasButtons && parsed.hasClickHandlers,
    severity: 'error',
    message: parsed.hasButtons && parsed.hasClickHandlers
      ? 'Has interactive button(s) with click handlers'
      : 'Missing calculate button or click functionality'
  });

  results.push({
    name: 'Calculator: Has result display',
    passed: parsed.hasResultDisplay || parsed.hasDisplayElement,
    severity: 'error',
    message: parsed.hasResultDisplay || parsed.hasDisplayElement
      ? 'Has result/display element'
      : 'Missing result display area'
  });

  return results;
}

function runInvoiceTests(parsed) {
  const results = [];

  results.push({
    name: 'Invoice: Has line item fields',
    passed: parsed.hasLineItems || (parsed.hasInputs && parsed.hasButtons),
    severity: 'error',
    message: parsed.hasLineItems
      ? 'Has line item functionality'
      : parsed.hasInputs
        ? 'Has input fields for data entry'
        : 'Missing line item fields'
  });

  results.push({
    name: 'Invoice: Has total calculation',
    passed: parsed.hasTotalCalculation,
    severity: 'error',
    message: parsed.hasTotalCalculation
      ? 'Has total/sum calculation'
      : 'Missing total calculation display'
  });

  results.push({
    name: 'Invoice: Has print/download',
    passed: parsed.hasPrintButton,
    severity: 'warning',
    message: parsed.hasPrintButton
      ? 'Has print or download functionality'
      : 'Missing print/download option (recommended)'
  });

  return results;
}

function runTimerTests(parsed) {
  const results = [];

  results.push({
    name: 'Timer: Has time display',
    passed: parsed.hasTimerDisplay,
    severity: 'error',
    message: parsed.hasTimerDisplay
      ? 'Has timer display element'
      : 'Missing time display'
  });

  results.push({
    name: 'Timer: Has start/stop buttons',
    passed: parsed.hasStartStopButtons && parsed.hasButtons,
    severity: 'error',
    message: parsed.hasStartStopButtons && parsed.hasButtons
      ? 'Has start/stop control buttons'
      : 'Missing timer control buttons'
  });

  results.push({
    name: 'Timer: Uses timer functions',
    passed: /setInterval|setTimeout/.test(parsed.scriptContent),
    severity: 'error',
    message: /setInterval|setTimeout/.test(parsed.scriptContent)
      ? 'Uses JavaScript timer functions'
      : 'Missing setInterval/setTimeout for timing'
  });

  return results;
}

function runPasswordGeneratorTests(parsed) {
  const results = [];

  results.push({
    name: 'Password: Has output field',
    passed: parsed.hasResultDisplay || parsed.hasDisplayElement || /password/i.test(parsed.raw),
    severity: 'error',
    message: parsed.hasResultDisplay || parsed.hasDisplayElement
      ? 'Has password output display'
      : 'Missing password output field'
  });

  results.push({
    name: 'Password: Has generate button',
    passed: parsed.hasButtons && /generate/i.test(parsed.raw),
    severity: 'error',
    message: parsed.hasButtons && /generate/i.test(parsed.raw)
      ? 'Has generate button'
      : 'Missing generate button'
  });

  results.push({
    name: 'Password: Has copy button',
    passed: parsed.hasCopyButton || parsed.hasClipboardAPI,
    severity: 'warning',
    message: parsed.hasCopyButton || parsed.hasClipboardAPI
      ? 'Has copy to clipboard functionality'
      : 'Missing copy button (recommended)'
  });

  return results;
}

function runFormTests(parsed) {
  const results = [];

  results.push({
    name: 'Form: Has input fields',
    passed: parsed.hasInputs || parsed.hasTextarea,
    severity: 'error',
    message: parsed.hasInputs || parsed.hasTextarea
      ? 'Has form input fields'
      : 'Missing form input fields'
  });

  results.push({
    name: 'Form: Has submit button',
    passed: parsed.hasButtons || parsed.hasSubmitButton,
    severity: 'error',
    message: parsed.hasButtons || parsed.hasSubmitButton
      ? 'Has submit/action button'
      : 'Missing submit button'
  });

  results.push({
    name: 'Form: Has validation',
    passed: parsed.hasFormValidation,
    severity: 'warning',
    message: parsed.hasFormValidation
      ? 'Has form validation attributes'
      : 'No form validation detected (recommended)'
  });

  return results;
}

function runTrackerTests(parsed) {
  const results = [];

  results.push({
    name: 'Tracker: Has data entry',
    passed: parsed.hasDataEntry,
    severity: 'error',
    message: parsed.hasDataEntry
      ? 'Has data entry capability (forms/inputs)'
      : 'Missing data entry mechanism'
  });

  results.push({
    name: 'Tracker: Has display/history area',
    passed: parsed.hasHistoryArea || parsed.hasResultDisplay,
    severity: 'warning',
    message: parsed.hasHistoryArea || parsed.hasResultDisplay
      ? 'Has data display/history area'
      : 'Missing history or data display area'
  });

  results.push({
    name: 'Tracker: Has add/submit functionality',
    passed: parsed.hasButtons && parsed.hasClickHandlers,
    severity: 'error',
    message: parsed.hasButtons && parsed.hasClickHandlers
      ? 'Has interactive add/submit functionality'
      : 'Missing add/submit button'
  });

  return results;
}

function runConverterTests(parsed) {
  const results = [];

  results.push({
    name: 'Converter: Has input field',
    passed: parsed.hasNumberInputs || parsed.hasTextInputs,
    severity: 'error',
    message: parsed.hasNumberInputs || parsed.hasTextInputs
      ? 'Has input field for value entry'
      : 'Missing input field'
  });

  results.push({
    name: 'Converter: Has output display',
    passed: parsed.hasResultDisplay || parsed.hasDisplayElement,
    severity: 'error',
    message: parsed.hasResultDisplay || parsed.hasDisplayElement
      ? 'Has converted value display'
      : 'Missing output display'
  });

  results.push({
    name: 'Converter: Has unit selection',
    passed: /<select[\s>]/i.test(parsed.raw) || parsed.hasButtons,
    severity: 'warning',
    message: /<select[\s>]/i.test(parsed.raw) || parsed.hasButtons
      ? 'Has unit selection mechanism'
      : 'Missing unit selection (dropdown or buttons)'
  });

  return results;
}

function runCountdownTests(parsed) {
  const results = [];

  results.push({
    name: 'Countdown: Has date/time input',
    passed: parsed.hasDateInputs || /datetime|target.*date/i.test(parsed.raw),
    severity: 'warning',
    message: parsed.hasDateInputs || /datetime|target.*date/i.test(parsed.raw)
      ? 'Has date/time input for target'
      : 'May be using fixed countdown (no date input)'
  });

  results.push({
    name: 'Countdown: Has time display',
    passed: /(days|hours|mins|secs|minutes|seconds)/i.test(parsed.raw),
    severity: 'error',
    message: /(days|hours|mins|secs|minutes|seconds)/i.test(parsed.raw)
      ? 'Has time unit displays (days, hours, etc.)'
      : 'Missing time unit displays'
  });

  results.push({
    name: 'Countdown: Updates in real-time',
    passed: /setInterval/.test(parsed.scriptContent),
    severity: 'error',
    message: /setInterval/.test(parsed.scriptContent)
      ? 'Uses setInterval for real-time updates'
      : 'Missing real-time update mechanism'
  });

  return results;
}

function runWordCounterTests(parsed) {
  const results = [];

  results.push({
    name: 'Word Counter: Has text input area',
    passed: parsed.hasTextarea,
    severity: 'error',
    message: parsed.hasTextarea
      ? 'Has textarea for text input'
      : 'Missing textarea for text input'
  });

  results.push({
    name: 'Word Counter: Has count display',
    passed: /(words|chars|characters|sentences|paragraphs)/i.test(parsed.raw),
    severity: 'error',
    message: /(words|chars|characters|sentences|paragraphs)/i.test(parsed.raw)
      ? 'Has word/character count display'
      : 'Missing count display elements'
  });

  results.push({
    name: 'Word Counter: Updates on input',
    passed: /oninput|addEventListener.*input/i.test(parsed.raw),
    severity: 'warning',
    message: /oninput|addEventListener.*input/i.test(parsed.raw)
      ? 'Updates counts on input'
      : 'May not update in real-time'
  });

  return results;
}

// ============================================
// MAIN TEST FUNCTION
// ============================================

/**
 * Test a generated tool HTML
 * @param {string} toolHtml - The HTML content to test
 * @param {string} toolType - The type of tool (calculator, invoice, timer, etc.)
 * @returns {TestSummary} Test results summary
 */
function testTool(toolHtml, toolType) {
  if (!toolHtml || typeof toolHtml !== 'string') {
    return {
      passed: 0,
      failed: 1,
      warnings: 0,
      details: [{
        name: 'HTML Content',
        passed: false,
        severity: 'error',
        message: 'No HTML content provided for testing'
      }],
      allPassed: false
    };
  }

  // Parse the HTML
  const parsed = parseHTML(toolHtml);

  // Collect all test results
  const allResults = [];

  // Run universal tests
  allResults.push(...runUniversalTests(parsed));

  // Normalize tool type for matching
  const normalizedType = (toolType || '').toLowerCase().replace(/[-_\s]/g, '');

  // Run tool-specific tests based on type
  if (normalizedType.includes('calculator') || normalizedType.includes('calc')) {
    allResults.push(...runCalculatorTests(parsed));
  }

  if (normalizedType.includes('invoice') || normalizedType.includes('receipt')) {
    allResults.push(...runInvoiceTests(parsed));
  }

  if (normalizedType.includes('timer') || normalizedType.includes('pomodoro') || normalizedType.includes('stopwatch')) {
    allResults.push(...runTimerTests(parsed));
  }

  if (normalizedType.includes('countdown')) {
    allResults.push(...runCountdownTests(parsed));
  }

  if (normalizedType.includes('password') || normalizedType.includes('generator')) {
    if (normalizedType.includes('password')) {
      allResults.push(...runPasswordGeneratorTests(parsed));
    }
  }

  if (normalizedType.includes('form') || normalizedType.includes('survey') || normalizedType.includes('booking') || normalizedType.includes('contact')) {
    allResults.push(...runFormTests(parsed));
  }

  if (normalizedType.includes('tracker') || normalizedType.includes('log') || normalizedType.includes('habit')) {
    allResults.push(...runTrackerTests(parsed));
  }

  if (normalizedType.includes('converter') || normalizedType.includes('convert')) {
    allResults.push(...runConverterTests(parsed));
  }

  if (normalizedType.includes('word') && (normalizedType.includes('count') || normalizedType.includes('counter'))) {
    allResults.push(...runWordCounterTests(parsed));
  }

  // Calculate summary
  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed && r.severity === 'error').length;
  const warnings = allResults.filter(r => !r.passed && r.severity === 'warning').length;

  return {
    passed,
    failed,
    warnings,
    details: allResults,
    allPassed: failed === 0
  };
}

/**
 * Log test results to console in a formatted way
 * @param {TestSummary} results - Test results from testTool()
 * @param {string} toolName - Name of the tool for display
 */
function logTestResults(results, toolName = 'Tool') {
  console.log('');
  console.log('   TOOL VALIDATION');
  console.log('   ' + '─'.repeat(40));

  for (const test of results.details) {
    const icon = test.passed ? '✅' : (test.severity === 'error' ? '❌' : '⚠️');
    console.log(`   ${icon} ${test.name}`);
    if (!test.passed || test.severity === 'info') {
      console.log(`      ${test.message}`);
    }
  }

  console.log('   ' + '─'.repeat(40));

  if (results.allPassed) {
    console.log(`   ✅ All ${results.passed} tests passed!`);
  } else {
    console.log(`   📊 Results: ${results.passed} passed, ${results.failed} failed, ${results.warnings} warnings`);
  }
  console.log('');
}

/**
 * Get a simple pass/fail emoji summary
 */
function getTestSummaryEmoji(results) {
  if (results.allPassed && results.warnings === 0) {
    return '✅';
  } else if (results.allPassed) {
    return '⚠️';
  } else {
    return '❌';
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  testTool,
  logTestResults,
  getTestSummaryEmoji,
  parseHTML
};
