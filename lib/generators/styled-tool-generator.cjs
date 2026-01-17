/**
 * Styled Tool Generator
 * Generates fully functional, beautifully styled tools
 */

// ============================================
// STYLE PRESETS
// ============================================

const STYLE_PRESETS = {
  modern: {
    name: 'Modern',
    fonts: {
      heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    borderRadius: '12px',
    inputRadius: '8px',
    buttonRadius: '8px',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    shadowHover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    cardShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: '0.2s ease',
    getCSS: (colors) => `
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
        min-height: 100vh;
      }
      .tool-container {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        padding: 32px;
        max-width: 500px;
        margin: 40px auto;
      }
      .tool-header {
        text-align: center;
        margin-bottom: 28px;
      }
      .tool-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 8px 0;
      }
      .tool-subtitle {
        color: #6b7280;
        font-size: 0.95rem;
      }
      .form-group {
        margin-bottom: 20px;
      }
      .form-label {
        display: block;
        font-weight: 600;
        color: #374151;
        margin-bottom: 8px;
        font-size: 0.9rem;
      }
      .form-input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 1rem;
        transition: all 0.2s ease;
        background: #f9fafb;
      }
      .form-input:focus {
        outline: none;
        border-color: ${colors.primary};
        background: white;
        box-shadow: 0 0 0 3px ${colors.primary}20;
      }
      .btn-primary {
        width: 100%;
        padding: 14px 24px;
        background: ${colors.primary};
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .btn-primary:hover {
        background: ${colors.primaryDark || colors.primary};
        transform: translateY(-1px);
        box-shadow: 0 4px 12px ${colors.primary}40;
      }
      .result-card {
        margin-top: 24px;
        padding: 24px;
        background: linear-gradient(135deg, ${colors.primary}08 0%, ${colors.primary}15 100%);
        border: 1px solid ${colors.primary}30;
        border-radius: 12px;
        display: none;
      }
      .result-card.visible { display: block; }
      .result-title {
        font-weight: 600;
        color: ${colors.primary};
        margin-bottom: 16px;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .result-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 8px;
      }
      .result-detail {
        color: #6b7280;
        font-size: 0.9rem;
        margin-bottom: 4px;
      }
      .brand-footer {
        text-align: center;
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        color: #9ca3af;
        font-size: 0.8rem;
      }
    `
  },

  classic: {
    name: 'Classic',
    fonts: {
      heading: "'Georgia', 'Times New Roman', serif",
      body: "'Georgia', 'Times New Roman', serif"
    },
    borderRadius: '4px',
    inputRadius: '4px',
    buttonRadius: '4px',
    shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: '0.15s ease',
    getCSS: (colors) => `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+Pro:wght@400;600&display=swap');
      body {
        font-family: 'Source Sans Pro', Georgia, serif;
        background: #f5f5f0;
        min-height: 100vh;
      }
      .tool-container {
        background: white;
        border: 1px solid #d4d4c8;
        border-radius: 4px;
        padding: 40px;
        max-width: 480px;
        margin: 40px auto;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
      .tool-header {
        text-align: center;
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 2px solid ${colors.primary};
      }
      .tool-title {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 1.875rem;
        font-weight: 700;
        color: #2d2d2d;
        margin: 0 0 8px 0;
      }
      .tool-subtitle {
        color: #666;
        font-size: 1rem;
        font-style: italic;
      }
      .form-group {
        margin-bottom: 24px;
      }
      .form-label {
        display: block;
        font-weight: 600;
        color: #2d2d2d;
        margin-bottom: 8px;
        font-size: 0.95rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: 0.8rem;
      }
      .form-input {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        font-family: inherit;
        transition: border-color 0.15s ease;
      }
      .form-input:focus {
        outline: none;
        border-color: ${colors.primary};
      }
      .btn-primary {
        width: 100%;
        padding: 14px 24px;
        background: ${colors.primary};
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: background 0.15s ease;
      }
      .btn-primary:hover {
        background: ${colors.primaryDark || colors.primary};
      }
      .result-card {
        margin-top: 28px;
        padding: 28px;
        background: #fafaf8;
        border: 1px solid #d4d4c8;
        border-radius: 4px;
        display: none;
      }
      .result-card.visible { display: block; }
      .result-title {
        font-family: 'Playfair Display', Georgia, serif;
        font-weight: 600;
        color: ${colors.primary};
        margin-bottom: 16px;
        font-size: 1.1rem;
        border-bottom: 1px solid #e5e5e0;
        padding-bottom: 12px;
      }
      .result-value {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 2.25rem;
        font-weight: 700;
        color: #2d2d2d;
        margin-bottom: 12px;
      }
      .result-detail {
        color: #666;
        font-size: 0.95rem;
        margin-bottom: 6px;
      }
      .brand-footer {
        text-align: center;
        margin-top: 28px;
        padding-top: 20px;
        border-top: 1px solid #e5e5e0;
        color: #999;
        font-size: 0.85rem;
        font-style: italic;
      }
    `
  },

  futuristic: {
    name: 'Futuristic',
    fonts: {
      heading: "'Orbitron', 'Rajdhani', sans-serif",
      body: "'Rajdhani', 'Exo 2', sans-serif"
    },
    borderRadius: '16px',
    inputRadius: '12px',
    buttonRadius: '25px',
    shadow: '0 0 20px rgba(0, 200, 255, 0.3)',
    transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    getCSS: (colors) => `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600;700&display=swap');
      body {
        font-family: 'Rajdhani', sans-serif;
        background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
        min-height: 100vh;
        color: #e0e0e0;
      }
      .tool-container {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 36px;
        max-width: 500px;
        margin: 40px auto;
        box-shadow: 0 0 40px rgba(${parseInt(colors.primary.slice(1,3), 16)}, ${parseInt(colors.primary.slice(3,5), 16)}, ${parseInt(colors.primary.slice(5,7), 16)}, 0.2);
        position: relative;
        overflow: hidden;
      }
      .tool-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, ${colors.primary}, transparent);
      }
      .tool-header {
        text-align: center;
        margin-bottom: 32px;
      }
      .tool-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #fff;
        margin: 0 0 8px 0;
        text-transform: uppercase;
        letter-spacing: 3px;
        text-shadow: 0 0 20px ${colors.primary}80;
      }
      .tool-subtitle {
        color: ${colors.primary};
        font-size: 0.95rem;
        letter-spacing: 1px;
      }
      .form-group {
        margin-bottom: 24px;
      }
      .form-label {
        display: block;
        font-weight: 600;
        color: ${colors.primary};
        margin-bottom: 10px;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      .form-input {
        width: 100%;
        padding: 14px 18px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        font-size: 1.1rem;
        font-family: 'Rajdhani', sans-serif;
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
        transition: all 0.3s ease;
      }
      .form-input:focus {
        outline: none;
        border-color: ${colors.primary};
        box-shadow: 0 0 20px ${colors.primary}40;
        background: rgba(255, 255, 255, 0.08);
      }
      .form-input::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
      .btn-primary {
        width: 100%;
        padding: 16px 28px;
        background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark || colors.primary} 100%);
        color: white;
        border: none;
        border-radius: 25px;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 3px;
        font-family: 'Orbitron', sans-serif;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      .btn-primary::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        transition: left 0.5s;
      }
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 30px ${colors.primary}60;
      }
      .btn-primary:hover::before {
        left: 100%;
      }
      .result-card {
        margin-top: 28px;
        padding: 28px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid ${colors.primary}50;
        border-radius: 16px;
        display: none;
        position: relative;
      }
      .result-card.visible {
        display: block;
        animation: fadeIn 0.5s ease;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .result-title {
        font-family: 'Orbitron', sans-serif;
        font-weight: 700;
        color: ${colors.primary};
        margin-bottom: 16px;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 3px;
      }
      .result-value {
        font-family: 'Orbitron', sans-serif;
        font-size: 2.5rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: 12px;
        text-shadow: 0 0 30px ${colors.primary}80;
      }
      .result-detail {
        color: rgba(255, 255, 255, 0.7);
        font-size: 1rem;
        margin-bottom: 6px;
        letter-spacing: 0.5px;
      }
      .brand-footer {
        text-align: center;
        margin-top: 28px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.8rem;
        letter-spacing: 2px;
        text-transform: uppercase;
      }
    `
  },

  luxury: {
    name: 'Luxury',
    fonts: {
      heading: "'Cormorant Garamond', 'Playfair Display', serif",
      body: "'Montserrat', 'Lato', sans-serif"
    },
    borderRadius: '8px',
    inputRadius: '4px',
    buttonRadius: '4px',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    transition: '0.25s ease',
    getCSS: (colors) => `
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Montserrat:wght@300;400;500;600&display=swap');
      body {
        font-family: 'Montserrat', sans-serif;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        min-height: 100vh;
      }
      .tool-container {
        background: linear-gradient(145deg, #1f1f1f 0%, #2a2a2a 100%);
        border: 1px solid #c9a962;
        border-radius: 8px;
        padding: 48px;
        max-width: 480px;
        margin: 50px auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        position: relative;
      }
      .tool-container::before {
        content: '';
        position: absolute;
        top: 8px;
        left: 8px;
        right: 8px;
        bottom: 8px;
        border: 1px solid rgba(201, 169, 98, 0.2);
        border-radius: 4px;
        pointer-events: none;
      }
      .tool-header {
        text-align: center;
        margin-bottom: 40px;
      }
      .tool-title {
        font-family: 'Cormorant Garamond', serif;
        font-size: 2rem;
        font-weight: 600;
        color: #c9a962;
        margin: 0 0 12px 0;
        letter-spacing: 4px;
        text-transform: uppercase;
      }
      .tool-subtitle {
        color: #888;
        font-size: 0.85rem;
        font-weight: 300;
        letter-spacing: 2px;
        text-transform: uppercase;
      }
      .form-group {
        margin-bottom: 28px;
      }
      .form-label {
        display: block;
        font-weight: 500;
        color: #c9a962;
        margin-bottom: 12px;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      .form-input {
        width: 100%;
        padding: 16px 20px;
        border: 1px solid #444;
        border-radius: 4px;
        font-size: 1rem;
        font-family: 'Montserrat', sans-serif;
        background: #1a1a1a;
        color: #fff;
        transition: all 0.25s ease;
        font-weight: 300;
      }
      .form-input:focus {
        outline: none;
        border-color: #c9a962;
        box-shadow: 0 0 20px rgba(201, 169, 98, 0.15);
      }
      .form-input::placeholder {
        color: #666;
        font-weight: 300;
      }
      .btn-primary {
        width: 100%;
        padding: 18px 32px;
        background: linear-gradient(135deg, #c9a962 0%, #d4b978 50%, #c9a962 100%);
        background-size: 200% auto;
        color: #1a1a1a;
        border: none;
        border-radius: 4px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 3px;
        transition: all 0.25s ease;
      }
      .btn-primary:hover {
        background-position: right center;
        box-shadow: 0 8px 30px rgba(201, 169, 98, 0.3);
      }
      .result-card {
        margin-top: 36px;
        padding: 32px;
        background: rgba(201, 169, 98, 0.05);
        border: 1px solid rgba(201, 169, 98, 0.3);
        border-radius: 4px;
        display: none;
      }
      .result-card.visible { display: block; }
      .result-title {
        font-family: 'Cormorant Garamond', serif;
        font-weight: 600;
        color: #c9a962;
        margin-bottom: 20px;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 3px;
        border-bottom: 1px solid rgba(201, 169, 98, 0.3);
        padding-bottom: 12px;
      }
      .result-value {
        font-family: 'Cormorant Garamond', serif;
        font-size: 3rem;
        font-weight: 700;
        color: #c9a962;
        margin-bottom: 16px;
      }
      .result-detail {
        color: #999;
        font-size: 0.9rem;
        margin-bottom: 8px;
        font-weight: 300;
      }
      .brand-footer {
        text-align: center;
        margin-top: 36px;
        padding-top: 24px;
        border-top: 1px solid #333;
        color: #666;
        font-size: 0.75rem;
        letter-spacing: 2px;
        text-transform: uppercase;
      }
    `
  },

  minimal: {
    name: 'Minimal',
    fonts: {
      heading: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      body: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    },
    borderRadius: '2px',
    inputRadius: '0px',
    buttonRadius: '0px',
    shadow: 'none',
    transition: '0.15s ease',
    getCSS: (colors) => `
      body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        background: #fff;
        min-height: 100vh;
        color: #222;
      }
      .tool-container {
        background: white;
        border: none;
        padding: 60px 40px;
        max-width: 400px;
        margin: 60px auto;
      }
      .tool-header {
        text-align: left;
        margin-bottom: 48px;
      }
      .tool-title {
        font-size: 1.5rem;
        font-weight: 400;
        color: #222;
        margin: 0 0 8px 0;
        letter-spacing: -0.5px;
      }
      .tool-subtitle {
        color: #888;
        font-size: 0.9rem;
        font-weight: 300;
      }
      .form-group {
        margin-bottom: 32px;
      }
      .form-label {
        display: block;
        font-weight: 400;
        color: #222;
        margin-bottom: 12px;
        font-size: 0.9rem;
      }
      .form-input {
        width: 100%;
        padding: 12px 0;
        border: none;
        border-bottom: 1px solid #ddd;
        border-radius: 0;
        font-size: 1.1rem;
        font-family: inherit;
        background: transparent;
        transition: border-color 0.15s ease;
      }
      .form-input:focus {
        outline: none;
        border-color: ${colors.primary};
      }
      .form-input::placeholder {
        color: #ccc;
      }
      .btn-primary {
        width: 100%;
        padding: 14px 24px;
        background: ${colors.primary};
        color: white;
        border: none;
        border-radius: 0;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s ease;
        margin-top: 16px;
      }
      .btn-primary:hover {
        background: #222;
      }
      .result-card {
        margin-top: 48px;
        padding: 32px 0;
        background: transparent;
        border-top: 1px solid #eee;
        display: none;
      }
      .result-card.visible { display: block; }
      .result-title {
        font-weight: 400;
        color: #888;
        margin-bottom: 24px;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .result-value {
        font-size: 3rem;
        font-weight: 300;
        color: ${colors.primary};
        margin-bottom: 16px;
        letter-spacing: -1px;
      }
      .result-detail {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 8px;
      }
      .brand-footer {
        text-align: left;
        margin-top: 48px;
        padding-top: 24px;
        border-top: 1px solid #eee;
        color: #ccc;
        font-size: 0.8rem;
      }
    `
  }
};

// ============================================
// TOOL TEMPLATES WITH FULL LOGIC
// ============================================

const TOOL_GENERATORS = {
  'recipe-scaler': (config) => generateRecipeScaler(config),
  'tip-calculator': (config) => generateTipCalculator(config),
  'bmi-calculator': (config) => generateBMICalculator(config),
  'discount-calculator': (config) => generateDiscountCalculator(config),
  'percentage-calculator': (config) => generatePercentageCalculator(config),
  'unit-converter': (config) => generateUnitConverter(config),
  'age-calculator': (config) => generateAgeCalculator(config),
  'loan-calculator': (config) => generateLoanCalculator(config),
  'savings-calculator': (config) => generateSavingsCalculator(config),
  'calorie-calculator': (config) => generateCalorieCalculator(config),
  'grade-calculator': (config) => generateGradeCalculator(config),
  'mortgage-calculator': (config) => generateMortgageCalculator(config),
  'invoice-generator': (config) => generateQuoteCalculator({ ...config, name: config.name || 'Invoice Generator' }),
  'password-generator': (config) => generatePasswordGenerator(config),
  'countdown': (config) => generateCountdown(config),
  'word-counter': (config) => generateWordCounter(config),
  'inventory-tracker': (config) => generateInventoryTracker(config),
  'expense-tracker': (config) => generateExpenseTracker(config),
  'menu-generator': (config) => generateMenuGenerator(config),
  'booking-tool': (config) => generateBookingTool(config),
  'order-tracker': (config) => generateOrderTracker(config),
  'quote-calculator': (config) => generateQuoteCalculator(config)
};

// ============================================
// RECIPE SCALER (Test Case)
// ============================================

function generateRecipeScaler(config) {
  const { name, style, colors, branding } = config;
  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.modern;
  const css = stylePreset.getCSS(colors);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || 'Recipe Scaler'} | ${branding?.businessName || 'Kitchen Tools'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${css}

    .ingredient-list {
      margin-bottom: 24px;
    }
    .ingredient-item {
      display: grid;
      grid-template-columns: 80px 80px 1fr 40px;
      gap: 12px;
      margin-bottom: 12px;
      align-items: center;
    }
    .ingredient-item .form-input {
      margin: 0;
    }
    .add-ingredient {
      padding: 10px 16px;
      background: transparent;
      border: 1px dashed ${colors.primary}60;
      color: ${colors.primary};
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      width: 100%;
    }
    .add-ingredient:hover {
      background: ${colors.primary}10;
      border-style: solid;
    }
    .remove-btn {
      padding: 8px;
      background: #fee2e2;
      color: #dc2626;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
    }
    .scale-options {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .scale-btn {
      padding: 10px 16px;
      background: ${colors.primary}15;
      border: 1px solid ${colors.primary}30;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.9rem;
      color: ${colors.primary};
      transition: all 0.2s ease;
    }
    .scale-btn:hover, .scale-btn.active {
      background: ${colors.primary};
      color: white;
    }
    .result-ingredients {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .result-ingredient {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      background: rgba(255,255,255,0.5);
      border-radius: 8px;
    }
    .result-ingredient .amount {
      font-weight: 600;
      color: ${colors.primary};
    }
    .custom-scale {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .custom-scale .form-input {
      width: 100px;
    }
  </style>
</head>
<body>
  <div class="tool-container">
    <div class="tool-header">
      ${branding?.logo ? `<img src="${branding.logo}" alt="${branding.businessName}" style="height: 40px; margin-bottom: 16px;">` : ''}
      <h1 class="tool-title">${name || 'Recipe Scaler'}</h1>
      <p class="tool-subtitle">Scale your recipes to any serving size</p>
    </div>

    <form id="recipe-form">
      <div class="form-group">
        <label class="form-label">Original Servings</label>
        <input type="number" class="form-input" id="original-servings" value="4" min="1" required>
      </div>

      <div class="form-group">
        <label class="form-label">Ingredients</label>
        <div class="ingredient-list" id="ingredient-list">
          <div class="ingredient-item">
            <input type="number" class="form-input" placeholder="Amount" step="0.25" value="2">
            <select class="form-input" style="padding: 12px 8px;">
              <option value="cups">cups</option>
              <option value="tbsp">tbsp</option>
              <option value="tsp">tsp</option>
              <option value="oz">oz</option>
              <option value="lbs">lbs</option>
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="whole">whole</option>
            </select>
            <input type="text" class="form-input" placeholder="Ingredient name" value="flour">
            <button type="button" class="remove-btn" onclick="removeIngredient(this)">×</button>
          </div>
          <div class="ingredient-item">
            <input type="number" class="form-input" placeholder="Amount" step="0.25" value="1">
            <select class="form-input" style="padding: 12px 8px;">
              <option value="cups">cups</option>
              <option value="tbsp">tbsp</option>
              <option value="tsp">tsp</option>
              <option value="oz">oz</option>
              <option value="lbs">lbs</option>
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="whole">whole</option>
            </select>
            <input type="text" class="form-input" placeholder="Ingredient name" value="sugar">
            <button type="button" class="remove-btn" onclick="removeIngredient(this)">×</button>
          </div>
        </div>
        <button type="button" class="add-ingredient" onclick="addIngredient()">+ Add Ingredient</button>
      </div>

      <div class="form-group">
        <label class="form-label">Scale To</label>
        <div class="scale-options">
          <button type="button" class="scale-btn" onclick="setScale(0.5)">½×</button>
          <button type="button" class="scale-btn active" onclick="setScale(1)">1×</button>
          <button type="button" class="scale-btn" onclick="setScale(1.5)">1.5×</button>
          <button type="button" class="scale-btn" onclick="setScale(2)">2×</button>
          <button type="button" class="scale-btn" onclick="setScale(3)">3×</button>
        </div>
        <div class="custom-scale">
          <span>Or scale to:</span>
          <input type="number" class="form-input" id="target-servings" placeholder="Servings" min="1">
          <span>servings</span>
        </div>
      </div>

      <button type="submit" class="btn-primary">Scale Recipe</button>
    </form>

    <div class="result-card" id="result">
      <div class="result-title">Scaled Ingredients</div>
      <div class="result-value" id="result-servings">8 Servings</div>
      <div class="result-ingredients" id="result-ingredients"></div>
    </div>

    <footer class="brand-footer">
      ${branding?.businessName || 'Recipe Scaler'} • Powered by Blink
    </footer>
  </div>

  <script>
    let currentScale = 1;

    function addIngredient() {
      const list = document.getElementById('ingredient-list');
      const item = document.createElement('div');
      item.className = 'ingredient-item';
      item.innerHTML = \`
        <input type="number" class="form-input" placeholder="Amount" step="0.25">
        <select class="form-input" style="padding: 12px 8px;">
          <option value="cups">cups</option>
          <option value="tbsp">tbsp</option>
          <option value="tsp">tsp</option>
          <option value="oz">oz</option>
          <option value="lbs">lbs</option>
          <option value="g">g</option>
          <option value="ml">ml</option>
          <option value="whole">whole</option>
        </select>
        <input type="text" class="form-input" placeholder="Ingredient name">
        <button type="button" class="remove-btn" onclick="removeIngredient(this)">×</button>
      \`;
      list.appendChild(item);
    }

    function removeIngredient(btn) {
      const list = document.getElementById('ingredient-list');
      if (list.children.length > 1) {
        btn.closest('.ingredient-item').remove();
      }
    }

    function setScale(scale) {
      currentScale = scale;
      document.querySelectorAll('.scale-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('target-servings').value = '';
    }

    function formatAmount(amount) {
      const fractions = {
        0.25: '¼', 0.33: '⅓', 0.5: '½', 0.67: '⅔', 0.75: '¾',
        0.125: '⅛', 0.375: '⅜', 0.625: '⅝', 0.875: '⅞'
      };

      const whole = Math.floor(amount);
      const decimal = amount - whole;

      if (decimal === 0) return whole.toString();

      const closestFraction = Object.entries(fractions).reduce((closest, [key, val]) => {
        return Math.abs(parseFloat(key) - decimal) < Math.abs(parseFloat(closest[0]) - decimal) ? [key, val] : closest;
      }, ['0', '']);

      if (Math.abs(parseFloat(closestFraction[0]) - decimal) < 0.1) {
        return whole > 0 ? whole + ' ' + closestFraction[1] : closestFraction[1];
      }

      return amount.toFixed(2).replace(/\\.?0+$/, '');
    }

    document.getElementById('recipe-form').addEventListener('submit', function(e) {
      e.preventDefault();

      const originalServings = parseFloat(document.getElementById('original-servings').value) || 4;
      const targetServings = document.getElementById('target-servings').value;

      let scale = currentScale;
      if (targetServings) {
        scale = parseFloat(targetServings) / originalServings;
      }

      const ingredients = [];
      document.querySelectorAll('.ingredient-item').forEach(item => {
        const amount = parseFloat(item.querySelector('input[type="number"]').value) || 0;
        const unit = item.querySelector('select').value;
        const name = item.querySelector('input[type="text"]').value;

        if (name) {
          ingredients.push({
            amount: amount * scale,
            unit,
            name
          });
        }
      });

      const newServings = targetServings ? parseFloat(targetServings) : Math.round(originalServings * scale);

      document.getElementById('result-servings').textContent = newServings + ' Servings';

      const resultsContainer = document.getElementById('result-ingredients');
      resultsContainer.innerHTML = ingredients.map(ing => \`
        <div class="result-ingredient">
          <span>\${ing.name}</span>
          <span class="amount">\${formatAmount(ing.amount)} \${ing.unit}</span>
        </div>
      \`).join('');

      document.getElementById('result').classList.add('visible');
    });
  </script>
</body>
</html>`;
}

// ============================================
// TIP CALCULATOR
// ============================================

function generateTipCalculator(config) {
  const { name, style, colors, branding } = config;
  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.modern;
  const css = stylePreset.getCSS(colors);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || 'Tip Calculator'} | ${branding?.businessName || 'Tools'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${css}

    .tip-options {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .tip-btn {
      padding: 14px 8px;
      background: ${colors.primary}15;
      border: 2px solid ${colors.primary}30;
      border-radius: 10px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      color: ${colors.primary};
      transition: all 0.2s ease;
    }
    .tip-btn:hover, .tip-btn.active {
      background: ${colors.primary};
      color: white;
      border-color: ${colors.primary};
    }
    .split-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .split-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid ${colors.primary}30;
      background: white;
      color: ${colors.primary};
      font-size: 1.25rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .split-btn:hover {
      background: ${colors.primary};
      color: white;
    }
    .split-value {
      font-size: 1.5rem;
      font-weight: 600;
      min-width: 40px;
      text-align: center;
    }
    .result-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid rgba(0,0,0,0.1);
    }
    .result-row:last-child {
      border-bottom: none;
      padding-top: 16px;
      font-weight: 700;
      font-size: 1.25rem;
    }
    .result-row .label {
      color: #666;
    }
    .result-row .value {
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="tool-container">
    <div class="tool-header">
      ${branding?.logo ? `<img src="${branding.logo}" alt="${branding.businessName}" style="height: 40px; margin-bottom: 16px;">` : ''}
      <h1 class="tool-title">${name || 'Tip Calculator'}</h1>
      <p class="tool-subtitle">Calculate tip and split the bill easily</p>
    </div>

    <form id="tip-form">
      <div class="form-group">
        <label class="form-label">Bill Amount</label>
        <input type="number" class="form-input" id="bill-amount" placeholder="0.00" step="0.01" min="0" required>
      </div>

      <div class="form-group">
        <label class="form-label">Tip Percentage</label>
        <div class="tip-options">
          <button type="button" class="tip-btn" data-tip="10">10%</button>
          <button type="button" class="tip-btn" data-tip="15">15%</button>
          <button type="button" class="tip-btn active" data-tip="18">18%</button>
          <button type="button" class="tip-btn" data-tip="20">20%</button>
          <button type="button" class="tip-btn" data-tip="22">22%</button>
          <button type="button" class="tip-btn" data-tip="25">25%</button>
          <button type="button" class="tip-btn" data-tip="30">30%</button>
          <input type="number" class="form-input" id="custom-tip" placeholder="Custom %" min="0" max="100" style="text-align: center;">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Split Between</label>
        <div class="split-group">
          <button type="button" class="split-btn" id="split-minus">−</button>
          <span class="split-value" id="split-count">1</span>
          <button type="button" class="split-btn" id="split-plus">+</button>
          <span style="color: #666; margin-left: 8px;">people</span>
        </div>
      </div>

      <button type="submit" class="btn-primary">Calculate</button>
    </form>

    <div class="result-card" id="result">
      <div class="result-title">Bill Breakdown</div>
      <div class="result-row">
        <span class="label">Subtotal</span>
        <span class="value" id="result-subtotal">$0.00</span>
      </div>
      <div class="result-row">
        <span class="label">Tip (<span id="result-tip-percent">18</span>%)</span>
        <span class="value" id="result-tip">$0.00</span>
      </div>
      <div class="result-row">
        <span class="label">Total</span>
        <span class="value" id="result-total">$0.00</span>
      </div>
      <div class="result-row" id="per-person-row" style="display: none;">
        <span class="label">Per Person</span>
        <span class="value" id="result-per-person">$0.00</span>
      </div>
    </div>

    <footer class="brand-footer">
      ${branding?.businessName || 'Tip Calculator'} • Powered by Blink
    </footer>
  </div>

  <script>
    let tipPercent = 18;
    let splitCount = 1;

    // Tip button handling
    document.querySelectorAll('.tip-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.tip-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        tipPercent = parseInt(this.dataset.tip);
        document.getElementById('custom-tip').value = '';
      });
    });

    // Custom tip handling
    document.getElementById('custom-tip').addEventListener('input', function() {
      if (this.value) {
        document.querySelectorAll('.tip-btn').forEach(b => b.classList.remove('active'));
        tipPercent = parseFloat(this.value) || 0;
      }
    });

    // Split handling
    document.getElementById('split-minus').addEventListener('click', function() {
      if (splitCount > 1) {
        splitCount--;
        document.getElementById('split-count').textContent = splitCount;
      }
    });

    document.getElementById('split-plus').addEventListener('click', function() {
      splitCount++;
      document.getElementById('split-count').textContent = splitCount;
    });

    // Form submission
    document.getElementById('tip-form').addEventListener('submit', function(e) {
      e.preventDefault();

      const bill = parseFloat(document.getElementById('bill-amount').value) || 0;
      const tip = bill * (tipPercent / 100);
      const total = bill + tip;
      const perPerson = total / splitCount;

      document.getElementById('result-subtotal').textContent = '$' + bill.toFixed(2);
      document.getElementById('result-tip-percent').textContent = tipPercent;
      document.getElementById('result-tip').textContent = '$' + tip.toFixed(2);
      document.getElementById('result-total').textContent = '$' + total.toFixed(2);
      document.getElementById('result-per-person').textContent = '$' + perPerson.toFixed(2);

      document.getElementById('per-person-row').style.display = splitCount > 1 ? 'flex' : 'none';
      document.getElementById('result').classList.add('visible');
    });
  </script>
</body>
</html>`;
}

// ============================================
// BMI CALCULATOR
// ============================================

function generateBMICalculator(config) {
  const { name, style, colors, branding } = config;
  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.modern;
  const css = stylePreset.getCSS(colors);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || 'BMI Calculator'} | ${branding?.businessName || 'Health Tools'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${css}

    .unit-toggle {
      display: flex;
      background: ${colors.primary}15;
      border-radius: 8px;
      padding: 4px;
      margin-bottom: 24px;
    }
    .unit-btn {
      flex: 1;
      padding: 10px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-weight: 500;
      border-radius: 6px;
      transition: all 0.2s ease;
    }
    .unit-btn.active {
      background: ${colors.primary};
      color: white;
    }
    .input-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .bmi-scale {
      display: flex;
      height: 12px;
      border-radius: 6px;
      overflow: hidden;
      margin: 20px 0;
    }
    .bmi-scale-section {
      flex: 1;
    }
    .bmi-indicator {
      width: 4px;
      height: 24px;
      background: #333;
      border-radius: 2px;
      margin-top: -6px;
      transition: margin-left 0.5s ease;
    }
    .bmi-category {
      text-align: center;
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 16px;
    }
    .bmi-category.underweight { background: #fef3c7; color: #92400e; }
    .bmi-category.normal { background: #d1fae5; color: #065f46; }
    .bmi-category.overweight { background: #fed7aa; color: #9a3412; }
    .bmi-category.obese { background: #fecaca; color: #991b1b; }
  </style>
</head>
<body>
  <div class="tool-container">
    <div class="tool-header">
      <h1 class="tool-title">${name || 'BMI Calculator'}</h1>
      <p class="tool-subtitle">Calculate your Body Mass Index</p>
    </div>

    <form id="bmi-form">
      <div class="unit-toggle">
        <button type="button" class="unit-btn active" data-unit="imperial">Imperial (ft/lbs)</button>
        <button type="button" class="unit-btn" data-unit="metric">Metric (cm/kg)</button>
      </div>

      <div class="form-group imperial-fields">
        <label class="form-label">Height</label>
        <div class="input-row">
          <input type="number" class="form-input" id="height-ft" placeholder="Feet" min="1" max="8">
          <input type="number" class="form-input" id="height-in" placeholder="Inches" min="0" max="11">
        </div>
      </div>

      <div class="form-group metric-fields" style="display: none;">
        <label class="form-label">Height (cm)</label>
        <input type="number" class="form-input" id="height-cm" placeholder="e.g., 175" min="50" max="250">
      </div>

      <div class="form-group imperial-fields">
        <label class="form-label">Weight (lbs)</label>
        <input type="number" class="form-input" id="weight-lbs" placeholder="e.g., 150" min="1">
      </div>

      <div class="form-group metric-fields" style="display: none;">
        <label class="form-label">Weight (kg)</label>
        <input type="number" class="form-input" id="weight-kg" placeholder="e.g., 70" min="1">
      </div>

      <button type="submit" class="btn-primary">Calculate BMI</button>
    </form>

    <div class="result-card" id="result">
      <div class="result-title">Your Results</div>
      <div class="result-value" id="bmi-value">0.0</div>
      <div class="bmi-scale">
        <div class="bmi-scale-section" style="background: #fef3c7;"></div>
        <div class="bmi-scale-section" style="background: #d1fae5;"></div>
        <div class="bmi-scale-section" style="background: #fed7aa;"></div>
        <div class="bmi-scale-section" style="background: #fecaca;"></div>
      </div>
      <div class="bmi-indicator" id="bmi-indicator"></div>
      <div class="bmi-category normal" id="bmi-category">Normal Weight</div>
      <div class="result-detail" id="bmi-range"></div>
    </div>

    <footer class="brand-footer">
      ${branding?.businessName || 'BMI Calculator'} • Powered by Blink
    </footer>
  </div>

  <script>
    let unit = 'imperial';

    document.querySelectorAll('.unit-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        unit = this.dataset.unit;

        document.querySelectorAll('.imperial-fields').forEach(f => f.style.display = unit === 'imperial' ? 'block' : 'none');
        document.querySelectorAll('.metric-fields').forEach(f => f.style.display = unit === 'metric' ? 'block' : 'none');
      });
    });

    document.getElementById('bmi-form').addEventListener('submit', function(e) {
      e.preventDefault();

      let heightM, weightKg;

      if (unit === 'imperial') {
        const ft = parseFloat(document.getElementById('height-ft').value) || 0;
        const inches = parseFloat(document.getElementById('height-in').value) || 0;
        const lbs = parseFloat(document.getElementById('weight-lbs').value) || 0;
        heightM = ((ft * 12) + inches) * 0.0254;
        weightKg = lbs * 0.453592;
      } else {
        heightM = (parseFloat(document.getElementById('height-cm').value) || 0) / 100;
        weightKg = parseFloat(document.getElementById('weight-kg').value) || 0;
      }

      if (heightM <= 0 || weightKg <= 0) return;

      const bmi = weightKg / (heightM * heightM);

      document.getElementById('bmi-value').textContent = bmi.toFixed(1);

      const category = document.getElementById('bmi-category');
      category.className = 'bmi-category';

      let categoryText, rangeText;
      if (bmi < 18.5) {
        category.classList.add('underweight');
        categoryText = 'Underweight';
        rangeText = 'BMI less than 18.5';
      } else if (bmi < 25) {
        category.classList.add('normal');
        categoryText = 'Normal Weight';
        rangeText = 'BMI 18.5 - 24.9';
      } else if (bmi < 30) {
        category.classList.add('overweight');
        categoryText = 'Overweight';
        rangeText = 'BMI 25 - 29.9';
      } else {
        category.classList.add('obese');
        categoryText = 'Obese';
        rangeText = 'BMI 30 or greater';
      }

      category.textContent = categoryText;
      document.getElementById('bmi-range').textContent = rangeText;

      // Position indicator (0-40 BMI range mapped to 0-100%)
      const position = Math.min(Math.max((bmi - 10) / 30 * 100, 0), 100);
      document.getElementById('bmi-indicator').style.marginLeft = position + '%';

      document.getElementById('result').classList.add('visible');
    });
  </script>
</body>
</html>`;
}

// ============================================
// DISCOUNT CALCULATOR
// ============================================

function generateDiscountCalculator(config) {
  const { name, style, colors, branding } = config;
  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.modern;
  const css = stylePreset.getCSS(colors);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || 'Discount Calculator'} | ${branding?.businessName || 'Shopping Tools'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${css}

    .discount-options {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .discount-btn {
      padding: 12px 8px;
      background: ${colors.primary}15;
      border: 2px solid ${colors.primary}30;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      color: ${colors.primary};
      transition: all 0.2s ease;
    }
    .discount-btn:hover, .discount-btn.active {
      background: ${colors.primary};
      color: white;
      border-color: ${colors.primary};
    }
    .savings-highlight {
      background: linear-gradient(135deg, #22c55e15 0%, #16a34a20 100%);
      border: 2px solid #22c55e;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin-bottom: 16px;
    }
    .savings-amount {
      font-size: 2rem;
      font-weight: 700;
      color: #16a34a;
    }
    .savings-label {
      color: #666;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="tool-container">
    <div class="tool-header">
      <h1 class="tool-title">${name || 'Discount Calculator'}</h1>
      <p class="tool-subtitle">Calculate sale prices and savings</p>
    </div>

    <form id="discount-form">
      <div class="form-group">
        <label class="form-label">Original Price</label>
        <input type="number" class="form-input" id="original-price" placeholder="$0.00" step="0.01" min="0" required>
      </div>

      <div class="form-group">
        <label class="form-label">Discount</label>
        <div class="discount-options">
          <button type="button" class="discount-btn" data-discount="10">10%</button>
          <button type="button" class="discount-btn" data-discount="15">15%</button>
          <button type="button" class="discount-btn active" data-discount="20">20%</button>
          <button type="button" class="discount-btn" data-discount="25">25%</button>
          <button type="button" class="discount-btn" data-discount="30">30%</button>
          <button type="button" class="discount-btn" data-discount="40">40%</button>
          <button type="button" class="discount-btn" data-discount="50">50%</button>
          <input type="number" class="form-input" id="custom-discount" placeholder="%" min="0" max="100" style="text-align: center;">
        </div>
      </div>

      <button type="submit" class="btn-primary">Calculate Savings</button>
    </form>

    <div class="result-card" id="result">
      <div class="savings-highlight">
        <div class="savings-amount" id="savings-amount">$0.00</div>
        <div class="savings-label">You Save!</div>
      </div>
      <div class="result-title">Price Breakdown</div>
      <div class="result-detail">Original: <strong id="result-original">$0.00</strong></div>
      <div class="result-detail">Discount: <strong id="result-discount">0%</strong></div>
      <div class="result-value" id="result-final">$0.00</div>
      <div class="result-detail" style="color: #16a34a; font-weight: 600;">Final Price</div>
    </div>

    <footer class="brand-footer">
      ${branding?.businessName || 'Discount Calculator'} • Powered by Blink
    </footer>
  </div>

  <script>
    let discountPercent = 20;

    document.querySelectorAll('.discount-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.discount-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        discountPercent = parseInt(this.dataset.discount);
        document.getElementById('custom-discount').value = '';
      });
    });

    document.getElementById('custom-discount').addEventListener('input', function() {
      if (this.value) {
        document.querySelectorAll('.discount-btn').forEach(b => b.classList.remove('active'));
        discountPercent = parseFloat(this.value) || 0;
      }
    });

    document.getElementById('discount-form').addEventListener('submit', function(e) {
      e.preventDefault();

      const original = parseFloat(document.getElementById('original-price').value) || 0;
      const savings = original * (discountPercent / 100);
      const final = original - savings;

      document.getElementById('savings-amount').textContent = '$' + savings.toFixed(2);
      document.getElementById('result-original').textContent = '$' + original.toFixed(2);
      document.getElementById('result-discount').textContent = discountPercent + '%';
      document.getElementById('result-final').textContent = '$' + final.toFixed(2);

      document.getElementById('result').classList.add('visible');
    });
  </script>
</body>
</html>`;
}

// ============================================
// PERCENTAGE CALCULATOR
// ============================================

function generatePercentageCalculator(config) {
  const { name, style, colors, branding } = config;
  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.modern;
  const css = stylePreset.getCSS(colors);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || 'Percentage Calculator'} | ${branding?.businessName || 'Math Tools'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${css}

    .calc-tabs {
      display: flex;
      background: ${colors.primary}15;
      border-radius: 8px;
      padding: 4px;
      margin-bottom: 24px;
    }
    .calc-tab {
      flex: 1;
      padding: 10px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-weight: 500;
      border-radius: 6px;
      transition: all 0.2s ease;
      font-size: 0.9rem;
    }
    .calc-tab.active {
      background: ${colors.primary};
      color: white;
    }
    .calc-section {
      display: none;
    }
    .calc-section.active {
      display: block;
    }
    .inline-form {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .inline-input {
      width: 100px;
      padding: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      text-align: center;
    }
    .inline-input:focus {
      outline: none;
      border-color: ${colors.primary};
    }
    .inline-text {
      color: #666;
      font-size: 1rem;
    }
  </style>
</head>
<body>
  <div class="tool-container">
    <div class="tool-header">
      <h1 class="tool-title">${name || 'Percentage Calculator'}</h1>
      <p class="tool-subtitle">Multiple ways to calculate percentages</p>
    </div>

    <div class="calc-tabs">
      <button type="button" class="calc-tab active" data-calc="percent-of">% of Number</button>
      <button type="button" class="calc-tab" data-calc="what-percent">What %?</button>
      <button type="button" class="calc-tab" data-calc="percent-change">% Change</button>
    </div>

    <div class="calc-section active" id="percent-of">
      <form id="percent-of-form">
        <div class="inline-form" style="margin-bottom: 20px;">
          <span class="inline-text">What is</span>
          <input type="number" class="inline-input" id="pof-percent" placeholder="%" step="any">
          <span class="inline-text">% of</span>
          <input type="number" class="inline-input" id="pof-number" placeholder="Number" step="any">
          <span class="inline-text">?</span>
        </div>
        <button type="submit" class="btn-primary">Calculate</button>
      </form>
    </div>

    <div class="calc-section" id="what-percent">
      <form id="what-percent-form">
        <div class="inline-form" style="margin-bottom: 20px;">
          <input type="number" class="inline-input" id="wp-part" placeholder="Part" step="any">
          <span class="inline-text">is what % of</span>
          <input type="number" class="inline-input" id="wp-whole" placeholder="Whole" step="any">
          <span class="inline-text">?</span>
        </div>
        <button type="submit" class="btn-primary">Calculate</button>
      </form>
    </div>

    <div class="calc-section" id="percent-change">
      <form id="percent-change-form">
        <div class="inline-form" style="margin-bottom: 20px;">
          <span class="inline-text">From</span>
          <input type="number" class="inline-input" id="pc-from" placeholder="Original" step="any">
          <span class="inline-text">to</span>
          <input type="number" class="inline-input" id="pc-to" placeholder="New" step="any">
        </div>
        <button type="submit" class="btn-primary">Calculate Change</button>
      </form>
    </div>

    <div class="result-card" id="result">
      <div class="result-title">Result</div>
      <div class="result-value" id="result-value">0</div>
      <div class="result-detail" id="result-detail"></div>
    </div>

    <footer class="brand-footer">
      ${branding?.businessName || 'Percentage Calculator'} • Powered by Blink
    </footer>
  </div>

  <script>
    document.querySelectorAll('.calc-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.calc-section').forEach(s => s.classList.remove('active'));
        this.classList.add('active');
        document.getElementById(this.dataset.calc).classList.add('active');
        document.getElementById('result').classList.remove('visible');
      });
    });

    document.getElementById('percent-of-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const percent = parseFloat(document.getElementById('pof-percent').value) || 0;
      const number = parseFloat(document.getElementById('pof-number').value) || 0;
      const result = (percent / 100) * number;

      document.getElementById('result-value').textContent = result.toFixed(2);
      document.getElementById('result-detail').textContent = percent + '% of ' + number + ' = ' + result.toFixed(2);
      document.getElementById('result').classList.add('visible');
    });

    document.getElementById('what-percent-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const part = parseFloat(document.getElementById('wp-part').value) || 0;
      const whole = parseFloat(document.getElementById('wp-whole').value) || 1;
      const result = (part / whole) * 100;

      document.getElementById('result-value').textContent = result.toFixed(2) + '%';
      document.getElementById('result-detail').textContent = part + ' is ' + result.toFixed(2) + '% of ' + whole;
      document.getElementById('result').classList.add('visible');
    });

    document.getElementById('percent-change-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const from = parseFloat(document.getElementById('pc-from').value) || 0;
      const to = parseFloat(document.getElementById('pc-to').value) || 0;
      const change = ((to - from) / Math.abs(from)) * 100;
      const direction = change >= 0 ? 'increase' : 'decrease';

      document.getElementById('result-value').textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
      document.getElementById('result-detail').textContent = 'A ' + Math.abs(change).toFixed(2) + '% ' + direction + ' from ' + from + ' to ' + to;
      document.getElementById('result').classList.add('visible');
    });
  </script>
</body>
</html>`;
}

// ============================================
// GENERIC FALLBACK GENERATOR
// ============================================

function generateGenericTool(config) {
  const { name, style, colors, branding, fields = [], features = [] } = config;
  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.modern;
  const css = stylePreset.getCSS(colors);

  const fieldsHtml = fields.map(field => {
    const id = field.name?.toLowerCase().replace(/\s+/g, '-') || 'field';
    if (field.type === 'number') {
      return `<div class="form-group">
        <label class="form-label">${field.label || field.name}</label>
        <input type="number" class="form-input" id="${id}" placeholder="${field.placeholder || '0'}" step="${field.step || '1'}">
      </div>`;
    }
    if (field.type === 'select' && field.options) {
      return `<div class="form-group">
        <label class="form-label">${field.label || field.name}</label>
        <select class="form-input" id="${id}">
          ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
        </select>
      </div>`;
    }
    return `<div class="form-group">
      <label class="form-label">${field.label || field.name}</label>
      <input type="text" class="form-input" id="${id}" placeholder="${field.placeholder || ''}">
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || 'Tool'} | ${branding?.businessName || 'Tools'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${css}
  </style>
</head>
<body>
  <div class="tool-container">
    <div class="tool-header">
      <h1 class="tool-title">${name || 'Tool'}</h1>
      <p class="tool-subtitle">Powered by AI</p>
    </div>

    <form id="tool-form">
      ${fieldsHtml || '<div class="form-group"><label class="form-label">Input</label><input type="text" class="form-input" id="input" placeholder="Enter value"></div>'}
      <button type="submit" class="btn-primary">Calculate</button>
    </form>

    <div class="result-card" id="result">
      <div class="result-title">Result</div>
      <div class="result-value" id="result-value">-</div>
    </div>

    <footer class="brand-footer">
      ${branding?.businessName || name || 'Tool'} • Powered by Blink
    </footer>
  </div>

  <script>
    document.getElementById('tool-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const inputs = this.querySelectorAll('input, select');
      let output = [];
      inputs.forEach(input => {
        if (input.value) output.push(input.value);
      });
      document.getElementById('result-value').textContent = output.join(' | ') || 'Calculated!';
      document.getElementById('result').classList.add('visible');
    });
  </script>
</body>
</html>`;
}

// ============================================
// INVENTORY TRACKER
// ============================================

function generateInventoryTracker(config) {
  const { name, style, colors, branding } = config;
  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.modern;
  const css = stylePreset.getCSS(colors);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || 'Inventory Tracker'} | ${branding?.businessName || 'Business Tools'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${css}

    .inventory-list {
      margin-bottom: 24px;
    }
    .inventory-item {
      display: grid;
      grid-template-columns: 1fr 100px 100px 80px;
      gap: 12px;
      margin-bottom: 12px;
      align-items: center;
      padding: 12px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
    }
    .inventory-item .form-input {
      margin: 0;
    }
    .add-item {
      padding: 12px 16px;
      background: transparent;
      border: 1px dashed ${colors.primary}60;
      color: ${colors.primary};
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      width: 100%;
    }
    .add-item:hover {
      background: ${colors.primary}10;
      border-style: solid;
    }
    .remove-btn {
      padding: 8px 12px;
      background: #fee2e2;
      color: #dc2626;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .stock-low { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); }
    .stock-ok { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 20px;
    }
    .summary-card {
      text-align: center;
      padding: 16px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
    }
    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: ${colors.primary};
    }
    .summary-label {
      font-size: 0.75rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="tool-container">
    <div class="tool-header">
      <h1 class="tool-title">${name || 'Inventory Tracker'}</h1>
      <p class="tool-subtitle">Track your stock levels</p>
    </div>

    <div class="form-group">
      <label class="form-label">Inventory Items</label>
      <div class="inventory-list" id="inventory-list">
        <div class="inventory-item">
          <input type="text" class="form-input" placeholder="Item name" value="Coffee Beans (1lb)">
          <input type="number" class="form-input" placeholder="Qty" value="24">
          <input type="number" class="form-input" placeholder="Min" value="10">
          <button type="button" class="remove-btn" onclick="removeItem(this)">×</button>
        </div>
        <div class="inventory-item">
          <input type="text" class="form-input" placeholder="Item name" value="Milk (gal)">
          <input type="number" class="form-input" placeholder="Qty" value="8">
          <input type="number" class="form-input" placeholder="Min" value="5">
          <button type="button" class="remove-btn" onclick="removeItem(this)">×</button>
        </div>
        <div class="inventory-item">
          <input type="text" class="form-input" placeholder="Item name" value="Sugar (5lb)">
          <input type="number" class="form-input" placeholder="Qty" value="3">
          <input type="number" class="form-input" placeholder="Min" value="4">
          <button type="button" class="remove-btn" onclick="removeItem(this)">×</button>
        </div>
      </div>
      <button type="button" class="add-item" onclick="addItem()">+ Add Item</button>
    </div>

    <button class="btn-primary" onclick="updateInventory()">Update Inventory</button>

    <div class="result-card visible" id="result">
      <div class="result-title">Inventory Summary</div>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-value" id="total-items">3</div>
          <div class="summary-label">Total Items</div>
        </div>
        <div class="summary-card">
          <div class="summary-value" id="low-stock">1</div>
          <div class="summary-label">Low Stock</div>
        </div>
        <div class="summary-card">
          <div class="summary-value" id="total-units">35</div>
          <div class="summary-label">Total Units</div>
        </div>
      </div>
    </div>

    <footer class="brand-footer">
      ${branding?.businessName || 'Business'} • Powered by Blink
    </footer>
  </div>

  <script>
    function addItem() {
      const list = document.getElementById('inventory-list');
      const item = document.createElement('div');
      item.className = 'inventory-item';
      item.innerHTML = \`
        <input type="text" class="form-input" placeholder="Item name">
        <input type="number" class="form-input" placeholder="Qty" value="0">
        <input type="number" class="form-input" placeholder="Min" value="5">
        <button type="button" class="remove-btn" onclick="removeItem(this)">×</button>
      \`;
      list.appendChild(item);
      updateInventory();
    }

    function removeItem(btn) {
      const list = document.getElementById('inventory-list');
      if (list.children.length > 1) {
        btn.closest('.inventory-item').remove();
        updateInventory();
      }
    }

    function updateInventory() {
      const items = document.querySelectorAll('.inventory-item');
      let totalItems = 0;
      let lowStock = 0;
      let totalUnits = 0;

      items.forEach(item => {
        const qty = parseInt(item.querySelectorAll('input')[1].value) || 0;
        const min = parseInt(item.querySelectorAll('input')[2].value) || 0;
        const name = item.querySelectorAll('input')[0].value;

        if (name) {
          totalItems++;
          totalUnits += qty;
          if (qty <= min) {
            lowStock++;
            item.classList.add('stock-low');
            item.classList.remove('stock-ok');
          } else {
            item.classList.remove('stock-low');
            item.classList.add('stock-ok');
          }
        }
      });

      document.getElementById('total-items').textContent = totalItems;
      document.getElementById('low-stock').textContent = lowStock;
      document.getElementById('total-units').textContent = totalUnits;
    }

    updateInventory();
  </script>
</body>
</html>`;
}

// ============================================
// EXPENSE TRACKER
// ============================================

function generateExpenseTracker(config) {
  const { name, style, colors, branding } = config;
  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.modern;
  const css = stylePreset.getCSS(colors);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || 'Expense Tracker'} | ${branding?.businessName || 'Business Tools'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${css}

    .expense-list {
      margin-bottom: 24px;
      max-height: 300px;
      overflow-y: auto;
    }
    .expense-item {
      display: grid;
      grid-template-columns: 1fr 120px 100px 60px;
      gap: 12px;
      margin-bottom: 12px;
      align-items: center;
      padding: 12px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
    }
    .expense-item .form-input {
      margin: 0;
    }
    .category-select {
      padding: 12px;
      border: 1px solid #444;
      border-radius: 4px;
      background: #1a1a1a;
      color: #fff;
      font-size: 0.9rem;
    }
    .add-expense {
      padding: 12px 16px;
      background: transparent;
      border: 1px dashed ${colors.primary}60;
      color: ${colors.primary};
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      width: 100%;
    }
    .add-expense:hover {
      background: ${colors.primary}10;
      border-style: solid;
    }
    .remove-btn {
      padding: 8px 12px;
      background: #fee2e2;
      color: #dc2626;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 20px;
    }
    .summary-card {
      text-align: center;
      padding: 20px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
    }
    .summary-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: ${colors.primary};
    }
    .summary-label {
      font-size: 0.75rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .category-breakdown {
      margin-top: 20px;
    }
    .category-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .category-bar {
      height: 8px;
      background: ${colors.primary}30;
      border-radius: 4px;
      margin-top: 8px;
      overflow: hidden;
    }
    .category-fill {
      height: 100%;
      background: ${colors.primary};
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="tool-container">
    <div class="tool-header">
      <h1 class="tool-title">${name || 'Expense Tracker'}</h1>
      <p class="tool-subtitle">Track your business expenses</p>
    </div>

    <div class="form-group">
      <label class="form-label">Add Expenses</label>
      <div class="expense-list" id="expense-list">
        <div class="expense-item">
          <input type="text" class="form-input" placeholder="Description" value="Coffee supplies">
          <select class="category-select">
            <option value="supplies">Supplies</option>
            <option value="utilities">Utilities</option>
            <option value="rent">Rent</option>
            <option value="payroll">Payroll</option>
            <option value="marketing">Marketing</option>
            <option value="other">Other</option>
          </select>
          <input type="number" class="form-input" placeholder="$0.00" value="150" step="0.01">
          <button type="button" class="remove-btn" onclick="removeExpense(this)">×</button>
        </div>
        <div class="expense-item">
          <input type="text" class="form-input" placeholder="Description" value="Electric bill">
          <select class="category-select">
            <option value="supplies">Supplies</option>
            <option value="utilities" selected>Utilities</option>
            <option value="rent">Rent</option>
            <option value="payroll">Payroll</option>
            <option value="marketing">Marketing</option>
            <option value="other">Other</option>
          </select>
          <input type="number" class="form-input" placeholder="$0.00" value="280" step="0.01">
          <button type="button" class="remove-btn" onclick="removeExpense(this)">×</button>
        </div>
      </div>
      <button type="button" class="add-expense" onclick="addExpense()">+ Add Expense</button>
    </div>

    <button class="btn-primary" onclick="calculateExpenses()">Calculate Total</button>

    <div class="result-card visible" id="result">
      <div class="result-title">Expense Summary</div>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-value" id="total-expenses">$430.00</div>
          <div class="summary-label">Total Expenses</div>
        </div>
        <div class="summary-card">
          <div class="summary-value" id="expense-count">2</div>
          <div class="summary-label">Transactions</div>
        </div>
      </div>
      <div class="category-breakdown" id="category-breakdown"></div>
    </div>

    <footer class="brand-footer">
      ${branding?.businessName || 'Business'} • Powered by Blink
    </footer>
  </div>

  <script>
    function addExpense() {
      const list = document.getElementById('expense-list');
      const item = document.createElement('div');
      item.className = 'expense-item';
      item.innerHTML = \`
        <input type="text" class="form-input" placeholder="Description">
        <select class="category-select">
          <option value="supplies">Supplies</option>
          <option value="utilities">Utilities</option>
          <option value="rent">Rent</option>
          <option value="payroll">Payroll</option>
          <option value="marketing">Marketing</option>
          <option value="other">Other</option>
        </select>
        <input type="number" class="form-input" placeholder="$0.00" step="0.01">
        <button type="button" class="remove-btn" onclick="removeExpense(this)">×</button>
      \`;
      list.appendChild(item);
    }

    function removeExpense(btn) {
      const list = document.getElementById('expense-list');
      if (list.children.length > 1) {
        btn.closest('.expense-item').remove();
        calculateExpenses();
      }
    }

    function calculateExpenses() {
      const items = document.querySelectorAll('.expense-item');
      let total = 0;
      let count = 0;
      const categories = {};

      items.forEach(item => {
        const amount = parseFloat(item.querySelector('input[type="number"]').value) || 0;
        const category = item.querySelector('select').value;
        const desc = item.querySelector('input[type="text"]').value;

        if (desc && amount > 0) {
          total += amount;
          count++;
          categories[category] = (categories[category] || 0) + amount;
        }
      });

      document.getElementById('total-expenses').textContent = '$' + total.toFixed(2);
      document.getElementById('expense-count').textContent = count;

      // Category breakdown
      const breakdown = document.getElementById('category-breakdown');
      breakdown.innerHTML = '<div class="result-title" style="margin-top:20px">By Category</div>';

      Object.entries(categories).sort((a,b) => b[1] - a[1]).forEach(([cat, amt]) => {
        const pct = total > 0 ? (amt / total * 100) : 0;
        breakdown.innerHTML += \`
          <div class="category-row">
            <span>\${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
            <span>$\${amt.toFixed(2)}</span>
          </div>
          <div class="category-bar"><div class="category-fill" style="width:\${pct}%"></div></div>
        \`;
      });
    }

    calculateExpenses();
  </script>
</body>
</html>`;
}

// ============================================
// MENU GENERATOR
// ============================================

function generateMenuGenerator(config) {
  const { name, style, colors, branding } = config;
  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.modern;
  const css = stylePreset.getCSS(colors);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || 'Menu Generator'} | ${branding?.businessName || 'Restaurant Tools'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${css}

    .menu-section {
      margin-bottom: 32px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .section-title-input {
      font-size: 1.2rem;
      font-weight: 600;
      background: transparent;
      border: none;
      border-bottom: 2px solid ${colors.primary}40;
      color: ${colors.primary};
      padding: 8px 0;
      width: 200px;
    }
    .section-title-input:focus {
      outline: none;
      border-color: ${colors.primary};
    }
    .menu-item {
      display: grid;
      grid-template-columns: 1fr 80px 60px;
      gap: 12px;
      margin-bottom: 12px;
      align-items: center;
      padding: 12px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
    }
    .menu-item .form-input {
      margin: 0;
    }
    .add-btn {
      padding: 10px 16px;
      background: transparent;
      border: 1px dashed ${colors.primary}60;
      color: ${colors.primary};
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s ease;
    }
    .add-btn:hover {
      background: ${colors.primary}10;
      border-style: solid;
    }
    .remove-btn {
      padding: 6px 10px;
      background: #fee2e2;
      color: #dc2626;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .menu-preview {
      background: white;
      color: #333;
      padding: 40px;
      border-radius: 8px;
      margin-top: 24px;
    }
    .preview-header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid ${colors.primary};
    }
    .preview-title {
      font-size: 2rem;
      color: ${colors.primary};
      margin-bottom: 8px;
    }
    .preview-section {
      margin-bottom: 24px;
    }
    .preview-section-title {
      font-size: 1.2rem;
      color: ${colors.primary};
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .preview-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dotted #ddd;
    }
    .preview-item-name {
      font-weight: 500;
    }
    .preview-item-price {
      color: ${colors.primary};
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="tool-container" style="max-width: 600px;">
    <div class="tool-header">
      <h1 class="tool-title">${name || 'Menu Generator'}</h1>
      <p class="tool-subtitle">Create your menu</p>
    </div>

    <div id="menu-sections">
      <div class="menu-section" data-section="appetizers">
        <div class="section-header">
          <input type="text" class="section-title-input" value="Appetizers" placeholder="Section name">
          <button class="remove-btn" onclick="removeSection(this)">Remove</button>
        </div>
        <div class="menu-items">
          <div class="menu-item">
            <input type="text" class="form-input" placeholder="Item name" value="House Salad">
            <input type="number" class="form-input" placeholder="$" value="8.99" step="0.01">
            <button class="remove-btn" onclick="removeItem(this)">×</button>
          </div>
          <div class="menu-item">
            <input type="text" class="form-input" placeholder="Item name" value="Soup of the Day">
            <input type="number" class="form-input" placeholder="$" value="6.99" step="0.01">
            <button class="remove-btn" onclick="removeItem(this)">×</button>
          </div>
        </div>
        <button class="add-btn" onclick="addItem(this)" style="width:100%;margin-top:8px">+ Add Item</button>
      </div>

      <div class="menu-section" data-section="mains">
        <div class="section-header">
          <input type="text" class="section-title-input" value="Main Courses" placeholder="Section name">
          <button class="remove-btn" onclick="removeSection(this)">Remove</button>
        </div>
        <div class="menu-items">
          <div class="menu-item">
            <input type="text" class="form-input" placeholder="Item name" value="Grilled Salmon">
            <input type="number" class="form-input" placeholder="$" value="24.99" step="0.01">
            <button class="remove-btn" onclick="removeItem(this)">×</button>
          </div>
        </div>
        <button class="add-btn" onclick="addItem(this)" style="width:100%;margin-top:8px">+ Add Item</button>
      </div>
    </div>

    <button class="add-btn" onclick="addSection()" style="width:100%;margin:20px 0">+ Add Section</button>

    <button class="btn-primary" onclick="generatePreview()">Generate Menu Preview</button>

    <div class="menu-preview" id="menu-preview" style="display:none">
      <div class="preview-header">
        <div class="preview-title">${branding?.businessName || 'Our Menu'}</div>
      </div>
      <div id="preview-content"></div>
    </div>

    <footer class="brand-footer">
      ${branding?.businessName || 'Restaurant'} • Powered by Blink
    </footer>
  </div>

  <script>
    function addSection() {
      const container = document.getElementById('menu-sections');
      const section = document.createElement('div');
      section.className = 'menu-section';
      section.innerHTML = \`
        <div class="section-header">
          <input type="text" class="section-title-input" placeholder="Section name">
          <button class="remove-btn" onclick="removeSection(this)">Remove</button>
        </div>
        <div class="menu-items"></div>
        <button class="add-btn" onclick="addItem(this)" style="width:100%;margin-top:8px">+ Add Item</button>
      \`;
      container.appendChild(section);
    }

    function removeSection(btn) {
      const sections = document.querySelectorAll('.menu-section');
      if (sections.length > 1) {
        btn.closest('.menu-section').remove();
      }
    }

    function addItem(btn) {
      const section = btn.closest('.menu-section');
      const items = section.querySelector('.menu-items');
      const item = document.createElement('div');
      item.className = 'menu-item';
      item.innerHTML = \`
        <input type="text" class="form-input" placeholder="Item name">
        <input type="number" class="form-input" placeholder="$" step="0.01">
        <button class="remove-btn" onclick="removeItem(this)">×</button>
      \`;
      items.appendChild(item);
    }

    function removeItem(btn) {
      const items = btn.closest('.menu-items');
      if (items.children.length > 1) {
        btn.closest('.menu-item').remove();
      }
    }

    function generatePreview() {
      const preview = document.getElementById('menu-preview');
      const content = document.getElementById('preview-content');
      content.innerHTML = '';

      document.querySelectorAll('.menu-section').forEach(section => {
        const title = section.querySelector('.section-title-input').value;
        if (!title) return;

        let sectionHtml = '<div class="preview-section"><div class="preview-section-title">' + title + '</div>';

        section.querySelectorAll('.menu-item').forEach(item => {
          const name = item.querySelectorAll('input')[0].value;
          const price = parseFloat(item.querySelectorAll('input')[1].value);
          if (name && price) {
            sectionHtml += '<div class="preview-item"><span class="preview-item-name">' + name + '</span><span class="preview-item-price">$' + price.toFixed(2) + '</span></div>';
          }
        });

        sectionHtml += '</div>';
        content.innerHTML += sectionHtml;
      });

      preview.style.display = 'block';
    }
  </script>
</body>
</html>`;
}

// ============================================
// BOOKING TOOL
// ============================================

function generateBookingTool(config) {
  const { name, style, colors, branding } = config;
  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.modern;
  const css = stylePreset.getCSS(colors);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || 'Booking Tool'} | ${branding?.businessName || 'Business Tools'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${css}

    .time-slots {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 24px;
    }
    .time-slot {
      padding: 12px;
      text-align: center;
      border: 1px solid ${colors.primary}30;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(255,255,255,0.05);
    }
    .time-slot:hover {
      border-color: ${colors.primary};
      background: ${colors.primary}10;
    }
    .time-slot.selected {
      background: ${colors.primary};
      color: white;
      border-color: ${colors.primary};
    }
    .time-slot.unavailable {
      opacity: 0.4;
      cursor: not-allowed;
      text-decoration: line-through;
    }
    .party-size {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
    }
    .party-btn {
      width: 50px;
      height: 50px;
      border: 1px solid ${colors.primary}30;
      border-radius: 8px;
      background: rgba(255,255,255,0.05);
      color: inherit;
      font-size: 1.1rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .party-btn:hover, .party-btn.selected {
      background: ${colors.primary};
      color: white;
      border-color: ${colors.primary};
    }
    .booking-summary {
      padding: 20px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      margin-top: 20px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .summary-row:last-child {
      border-bottom: none;
    }
  </style>
</head>
<body>
  <div class="tool-container">
    <div class="tool-header">
      <h1 class="tool-title">${name || 'Book a Table'}</h1>
      <p class="tool-subtitle">Reserve your spot</p>
    </div>

    <form id="booking-form">
      <div class="form-group">
        <label class="form-label">Select Date</label>
        <input type="date" class="form-input" id="booking-date" required>
      </div>

      <div class="form-group">
        <label class="form-label">Party Size</label>
        <div class="party-size" id="party-size">
          <button type="button" class="party-btn" data-size="1">1</button>
          <button type="button" class="party-btn selected" data-size="2">2</button>
          <button type="button" class="party-btn" data-size="3">3</button>
          <button type="button" class="party-btn" data-size="4">4</button>
          <button type="button" class="party-btn" data-size="5">5</button>
          <button type="button" class="party-btn" data-size="6">6+</button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Select Time</label>
        <div class="time-slots" id="time-slots">
          <div class="time-slot" data-time="11:00">11:00 AM</div>
          <div class="time-slot" data-time="11:30">11:30 AM</div>
          <div class="time-slot" data-time="12:00">12:00 PM</div>
          <div class="time-slot unavailable" data-time="12:30">12:30 PM</div>
          <div class="time-slot" data-time="13:00">1:00 PM</div>
          <div class="time-slot" data-time="13:30">1:30 PM</div>
          <div class="time-slot unavailable" data-time="18:00">6:00 PM</div>
          <div class="time-slot" data-time="18:30">6:30 PM</div>
          <div class="time-slot" data-time="19:00">7:00 PM</div>
          <div class="time-slot" data-time="19:30">7:30 PM</div>
          <div class="time-slot" data-time="20:00">8:00 PM</div>
          <div class="time-slot" data-time="20:30">8:30 PM</div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Your Name</label>
        <input type="text" class="form-input" id="guest-name" placeholder="Enter your name" required>
      </div>

      <div class="form-group">
        <label class="form-label">Phone Number</label>
        <input type="tel" class="form-input" id="guest-phone" placeholder="(555) 123-4567" required>
      </div>

      <div class="form-group">
        <label class="form-label">Special Requests (Optional)</label>
        <textarea class="form-input" id="special-requests" rows="3" placeholder="Allergies, celebrations, seating preferences..."></textarea>
      </div>

      <button type="submit" class="btn-primary">Confirm Reservation</button>
    </form>

    <div class="result-card" id="result">
      <div class="result-title">Reservation Confirmed!</div>
      <div class="booking-summary">
        <div class="summary-row">
          <span>Date</span>
          <span id="confirm-date">-</span>
        </div>
        <div class="summary-row">
          <span>Time</span>
          <span id="confirm-time">-</span>
        </div>
        <div class="summary-row">
          <span>Party Size</span>
          <span id="confirm-party">-</span>
        </div>
        <div class="summary-row">
          <span>Name</span>
          <span id="confirm-name">-</span>
        </div>
      </div>
      <p style="margin-top:16px;color:#888;font-size:0.9rem">A confirmation has been sent to your phone.</p>
    </div>

    <footer class="brand-footer">
      ${branding?.businessName || 'Restaurant'} • Powered by Blink
    </footer>
  </div>

  <script>
    let selectedTime = null;
    let selectedParty = 2;

    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('booking-date').min = today;
    document.getElementById('booking-date').value = today;

    // Time slot selection
    document.querySelectorAll('.time-slot:not(.unavailable)').forEach(slot => {
      slot.addEventListener('click', function() {
        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        this.classList.add('selected');
        selectedTime = this.dataset.time;
      });
    });

    // Party size selection
    document.querySelectorAll('.party-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.party-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        selectedParty = this.dataset.size;
      });
    });

    // Form submission
    document.getElementById('booking-form').addEventListener('submit', function(e) {
      e.preventDefault();

      if (!selectedTime) {
        alert('Please select a time slot');
        return;
      }

      const date = document.getElementById('booking-date').value;
      const name = document.getElementById('guest-name').value;

      // Format time for display
      const [hours, mins] = selectedTime.split(':');
      const hour = parseInt(hours);
      const timeStr = (hour > 12 ? hour - 12 : hour) + ':' + mins + (hour >= 12 ? ' PM' : ' AM');

      document.getElementById('confirm-date').textContent = new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      document.getElementById('confirm-time').textContent = timeStr;
      document.getElementById('confirm-party').textContent = selectedParty + (selectedParty === '6' ? '+' : '') + ' guest' + (selectedParty !== '1' ? 's' : '');
      document.getElementById('confirm-name').textContent = name;

      document.getElementById('result').classList.add('visible');
    });
  </script>
</body>
</html>`;
}

// ============================================
// ORDER TRACKER
// ============================================

function generateOrderTracker(config) {
  const { name, style, colors, branding } = config;
  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.modern;
  const css = stylePreset.getCSS(colors);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || 'Order Tracker'} | ${branding?.businessName || 'Business Tools'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${css}

    .order-list {
      margin-bottom: 24px;
    }
    .order-item {
      display: grid;
      grid-template-columns: 80px 1fr 100px 120px 60px;
      gap: 12px;
      margin-bottom: 12px;
      align-items: center;
      padding: 16px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
    }
    .order-id {
      font-weight: 600;
      color: ${colors.primary};
    }
    .status-select {
      padding: 10px;
      border: 1px solid #444;
      border-radius: 4px;
      background: #1a1a1a;
      color: #fff;
      font-size: 0.85rem;
    }
    .status-pending { border-left: 4px solid #f59e0b; }
    .status-preparing { border-left: 4px solid #3b82f6; }
    .status-ready { border-left: 4px solid #22c55e; }
    .status-delivered { border-left: 4px solid #888; opacity: 0.7; }
    .add-order {
      padding: 12px 16px;
      background: transparent;
      border: 1px dashed ${colors.primary}60;
      color: ${colors.primary};
      border-radius: 8px;
      cursor: pointer;
      width: 100%;
    }
    .remove-btn {
      padding: 8px 12px;
      background: #fee2e2;
      color: #dc2626;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 20px;
    }
    .stat-card {
      text-align: center;
      padding: 16px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: ${colors.primary};
    }
    .stat-label {
      font-size: 0.7rem;
      color: #888;
      text-transform: uppercase;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="tool-container" style="max-width:700px">
    <div class="tool-header">
      <h1 class="tool-title">${name || 'Order Tracker'}</h1>
      <p class="tool-subtitle">Manage your orders</p>
    </div>

    <div class="form-group">
      <label class="form-label">Active Orders</label>
      <div class="order-list" id="order-list">
        <div class="order-item status-pending">
          <span class="order-id">#001</span>
          <input type="text" class="form-input" value="2x Latte, 1x Croissant" style="margin:0">
          <input type="number" class="form-input" value="18.50" step="0.01" style="margin:0">
          <select class="status-select" onchange="updateStatus(this)">
            <option value="pending" selected>Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
          </select>
          <button class="remove-btn" onclick="removeOrder(this)">×</button>
        </div>
        <div class="order-item status-preparing">
          <span class="order-id">#002</span>
          <input type="text" class="form-input" value="1x Cappuccino, 2x Muffin" style="margin:0">
          <input type="number" class="form-input" value="14.25" step="0.01" style="margin:0">
          <select class="status-select" onchange="updateStatus(this)">
            <option value="pending">Pending</option>
            <option value="preparing" selected>Preparing</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
          </select>
          <button class="remove-btn" onclick="removeOrder(this)">×</button>
        </div>
        <div class="order-item status-ready">
          <span class="order-id">#003</span>
          <input type="text" class="form-input" value="3x Espresso" style="margin:0">
          <input type="number" class="form-input" value="10.50" step="0.01" style="margin:0">
          <select class="status-select" onchange="updateStatus(this)">
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready" selected>Ready</option>
            <option value="delivered">Delivered</option>
          </select>
          <button class="remove-btn" onclick="removeOrder(this)">×</button>
        </div>
      </div>
      <button class="add-order" onclick="addOrder()">+ New Order</button>
    </div>

    <button class="btn-primary" onclick="updateStats()">Refresh Stats</button>

    <div class="result-card visible" id="result">
      <div class="result-title">Order Statistics</div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value" id="stat-pending">1</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-preparing">1</div>
          <div class="stat-label">Preparing</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-ready">1</div>
          <div class="stat-label">Ready</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-total">$43.25</div>
          <div class="stat-label">Total</div>
        </div>
      </div>
    </div>

    <footer class="brand-footer">
      ${branding?.businessName || 'Business'} • Powered by Blink
    </footer>
  </div>

  <script>
    let orderNum = 3;

    function addOrder() {
      orderNum++;
      const list = document.getElementById('order-list');
      const item = document.createElement('div');
      item.className = 'order-item status-pending';
      item.innerHTML = \`
        <span class="order-id">#\${String(orderNum).padStart(3, '0')}</span>
        <input type="text" class="form-input" placeholder="Order items" style="margin:0">
        <input type="number" class="form-input" placeholder="$0.00" step="0.01" style="margin:0">
        <select class="status-select" onchange="updateStatus(this)">
          <option value="pending" selected>Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="delivered">Delivered</option>
        </select>
        <button class="remove-btn" onclick="removeOrder(this)">×</button>
      \`;
      list.appendChild(item);
      updateStats();
    }

    function removeOrder(btn) {
      btn.closest('.order-item').remove();
      updateStats();
    }

    function updateStatus(select) {
      const item = select.closest('.order-item');
      item.className = 'order-item status-' + select.value;
      updateStats();
    }

    function updateStats() {
      const orders = document.querySelectorAll('.order-item');
      let pending = 0, preparing = 0, ready = 0, total = 0;

      orders.forEach(order => {
        const status = order.querySelector('select').value;
        const amount = parseFloat(order.querySelectorAll('input')[1].value) || 0;

        if (status === 'pending') pending++;
        else if (status === 'preparing') preparing++;
        else if (status === 'ready') ready++;

        if (status !== 'delivered') total += amount;
      });

      document.getElementById('stat-pending').textContent = pending;
      document.getElementById('stat-preparing').textContent = preparing;
      document.getElementById('stat-ready').textContent = ready;
      document.getElementById('stat-total').textContent = '$' + total.toFixed(2);
    }

    updateStats();
  </script>
</body>
</html>`;
}

// ============================================
// QUOTE CALCULATOR
// ============================================

function generateQuoteCalculator(config) {
  const { name, style, colors, branding } = config;
  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.modern;
  const css = stylePreset.getCSS(colors);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || 'Quote Calculator'} | ${branding?.businessName || 'Business Tools'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${css}

    .line-items {
      margin-bottom: 24px;
    }
    .line-item {
      display: grid;
      grid-template-columns: 1fr 80px 100px 100px 60px;
      gap: 12px;
      margin-bottom: 12px;
      align-items: center;
    }
    .line-item .form-input { margin: 0; }
    .item-total {
      text-align: right;
      font-weight: 600;
      color: ${colors.primary};
    }
    .add-line {
      padding: 12px 16px;
      background: transparent;
      border: 1px dashed ${colors.primary}60;
      color: ${colors.primary};
      border-radius: 8px;
      cursor: pointer;
      width: 100%;
    }
    .remove-btn {
      padding: 8px 12px;
      background: #fee2e2;
      color: #dc2626;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .quote-totals {
      background: rgba(255,255,255,0.05);
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .total-row:last-child {
      border-bottom: none;
      font-size: 1.2rem;
      font-weight: 700;
      color: ${colors.primary};
    }
  </style>
</head>
<body>
  <div class="tool-container" style="max-width:650px">
    <div class="tool-header">
      <h1 class="tool-title">${name || 'Quote Calculator'}</h1>
      <p class="tool-subtitle">Create professional quotes</p>
    </div>

    <div class="form-group">
      <label class="form-label">Client Information</label>
      <input type="text" class="form-input" id="client-name" placeholder="Client name" style="margin-bottom:12px">
      <input type="email" class="form-input" id="client-email" placeholder="Client email">
    </div>

    <div class="form-group">
      <label class="form-label">Line Items</label>
      <div style="display:grid;grid-template-columns:1fr 80px 100px 100px 60px;gap:12px;margin-bottom:8px;font-size:0.75rem;color:#888;text-transform:uppercase;">
        <span>Description</span>
        <span>Qty</span>
        <span>Unit Price</span>
        <span>Total</span>
        <span></span>
      </div>
      <div class="line-items" id="line-items">
        <div class="line-item">
          <input type="text" class="form-input" placeholder="Service/Product" value="Consultation">
          <input type="number" class="form-input qty-input" value="2" min="1" onchange="calculateLine(this)">
          <input type="number" class="form-input price-input" value="75" step="0.01" onchange="calculateLine(this)">
          <div class="item-total">$150.00</div>
          <button class="remove-btn" onclick="removeLine(this)">×</button>
        </div>
        <div class="line-item">
          <input type="text" class="form-input" placeholder="Service/Product" value="Implementation">
          <input type="number" class="form-input qty-input" value="1" min="1" onchange="calculateLine(this)">
          <input type="number" class="form-input price-input" value="500" step="0.01" onchange="calculateLine(this)">
          <div class="item-total">$500.00</div>
          <button class="remove-btn" onclick="removeLine(this)">×</button>
        </div>
      </div>
      <button class="add-line" onclick="addLine()">+ Add Line Item</button>
    </div>

    <div class="form-group">
      <label class="form-label">Discount (%)</label>
      <input type="number" class="form-input" id="discount" value="0" min="0" max="100" onchange="calculateTotal()">
    </div>

    <button class="btn-primary" onclick="generateQuote()">Generate Quote</button>

    <div class="result-card" id="result">
      <div class="result-title">Quote Summary</div>
      <div class="quote-totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span id="subtotal">$650.00</span>
        </div>
        <div class="total-row">
          <span>Discount</span>
          <span id="discount-amount">-$0.00</span>
        </div>
        <div class="total-row">
          <span>Total</span>
          <span id="grand-total">$650.00</span>
        </div>
      </div>
    </div>

    <footer class="brand-footer">
      ${branding?.businessName || 'Business'} • Powered by Blink
    </footer>
  </div>

  <script>
    function addLine() {
      const list = document.getElementById('line-items');
      const item = document.createElement('div');
      item.className = 'line-item';
      item.innerHTML = \`
        <input type="text" class="form-input" placeholder="Service/Product">
        <input type="number" class="form-input qty-input" value="1" min="1" onchange="calculateLine(this)">
        <input type="number" class="form-input price-input" value="0" step="0.01" onchange="calculateLine(this)">
        <div class="item-total">$0.00</div>
        <button class="remove-btn" onclick="removeLine(this)">×</button>
      \`;
      list.appendChild(item);
    }

    function removeLine(btn) {
      const list = document.getElementById('line-items');
      if (list.children.length > 1) {
        btn.closest('.line-item').remove();
        calculateTotal();
      }
    }

    function calculateLine(input) {
      const row = input.closest('.line-item');
      const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
      const price = parseFloat(row.querySelector('.price-input').value) || 0;
      const total = qty * price;
      row.querySelector('.item-total').textContent = '$' + total.toFixed(2);
      calculateTotal();
    }

    function calculateTotal() {
      let subtotal = 0;
      document.querySelectorAll('.line-item').forEach(row => {
        const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
        const price = parseFloat(row.querySelector('.price-input').value) || 0;
        subtotal += qty * price;
      });

      const discountPct = parseFloat(document.getElementById('discount').value) || 0;
      const discountAmt = subtotal * (discountPct / 100);
      const grandTotal = subtotal - discountAmt;

      document.getElementById('subtotal').textContent = '$' + subtotal.toFixed(2);
      document.getElementById('discount-amount').textContent = '-$' + discountAmt.toFixed(2);
      document.getElementById('grand-total').textContent = '$' + grandTotal.toFixed(2);
    }

    function generateQuote() {
      calculateTotal();
      document.getElementById('result').classList.add('visible');
    }

    calculateTotal();
  </script>
</body>
</html>`;
}

// ============================================
// TIMER / STOPWATCH TOOL
// ============================================

function generateTimerTool(config) {
  const { name, style, colors, branding } = config;
  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.modern;
  const css = stylePreset.getCSS(colors);
  const toolName = name || 'Timer';
  const toolNameLower = toolName.toLowerCase();

  // Context-aware presets
  const isCoffee = toolNameLower.includes('coffee') || toolNameLower.includes('brew') || toolNameLower.includes('espresso');
  const isCooking = toolNameLower.includes('cook') || toolNameLower.includes('kitchen') || toolNameLower.includes('baking');

  let presetsHtml;
  if (isCoffee) {
    presetsHtml = `
      <button class="preset-btn" onclick="setTimer(25, 'Espresso')">☕ Espresso<br><small>0:25</small></button>
      <button class="preset-btn" onclick="setTimer(240, 'Pour Over')">💧 Pour Over<br><small>4:00</small></button>
      <button class="preset-btn" onclick="setTimer(240, 'French Press')">🫖 French Press<br><small>4:00</small></button>
      <button class="preset-btn" onclick="setTimer(90, 'Aeropress')">⏱️ Aeropress<br><small>1:30</small></button>
      <button class="preset-btn" onclick="setTimer(300, 'Moka Pot')">🔥 Moka Pot<br><small>5:00</small></button>
      <button class="preset-btn" onclick="setTimer(180, 'Cold Brew Bloom')">🧊 Cold Brew<br><small>3:00</small></button>`;
  } else if (isCooking) {
    presetsHtml = `
      <button class="preset-btn" onclick="setTimer(360, 'Soft Boil Egg')">🥚 Soft Boil<br><small>6:00</small></button>
      <button class="preset-btn" onclick="setTimer(600, 'Hard Boil Egg')">🥚 Hard Boil<br><small>10:00</small></button>
      <button class="preset-btn" onclick="setTimer(480, 'Pasta')">🍝 Pasta<br><small>8:00</small></button>
      <button class="preset-btn" onclick="setTimer(1080, 'Rice')">🍚 Rice<br><small>18:00</small></button>
      <button class="preset-btn" onclick="setTimer(900, 'Rest Dough')">🍞 Rest Dough<br><small>15:00</small></button>
      <button class="preset-btn" onclick="setTimer(300, 'Rest Steak')">🥩 Rest Steak<br><small>5:00</small></button>`;
  } else {
    presetsHtml = `
      <button class="preset-btn" onclick="setTimer(30, '30 Seconds')">⚡ 30 sec</button>
      <button class="preset-btn" onclick="setTimer(60, '1 Minute')">⏱️ 1 min</button>
      <button class="preset-btn" onclick="setTimer(180, '3 Minutes')">⏰ 3 min</button>
      <button class="preset-btn" onclick="setTimer(300, '5 Minutes')">🕐 5 min</button>
      <button class="preset-btn" onclick="setTimer(600, '10 Minutes')">🕙 10 min</button>
      <button class="preset-btn" onclick="setTimer(900, '15 Minutes')">🕒 15 min</button>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${toolName} | ${branding?.businessName || 'Tools'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${css}

    .timer-display {
      text-align: center;
      padding: 40px 20px;
      position: relative;
    }
    .timer-ring {
      width: 220px;
      height: 220px;
      margin: 0 auto 20px;
      position: relative;
    }
    .timer-ring svg {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
    }
    .timer-ring circle {
      fill: none;
      stroke-width: 8;
    }
    .ring-bg { stroke: ${colors.primary}20; }
    .ring-progress {
      stroke: ${colors.primary};
      stroke-linecap: round;
      transition: stroke-dashoffset 0.3s ease;
    }
    .timer-time {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 3.5rem;
      font-weight: 700;
      font-family: 'SF Mono', 'Fira Code', monospace;
      color: ${colors.primary};
    }
    .timer-label {
      font-size: 0.9rem;
      color: #888;
      margin-top: 8px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .presets-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 24px;
    }
    .preset-btn {
      padding: 14px 10px;
      background: rgba(255,255,255,0.05);
      border: 2px solid ${colors.primary}30;
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.85rem;
      color: inherit;
      transition: all 0.2s ease;
      line-height: 1.4;
    }
    .preset-btn:hover { border-color: ${colors.primary}60; background: ${colors.primary}10; }
    .preset-btn.active { border-color: ${colors.primary}; background: ${colors.primary}20; }
    .preset-btn small { color: #888; font-size: 0.75rem; }
    .controls {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    .control-btn {
      flex: 1;
      padding: 16px;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-start { background: ${colors.primary}; color: white; }
    .btn-start:hover { filter: brightness(1.1); }
    .btn-pause { background: #f59e0b; color: white; }
    .btn-reset { background: rgba(255,255,255,0.1); color: inherit; border: 1px solid rgba(255,255,255,0.2); }
    .custom-time {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .custom-time .form-input { width: 70px; text-align: center; }
    .timer-running .timer-time { animation: pulse 1s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
    .timer-done .timer-time { animation: flash 0.5s ease-in-out infinite; color: #22c55e; }
    @keyframes flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  </style>
</head>
<body>
  <div class="tool-container">
    <div class="tool-header">
      <h1 class="tool-title">${toolName}</h1>
      <p class="tool-subtitle">Precision timing</p>
    </div>

    <div class="timer-display" id="timer-display">
      <div class="timer-ring">
        <svg viewBox="0 0 220 220">
          <circle class="ring-bg" cx="110" cy="110" r="100"></circle>
          <circle class="ring-progress" id="ring-progress" cx="110" cy="110" r="100"
                  stroke-dasharray="628.32" stroke-dashoffset="0"></circle>
        </svg>
        <div class="timer-time" id="timer-time">00:00</div>
      </div>
      <div class="timer-label" id="timer-label">Select a preset or set custom time</div>
    </div>

    <div class="form-group">
      <label class="form-label">Quick Presets</label>
      <div class="presets-grid">${presetsHtml}</div>
    </div>

    <div class="form-group">
      <label class="form-label">Custom Time</label>
      <div class="custom-time">
        <input type="number" class="form-input" id="custom-min" placeholder="Min" min="0" max="99" value="0">
        <span style="font-size:1.5rem">:</span>
        <input type="number" class="form-input" id="custom-sec" placeholder="Sec" min="0" max="59" value="0">
        <button class="btn-primary" onclick="setCustomTime()" style="padding:12px 16px">Set</button>
      </div>
    </div>

    <div class="controls">
      <button class="control-btn btn-start" id="start-btn" onclick="toggleTimer()">▶ Start</button>
      <button class="control-btn btn-reset" onclick="resetTimer()">↺ Reset</button>
    </div>

    <footer class="brand-footer">
      ${branding?.businessName || 'Timer'} • Powered by Blink
    </footer>
  </div>

  <script>
    let totalSeconds = 0;
    let remainingSeconds = 0;
    let timerInterval = null;
    let isRunning = false;
    const circumference = 628.32;

    function formatTime(s) {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    }

    function updateDisplay() {
      document.getElementById('timer-time').textContent = formatTime(remainingSeconds);
      const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
      document.getElementById('ring-progress').style.strokeDashoffset = circumference * (1 - progress);
    }

    function setTimer(seconds, label) {
      if (isRunning) pauseTimer();
      totalSeconds = seconds;
      remainingSeconds = seconds;
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      if (event && event.target) event.target.classList.add('active');
      document.getElementById('timer-label').textContent = label || 'Ready';
      document.getElementById('timer-display').classList.remove('timer-done');
      updateDisplay();
    }

    function setCustomTime() {
      const min = parseInt(document.getElementById('custom-min').value) || 0;
      const sec = parseInt(document.getElementById('custom-sec').value) || 0;
      setTimer(min * 60 + sec, 'Custom Timer');
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    }

    function toggleTimer() {
      isRunning ? pauseTimer() : startTimer();
    }

    function startTimer() {
      if (remainingSeconds <= 0) return;
      isRunning = true;
      document.getElementById('start-btn').innerHTML = '⏸ Pause';
      document.getElementById('start-btn').classList.remove('btn-start');
      document.getElementById('start-btn').classList.add('btn-pause');
      document.getElementById('timer-display').classList.add('timer-running');
      document.getElementById('timer-display').classList.remove('timer-done');

      timerInterval = setInterval(() => {
        remainingSeconds--;
        updateDisplay();
        if (remainingSeconds <= 0) {
          clearInterval(timerInterval);
          isRunning = false;
          document.getElementById('timer-label').textContent = "⏰ Time's Up!";
          document.getElementById('timer-display').classList.remove('timer-running');
          document.getElementById('timer-display').classList.add('timer-done');
          document.getElementById('start-btn').innerHTML = '▶ Start';
          document.getElementById('start-btn').classList.add('btn-start');
          document.getElementById('start-btn').classList.remove('btn-pause');
        }
      }, 1000);
    }

    function pauseTimer() {
      clearInterval(timerInterval);
      isRunning = false;
      document.getElementById('start-btn').innerHTML = '▶ Resume';
      document.getElementById('start-btn').classList.add('btn-start');
      document.getElementById('start-btn').classList.remove('btn-pause');
      document.getElementById('timer-display').classList.remove('timer-running');
    }

    function resetTimer() {
      clearInterval(timerInterval);
      isRunning = false;
      remainingSeconds = totalSeconds;
      document.getElementById('timer-label').textContent = 'Ready';
      document.getElementById('start-btn').innerHTML = '▶ Start';
      document.getElementById('start-btn').classList.add('btn-start');
      document.getElementById('start-btn').classList.remove('btn-pause');
      document.getElementById('timer-display').classList.remove('timer-running', 'timer-done');
      updateDisplay();
    }
  </script>
</body>
</html>`;
}

// ============================================
// QR CODE GENERATOR TOOL
// ============================================

function generateQRCodeTool(config) {
  const { name, style, colors, branding } = config;
  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.modern;
  const css = stylePreset.getCSS(colors);
  const toolName = name || 'QR Code Generator';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${toolName} | ${branding?.businessName || 'Tools'}</title>
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${css}

    .qr-preview {
      text-align: center;
      padding: 32px;
      background: white;
      border-radius: 12px;
      margin: 24px 0;
    }
    #qr-canvas { max-width: 100%; height: auto; }
    .qr-placeholder {
      width: 200px; height: 200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      border-radius: 8px;
      color: #888;
    }
    .type-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .type-tab {
      padding: 10px 16px;
      background: rgba(255,255,255,0.05);
      border: 1px solid ${colors.primary}30;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.85rem;
      color: inherit;
      transition: all 0.2s ease;
    }
    .type-tab:hover { border-color: ${colors.primary}60; }
    .type-tab.active { background: ${colors.primary}; color: white; border-color: ${colors.primary}; }
    .color-row {
      display: flex;
      gap: 20px;
      align-items: center;
    }
    .color-row label { display: flex; flex-direction: column; gap: 4px; }
    .color-row small { color: #888; }
    .color-row input[type="color"] {
      width: 50px; height: 40px;
      border: none; border-radius: 6px;
      cursor: pointer;
    }
    .download-btns {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }
    .download-btn {
      flex: 1;
      padding: 14px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .btn-png { background: ${colors.primary}; color: white; }
    .btn-svg { background: rgba(255,255,255,0.1); color: inherit; border: 1px solid rgba(255,255,255,0.2); }
  </style>
</head>
<body>
  <div class="tool-container">
    <div class="tool-header">
      <h1 class="tool-title">${toolName}</h1>
      <p class="tool-subtitle">Create QR codes instantly</p>
    </div>

    <div class="form-group">
      <label class="form-label">Content Type</label>
      <div class="type-tabs">
        <button class="type-tab active" onclick="setType('url', this)">🔗 URL</button>
        <button class="type-tab" onclick="setType('text', this)">📝 Text</button>
        <button class="type-tab" onclick="setType('email', this)">✉️ Email</button>
        <button class="type-tab" onclick="setType('phone', this)">📞 Phone</button>
        <button class="type-tab" onclick="setType('wifi', this)">📶 WiFi</button>
      </div>
    </div>

    <div id="input-section">
      <div class="form-group" id="url-input">
        <label class="form-label">URL</label>
        <input type="url" class="form-input" id="qr-url" placeholder="https://example.com" value="https://${(branding?.businessName || 'example').toLowerCase().replace(/\s+/g, '')}.com">
      </div>
      <div class="form-group" id="text-input" style="display:none">
        <label class="form-label">Text</label>
        <textarea class="form-input" id="qr-text" rows="3" placeholder="Enter any text..."></textarea>
      </div>
      <div class="form-group" id="email-input" style="display:none">
        <label class="form-label">Email Address</label>
        <input type="email" class="form-input" id="qr-email" placeholder="email@example.com">
      </div>
      <div class="form-group" id="phone-input" style="display:none">
        <label class="form-label">Phone Number</label>
        <input type="tel" class="form-input" id="qr-phone" placeholder="+1234567890">
      </div>
      <div id="wifi-inputs" style="display:none">
        <div class="form-group">
          <label class="form-label">Network Name (SSID)</label>
          <input type="text" class="form-input" id="wifi-ssid" placeholder="MyNetwork">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="text" class="form-input" id="wifi-pass" placeholder="Password">
        </div>
        <div class="form-group">
          <label class="form-label">Security</label>
          <select class="form-input" id="wifi-security">
            <option value="WPA">WPA/WPA2</option>
            <option value="WEP">WEP</option>
            <option value="">None</option>
          </select>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Colors</label>
      <div class="color-row">
        <label><small>Foreground</small><input type="color" id="qr-fg" value="#000000"></label>
        <label><small>Background</small><input type="color" id="qr-bg" value="#ffffff"></label>
      </div>
    </div>

    <button class="btn-primary" onclick="generateQR()">Generate QR Code</button>

    <div class="qr-preview">
      <div id="qr-placeholder" class="qr-placeholder">Click Generate to create QR code</div>
      <canvas id="qr-canvas" style="display:none"></canvas>
    </div>

    <div class="download-btns">
      <button class="download-btn btn-png" onclick="downloadPNG()">📥 Download PNG</button>
      <button class="download-btn btn-svg" onclick="downloadSVG()">📄 Download SVG</button>
    </div>

    <footer class="brand-footer">
      ${branding?.businessName || 'QR Generator'} • Powered by Blink
    </footer>
  </div>

  <script>
    let currentType = 'url';

    function setType(type, btn) {
      currentType = type;
      document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');

      // Hide all inputs
      ['url', 'text', 'email', 'phone'].forEach(t => {
        document.getElementById(t + '-input').style.display = 'none';
      });
      document.getElementById('wifi-inputs').style.display = 'none';

      // Show selected input
      if (type === 'wifi') {
        document.getElementById('wifi-inputs').style.display = 'block';
      } else {
        document.getElementById(type + '-input').style.display = 'block';
      }
    }

    function getContent() {
      switch(currentType) {
        case 'url': return document.getElementById('qr-url').value;
        case 'text': return document.getElementById('qr-text').value;
        case 'email': return 'mailto:' + document.getElementById('qr-email').value;
        case 'phone': return 'tel:' + document.getElementById('qr-phone').value;
        case 'wifi':
          const ssid = document.getElementById('wifi-ssid').value;
          const pass = document.getElementById('wifi-pass').value;
          const sec = document.getElementById('wifi-security').value;
          return 'WIFI:T:' + sec + ';S:' + ssid + ';P:' + pass + ';;';
        default: return '';
      }
    }

    function generateQR() {
      const content = getContent();
      if (!content) { alert('Please enter content first'); return; }

      const canvas = document.getElementById('qr-canvas');
      const placeholder = document.getElementById('qr-placeholder');
      const fg = document.getElementById('qr-fg').value;
      const bg = document.getElementById('qr-bg').value;

      QRCode.toCanvas(canvas, content, {
        width: 256,
        margin: 2,
        color: { dark: fg, light: bg }
      }, function(err) {
        if (err) { console.error(err); return; }
        placeholder.style.display = 'none';
        canvas.style.display = 'block';
      });
    }

    function downloadPNG() {
      const canvas = document.getElementById('qr-canvas');
      if (canvas.style.display === 'none') { alert('Generate a QR code first'); return; }
      const link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }

    function downloadSVG() {
      const content = getContent();
      if (!content) { alert('Generate a QR code first'); return; }
      const fg = document.getElementById('qr-fg').value;
      const bg = document.getElementById('qr-bg').value;

      QRCode.toString(content, { type: 'svg', width: 256, margin: 2, color: { dark: fg, light: bg } }, function(err, svg) {
        if (err) { console.error(err); return; }
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.download = 'qrcode.svg';
        link.href = URL.createObjectURL(blob);
        link.click();
      });
    }
  </script>
</body>
</html>`;
}

// ============================================
// SALES CALCULATOR TOOL
// ============================================

function generateSalesCalculatorTool(config) {
  const { name, style, colors, branding } = config;
  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.modern;
  const css = stylePreset.getCSS(colors);
  const toolName = name || 'Sales Calculator';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${toolName} | ${branding?.businessName || 'Business Tools'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${css}

    .sales-entries { margin-bottom: 24px; }
    .sales-entry {
      display: grid;
      grid-template-columns: 1fr 90px 90px 60px;
      gap: 10px;
      margin-bottom: 10px;
      align-items: center;
      padding: 12px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
    }
    .sales-entry .form-input { margin: 0; }
    .add-sale {
      padding: 12px 16px;
      background: transparent;
      border: 1px dashed ${colors.primary}60;
      color: ${colors.primary};
      border-radius: 8px;
      cursor: pointer;
      width: 100%;
    }
    .remove-btn {
      padding: 8px 12px;
      background: #fee2e2;
      color: #dc2626;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .stat-card {
      text-align: center;
      padding: 20px 16px;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
    }
    .stat-card.main { background: ${colors.primary}15; border: 1px solid ${colors.primary}30; }
    .stat-value { font-size: 1.8rem; font-weight: 700; color: ${colors.primary}; }
    .stat-label { font-size: 0.7rem; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    .breakdown { margin-top: 20px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 8px; }
    .breakdown-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .breakdown-row:last-child { border-bottom: none; }
    .positive { color: #22c55e; }
    .negative { color: #ef4444; }
  </style>
</head>
<body>
  <div class="tool-container">
    <div class="tool-header">
      <h1 class="tool-title">${toolName}</h1>
      <p class="tool-subtitle">Track daily revenue</p>
    </div>

    <div class="form-group">
      <label class="form-label">Sales Entries</label>
      <div style="display:grid;grid-template-columns:1fr 90px 90px 60px;gap:10px;margin-bottom:8px;font-size:0.7rem;color:#888;text-transform:uppercase;">
        <span>Item/Category</span><span>Qty</span><span>Price</span><span></span>
      </div>
      <div class="sales-entries" id="sales-entries">
        <div class="sales-entry">
          <input type="text" class="form-input" placeholder="Item" value="Coffee">
          <input type="number" class="form-input" value="45" min="0" onchange="calculate()">
          <input type="number" class="form-input" value="4.50" step="0.01" onchange="calculate()">
          <button type="button" class="remove-btn" onclick="removeEntry(this)">×</button>
        </div>
        <div class="sales-entry">
          <input type="text" class="form-input" placeholder="Item" value="Pastries">
          <input type="number" class="form-input" value="28" min="0" onchange="calculate()">
          <input type="number" class="form-input" value="3.75" step="0.01" onchange="calculate()">
          <button type="button" class="remove-btn" onclick="removeEntry(this)">×</button>
        </div>
        <div class="sales-entry">
          <input type="text" class="form-input" placeholder="Item" value="Sandwiches">
          <input type="number" class="form-input" value="15" min="0" onchange="calculate()">
          <input type="number" class="form-input" value="8.50" step="0.01" onchange="calculate()">
          <button type="button" class="remove-btn" onclick="removeEntry(this)">×</button>
        </div>
      </div>
      <button type="button" class="add-sale" onclick="addEntry()">+ Add Item</button>
    </div>

    <div class="form-group">
      <label class="form-label">Cost of Goods Sold (%)</label>
      <input type="number" class="form-input" id="cogs" value="35" min="0" max="100" onchange="calculate()">
    </div>

    <button class="btn-primary" onclick="calculate()">Calculate</button>

    <div class="result-card visible" id="result">
      <div class="result-title">Sales Summary</div>
      <div class="stats-grid">
        <div class="stat-card main">
          <div class="stat-value" id="revenue">$430.25</div>
          <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat-card main">
          <div class="stat-value positive" id="profit">$279.66</div>
          <div class="stat-label">Gross Profit</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="items">88</div>
          <div class="stat-label">Items Sold</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="avg">$4.89</div>
          <div class="stat-label">Avg/Item</div>
        </div>
      </div>
      <div class="breakdown">
        <div class="breakdown-row">
          <span>Cost of Goods</span>
          <span class="negative" id="cogs-amount">-$150.59</span>
        </div>
        <div class="breakdown-row">
          <span>Profit Margin</span>
          <span class="positive" id="margin">65.0%</span>
        </div>
      </div>
    </div>

    <footer class="brand-footer">
      ${branding?.businessName || 'Business'} • Powered by Blink
    </footer>
  </div>

  <script>
    function addEntry() {
      const list = document.getElementById('sales-entries');
      const entry = document.createElement('div');
      entry.className = 'sales-entry';
      entry.innerHTML = \`
        <input type="text" class="form-input" placeholder="Item">
        <input type="number" class="form-input" value="0" min="0" onchange="calculate()">
        <input type="number" class="form-input" value="0.00" step="0.01" onchange="calculate()">
        <button type="button" class="remove-btn" onclick="removeEntry(this)">×</button>
      \`;
      list.appendChild(entry);
    }

    function removeEntry(btn) {
      const list = document.getElementById('sales-entries');
      if (list.children.length > 1) {
        btn.closest('.sales-entry').remove();
        calculate();
      }
    }

    function calculate() {
      let revenue = 0, items = 0;
      document.querySelectorAll('.sales-entry').forEach(entry => {
        const inputs = entry.querySelectorAll('input');
        const qty = parseFloat(inputs[1].value) || 0;
        const price = parseFloat(inputs[2].value) || 0;
        items += qty;
        revenue += qty * price;
      });

      const cogsRate = parseFloat(document.getElementById('cogs').value) || 0;
      const cogs = revenue * (cogsRate / 100);
      const profit = revenue - cogs;
      const margin = revenue > 0 ? (profit / revenue * 100) : 0;
      const avg = items > 0 ? revenue / items : 0;

      document.getElementById('revenue').textContent = '$' + revenue.toFixed(2);
      document.getElementById('profit').textContent = '$' + profit.toFixed(2);
      document.getElementById('items').textContent = items;
      document.getElementById('avg').textContent = '$' + avg.toFixed(2);
      document.getElementById('cogs-amount').textContent = '-$' + cogs.toFixed(2);
      document.getElementById('margin').textContent = margin.toFixed(1) + '%';
    }

    calculate();
  </script>
</body>
</html>`;
}

// ============================================
// MAIN EXPORT
// ============================================

function generateStyledTool(toolType, config) {
  // First, try exact match
  if (TOOL_GENERATORS[toolType]) {
    return TOOL_GENERATORS[toolType](config);
  }

  // Smart detection based on tool type or name
  const searchText = (toolType + ' ' + (config.name || '')).toLowerCase();

  // Timer/Countdown/Stopwatch detection
  if (searchText.includes('timer') || searchText.includes('stopwatch') ||
      searchText.includes('countdown') || searchText.includes('pomodoro') ||
      searchText.includes('brewing') || searchText.includes('cooking time')) {
    return generateTimerTool(config);
  }

  // QR Code detection
  if (searchText.includes('qr') || searchText.includes('barcode')) {
    return generateQRCodeTool(config);
  }

  // Sales/Revenue Calculator detection
  if (searchText.includes('sales') || searchText.includes('revenue') ||
      searchText.includes('daily total') || searchText.includes('profit margin')) {
    return generateSalesCalculatorTool(config);
  }

  // Receipt/Invoice detection - use quote-calculator as it has line items
  if (searchText.includes('receipt') || searchText.includes('invoice') || searchText.includes('bill')) {
    return generateQuoteCalculator({ ...config, name: config.name || 'Receipt Generator' });
  }

  // Try partial matches on existing generators
  for (const [key, generator] of Object.entries(TOOL_GENERATORS)) {
    if (searchText.includes(key.replace(/-/g, ' ')) || searchText.includes(key.replace(/-/g, ''))) {
      return generator(config);
    }
  }

  // Fallback to generic
  return generateGenericTool({ ...config, name: config.name || toolType });
}

module.exports = {
  generateStyledTool,
  STYLE_PRESETS,
  TOOL_GENERATORS
};
