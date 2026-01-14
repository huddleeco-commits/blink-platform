/**
 * BLINK Industry Layout System
 *
 * Comprehensive definitions for industry-specific website layouts.
 * Each industry has multiple layout options with specific section orders,
 * component variations, and styling guidance.
 */

// ============================================
// SECTION TEMPLATES - Reusable across layouts
// ============================================

export const SECTION_TEMPLATES = {
  // Hero Variations
  hero: {
    'hero-centered': {
      name: 'Centered Hero',
      description: 'Bold headline centered with CTA buttons below',
      structure: 'single-column',
      hasImage: 'background',
      hasForm: false,
      hasVideo: false
    },
    'hero-split': {
      name: 'Split Hero',
      description: 'Text on left, image/visual on right',
      structure: 'two-column',
      hasImage: 'side',
      hasForm: false,
      hasVideo: false
    },
    'hero-with-form': {
      name: 'Hero with Lead Form',
      description: 'Headline with inline contact/lead capture form',
      structure: 'two-column',
      hasImage: 'background',
      hasForm: true,
      hasVideo: false
    },
    'hero-with-video': {
      name: 'Hero with Video',
      description: 'Headline with embedded video or video background',
      structure: 'split-or-centered',
      hasImage: false,
      hasForm: false,
      hasVideo: true
    },
    'hero-minimal': {
      name: 'Minimal Hero',
      description: 'Large text only, maximum whitespace',
      structure: 'single-column',
      hasImage: false,
      hasForm: false,
      hasVideo: false
    },
    'hero-image-first': {
      name: 'Image-First Hero',
      description: 'Full-bleed image with overlay text',
      structure: 'overlay',
      hasImage: 'fullbleed',
      hasForm: false,
      hasVideo: false
    }
  },

  // Stats/Social Proof Variations
  stats: {
    'stats-bar': {
      name: 'Stats Bar',
      description: 'Horizontal row of key numbers',
      layout: 'horizontal',
      animated: false
    },
    'stats-cards': {
      name: 'Stats Cards',
      description: 'Individual cards for each stat',
      layout: 'grid',
      animated: false
    },
    'stats-animated': {
      name: 'Animated Counters',
      description: 'Numbers that count up on scroll',
      layout: 'horizontal',
      animated: true
    },
    'stats-large': {
      name: 'Large Stats',
      description: 'Big, bold numbers with minimal labels',
      layout: 'grid',
      animated: true
    }
  },

  // Testimonials Variations
  testimonials: {
    'testimonials-carousel': {
      name: 'Testimonials Carousel',
      description: 'Sliding carousel of reviews',
      layout: 'carousel',
      showPhoto: true,
      showRating: true
    },
    'testimonials-grid': {
      name: 'Testimonials Grid',
      description: 'Grid of testimonial cards',
      layout: 'grid',
      showPhoto: true,
      showRating: true
    },
    'testimonials-featured': {
      name: 'Featured Testimonial',
      description: 'One large, prominent testimonial',
      layout: 'single',
      showPhoto: true,
      showRating: false
    },
    'testimonials-quotes': {
      name: 'Quote Wall',
      description: 'Multiple quotes in masonry layout',
      layout: 'masonry',
      showPhoto: false,
      showRating: false
    }
  },

  // Services/Features Variations
  services: {
    'services-grid': {
      name: 'Services Grid',
      description: 'Equal-sized service cards in grid',
      layout: 'grid',
      hasIcons: true,
      hasImages: false
    },
    'services-list': {
      name: 'Services List',
      description: 'Vertical list with descriptions',
      layout: 'list',
      hasIcons: true,
      hasImages: false
    },
    'services-tabs': {
      name: 'Services Tabs',
      description: 'Tabbed interface for services',
      layout: 'tabs',
      hasIcons: true,
      hasImages: true
    },
    'services-bento': {
      name: 'Bento Grid',
      description: 'Mixed-size cards in bento layout',
      layout: 'bento',
      hasIcons: true,
      hasImages: true
    },
    'services-cards-hover': {
      name: 'Interactive Cards',
      description: 'Cards with hover effects and details',
      layout: 'grid',
      hasIcons: true,
      hasImages: true
    }
  },

  // CTA Variations
  cta: {
    'cta-simple': {
      name: 'Simple CTA',
      description: 'Headline + single button',
      hasForm: false,
      background: 'accent'
    },
    'cta-with-form': {
      name: 'CTA with Form',
      description: 'Headline + inline form',
      hasForm: true,
      background: 'gradient'
    },
    'cta-split': {
      name: 'Split CTA',
      description: 'Two-column with image',
      hasForm: false,
      background: 'image'
    },
    'cta-banner': {
      name: 'Banner CTA',
      description: 'Full-width banner style',
      hasForm: false,
      background: 'solid'
    }
  },

  // About/Story Variations
  about: {
    'about-split': {
      name: 'Split About',
      description: 'Image left, story right',
      layout: 'two-column',
      hasImage: true
    },
    'about-timeline': {
      name: 'Timeline About',
      description: 'Story told as timeline',
      layout: 'timeline',
      hasImage: true
    },
    'about-values': {
      name: 'Values-Focused',
      description: 'Highlight company values',
      layout: 'grid',
      hasImage: false
    },
    'about-team': {
      name: 'Team-Focused',
      description: 'Prominent team section',
      layout: 'team-grid',
      hasImage: true
    }
  },

  // Trust/Credentials Variations
  trust: {
    'trust-logos': {
      name: 'Logo Cloud',
      description: 'Client/partner logos',
      layout: 'horizontal'
    },
    'trust-badges': {
      name: 'Trust Badges',
      description: 'Certifications and awards',
      layout: 'grid'
    },
    'trust-press': {
      name: 'Press Mentions',
      description: 'As seen in logos',
      layout: 'horizontal'
    },
    'trust-guarantees': {
      name: 'Guarantees',
      description: 'Money-back, satisfaction guarantees',
      layout: 'cards'
    }
  },

  // Pricing Variations
  pricing: {
    'pricing-cards': {
      name: 'Pricing Cards',
      description: 'Side-by-side pricing tiers',
      layout: 'cards',
      highlighted: true
    },
    'pricing-table': {
      name: 'Pricing Table',
      description: 'Feature comparison table',
      layout: 'table',
      highlighted: true
    },
    'pricing-simple': {
      name: 'Simple Pricing',
      description: 'Single price or "Contact for quote"',
      layout: 'single',
      highlighted: false
    }
  },

  // Gallery/Portfolio Variations
  gallery: {
    'gallery-grid': {
      name: 'Image Grid',
      description: 'Equal-sized image grid',
      layout: 'grid',
      lightbox: true
    },
    'gallery-masonry': {
      name: 'Masonry Gallery',
      description: 'Pinterest-style layout',
      layout: 'masonry',
      lightbox: true
    },
    'gallery-carousel': {
      name: 'Image Carousel',
      description: 'Sliding image gallery',
      layout: 'carousel',
      lightbox: false
    },
    'gallery-featured': {
      name: 'Featured + Grid',
      description: 'One large, rest in grid',
      layout: 'featured',
      lightbox: true
    }
  },

  // Contact Variations
  contact: {
    'contact-split': {
      name: 'Split Contact',
      description: 'Form left, info right',
      layout: 'two-column',
      hasMap: false
    },
    'contact-with-map': {
      name: 'Contact with Map',
      description: 'Form with embedded map',
      layout: 'with-map',
      hasMap: true
    },
    'contact-minimal': {
      name: 'Minimal Contact',
      description: 'Just the essentials',
      layout: 'centered',
      hasMap: false
    }
  },

  // FAQ Variations
  faq: {
    'faq-accordion': {
      name: 'FAQ Accordion',
      description: 'Expandable questions',
      layout: 'accordion'
    },
    'faq-grid': {
      name: 'FAQ Grid',
      description: 'Cards with Q&As',
      layout: 'grid'
    },
    'faq-categories': {
      name: 'Categorized FAQ',
      description: 'Grouped by topic',
      layout: 'categorized'
    }
  }
};


// ============================================
// INDUSTRY DEFINITIONS
// ============================================

export const INDUSTRY_LAYOUTS = {

  // ==========================================
  // 1. PROFESSIONAL SERVICES
  // ==========================================
  'professional-services': {
    name: 'Professional Services',
    keywords: ['consulting', 'legal', 'accounting', 'franchise', 'advisor', 'coach', 'strategy'],
    description: 'Consulting, Legal, Accounting, Business Services',

    // Style Guidance
    style: {
      typography: 'traditional', // traditional, modern, playful
      colorMood: 'sophisticated', // sophisticated, energetic, calm, bold
      imageStyle: 'professional headshots, office environments, handshakes, meetings, cityscapes',
      spacing: 'generous', // tight, normal, generous
      corners: 'subtle', // sharp, subtle, rounded
    },

    // Recommended Color Palettes
    palettes: [
      { name: 'Navy Trust', primary: '#1e3a5f', secondary: '#2d5a87', accent: '#c9a962', text: '#1a1a2e' },
      { name: 'Corporate Blue', primary: '#0066cc', secondary: '#003d7a', accent: '#00a3e0', text: '#1a1a2e' },
      { name: 'Charcoal Gold', primary: '#2d2d2d', secondary: '#4a4a4a', accent: '#b8860b', text: '#1a1a2e' },
    ],

    // Primary CTA Types
    ctaTypes: ['Schedule Consultation', 'Get Free Quote', 'Book a Call', 'Request Proposal'],

    // Industry-Specific Trust Signals
    trustSignals: ['certifications', 'years-in-business', 'clients-served', 'case-studies', 'awards'],

    // Layout Options
    layouts: {
      'trust-builder': {
        name: 'Trust Builder',
        description: 'Testimonials prominent, credentials front-and-center. Best for established firms.',
        thumbnail: 'trust-builder',
        sectionOrder: [
          { section: 'hero', template: 'hero-split', required: true },
          { section: 'trust', template: 'trust-logos', required: true },
          { section: 'stats', template: 'stats-animated', required: true },
          { section: 'services', template: 'services-grid', required: true },
          { section: 'testimonials', template: 'testimonials-featured', required: true },
          { section: 'about', template: 'about-split', required: false },
          { section: 'faq', template: 'faq-accordion', required: false },
          { section: 'cta', template: 'cta-simple', required: true },
        ],
        emphasis: ['credibility', 'experience', 'results'],
      },
      'lead-generator': {
        name: 'Lead Generator',
        description: 'Form in hero, multiple CTAs throughout. Optimized for conversions.',
        thumbnail: 'lead-generator',
        sectionOrder: [
          { section: 'hero', template: 'hero-with-form', required: true },
          { section: 'trust', template: 'trust-badges', required: true },
          { section: 'services', template: 'services-cards-hover', required: true },
          { section: 'stats', template: 'stats-bar', required: true },
          { section: 'testimonials', template: 'testimonials-grid', required: true },
          { section: 'cta', template: 'cta-with-form', required: true },
          { section: 'faq', template: 'faq-accordion', required: false },
        ],
        emphasis: ['conversion', 'urgency', 'value-proposition'],
      },
      'corporate-clean': {
        name: 'Corporate Clean',
        description: 'Minimal design, lots of whitespace. Premium, sophisticated feel.',
        thumbnail: 'corporate-clean',
        sectionOrder: [
          { section: 'hero', template: 'hero-minimal', required: true },
          { section: 'about', template: 'about-values', required: true },
          { section: 'services', template: 'services-list', required: true },
          { section: 'stats', template: 'stats-large', required: false },
          { section: 'testimonials', template: 'testimonials-quotes', required: false },
          { section: 'cta', template: 'cta-simple', required: true },
        ],
        emphasis: ['elegance', 'simplicity', 'authority'],
      }
    }
  },

  // ==========================================
  // 2. RESTAURANTS & FOOD
  // ==========================================
  'restaurants-food': {
    name: 'Restaurants & Food',
    keywords: ['restaurant', 'cafe', 'bistro', 'bar', 'food', 'dining', 'catering', 'bakery', 'coffee'],
    description: 'Restaurants, Cafes, Bars, Catering, Food Service',

    style: {
      typography: 'mixed', // Can be modern or decorative
      colorMood: 'warm',
      imageStyle: 'appetizing food photography, interior ambiance, chef at work, ingredients, plated dishes',
      spacing: 'normal',
      corners: 'rounded',
    },

    palettes: [
      { name: 'Warm Bistro', primary: '#8b4513', secondary: '#d2691e', accent: '#daa520', text: '#2d1810' },
      { name: 'Modern Eatery', primary: '#1a1a1a', secondary: '#333333', accent: '#e74c3c', text: '#1a1a1a' },
      { name: 'Fresh & Natural', primary: '#2d5a27', secondary: '#4a7c45', accent: '#f4a460', text: '#1a1a1a' },
    ],

    ctaTypes: ['View Menu', 'Make Reservation', 'Order Online', 'Book a Table'],

    trustSignals: ['reviews', 'awards', 'press-mentions', 'chef-credentials', 'local-sourcing'],

    layouts: {
      'appetizing-visual': {
        name: 'Appetizing Visual',
        description: 'Food photography takes center stage. Let the images sell.',
        thumbnail: 'appetizing-visual',
        sectionOrder: [
          { section: 'hero', template: 'hero-image-first', required: true },
          { section: 'gallery', template: 'gallery-masonry', required: true },
          { section: 'about', template: 'about-split', required: true },
          { section: 'services', template: 'services-grid', required: true, label: 'Menu Highlights' },
          { section: 'testimonials', template: 'testimonials-carousel', required: true },
          { section: 'contact', template: 'contact-with-map', required: true },
        ],
        emphasis: ['visual-appeal', 'ambiance', 'experience'],
      },
      'menu-focused': {
        name: 'Menu Focused',
        description: 'Menu prominently displayed. Great for takeout/delivery.',
        thumbnail: 'menu-focused',
        sectionOrder: [
          { section: 'hero', template: 'hero-centered', required: true },
          { section: 'services', template: 'services-tabs', required: true, label: 'Our Menu' },
          { section: 'gallery', template: 'gallery-grid', required: false },
          { section: 'about', template: 'about-team', required: false, label: 'Our Chef' },
          { section: 'testimonials', template: 'testimonials-grid', required: true },
          { section: 'cta', template: 'cta-split', required: true },
        ],
        emphasis: ['menu', 'ordering', 'convenience'],
      },
      'story-driven': {
        name: 'Story Driven',
        description: 'Tell your restaurant\'s story. Perfect for unique concepts.',
        thumbnail: 'story-driven',
        sectionOrder: [
          { section: 'hero', template: 'hero-with-video', required: true },
          { section: 'about', template: 'about-timeline', required: true },
          { section: 'gallery', template: 'gallery-featured', required: true },
          { section: 'services', template: 'services-list', required: true, label: 'What We Offer' },
          { section: 'testimonials', template: 'testimonials-featured', required: true },
          { section: 'contact', template: 'contact-split', required: true },
        ],
        emphasis: ['story', 'authenticity', 'passion'],
      }
    }
  },

  // ==========================================
  // 3. HEALTHCARE & MEDICAL
  // ==========================================
  'healthcare-medical': {
    name: 'Healthcare & Medical',
    keywords: ['medical', 'healthcare', 'dental', 'clinic', 'doctor', 'therapy', 'wellness', 'hospital'],
    description: 'Medical Practices, Dental, Clinics, Therapy, Healthcare',

    style: {
      typography: 'modern',
      colorMood: 'calm',
      imageStyle: 'clean medical environments, caring professionals, happy patients, modern equipment, calming nature',
      spacing: 'generous',
      corners: 'rounded',
    },

    palettes: [
      { name: 'Medical Trust', primary: '#0077b6', secondary: '#0096c7', accent: '#48cae4', text: '#1a1a2e' },
      { name: 'Calm Care', primary: '#2a9d8f', secondary: '#40b8aa', accent: '#e9c46a', text: '#1a1a2e' },
      { name: 'Clean Clinical', primary: '#4a5568', secondary: '#718096', accent: '#38b2ac', text: '#1a1a2e' },
    ],

    ctaTypes: ['Book Appointment', 'Schedule Visit', 'Contact Us', 'Request Consultation'],

    trustSignals: ['certifications', 'insurance-accepted', 'patient-reviews', 'years-experience', 'credentials'],

    layouts: {
      'patient-first': {
        name: 'Patient First',
        description: 'Welcoming, accessible design. Reduces anxiety about visiting.',
        thumbnail: 'patient-first',
        sectionOrder: [
          { section: 'hero', template: 'hero-split', required: true },
          { section: 'services', template: 'services-grid', required: true, label: 'Our Services' },
          { section: 'trust', template: 'trust-badges', required: true, label: 'Certifications' },
          { section: 'about', template: 'about-team', required: true, label: 'Meet Our Team' },
          { section: 'testimonials', template: 'testimonials-carousel', required: true },
          { section: 'faq', template: 'faq-accordion', required: true },
          { section: 'cta', template: 'cta-with-form', required: true },
        ],
        emphasis: ['trust', 'accessibility', 'care'],
      },
      'credibility-focused': {
        name: 'Credibility Focused',
        description: 'Highlight credentials and expertise. For specialists.',
        thumbnail: 'credibility-focused',
        sectionOrder: [
          { section: 'hero', template: 'hero-centered', required: true },
          { section: 'trust', template: 'trust-badges', required: true },
          { section: 'stats', template: 'stats-animated', required: true },
          { section: 'services', template: 'services-cards-hover', required: true },
          { section: 'about', template: 'about-split', required: true },
          { section: 'testimonials', template: 'testimonials-featured', required: true },
          { section: 'contact', template: 'contact-split', required: true },
        ],
        emphasis: ['expertise', 'credentials', 'results'],
      },
      'booking-optimized': {
        name: 'Booking Optimized',
        description: 'Easy appointment scheduling is the priority.',
        thumbnail: 'booking-optimized',
        sectionOrder: [
          { section: 'hero', template: 'hero-with-form', required: true },
          { section: 'services', template: 'services-list', required: true },
          { section: 'trust', template: 'trust-logos', required: false },
          { section: 'about', template: 'about-values', required: false },
          { section: 'faq', template: 'faq-grid', required: true },
          { section: 'contact', template: 'contact-with-map', required: true },
        ],
        emphasis: ['convenience', 'booking', 'accessibility'],
      }
    }
  },

  // ==========================================
  // 4. RETAIL & ECOMMERCE
  // ==========================================
  'retail-ecommerce': {
    name: 'Retail & Ecommerce',
    keywords: ['shop', 'store', 'retail', 'ecommerce', 'boutique', 'products', 'merchandise'],
    description: 'Online Stores, Retail, Boutiques, Product Sales',

    style: {
      typography: 'modern',
      colorMood: 'energetic',
      imageStyle: 'product photography, lifestyle shots, unboxing, happy customers, clean backgrounds',
      spacing: 'normal',
      corners: 'subtle',
    },

    palettes: [
      { name: 'Bold Commerce', primary: '#e63946', secondary: '#f72585', accent: '#ffd60a', text: '#1a1a2e' },
      { name: 'Luxury Retail', primary: '#1a1a1a', secondary: '#333333', accent: '#d4af37', text: '#1a1a1a' },
      { name: 'Fresh Shop', primary: '#06d6a0', secondary: '#118ab2', accent: '#ff6b6b', text: '#1a1a2e' },
    ],

    ctaTypes: ['Shop Now', 'Browse Collection', 'Get 20% Off', 'Start Shopping'],

    trustSignals: ['reviews', 'secure-checkout', 'free-shipping', 'money-back', 'customer-count'],

    layouts: {
      'product-showcase': {
        name: 'Product Showcase',
        description: 'Products front and center. Visual-first approach.',
        thumbnail: 'product-showcase',
        sectionOrder: [
          { section: 'hero', template: 'hero-image-first', required: true },
          { section: 'gallery', template: 'gallery-grid', required: true, label: 'Featured Products' },
          { section: 'trust', template: 'trust-guarantees', required: true },
          { section: 'services', template: 'services-bento', required: true, label: 'Categories' },
          { section: 'testimonials', template: 'testimonials-grid', required: true },
          { section: 'cta', template: 'cta-banner', required: true },
        ],
        emphasis: ['visual', 'products', 'discovery'],
      },
      'conversion-focused': {
        name: 'Conversion Focused',
        description: 'Optimized for sales. Clear paths to purchase.',
        thumbnail: 'conversion-focused',
        sectionOrder: [
          { section: 'hero', template: 'hero-centered', required: true },
          { section: 'stats', template: 'stats-bar', required: true },
          { section: 'services', template: 'services-grid', required: true, label: 'Shop By Category' },
          { section: 'trust', template: 'trust-guarantees', required: true },
          { section: 'testimonials', template: 'testimonials-carousel', required: true },
          { section: 'cta', template: 'cta-simple', required: true },
          { section: 'faq', template: 'faq-accordion', required: false },
        ],
        emphasis: ['conversion', 'trust', 'value'],
      },
      'brand-story': {
        name: 'Brand Story',
        description: 'Tell your brand story alongside products.',
        thumbnail: 'brand-story',
        sectionOrder: [
          { section: 'hero', template: 'hero-with-video', required: true },
          { section: 'about', template: 'about-values', required: true },
          { section: 'gallery', template: 'gallery-masonry', required: true },
          { section: 'services', template: 'services-cards-hover', required: true },
          { section: 'testimonials', template: 'testimonials-featured', required: true },
          { section: 'cta', template: 'cta-split', required: true },
        ],
        emphasis: ['story', 'brand', 'lifestyle'],
      }
    }
  },

  // ==========================================
  // 5. HOME SERVICES
  // ==========================================
  'home-services': {
    name: 'Home Services',
    keywords: ['plumber', 'electrician', 'contractor', 'cleaning', 'repair', 'hvac', 'landscaping', 'roofing', 'handyman'],
    description: 'Plumbers, Electricians, Contractors, Cleaning, Repair Services',

    style: {
      typography: 'modern',
      colorMood: 'bold',
      imageStyle: 'before/after shots, work in progress, uniformed workers, tools, completed projects',
      spacing: 'normal',
      corners: 'subtle',
    },

    palettes: [
      { name: 'Reliable Blue', primary: '#2563eb', secondary: '#3b82f6', accent: '#f59e0b', text: '#1a1a2e' },
      { name: 'Pro Green', primary: '#059669', secondary: '#10b981', accent: '#f97316', text: '#1a1a2e' },
      { name: 'Trade Red', primary: '#dc2626', secondary: '#ef4444', accent: '#1e3a5f', text: '#1a1a2e' },
    ],

    ctaTypes: ['Get Free Estimate', 'Call Now', 'Schedule Service', 'Request Quote'],

    trustSignals: ['licensed-insured', 'reviews', 'years-experience', 'warranty', 'local-business'],

    layouts: {
      'trust-and-call': {
        name: 'Trust & Call',
        description: 'Build trust fast, make calling easy. For emergency services.',
        thumbnail: 'trust-and-call',
        sectionOrder: [
          { section: 'hero', template: 'hero-split', required: true },
          { section: 'trust', template: 'trust-badges', required: true },
          { section: 'stats', template: 'stats-animated', required: true },
          { section: 'services', template: 'services-grid', required: true },
          { section: 'testimonials', template: 'testimonials-carousel', required: true },
          { section: 'gallery', template: 'gallery-grid', required: false, label: 'Our Work' },
          { section: 'cta', template: 'cta-simple', required: true },
        ],
        emphasis: ['trust', 'urgency', 'reliability'],
      },
      'quote-generator': {
        name: 'Quote Generator',
        description: 'Easy quote requests. Form prominently placed.',
        thumbnail: 'quote-generator',
        sectionOrder: [
          { section: 'hero', template: 'hero-with-form', required: true },
          { section: 'services', template: 'services-cards-hover', required: true },
          { section: 'trust', template: 'trust-logos', required: true },
          { section: 'gallery', template: 'gallery-featured', required: true, label: 'Recent Projects' },
          { section: 'testimonials', template: 'testimonials-grid', required: true },
          { section: 'faq', template: 'faq-accordion', required: true },
        ],
        emphasis: ['leads', 'convenience', 'transparency'],
      },
      'portfolio-showcase': {
        name: 'Portfolio Showcase',
        description: 'Show off your best work. Before/after gallery.',
        thumbnail: 'portfolio-showcase',
        sectionOrder: [
          { section: 'hero', template: 'hero-centered', required: true },
          { section: 'gallery', template: 'gallery-masonry', required: true, label: 'Our Work' },
          { section: 'services', template: 'services-list', required: true },
          { section: 'stats', template: 'stats-cards', required: true },
          { section: 'testimonials', template: 'testimonials-featured', required: true },
          { section: 'cta', template: 'cta-with-form', required: true },
        ],
        emphasis: ['portfolio', 'quality', 'craftsmanship'],
      }
    }
  },

  // ==========================================
  // 6. FITNESS & WELLNESS
  // ==========================================
  'fitness-wellness': {
    name: 'Fitness & Wellness',
    keywords: ['gym', 'fitness', 'yoga', 'pilates', 'personal trainer', 'wellness', 'spa', 'meditation'],
    description: 'Gyms, Yoga Studios, Personal Training, Wellness Centers',

    style: {
      typography: 'modern',
      colorMood: 'energetic',
      imageStyle: 'action shots, fitness equipment, healthy people, studio spaces, nature/outdoors',
      spacing: 'normal',
      corners: 'rounded',
    },

    palettes: [
      { name: 'Energy Burst', primary: '#ff6b35', secondary: '#f7931e', accent: '#00d4aa', text: '#1a1a2e' },
      { name: 'Zen Calm', primary: '#4a7c59', secondary: '#6b9b78', accent: '#e9c46a', text: '#1a1a2e' },
      { name: 'Power Dark', primary: '#1a1a1a', secondary: '#333333', accent: '#00ff88', text: '#ffffff' },
    ],

    ctaTypes: ['Start Free Trial', 'Book a Class', 'Get Started', 'Join Now'],

    trustSignals: ['certified-trainers', 'member-results', 'reviews', 'equipment-quality', 'transformations'],

    layouts: {
      'motivation-driven': {
        name: 'Motivation Driven',
        description: 'Inspiring visuals and testimonials. Get people pumped.',
        thumbnail: 'motivation-driven',
        sectionOrder: [
          { section: 'hero', template: 'hero-with-video', required: true },
          { section: 'stats', template: 'stats-animated', required: true, label: 'Results' },
          { section: 'services', template: 'services-bento', required: true, label: 'Programs' },
          { section: 'gallery', template: 'gallery-carousel', required: true, label: 'Transformations' },
          { section: 'testimonials', template: 'testimonials-featured', required: true },
          { section: 'pricing', template: 'pricing-cards', required: true },
          { section: 'cta', template: 'cta-simple', required: true },
        ],
        emphasis: ['motivation', 'results', 'community'],
      },
      'class-scheduler': {
        name: 'Class Scheduler',
        description: 'Class schedules and booking front and center.',
        thumbnail: 'class-scheduler',
        sectionOrder: [
          { section: 'hero', template: 'hero-split', required: true },
          { section: 'services', template: 'services-tabs', required: true, label: 'Classes' },
          { section: 'about', template: 'about-team', required: true, label: 'Instructors' },
          { section: 'pricing', template: 'pricing-cards', required: true },
          { section: 'testimonials', template: 'testimonials-carousel', required: true },
          { section: 'faq', template: 'faq-accordion', required: false },
          { section: 'contact', template: 'contact-with-map', required: true },
        ],
        emphasis: ['schedule', 'booking', 'instructors'],
      },
      'wellness-calm': {
        name: 'Wellness Calm',
        description: 'Peaceful, calming design. Perfect for yoga/meditation.',
        thumbnail: 'wellness-calm',
        sectionOrder: [
          { section: 'hero', template: 'hero-minimal', required: true },
          { section: 'about', template: 'about-values', required: true },
          { section: 'services', template: 'services-list', required: true },
          { section: 'gallery', template: 'gallery-masonry', required: true },
          { section: 'testimonials', template: 'testimonials-quotes', required: true },
          { section: 'cta', template: 'cta-simple', required: true },
        ],
        emphasis: ['calm', 'mindfulness', 'experience'],
      }
    }
  },

  // ==========================================
  // 7. REAL ESTATE
  // ==========================================
  'real-estate': {
    name: 'Real Estate',
    keywords: ['real estate', 'realtor', 'property', 'homes', 'apartments', 'broker', 'agent'],
    description: 'Real Estate Agents, Property Management, Brokers',

    style: {
      typography: 'modern',
      colorMood: 'sophisticated',
      imageStyle: 'property exteriors, interior shots, neighborhoods, agent headshots, aerial views',
      spacing: 'generous',
      corners: 'subtle',
    },

    palettes: [
      { name: 'Luxury Estate', primary: '#1e3a5f', secondary: '#2d5a87', accent: '#d4af37', text: '#1a1a2e' },
      { name: 'Modern Realty', primary: '#0f172a', secondary: '#334155', accent: '#f97316', text: '#1a1a2e' },
      { name: 'Warm Home', primary: '#78350f', secondary: '#92400e', accent: '#10b981', text: '#1a1a2e' },
    ],

    ctaTypes: ['Search Properties', 'Get Home Valuation', 'Schedule Showing', 'Contact Agent'],

    trustSignals: ['sales-volume', 'reviews', 'years-experience', 'certifications', 'listings-sold'],

    layouts: {
      'property-search': {
        name: 'Property Search',
        description: 'Search and browse properties prominently featured.',
        thumbnail: 'property-search',
        sectionOrder: [
          { section: 'hero', template: 'hero-with-form', required: true },
          { section: 'gallery', template: 'gallery-featured', required: true, label: 'Featured Listings' },
          { section: 'services', template: 'services-grid', required: true, label: 'Services' },
          { section: 'stats', template: 'stats-animated', required: true },
          { section: 'testimonials', template: 'testimonials-carousel', required: true },
          { section: 'cta', template: 'cta-simple', required: true },
        ],
        emphasis: ['search', 'listings', 'discovery'],
      },
      'agent-brand': {
        name: 'Agent Brand',
        description: 'Personal branding for individual agents.',
        thumbnail: 'agent-brand',
        sectionOrder: [
          { section: 'hero', template: 'hero-split', required: true },
          { section: 'about', template: 'about-split', required: true },
          { section: 'stats', template: 'stats-cards', required: true },
          { section: 'gallery', template: 'gallery-grid', required: true, label: 'Recent Sales' },
          { section: 'testimonials', template: 'testimonials-featured', required: true },
          { section: 'services', template: 'services-list', required: true },
          { section: 'cta', template: 'cta-with-form', required: true },
        ],
        emphasis: ['personal-brand', 'trust', 'expertise'],
      },
      'luxury-focused': {
        name: 'Luxury Focused',
        description: 'High-end, premium feel for luxury properties.',
        thumbnail: 'luxury-focused',
        sectionOrder: [
          { section: 'hero', template: 'hero-image-first', required: true },
          { section: 'gallery', template: 'gallery-masonry', required: true },
          { section: 'about', template: 'about-values', required: true },
          { section: 'testimonials', template: 'testimonials-quotes', required: true },
          { section: 'contact', template: 'contact-minimal', required: true },
        ],
        emphasis: ['luxury', 'exclusivity', 'quality'],
      }
    }
  },

  // ==========================================
  // 8. EDUCATION & COACHING
  // ==========================================
  'education-coaching': {
    name: 'Education & Coaching',
    keywords: ['tutoring', 'coaching', 'courses', 'training', 'school', 'academy', 'learning', 'mentor'],
    description: 'Tutoring, Online Courses, Coaching, Training Programs',

    style: {
      typography: 'modern',
      colorMood: 'energetic',
      imageStyle: 'learning environments, success stories, instructor headshots, students engaged, course materials',
      spacing: 'normal',
      corners: 'rounded',
    },

    palettes: [
      { name: 'Academic Blue', primary: '#1e40af', secondary: '#3b82f6', accent: '#f59e0b', text: '#1a1a2e' },
      { name: 'Growth Green', primary: '#047857', secondary: '#10b981', accent: '#8b5cf6', text: '#1a1a2e' },
      { name: 'Creative Purple', primary: '#7c3aed', secondary: '#8b5cf6', accent: '#f472b6', text: '#1a1a2e' },
    ],

    ctaTypes: ['Enroll Now', 'Start Learning', 'Book Session', 'Get Free Lesson'],

    trustSignals: ['student-success', 'credentials', 'reviews', 'years-teaching', 'curriculum'],

    layouts: {
      'course-catalog': {
        name: 'Course Catalog',
        description: 'Browse courses and programs. Learning-focused.',
        thumbnail: 'course-catalog',
        sectionOrder: [
          { section: 'hero', template: 'hero-centered', required: true },
          { section: 'services', template: 'services-bento', required: true, label: 'Courses' },
          { section: 'stats', template: 'stats-animated', required: true },
          { section: 'about', template: 'about-team', required: true, label: 'Instructors' },
          { section: 'testimonials', template: 'testimonials-grid', required: true },
          { section: 'pricing', template: 'pricing-cards', required: true },
          { section: 'faq', template: 'faq-accordion', required: true },
        ],
        emphasis: ['courses', 'value', 'outcomes'],
      },
      'coach-personal': {
        name: 'Coach Personal Brand',
        description: 'Personal branding for coaches and mentors.',
        thumbnail: 'coach-personal',
        sectionOrder: [
          { section: 'hero', template: 'hero-split', required: true },
          { section: 'about', template: 'about-split', required: true },
          { section: 'stats', template: 'stats-cards', required: true },
          { section: 'services', template: 'services-list', required: true, label: 'How I Help' },
          { section: 'testimonials', template: 'testimonials-featured', required: true },
          { section: 'cta', template: 'cta-with-form', required: true },
        ],
        emphasis: ['personal-brand', 'transformation', 'trust'],
      },
      'results-focused': {
        name: 'Results Focused',
        description: 'Highlight student success and outcomes.',
        thumbnail: 'results-focused',
        sectionOrder: [
          { section: 'hero', template: 'hero-with-video', required: true },
          { section: 'stats', template: 'stats-large', required: true },
          { section: 'testimonials', template: 'testimonials-carousel', required: true },
          { section: 'services', template: 'services-cards-hover', required: true },
          { section: 'about', template: 'about-values', required: false },
          { section: 'pricing', template: 'pricing-cards', required: true },
          { section: 'cta', template: 'cta-simple', required: true },
        ],
        emphasis: ['results', 'transformations', 'proof'],
      }
    }
  },

  // ==========================================
  // 9. CREATIVE & AGENCY
  // ==========================================
  'creative-agency': {
    name: 'Creative & Agency',
    keywords: ['agency', 'design', 'marketing', 'creative', 'branding', 'photography', 'video', 'studio'],
    description: 'Design Agencies, Marketing Firms, Creative Studios',

    style: {
      typography: 'modern',
      colorMood: 'bold',
      imageStyle: 'portfolio work, creative process, team culture, workspaces, project highlights',
      spacing: 'generous',
      corners: 'subtle',
    },

    palettes: [
      { name: 'Bold Agency', primary: '#000000', secondary: '#1a1a1a', accent: '#ff3366', text: '#1a1a1a' },
      { name: 'Creative Pop', primary: '#5b21b6', secondary: '#7c3aed', accent: '#fbbf24', text: '#1a1a2e' },
      { name: 'Minimal Studio', primary: '#374151', secondary: '#6b7280', accent: '#06b6d4', text: '#1a1a2e' },
    ],

    ctaTypes: ['Start a Project', 'Get in Touch', 'View Our Work', 'Request Quote'],

    trustSignals: ['client-logos', 'awards', 'case-studies', 'press', 'team-expertise'],

    layouts: {
      'portfolio-first': {
        name: 'Portfolio First',
        description: 'Work speaks for itself. Portfolio takes center stage.',
        thumbnail: 'portfolio-first',
        sectionOrder: [
          { section: 'hero', template: 'hero-minimal', required: true },
          { section: 'gallery', template: 'gallery-masonry', required: true, label: 'Selected Work' },
          { section: 'trust', template: 'trust-logos', required: true },
          { section: 'services', template: 'services-grid', required: true },
          { section: 'about', template: 'about-team', required: true },
          { section: 'cta', template: 'cta-simple', required: true },
        ],
        emphasis: ['portfolio', 'craft', 'creativity'],
      },
      'process-driven': {
        name: 'Process Driven',
        description: 'Show your process and methodology.',
        thumbnail: 'process-driven',
        sectionOrder: [
          { section: 'hero', template: 'hero-centered', required: true },
          { section: 'services', template: 'services-tabs', required: true },
          { section: 'about', template: 'about-timeline', required: true, label: 'Our Process' },
          { section: 'gallery', template: 'gallery-featured', required: true },
          { section: 'testimonials', template: 'testimonials-featured', required: true },
          { section: 'trust', template: 'trust-press', required: false },
          { section: 'cta', template: 'cta-with-form', required: true },
        ],
        emphasis: ['process', 'methodology', 'results'],
      },
      'brand-bold': {
        name: 'Brand Bold',
        description: 'Make a statement. Bold, memorable design.',
        thumbnail: 'brand-bold',
        sectionOrder: [
          { section: 'hero', template: 'hero-with-video', required: true },
          { section: 'stats', template: 'stats-large', required: true },
          { section: 'gallery', template: 'gallery-grid', required: true },
          { section: 'services', template: 'services-bento', required: true },
          { section: 'testimonials', template: 'testimonials-quotes', required: true },
          { section: 'cta', template: 'cta-split', required: true },
        ],
        emphasis: ['brand', 'boldness', 'impact'],
      }
    }
  },

  // ==========================================
  // 10. AUTOMOTIVE
  // ==========================================
  'automotive': {
    name: 'Automotive',
    keywords: ['auto', 'car', 'automotive', 'dealership', 'mechanic', 'repair', 'detailing', 'body shop'],
    description: 'Car Dealerships, Auto Repair, Detailing, Body Shops',

    style: {
      typography: 'modern',
      colorMood: 'bold',
      imageStyle: 'vehicle shots, service bays, technicians at work, before/after, showrooms',
      spacing: 'normal',
      corners: 'subtle',
    },

    palettes: [
      { name: 'Dealership Blue', primary: '#1e3a8a', secondary: '#3b82f6', accent: '#ef4444', text: '#1a1a2e' },
      { name: 'Speed Red', primary: '#dc2626', secondary: '#ef4444', accent: '#1a1a1a', text: '#1a1a2e' },
      { name: 'Pro Service', primary: '#1f2937', secondary: '#374151', accent: '#f59e0b', text: '#1a1a2e' },
    ],

    ctaTypes: ['Get Quote', 'Schedule Service', 'Browse Inventory', 'Call Now'],

    trustSignals: ['certifications', 'warranty', 'reviews', 'years-experience', 'brands-serviced'],

    layouts: {
      'service-focused': {
        name: 'Service Focused',
        description: 'For repair shops and service centers.',
        thumbnail: 'service-focused',
        sectionOrder: [
          { section: 'hero', template: 'hero-split', required: true },
          { section: 'services', template: 'services-grid', required: true },
          { section: 'trust', template: 'trust-badges', required: true },
          { section: 'stats', template: 'stats-animated', required: true },
          { section: 'testimonials', template: 'testimonials-carousel', required: true },
          { section: 'gallery', template: 'gallery-grid', required: false },
          { section: 'cta', template: 'cta-with-form', required: true },
        ],
        emphasis: ['trust', 'expertise', 'convenience'],
      },
      'inventory-showcase': {
        name: 'Inventory Showcase',
        description: 'For dealerships with vehicle inventory.',
        thumbnail: 'inventory-showcase',
        sectionOrder: [
          { section: 'hero', template: 'hero-with-form', required: true },
          { section: 'gallery', template: 'gallery-featured', required: true, label: 'Featured Vehicles' },
          { section: 'services', template: 'services-tabs', required: true, label: 'Shop By Type' },
          { section: 'trust', template: 'trust-logos', required: true },
          { section: 'testimonials', template: 'testimonials-grid', required: true },
          { section: 'about', template: 'about-split', required: false },
          { section: 'contact', template: 'contact-with-map', required: true },
        ],
        emphasis: ['inventory', 'browsing', 'deals'],
      },
      'premium-detail': {
        name: 'Premium Detail',
        description: 'For detailing and customization shops.',
        thumbnail: 'premium-detail',
        sectionOrder: [
          { section: 'hero', template: 'hero-image-first', required: true },
          { section: 'gallery', template: 'gallery-masonry', required: true, label: 'Our Work' },
          { section: 'services', template: 'services-cards-hover', required: true, label: 'Packages' },
          { section: 'pricing', template: 'pricing-cards', required: true },
          { section: 'testimonials', template: 'testimonials-featured', required: true },
          { section: 'cta', template: 'cta-simple', required: true },
        ],
        emphasis: ['quality', 'results', 'premium'],
      }
    }
  }
};


// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get layout options for an industry
 */
export function getLayoutsForIndustry(industryKey) {
  const industry = INDUSTRY_LAYOUTS[industryKey];
  if (!industry) return null;

  return Object.entries(industry.layouts).map(([key, layout]) => ({
    key,
    ...layout,
    industryKey,
    industryName: industry.name
  }));
}

/**
 * Get full layout configuration
 */
export function getLayoutConfig(industryKey, layoutKey) {
  const industry = INDUSTRY_LAYOUTS[industryKey];
  if (!industry) return null;

  const layout = industry.layouts[layoutKey];
  if (!layout) return null;

  return {
    industry: {
      key: industryKey,
      name: industry.name,
      style: industry.style,
      palettes: industry.palettes,
      ctaTypes: industry.ctaTypes,
      trustSignals: industry.trustSignals
    },
    layout: {
      key: layoutKey,
      ...layout
    },
    sections: layout.sectionOrder.map(section => ({
      ...section,
      templateConfig: SECTION_TEMPLATES[section.section]?.[section.template] || null
    }))
  };
}

/**
 * Detect industry from keywords in description
 */
export function detectIndustry(description) {
  const lowerDesc = description.toLowerCase();

  for (const [key, industry] of Object.entries(INDUSTRY_LAYOUTS)) {
    for (const keyword of industry.keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        return {
          key,
          name: industry.name,
          confidence: 'high',
          matchedKeyword: keyword
        };
      }
    }
  }

  // Default to professional services
  return {
    key: 'professional-services',
    name: 'Professional Services',
    confidence: 'default',
    matchedKeyword: null
  };
}

/**
 * Get all industries as array for UI
 */
export function getAllIndustries() {
  return Object.entries(INDUSTRY_LAYOUTS).map(([key, industry]) => ({
    key,
    name: industry.name,
    description: industry.description,
    layoutCount: Object.keys(industry.layouts).length
  }));
}

/**
 * Build AI prompt context from layout config
 */
export function buildLayoutPromptContext(layoutConfig) {
  if (!layoutConfig) return '';

  const { industry, layout, sections } = layoutConfig;

  let context = `
═══════════════════════════════════════════════════════════════
INDUSTRY-SPECIFIC LAYOUT: ${industry.name} - ${layout.name}
═══════════════════════════════════════════════════════════════

LAYOUT DESCRIPTION: ${layout.description}

DESIGN STYLE:
- Typography: ${industry.style.typography}
- Color Mood: ${industry.style.colorMood}
- Spacing: ${industry.style.spacing}
- Corners: ${industry.style.corners}

IMAGE GUIDANCE: ${industry.style.imageStyle}

RECOMMENDED CTA: ${industry.ctaTypes[0]}

TRUST SIGNALS TO INCLUDE: ${industry.trustSignals.join(', ')}

SECTION ORDER (follow this EXACTLY):
`;

  sections.forEach((section, index) => {
    const templateInfo = section.templateConfig;
    context += `
${index + 1}. ${section.section.toUpperCase()} - Template: ${section.template}
   ${section.required ? '(REQUIRED)' : '(OPTIONAL)'}
   ${section.label ? `Label: "${section.label}"` : ''}
   ${templateInfo ? `Style: ${templateInfo.description}` : ''}
`;
  });

  context += `
EMPHASIS POINTS: ${layout.emphasis.join(', ')}

IMPORTANT: Follow this section order and use the specified template styles.
Create a cohesive design that feels right for ${industry.name}.
`;

  return context;
}


// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  SECTION_TEMPLATES,
  INDUSTRY_LAYOUTS,
  getLayoutsForIndustry,
  getLayoutConfig,
  detectIndustry,
  getAllIndustries,
  buildLayoutPromptContext
};
