/**
 * BLINK Industry Layout System (CJS version for server)
 *
 * This is a CommonJS export of the industry layouts for use in server.cjs
 */

// ============================================
// INDUSTRY DEFINITIONS
// ============================================

const INDUSTRY_LAYOUTS = {
  'professional-services': {
    name: 'Professional Services',
    keywords: ['consulting', 'legal', 'accounting', 'franchise', 'advisor', 'coach', 'strategy'],
    style: {
      typography: 'traditional',
      colorMood: 'sophisticated',
      imageStyle: 'professional headshots, office environments, handshakes, meetings, cityscapes',
      spacing: 'generous',
      corners: 'subtle',
    },
    ctaTypes: ['Schedule Consultation', 'Get Free Quote', 'Book a Call', 'Request Proposal'],
    trustSignals: ['certifications', 'years-in-business', 'clients-served', 'case-studies', 'awards'],
    layouts: {
      'trust-builder': {
        name: 'Trust Builder',
        description: 'Testimonials prominent, credentials front-and-center',
        sectionOrder: ['hero-split', 'trust-logos', 'stats-animated', 'services-grid', 'testimonials-featured', 'about-split', 'faq-accordion', 'cta-simple'],
        emphasis: ['credibility', 'experience', 'results'],
      },
      'lead-generator': {
        name: 'Lead Generator',
        description: 'Form in hero, multiple CTAs throughout',
        sectionOrder: ['hero-with-form', 'trust-badges', 'services-cards', 'stats-bar', 'testimonials-grid', 'cta-with-form', 'faq-accordion'],
        emphasis: ['conversion', 'urgency', 'value-proposition'],
      },
      'corporate-clean': {
        name: 'Corporate Clean',
        description: 'Minimal design, lots of whitespace',
        sectionOrder: ['hero-minimal', 'about-values', 'services-list', 'stats-large', 'testimonials-quotes', 'cta-simple'],
        emphasis: ['elegance', 'simplicity', 'authority'],
      }
    }
  },

  'restaurants-food': {
    name: 'Restaurants & Food',
    keywords: ['restaurant', 'cafe', 'bistro', 'bar', 'food', 'dining', 'catering', 'bakery', 'coffee'],
    style: {
      typography: 'mixed',
      colorMood: 'warm',
      imageStyle: 'appetizing food photography, interior ambiance, chef at work, ingredients, plated dishes',
      spacing: 'normal',
      corners: 'rounded',
    },
    ctaTypes: ['View Menu', 'Make Reservation', 'Order Online', 'Book a Table'],
    trustSignals: ['reviews', 'awards', 'press-mentions', 'chef-credentials', 'local-sourcing'],
    layouts: {
      'appetizing-visual': {
        name: 'Appetizing Visual',
        description: 'Food photography takes center stage',
        sectionOrder: ['hero-image-first', 'gallery-masonry', 'about-split', 'services-grid', 'testimonials-carousel', 'contact-with-map'],
        emphasis: ['visual-appeal', 'ambiance', 'experience'],
      },
      'menu-focused': {
        name: 'Menu Focused',
        description: 'Menu prominently displayed',
        sectionOrder: ['hero-centered', 'services-tabs', 'gallery-grid', 'about-team', 'testimonials-grid', 'cta-split'],
        emphasis: ['menu', 'ordering', 'convenience'],
      },
      'story-driven': {
        name: 'Story Driven',
        description: 'Tell your restaurant story',
        sectionOrder: ['hero-with-video', 'about-timeline', 'gallery-featured', 'services-list', 'testimonials-featured', 'contact-split'],
        emphasis: ['story', 'authenticity', 'passion'],
      }
    }
  },

  'healthcare-medical': {
    name: 'Healthcare & Medical',
    keywords: ['medical', 'healthcare', 'dental', 'clinic', 'doctor', 'therapy', 'wellness', 'hospital'],
    style: {
      typography: 'modern',
      colorMood: 'calm',
      imageStyle: 'clean medical environments, caring professionals, happy patients, modern equipment',
      spacing: 'generous',
      corners: 'rounded',
    },
    ctaTypes: ['Book Appointment', 'Schedule Visit', 'Contact Us', 'Request Consultation'],
    trustSignals: ['certifications', 'insurance-accepted', 'patient-reviews', 'years-experience', 'credentials'],
    layouts: {
      'patient-first': {
        name: 'Patient First',
        description: 'Welcoming, accessible design',
        sectionOrder: ['hero-split', 'services-grid', 'trust-badges', 'about-team', 'testimonials-carousel', 'faq-accordion', 'cta-with-form'],
        emphasis: ['trust', 'accessibility', 'care'],
      },
      'credibility-focused': {
        name: 'Credibility Focused',
        description: 'Highlight credentials and expertise',
        sectionOrder: ['hero-centered', 'trust-badges', 'stats-animated', 'services-cards', 'about-split', 'testimonials-featured', 'contact-split'],
        emphasis: ['expertise', 'credentials', 'results'],
      },
      'booking-optimized': {
        name: 'Booking Optimized',
        description: 'Easy appointment scheduling',
        sectionOrder: ['hero-with-form', 'services-list', 'trust-logos', 'about-values', 'faq-grid', 'contact-with-map'],
        emphasis: ['convenience', 'booking', 'accessibility'],
      }
    }
  },

  'retail-ecommerce': {
    name: 'Retail & Ecommerce',
    keywords: ['shop', 'store', 'retail', 'ecommerce', 'boutique', 'products', 'merchandise'],
    style: {
      typography: 'modern',
      colorMood: 'energetic',
      imageStyle: 'product photography, lifestyle shots, unboxing, happy customers',
      spacing: 'normal',
      corners: 'subtle',
    },
    ctaTypes: ['Shop Now', 'Browse Collection', 'Get 20% Off', 'Start Shopping'],
    trustSignals: ['reviews', 'secure-checkout', 'free-shipping', 'money-back', 'customer-count'],
    layouts: {
      'product-showcase': {
        name: 'Product Showcase',
        description: 'Products front and center',
        sectionOrder: ['hero-image-first', 'gallery-grid', 'trust-guarantees', 'services-bento', 'testimonials-grid', 'cta-banner'],
        emphasis: ['visual', 'products', 'discovery'],
      },
      'conversion-focused': {
        name: 'Conversion Focused',
        description: 'Optimized for sales',
        sectionOrder: ['hero-centered', 'stats-bar', 'services-grid', 'trust-guarantees', 'testimonials-carousel', 'cta-simple', 'faq-accordion'],
        emphasis: ['conversion', 'trust', 'value'],
      },
      'brand-story': {
        name: 'Brand Story',
        description: 'Tell your brand story',
        sectionOrder: ['hero-with-video', 'about-values', 'gallery-masonry', 'services-cards', 'testimonials-featured', 'cta-split'],
        emphasis: ['story', 'brand', 'lifestyle'],
      }
    }
  },

  'home-services': {
    name: 'Home Services',
    keywords: ['plumber', 'electrician', 'contractor', 'cleaning', 'repair', 'hvac', 'landscaping', 'roofing', 'handyman'],
    style: {
      typography: 'modern',
      colorMood: 'bold',
      imageStyle: 'before/after shots, work in progress, uniformed workers, tools, completed projects',
      spacing: 'normal',
      corners: 'subtle',
    },
    ctaTypes: ['Get Free Estimate', 'Call Now', 'Schedule Service', 'Request Quote'],
    trustSignals: ['licensed-insured', 'reviews', 'years-experience', 'warranty', 'local-business'],
    layouts: {
      'trust-and-call': {
        name: 'Trust & Call',
        description: 'Build trust fast, make calling easy',
        sectionOrder: ['hero-split', 'trust-badges', 'stats-animated', 'services-grid', 'testimonials-carousel', 'gallery-grid', 'cta-simple'],
        emphasis: ['trust', 'urgency', 'reliability'],
      },
      'quote-generator': {
        name: 'Quote Generator',
        description: 'Easy quote requests',
        sectionOrder: ['hero-with-form', 'services-cards', 'trust-logos', 'gallery-featured', 'testimonials-grid', 'faq-accordion'],
        emphasis: ['leads', 'convenience', 'transparency'],
      },
      'portfolio-showcase': {
        name: 'Portfolio Showcase',
        description: 'Show off your best work',
        sectionOrder: ['hero-centered', 'gallery-masonry', 'services-list', 'stats-cards', 'testimonials-featured', 'cta-with-form'],
        emphasis: ['portfolio', 'quality', 'craftsmanship'],
      }
    }
  },

  'fitness-wellness': {
    name: 'Fitness & Wellness',
    keywords: ['gym', 'fitness', 'yoga', 'pilates', 'personal trainer', 'wellness', 'spa', 'meditation'],
    style: {
      typography: 'modern',
      colorMood: 'energetic',
      imageStyle: 'action shots, fitness equipment, healthy people, studio spaces',
      spacing: 'normal',
      corners: 'rounded',
    },
    ctaTypes: ['Start Free Trial', 'Book a Class', 'Get Started', 'Join Now'],
    trustSignals: ['certified-trainers', 'member-results', 'reviews', 'equipment-quality', 'transformations'],
    layouts: {
      'motivation-driven': {
        name: 'Motivation Driven',
        description: 'Inspiring visuals and testimonials',
        sectionOrder: ['hero-with-video', 'stats-animated', 'services-bento', 'gallery-carousel', 'testimonials-featured', 'pricing-cards', 'cta-simple'],
        emphasis: ['motivation', 'results', 'community'],
      },
      'class-scheduler': {
        name: 'Class Scheduler',
        description: 'Class schedules and booking front and center',
        sectionOrder: ['hero-split', 'services-tabs', 'about-team', 'pricing-cards', 'testimonials-carousel', 'faq-accordion', 'contact-with-map'],
        emphasis: ['schedule', 'booking', 'instructors'],
      },
      'wellness-calm': {
        name: 'Wellness Calm',
        description: 'Peaceful, calming design',
        sectionOrder: ['hero-minimal', 'about-values', 'services-list', 'gallery-masonry', 'testimonials-quotes', 'cta-simple'],
        emphasis: ['calm', 'mindfulness', 'experience'],
      }
    }
  },

  'real-estate': {
    name: 'Real Estate',
    keywords: ['real estate', 'realtor', 'property', 'homes', 'apartments', 'broker', 'agent'],
    style: {
      typography: 'modern',
      colorMood: 'sophisticated',
      imageStyle: 'property exteriors, interior shots, neighborhoods, agent headshots',
      spacing: 'generous',
      corners: 'subtle',
    },
    ctaTypes: ['Search Properties', 'Get Home Valuation', 'Schedule Showing', 'Contact Agent'],
    trustSignals: ['sales-volume', 'reviews', 'years-experience', 'certifications', 'listings-sold'],
    layouts: {
      'property-search': {
        name: 'Property Search',
        description: 'Search and browse properties prominently',
        sectionOrder: ['hero-with-form', 'gallery-featured', 'services-grid', 'stats-animated', 'testimonials-carousel', 'cta-simple'],
        emphasis: ['search', 'listings', 'discovery'],
      },
      'agent-brand': {
        name: 'Agent Brand',
        description: 'Personal branding for agents',
        sectionOrder: ['hero-split', 'about-split', 'stats-cards', 'gallery-grid', 'testimonials-featured', 'services-list', 'cta-with-form'],
        emphasis: ['personal-brand', 'trust', 'expertise'],
      },
      'luxury-focused': {
        name: 'Luxury Focused',
        description: 'High-end, premium feel',
        sectionOrder: ['hero-image-first', 'gallery-masonry', 'about-values', 'testimonials-quotes', 'contact-minimal'],
        emphasis: ['luxury', 'exclusivity', 'quality'],
      }
    }
  },

  'education-coaching': {
    name: 'Education & Coaching',
    keywords: ['tutoring', 'coaching', 'courses', 'training', 'school', 'academy', 'learning', 'mentor'],
    style: {
      typography: 'modern',
      colorMood: 'energetic',
      imageStyle: 'learning environments, success stories, instructor headshots, students engaged',
      spacing: 'normal',
      corners: 'rounded',
    },
    ctaTypes: ['Enroll Now', 'Start Learning', 'Book Session', 'Get Free Lesson'],
    trustSignals: ['student-success', 'credentials', 'reviews', 'years-teaching', 'curriculum'],
    layouts: {
      'course-catalog': {
        name: 'Course Catalog',
        description: 'Browse courses and programs',
        sectionOrder: ['hero-centered', 'services-bento', 'stats-animated', 'about-team', 'testimonials-grid', 'pricing-cards', 'faq-accordion'],
        emphasis: ['courses', 'value', 'outcomes'],
      },
      'coach-personal': {
        name: 'Coach Personal Brand',
        description: 'Personal branding for coaches',
        sectionOrder: ['hero-split', 'about-split', 'stats-cards', 'services-list', 'testimonials-featured', 'cta-with-form'],
        emphasis: ['personal-brand', 'transformation', 'trust'],
      },
      'results-focused': {
        name: 'Results Focused',
        description: 'Highlight student success',
        sectionOrder: ['hero-with-video', 'stats-large', 'testimonials-carousel', 'services-cards', 'about-values', 'pricing-cards', 'cta-simple'],
        emphasis: ['results', 'transformations', 'proof'],
      }
    }
  },

  'creative-agency': {
    name: 'Creative & Agency',
    keywords: ['agency', 'design', 'marketing', 'creative', 'branding', 'photography', 'video', 'studio'],
    style: {
      typography: 'modern',
      colorMood: 'bold',
      imageStyle: 'portfolio work, creative process, team culture, workspaces',
      spacing: 'generous',
      corners: 'subtle',
    },
    ctaTypes: ['Start a Project', 'Get in Touch', 'View Our Work', 'Request Quote'],
    trustSignals: ['client-logos', 'awards', 'case-studies', 'press', 'team-expertise'],
    layouts: {
      'portfolio-first': {
        name: 'Portfolio First',
        description: 'Work speaks for itself',
        sectionOrder: ['hero-minimal', 'gallery-masonry', 'trust-logos', 'services-grid', 'about-team', 'cta-simple'],
        emphasis: ['portfolio', 'craft', 'creativity'],
      },
      'process-driven': {
        name: 'Process Driven',
        description: 'Show your process and methodology',
        sectionOrder: ['hero-centered', 'services-tabs', 'about-timeline', 'gallery-featured', 'testimonials-featured', 'trust-press', 'cta-with-form'],
        emphasis: ['process', 'methodology', 'results'],
      },
      'brand-bold': {
        name: 'Brand Bold',
        description: 'Make a statement',
        sectionOrder: ['hero-with-video', 'stats-large', 'gallery-grid', 'services-bento', 'testimonials-quotes', 'cta-split'],
        emphasis: ['brand', 'boldness', 'impact'],
      }
    }
  },

  'automotive': {
    name: 'Automotive',
    keywords: ['auto', 'car', 'automotive', 'dealership', 'mechanic', 'repair', 'detailing', 'body shop'],
    style: {
      typography: 'modern',
      colorMood: 'bold',
      imageStyle: 'vehicle shots, service bays, technicians at work, before/after',
      spacing: 'normal',
      corners: 'subtle',
    },
    ctaTypes: ['Get Quote', 'Schedule Service', 'Browse Inventory', 'Call Now'],
    trustSignals: ['certifications', 'warranty', 'reviews', 'years-experience', 'brands-serviced'],
    layouts: {
      'service-focused': {
        name: 'Service Focused',
        description: 'For repair shops and service centers',
        sectionOrder: ['hero-split', 'services-grid', 'trust-badges', 'stats-animated', 'testimonials-carousel', 'gallery-grid', 'cta-with-form'],
        emphasis: ['trust', 'expertise', 'convenience'],
      },
      'inventory-showcase': {
        name: 'Inventory Showcase',
        description: 'For dealerships with vehicle inventory',
        sectionOrder: ['hero-with-form', 'gallery-featured', 'services-tabs', 'trust-logos', 'testimonials-grid', 'about-split', 'contact-with-map'],
        emphasis: ['inventory', 'browsing', 'deals'],
      },
      'premium-detail': {
        name: 'Premium Detail',
        description: 'For detailing and customization',
        sectionOrder: ['hero-image-first', 'gallery-masonry', 'services-cards', 'pricing-cards', 'testimonials-featured', 'cta-simple'],
        emphasis: ['quality', 'results', 'premium'],
      }
    }
  }
};


/**
 * Build layout context for AI prompts
 */
function buildLayoutContext(industryKey, layoutKey) {
  const industry = INDUSTRY_LAYOUTS[industryKey];
  if (!industry) return '';

  const layout = layoutKey ? industry.layouts[layoutKey] : null;
  if (!layout) return '';

  return `
═══════════════════════════════════════════════════════════════
LAYOUT STRUCTURE: ${industry.name} - ${layout.name}
═══════════════════════════════════════════════════════════════

LAYOUT DESCRIPTION: ${layout.description}

DESIGN STYLE:
- Typography Style: ${industry.style.typography}
- Color Mood: ${industry.style.colorMood}
- Spacing: ${industry.style.spacing}
- Corner Style: ${industry.style.corners}

IMAGE GUIDANCE: ${industry.style.imageStyle}

RECOMMENDED CTA: ${industry.ctaTypes[0]}

TRUST SIGNALS TO INCLUDE: ${industry.trustSignals.join(', ')}

SECTION ORDER (follow this structure for HOME page):
${layout.sectionOrder.map((section, idx) => `${idx + 1}. ${section.replace(/-/g, ' ').toUpperCase()}`).join('\n')}

EMPHASIS POINTS: ${layout.emphasis.join(', ')}

IMPORTANT: This layout was specifically chosen for ${industry.name} businesses.
Follow the section order and emphasis points to create a cohesive design.
═══════════════════════════════════════════════════════════════
`;
}

/**
 * Get layout config for an industry
 */
function getLayoutConfig(industryKey, layoutKey) {
  const industry = INDUSTRY_LAYOUTS[industryKey];
  if (!industry) return null;

  const layout = layoutKey ? industry.layouts[layoutKey] : Object.values(industry.layouts)[0];

  return {
    industry,
    layout,
    context: buildLayoutContext(industryKey, layoutKey)
  };
}


module.exports = {
  INDUSTRY_LAYOUTS,
  buildLayoutContext,
  getLayoutConfig
};
