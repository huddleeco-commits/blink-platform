/**
 * Prompt Builders
 * Extracted from server.cjs
 *
 * Handles: Industry detection, prompt construction, context building
 */

const { VISUAL_ARCHETYPES } = require('../configs/index.cjs');

// These need to be passed in or loaded separately
let INDUSTRIES, LAYOUTS, EFFECTS, SECTIONS;

/**
 * Initialize prompt builders with config data
 */
function initPromptBuilders(config) {
  INDUSTRIES = config.INDUSTRIES;
  LAYOUTS = config.LAYOUTS;
  EFFECTS = config.EFFECTS;
  SECTIONS = config.SECTIONS;
}

// ============================================
// INDUSTRY DETECTION - Keyword-based matching
// ============================================
function detectIndustryFromDescription(description) {
  const text = description.toLowerCase();
  
  // Order matters - more specific matches first
  const patterns = [
    // Finance/Investment (BEFORE SaaS to catch investment firms)
    { industry: 'finance', keywords: ['investment', 'wealth management', 'portfolio', 'hedge fund', 'private equity', 'asset management', 'financial advisor', 'capital', 'securities', 'trading firm', 'brokerage'] },
    
    // Law
    { industry: 'law-firm', keywords: ['law firm', 'attorney', 'lawyer', 'legal', 'litigation', 'counsel'] },
    
    // Healthcare
    { industry: 'healthcare', keywords: ['medical', 'healthcare', 'clinic', 'hospital', 'physician', 'doctor office', 'health center'] },
    { industry: 'dental', keywords: ['dental', 'dentist', 'orthodont', 'oral surgery'] },
    { industry: 'chiropractic', keywords: ['chiropract', 'physical therapy', 'pt clinic', 'rehab center'] },
    { industry: 'spa-salon', keywords: ['spa', 'salon', 'beauty', 'nail', 'hair stylist', 'esthetician', 'massage therapy'] },
    
    // Food & Beverage (pizza FIRST - more specific than restaurant)
    { industry: 'pizza', keywords: ['pizza', 'pizzeria', 'pie shop', 'slice'] },
    { industry: 'restaurant', keywords: ['restaurant', 'dining', 'bistro', 'eatery', 'fine dining', 'steakhouse', 'seafood', 'bbq', 'barbecue', 'grill'] },
    { industry: 'cafe', keywords: ['coffee', 'cafe', 'espresso', 'tea house', 'roaster'] },
    { industry: 'bar', keywords: ['bar', 'nightclub', 'lounge', 'pub', 'brewery', 'cocktail', 'wine bar'] },
    { industry: 'bakery', keywords: ['bakery', 'pastry', 'cake shop', 'donut', 'bread'] },
    
    // Professional Services
    { industry: 'accounting', keywords: ['accounting', 'cpa', 'bookkeep', 'tax preparation', 'audit'] },
    { industry: 'consulting', keywords: ['consulting', 'consultant', 'advisory', 'strategy firm'] },
    { industry: 'real-estate', keywords: ['real estate', 'realtor', 'property', 'realty', 'broker'] },
    { industry: 'insurance', keywords: ['insurance', 'coverage', 'policy', 'claims'] },
    
    // Fitness & Wellness
    { industry: 'fitness', keywords: ['gym', 'fitness center', 'crossfit', 'personal training', 'workout'] },
    { industry: 'yoga', keywords: ['yoga', 'pilates', 'meditation studio', 'wellness studio'] },
    
    // Tech
    { industry: 'saas', keywords: ['saas', 'software', 'platform', 'app', 'tech startup', 'b2b', 'dashboard', 'analytics tool'] },
    { industry: 'startup', keywords: ['startup', 'disrupt', 'innovation lab', 'venture'] },
    { industry: 'agency', keywords: ['agency', 'marketing agency', 'design agency', 'creative agency', 'digital agency', 'seo', 'ppc'] },
    
    // Retail
    { industry: 'ecommerce', keywords: ['ecommerce', 'online store', 'shop', 'retail', 'boutique', 'merchandise'] },
    { industry: 'subscription-box', keywords: ['subscription box', 'monthly box', 'curated box'] },
    
    // Creative
    { industry: 'photography', keywords: ['photography', 'photographer', 'photo studio', 'headshot'] },
    { industry: 'wedding', keywords: ['wedding', 'event planner', 'bridal', 'event coordinator'] },
    { industry: 'portfolio', keywords: ['portfolio', 'freelance', 'designer portfolio', 'developer portfolio'] },
    
    // Organizations
    { industry: 'nonprofit', keywords: ['nonprofit', 'charity', 'foundation', 'ngo', 'cause'] },
    { industry: 'church', keywords: ['church', 'ministry', 'worship', 'congregation', 'faith'] },
    
    // Education
    { industry: 'school', keywords: ['school', 'academy', 'institute', 'university', 'college', 'education'] },
    { industry: 'online-course', keywords: ['online course', 'e-learning', 'bootcamp', 'training program', 'masterclass'] },
    
    // Trade Services
    { industry: 'construction', keywords: ['construction', 'contractor', 'builder', 'remodel', 'renovation', 'roofing'] },
    { industry: 'plumber', keywords: ['plumb', 'hvac', 'heating', 'cooling', 'air condition'] },
    { industry: 'electrician', keywords: ['electric', 'wiring', 'electrical contractor'] },
    { industry: 'landscaping', keywords: ['landscap', 'lawn care', 'garden', 'yard', 'tree service'] },
    { industry: 'cleaning', keywords: ['cleaning', 'maid', 'janitorial', 'housekeep'] },
    { industry: 'auto-repair', keywords: ['auto repair', 'mechanic', 'car service', 'automotive', 'body shop', 'oil change'] },
    
    // Other Services
    { industry: 'pet-services', keywords: ['pet', 'grooming', 'veterinar', 'dog walk', 'pet sit', 'kennel'] },
    { industry: 'moving', keywords: ['moving', 'movers', 'relocation', 'hauling'] },
    
    // Events & Hospitality
    { industry: 'event-venue', keywords: ['venue', 'banquet', 'event space', 'conference center', 'ballroom'] },
    { industry: 'hotel', keywords: ['hotel', 'resort', 'inn', 'lodging', 'hospitality', 'motel'] },
    { industry: 'travel', keywords: ['travel', 'tour', 'vacation', 'trip', 'adventure'] },
    
    // Entertainment
    { industry: 'musician', keywords: ['musician', 'band', 'artist', 'singer', 'dj', 'music producer'] },
    { industry: 'podcast', keywords: ['podcast', 'content creator', 'youtuber', 'streamer'] },
    { industry: 'gaming', keywords: ['gaming', 'esport', 'gamer', 'twitch'] },
  ];
  
  for (const { industry, keywords } of patterns) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        console.log(`   🎯 Detected industry: ${industry} (matched: "${keyword}")`);
        return industry;
      }
    }
  }
  
  // Default fallback
  console.log(`   🎯 No specific match, defaulting to: saas`);
  return 'saas';
}

// Build minimal prompt for AI - only includes what's needed
function buildPrompt(industryKey, layoutKey, selectedEffects) {
  const industry = INDUSTRIES[industryKey];
  if (!industry) return null;
  
  const layout = layoutKey ? LAYOUTS[layoutKey] : LAYOUTS[industry.defaultLayout] || LAYOUTS['hero-full-image'];
  const effects = (selectedEffects || industry.effects || []).map(e => EFFECTS[e]).filter(Boolean);
  const sections = (industry.sections || []).map(s => SECTIONS[s] || s);
  
  return {
    industry: {
      name: industry.name,
      vibe: industry.vibe,
      visualPrompt: industry.visualPrompt
    },
    colors: industry.colors,
    typography: industry.typography,
    imagery: industry.imagery,
    layout: {
      name: layout?.name || 'Hero Full Image',
      description: layout?.description || 'Full-width hero with background image',
      codeHint: layout?.codeHint || 'Full viewport hero section',
      heroHeight: layout?.heroHeight || '70vh'
    },
    effects: effects.map(e => ({ name: e.name, css: e.css, reactHint: e.reactHint })),
    sections: sections.map(s => typeof s === 'string' ? s : { name: s.name, elements: s.elements })
  };
}

/**
 * Build smart context guide for AI to infer realistic content from minimal input
 * This helps Claude generate specific, realistic content even when user provides minimal details
 */
function buildSmartContextGuide(businessInput, industryName) {
  const input = (businessInput || '').toLowerCase();
  const industry = (industryName || '').toLowerCase();

  // Detect business type from input keywords
  const contextHints = [];

  // Restaurant/Food detection
  if (input.includes('pizza') || input.includes('pizzeria') || industry.includes('restaurant')) {
    contextHints.push(`
DETECTED: PIZZA/ITALIAN RESTAURANT
Generate these specific elements:
- MENU: Create 15-20 actual menu items with names like "Margherita", "Meat Lovers Supreme", "Brooklyn Special"
- PRICES: Pizzas $14-24, Appetizers $8-14, Salads $10-15, Drinks $3-5, Desserts $6-9
- SECTIONS: Pizzas, Specialty Pizzas, Calzones, Salads, Appetizers, Drinks, Desserts
- HOURS: Mon-Thu 11am-10pm, Fri-Sat 11am-11pm, Sun 12pm-9pm
- FEATURES: Dine-in, Takeout, Delivery, Catering available
- ATMOSPHERE: Family-friendly, casual Italian dining
`);
  }

  if (input.includes('dental') || input.includes('dentist') || industry.includes('dental')) {
    contextHints.push(`
DETECTED: DENTAL PRACTICE
Generate these specific elements:
- SERVICES: General Dentistry, Cosmetic Dentistry, Teeth Whitening, Dental Implants, Invisalign, Emergency Care
- TEAM: Create 3-4 dentist/hygienist profiles with realistic names and specialties
- INSURANCE: "We accept most major insurance plans including Delta, Cigna, Aetna, MetLife"
- HOURS: Mon-Fri 8am-5pm, Sat 9am-2pm (by appointment)
- FEATURES: New patient specials, Same-day appointments, Sedation dentistry available
- ATMOSPHERE: Modern, comfortable, family-friendly practice
`);
  }

  if (input.includes('law') || input.includes('attorney') || input.includes('legal') || industry.includes('legal') || industry.includes('law')) {
    contextHints.push(`
DETECTED: LAW FIRM
Generate these specific elements:
- PRACTICE AREAS: Personal Injury, Family Law, Criminal Defense, Estate Planning, Business Law
- TEAM: Create 3-5 attorney profiles with JD credentials, bar admissions, years of experience
- STATS: "Over $50M recovered for clients", "500+ cases won", "35+ years combined experience"
- CONSULTATION: Free initial consultation, No fee unless we win (for PI cases)
- HOURS: Mon-Fri 9am-6pm, 24/7 for emergencies
- ATMOSPHERE: Professional, trustworthy, client-focused
`);
  }

  if (input.includes('gym') || input.includes('fitness') || input.includes('crossfit') || industry.includes('fitness')) {
    contextHints.push(`
DETECTED: FITNESS/GYM
Generate these specific elements:
- CLASSES: CrossFit, HIIT, Spin, Yoga, Strength Training, Boxing, Personal Training
- MEMBERSHIP: Basic $29/mo, Premium $49/mo, VIP $79/mo with specific features for each
- AMENITIES: Free weights, Cardio machines, Locker rooms, Showers, Sauna, Smoothie bar
- HOURS: Mon-Fri 5am-10pm, Sat-Sun 7am-8pm
- FEATURES: Free trial class, No contract options, Personal training available
- ATMOSPHERE: Motivating, high-energy, supportive community
`);
  }

  if (input.includes('salon') || input.includes('spa') || input.includes('beauty') || industry.includes('spa') || industry.includes('salon')) {
    contextHints.push(`
DETECTED: SALON/SPA
Generate these specific elements:
- SERVICES: Haircuts $35-75, Color $85-150, Highlights $120-200, Facials $75-150, Massage $80-150, Nails $25-65
- TEAM: Create 4-6 stylist profiles with specialties and experience
- PACKAGES: Bridal packages, Spa day packages, Monthly memberships
- HOURS: Tue-Sat 9am-7pm, Sun-Mon closed
- FEATURES: Online booking, Gift cards, Loyalty program
- ATMOSPHERE: Relaxing, upscale, luxurious pampering experience
`);
  }

  if (input.includes('plumb') || input.includes('hvac') || input.includes('electric') || industry.includes('plumber') || industry.includes('home-services')) {
    contextHints.push(`
DETECTED: HOME SERVICES (Plumbing/HVAC/Electrical)
Generate these specific elements:
- SERVICES: Emergency repairs, Installation, Maintenance, Inspections
- PRICING: Service call $89, specific job estimates on common repairs
- AVAILABILITY: 24/7 emergency service, Same-day appointments
- COVERAGE: List 5-10 cities/neighborhoods served
- TRUST: Licensed, bonded, insured, background-checked technicians
- GUARANTEES: Satisfaction guaranteed, Upfront pricing, No overtime charges
`);
  }

  if (input.includes('auto') || input.includes('car') || input.includes('mechanic') || industry.includes('auto')) {
    contextHints.push(`
DETECTED: AUTO REPAIR/DEALERSHIP
Generate these specific elements:
- SERVICES: Oil changes $39.99, Brake service, Tire rotation, Engine diagnostics, A/C repair
- BRANDS: All makes and models, or specific brand specialization
- WARRANTIES: 12-month/12,000-mile warranty on repairs
- HOURS: Mon-Fri 7:30am-6pm, Sat 8am-4pm
- FEATURES: Free estimates, Loaner cars available, Shuttle service
- TRUST: ASE certified technicians, BBB A+ rating
`);
  }

  if (input.includes('tattoo') || input.includes('ink') || input.includes('body art') || industry.includes('tattoo')) {
    contextHints.push(`
DETECTED: TATTOO STUDIO
Generate these specific elements:
- ARTISTS: Create 3-5 tattoo artist profiles with UNIQUE names (like "Marcus 'Blackout' Rodriguez"), each with a specialty:
  * Traditional & Neo-Traditional
  * Photorealistic Portraits
  * Blackwork & Geometric
  * Japanese/Irezumi
  * Watercolor & Abstract
- PRICING: Custom quotes start at $150/hour, minimum $80-100, large pieces by consultation
- SERVICES: Custom tattoos, Cover-ups, Touch-ups, Consultations (free)
- HOURS: Tue-Sat 12pm-10pm, Sun-Mon by appointment only
- POLICIES: 18+ with valid ID, Deposit required, 48-hour cancellation policy
- AFTERCARE: Detailed aftercare instructions provided, Free touch-ups within 6 months
- ATMOSPHERE: Professional, clean, sterile environment, Walk-ins welcome (when available)
`);
  }

  if (input.includes('barber') || input.includes('grooming') || industry.includes('barber')) {
    contextHints.push(`
DETECTED: BARBERSHOP
Generate these specific elements:
- BARBERS: Create 3-5 barber profiles with names and specialties (fades, classic cuts, beard work)
- SERVICES: Haircut $25-35, Beard trim $15, Hot towel shave $30, Kids cut $20, Full service $50
- HOURS: Tue-Fri 9am-7pm, Sat 8am-5pm, Sun-Mon closed
- FEATURES: Walk-ins welcome, Appointments available, Cash and card accepted
- PRODUCTS: Premium pomades, beard oils, grooming kits for sale
- ATMOSPHERE: Classic barbershop vibe, sports on TV, friendly conversation
`);
  }

  if (input.includes('preschool') || input.includes('montessori') || input.includes('daycare') ||
      input.includes('childcare') || input.includes('nursery') || input.includes('kindergarten') ||
      industry.includes('preschool') || industry.includes('montessori') || industry.includes('daycare')) {
    contextHints.push(`
DETECTED: PRESCHOOL/MONTESSORI/DAYCARE
Generate these specific elements:
- PROGRAMS: Infant (6wks-12mo), Toddler (1-2yrs), Preschool (3-4yrs), Pre-K (4-5yrs), Before/After School
- CURRICULUM: Play-based learning, Montessori method, STEM activities, Art & Music, Outdoor play
- TEACHERS: Create 4-6 warm, friendly teacher profiles with education credentials (ECE certified, CPR trained)
- HOURS: Mon-Fri 6:30am-6:30pm, Year-round or School-year options
- TUITION: Full-time $1,200-1,800/mo, Part-time options available, Sibling discounts
- FEATURES: Low student-teacher ratios (1:4 for infants, 1:8 for preschool), Organic snacks, Daily reports via app
- SAFETY: Licensed, Background-checked staff, Secure entry, Video monitoring
- GALLERY: Show children learning, art projects, playground activities, circle time, reading corners
- ATMOSPHERE: Nurturing, educational, safe, fun learning environment
`);
  }

  if (input.includes('education') || input.includes('school') || input.includes('academy') ||
      input.includes('tutoring') || input.includes('learning center') ||
      industry.includes('education') || industry.includes('tutoring')) {
    contextHints.push(`
DETECTED: EDUCATION/TUTORING CENTER
Generate these specific elements:
- PROGRAMS: Math tutoring, Reading/Writing, Test prep (SAT/ACT), STEM enrichment, Language classes
- GRADE LEVELS: Elementary, Middle School, High School, College prep
- INSTRUCTORS: Create 4-6 teacher profiles with degrees and teaching experience
- FORMATS: 1-on-1 tutoring, Small groups (3-5 students), Online sessions, In-home tutoring
- PRICING: $50-100/hour for individual, $30-50/hour for group sessions, Package discounts
- HOURS: Mon-Fri 3pm-8pm, Sat 9am-5pm (peak after-school hours)
- RESULTS: "Students improve 2+ grade levels", "95% see improvement within 3 months"
- FEATURES: Free assessment, Progress tracking, Homework help, Flexible scheduling
- GALLERY: Show students studying, classroom activities, graduation celebrations
- ATMOSPHERE: Supportive, encouraging, academic excellence focus
`);
  }

  // Default guidance if no specific type detected
  if (contextHints.length === 0) {
    contextHints.push(`
GENERAL BUSINESS - Infer from the name and industry:
- Create 6-10 specific services/products with realistic prices
- Generate 3-4 team member profiles with realistic names and roles
- Include specific business hours appropriate for the industry
- Add realistic stats: years in business (10-25), customers served (1000+), rating (4.8+ stars)
- Create 3-4 testimonials with first names and specific praise
- Include specific location/service area details
`);
  }

  return contextHints.join('\n');
}

/**
 * Build layout context from frontend preview configuration
 * This converts the frontend's layoutStylePreview into AI prompt instructions
 */
function buildLayoutContextFromPreview(layoutId, previewConfig, industryKey) {
  const heroStyleMap = {
    'full': 'Full-bleed hero image with overlay text',
    'split': 'Split layout with text on left, image on right',
    'minimal': 'Minimal hero with clean typography focus',
    'corporate': 'Professional corporate hero with subtle imagery',
    'warm': 'Warm, welcoming hero with friendly imagery',
    'clean': 'Clean, modern hero with plenty of whitespace',
    'team': 'Team-focused hero showcasing professionals',
    'overlay': 'Image with gradient overlay and centered text'
  };

  const contentStyleMap = {
    'formal': 'Formal, professional content presentation',
    'results': 'Results-driven with case studies and testimonials',
    'services': 'Services-focused with clear offerings grid',
    'caring': 'Warm, compassionate content for patient/client trust',
    'personal': 'Personal, human-centered content approach'
  };

  const ctaStyleMap = {
    'overlay': 'CTA button overlaid on hero image',
    'button': 'Prominent CTA buttons below hero',
    'prominent': 'Large, eye-catching CTA section',
    'subtle': 'Subtle, professional CTA placement',
    'consultation': 'Free consultation CTA emphasis',
    'booking': 'Easy booking/appointment CTA'
  };

  const heroDesc = heroStyleMap[previewConfig.heroStyle] || 'Modern hero section';
  const contentDesc = contentStyleMap[previewConfig.contentStyle] || '';
  const ctaDesc = ctaStyleMap[previewConfig.ctaStyle] || 'Clear call-to-action';
  const menuPosition = previewConfig.menuPosition ? `Menu position: ${previewConfig.menuPosition}` : '';

  return `
═══════════════════════════════════════════════════════════════
SELECTED LAYOUT STYLE: ${layoutId.replace(/-/g, ' ').toUpperCase()}
═══════════════════════════════════════════════════════════════

HERO SECTION STYLE:
${heroDesc}
${previewConfig.heroStyle === 'full' ? '- Use a dramatic full-width background image\n- Text should be white with text-shadow for readability\n- Include gradient overlay for text contrast' : ''}
${previewConfig.heroStyle === 'split' ? '- Two-column layout: compelling headline on left, visual on right\n- Clean separation between text and image areas' : ''}
${previewConfig.heroStyle === 'minimal' ? '- Focus on typography, minimal imagery\n- Lots of whitespace, clean and elegant\n- Let the copy speak for itself' : ''}

${contentDesc ? `CONTENT STYLE:\n${contentDesc}` : ''}

CTA APPROACH:
${ctaDesc}
${menuPosition}

IMPORTANT: The user specifically chose the "${layoutId.replace(/-/g, ' ')}" layout.
Follow these style guidelines closely when generating the hero and page structure.
═══════════════════════════════════════════════════════════════
`;
}

/**
 * Extract statistics from business description text
 * Parses numbers and context to provide realistic stats for the AI
 */
function extractBusinessStats(businessText, industryName) {
  if (!businessText) {
    return generateDefaultStats(industryName);
  }

  const stats = [];
  const text = businessText.toLowerCase();

  // Pattern matchers for common stat phrases
  const patterns = [
    // Years of experience
    { regex: /(\d+)\+?\s*(?:years?|yrs?)(?:\s+(?:of\s+)?(?:experience|in business|combined))?/gi, label: 'Years Experience', suffix: '+ Years' },
    { regex: /(?:since|established|founded|opened)\s*(?:in\s+)?(\d{4})/gi, type: 'year', label: 'Years in Business', suffix: '+ Years' },
    { regex: /(\d+)\+?\s*(?:years?|yrs?)\s*(?:combined|of combined)/gi, label: 'Combined Experience', suffix: '+ Years' },

    // Reviews and ratings
    { regex: /(\d+)\+?\s*(?:5-star|five star|★+)\s*reviews?/gi, label: 'Reviews', suffix: '+ 5-Star Reviews' },
    { regex: /(\d+)\+?\s*reviews?/gi, label: 'Reviews', suffix: '+ Reviews' },
    { regex: /(\d+(?:\.\d+)?)\s*(?:star|★)\s*(?:rating|average)/gi, label: 'Rating', suffix: ' Stars' },

    // Customers/Clients
    { regex: /(\d+(?:,\d{3})*)\+?\s*(?:happy\s+)?(?:customers?|clients?|families|patients?)/gi, label: 'Customers', suffix: '+ Happy Customers' },
    { regex: /served\s+(?:over\s+)?(\d+(?:,\d{3})*)\+?/gi, label: 'Customers Served', suffix: '+ Served' },

    // Projects/Jobs
    { regex: /(\d+(?:,\d{3})*)\+?\s*(?:projects?|jobs?|homes?|cases?|installations?)/gi, label: 'Projects', suffix: '+ Projects' },
    { regex: /completed\s+(?:over\s+)?(\d+(?:,\d{3})*)\+?/gi, label: 'Completed', suffix: '+ Completed' },

    // Team
    { regex: /(\d+)\+?\s*(?:team\s+members?|employees?|staff|professionals?|experts?|technicians?)/gi, label: 'Team', suffix: '+ Team Members' },

    // Satisfaction
    { regex: /(\d+)%\s*(?:satisfaction|success|retention|customer\s+satisfaction)/gi, label: 'Satisfaction', suffix: '% Satisfaction' },

    // Awards
    { regex: /(\d+)\+?\s*awards?/gi, label: 'Awards', suffix: '+ Awards' },

    // Locations
    { regex: /(\d+)\+?\s*locations?/gi, label: 'Locations', suffix: '+ Locations' },

    // Products/Services
    { regex: /(\d+)\+?\s*(?:products?|services?|menu items?)/gi, label: 'Products', suffix: '+ Products' }
  ];

  const foundStats = {};

  for (const pattern of patterns) {
    const matches = [...businessText.matchAll(pattern.regex)];
    for (const match of matches) {
      let value = match[1];

      // Handle "since YEAR" pattern
      if (pattern.type === 'year') {
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        value = currentYear - year;
      } else {
        // Remove commas and parse
        value = parseInt(value.replace(/,/g, ''));
      }

      if (value > 0 && !foundStats[pattern.label]) {
        foundStats[pattern.label] = { value, suffix: pattern.suffix };
      }
    }
  }

  // Build the stats context string
  if (Object.keys(foundStats).length > 0) {
    let result = 'EXTRACTED STATS FROM BUSINESS DESCRIPTION (USE THESE!):\n';
    for (const [label, data] of Object.entries(foundStats)) {
      result += `- ${label}: ${data.value}${data.suffix}\n`;
      stats.push(`<AnimatedCounter end={${data.value}} suffix="${data.suffix}" duration={2} />`);
    }
    result += '\nUSE THESE EXACT NUMBERS in AnimatedCounter components!\n';
    return result;
  }

  // No stats found - generate industry-appropriate defaults
  return generateDefaultStats(industryName);
}

/**
 * Generate realistic default stats based on industry
 */
function generateDefaultStats(industryName) {
  const industry = (industryName || '').toLowerCase();

  let defaults = {
    years: 15,
    customers: 1000,
    satisfaction: 98,
    extra: null
  };

  // Industry-specific defaults
  if (industry.includes('tattoo') || industry.includes('ink') || industry.includes('body art')) {
    defaults = { years: 8, customers: 5000, satisfaction: 99, extra: { label: 'Custom Designs', value: 10000 } };
  } else if (industry.includes('barber') || industry.includes('hair') || industry.includes('salon') || industry.includes('grooming')) {
    defaults = { years: 12, customers: 2700, satisfaction: 98, extra: { label: 'Master Barbers', value: 4 } };
  } else if (industry.includes('law') || industry.includes('legal')) {
    defaults = { years: 25, customers: 500, satisfaction: 98, extra: { label: 'Cases Won', value: 250 } };
  } else if (industry.includes('restaurant') || industry.includes('food') || industry.includes('pizza')) {
    defaults = { years: 10, customers: 5000, satisfaction: 97, extra: { label: 'Dishes Served', value: 50000 } };
  } else if (industry.includes('fitness') || industry.includes('gym')) {
    defaults = { years: 8, customers: 2000, satisfaction: 96, extra: { label: 'Transformations', value: 500 } };
  } else if (industry.includes('medical') || industry.includes('health') || industry.includes('dental')) {
    defaults = { years: 20, customers: 3000, satisfaction: 99, extra: { label: 'Procedures', value: 10000 } };
  } else if (industry.includes('plumb') || industry.includes('hvac') || industry.includes('electric')) {
    defaults = { years: 15, customers: 2500, satisfaction: 98, extra: { label: 'Jobs Completed', value: 5000 } };
  } else if (industry.includes('bowl') || industry.includes('arcade') || industry.includes('entertainment')) {
    defaults = { years: 12, customers: 10000, satisfaction: 95, extra: { label: 'Parties Hosted', value: 2000 } };
  } else if (industry.includes('retail') || industry.includes('shop')) {
    defaults = { years: 10, customers: 5000, satisfaction: 96, extra: { label: 'Products', value: 500 } };
  } else if (industry.includes('consult') || industry.includes('professional')) {
    defaults = { years: 20, customers: 300, satisfaction: 99, extra: { label: 'Projects', value: 150 } };
  } else if (industry.includes('auto') || industry.includes('car') || industry.includes('mechanic')) {
    defaults = { years: 18, customers: 4000, satisfaction: 97, extra: { label: 'Vehicles Serviced', value: 8000 } };
  } else if (industry.includes('spa') || industry.includes('beauty') || industry.includes('wellness')) {
    defaults = { years: 10, customers: 3500, satisfaction: 98, extra: { label: 'Treatments', value: 15000 } };
  } else if (industry.includes('pet') || industry.includes('vet') || industry.includes('grooming')) {
    defaults = { years: 8, customers: 2000, satisfaction: 99, extra: { label: 'Happy Pets', value: 5000 } };
  } else if (industry.includes('preschool') || industry.includes('montessori') || industry.includes('daycare') ||
             industry.includes('childcare') || industry.includes('nursery') || industry.includes('kindergarten')) {
    defaults = { years: 12, customers: 500, satisfaction: 99, extra: { label: 'Graduates', value: 1500 } };
  } else if (industry.includes('education') || industry.includes('school') || industry.includes('academy') ||
             industry.includes('tutoring') || industry.includes('learning')) {
    defaults = { years: 15, customers: 1000, satisfaction: 97, extra: { label: 'Students Taught', value: 5000 } };
  }

  let result = `NO SPECIFIC STATS FOUND - USE THESE REALISTIC DEFAULTS FOR ${industryName || 'BUSINESS'}:
- Years in Business: ${defaults.years}+ Years
- Customers Served: ${defaults.customers}+ Happy Customers
- Satisfaction Rate: ${defaults.satisfaction}%+ Satisfaction`;

  if (defaults.extra) {
    result += `\n- ${defaults.extra.label}: ${defaults.extra.value}+`;
  }

  result += `

IMPORTANT: These are MINIMUM realistic values. Feel free to adjust slightly higher.
NEVER use 0 or placeholder text like "X" - always use real numbers!`;

  return result;
}

/**
 * Generate CONTEXT-AWARE industry-specific image URLs
 * Returns different images for hero, team, gallery, services based on context
 */
function getIndustryImageUrls(industryName) {
  const industry = (industryName || '').toLowerCase();

  // Context-aware image configurations - different images for different page sections
  const imageConfig = {
    tattoo: {
      hero: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=1920', // Tattoo studio interior
      heroVideo: 'https://videos.pexels.com/video-files/5319884/5319884-hd_1920_1080_30fps.mp4', // Tattoo artist working
      team: [
        'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800', // Tattoo artist working
        'https://images.unsplash.com/photo-1590246814883-57764f7f17c9?w=800', // Tattooed person portrait
        'https://images.unsplash.com/photo-1542727365-19732a80dcfd?w=800', // Artist with tattoo machine
        'https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?w=800'  // Tattooed professional
      ],
      gallery: [
        'https://images.unsplash.com/photo-1562962230-16e4623d36e6?w=800', // Tattoo closeup
        'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=800', // Arm tattoo
        'https://images.unsplash.com/photo-1475403614135-5f1aa0eb5015?w=800', // Back tattoo
        'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800'  // Detailed tattoo work
      ],
      services: [
        'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800', // Tattooing in progress
        'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800'  // Studio setup
      ],
      searchTerms: ['tattoo artist', 'tattoo studio', 'tattooing', 'tattoo art', 'inked']
    },
    barbershop: {
      hero: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920',
      heroVideo: 'https://videos.pexels.com/video-files/3993451/3993451-uhd_2560_1440_25fps.mp4', // Barber cutting hair
      team: [
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800', // Barber at work
        'https://images.unsplash.com/photo-1567894340315-735d7c361db0?w=800', // Barber portrait
        'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800', // Barber styling
        'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=800'  // Barber with client
      ],
      gallery: [
        'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800', // Barber tools
        'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800', // Shop interior
        'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800'  // Styling
      ],
      services: [
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800',
        'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800'
      ],
      searchTerms: ['barbershop', 'barber cutting hair', 'mens grooming', 'barber portrait']
    },
    salon: {
      hero: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920',
      team: [
        'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800', // Stylist working
        'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800', // Hairstylist portrait
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'  // Salon professional
      ],
      gallery: [
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
        'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800'
      ],
      services: [
        'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800',
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'
      ],
      searchTerms: ['hair salon', 'hairstylist', 'hair cutting', 'salon professional']
    },
    restaurant: {
      hero: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920',
      heroVideo: 'https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4', // Chef plating food
      team: [
        'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800', // Chef portrait
        'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=800', // Chef cooking
        'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800'  // Kitchen staff
      ],
      gallery: [
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800', // Food plating
        'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800', // Dish
        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800'  // Food
      ],
      services: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800'
      ],
      searchTerms: ['restaurant interior', 'chef cooking', 'fine dining', 'chef portrait']
    },
    pizza: {
      hero: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=1920',
      heroVideo: 'https://videos.pexels.com/video-files/4253291/4253291-uhd_2560_1440_25fps.mp4', // Pizza being made
      team: [
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', // Pizza chef
        'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800'  // Pizza making
      ],
      gallery: [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
        'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800'
      ],
      services: [
        'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=800'
      ],
      searchTerms: ['pizza chef', 'pizzeria', 'pizza making', 'italian restaurant']
    },
    dental: {
      hero: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1920',
      team: [
        'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800', // Dentist portrait
        'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800', // Dental team
        'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800'  // Dentist working
      ],
      gallery: [
        'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800',
        'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800'
      ],
      services: [
        'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800'
      ],
      searchTerms: ['dentist', 'dental office', 'dental team', 'dental professional']
    },
    fitness: {
      hero: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920',
      heroVideo: 'https://videos.pexels.com/video-files/4761434/4761434-uhd_2560_1440_25fps.mp4', // Gym workout
      team: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', // Personal trainer
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', // Trainer portrait
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800'  // Fitness coach
      ],
      gallery: [
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800'
      ],
      services: [
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'
      ],
      searchTerms: ['personal trainer', 'fitness coach', 'gym trainer', 'workout instructor']
    },
    auto: {
      hero: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920',
      team: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', // Mechanic
        'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800'  // Auto tech
      ],
      gallery: [
        'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
      ],
      services: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
      ],
      searchTerms: ['auto mechanic', 'car repair', 'mechanic portrait', 'auto technician']
    },
    law: {
      hero: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920',
      team: [
        'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800', // Attorney portrait
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800', // Lawyer
        'https://images.unsplash.com/photo-1521791055366-0d553872125f?w=800'  // Legal professional
      ],
      gallery: [
        'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800',
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800'
      ],
      services: [
        'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800'
      ],
      searchTerms: ['attorney', 'law firm', 'lawyer portrait', 'legal professional']
    },
    spa: {
      hero: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920',
      heroVideo: 'https://videos.pexels.com/video-files/3188167/3188167-uhd_2560_1440_25fps.mp4', // Spa massage treatment
      team: [
        'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800', // Spa therapist
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800'  // Wellness professional
      ],
      gallery: [
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800'
      ],
      services: [
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800'
      ],
      searchTerms: ['spa therapist', 'massage therapist', 'wellness professional', 'spa treatment']
    },
    // Education - Preschool, Montessori, Daycare, Learning Centers
    education: {
      hero: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1920', // Children learning
      team: [
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800', // Teacher with students
        'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800', // Teacher smiling
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800', // Educator portrait
        'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800'  // Teacher helping student
      ],
      gallery: [
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', // Children learning
        'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800', // Art project
        'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800', // Classroom activities
        'https://images.unsplash.com/photo-1564429238607-4a7e00ead26a?w=800', // Children playing
        'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800', // Reading time
        'https://images.unsplash.com/photo-1602052793312-b99c2a9ee797?w=800'  // Group activity
      ],
      services: [
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800'
      ],
      searchTerms: ['preschool classroom', 'children learning', 'montessori', 'daycare activities', 'kids art project']
    },
    // Preschool/Montessori specific (alias with child-specific images)
    preschool: {
      hero: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1920', // Kids in classroom
      team: [
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800', // Teacher with children
        'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800', // Teacher reading
        'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800', // Friendly teacher
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800'  // Educator
      ],
      gallery: [
        'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800', // Art activity
        'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800', // Circle time
        'https://images.unsplash.com/photo-1564429238607-4a7e00ead26a?w=800', // Playground
        'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800', // Story time
        'https://images.unsplash.com/photo-1602052793312-b99c2a9ee797?w=800', // Music class
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', // Learning center
        'https://images.unsplash.com/photo-1567057419565-4349c49d8a04?w=800', // Sensory play
        'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800'  // Happy children
      ],
      services: [
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
        'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800'
      ],
      searchTerms: ['preschool', 'montessori classroom', 'toddler activities', 'early childhood', 'daycare']
    },
    default: {
      hero: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920',
      team: [
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800', // Business team
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', // Professional portrait
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800'  // Team member
      ],
      gallery: [
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800'
      ],
      services: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'
      ],
      searchTerms: ['business professional', 'team portrait', 'office', 'professional headshot']
    }
  };

  // Match industry to config with expanded matching
  let config = imageConfig.default;
  if (industry.includes('tattoo') || industry.includes('ink') || industry.includes('body art')) {
    config = imageConfig.tattoo;
  } else if (industry.includes('barber') || industry.includes('grooming')) {
    config = imageConfig.barbershop;
  } else if (industry.includes('salon') || industry.includes('hair') || industry.includes('beauty')) {
    config = imageConfig.salon;
  } else if (industry.includes('pizza') || industry.includes('pizzeria')) {
    config = imageConfig.pizza;
  } else if (industry.includes('restaurant') || industry.includes('food') || industry.includes('dining') || industry.includes('cafe')) {
    config = imageConfig.restaurant;
  } else if (industry.includes('dental') || industry.includes('dentist')) {
    config = imageConfig.dental;
  } else if (industry.includes('fitness') || industry.includes('gym') || industry.includes('yoga')) {
    config = imageConfig.fitness;
  } else if (industry.includes('auto') || industry.includes('car') || industry.includes('mechanic')) {
    config = imageConfig.auto;
  } else if (industry.includes('law') || industry.includes('legal') || industry.includes('attorney')) {
    config = imageConfig.law;
  } else if (industry.includes('spa') || industry.includes('wellness') || industry.includes('massage')) {
    config = imageConfig.spa;
  } else if (industry.includes('preschool') || industry.includes('montessori') || industry.includes('daycare') ||
             industry.includes('childcare') || industry.includes('nursery') || industry.includes('early childhood') ||
             industry.includes('kindergarten') || industry.includes('toddler')) {
    config = imageConfig.preschool;
  } else if (industry.includes('education') || industry.includes('school') || industry.includes('academy') ||
             industry.includes('tutoring') || industry.includes('learning center')) {
    config = imageConfig.education;
  }

  // Return with backward compatibility (hero and secondary) PLUS new context-specific fields
  return {
    hero: config.hero,
    heroVideo: config.heroVideo || null, // Video background for supported industries
    secondary: config.gallery || config.team, // Backward compat
    team: config.team,
    gallery: config.gallery,
    services: config.services,
    searchTerms: config.searchTerms
  };
}

// Build context from existing site (REBUILD mode)
function buildRebuildContext(existingSite) {
  if (!existingSite) return '';
  
  let context = `
══════════════════════════════════════════════════════════════
REBUILD MODE - Upgrading existing site
══════════════════════════════════════════════════════════════
`;

  // Business info
  if (existingSite.businessName) {
    context += `EXISTING BUSINESS: ${existingSite.businessName}\n`;
  }
  
  // What they don't like (avoid these patterns)
  if (existingSite.dislikes && existingSite.dislikes.length > 0) {
    const dislikeMap = {
      'outdated': 'AVOID outdated design patterns - make it modern and fresh',
      'slow': 'PRIORITIZE performance - minimal animations, optimized layout',
      'mobile': 'MOBILE-FIRST design - ensure excellent responsive behavior',
      'colors': 'USE NEW COLOR SCHEME - do not replicate their old colors',
      'layout': 'COMPLETELY NEW LAYOUT - restructure the information hierarchy',
      'fonts': 'MODERN TYPOGRAPHY - use clean, professional font pairings',
      'images': 'BETTER IMAGERY - use high-quality Unsplash images',
      'navigation': 'INTUITIVE NAVIGATION - clear, simple menu structure',
      'content': 'IMPROVED COPY - more compelling headlines and CTAs',
      'trust': 'BUILD TRUST - add testimonials, credentials, social proof'
    };
    context += `\nIMPROVEMENTS REQUESTED:\n`;
    existingSite.dislikes.forEach(d => {
      if (dislikeMap[d]) context += `- ${dislikeMap[d]}\n`;
    });
  }
  
  // User notes
  if (existingSite.userNotes) {
    context += `\nUSER NOTES: "${existingSite.userNotes}"\n`;
  }
  
  // Existing content to potentially reuse
  if (existingSite.pageContent) {
    const { headlines, paragraphs, prices } = existingSite.pageContent;
    
    if (headlines && headlines.length > 0) {
      context += `\nEXISTING HEADLINES (rewrite better, keep meaning):\n`;
      headlines.slice(0, 5).forEach(h => {
        context += `- "${h}"\n`;
      });
    }
    
    if (prices && prices.length > 0) {
      context += `\nPRICING TO INCLUDE: ${prices.slice(0, 6).join(', ')}\n`;
    }
  }
  
  // Existing images to reuse - categorized for better placement
  const catImages = existingSite.designSystem?.categorizedImages;
  if (catImages) {
    context += `\n═══ EXISTING IMAGES BY CATEGORY (use these actual URLs) ═══\n`;
    
    if (catImages.logo?.length > 0) {
      context += `\nLOGO (use in header/nav):\n`;
      catImages.logo.slice(0, 2).forEach(img => {
        context += `  ${img.src}\n`;
      });
    }
    
    if (catImages.hero?.length > 0) {
      context += `\nHERO IMAGES (use as hero backgrounds or feature images):\n`;
      catImages.hero.slice(0, 4).forEach(img => {
        context += `  ${img.src}${img.alt ? ` - ${img.alt}` : ''}\n`;
      });
    }
    
    if (catImages.gallery?.length > 0) {
      context += `\nGALLERY IMAGES (use in gallery/portfolio sections):\n`;
      catImages.gallery.slice(0, 6).forEach(img => {
        context += `  ${img.src}\n`;
      });
    }
    
    if (catImages.product?.length > 0) {
      context += `\nPRODUCT/SERVICE IMAGES (use in service cards or product sections):\n`;
      catImages.product.slice(0, 6).forEach(img => {
        context += `  ${img.src}${img.alt ? ` - ${img.alt}` : ''}\n`;
      });
    }
    
    if (catImages.team?.length > 0) {
      context += `\nTEAM PHOTOS (use in about/team sections):\n`;
      catImages.team.slice(0, 4).forEach(img => {
        context += `  ${img.src}${img.alt ? ` - ${img.alt}` : ''}\n`;
      });
    }
    
    if (catImages.background?.length > 0) {
      context += `\nBACKGROUND IMAGES (use as section backgrounds):\n`;
      catImages.background.slice(0, 3).forEach(img => {
        context += `  ${img.src}\n`;
      });
    }
    
    // Fallback to general if no categorized images
    if (catImages.general?.length > 0 && 
        !catImages.hero?.length && !catImages.gallery?.length && !catImages.product?.length) {
      context += `\nGENERAL IMAGES (use where appropriate):\n`;
      catImages.general.slice(0, 6).forEach(img => {
        context += `  ${img.src}${img.alt ? ` - ${img.alt}` : ''}\n`;
      });
    }
    
    context += `\nIMPORTANT: Use these ACTUAL image URLs in your code. Do NOT use placeholder URLs or Unsplash unless no suitable image exists above.\n`;
  } else if (existingSite.designSystem?.images && existingSite.designSystem.images.length > 0) {
    // Fallback for old format
    context += `\nEXISTING IMAGES (use these actual URLs):\n`;
    existingSite.designSystem.images.slice(0, 8).forEach(img => {
      if (img.src && !img.src.includes('data:')) {
        context += `- ${img.src}${img.alt ? ` (${img.alt})` : ''}\n`;
      }
    });
  }
  
  // Reference inspiration sites
  if (existingSite.referenceInspiration && existingSite.referenceInspiration.length > 0) {
    context += `\nINSPIRATION SITES TO BLEND:\n`;
    existingSite.referenceInspiration.forEach(ref => {
      context += `- ${ref.url}\n`;
    });
  }
  
  return context;
}

// Build context from reference sites (INSPIRED mode)
function buildInspiredContext(referenceSites) {
  if (!referenceSites || referenceSites.length === 0) return '';
  
  let context = `
══════════════════════════════════════════════════════════════
INSPIRED MODE - Blend the best of these reference sites
══════════════════════════════════════════════════════════════
`;

  referenceSites.forEach((site, index) => {
    context += `\nREFERENCE ${index + 1}: ${site.url}\n`;
    
    // What they like about this site
    if (site.likes && site.likes.length > 0) {
      const likeMap = {
        'colors': 'COLOR SCHEME',
        'layout': 'LAYOUT STRUCTURE',
        'typography': 'TYPOGRAPHY STYLE',
        'animations': 'ANIMATIONS/TRANSITIONS',
        'hero': 'HERO SECTION DESIGN',
        'navigation': 'NAVIGATION PATTERN',
        'cards': 'CARD COMPONENT DESIGN',
        'spacing': 'WHITESPACE/SPACING',
        'images': 'IMAGE TREATMENT',
        'cta': 'CALL-TO-ACTION DESIGN',
        'footer': 'FOOTER DESIGN',
        'overall': 'OVERALL AESTHETIC'
      };
      context += `  ELEMENTS TO INCORPORATE:\n`;
      site.likes.forEach(like => {
        if (likeMap[like]) context += `    - ${likeMap[like]}\n`;
      });
    }
    
    // Specific notes
    if (site.notes) {
      context += `  SPECIFIC NOTES: "${site.notes}"\n`;
    }
    
    // Analysis data
    if (site.analysis) {
      if (site.analysis.colors) {
        context += `  EXTRACTED COLORS: Primary ${site.analysis.colors.primary}, Accent ${site.analysis.colors.accent}\n`;
      }
      if (site.analysis.style) {
        context += `  DETECTED STYLE: ${site.analysis.style}\n`;
      }
      if (site.analysis.mood) {
        context += `  MOOD: ${site.analysis.mood}\n`;
      }
    }
  });
  
  context += `\nBLEND INSTRUCTIONS: Create a UNIQUE design that incorporates the best elements from each reference while maintaining cohesion. Do NOT copy directly - synthesize into something new.\n`;
  
  return context;
}

// Build context from uploaded assets
function buildUploadedAssetsContext(uploadedAssets, imageDescription) {
  if (!uploadedAssets && !imageDescription) return '';
  
  let context = '';
  
  // Logo
  if (uploadedAssets?.logo) {
    const logoExt = uploadedAssets.logo.type?.split('/')[1] || 'png';
    context += `
══════════════════════════════════════════════════════════════
UPLOADED LOGO - USE THIS EXACT PATH
══════════════════════════════════════════════════════════════
The user has uploaded their logo. Use these extracted brand colors throughout the design.
Logo filename: ${uploadedAssets.logo.file}

CRITICAL: In the header/nav, use this EXACT image tag:
<img src="/uploads/logo.${logoExt}" alt="Logo" style={{ height: '40px' }} />

DO NOT use placeholder text or broken image references.
The logo file exists at: /uploads/logo.${logoExt}
`;
  }
  
  // Product/Gallery Photos
  if (uploadedAssets?.photos && uploadedAssets.photos.length > 0) {
    context += `
══════════════════════════════════════════════════════════════
UPLOADED PRODUCT/GALLERY PHOTOS (${uploadedAssets.photos.length} photos)
══════════════════════════════════════════════════════════════
The user has uploaded ${uploadedAssets.photos.length} photos of their products/work.
Photo files: ${uploadedAssets.photos.map(p => p.file).join(', ')}

CRITICAL: For gallery sections, product showcases, and hero backgrounds:
- Reference these as "uploaded photos" - the system will inject them
- Create image galleries that showcase these photos
- Use them in hero sections, about pages, and service showcases
- DO NOT use generic Unsplash URLs - use the uploaded photos instead
`;
  }
  
  // Menu/Pricing
  if (uploadedAssets?.menu) {
    let menuText = '';
    if (uploadedAssets.menu.extractedText) {
      menuText = uploadedAssets.menu.extractedText;
    }
    
    context += `
══════════════════════════════════════════════════════════════
UPLOADED MENU / PRICE LIST - USE THIS ACTUAL DATA
══════════════════════════════════════════════════════════════
The user has uploaded their menu or price list.
File: ${uploadedAssets.menu.file} (${uploadedAssets.menu.type.includes('pdf') ? 'PDF' : 'Image'})

${menuText ? `EXTRACTED MENU CONTENT (use these REAL items and prices):
${menuText.substring(0, 3000)}
` : ''}
CRITICAL: Use the actual menu items and prices shown above in your menu/pricing sections.
DO NOT make up menu items - use ONLY what's in the extracted content above.
If no items were extracted, create placeholder sections that say "Menu coming soon" or similar.
`;
  }
  
  // Image style description
  if (imageDescription && imageDescription.trim()) {
    context += `
══════════════════════════════════════════════════════════════
USER'S VISUAL STYLE PREFERENCES
══════════════════════════════════════════════════════════════
"${imageDescription.trim()}"

Apply this visual style throughout all pages - backgrounds, image treatments, overall mood.
`;
  }
  
  return context;
}

async function buildFreshModePrompt(pageId, pageName, otherPages, description, promptConfig) {
  const cfg = promptConfig || {};
  const industry = cfg.industry || {};
  const colors = cfg.colors || { primary: '#6366f1', accent: '#06b6d4', text: '#1a1a2e', textMuted: '#64748b', background: '#ffffff' };
  const typography = cfg.typography || { heading: "'Inter', sans-serif", body: "system-ui, sans-serif" };
  
  // SELECT A RANDOM ARCHETYPE FOR VARIETY
  const archetypeKeys = Object.keys(VISUAL_ARCHETYPES);
  const selectedArchetype = VISUAL_ARCHETYPES[Math.floor(Math.random() * archetypeKeys.length)];

  // DYNAMIC SPACING BASED ON VIBE
  const isLuxury = industry.vibe?.toLowerCase().includes('luxury') || industry.vibe?.toLowerCase().includes('clean');
  const sectionPadding = isLuxury ? '140px' : '80px';
  
  // EXTRACT EXISTING SITE DATA (REBUILD MODE)
  const existingSite = description.existingSite || null;
  const rebuildContext = existingSite ? buildRebuildContext(existingSite) : '';
  
  // EXTRACT REFERENCE SITES DATA (INSPIRED MODE)
  const referenceSites = description.referenceSites || [];
  const inspiredContext = referenceSites.length > 0 ? buildInspiredContext(referenceSites) : '';
  
  // EXTRACT UPLOADED ASSETS
  const uploadedAssets = description.uploadedAssets || null;
  const imageDescription = description.imageDescription || '';
  const assetsContext = buildUploadedAssetsContext(uploadedAssets, imageDescription);
  
  // EXTRACT EXTRA DETAILS FROM USER
  const extraDetails = description.extraDetails || '';
  const extraDetailsContext = extraDetails.trim() ? `
══════════════════════════════════════════════════════════════
CUSTOM REQUIREMENTS FROM USER:
══════════════════════════════════════════════════════════════
${extraDetails}

IMPORTANT: Apply these custom requirements throughout the page design.
Replace any standard elements with the user's specified alternatives.
══════════════════════════════════════════════════════════════
` : '';

  // EXTRACT INDUSTRY LAYOUT CONFIG (support both layoutKey and layoutStyleId from frontend)
  const industryLayoutKey = description.industryKey || null;
  const selectedLayoutKey = description.layoutStyleId || description.layoutKey || null;
  const layoutStylePreview = description.layoutStylePreview || null;

  // Build layout context - prefer frontend preview config, fallback to industry-layouts.cjs
  let layoutContext = '';
  if (layoutStylePreview && selectedLayoutKey) {
    // Use the frontend's preview configuration directly
    layoutContext = buildLayoutContextFromPreview(selectedLayoutKey, layoutStylePreview, industryLayoutKey);
  } else if (industryLayoutKey) {
    // Fallback to industry-layouts.cjs
    layoutContext = buildLayoutContext(industryLayoutKey, selectedLayoutKey);
  }

  // Extract stats from business description
  const businessText = description.text || '';
  const extractedStats = extractBusinessStats(businessText, industry.name);

  // Build smart context inference for minimal input
  const businessInput = description.text || 'A professional business';
  const smartContextGuide = buildSmartContextGuide(businessInput, industry.name);

  // Get industry-specific CONTEXT-AWARE image URLs
  const industryImages = getIndustryImageUrls(industry.name || businessInput);

  // Check if user enabled video hero (from UI toggle)
  const enableVideoHero = description.enableVideoHero === true;

  // If no hardcoded video available but video is enabled, try dynamic Pexels fetch
  if (enableVideoHero && !industryImages.heroVideo) {
    console.log('   🎬 No hardcoded video - trying dynamic Pexels fetch...');
    const dynamicVideoUrl = await getIndustryVideo(industry.name || '', businessInput);
    if (dynamicVideoUrl) {
      industryImages.heroVideo = dynamicVideoUrl;
      console.log('   ✅ Using dynamic Pexels video');
    }
  }

  const hasVideoAvailable = !!industryImages.heroVideo;

  // Build video context ONLY if video is enabled AND available
  let videoContext = '';
  if (enableVideoHero && hasVideoAvailable) {
    videoContext = `
══════════════════════════════════════════════════════════════
🎬 VIDEO BACKGROUND ENABLED - USE THIS FOR HOME PAGE HERO!
══════════════════════════════════════════════════════════════
The user has ENABLED video background for the home page hero!

VIDEO URL: ${industryImages.heroVideo}
POSTER IMAGE (fallback): ${industryImages.hero}

HOW TO USE VideoBackground COMPONENT:
import { VideoBackground } from '../effects';

<VideoBackground
  videoSrc="${industryImages.heroVideo}"
  posterImage="${industryImages.hero}"
  overlay="linear-gradient(rgba(10, 22, 40, 0.7), rgba(10, 22, 40, 0.85))"
  height="100vh"
>
  {/* Hero content goes here */}
  <h1>Your Headline</h1>
  <p>Your tagline</p>
  <button>CTA Button</button>
</VideoBackground>

IMPORTANT VIDEO RULES:
1. USE VideoBackground on the HOME PAGE hero section (user requested this!)
2. Other pages should use static images (ParallaxSection or regular backgrounds)
3. The video autoplays muted and loops - perfect for ambiance
4. On mobile, it automatically falls back to the poster image
5. Always include a dark overlay for text readability
══════════════════════════════════════════════════════════════
`;
  } else if (hasVideoAvailable && !enableVideoHero) {
    // Video available but user disabled it
    videoContext = `
NOTE: Video background is available for this industry but user has DISABLED it.
Use static image backgrounds instead (ParallaxSection or backgroundImage).
`;
  }

  const imageContext = `
══════════════════════════════════════════════════════════════
CONTEXT-AWARE IMAGES - USE THE RIGHT IMAGE FOR EACH SECTION
══════════════════════════════════════════════════════════════
${videoContext}
🎯 HERO/HEADER SECTION - Use atmospheric, wide shots:
${industryImages.hero}

👥 TEAM/ARTIST/STAFF SECTION - Use portraits of ACTUAL professionals in this industry:
${(industryImages.team || []).map((url, i) => `Team Member ${i + 1}: ${url}`).join('\n')}
CRITICAL: For tattoo studios, use tattoo artist photos. For barbershops, use barber photos.
NEVER use random stock photos of people stretching or unrelated activities!

🖼️ GALLERY/PORTFOLIO SECTION - Use work examples:
${(industryImages.gallery || []).map((url, i) => `Gallery ${i + 1}: ${url}`).join('\n')}

🛠️ SERVICES SECTION - Use action shots of the work being done:
${(industryImages.services || []).map((url, i) => `Service ${i + 1}: ${url}`).join('\n')}

🔍 SEARCH TERMS for additional images: ${industryImages.searchTerms.join(', ')}

══════════════════════════════════════════════════════════════
CRITICAL IMAGE MATCHING RULES:
══════════════════════════════════════════════════════════════
1. TEAM PAGES: Use ONLY the team images above - they show actual professionals in this industry
2. HERO: Use the hero image for big background sections
3. GALLERY: Use gallery images for portfolio/work showcases
4. SERVICES: Use service images to illustrate what you offer
5. NEVER mix contexts - don't put a yoga stretch photo on a tattoo artist page!
6. NEVER use generic Unsplash URLs - always use the industry-specific ones above
7. Format: url("IMAGE_URL") for CSS backgrounds or src="IMAGE_URL" for img tags

For TATTOO STUDIOS specifically:
- Team section: Use photos of tattoo artists working or portraits of tattooed professionals
- Gallery: Use closeup shots of completed tattoos
- Hero: Use studio interior with tattoo equipment visible

For PRESCHOOLS/MONTESSORI/DAYCARE specifically:
- Team section: Use photos of teachers with children, warm educator portraits
- Gallery: Use photos of children learning, art projects, classroom activities, playground
- Hero: Use bright, colorful classroom or children engaged in activities
- NEVER use generic stock business photos - always show children and educators

For EDUCATION/SCHOOLS specifically:
- Team section: Use photos of teachers, educators, tutors in teaching environments
- Gallery: Use photos of students learning, classroom settings, study groups
- Hero: Use academic settings with students engaged in learning
══════════════════════════════════════════════════════════════
`;

  // ==========================================
  // NEW: High-impact question context
  // ==========================================
  const teamSize = description.teamSize || null;
  const priceRange = description.priceRange || null;
  const yearsEstablished = description.yearsEstablished || null;
  const inferredDetails = description.inferredDetails || null;
  const location = description.location || null;
  const targetAudience = description.targetAudience || [];
  const primaryCTA = description.primaryCTA || 'contact';
  const tone = description.tone || 'balanced';

  // Build business context from high-impact questions
  let businessContext = '';

  if (teamSize || priceRange || yearsEstablished || location) {
    businessContext = `
══════════════════════════════════════════════════════════════
BUSINESS DETAILS - USE THESE FOR ACCURATE CONTENT
══════════════════════════════════════════════════════════════
`;
    if (location) {
      businessContext += `📍 LOCATION: ${location} - Customize content for this area\n`;
    }
    if (teamSize) {
      const teamSizeMap = {
        'solo': '1 person (solo operator) - use "I" language, personal touch',
        'small': '2-4 people - use "our small team" language, close-knit feel',
        'medium': '5-10 people - use "our team" language, established feel',
        'large': '10+ people - use "our professionals" language, corporate feel'
      };
      businessContext += `👥 TEAM SIZE: ${teamSizeMap[teamSize] || teamSize}\n`;
    }
    if (priceRange) {
      const priceMap = {
        'budget': 'Budget-friendly ($) - emphasize value, affordability, competitive pricing',
        'mid': 'Mid-range ($$) - balance quality and value, mainstream pricing',
        'premium': 'Premium ($$$) - emphasize quality, expertise, worth the investment',
        'luxury': 'Luxury ($$$$) - exclusive, high-end, bespoke, elite experience'
      };
      businessContext += `💰 PRICE RANGE: ${priceMap[priceRange] || priceRange}\n`;
    }
    if (yearsEstablished) {
      const yearsMap = {
        'new': 'Just starting - emphasize fresh perspective, modern approach, passion',
        'growing': '1-5 years - emphasize momentum, proven results, growing reputation',
        'established': '5-15 years - emphasize experience, track record, trusted expertise',
        'veteran': '15+ years - emphasize legacy, unmatched experience, industry leader'
      };
      businessContext += `⏱️ EXPERIENCE: ${yearsMap[yearsEstablished] || yearsEstablished}\n`;
    }
    if (targetAudience.length > 0) {
      businessContext += `🎯 TARGET AUDIENCE: ${targetAudience.join(', ')}\n`;
    }
    if (primaryCTA && primaryCTA !== 'contact') {
      const ctaMap = {
        'book': 'Book Appointment - make booking CTA prominent',
        'call': 'Call Now - show phone number prominently',
        'quote': 'Get a Quote - emphasize free quotes/estimates',
        'buy': 'Buy/Order Now - shopping/ordering focus',
        'visit': 'Visit Location - directions and map prominent'
      };
      businessContext += `👆 PRIMARY CTA: ${ctaMap[primaryCTA] || primaryCTA}\n`;
    }
    businessContext += `🎭 TONE: ${tone}\n`;
    businessContext += `══════════════════════════════════════════════════════════════\n`;
  }

  return `You are a high-end UI/UX Architect. Create a stunning, unique ${pageId} page.

BUSINESS INPUT: ${businessInput}
INDUSTRY: ${industry.name || 'Business'}
VIBE: ${industry.vibe || 'Unique and modern'}
${businessContext}

══════════════════════════════════════════════════════════════
CRITICAL: SMART CONTENT INFERENCE - USE COMMON SENSE!
══════════════════════════════════════════════════════════════
${smartContextGuide}

INFERENCE RULES:
1. If the user only gave a name like "Mario's Pizza" - YOU must infer:
   - It's a pizzeria/Italian restaurant
   - Create a realistic menu with actual pizza names, prices ($14-22), toppings
   - Include appetizers, salads, drinks, desserts with realistic prices
   - Add realistic hours (11am-10pm), delivery info, location feel

2. If minimal input like "Brooklyn Dental" - YOU must infer:
   - It's a dental practice
   - List services: cleanings, fillings, crowns, whitening, implants
   - Add insurance info, new patient specials, emergency care
   - Professional but welcoming atmosphere

3. KEYWORD EXPANSION - If user provides keywords or short phrases, EXPAND them into full content:
   - "fast, reliable, 24/7" → "Your emergency is our priority. Available 24/7, our team arrives fast and fixes it right the first time."
   - "family owned, 30 years" → "Family-owned and operated since 1994, we've built our reputation on honest work and lasting relationships."
   - "organic, locally sourced" → "We source our ingredients from local organic farms, ensuring every dish is fresh, sustainable, and bursting with natural flavor."
   - Take any keywords the user provides and weave them into compelling, professional copy.

4. NEVER generate generic placeholder content like:
   - "Lorem ipsum" or "[Business Name]"
   - "Service 1, Service 2, Service 3"
   - "$XX.XX" or "Call for pricing"
   - "123 Main Street" (use realistic addresses)

4. ALWAYS generate specific, realistic, industry-appropriate content:
   - Real menu items with creative names and accurate prices
   - Specific service descriptions with typical pricing
   - Realistic business hours for the industry
   - Genuine-sounding testimonials with first names

${rebuildContext}${inspiredContext}${assetsContext}${extraDetailsContext}${layoutContext}${imageContext}
══════════════════════════════════════════════════════════════
CRITICAL: STATISTICS & NUMBERS - NEVER USE ZEROS!
══════════════════════════════════════════════════════════════
${extractedStats}

STAT RULES - FOLLOW EXACTLY:
1. NEVER show "0", "0+", "1%", or single-digit numbers (except for team size)
2. ALWAYS use numbers from above OR these industry-appropriate minimums:
   - Years in business: 10+ to 25+ (never below 5)
   - Customers served: 2,000+ to 10,000+ (never below 500)
   - Satisfaction rate: 95% to 99% (never below 90%)
   - Team members: 4 to 25 (realistic for business size)

CORRECT AnimatedCounter EXAMPLES - COPY THIS EXACT PATTERN:
<AnimatedCounter end={12} suffix="+ Years" duration={2} />
<AnimatedCounter end={2700} suffix="+ Happy Clients" duration={2.5} />
<AnimatedCounter end={98} suffix="%" duration={2} />  {/* For percentages */}
<AnimatedCounter end={4} suffix=" Master Barbers" duration={1.5} />

NOTE: duration is in SECONDS (not milliseconds). Use 2 for 2 seconds.

WRONG EXAMPLES - NEVER DO THIS:
<AnimatedCounter end={0} suffix="+ Years" />  ❌ Zero is broken
<AnimatedCounter end={27} suffix="+ Clients" />  ❌ Too small, use 2700
<AnimatedCounter end={1} suffix="%" />  ❌ 1% satisfaction is insulting
<AnimatedCounter end={12} duration={2000} />  ❌ 2000 seconds is way too long!

FOR A BARBERSHOP, USE THESE EXACT STATS:
- Years: 12+ Years Experience
- Clients: 2,700+ Satisfied Clients
- Team: 4 Master Barbers
- Rating: 98% Client Satisfaction

══════════════════════════════════════════════════════════════
CRITICAL: INDUSTRY-SPECIFIC DESIGN - NOT A GENERIC TEMPLATE!
══════════════════════════════════════════════════════════════
DO NOT use the same layout structure for every industry. A bowling alley should look COMPLETELY DIFFERENT from a law firm.

LAYOUT VARIATION RULES:
1. READ the industry guidance below and FOLLOW IT - each industry has specific section orders and emphasis.
2. VARY the section structure based on what matters most to THIS business type:
   - Entertainment venues: Fun first! Bold colors, large booking CTAs, party packages prominent
   - Professional services: Trust first! Credentials, testimonials, case studies prominent
   - Restaurants: Menu first! Food imagery, reservation CTA, ambiance gallery
   - Fitness: Motivation first! Action imagery, class schedules, membership comparisons
   - Retail: Products first! Large product grids, shopping CTAs, featured items

3. DIFFERENT industries need DIFFERENT hero treatments:
   - Fun venues: Neon effects, bold headlines, animated elements, video backgrounds
   - Professionals: Clean, minimal, trust-focused, subtle imagery
   - Restaurants: Full-bleed food photography, warm overlays
   - Fitness: Dynamic action shots, dark/dramatic, motivational text
   - Retail: Product-focused, clean grids, shopping-oriented

4. SECTION ORDER should vary by industry - don't always do Hero → About → Services → Contact

══════════════════════════════════════════════════════════════
CORE VISUAL ARCHETYPE: ${selectedArchetype}
══════════════════════════════════════════════════════════════

DESIGN SYSTEM:
const THEME = {
  colors: { 
    primary: '${colors.primary}', 
    accent: '${colors.accent}', 
    background: '${colors.background}', 
    text: '${colors.text}', 
    surface: '${colors.surface || '#f8fafc'}' 
  },
  fonts: { heading: "${typography.heading}", body: "${typography.body}" },
  spacing: { sectionPadding: '${sectionPadding}' }
};

CRITICAL HERO TEXT RULES:
- If hero has dark/gradient background: text MUST be white (#ffffff) with textShadow: '0 2px 4px rgba(0,0,0,0.3)'
- If hero has light background: text MUST be dark (${colors.text})
- NEVER use low-contrast text colors on heroes

${getIndustryDesignGuidance(industry.name)}

PAGE REQUIREMENTS:
${getPageRequirements(pageId)}

══════════════════════════════════════════════════════════════
EFFECTS LIBRARY - ADD POLISH WITH THESE COMPONENTS
══════════════════════════════════════════════════════════════
Import from '../effects' and use these to make pages feel premium:

import { ScrollReveal, AnimatedCounter, StaggeredList, ParallaxSection, TiltCard, GlowEffect, VideoBackground } from '../effects';

AVAILABLE EFFECTS:
- <ScrollReveal> - Wrap sections to fade-in on scroll
- <AnimatedCounter end={500} suffix="+" duration={2} /> - Animate numbers counting up (duration in SECONDS)
- <StaggeredList items={array} renderItem={(item) => <Card />} /> - Stagger children animations
- <ParallaxSection imageSrc="url" height="60vh"> - Parallax background sections
- <TiltCard> - 3D tilt effect on hover for cards
- <GlowEffect color="#22c55e"> - Glowing border on hover
- <VideoBackground videoSrc="url" posterImage="url" overlay="rgba()" height="100vh"> - Video hero backgrounds (HOME PAGE ONLY)

REQUIRED USAGE:
- Home pages: Use AnimatedCounter for ALL statistics (years, customers, etc.)
- Home pages: Wrap at least 2 sections with <ScrollReveal>
- Home pages: If VIDEO URL is provided above, use VideoBackground for the hero!
- Service/Menu pages: Use ScrollReveal on the cards grid
- About pages: AnimatedCounter for company stats

EXAMPLE (Static Hero):
<ScrollReveal>
  <section style={styles.stats}>
    <AnimatedCounter end={14} suffix=" Years" duration={2} />
    <AnimatedCounter end={5000} suffix="+ Customers" duration={2.5} />
  </section>
</ScrollReveal>

EXAMPLE (Video Hero - for HOME PAGE when video URL available):
<VideoBackground
  videoSrc="VIDEO_URL_FROM_ABOVE"
  posterImage="HERO_IMAGE_URL"
  overlay="linear-gradient(rgba(10, 22, 40, 0.7), rgba(10, 22, 40, 0.85))"
  height="100vh"
>
  <div style={{ textAlign: 'center', color: 'white', maxWidth: '800px', padding: '0 20px' }}>
    <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Headline</h1>
    <p style={{ fontSize: '20px', opacity: 0.9, marginBottom: '30px' }}>Tagline</p>
    <button style={{ padding: '15px 40px', fontSize: '18px' }}>CTA</button>
  </div>
</VideoBackground>

TECHNICAL RULES (MUST FOLLOW):
1. Use inline styles ONLY: style={{ }} - NO className or Tailwind.

   CRITICAL STYLE SYNTAX - FOLLOW EXACTLY:
   ✅ CORRECT: opacity: 0.7 (number, no quotes)
   ✅ CORRECT: fontSize: 16 (number, no quotes)
   ✅ CORRECT: fontSize: '16px' (string WITH quotes on BOTH sides)
   ✅ CORRECT: color: '#ffffff' (string WITH quotes on BOTH sides)
   ✅ CORRECT: padding: '20px 40px' (string WITH quotes on BOTH sides)

   ❌ WRONG: opacity: 0.7' (trailing quote with no opening quote)
   ❌ WRONG: fontSize: 16' (trailing quote on a number)
   ❌ WRONG: color: #ffffff (missing quotes around hex color)
   ❌ WRONG: padding: 20px 40px (missing quotes around CSS value)

   Rule: Numbers without units = no quotes. Anything with units or special chars = quotes on BOTH sides.

2. Use Lucide icons: import { IconName } from 'lucide-react'.
   VALID ICONS (use ONLY these): ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Check, X, Menu,
   ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Plus, Minus, Search, Filter,
   Star, Heart, Mail, Phone, MapPin, Clock, Calendar, User, Users, Settings,
   Home, Building, Briefcase, Shield, Award, Target, Zap, Sparkles, Crown,
   DollarSign, CreditCard, ShoppingCart, Package, Truck, Gift, Tag, Percent,
   Eye, EyeOff, Lock, Unlock, Key, Bell, MessageSquare, Send, Share, Download, Upload,
   Image, Camera, Play, Pause, Volume, VolumeX, Mic, Video, Music, File, FileText, Folder,
   Link, ExternalLink, Globe, Wifi, Database, Server, Code, Terminal, Cpu,
   Sun, Moon, Cloud, Thermometer, Droplet, Wind, Umbrella,
   Car, Plane, Ship, Train, Bike, MapPinned, Navigation, Compass,
   Utensils, Coffee, Wine, Pizza, Cake, Apple,
   Stethoscope, Activity, Pill, Syringe, Bone, Brain,
   GraduationCap, BookOpen, Pencil, Ruler, Calculator,
   Wrench, Hammer, Scissors, Paintbrush, Palette,
   Dog, Cat, Bird, Fish, Bug, Leaf, Flower, Tree,
   Facebook, Twitter, Instagram, Linkedin, Youtube, Github,
   AlertCircle, AlertTriangle, Info, HelpCircle, CheckCircle, XCircle,
   RefreshCw, RotateCw, Loader, MoreHorizontal, MoreVertical, Grip,
   Copy, Clipboard, Save, Trash, Edit, Edit2, Maximize, Minimize,
   LogIn, LogOut, UserPlus, UserMinus, UserCheck, Smile, Frown, Meh,
   ThumbsUp, ThumbsDown, Flag, Bookmark, Archive, Inbox, Layers,
   Layout, Grid, List, Table, BarChart, BarChart2, BarChart3, PieChart, LineChart, TrendingUp, TrendingDown,
   Quote, Hash, AtSign, Percent, Receipt, Wallet, Banknote, Coins,
   Headphones, Speaker, Radio, Tv, Monitor, Smartphone, Tablet, Watch, Printer,
   Power, Battery, BatteryCharging, Plug, Lightbulb, Flashlight, Flame,
   Anchor, Rocket, Award, Medal, Trophy, Crown, Gem, Diamond
   DO NOT use icons not in this list. If you need "Handshake", use "Users" or "Link" instead.
3. NAVIGATION: Use <Link to="/path"> from react-router-dom.
4. NO nav/footer - those are provided by App.jsx.
5. WHITESPACE: Use THEME.spacing.sectionPadding for top/bottom margins.
6. INNOVATION: Do not use standard vertical blocks. Experiment with the ARCHETYPE provided above.
7. APP PAGES: For dashboard/earn/rewards/wallet/profile/leaderboard pages, these are FUNCTIONAL APP PAGES not marketing pages. Build them with useState hooks, mock data arrays, and interactive elements. Create the full UI inline - do not import from ../modules/.
8. MOBILE-FIRST: Design for mobile screens FIRST (375px width). Use these patterns:
   - Single column layouts by default
   - Large touch targets (min 44px height for buttons)
   - Bottom navigation bar for app pages (fixed position)
   - Cards should be full-width on mobile with 16px padding
   - Font sizes: 16px minimum for body text (prevents zoom on iOS)
   - Use flexDirection: 'column' as default, switch to 'row' only with @media or window.innerWidth checks
   - Sticky headers with blur backdrop for app pages
   - Pull-to-refresh patterns where appropriate

Return ONLY valid JSX code.
Start with: import React from 'react';
End with: export default ${pageName}Page;`;
}

function getIndustryDesignGuidance(industryName) {
  const guidance = {
    'Law Firm': `
STYLE: Sophisticated, authoritative, trustworthy
HERO: Clean, minimal. White or light background preferred. No busy images.
TYPOGRAPHY: Serif headings (Georgia, Times). Thin weights. Large sizes (48-64px).
COLORS: Dark navy/charcoal primary. Gold/bronze accent. Lots of white space.
IMAGERY: Abstract patterns, city skylines, or no images. Never stock photos of "lawyers".
LAYOUT PATTERNS: Asymmetric grids, editorial layouts, generous margins.
SECTIONS: Practice areas with icons, attorney credentials, case results stats, testimonials.`,

    'Restaurant / Food Service': `
STYLE: Warm, inviting, sensory, appetizing
HERO: Full-bleed food photography or atmospheric restaurant shots. Dark overlays work well.
TYPOGRAPHY: Mix of serif (menu feel) and clean sans-serif. Can be more decorative.
COLORS: Warm tones - burgundy, gold, cream, forest green. Earthy palettes.
IMAGERY: High-quality food photos, interior shots, chef at work. Real Unsplash food images.
LAYOUT PATTERNS: Magazine-style, image-heavy, overlapping elements.
SECTIONS: Featured dishes with photos, chef story, ambiance gallery, reservation CTA prominently placed, location/hours sticky.
UNIQUE: Menu should be THE STAR - consider tabbed menu categories, hoverable dish cards, or a visual menu grid.`,

    'SaaS / B2B Platform': `
STYLE: Modern, clean, innovative, trustworthy
HERO: Split layout (text + product screenshot) OR gradient background with floating UI elements.
TYPOGRAPHY: Clean sans-serif (Inter, SF Pro). Bold headlines, readable body.
COLORS: Purple/blue gradients popular. High contrast. Dark mode friendly.
IMAGERY: Product screenshots, dashboard mockups, abstract 3D shapes, isometric illustrations.
LAYOUT PATTERNS: Bento grids, feature cards, comparison tables, social proof strips.
SECTIONS: Logo cloud, feature grid, how-it-works steps, pricing cards, testimonials, integration logos.`,

    'Healthcare / Medical': `
STYLE: Clean, calming, professional, trustworthy
HERO: Soft, approachable. Light backgrounds. Minimal imagery or abstract health visuals.
TYPOGRAPHY: Clean, highly readable. Sans-serif preferred. Accessible sizes.
COLORS: Calming blues, teals, soft greens. White/light backgrounds. Avoid harsh contrasts.
IMAGERY: Abstract medical, caring professionals (tasteful), nature/wellness imagery.
LAYOUT PATTERNS: Card-based, clear information hierarchy, easy navigation cues.
SECTIONS: Services/specialties, provider profiles, patient resources, appointment booking, insurance info.`,

    'E-Commerce / Retail': `
STYLE: Dynamic, visual, conversion-focused
HERO: Product-focused. Large product images or lifestyle shots. Clear CTA.
TYPOGRAPHY: Bold, attention-grabbing headlines. Clean body text.
COLORS: Brand-dependent but high contrast CTAs. Sale/promo colors (red, orange).
IMAGERY: Product photography, lifestyle shots, user-generated content style.
LAYOUT PATTERNS: Grid-heavy, card-based products, sticky CTAs, urgency elements.
SECTIONS: Featured products grid, category tiles, bestsellers carousel, reviews with stars, trust badges, newsletter signup.
UNIQUE: Product showcase is KING - use large image cards, hover effects, quick-view patterns.`,

    // ENTERTAINMENT & FUN VENUES
    'Entertainment': `
STYLE: Bold, playful, energetic, FUN - this is NOT a corporate site!
HERO: Large action imagery, neon/glow effects, animated elements, video backgrounds work great.
TYPOGRAPHY: Bold, chunky fonts. Can be playful/quirky. Large impactful headlines.
COLORS: Bright, bold colors - neon pink, electric blue, bright orange, lime green. Dark backgrounds with glowing accents.
IMAGERY: People having fun, action shots, neon lights, bowling pins flying, arcade games, celebrations.
LAYOUT PATTERNS: Asymmetric, overlapping elements, floating cards, gamified UI elements, progress bars, achievement badges.
SECTIONS: "What's On" with large event cards, pricing/packages with visual comparisons, photo gallery mosaic, party booking CTA (BIG and bold), hours with fun icons.
UNIQUE: Make it feel like an EXPERIENCE - use hover animations, playful icons, maybe even a mini-game element or leaderboard teaser.`,

    'Bowling Alley': `
STYLE: Retro-fun meets modern, neon glow, energetic party vibe
HERO: Bowling action shot with neon overlay effects, lanes lit up, pins flying. Video loop of strikes.
TYPOGRAPHY: Bold, chunky, retro-inspired fonts. Think arcade vibes. Glowing text effects.
COLORS: Neon pink, electric blue, black backgrounds, glowing orange accents. Retro color palette.
IMAGERY: Glowing lanes, pins exploding, people celebrating strikes, cosmic bowling atmosphere.
LAYOUT PATTERNS: Floating neon-bordered cards, asymmetric grids, gamified elements like score displays.
SECTIONS: "Book Your Lane" CTA front-and-center, party packages with fun illustrations, cosmic bowling showcase, league info with leaderboard style, arcade/bar area highlight, birthday party section with confetti.
UNIQUE: Add gamification - maybe a "Strike Counter" AnimatedCounter, glow effects on buttons, retro arcade styling. Make visitors WANT to bowl!`,

    'Arcade': `
STYLE: Retro gaming, pixel art vibes, neon, 80s throwback with modern twist
HERO: Arcade cabinet imagery, pixel art elements, neon grids, controller icons.
TYPOGRAPHY: Pixel fonts for headers, retro gaming typography, 8-bit style numbers.
COLORS: Neon purple, hot pink, cyan, black backgrounds, CRT scan line effects.
IMAGERY: Arcade cabinets, joysticks, tokens, high score screens, multiplayer action.
LAYOUT PATTERNS: Pixel-bordered cards, CRT monitor styled sections, high-score table layouts.
SECTIONS: Game showcase grid, token/credit packages, party room booking, high scores leaderboard, birthday packages.
UNIQUE: Add score-like AnimatedCounters, pixel art icons, maybe a fake "INSERT COIN" button.`,

    // FITNESS & WELLNESS
    'Fitness': `
STYLE: High-energy, motivational, powerful, action-oriented
HERO: Dynamic action shots - people mid-workout, weights in motion, intense focus. Dark/dramatic.
TYPOGRAPHY: Bold, strong, condensed fonts. IMPACT. All-caps for key headlines.
COLORS: Dark backgrounds (black, charcoal), bold accent (red, orange, electric blue), high contrast.
IMAGERY: Athletes in action, gym equipment, sweat and determination, transformation photos.
LAYOUT PATTERNS: Strong geometric shapes, diagonal lines, bold dividers, before/after layouts.
SECTIONS: Class schedule (prominent, interactive if possible), membership tiers as bold comparison cards, trainer profiles with stats, transformation gallery, free trial CTA.
UNIQUE: Make it MOTIVATING - use strong action verbs, progress-style layouts, maybe countdown timers for challenges.`,

    'Gym': `
STYLE: Powerful, results-focused, community-driven, no-nonsense
HERO: Weight room action, people pushing limits, dramatic lighting on equipment.
TYPOGRAPHY: Bold condensed sans-serif, industrial feel, strong headlines.
COLORS: Black, dark gray, red or orange accents, metallic touches.
IMAGERY: Free weights, cable machines, group classes in action, focused athletes.
LAYOUT PATTERNS: Grid-based equipment/class showcase, membership comparison tables, strong geometric sections.
SECTIONS: "Join Now" prominent CTA, membership tiers with clear pricing, class schedule table/tabs, trainer team, equipment showcase, testimonial transformations.
UNIQUE: Show the RESULTS - before/after transformations, member stats, community achievements.`,

    'Yoga Studio': `
STYLE: Calm, serene, mindful, balanced, natural
HERO: Peaceful poses, natural light, plants, minimalist space. Soft, dreamy.
TYPOGRAPHY: Light, airy fonts. Thin weights. Generous letter-spacing. Lowercase feels right.
COLORS: Soft sage green, dusty rose, cream, warm white, terracotta, natural tones.
IMAGERY: Yoga poses in beautiful spaces, nature elements, plants, morning light, meditation.
LAYOUT PATTERNS: Lots of whitespace, organic shapes, flowing curves, asymmetric balance.
SECTIONS: Class schedule with easy-to-read times, instructor profiles with philosophy, workshop/retreat highlights, pricing as simple cards, new student offer.
UNIQUE: Breathe CALM into the design - gentle animations, flowing transitions, peaceful imagery.`,

    // CREATIVE & EDGY INDUSTRIES
    'Tattoo Studio': `
STYLE: Bold, edgy, artistic, dark, authentic - NOT corporate or clean
HERO: Dark, atmospheric studio shot OR dramatic tattoo closeup with moody lighting. Video of tattooing works great.
TYPOGRAPHY: Bold, often condensed or distressed fonts. Can be slightly grungy. Uppercase for impact.
COLORS: BLACK is dominant. Accent with crimson red, deep gold, or muted metallics. High contrast.
IMAGERY: CRITICAL - Use ONLY tattoo-specific images:
  - Team photos: Tattoo artists AT WORK or portrait shots of tattooed professionals
  - Gallery: Closeup shots of completed tattoos on skin
  - NOT yoga people, NOT hairstylists, NOT generic stock photos
LAYOUT PATTERNS: Dark backgrounds, bold dividers, asymmetric galleries, hoverable portfolio items.
SECTIONS: Artist profiles (with their specialty styles), portfolio gallery (organized by style - traditional, realism, geometric, etc.), booking/consultation CTA, aftercare info, FAQs, shop policies.
UNIQUE: The PORTFOLIO is everything - make it visually striking. Show the artists' individual styles. Dark theme with dramatic lighting effects. Instagram integration for latest work.`,

    'Barbershop': `
STYLE: Masculine, vintage-meets-modern, confident, classic
HERO: Classic barbershop interior OR barber at work with dramatic lighting. Leather, wood, chrome vibes.
TYPOGRAPHY: Bold serif or strong sans-serif. Vintage touches work well. All-caps for headings.
COLORS: Dark backgrounds (charcoal, navy), warm accents (gold, cream, burgundy), masculine palette.
IMAGERY: Barbers cutting hair, vintage tools, leather chairs, pomade, grooming products.
LAYOUT PATTERNS: Clean but bold grids, service cards, team profiles with specialties.
SECTIONS: Services with prices, the barbers (with their chair/specialty), booking CTA prominent, gallery of cuts/styles, shop story.
UNIQUE: Classic masculinity - think vintage signs, straight razors, leather textures. Make booking EASY.`,

    // PROFESSIONAL SERVICES
    'Professional Services': `
STYLE: Trustworthy, credible, sophisticated, results-oriented
HERO: Clean, minimal, text-focused. Abstract imagery or subtle patterns. No cheesy stock photos.
TYPOGRAPHY: Professional serif or clean sans-serif. Traditional feels trustworthy.
COLORS: Navy, charcoal, white, gold/bronze accents. Conservative palette.
IMAGERY: Abstract, city skylines, handshakes (tasteful), office environments, success imagery.
LAYOUT PATTERNS: Clean grids, generous whitespace, editorial layouts, credential showcases.
SECTIONS: Services overview, credentials/certifications, case studies or results stats, team bios, testimonials from named clients, consultation CTA.
UNIQUE: TRUST is everything - show certifications, years in business, client logos, specific results numbers.`,

    'Consulting': `
STYLE: Strategic, intellectual, results-driven, premium
HERO: Minimal, sophisticated. Data visualization elements, abstract strategy imagery.
TYPOGRAPHY: Clean, modern sans-serif. Professional but not stuffy.
COLORS: Deep blues, white, subtle gold accents, muted professional palette.
IMAGERY: Abstract strategy visuals, charts/graphs (stylized), meeting rooms, city views.
LAYOUT PATTERNS: Case study cards, results metrics prominently displayed, process timelines.
SECTIONS: Expertise areas, methodology/process steps, case studies with metrics, team credentials, client logos, discovery call CTA.
UNIQUE: Show EXPERTISE and RESULTS - use AnimatedCounters for client results, showcase methodology.`,

    'Accounting': `
STYLE: Precise, trustworthy, organized, approachable
HERO: Clean, professional, maybe abstract financial imagery or clean office.
TYPOGRAPHY: Clean, highly readable. Numbers should be prominent and well-designed.
COLORS: Blues, greens (money), white, conservative accents.
IMAGERY: Abstract financial, organized documents, calculators, professional settings.
LAYOUT PATTERNS: Clean service grids, pricing tables, credential badges, organized information.
SECTIONS: Services (tax, bookkeeping, advisory), credentials/certifications, about the team, client testimonials, free consultation CTA, deadline reminders.
UNIQUE: Emphasize TRUST and ACCURACY - certifications prominent, years experience, client count.`,

    // TRADES & HOME SERVICES
    'Home Services': `
STYLE: Reliable, local, trustworthy, urgent-friendly
HERO: Before/after project photos, workers in action, completed work showcase.
TYPOGRAPHY: Bold, clear, easy to read. Phone numbers LARGE.
COLORS: Blues, oranges, greens - trustworthy trade colors. High contrast for CTAs.
IMAGERY: Completed projects, uniformed workers, tools, happy homeowners, before/after.
LAYOUT PATTERNS: Service cards with icons, trust badges prominent, quote forms accessible.
SECTIONS: Services grid with icons, service areas map, trust badges (licensed, insured, bonded), reviews carousel, FREE ESTIMATE button everywhere, emergency service callout.
UNIQUE: Make CALLING/BOOKING easy - phone number in header, quote forms prominent, urgency messaging.`,

    'Plumbing': `
STYLE: Emergency-ready, trustworthy, local, fast response
HERO: Professional plumber at work, or clean bathroom result. Clear "CALL NOW" messaging.
TYPOGRAPHY: Bold, urgent, phone numbers prominent. Clear service headlines.
COLORS: Blues (water), white, orange/red for emergency CTAs.
IMAGERY: Professional work, tools, fixtures, happy homeowners, before/after.
LAYOUT PATTERNS: Service icons grid, emergency banner, trust badges, quick quote form.
SECTIONS: Emergency services highlighted, service list, service areas, trust badges, reviews, call-to-action with phone number HUGE.
UNIQUE: EMERGENCY messaging prominent - "24/7 Service", "Fast Response", "Same Day Service".`,

    'Landscaping': `
STYLE: Natural, transformative, seasonal, curb appeal focused
HERO: Beautiful completed landscape, dramatic before/after, lush greenery.
TYPOGRAPHY: Clean, natural feel. Can be slightly organic/earthy.
COLORS: Greens, browns, earth tones, with clean white backgrounds.
IMAGERY: Stunning landscaping projects, seasonal variety, before/after transformations, happy families in yards.
LAYOUT PATTERNS: Project gallery mosaic, seasonal services, before/after sliders.
SECTIONS: Services by season, project gallery (large images), design consultation offer, maintenance packages, testimonials with project photos.
UNIQUE: Show TRANSFORMATIONS - before/after comparisons, gallery of best work, seasonal tips.`,

    'default': `
STYLE: Professional, modern, trustworthy
HERO: Clear value proposition, prominent CTA, relevant imagery
TYPOGRAPHY: Clean sans-serif, clear hierarchy
COLORS: Use the provided theme colors consistently
IMAGERY: High-quality, relevant Unsplash images
LAYOUT PATTERNS: Standard sections with clear visual breaks
SECTIONS: Hero, features/services, about snippet, testimonials, CTA`
  };

  // Try exact match first, then partial match
  if (guidance[industryName]) {
    return guidance[industryName];
  }

  // Try partial matching for broader categories
  const lowerName = (industryName || '').toLowerCase();

  if (lowerName.includes('bowl') || lowerName.includes('arcade') || lowerName.includes('entertainment') || lowerName.includes('fun') || lowerName.includes('laser') || lowerName.includes('trampoline') || lowerName.includes('go-kart') || lowerName.includes('mini golf')) {
    return guidance['Entertainment'];
  }
  if (lowerName.includes('gym') || lowerName.includes('fitness') || lowerName.includes('crossfit') || lowerName.includes('workout')) {
    return guidance['Fitness'];
  }
  if (lowerName.includes('yoga') || lowerName.includes('pilates') || lowerName.includes('meditation')) {
    return guidance['Yoga Studio'];
  }
  if (lowerName.includes('restaurant') || lowerName.includes('food') || lowerName.includes('dining') || lowerName.includes('cafe') || lowerName.includes('bistro')) {
    return guidance['Restaurant / Food Service'];
  }
  if (lowerName.includes('law') || lowerName.includes('legal') || lowerName.includes('attorney')) {
    return guidance['Law Firm'];
  }
  if (lowerName.includes('consult') || lowerName.includes('advisory')) {
    return guidance['Consulting'];
  }
  if (lowerName.includes('account') || lowerName.includes('tax') || lowerName.includes('cpa') || lowerName.includes('bookkeep')) {
    return guidance['Accounting'];
  }
  if (lowerName.includes('plumb') || lowerName.includes('hvac') || lowerName.includes('electric') || lowerName.includes('roof')) {
    return guidance['Home Services'];
  }
  if (lowerName.includes('landscap') || lowerName.includes('lawn') || lowerName.includes('garden')) {
    return guidance['Landscaping'];
  }
  if (lowerName.includes('health') || lowerName.includes('medical') || lowerName.includes('clinic') || lowerName.includes('dental')) {
    return guidance['Healthcare / Medical'];
  }
  if (lowerName.includes('shop') || lowerName.includes('store') || lowerName.includes('retail') || lowerName.includes('ecommerce') || lowerName.includes('boutique')) {
    return guidance['E-Commerce / Retail'];
  }
  if (lowerName.includes('saas') || lowerName.includes('software') || lowerName.includes('platform') || lowerName.includes('app') || lowerName.includes('tech')) {
    return guidance['SaaS / B2B Platform'];
  }
  if (lowerName.includes('tattoo') || lowerName.includes('ink') || lowerName.includes('body art') || lowerName.includes('piercing')) {
    return guidance['Tattoo Studio'];
  }
  if (lowerName.includes('barber') || lowerName.includes('grooming')) {
    return guidance['Barbershop'];
  }

  return guidance['default'];
}

function getPageRequirements(pageId) {
  const requirements = {
    home: `
- Create a Hero that feels unique to the ARCHETYPE (not just a background image).
- Include 3-4 sections that showcase the business value.
- Mix up the order: Consider starting with a "Stat Strip" or "Featured Work" before the features.
- Ensure a clear CTA at the end.`,
    
    about: `
- Tell the story using the ARCHETYPE layout.
- Include a "Values" section that doesn't use standard cards (try a list or large text blocks).
- Highlight the mission with a massive pull-quote.`,

    services: `
- Show 3-6 offerings. 
- If Bento archetype: Use different box sizes for different service tiers.
- If Editorial archetype: Use large images for each service with minimal text.`,

    contact: `
- Split layout: Contact form + Business details.
- Use Lucide icons for phone, email, and address.
- Minimal, high-contrast inputs.`,

    dashboard: `
APP PAGE - User Dashboard (Mobile-first, works great on desktop too)
- Top section: Large balance display with current earnings (centered, bold)
- Stats row: 3 stat cards in a row (use flexWrap: 'wrap' so they stack on mobile)
- Quick actions: Big tap-friendly buttons linking to /earn, /rewards, /wallet
- Recent activity feed showing last 5 transactions in a clean list
- Use Card components with shadows, rounded corners (borderRadius: 16px)
- All buttons minimum 48px height for touch targets
- Max-width 600px centered on desktop, full-width on mobile`,

    earn: `
APP PAGE - Earn/Surveys Page (Mobile-first, works great on desktop too)
- Header: "Earn Money" with horizontal scrolling filter tabs (All, Surveys, Tasks, Offers)
- Survey cards: Full-width cards with padding 16px, borderRadius 12px, subtle shadow
- Each card shows: provider logo (40px), title, reward in GREEN bold ($0.50), time estimate
- Cards are tappable (cursor: pointer, hover/active states)
- Use flexWrap: 'wrap' for desktop to show 2 cards per row, single column on mobile
- Max-width 800px centered on desktop
- Sticky header with blur effect (backdropFilter: 'blur(10px)')
- Empty state with friendly illustration if no surveys`,

    rewards: `
APP PAGE - Rewards/Spin Page (Mobile-first, works great on desktop too)
- Hero section: Daily spin wheel centered, max-width 320px (build a colorful wheel with CSS transforms)
- Big "SPIN NOW" button below wheel (green, 56px height, full-width max 300px)
- Countdown timer if spin not available ("Next spin in 4:32:15")
- Streak bonus display: "🔥 5-day streak! 2x multiplier active"
- Recent winners: horizontal scroll of small winner cards showing avatar + amount won
- Achievements grid at bottom: 3 columns of badge icons with labels
- Max-width 500px centered on desktop, full-width with 16px padding on mobile`,

    wallet: `
APP PAGE - Wallet/Cashout Page (Mobile-first, works great on desktop too)
- Balance hero: Large centered balance "$24.50" (48px font, bold, green)
- Subtitle: "Available to cash out" with progress bar to next threshold
- Cashout buttons: 3 large tap-friendly cards (PayPal, Gift Cards, Bank)
- Each cashout card: icon (32px), name, minimum amount, "2-3 days" processing time
- Cards use flexWrap so 3 columns on desktop, stacked on mobile
- Transaction history: Clean list with date, description, +$0.50 green or -$10.00 for cashouts
- Section headers: "Cash Out", "History" with subtle dividers
- Max-width 600px centered on desktop`,

    profile: `
APP PAGE - User Profile (Mobile-first, works great on desktop too)
- Profile header: Centered avatar (80px circle), username below, "Member since Jan 2024"
- Stats row: 3 cards showing Total Earned ($142.50), Surveys (89), Level (12)
- Referral section: "Invite Friends" card with referral code, big "Copy" button, "Earn $1 per friend"
- Settings list: Clean rows with ChevronRight icons (Notifications, Payment Methods, Help, Log Out)
- Each settings row: 48px height, border-bottom, tappable
- Achievement badges: Horizontal scroll of earned badges with labels
- Max-width 500px centered on desktop`,

    leaderboard: `
APP PAGE - Leaderboard (Mobile-first, works great on desktop too)
- Sticky header with filter tabs: Today, This Week, This Month, All Time (horizontal scroll)
- Top 3 podium: Special section with gold/silver/bronze styling, larger avatars, crown icon for #1
- Ranked list below: Each row shows rank #, avatar (36px), username, earnings in green
- Rows are 60px height with subtle border-bottom
- Current user row: Highlighted with accent background color, "YOU" badge
- Sticky bottom card: "Your Rank: #47" always visible when scrolling
- Max-width 500px centered on desktop
- Use alternating subtle background colors for rows`
  };

  return requirements[pageId] || `Create a unique ${pageId} page layout using the assigned archetype.`;
}

function buildEnhanceModePrompt(pageId, pageName, existingSiteData, promptConfig) {
  const colors = existingSiteData?.designSystem?.colors || [];
  const fonts = existingSiteData?.designSystem?.fonts || [];
  
  return `ENHANCE MODE: Recreate the ${pageId} page for ${existingSiteData?.businessName || 'Business'} with a MORE PREMIUM look while keeping their brand.

THEIR BRAND (USE THESE EXACT VALUES):
- Primary Color: ${colors[0] || '#3e3e3e'}
- Accent Color: ${colors[1] || '#ff0e36'}
- Font: ${fonts[0]?.split('%')[0] || 'Oswald'}, sans-serif
- Prices: ${existingSiteData?.pageContent?.prices?.join(', ') || 'N/A'}

THEIR IMAGES (USE THESE ACTUAL URLs):
${existingSiteData?.designSystem?.images?.slice(0, 6).map(i => i.src).join('\n') || 'No images extracted'}

THEIR HEADLINES (USE THESE):
${existingSiteData?.pageContent?.headlines?.slice(0, 6).join(' | ') || 'Business Headline'}

RULES:
- Inline styles (style={{ }}) - NO Tailwind
- Lucide React icons - NO emojis
- NO header/footer - App.jsx handles those
- <Link> from react-router-dom
- USE their image URLs in img tags

CRITICAL STYLE SYNTAX:
✅ opacity: 0.7 (number, no quotes)
✅ fontSize: '16px' (string with quotes BOTH sides)
❌ NEVER: opacity: 0.7' (trailing quote without opening)
Rule: Numbers alone = no quotes. Values with units = quotes on BOTH sides.

${getEnhancePageInstructions(pageId, existingSiteData)}

IMPROVEMENTS: 80px+ section padding, 48-64px headlines, shadows, hover effects.

Return ONLY valid JSX starting with imports, ending with export default ${pageName}Page.`;
}

function getPageSpecificInstructions(pageId, colors, layout) {
  const heroHeight = layout.heroHeight || '70vh';
  const primary = colors.primary || '#0a1628';
  const accent = colors.accent || '#c9a962';

  // Page-specific animation styles - IMPORTANT: Each page should have DIFFERENT animations
  const pageAnimations = {
    home: `
ANIMATION STYLE FOR HOME - "DRAMATIC ENTRANCE":
- Wrap hero content in <ScrollReveal animation="fade-up" delay={0.2}>
- Use <ParallaxSection> for the hero background image
- Stats: Use <AnimatedCounter> with staggered delays (0, 0.2, 0.4)
- Feature cards: Wrap in <StaggeredList> for sequential reveal
- Add subtle <GlowEffect> to primary CTA button`,

    about: `
ANIMATION STYLE FOR ABOUT - "STORYTELLING FLOW":
- Hero: <ScrollReveal animation="fade-in" delay={0.1}> - simple, elegant
- Story section: Use <ScrollReveal animation="slide-right"> for text, <ScrollReveal animation="slide-left"> for images
- Values cards: <StaggeredList delay={0.15}> - gentle stagger
- Timeline elements: Alternate <ScrollReveal animation="slide-left"> and "slide-right"
- Team photos: <TiltCard> for subtle 3D hover effect`,

    services: `
ANIMATION STYLE FOR SERVICES - "CARD CASCADE":
- Hero: Minimal animation - just <ScrollReveal animation="fade-in">
- Service cards: Use <StaggeredList delay={0.1}> with <TiltCard> wrappers
- Process steps: <ScrollReveal animation="zoom-in"> for each step icon
- Pricing tiers: Stagger with delays 0.1, 0.2, 0.3
- NO parallax on this page - keep it professional and scannable`,

    gallery: `
ANIMATION STYLE FOR GALLERY - "MASONRY REVEAL":
- Hero: Short, simple <ScrollReveal animation="fade-in">
- Gallery images: <StaggeredList delay={0.05}> for rapid cascade effect
- Each image: Add subtle hover zoom (transform: scale(1.03))
- Lightbox overlay: CSS transition for smooth open
- Categories: Horizontal scroll or filter pills with fade transitions`,

    contact: `
ANIMATION STYLE FOR CONTACT - "CLEAN & DIRECT":
- Hero: Simple <ScrollReveal animation="fade-in">
- Contact form: <ScrollReveal animation="slide-up"> - single reveal for whole form
- Info cards: <ScrollReveal animation="fade-in" delay={0.2}> - subtle
- Map (if present): Fade in after form loads
- MINIMAL animations - users want to contact you, not watch effects`,

    pricing: `
ANIMATION STYLE FOR PRICING - "SPOTLIGHT TIERS":
- Hero: <ScrollReveal animation="fade-in">
- Pricing cards: <StaggeredList> with center card having <GlowEffect>
- Featured tier: Add subtle pulsing border animation (CSS @keyframes)
- Feature checkmarks: Stagger within each card
- Comparison table rows: <ScrollReveal animation="fade-up"> per row`,

    testimonials: `
ANIMATION STYLE FOR TESTIMONIALS - "QUOTE THEATER":
- Hero: <ScrollReveal animation="fade-in">
- Quote cards: <StaggeredList delay={0.15}> with <TiltCard> wrappers
- Large quote icons: <ScrollReveal animation="zoom-in">
- Star ratings: Animate in sequence (CSS @keyframes)
- Client photos: Subtle border glow on hover`,

    team: `
ANIMATION STYLE FOR TEAM - "PROFESSIONAL INTRODUCTION":
- Hero: <ScrollReveal animation="fade-in">
- Team cards: <StaggeredList delay={0.12}>
- Photos: <TiltCard> with subtle 3D effect on hover
- Social icons: Fade in on card hover (CSS transition)
- Bio text: <ScrollReveal animation="fade-up"> per section`,

    menu: `
ANIMATION STYLE FOR MENU - "APPETIZING DISPLAY":
- Hero: <ParallaxSection> with food imagery background
- Menu categories: <ScrollReveal animation="slide-up"> for headers
- Menu items: <StaggeredList delay={0.08}> for rapid display
- Prices: <AnimatedCounter> for any featured prices
- Food images: Scale-up hover effect (transform: scale(1.05))`,

    booking: `
ANIMATION STYLE FOR BOOKING - "GUIDED EXPERIENCE":
- Hero: Simple <ScrollReveal animation="fade-in">
- Booking form: <ScrollReveal animation="slide-up">
- Available slots: Subtle pulse animation on available times
- Calendar: CSS transition for date selection
- Confirmation: <ScrollReveal animation="zoom-in"> for success state`,

    faq: `
ANIMATION STYLE FOR FAQ - "ACCORDION FLOW":
- Hero: <ScrollReveal animation="fade-in">
- FAQ items: <StaggeredList delay={0.08}>
- Accordion expand: CSS max-height transition (0.3s ease)
- Plus/minus icons: Rotate transform on toggle
- Related questions: Fade in at bottom`
  };

  const instructions = {
    home: `
HOME PAGE REQUIREMENTS:
- HERO (${heroHeight}): Dark background (${primary}) with image overlay
  backgroundImage: 'linear-gradient(rgba(10, 22, 40, 0.85), rgba(10, 22, 40, 0.95)), url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920")'
  backgroundSize: 'cover', backgroundPosition: 'center'
- Accent line (width 60px, height 3px, background: ${accent}) above headline
- Main headline: large, font-weight 300
- Subheadline: 18-20px, opacity 0.9
- Two buttons: Filled primary CTA, outlined secondary
- INTRO SECTION: White/light background, value proposition, max-width 800px
- FEATURES: 3-4 cards with accent-colored Lucide icons
- TESTIMONIAL: Single quote with large Quote icon, italic text
- CTA SECTION: Dark background, compelling headline, accent button
${pageAnimations.home}`,

    about: `
ABOUT PAGE REQUIREMENTS:
- HERO (50vh): Solid dark background (${primary}), centered content
- Small label "OUR STORY" uppercase, letter-spacing 3px, accent color (${accent})
- Company name large (48px)
- Stats row: three numbers (500+, 15+, 1000+) with labels below
- STORY SECTION: Light bg, two columns - text left, pull quote right
- VALUES: 4 cards with icons (Shield, Target, Users, Award)
- CREDENTIALS: Subtle section with certifications
- CTA at bottom
${pageAnimations.about}`,

    services: `
SERVICES PAGE REQUIREMENTS:
- HERO (40vh): Gradient background, centered text
- Simple headline, brief tagline, NO buttons in hero
- SERVICE CARDS: Numbered (01, 02, 03, 04), accent-colored numbers
- Each card: title, description, bullet points with Check icons
- PROCESS SECTION: 4-step visual flow
- CTA: Accent button to contact
${pageAnimations.services}`,

    contact: `
CONTACT PAGE REQUIREMENTS:
- HERO (30vh): Dark background, "GET IN TOUCH" label, simple headline
- Split layout below: Form (60%) left, Info (40%) right
- Form: First name, Last name, Email, Phone, Company, Message
- Clean inputs: subtle borders, accent focus state, accent submit button
- Info card: MapPin, Phone, Mail, Clock icons with details
- Business hours displayed
${pageAnimations.contact}`,

    pricing: `
PRICING PAGE REQUIREMENTS:
- HERO (35vh): Dark background, "PRICING" label
- Pricing cards: featured tier with accent border
- Check icons for features in accent color
- Clear pricing, CTA buttons
- FAQ section below if space
${pageAnimations.pricing}`,

    faq: `
FAQ PAGE REQUIREMENTS:
- HERO (25vh): Light gray background, dark text
- Simple "Frequently Asked Questions" headline
- Accordion items with Plus/Minus icons (useState for expand/collapse)
- 8-10 relevant questions with detailed answers
- Accent color on expanded item border
- CTA at bottom for additional questions
${pageAnimations.faq}`,

    testimonials: `
TESTIMONIALS PAGE REQUIREMENTS:
- HERO (30vh): Dark background, "CLIENT SUCCESS" label
- Large testimonial cards with Quote icon
- Client initials in accent circle, name, title
- 4-6 testimonials in grid
- Stats section with success metrics
${pageAnimations.testimonials}`,

    team: `
TEAM PAGE REQUIREMENTS:
- HERO (40vh): Dark background, "OUR TEAM" label
- Team cards: initials in circle, name, title in accent
- 3-4 team members with short bios
- Credentials below each
${pageAnimations.team}`,

    booking: `
BOOKING PAGE REQUIREMENTS:
- HERO (30vh): Dark background, "SCHEDULE" label
- Booking form with service selection, date preference
- Contact fields
- Right side: what to expect, benefits
- Accent submit button
${pageAnimations.booking}`,

    gallery: `
GALLERY PAGE REQUIREMENTS:
- HERO (30vh): Dark background, "OUR WORK" or "GALLERY" label
- Gallery grid: masonry or uniform grid layout
- Lightbox on click for full-size images
- Categories/filters if multiple types of work
- High-quality images showcasing best work
${pageAnimations.gallery}`,

    menu: `
MENU PAGE REQUIREMENTS:
- HERO (35vh): Food imagery background with overlay
- Menu categories clearly labeled
- Items with descriptions and prices
- Dietary icons (vegetarian, gluten-free, etc.)
- Featured/popular items highlighted
${pageAnimations.menu}`
  };
  
  return instructions[pageId] || `
${pageId.toUpperCase()} PAGE:
- HERO (40vh): Appropriate for this page type
- Clear headline and description
- Relevant content sections
- CTA where appropriate`;
}

function getEnhancePageInstructions(pageId, existingSiteData) {
  // Simplified enhance instructions
  const images = existingSiteData?.designSystem?.images || [];
  
  if (pageId === 'home') {
    return `HOME PAGE - Create stunning hero with their product images, feature cards, testimonials, CTA sections.
Use their actual product images: ${images.slice(0, 8).map(i => i.src).join(', ') || 'none found'}`;
  }
  
  return `${pageId.toUpperCase()} PAGE - Create appropriate sections with their branding.`;
}

/**
 * Build page prompt specifically for Orchestrator mode
 * Streamlined version optimized for orchestrator-generated businesses
 */
function buildOrchestratorPagePrompt(pageId, componentName, otherPages, description, promptConfig) {
  const businessName = description.businessName || promptConfig.businessName || 'Our Business';
  const tagline = description.tagline || '';
  const cta = description.callToAction || 'Get Started';
  const industry = promptConfig.industry?.name || description.industryKey || 'business';
  const location = description.location || '';
  const colors = promptConfig.colors || { primary: '#6366f1', accent: '#06b6d4' };

  // Get industry-specific images
  const industryImages = getIndustryImageUrls(industry);

  const pageTypeGuide = {
    home: `HERO SECTION with impactful headline, tagline, and CTA button. FEATURES/SERVICES preview. TESTIMONIALS. About preview. Contact CTA.`,
    about: `Company story and mission. Team section with photos. Values/philosophy. Timeline or milestones. Trust badges.`,
    services: `Service cards with icons, descriptions, pricing hints. Process/how-it-works section. FAQ. Service area coverage.`,
    contact: `Contact form (name, email, phone, message). Business hours. Location map placeholder. Phone and email displayed prominently.`,
    pricing: `Pricing tiers/packages. Feature comparison. FAQ about pricing. Money-back guarantee badge. CTA to contact.`,
    gallery: `Image grid showcasing work. Before/after if applicable. Category filters. Lightbox-style presentation.`,
    'book-online': `Booking form or calendar integration placeholder. Service selection. Date/time picker mockup. Confirmation info.`,
    'service-areas': `Map or list of service areas. Coverage radius. Area-specific info. CTA per area.`,
    team: `Team member cards with photos, names, roles, bios. Company culture section.`,
    testimonials: `Customer reviews with photos, names, ratings. Video testimonial placeholders. Trust indicators.`,
    faq: `Accordion-style FAQ sections organized by category. Contact CTA for more questions.`,
    blog: `Blog post previews in card grid. Categories sidebar. Search placeholder. Featured posts.`
  };

  const pageGuide = pageTypeGuide[pageId] || `Create appropriate content sections for a ${pageId} page.`;

  return `You are an expert React developer creating a ${pageId.toUpperCase()} page for "${businessName}".

BUSINESS CONTEXT:
- Business Name: ${businessName}
- Industry: ${industry}
- Tagline: "${tagline}"
- Primary CTA: "${cta}"
- Location: ${location || 'Not specified'}

PAGE REQUIREMENTS:
${pageGuide}

OTHER PAGES IN THIS SITE: ${otherPages || 'none'}

DESIGN SYSTEM:
- Primary Color: ${colors.primary}
- Accent Color: ${colors.accent}
- Use modern, clean design with plenty of whitespace
- Mobile-first responsive design
- Smooth hover animations

IMAGES TO USE:
- Hero: ${industryImages.hero}
- Gallery: ${(industryImages.gallery || []).slice(0, 4).join(', ')}
- Services: ${(industryImages.services || []).slice(0, 3).join(', ')}

TECHNICAL REQUIREMENTS:
1. Export a single React functional component named ${componentName}Page
2. Use inline styles with JavaScript objects (no CSS imports except theme.css)
3. Import { Link } from 'react-router-dom' for navigation
4. Use semantic HTML (header, main, section, footer)
5. Include responsive breakpoints using CSS-in-JS
6. Add smooth scroll behavior for anchor links

CRITICAL:
- Return ONLY the JSX code, no markdown code blocks
- The component must be a complete, working React component
- Include proper export default statement
- Use actual image URLs provided, not placeholders

Generate the complete ${componentName}Page.jsx component:`;
}

function buildFallbackPage(componentName, pageId, promptConfig) {
  const colors = promptConfig?.colors || { primary: '#0a1628', text: '#1a1a2e', textMuted: '#4a5568' };
  const typography = promptConfig?.typography || { heading: 'Georgia, serif' };
  const displayName = toNavLabel(pageId);
  
  return `import React from 'react';
import { Link } from 'react-router-dom';

const ${componentName}Page = () => {
  return (
    <div style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '36px', color: '${colors.primary}', fontFamily: "${typography.heading}", marginBottom: '20px' }}>${displayName}</h1>
      <p style={{ color: '${colors.textMuted}', fontSize: '18px', lineHeight: 1.7 }}>Welcome to the ${displayName} page.</p>
    </div>
  );
};

export default ${componentName}Page;`;
}

// ============================================
// INDUSTRY HEADER CONFIGURATIONS
// ============================================
function getIndustryHeaderConfig(industry) {
  const lowerIndustry = (industry || '').toLowerCase();

  // Tattoo/Creative/Edgy Industries (Tattoo, Piercing, Motorcycle, Custom)
  if (lowerIndustry.includes('tattoo') || lowerIndustry.includes('ink') ||
      lowerIndustry.includes('piercing') || lowerIndustry.includes('motorcycle') ||
      lowerIndustry.includes('custom') || lowerIndustry.includes('body art')) {
    return {
      type: 'creative',
      showEmergencyBanner: false,
      primaryCta: { text: 'Book Consultation', icon: 'Calendar', action: 'link', href: '/booking' },
      secondaryCta: { text: 'View Portfolio', icon: 'Image', action: 'link', href: '/gallery' },
      headerStyle: 'edgy',
      glowEffect: true,
      mobilePhoneVisible: false
    };
  }

  // Barbershop/Grooming - masculine, bold
  if (lowerIndustry.includes('barber') || lowerIndustry.includes('grooming')) {
    return {
      type: 'barbershop',
      showEmergencyBanner: false,
      primaryCta: { text: 'Book Now', icon: 'Calendar', action: 'link', href: '/booking' },
      secondaryCta: { text: 'Our Services', icon: 'Scissors', action: 'link', href: '/services' },
      headerStyle: 'bold',
      mobilePhoneVisible: true
    };
  }

  // Emergency Services (Plumber, HVAC, Electrician, Locksmith)
  if (lowerIndustry.includes('plumb') || lowerIndustry.includes('hvac') ||
      lowerIndustry.includes('electric') || lowerIndustry.includes('locksmith') ||
      lowerIndustry.includes('roofing') || lowerIndustry.includes('emergency')) {
    return {
      type: 'emergency',
      showEmergencyBanner: true,
      emergencyText: '24/7 Emergency Service',
      showPhoneProminent: true,
      phoneNumber: '(555) 123-4567',
      primaryCta: { text: 'Call Now', icon: 'Phone', action: 'tel' },
      secondaryCta: { text: 'Get Quote', icon: 'FileText', action: 'link', href: '/contact' },
      showBadge: true,
      badgeText: '24/7',
      headerStyle: 'emergency',
      mobilePhoneVisible: true
    };
  }

  // Entertainment (Bowling, Arcade, Mini Golf, Trampoline)
  if (lowerIndustry.includes('bowl') || lowerIndustry.includes('arcade') ||
      lowerIndustry.includes('golf') || lowerIndustry.includes('trampoline') ||
      lowerIndustry.includes('laser') || lowerIndustry.includes('entertainment') ||
      lowerIndustry.includes('fun') || lowerIndustry.includes('go-kart')) {
    return {
      type: 'entertainment',
      showEmergencyBanner: false,
      showSocialIcons: true,
      primaryCta: { text: 'Book Now', icon: 'Calendar', action: 'link', href: '/book' },
      secondaryCta: { text: 'Parties', icon: 'PartyPopper', action: 'link', href: '/parties' },
      headerStyle: 'playful',
      glowEffect: true,
      mobilePhoneVisible: false
    };
  }

  // Restaurants/Food
  if (lowerIndustry.includes('restaurant') || lowerIndustry.includes('food') ||
      lowerIndustry.includes('dining') || lowerIndustry.includes('cafe') ||
      lowerIndustry.includes('bistro') || lowerIndustry.includes('bar') ||
      lowerIndustry.includes('grill') || lowerIndustry.includes('kitchen')) {
    return {
      type: 'restaurant',
      showEmergencyBanner: false,
      showHours: true,
      hoursText: 'Open today: 11am - 10pm',
      showLocation: true,
      primaryCta: { text: 'Order Online', icon: 'ShoppingBag', action: 'link', href: '/order' },
      secondaryCta: { text: 'Reservations', icon: 'Calendar', action: 'link', href: '/reservations' },
      headerStyle: 'warm',
      mobilePhoneVisible: true
    };
  }

  // Professional Services (Law, Accounting, Consulting)
  if (lowerIndustry.includes('law') || lowerIndustry.includes('legal') ||
      lowerIndustry.includes('attorney') || lowerIndustry.includes('account') ||
      lowerIndustry.includes('consult') || lowerIndustry.includes('advisory') ||
      lowerIndustry.includes('financial') || lowerIndustry.includes('cpa')) {
    return {
      type: 'professional',
      showEmergencyBanner: false,
      showCredentials: true,
      credentialsText: 'BBB A+ Rated',
      primaryCta: { text: 'Free Consultation', icon: 'Calendar', action: 'link', href: '/contact' },
      headerStyle: 'minimal',
      mobilePhoneVisible: true
    };
  }

  // Retail/E-commerce
  if (lowerIndustry.includes('retail') || lowerIndustry.includes('ecommerce') ||
      lowerIndustry.includes('shop') || lowerIndustry.includes('store') ||
      lowerIndustry.includes('boutique')) {
    return {
      type: 'retail',
      showEmergencyBanner: false,
      showSearch: true,
      showCart: true,
      primaryCta: { text: 'Shop Now', icon: 'ShoppingBag', action: 'link', href: '/shop' },
      showPromoBanner: true,
      promoText: 'Free Shipping on Orders $50+',
      headerStyle: 'modern',
      mobilePhoneVisible: false
    };
  }

  // Healthcare/Medical
  if (lowerIndustry.includes('health') || lowerIndustry.includes('medical') ||
      lowerIndustry.includes('clinic') || lowerIndustry.includes('dental') ||
      lowerIndustry.includes('doctor') || lowerIndustry.includes('hospital') ||
      lowerIndustry.includes('therapy') || lowerIndustry.includes('wellness')) {
    return {
      type: 'healthcare',
      showEmergencyBanner: false,
      showPhoneProminent: true,
      phoneNumber: '(555) 123-4567',
      primaryCta: { text: 'Book Appointment', icon: 'Calendar', action: 'link', href: '/appointment' },
      secondaryCta: { text: 'Patient Portal', icon: 'User', action: 'link', href: '/portal' },
      showCredentials: true,
      credentialsText: 'HIPAA Compliant',
      headerStyle: 'calming',
      mobilePhoneVisible: true
    };
  }

  // Fitness/Gym
  if (lowerIndustry.includes('fitness') || lowerIndustry.includes('gym') ||
      lowerIndustry.includes('yoga') || lowerIndustry.includes('crossfit') ||
      lowerIndustry.includes('workout') || lowerIndustry.includes('personal train')) {
    return {
      type: 'fitness',
      showEmergencyBanner: false,
      primaryCta: { text: 'Start Free Trial', icon: 'Zap', action: 'link', href: '/join' },
      secondaryCta: { text: 'Class Schedule', icon: 'Calendar', action: 'link', href: '/schedule' },
      headerStyle: 'bold',
      mobilePhoneVisible: false
    };
  }

  // Default
  return {
    type: 'default',
    showEmergencyBanner: false,
    primaryCta: { text: 'Contact Us', icon: 'Mail', action: 'link', href: '/contact' },
    headerStyle: 'default',
    mobilePhoneVisible: false
  };
}

function buildAppJsx(name, pages, promptConfig, industry) {
  const colors = promptConfig?.colors || { primary: '#0a1628', text: '#1a1a2e', textMuted: '#4a5568' };
  const typography = promptConfig?.typography || { heading: "Georgia, 'Times New Roman', serif" };

  // Get industry-specific header configuration
  const headerConfig = getIndustryHeaderConfig(industry);

  // Industries that require authentication
  const authRequiredIndustries = ['survey-rewards', 'saas', 'ecommerce', 'collectibles', 'healthcare', 'family'];
  const needsAuth = authRequiredIndustries.includes(industry);
  
  // Pages that require authentication (protected routes)
  const protectedPages = ['dashboard', 'earn', 'rewards', 'wallet', 'profile', 'settings', 'account'];
  
  const routeImports = pages.map(p => {
    const componentName = toComponentName(p) + 'Page';
    return `import ${componentName} from './pages/${componentName}';`;
  }).join('\n');
  
  const routeElements = pages.map(p => {
    const componentName = toComponentName(p) + 'Page';
    const routePath = toRoutePath(p);
    const isProtected = needsAuth && protectedPages.includes(p.toLowerCase().replace(/\s+/g, '-'));

    if (isProtected) {
      return `              <Route path="${routePath}" element={<ProtectedRoute><${componentName} /></ProtectedRoute>} />`;
    }
    return `              <Route path="${routePath}" element={<${componentName} />} />`;
  }).join('\n');

  // Filter out login/register from nav links
  const navPages = pages.filter(p => !['login', 'register'].includes(p.toLowerCase()));
  const navLinks = navPages.map(p => {
    const label = toNavLabel(p);
    const navPath = toRoutePath(p);
    return `            <Link to="${navPath}" style={styles.navLink}>${label}</Link>`;
  }).join('\n');
  
  // Auth imports and components
  const authImports = needsAuth ? `
// Auth components
import { AuthProvider } from './modules/auth-pages/components/AuthProvider';
import { ProtectedRoute } from './modules/auth-pages/components/ProtectedRoute';
import { LoginPage } from './modules/auth-pages/components/LoginPage';
import { RegisterPage } from './modules/auth-pages/components/RegisterPage';
import { useAuth } from './modules/auth-pages/components/AuthProvider';` : '';

  const authRoutes = needsAuth ? `
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />` : '';

  const authNavButtons = needsAuth ? `
            <AuthButtons />` : '';

  const authButtonsComponent = needsAuth ? `
// Auth navigation buttons
function AuthButtons() {
  const { user, logout } = useAuth();
  
  if (user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ color: '${colors.textMuted}', fontSize: '14px' }}>
          {user.fullName || user.email}
        </span>
        <button onClick={logout} style={styles.logoutButton}>
          Logout
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <Link to="/login" style={styles.loginButton}>Login</Link>
      <Link to="/register" style={styles.registerButton}>Sign Up</Link>
    </div>
  );
}
` : '';

  const authStyles = needsAuth ? `
  loginButton: {
    color: '${colors.textMuted}',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  registerButton: {
    background: '#22c55e',
    color: '#000000',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  logoutButton: {
    background: 'transparent',
    color: '${colors.textMuted}',
    border: '1px solid #333',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },` : '';

  const appWrapper = needsAuth ? ['<AuthProvider>', '</AuthProvider>'] : ['', ''];

  // Build industry-specific header icons
  const headerIcons = ['Menu', 'X'];
  if (headerConfig.primaryCta?.icon) headerIcons.push(headerConfig.primaryCta.icon);
  if (headerConfig.secondaryCta?.icon) headerIcons.push(headerConfig.secondaryCta.icon);
  if (headerConfig.showPhoneProminent) headerIcons.push('Phone');
  if (headerConfig.showSearch) headerIcons.push('Search');
  if (headerConfig.showCart) headerIcons.push('ShoppingCart');
  if (headerConfig.showSocialIcons) headerIcons.push('Facebook', 'Instagram');
  if (headerConfig.showHours) headerIcons.push('Clock');
  if (headerConfig.showLocation) headerIcons.push('MapPin');
  if (headerConfig.showCredentials) headerIcons.push('Shield');
  const uniqueIcons = [...new Set(headerIcons)].join(', ');

  // Build emergency banner if needed
  const emergencyBanner = headerConfig.showEmergencyBanner ? `
      {/* Emergency Banner */}
      <div style={styles.emergencyBanner}>
        <span style={styles.emergencyBadge}>${headerConfig.badgeText || '24/7'}</span>
        <span style={styles.emergencyText}>${headerConfig.emergencyText || '24/7 Emergency Service'}</span>
        <a href="tel:${(headerConfig.phoneNumber || '').replace(/[^0-9]/g, '')}" style={styles.emergencyPhone}>
          <Phone size={16} />
          ${headerConfig.phoneNumber || '(555) 123-4567'}
        </a>
      </div>` : '';

  // Build promo banner for retail
  const promoBanner = headerConfig.showPromoBanner ? `
      {/* Promo Banner */}
      <div style={styles.promoBanner}>
        ${headerConfig.promoText || 'Free Shipping on Orders $50+'}
      </div>` : '';

  // Build primary CTA button
  const primaryCtaCode = headerConfig.primaryCta ? `
            ${headerConfig.primaryCta.action === 'tel'
              ? `<a href="tel:${(headerConfig.phoneNumber || '').replace(/[^0-9]/g, '')}" style={styles.primaryCta}>
              <${headerConfig.primaryCta.icon} size={16} />
              ${headerConfig.primaryCta.text}
            </a>`
              : `<Link to="${headerConfig.primaryCta.href || '/contact'}" style={styles.primaryCta}>
              <${headerConfig.primaryCta.icon} size={16} />
              ${headerConfig.primaryCta.text}
            </Link>`
            }` : '';

  // Build secondary CTA button
  const secondaryCtaCode = headerConfig.secondaryCta ? `
            <Link to="${headerConfig.secondaryCta.href || '/contact'}" style={styles.secondaryCta}>
              <${headerConfig.secondaryCta.icon} size={16} />
              ${headerConfig.secondaryCta.text}
            </Link>` : '';

  // Build phone button for mobile
  const mobilePhoneBtn = headerConfig.mobilePhoneVisible && headerConfig.phoneNumber ? `
          <a href="tel:${(headerConfig.phoneNumber || '').replace(/[^0-9]/g, '')}" style={styles.mobilePhoneBtn}>
            <Phone size={20} />
          </a>` : '';

  // Build search for retail
  const searchBox = headerConfig.showSearch ? `
            <div style={styles.searchBox}>
              <Search size={18} style={styles.searchIcon} />
              <input type="text" placeholder="Search..." style={styles.searchInput} />
            </div>` : '';

  // Build cart for retail
  const cartIcon = headerConfig.showCart ? `
            <Link to="/cart" style={styles.cartLink}>
              <ShoppingCart size={20} />
              <span style={styles.cartBadge}>0</span>
            </Link>` : '';

  // Build hours for restaurant
  const hoursDisplay = headerConfig.showHours ? `
            <span style={styles.hoursDisplay}>
              <Clock size={14} />
              ${headerConfig.hoursText || 'Open today: 11am - 10pm'}
            </span>` : '';

  // Build credentials badge
  const credentialsBadge = headerConfig.showCredentials ? `
            <span style={styles.credentialsBadge}>
              <Shield size={14} />
              ${headerConfig.credentialsText || 'Certified'}
            </span>` : '';

  // Build social icons for entertainment
  const socialIcons = headerConfig.showSocialIcons ? `
            <div style={styles.socialIcons}>
              <a href="#" style={styles.socialLink}><Facebook size={18} /></a>
              <a href="#" style={styles.socialLink}><Instagram size={18} /></a>
            </div>` : '';

  return `/**
 * ${name} - Frontend App
 * Auto-generated by Module Library Assembler with AI
 * Header Type: ${headerConfig.type}
 */
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ${uniqueIcons} } from 'lucide-react';
import './theme.css';
// Page imports
${routeImports}
${authImports}
${authButtonsComponent}
// Mobile menu wrapper component with industry-specific header
function NavWrapper({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <>${emergencyBanner}${promoBanner}
      <nav style={styles.nav}>
        <Link to="/" style={styles.navBrand}>
          <span style={styles.brandText}>${name.replace(/-/g, ' ').replace(/\s+/g, ' ').trim()}</span>
        </Link>

        {isMobile ? (
          <div style={styles.mobileActions}>${mobilePhoneBtn}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={styles.hamburger}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        ) : (
          <>
            ${headerConfig.type === 'retail' ? searchBox : ''}
            <div style={styles.navLinks}>
${navLinks}
            </div>
            <div style={styles.navActions}>
              ${hoursDisplay}
              ${credentialsBadge}
              ${socialIcons}
              ${cartIcon}
              ${primaryCtaCode}
              ${secondaryCtaCode}
${authNavButtons}
            </div>
          </>
        )}
      </nav>

      {isMobile && menuOpen && (
        <div style={styles.mobileMenuOverlay} onClick={() => setMenuOpen(false)}>
          <div style={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
${navLinks.split('\n').map(link => link.replace('styles.navLink', 'styles.mobileNavLink')).join('\n')}
            <div style={styles.mobileCtas}>
              ${headerConfig.primaryCta ? `<Link to="${headerConfig.primaryCta.href || '/contact'}" style={styles.mobilePrimaryCta}>${headerConfig.primaryCta.text}</Link>` : ''}
              ${headerConfig.secondaryCta ? `<Link to="${headerConfig.secondaryCta.href || '/contact'}" style={styles.mobileSecondaryCta}>${headerConfig.secondaryCta.text}</Link>` : ''}
            </div>
            <div style={styles.mobileAuthButtons}>
${authNavButtons}
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

function App() {
  return (
    ${appWrapper[0]}
    <BrowserRouter>
      <div style={styles.app}>
        <NavWrapper>
          {/* Main Content */}
          <main style={styles.main}>
            <Routes>
${routeElements}${authRoutes}
            </Routes>
          </main>
          {/* Footer */}
          <footer style={styles.footer}>
            <p>© ${new Date().getFullYear()} ${name}. All rights reserved.</p>
          </footer>
        </NavWrapper>
      </div>
    </BrowserRouter>
    ${appWrapper[1]}
  );
}
// Calculate top offset based on banners
const topOffset = ${headerConfig.showEmergencyBanner ? '100' : headerConfig.showPromoBanner ? '92' : '60'};

const styles = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#ffffff',
    color: '${colors.text}',
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  // Emergency banner (for service businesses)
  emergencyBanner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)',
    color: '#ffffff',
    padding: '8px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    zIndex: 1001,
    fontSize: '14px',
    fontWeight: '500',
  },
  emergencyBadge: {
    background: '#ffffff',
    color: '#dc2626',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '700',
  },
  emergencyText: {
    display: 'none',
    '@media (min-width: 640px)': { display: 'inline' },
  },
  emergencyPhone: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: '700',
    background: 'rgba(255,255,255,0.2)',
    padding: '4px 12px',
    borderRadius: '4px',
  },
  // Promo banner (for retail)
  promoBanner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: '${colors.primary}',
    color: '#ffffff',
    padding: '8px 24px',
    textAlign: 'center',
    zIndex: 1001,
    fontSize: '13px',
    fontWeight: '500',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: '${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? (headerConfig.headerStyle === 'edgy' ? 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)' : headerConfig.headerStyle === 'bold' ? '#1a1a2e' : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)') : '#ffffff'}',
    borderBottom: '${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? 'none' : '1px solid rgba(10, 22, 40, 0.1)'}',
    position: 'fixed',
    top: ${headerConfig.showEmergencyBanner ? '40px' : headerConfig.showPromoBanner ? '32px' : '0'},
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1000,
    boxSizing: 'border-box',
    ${headerConfig.glowEffect ? "boxShadow: '0 0 20px rgba(147, 51, 234, 0.3)'," : headerConfig.headerStyle === 'edgy' ? "boxShadow: '0 2px 20px rgba(220, 38, 38, 0.2)'," : ''}
  },
  navBrand: {
    textDecoration: 'none',
  },
  brandText: {
    fontSize: '20px',
    fontWeight: '${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? '700' : '400'}',
    fontFamily: "${typography.heading}",
    color: '${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? '#ffffff' : colors.primary}',
    letterSpacing: '${headerConfig.headerStyle === 'edgy' ? '2px' : '1px'}',
    textTransform: '${headerConfig.headerStyle === 'edgy' ? 'uppercase' : 'none'}',
    ${headerConfig.glowEffect ? "textShadow: '0 0 10px rgba(147, 51, 234, 0.5)'," : headerConfig.headerStyle === 'edgy' ? "textShadow: '0 0 10px rgba(220, 38, 38, 0.3)'," : ''}
  },
  navLinks: {
    display: 'flex',
    gap: '32px',
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navAuth: {
    display: 'flex',
    alignItems: 'center',
  },
  navLink: {
    color: '${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? 'rgba(255,255,255,0.8)' : colors.textMuted}',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '${headerConfig.headerStyle === 'edgy' ? '600' : '500'}',
    letterSpacing: '${headerConfig.headerStyle === 'edgy' ? '2px' : '1px'}',
    textTransform: 'uppercase',
    transition: 'color 0.2s',
  },
  // Primary CTA button
  primaryCta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: '${headerConfig.type === 'emergency' ? '#dc2626' : headerConfig.type === 'entertainment' ? 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' : headerConfig.type === 'creative' ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : headerConfig.type === 'barbershop' ? '#1a1a2e' : '#22c55e'}',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: '${headerConfig.headerStyle === 'edgy' ? '4px' : '8px'}',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
    ${headerConfig.glowEffect ? "boxShadow: '0 0 15px rgba(147, 51, 234, 0.4)'," : headerConfig.type === 'creative' ? "boxShadow: '0 0 15px rgba(220, 38, 38, 0.4)'," : ''}
  },
  // Secondary CTA button
  secondaryCta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'transparent',
    color: '${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? '#ffffff' : colors.primary}',
    border: '1px solid ${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}',
    textDecoration: 'none',
    borderRadius: '${headerConfig.headerStyle === 'edgy' ? '4px' : '8px'}',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  // Hours display (restaurant)
  hoursDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '${colors.textMuted}',
    fontSize: '13px',
    padding: '6px 12px',
    background: 'rgba(0,0,0,0.05)',
    borderRadius: '4px',
  },
  // Credentials badge (professional)
  credentialsBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#059669',
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 10px',
    background: 'rgba(5, 150, 105, 0.1)',
    borderRadius: '4px',
  },
  // Social icons (entertainment)
  socialIcons: {
    display: 'flex',
    gap: '8px',
  },
  socialLink: {
    color: '${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? 'rgba(255,255,255,0.7)' : colors.textMuted}',
    transition: 'color 0.2s',
  },
  // Search box (retail)
  searchBox: {
    position: 'relative',
    marginRight: '24px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
  },
  searchInput: {
    padding: '10px 12px 10px 40px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    width: '240px',
    fontSize: '14px',
    outline: 'none',
  },
  // Cart link (retail)
  cartLink: {
    position: 'relative',
    color: '${colors.text}',
    padding: '8px',
  },
  cartBadge: {
    position: 'absolute',
    top: '0',
    right: '0',
    background: '#dc2626',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '600',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Mobile actions container
  mobileActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  // Mobile phone button (service businesses)
  mobilePhoneBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    background: '${headerConfig.type === 'emergency' ? '#dc2626' : '#22c55e'}',
    color: '#ffffff',
    borderRadius: '50%',
    textDecoration: 'none',
  },
  hamburger: {
    background: 'none',
    border: 'none',
    color: '${['playful', 'edgy', 'bold'].includes(headerConfig.headerStyle) ? '#ffffff' : colors.text}',
    cursor: 'pointer',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '48px',
    minHeight: '48px',
    marginRight: '-12px',
  },
  mobileMenuOverlay: {
    position: 'fixed',
    top: topOffset + 'px',
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  mobileMenu: {
    position: 'fixed',
    top: topOffset + 'px',
    left: 0,
    right: 0,
    background: '#ffffff',
    borderBottom: '1px solid rgba(10, 22, 40, 0.1)',
    padding: '16px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: 999,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    maxHeight: 'calc(100vh - ' + topOffset + 'px)',
    overflowY: 'auto',
  },
  mobileNavLink: {
    color: '${colors.text}',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    padding: '16px 0',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    display: 'block',
    minHeight: '48px',
    lineHeight: '16px',
  },
  mobileCtas: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingTop: '16px',
  },
  mobilePrimaryCta: {
    display: 'block',
    padding: '16px',
    background: '${headerConfig.type === 'emergency' ? '#dc2626' : headerConfig.type === 'entertainment' ? 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' : '#22c55e'}',
    color: '#ffffff',
    textDecoration: 'none',
    textAlign: 'center',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '16px',
  },
  mobileSecondaryCta: {
    display: 'block',
    padding: '16px',
    background: 'transparent',
    border: '1px solid #e5e7eb',
    color: '${colors.text}',
    textDecoration: 'none',
    textAlign: 'center',
    borderRadius: '8px',
    fontWeight: '500',
    fontSize: '16px',
  },
  mobileAuthButtons: {
    paddingTop: '16px',
    borderTop: '1px solid rgba(0,0,0,0.1)',
  },${authStyles}
  main: {
    flex: 1,
    paddingTop: topOffset + 'px',
  },
  footer: {
    padding: '40px 48px',
    background: '${colors.primary}',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    letterSpacing: '1px',
  },
};
export default App;
`;
}

// ============================================
// SYNTAX VALIDATION - Check AI-generated code
// ============================================

function buildFallbackThemeCss(promptConfig) {
  const colors = promptConfig?.colors || {};
  const typography = promptConfig?.typography || {};
  
  return `/* Auto-generated theme from industry config */
:root {
  --color-primary: ${colors.primary || '#6366f1'};
  --color-secondary: ${colors.secondary || '#8b5cf6'};
  --color-accent: ${colors.accent || '#06b6d4'};
  --color-background: ${colors.background || '#ffffff'};
  --color-surface: ${colors.surface || '#f8f9fa'};
  --color-text: ${colors.text || '#1a1a2e'};
  --color-text-muted: ${colors.textMuted || '#64748b'};
  --font-heading: ${typography.heading || "'Inter', sans-serif"};
  --font-body: ${typography.body || "system-ui, sans-serif"};
  --border-radius: 8px;
}
body { margin: 0; font-family: var(--font-body); color: var(--color-text); }
`;
}

module.exports = {
  initPromptBuilders,
  detectIndustryFromDescription,
  buildPrompt,
  buildSmartContextGuide,
  buildLayoutContextFromPreview,
  extractBusinessStats,
  generateDefaultStats,
  getIndustryImageUrls,
  buildRebuildContext,
  buildInspiredContext,
  buildUploadedAssetsContext,
  buildFreshModePrompt,
  getIndustryDesignGuidance,
  getPageRequirements,
  buildEnhanceModePrompt,
  getPageSpecificInstructions,
  getEnhancePageInstructions,
  buildOrchestratorPagePrompt,
  buildFallbackPage,
  getIndustryHeaderConfig,
  buildFallbackThemeCss
};
