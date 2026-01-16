/**
 * Industry Configuration
 * Page recommendations and labels by industry
 */

export const INDUSTRY_PAGES = {
  'food-beverage': {
    recommended: ['home', 'menu', 'about', 'gallery', 'contact'],
    optional: ['blog', 'catering', 'order-online', 'reservations', 'events']
  },
  'bakery': {
    recommended: ['home', 'menu', 'about', 'gallery', 'contact'],
    optional: ['blog', 'catering', 'order-online', 'wholesale']
  },
  'restaurant': {
    recommended: ['home', 'menu', 'about', 'gallery', 'contact'],
    optional: ['reservations', 'catering', 'private-events', 'gift-cards']
  },
  'cafe': {
    recommended: ['home', 'menu', 'about', 'gallery', 'contact'],
    optional: ['blog', 'events', 'loyalty', 'wholesale']
  },
  'professional-services': {
    recommended: ['home', 'services', 'about', 'team', 'contact'],
    optional: ['blog', 'case-studies', 'testimonials', 'faq', 'careers']
  },
  'healthcare': {
    recommended: ['home', 'services', 'about', 'team', 'contact'],
    optional: ['patient-portal', 'insurance', 'faq', 'testimonials', 'blog']
  },
  'fitness': {
    recommended: ['home', 'classes', 'about', 'trainers', 'contact'],
    optional: ['schedule', 'membership', 'blog', 'gallery', 'testimonials']
  },
  'technology': {
    recommended: ['home', 'features', 'pricing', 'about', 'contact'],
    optional: ['blog', 'docs', 'case-studies', 'integrations', 'careers']
  },
  'creative': {
    recommended: ['home', 'portfolio', 'about', 'services', 'contact'],
    optional: ['blog', 'testimonials', 'pricing', 'faq']
  },
  'retail': {
    recommended: ['home', 'products', 'about', 'contact'],
    optional: ['blog', 'faq', 'shipping', 'returns', 'wholesale']
  },
  'trade-services': {
    recommended: ['home', 'services', 'about', 'gallery', 'contact'],
    optional: ['testimonials', 'service-areas', 'faq', 'blog', 'careers']
  },
  'default': {
    recommended: ['home', 'about', 'services', 'contact'],
    optional: ['blog', 'gallery', 'testimonials', 'faq', 'team']
  }
};

export const PAGE_LABELS = {
  'home': 'Home',
  'about': 'About',
  'services': 'Services',
  'contact': 'Contact',
  'menu': 'Menu',
  'gallery': 'Gallery',
  'blog': 'Blog',
  'team': 'Team',
  'testimonials': 'Testimonials',
  'faq': 'FAQ',
  'pricing': 'Pricing',
  'features': 'Features',
  'portfolio': 'Portfolio',
  'products': 'Products',
  'catering': 'Catering',
  'order-online': 'Order Online',
  'reservations': 'Reservations',
  'events': 'Events',
  'private-events': 'Private Events',
  'gift-cards': 'Gift Cards',
  'wholesale': 'Wholesale',
  'loyalty': 'Loyalty Program',
  'classes': 'Classes',
  'trainers': 'Trainers',
  'schedule': 'Schedule',
  'membership': 'Membership',
  'docs': 'Documentation',
  'case-studies': 'Case Studies',
  'integrations': 'Integrations',
  'careers': 'Careers',
  'patient-portal': 'Patient Portal',
  'insurance': 'Insurance',
  'shipping': 'Shipping',
  'returns': 'Returns',
  'service-areas': 'Service Areas'
};
