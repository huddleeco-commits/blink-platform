/**
 * Full Control Mode Constants
 * Layouts, sections, and styles for page-by-page customization
 */

// Layout options with visual thumbnails
export const PAGE_LAYOUTS = {
  home: [
    { id: 'hero-stack', name: 'Hero Stack', description: 'Large hero with stacked sections below', icon: '📱' },
    { id: 'split-screen', name: 'Split Screen', description: 'Two-column hero with image/text', icon: '📐' },
    { id: 'card-grid', name: 'Card Grid', description: 'Grid of feature cards', icon: '🃏' },
    { id: 'video-bg', name: 'Video Background', description: 'Full-width video hero', icon: '🎬' },
    { id: 'minimal', name: 'Minimal', description: 'Clean, spacious layout', icon: '✨' },
    { id: 'magazine', name: 'Magazine', description: 'Editorial style with mixed content', icon: '📰' }
  ],
  about: [
    { id: 'story-timeline', name: 'Story Timeline', description: 'Company history in timeline format', icon: '📅' },
    { id: 'team-focus', name: 'Team Focus', description: 'Emphasis on team members', icon: '👥' },
    { id: 'mission-driven', name: 'Mission Driven', description: 'Values and mission prominent', icon: '🎯' },
    { id: 'image-heavy', name: 'Image Heavy', description: 'Large photos with text overlay', icon: '🖼️' },
    { id: 'simple', name: 'Simple', description: 'Clean text-focused layout', icon: '📝' }
  ],
  services: [
    { id: 'card-grid', name: 'Card Grid', description: 'Services in a card grid', icon: '🃏' },
    { id: 'list-detail', name: 'List + Detail', description: 'List view with expandable details', icon: '📋' },
    { id: 'icons-grid', name: 'Icons Grid', description: 'Icon-based service display', icon: '🔲' },
    { id: 'comparison', name: 'Comparison', description: 'Side-by-side service tiers', icon: '⚖️' },
    { id: 'accordion', name: 'Accordion', description: 'Expandable sections', icon: '📂' }
  ],
  menu: [
    { id: 'category-tabs', name: 'Category Tabs', description: 'Tabbed menu categories', icon: '📑' },
    { id: 'card-grid', name: 'Card Grid', description: 'Menu items as cards with images', icon: '🃏' },
    { id: 'list-view', name: 'List View', description: 'Traditional menu list', icon: '📋' },
    { id: 'visual-grid', name: 'Visual Grid', description: 'Image-focused grid layout', icon: '🖼️' },
    { id: 'split-category', name: 'Split Category', description: 'Left nav, right items', icon: '📐' }
  ],
  contact: [
    { id: 'form-map', name: 'Form + Map', description: 'Contact form with embedded map', icon: '🗺️' },
    { id: 'split-info', name: 'Split Info', description: 'Contact details and form side-by-side', icon: '📐' },
    { id: 'minimal-form', name: 'Minimal Form', description: 'Simple contact form only', icon: '✨' },
    { id: 'cards-info', name: 'Info Cards', description: 'Contact info in card format', icon: '🃏' }
  ],
  gallery: [
    { id: 'masonry', name: 'Masonry', description: 'Pinterest-style layout', icon: '🧱' },
    { id: 'grid', name: 'Grid', description: 'Uniform grid layout', icon: '🔲' },
    { id: 'carousel', name: 'Carousel', description: 'Sliding image carousel', icon: '🎠' },
    { id: 'lightbox', name: 'Lightbox', description: 'Click to expand images', icon: '💡' }
  ],
  portfolio: [
    { id: 'case-studies', name: 'Case Studies', description: 'Detailed project breakdowns', icon: '📊' },
    { id: 'grid-filter', name: 'Grid + Filter', description: 'Filterable project grid', icon: '🔍' },
    { id: 'showcase', name: 'Showcase', description: 'Large featured projects', icon: '🏆' },
    { id: 'minimal-grid', name: 'Minimal Grid', description: 'Clean, simple grid', icon: '✨' }
  ],
  blog: [
    { id: 'card-grid', name: 'Card Grid', description: 'Blog posts as cards', icon: '🃏' },
    { id: 'list-view', name: 'List View', description: 'Traditional blog list', icon: '📋' },
    { id: 'featured-hero', name: 'Featured Hero', description: 'Hero post with list below', icon: '⭐' },
    { id: 'magazine', name: 'Magazine', description: 'Editorial style layout', icon: '📰' }
  ],
  team: [
    { id: 'grid-cards', name: 'Grid Cards', description: 'Team member cards', icon: '🃏' },
    { id: 'list-bios', name: 'List + Bios', description: 'List with detailed bios', icon: '📋' },
    { id: 'leadership', name: 'Leadership Focus', description: 'Hierarchy-based layout', icon: '👔' },
    { id: 'casual', name: 'Casual', description: 'Fun, informal team display', icon: '🎉' }
  ],
  pricing: [
    { id: 'comparison-table', name: 'Comparison Table', description: 'Feature comparison table', icon: '📊' },
    { id: 'tier-cards', name: 'Tier Cards', description: 'Pricing tier cards', icon: '🃏' },
    { id: 'simple-list', name: 'Simple List', description: 'Basic pricing list', icon: '📋' },
    { id: 'calculator', name: 'Calculator', description: 'Interactive pricing calculator', icon: '🧮' }
  ],
  default: [
    { id: 'standard', name: 'Standard', description: 'Clean, versatile layout', icon: '📄' },
    { id: 'hero-content', name: 'Hero + Content', description: 'Hero section with content below', icon: '📱' },
    { id: 'sidebar', name: 'Sidebar', description: 'Content with sidebar navigation', icon: '📐' },
    { id: 'minimal', name: 'Minimal', description: 'Simple, focused layout', icon: '✨' }
  ]
};

// Sections available for each page type
export const PAGE_SECTIONS = {
  home: [
    { id: 'hero', name: 'Hero Section', description: 'Main banner with headline and CTA', default: true },
    { id: 'features', name: 'Features/Benefits', description: 'Key features or benefits list', default: true },
    { id: 'services-preview', name: 'Services Preview', description: 'Brief services overview', default: false },
    { id: 'testimonials', name: 'Testimonials', description: 'Customer reviews and quotes', default: true },
    { id: 'team-preview', name: 'Team Preview', description: 'Quick team introduction', default: false },
    { id: 'gallery-preview', name: 'Gallery Preview', description: 'Photo showcase', default: false },
    { id: 'stats', name: 'Statistics', description: 'Key numbers and achievements', default: false },
    { id: 'cta', name: 'Call to Action', description: 'Final conversion section', default: true },
    { id: 'newsletter', name: 'Newsletter Signup', description: 'Email subscription form', default: false },
    { id: 'partners', name: 'Partners/Clients', description: 'Logo showcase', default: false },
    { id: 'faq-preview', name: 'FAQ Preview', description: 'Common questions', default: false },
    { id: 'location', name: 'Location/Map', description: 'Address and map', default: false }
  ],
  about: [
    { id: 'story', name: 'Our Story', description: 'Company history and background', default: true },
    { id: 'mission', name: 'Mission & Values', description: 'Core mission and values', default: true },
    { id: 'team', name: 'Team Section', description: 'Team member profiles', default: true },
    { id: 'timeline', name: 'Timeline', description: 'Company milestones', default: false },
    { id: 'awards', name: 'Awards & Recognition', description: 'Achievements showcase', default: false },
    { id: 'cta', name: 'Call to Action', description: 'Contact prompt', default: true }
  ],
  services: [
    { id: 'intro', name: 'Services Intro', description: 'Overview of what you offer', default: true },
    { id: 'services-list', name: 'Services List', description: 'Detailed service descriptions', default: true },
    { id: 'process', name: 'Our Process', description: 'How you work', default: false },
    { id: 'pricing-preview', name: 'Pricing Preview', description: 'Starting prices', default: false },
    { id: 'testimonials', name: 'Testimonials', description: 'Service-specific reviews', default: false },
    { id: 'cta', name: 'Call to Action', description: 'Get started prompt', default: true }
  ],
  menu: [
    { id: 'categories', name: 'Menu Categories', description: 'Category navigation', default: true },
    { id: 'items', name: 'Menu Items', description: 'Food/drink items with prices', default: true },
    { id: 'specials', name: 'Daily Specials', description: 'Featured items', default: false },
    { id: 'dietary', name: 'Dietary Info', description: 'Allergen and dietary labels', default: false },
    { id: 'order-cta', name: 'Order CTA', description: 'Order online prompt', default: false }
  ],
  contact: [
    { id: 'form', name: 'Contact Form', description: 'Message submission form', default: true },
    { id: 'info', name: 'Contact Info', description: 'Phone, email, address', default: true },
    { id: 'map', name: 'Map', description: 'Location map embed', default: true },
    { id: 'hours', name: 'Business Hours', description: 'Operating hours', default: true },
    { id: 'social', name: 'Social Links', description: 'Social media links', default: false },
    { id: 'faq', name: 'Quick FAQ', description: 'Common questions', default: false }
  ],
  gallery: [
    { id: 'gallery-grid', name: 'Photo Gallery', description: 'Image grid display', default: true },
    { id: 'categories', name: 'Gallery Categories', description: 'Filter by category', default: false },
    { id: 'captions', name: 'Image Captions', description: 'Descriptions for images', default: false }
  ],
  portfolio: [
    { id: 'projects-grid', name: 'Projects Grid', description: 'Portfolio items display', default: true },
    { id: 'filters', name: 'Category Filters', description: 'Filter by project type', default: false },
    { id: 'case-study', name: 'Featured Case Study', description: 'Detailed project breakdown', default: false },
    { id: 'cta', name: 'Work With Us', description: 'Contact prompt', default: true }
  ],
  blog: [
    { id: 'posts-grid', name: 'Blog Posts', description: 'Article listings', default: true },
    { id: 'categories', name: 'Categories', description: 'Blog categories', default: false },
    { id: 'search', name: 'Search', description: 'Blog search', default: false },
    { id: 'newsletter', name: 'Newsletter', description: 'Subscribe prompt', default: false }
  ],
  team: [
    { id: 'team-grid', name: 'Team Grid', description: 'Team member cards', default: true },
    { id: 'leadership', name: 'Leadership', description: 'Key leaders section', default: false },
    { id: 'departments', name: 'Departments', description: 'Organized by department', default: false },
    { id: 'join-us', name: 'Join Our Team', description: 'Careers CTA', default: false }
  ],
  pricing: [
    { id: 'pricing-tiers', name: 'Pricing Tiers', description: 'Plan comparison', default: true },
    { id: 'features-table', name: 'Features Table', description: 'Feature comparison', default: false },
    { id: 'faq', name: 'Pricing FAQ', description: 'Common questions', default: false },
    { id: 'cta', name: 'Get Started', description: 'Sign up prompt', default: true }
  ],
  default: [
    { id: 'hero', name: 'Hero Section', description: 'Page header', default: true },
    { id: 'content', name: 'Main Content', description: 'Page content', default: true },
    { id: 'cta', name: 'Call to Action', description: 'Action prompt', default: false }
  ]
};

// Visual style options
export const VISUAL_STYLES = [
  { id: 'modern', name: 'Modern', description: 'Clean lines, bold typography', colors: { primary: '#3b82f6', accent: '#10b981' } },
  { id: 'minimal', name: 'Minimal', description: 'Lots of whitespace, simple', colors: { primary: '#1a1a2e', accent: '#6366f1' } },
  { id: 'warm', name: 'Warm', description: 'Inviting, cozy, friendly', colors: { primary: '#d97706', accent: '#f59e0b' } },
  { id: 'bold', name: 'Bold', description: 'High contrast, impactful', colors: { primary: '#dc2626', accent: '#f97316' } },
  { id: 'luxury', name: 'Luxury', description: 'Premium, elegant, refined', colors: { primary: '#1a1a2e', accent: '#b8860b' } },
  { id: 'playful', name: 'Playful', description: 'Fun, colorful, energetic', colors: { primary: '#8b5cf6', accent: '#ec4899' } },
  { id: 'corporate', name: 'Corporate', description: 'Professional, trustworthy', colors: { primary: '#1e40af', accent: '#0891b2' } },
  { id: 'natural', name: 'Natural', description: 'Earthy, organic, calming', colors: { primary: '#166534', accent: '#84cc16' } }
];

// Page icons for display
export const PAGE_ICONS = {
  home: '🏠',
  about: '📖',
  services: '🛠️',
  contact: '📞',
  menu: '📋',
  gallery: '🖼️',
  portfolio: '💼',
  blog: '📝',
  team: '👥',
  pricing: '💰',
  testimonials: '⭐',
  faq: '❓',
  features: '✨',
  products: '🛍️',
  classes: '📚',
  schedule: '📅',
  careers: '💼',
  default: '📄'
};

// Default page order
export const DEFAULT_PAGE_ORDER = ['home', 'about', 'services', 'contact'];

// AI suggestion prompts for different contexts
export const AI_CONTEXT_PROMPTS = {
  layout: 'Based on the business type and user preferences, suggest the best layout for this page.',
  sections: 'Recommend which sections to include on this page for maximum impact.',
  style: 'Suggest a visual style that matches the business brand and target audience.',
  colors: 'Recommend colors that fit the desired mood and industry standards.'
};
