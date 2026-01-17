/**
 * Generation Variety Configuration
 * Forces distinct designs for each generation
 */

// Hero layout variations - AI must pick ONE and stick to it
const HERO_LAYOUTS = {
  'centered-dramatic': {
    name: 'Centered Dramatic',
    description: 'Centered text over full-bleed dark imagery. Headline stacked vertically, large CTA button below.',
    cssHints: 'text-align: center; minHeight: 100vh; dark overlay gradient; headline fontSize 64px+',
    textAlignment: 'center',
    ctaPosition: 'below-headline'
  },
  'left-aligned-clean': {
    name: 'Left-Aligned Clean',
    description: 'Left-aligned headline with supporting text, CTA buttons on left. Image or abstract shapes on right 40%.',
    cssHints: 'display: grid; grid-template-columns: 60% 40%; text-align: left; padding: 120px',
    textAlignment: 'left',
    ctaPosition: 'inline'
  },
  'split-screen': {
    name: 'Split Screen 50/50',
    description: 'Exactly 50/50 split. Left side: solid color background with all text. Right side: full-bleed image.',
    cssHints: 'display: grid; grid-template-columns: 1fr 1fr; no gap; image covers full right half',
    textAlignment: 'left',
    ctaPosition: 'stacked'
  },
  'asymmetric-overlap': {
    name: 'Asymmetric Overlap',
    description: 'Large image taking 70% of space, text box overlapping from the corner with shadow.',
    cssHints: 'position: relative; text box with box-shadow and solid background overlapping image',
    textAlignment: 'left',
    ctaPosition: 'inside-box'
  },
  'minimal-typography': {
    name: 'Minimal Typography Focus',
    description: 'Nearly all white/light background. Massive headline (80px+), minimal supporting text, subtle CTA.',
    cssHints: 'background: light color; headline: 80px+ black text; minimal imagery; lots of whitespace',
    textAlignment: 'center',
    ctaPosition: 'understated'
  },
  'video-cinematic': {
    name: 'Video Cinematic',
    description: 'Full-screen video background with centered content. Heavy dark overlay for readability.',
    cssHints: 'VideoBackground component; height: 100vh; overlay: linear-gradient dark; white text',
    textAlignment: 'center',
    ctaPosition: 'prominent'
  },
  'card-stack': {
    name: 'Card Stack Hero',
    description: 'Hero content inside elevated card/panel floating over gradient or pattern background.',
    cssHints: 'card with boxShadow floating over gradient background; content inside card',
    textAlignment: 'center',
    ctaPosition: 'inside-card'
  },
  'diagonal-split': {
    name: 'Diagonal Split',
    description: 'Diagonal line divides hero - one side dark with text, other side light/image using CSS clip-path.',
    cssHints: 'clip-path: polygon for diagonal division; contrasting halves',
    textAlignment: 'left',
    ctaPosition: 'on-dark-side'
  }
};

// Color scheme variations within same base palette
const COLOR_VARIATIONS = {
  'standard': {
    name: 'Standard',
    modifier: 'Use the exact brand colors provided',
    heroBackground: 'dark-gradient',
    accentUsage: 'buttons-and-highlights'
  },
  'inverted': {
    name: 'Inverted',
    modifier: 'Swap primary and accent colors. Use accent as the dominant hero color.',
    heroBackground: 'accent-gradient',
    accentUsage: 'primary-becomes-accent'
  },
  'monochrome-dark': {
    name: 'Monochrome Dark',
    modifier: 'Use ONLY the primary color in various shades. Dark mode feel. Hero: dark primary.',
    heroBackground: 'dark-primary',
    accentUsage: 'lighter-primary-shades'
  },
  'monochrome-light': {
    name: 'Monochrome Light',
    modifier: 'Use ONLY the primary color in various shades. Light mode feel. Hero: very light primary tint.',
    heroBackground: 'light-tint',
    accentUsage: 'darker-primary-shades'
  },
  'gradient-rich': {
    name: 'Gradient Rich',
    modifier: 'Use vibrant gradients mixing primary and accent throughout. Hero: dramatic gradient.',
    heroBackground: 'mixed-gradient',
    accentUsage: 'gradient-partner'
  },
  'neutral-pop': {
    name: 'Neutral with Color Pop',
    modifier: 'Use mostly grays/neutrals with primary as accent pop. Hero: dark neutral with colored CTAs.',
    heroBackground: 'dark-neutral',
    accentUsage: 'color-pop-only'
  }
};

// Section ordering variations by industry type
const SECTION_ORDERS = {
  'restaurant': [
    ['hero', 'menu-highlights', 'about-story', 'gallery', 'hours-location', 'reservations', 'reviews', 'contact'],
    ['hero', 'about-story', 'menu-highlights', 'chef-feature', 'gallery', 'reviews', 'hours-location', 'contact'],
    ['hero', 'gallery', 'menu-highlights', 'about-story', 'specials', 'reviews', 'hours-location', 'contact'],
    ['hero', 'specials-banner', 'menu-highlights', 'gallery', 'about-story', 'reviews', 'contact']
  ],
  'professional': [
    ['hero', 'services', 'about', 'team', 'testimonials', 'results', 'cta', 'contact'],
    ['hero', 'trust-badges', 'about', 'services', 'case-studies', 'team', 'testimonials', 'contact'],
    ['hero', 'results-stats', 'services', 'process', 'team', 'testimonials', 'about', 'contact'],
    ['hero', 'about', 'services', 'why-choose', 'testimonials', 'faq', 'contact']
  ],
  'creative': [
    ['hero', 'portfolio-grid', 'about', 'services', 'process', 'testimonials', 'contact'],
    ['hero', 'featured-work', 'about', 'services', 'awards', 'testimonials', 'contact'],
    ['hero', 'about', 'portfolio-grid', 'services', 'clients', 'testimonials', 'contact'],
    ['hero', 'video-reel', 'services', 'portfolio-grid', 'about', 'contact']
  ],
  'entertainment': [
    ['hero', 'attractions', 'packages', 'gallery', 'booking', 'faq', 'reviews', 'contact'],
    ['hero', 'video-showcase', 'attractions', 'events', 'packages', 'gallery', 'reviews', 'contact'],
    ['hero', 'events-upcoming', 'attractions', 'packages', 'gallery', 'hours-location', 'contact'],
    ['hero', 'packages', 'attractions', 'gallery', 'events', 'reviews', 'contact']
  ],
  'retail': [
    ['hero', 'featured-products', 'categories', 'about', 'testimonials', 'newsletter', 'contact'],
    ['hero', 'sale-banner', 'categories', 'featured-products', 'about', 'reviews', 'contact'],
    ['hero', 'categories', 'bestsellers', 'new-arrivals', 'about', 'reviews', 'contact'],
    ['hero', 'featured-products', 'shop-by-category', 'about', 'loyalty-program', 'contact']
  ],
  'fitness': [
    ['hero', 'classes', 'membership', 'trainers', 'gallery', 'testimonials', 'schedule', 'contact'],
    ['hero', 'transformation-stories', 'classes', 'membership', 'trainers', 'gallery', 'contact'],
    ['hero', 'membership', 'classes', 'trainers', 'facilities', 'testimonials', 'contact'],
    ['hero', 'free-trial-cta', 'classes', 'trainers', 'membership', 'gallery', 'contact']
  ],
  'default': [
    ['hero', 'services', 'about', 'testimonials', 'cta', 'contact'],
    ['hero', 'about', 'services', 'results', 'testimonials', 'contact'],
    ['hero', 'features', 'about', 'services', 'testimonials', 'pricing', 'contact'],
    ['hero', 'why-choose', 'services', 'about', 'testimonials', 'faq', 'contact']
  ]
};

// Card/component style variations
const COMPONENT_STYLES = {
  'cards': {
    'elevated': 'boxShadow: 0 4px 20px rgba(0,0,0,0.1); borderRadius: 16px; no border',
    'bordered': 'border: 1px solid rgba(0,0,0,0.1); borderRadius: 8px; no shadow',
    'flat': 'background: slightly different shade; no shadow; no border; borderRadius: 4px',
    'glassmorphic': 'background: rgba(255,255,255,0.1); backdropFilter: blur(10px); border: 1px solid rgba(255,255,255,0.2)',
    'minimal': 'no background; no border; no shadow; just content with dividers'
  },
  'buttons': {
    'solid-rounded': 'solid background; borderRadius: 8px; padding: 14px 28px',
    'pill': 'solid background; borderRadius: 9999px; padding: 14px 32px',
    'outline': 'transparent background; border: 2px solid; borderRadius: 8px',
    'minimal': 'no background; text with underline or arrow',
    'gradient': 'linear-gradient background; borderRadius: 8px'
  },
  'sections': {
    'full-bleed': 'sections span full width edge-to-edge',
    'contained': 'sections have max-width container with side padding',
    'alternating': 'alternate between full-bleed and contained',
    'asymmetric': 'different padding/margins creating visual rhythm'
  }
};

// Helper function to get random item from array
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper function to get random key from object
function randomKey(obj) {
  const keys = Object.keys(obj);
  return keys[Math.floor(Math.random() * keys.length)];
}

// Get randomized variety context for a generation
function getGenerationVariety(industryType = 'default') {
  // Select random hero layout
  const heroLayoutKey = randomKey(HERO_LAYOUTS);
  const heroLayout = HERO_LAYOUTS[heroLayoutKey];

  // Select random color variation
  const colorVarKey = randomKey(COLOR_VARIATIONS);
  const colorVariation = COLOR_VARIATIONS[colorVarKey];

  // Select random section order for industry type
  const industryOrders = SECTION_ORDERS[industryType] || SECTION_ORDERS['default'];
  const sectionOrder = randomChoice(industryOrders);

  // Select random component styles
  const cardStyle = randomChoice(Object.values(COMPONENT_STYLES.cards));
  const buttonStyle = randomChoice(Object.values(COMPONENT_STYLES.buttons));
  const sectionStyle = randomChoice(Object.values(COMPONENT_STYLES.sections));

  return {
    heroLayout: {
      key: heroLayoutKey,
      ...heroLayout
    },
    colorVariation: {
      key: colorVarKey,
      ...colorVariation
    },
    sectionOrder,
    componentStyles: {
      cards: cardStyle,
      buttons: buttonStyle,
      sections: sectionStyle
    }
  };
}

// Build variety prompt section
function buildVarietyPrompt(variety) {
  return `
══════════════════════════════════════════════════════════════
🎲 GENERATION VARIETY - MAKE THIS SITE UNIQUE!
══════════════════════════════════════════════════════════════
To ensure each generated site looks DIFFERENT, follow these SPECIFIC choices:

🎯 HERO LAYOUT: ${variety.heroLayout.name}
${variety.heroLayout.description}
CSS approach: ${variety.heroLayout.cssHints}
Text alignment: ${variety.heroLayout.textAlignment}
CTA position: ${variety.heroLayout.ctaPosition}

🎨 COLOR APPLICATION: ${variety.colorVariation.name}
${variety.colorVariation.modifier}
Hero background style: ${variety.colorVariation.heroBackground}
Accent usage: ${variety.colorVariation.accentUsage}

📋 SECTION ORDER (follow this EXACT order for Home page):
${variety.sectionOrder.map((section, i) => `${i + 1}. ${section}`).join('\n')}

🃏 COMPONENT STYLES:
- Cards: ${variety.componentStyles.cards}
- Buttons: ${variety.componentStyles.buttons}
- Sections: ${variety.componentStyles.sections}

IMPORTANT: These choices are RANDOM - follow them exactly to create variety between sites!
══════════════════════════════════════════════════════════════
`;
}

// Map industry to type for section ordering
function getIndustryType(industryName) {
  const name = (industryName || '').toLowerCase();

  if (name.includes('pizza') || name.includes('restaurant') || name.includes('cafe') ||
      name.includes('bakery') || name.includes('bar') || name.includes('food')) {
    return 'restaurant';
  }
  if (name.includes('law') || name.includes('dental') || name.includes('accounting') ||
      name.includes('consulting') || name.includes('insurance') || name.includes('healthcare')) {
    return 'professional';
  }
  if (name.includes('tattoo') || name.includes('photo') || name.includes('design') ||
      name.includes('agency') || name.includes('portfolio') || name.includes('wedding')) {
    return 'creative';
  }
  if (name.includes('bowling') || name.includes('arcade') || name.includes('entertainment') ||
      name.includes('event') || name.includes('venue') || name.includes('party')) {
    return 'entertainment';
  }
  if (name.includes('shop') || name.includes('store') || name.includes('retail') ||
      name.includes('ecommerce') || name.includes('boutique')) {
    return 'retail';
  }
  if (name.includes('fitness') || name.includes('gym') || name.includes('yoga') ||
      name.includes('crossfit') || name.includes('training')) {
    return 'fitness';
  }

  return 'default';
}

module.exports = {
  HERO_LAYOUTS,
  COLOR_VARIATIONS,
  SECTION_ORDERS,
  COMPONENT_STYLES,
  getGenerationVariety,
  buildVarietyPrompt,
  getIndustryType
};
