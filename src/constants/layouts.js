/**
 * Layout Options Configuration
 * Industry-specific layout options for the site builder
 */

export const LAYOUT_OPTIONS = {
  // Restaurant / Food industry layouts
  restaurant: [
    {
      id: 'menu-hero',
      name: 'Menu Hero',
      description: 'Large hero image with menu focus',
      preview: { heroStyle: 'full', menuPosition: 'center', ctaStyle: 'overlay' }
    },
    {
      id: 'gallery-first',
      name: 'Gallery First',
      description: 'Photo gallery showcases your dishes',
      preview: { heroStyle: 'split', menuPosition: 'side', ctaStyle: 'button' }
    },
    {
      id: 'reservation-focus',
      name: 'Reservation Focus',
      description: 'Booking widget front and center',
      preview: { heroStyle: 'minimal', menuPosition: 'below', ctaStyle: 'prominent' }
    }
  ],
  cafe: [
    {
      id: 'cozy-vibe',
      name: 'Cozy Vibe',
      description: 'Warm, inviting atmosphere feel',
      preview: { heroStyle: 'full', menuPosition: 'center', ctaStyle: 'overlay' }
    },
    {
      id: 'menu-board',
      name: 'Menu Board',
      description: 'Classic coffee shop menu style',
      preview: { heroStyle: 'split', menuPosition: 'side', ctaStyle: 'button' }
    },
    {
      id: 'location-centric',
      name: 'Location Centric',
      description: 'Map and hours prominently displayed',
      preview: { heroStyle: 'minimal', menuPosition: 'below', ctaStyle: 'prominent' }
    }
  ],
  // Professional services layouts
  'law-firm': [
    {
      id: 'trust-authority',
      name: 'Trust & Authority',
      description: 'Professional credibility focus',
      preview: { heroStyle: 'corporate', contentStyle: 'formal', ctaStyle: 'subtle' }
    },
    {
      id: 'case-results',
      name: 'Case Results',
      description: 'Showcase wins and testimonials',
      preview: { heroStyle: 'split', contentStyle: 'results', ctaStyle: 'consultation' }
    },
    {
      id: 'practice-areas',
      name: 'Practice Areas',
      description: 'Services organized by specialty',
      preview: { heroStyle: 'minimal', contentStyle: 'services', ctaStyle: 'prominent' }
    }
  ],
  dental: [
    {
      id: 'patient-comfort',
      name: 'Patient Comfort',
      description: 'Friendly, welcoming atmosphere',
      preview: { heroStyle: 'warm', contentStyle: 'caring', ctaStyle: 'booking' }
    },
    {
      id: 'services-grid',
      name: 'Services Grid',
      description: 'All treatments clearly displayed',
      preview: { heroStyle: 'clean', contentStyle: 'services', ctaStyle: 'prominent' }
    },
    {
      id: 'team-focused',
      name: 'Team Focused',
      description: 'Meet your dental professionals',
      preview: { heroStyle: 'team', contentStyle: 'personal', ctaStyle: 'consultation' }
    }
  ],
  healthcare: [
    {
      id: 'patient-first',
      name: 'Patient First',
      description: 'Compassionate care messaging',
      preview: { heroStyle: 'warm', contentStyle: 'caring', ctaStyle: 'booking' }
    },
    {
      id: 'services-focus',
      name: 'Services Focus',
      description: 'Medical services highlighted',
      preview: { heroStyle: 'clean', contentStyle: 'services', ctaStyle: 'prominent' }
    },
    {
      id: 'credentials',
      name: 'Credentials',
      description: 'Expertise and qualifications',
      preview: { heroStyle: 'professional', contentStyle: 'trust', ctaStyle: 'consultation' }
    }
  ],
  // Fitness & Wellness layouts
  fitness: [
    {
      id: 'energy-pump',
      name: 'Energy Pump',
      description: 'Bold, motivational design',
      preview: { heroStyle: 'dynamic', contentStyle: 'energetic', ctaStyle: 'action' }
    },
    {
      id: 'class-schedule',
      name: 'Class Schedule',
      description: 'Schedule front and center',
      preview: { heroStyle: 'clean', contentStyle: 'schedule', ctaStyle: 'booking' }
    },
    {
      id: 'transformation',
      name: 'Transformation',
      description: 'Before/after results focus',
      preview: { heroStyle: 'results', contentStyle: 'testimonials', ctaStyle: 'trial' }
    }
  ],
  yoga: [
    {
      id: 'zen-minimal',
      name: 'Zen Minimal',
      description: 'Clean, peaceful aesthetic',
      preview: { heroStyle: 'calm', contentStyle: 'minimal', ctaStyle: 'gentle' }
    },
    {
      id: 'class-calendar',
      name: 'Class Calendar',
      description: 'Easy class booking',
      preview: { heroStyle: 'serene', contentStyle: 'schedule', ctaStyle: 'booking' }
    },
    {
      id: 'instructor-led',
      name: 'Instructor Led',
      description: 'Personal connection focus',
      preview: { heroStyle: 'personal', contentStyle: 'team', ctaStyle: 'consultation' }
    }
  ],
  'spa-salon': [
    {
      id: 'luxury-feel',
      name: 'Luxury Feel',
      description: 'Premium spa experience',
      preview: { heroStyle: 'elegant', contentStyle: 'luxury', ctaStyle: 'booking' }
    },
    {
      id: 'service-menu',
      name: 'Service Menu',
      description: 'Treatments with pricing',
      preview: { heroStyle: 'clean', contentStyle: 'menu', ctaStyle: 'prominent' }
    },
    {
      id: 'gallery-showcase',
      name: 'Gallery Showcase',
      description: 'Visual portfolio of work',
      preview: { heroStyle: 'gallery', contentStyle: 'portfolio', ctaStyle: 'booking' }
    }
  ],
  // Real Estate layouts
  'real-estate': [
    {
      id: 'property-search',
      name: 'Property Search',
      description: 'Search-focused homepage',
      preview: { heroStyle: 'search', contentStyle: 'listings', ctaStyle: 'search' }
    },
    {
      id: 'agent-brand',
      name: 'Agent Brand',
      description: 'Personal agent branding',
      preview: { heroStyle: 'personal', contentStyle: 'trust', ctaStyle: 'contact' }
    },
    {
      id: 'featured-listings',
      name: 'Featured Listings',
      description: 'Showcase top properties',
      preview: { heroStyle: 'gallery', contentStyle: 'featured', ctaStyle: 'browse' }
    }
  ],
  // Construction / Trade layouts
  construction: [
    {
      id: 'project-showcase',
      name: 'Project Showcase',
      description: 'Portfolio of completed work',
      preview: { heroStyle: 'portfolio', contentStyle: 'projects', ctaStyle: 'quote' }
    },
    {
      id: 'services-list',
      name: 'Services List',
      description: 'Clear service offerings',
      preview: { heroStyle: 'professional', contentStyle: 'services', ctaStyle: 'estimate' }
    },
    {
      id: 'trust-builder',
      name: 'Trust Builder',
      description: 'Certifications and reviews',
      preview: { heroStyle: 'credibility', contentStyle: 'trust', ctaStyle: 'contact' }
    }
  ],
  // SaaS / Tech layouts
  saas: [
    {
      id: 'product-hero',
      name: 'Product Hero',
      description: 'Product screenshot focus',
      preview: { heroStyle: 'product', contentStyle: 'features', ctaStyle: 'signup' }
    },
    {
      id: 'feature-grid',
      name: 'Feature Grid',
      description: 'Benefits and features',
      preview: { heroStyle: 'clean', contentStyle: 'benefits', ctaStyle: 'trial' }
    },
    {
      id: 'social-proof',
      name: 'Social Proof',
      description: 'Logos and testimonials',
      preview: { heroStyle: 'minimal', contentStyle: 'trust', ctaStyle: 'demo' }
    }
  ],
  // Default layouts for any industry
  default: [
    {
      id: 'classic-hero',
      name: 'Classic Hero',
      description: 'Traditional hero with CTA',
      preview: { heroStyle: 'standard', contentStyle: 'balanced', ctaStyle: 'prominent' }
    },
    {
      id: 'services-first',
      name: 'Services First',
      description: 'Lead with what you offer',
      preview: { heroStyle: 'minimal', contentStyle: 'services', ctaStyle: 'contact' }
    },
    {
      id: 'story-driven',
      name: 'Story Driven',
      description: 'About us prominence',
      preview: { heroStyle: 'narrative', contentStyle: 'story', ctaStyle: 'learn' }
    }
  ]
};

/**
 * Get layouts for a specific industry or default
 */
export const getLayoutsForIndustry = (industryKey) => {
  return LAYOUT_OPTIONS[industryKey] || LAYOUT_OPTIONS.default;
};
