/**
 * CustomizeStep - WordPress-Style Editor
 * The main customization screen where users configure their site details
 */

import React, { useState } from 'react';
import { useWindowSize } from '../hooks';
import { getLayoutMode } from '../utils';
import { getLayoutsForIndustry } from '../constants';
import { styles } from '../styles';
import {
  CollapsibleSection,
  IndustryBanner,
  LayoutStyleSelector,
  LivePreviewRenderer,
  WhatYouGetCard,
  livePreviewStyles
} from '../components';

// CUSTOMIZE STEP: The WordPress-Style Editor
// ============================================
function CustomizeStep({ projectData, updateProject, industries, layouts, effects, onGenerate, onBack }) {
  // Responsive layout detection
  const { width } = useWindowSize();
  const layoutMode = getLayoutMode(width);
  const isLargeScreen = layoutMode === 'desktop' || layoutMode === 'largeDesktop';
  const isMobile = layoutMode === 'mobile';
  const isTablet = layoutMode === 'tablet';

  // Section collapse state
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);

  // Color presets
  const colorPresets = [
    { name: 'Ocean', colors: { primary: '#0ea5e9', secondary: '#0369a1', accent: '#38bdf8' } },
    { name: 'Forest', colors: { primary: '#22c55e', secondary: '#15803d', accent: '#86efac' } },
    { name: 'Sunset', colors: { primary: '#f97316', secondary: '#c2410c', accent: '#fdba74' } },
    { name: 'Royal', colors: { primary: '#8b5cf6', secondary: '#6d28d9', accent: '#c4b5fd' } },
    { name: 'Crimson', colors: { primary: '#ef4444', secondary: '#b91c1c', accent: '#fca5a5' } },
    { name: 'Midnight', colors: { primary: '#1e3a5f', secondary: '#0f172a', accent: '#c9a962' } },
  ];

  // ==========================================
  // INDUSTRY-SPECIFIC PLACEHOLDERS
  // ==========================================
  const industryPlaceholders = {
    tattoo: {
      businessName: 'e.g., Midnight Ink Studio',
      tagline: "e.g., Your story, our art. Custom tattoos since 2015",
      location: 'e.g., Austin, TX'
    },
    barbershop: {
      businessName: 'e.g., Classic Cuts Barbershop',
      tagline: 'e.g., Where gentlemen get groomed',
      location: 'e.g., Brooklyn, NY'
    },
    restaurant: {
      businessName: "e.g., Mario's Pizzeria",
      tagline: 'e.g., Authentic Brooklyn-style pizza since 1985',
      location: 'e.g., New York, NY'
    },
    pizza: {
      businessName: "e.g., Tony's Famous Pizza",
      tagline: 'e.g., Real New York pizza, made with love',
      location: 'e.g., Chicago, IL'
    },
    dental: {
      businessName: 'e.g., Bright Smile Family Dentistry',
      tagline: 'e.g., Gentle care for the whole family',
      location: 'e.g., Los Angeles, CA'
    },
    law: {
      businessName: 'e.g., Smith & Associates',
      tagline: 'e.g., Fighting for your rights since 1995',
      location: 'e.g., Miami, FL'
    },
    fitness: {
      businessName: 'e.g., Iron Forge Fitness',
      tagline: 'e.g., Transform your body, transform your life',
      location: 'e.g., Denver, CO'
    },
    spa: {
      businessName: 'e.g., Serenity Day Spa',
      tagline: 'e.g., Your escape from the everyday',
      location: 'e.g., Scottsdale, AZ'
    },
    auto: {
      businessName: "e.g., Mike's Auto Repair",
      tagline: 'e.g., Honest work at honest prices since 1990',
      location: 'e.g., Houston, TX'
    },
    default: {
      businessName: 'e.g., Your Business Name',
      tagline: 'e.g., A short phrase that captures what makes you special',
      location: 'e.g., San Francisco, CA'
    }
  };

  // ==========================================
  // SMART DEFAULTS BY INDUSTRY
  // ==========================================
  const industryDefaults = {
    tattoo: {
      targetAudience: ['individuals', 'professionals'],
      primaryCTA: 'book',
      teamSize: 'small',
      priceRange: 'premium',
      yearsEstablished: 'established',
      tone: 40 // More edgy/professional
    },
    barbershop: {
      targetAudience: ['individuals'],
      primaryCTA: 'book',
      teamSize: 'small',
      priceRange: 'mid',
      yearsEstablished: 'established',
      tone: 60 // Friendly but professional
    },
    restaurant: {
      targetAudience: ['individuals', 'families'],
      primaryCTA: 'book',
      teamSize: 'medium',
      priceRange: 'mid',
      yearsEstablished: 'established',
      tone: 70 // Warm and welcoming
    },
    pizza: {
      targetAudience: ['individuals', 'families'],
      primaryCTA: 'buy', // Order online
      teamSize: 'small',
      priceRange: 'budget',
      yearsEstablished: 'established',
      tone: 80 // Very friendly
    },
    dental: {
      targetAudience: ['individuals', 'families'],
      primaryCTA: 'book',
      teamSize: 'medium',
      priceRange: 'mid',
      yearsEstablished: 'established',
      tone: 50 // Balanced
    },
    law: {
      targetAudience: ['individuals', 'small-business'],
      primaryCTA: 'contact',
      teamSize: 'small',
      priceRange: 'premium',
      yearsEstablished: 'veteran',
      tone: 25 // Very professional
    },
    fitness: {
      targetAudience: ['individuals', 'professionals'],
      primaryCTA: 'book',
      teamSize: 'medium',
      priceRange: 'mid',
      yearsEstablished: 'growing',
      tone: 75 // Motivating and friendly
    },
    spa: {
      targetAudience: ['individuals', 'professionals'],
      primaryCTA: 'book',
      teamSize: 'small',
      priceRange: 'premium',
      yearsEstablished: 'established',
      tone: 55 // Calm and welcoming
    },
    auto: {
      targetAudience: ['individuals', 'families'],
      primaryCTA: 'call',
      teamSize: 'small',
      priceRange: 'mid',
      yearsEstablished: 'veteran',
      tone: 60 // Trustworthy and friendly
    }
  };

  // Get placeholders based on current industry
  const getPlaceholder = (field) => {
    const industryKey = projectData.industryKey?.toLowerCase() || '';
    for (const [key, placeholders] of Object.entries(industryPlaceholders)) {
      if (industryKey.includes(key)) {
        return placeholders[field] || industryPlaceholders.default[field];
      }
    }
    return industryPlaceholders.default[field];
  };

  // Apply smart defaults when industry changes
  const applyIndustryDefaults = (industryKey) => {
    const key = industryKey?.toLowerCase() || '';
    let defaults = null;

    for (const [indKey, indDefaults] of Object.entries(industryDefaults)) {
      if (key.includes(indKey)) {
        defaults = indDefaults;
        break;
      }
    }

    if (defaults) {
      updateProject({
        targetAudience: defaults.targetAudience,
        primaryCTA: defaults.primaryCTA,
        teamSize: defaults.teamSize,
        priceRange: defaults.priceRange,
        yearsEstablished: defaults.yearsEstablished,
        tone: defaults.tone
      });
    }
  };

  // ==========================================
  // BUSINESS NAME INTELLIGENCE
  // ==========================================
  const inferFromBusinessName = (name) => {
    if (!name || name.length < 3) return null;

    const lowerName = name.toLowerCase();
    const inferences = { location: null, style: null, industry: null };

    // Location detection
    const cities = {
      'brooklyn': 'Brooklyn, NY',
      'manhattan': 'Manhattan, NY',
      'austin': 'Austin, TX',
      'dallas': 'Dallas, TX',
      'houston': 'Houston, TX',
      'miami': 'Miami, FL',
      'chicago': 'Chicago, IL',
      'seattle': 'Seattle, WA',
      'denver': 'Denver, CO',
      'phoenix': 'Phoenix, AZ',
      'la': 'Los Angeles, CA',
      'sf': 'San Francisco, CA',
      'boston': 'Boston, MA',
      'atlanta': 'Atlanta, GA',
      'philly': 'Philadelphia, PA'
    };

    for (const [cityKey, cityName] of Object.entries(cities)) {
      if (lowerName.includes(cityKey)) {
        inferences.location = cityName;
        break;
      }
    }

    // Style/vibe detection
    if (lowerName.includes("'s ") || lowerName.includes("mama") || lowerName.includes("papa") || lowerName.includes("uncle") || lowerName.includes("auntie")) {
      inferences.style = 'Family-owned vibe';
    } else if (lowerName.includes('elite') || lowerName.includes('premium') || lowerName.includes('luxury') || lowerName.includes('exclusive')) {
      inferences.style = 'Luxury/Premium';
    } else if (lowerName.includes('& associates') || lowerName.includes('& partners') || lowerName.includes('group') || lowerName.includes('llc')) {
      inferences.style = 'Professional/Corporate';
    } else if (lowerName.includes('ink') || lowerName.includes('tattoo') || lowerName.includes('custom')) {
      inferences.style = 'Creative/Artistic';
    }

    // Industry hints
    const industryHints = {
      'pizza': 'Pizza/Italian',
      'ink': 'Tattoo Studio',
      'tattoo': 'Tattoo Studio',
      'cuts': 'Barbershop',
      'barber': 'Barbershop',
      'dental': 'Dental Practice',
      'smile': 'Dental Practice',
      'law': 'Law Firm',
      'legal': 'Law Firm',
      'attorney': 'Law Firm',
      'fitness': 'Fitness/Gym',
      'gym': 'Fitness/Gym',
      'iron': 'Fitness/Gym',
      'spa': 'Spa/Wellness',
      'auto': 'Auto Repair',
      'motor': 'Auto Repair',
      'grill': 'Restaurant',
      'kitchen': 'Restaurant',
      'cafe': 'Restaurant/Cafe',
      'bistro': 'Restaurant'
    };

    for (const [hint, industry] of Object.entries(industryHints)) {
      if (lowerName.includes(hint)) {
        inferences.industry = industry;
        break;
      }
    }

    // Only return if we found something
    if (inferences.location || inferences.style || inferences.industry) {
      return inferences;
    }
    return null;
  };

  // Update inferences when business name changes
  const handleBusinessNameChange = (name) => {
    const inferred = inferFromBusinessName(name);
    updateProject({
      businessName: name,
      inferredDetails: inferred
    });
  };

  // High-impact question options
  const teamSizeOptions = [
    { id: 'solo', label: 'Just Me', icon: '👤' },
    { id: 'small', label: '2-4 People', icon: '👥' },
    { id: 'medium', label: '5-10 People', icon: '👨‍👩‍👧‍👦' },
    { id: 'large', label: '10+ People', icon: '🏢' }
  ];

  const priceRangeOptions = [
    { id: 'budget', label: '$', description: 'Budget-friendly', icon: '💵' },
    { id: 'mid', label: '$$', description: 'Mid-range', icon: '💰' },
    { id: 'premium', label: '$$$', description: 'Premium', icon: '💎' },
    { id: 'luxury', label: '$$$$', description: 'Luxury', icon: '👑' }
  ];

  const yearsOptions = [
    { id: 'new', label: 'Just Starting', icon: '🌱' },
    { id: 'growing', label: '1-5 Years', icon: '📈' },
    { id: 'established', label: '5-15 Years', icon: '🏆' },
    { id: 'veteran', label: '15+ Years', icon: '⭐' }
  ];

  const pageOptions = [
    { id: 'home', label: 'Home', icon: '🏠', default: true },
    { id: 'about', label: 'About', icon: '👥', default: true },
    { id: 'services', label: 'Services', icon: '⚙️', default: false },
    { id: 'contact', label: 'Contact', icon: '📞', default: true },
    { id: 'pricing', label: 'Pricing', icon: '💰', default: false },
    { id: 'gallery', label: 'Gallery', icon: '🖼️', default: false },
    { id: 'menu', label: 'Menu', icon: '🍽️', default: false },
    { id: 'booking', label: 'Booking', icon: '📅', default: false },
    { id: 'testimonials', label: 'Reviews', icon: '⭐', default: false },
    { id: 'faq', label: 'FAQ', icon: '❓', default: false },
    { id: 'blog', label: 'Blog', icon: '📝', default: false },
    { id: 'team', label: 'Team', icon: '👨‍👩‍👧‍👦', default: false },
    { id: 'dashboard', label: 'Dashboard', icon: '📊', default: false, appPage: true },
    { id: 'earn', label: 'Earn', icon: '💵', default: false, appPage: true },
    { id: 'rewards', label: 'Rewards', icon: '🎁', default: false, appPage: true },
    { id: 'wallet', label: 'Wallet', icon: '💳', default: false, appPage: true },
    { id: 'profile', label: 'Profile', icon: '👤', default: false, appPage: true },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆', default: false, appPage: true },
  ];

  const togglePage = (pageId) => {
    const current = projectData.selectedPages;
    if (current.includes(pageId)) {
      updateProject({ selectedPages: current.filter(p => p !== pageId) });
    } else {
      updateProject({ selectedPages: [...current, pageId] });
    }
  };

  const selectPreset = (preset) => {
    updateProject({
      colorMode: 'preset',
      selectedPreset: preset.name,
      colors: { ...projectData.colors, ...preset.colors }
    });
  };

  const updateCustomColor = (key, value) => {
    updateProject({
      colorMode: 'custom',
      selectedPreset: null,
      colors: { ...projectData.colors, [key]: value }
    });
  };

  // Completed steps for breadcrumb
  const completedSteps = ['choose-path', 'path', 'upload-assets'];

  // Responsive styles based on screen size
  const responsiveStyles = {
    container: {
      width: '100%',
      maxWidth: layoutMode === 'largeDesktop' ? '1920px' :
                layoutMode === 'desktop' ? '1600px' :
                layoutMode === 'tablet' ? '100%' : '100%',
      padding: isMobile ? '16px' : isTablet ? '24px' : '40px',
      margin: '0 auto'
    },
    grid: {
      display: isMobile ? 'flex' : 'grid',
      flexDirection: isMobile ? 'column' : undefined,
      // Larger preview column on desktop
      gridTemplateColumns: isMobile ? '1fr' :
                          isTablet ? '1fr' :
                          layoutMode === 'desktop' ? '1fr 480px' :
                          '1fr 550px',
      gap: isMobile ? '20px' : isTablet ? '28px' : '40px',
      marginBottom: '32px',
      alignItems: 'start'
    },
    formContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '16px' : '20px'
    },
    // On large screens, show some sections side by side
    sectionsGrid: {
      display: isLargeScreen ? 'grid' : 'flex',
      gridTemplateColumns: isLargeScreen ? 'repeat(2, 1fr)' : undefined,
      flexDirection: isLargeScreen ? undefined : 'column',
      gap: isMobile ? '16px' : '20px'
    },
    // Full-width sections (like pages, layout style)
    fullWidthSection: {
      gridColumn: isLargeScreen ? 'span 2' : undefined
    },
    preview: {
      position: isMobile ? 'relative' : 'sticky',
      top: isMobile ? 'auto' : '24px',
      height: isMobile ? '350px' : 'fit-content',
      maxHeight: isMobile ? '350px' :
                 isTablet ? '500px' :
                 layoutMode === 'desktop' ? '600px' : '700px',
      minHeight: isMobile ? '300px' : '400px'
    }
  };

  return (
    <div style={{...styles.customizeContainer, ...responsiveStyles.container}}>
      <button style={styles.backBtn} onClick={onBack}>← Back</button>

      <h1 style={{
        ...styles.customizeTitle,
        fontSize: isMobile ? '22px' : isTablet ? '26px' : '28px'
      }}>✨ Customize Your Site</h1>
      <p style={{
        ...p1Styles.subtitle,
        marginBottom: isMobile ? '16px' : '24px'
      }}>Configure every detail of your professional website</p>

      {/* Industry Detection Banner */}
      {projectData.industry && (
        <IndustryBanner
          industry={projectData.industry}
          industryKey={projectData.industryKey}
          industries={industries}
          onChangeClick={() => setShowIndustryPicker(true)}
        />
      )}

      {/* Industry Picker Modal */}
      {showIndustryPicker && (
        <div style={p1Styles.modalOverlay}>
          <div style={p1Styles.modalContent}>
            <h3 style={p1Styles.modalTitle}>Select Your Industry</h3>
            <p style={p1Styles.modalSubtitle}>This helps us optimize your website structure</p>
            <div style={p1Styles.industryGrid}>
              {Object.entries(industries).map(([key, ind]) => (
                <button
                  key={key}
                  style={{
                    ...p1Styles.industryOption,
                    ...(projectData.industryKey === key ? p1Styles.industryOptionActive : {})
                  }}
                  onClick={() => {
                    updateProject({
                      industryKey: key,
                      industry: ind,
                      layoutKey: null,
                      effects: ind?.effects || []
                    });
                    // Apply smart defaults for this industry
                    applyIndustryDefaults(key);
                    setShowIndustryPicker(false);
                  }}
                >
                  <span style={p1Styles.industryIcon}>{ind.icon}</span>
                  <span style={p1Styles.industryName}>{ind.name}</span>
                </button>
              ))}
            </div>
            <button style={p1Styles.modalClose} onClick={() => setShowIndustryPicker(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{...styles.customizeGrid, ...responsiveStyles.grid}}>
        {/* LEFT: Form Controls - Now with Collapsible Sections */}
        <div style={{...styles.customizeForm, maxWidth: isMobile ? '100%' : 'none'}}>

          {/* Responsive Grid for Smaller Sections */}
          <div style={responsiveStyles.sectionsGrid}>

          {/* SECTION 1: Business Identity - Always Visible */}
          <CollapsibleSection
            title="Business Identity"
            icon="🏢"
            defaultOpen={true}
            tooltip="Basic information about your business"
          >
            {/* Business Name with Intelligence */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Business Name *
                <span style={p1Styles.requiredStar}>Required</span>
              </label>
              <input
                type="text"
                value={projectData.businessName}
                onChange={(e) => handleBusinessNameChange(e.target.value)}
                placeholder={getPlaceholder('businessName')}
                style={styles.formInput}
              />
              <p style={customizeStyles.fieldHint}>This will appear in your header and throughout your site</p>

              {/* Business Name Intelligence Display */}
              {projectData.inferredDetails && (
                <div style={customizeStyles.inferenceBox}>
                  <span style={customizeStyles.inferenceLabel}>We detected:</span>
                  <div style={customizeStyles.inferenceChips}>
                    {projectData.inferredDetails.location && (
                      <span style={customizeStyles.inferenceChip}>📍 {projectData.inferredDetails.location}</span>
                    )}
                    {projectData.inferredDetails.industry && (
                      <span style={customizeStyles.inferenceChip}>🏪 {projectData.inferredDetails.industry}</span>
                    )}
                    {projectData.inferredDetails.style && (
                      <span style={customizeStyles.inferenceChip}>✨ {projectData.inferredDetails.style}</span>
                    )}
                  </div>
                  <p style={customizeStyles.inferenceHint}>Click fields below to adjust if we got it wrong</p>
                </div>
              )}
            </div>

            {/* Location */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Business Location *</label>
              <input
                type="text"
                value={projectData.location || ''}
                onChange={(e) => updateProject({ location: e.target.value })}
                placeholder={getPlaceholder('location')}
                style={styles.formInput}
              />
              <p style={customizeStyles.fieldHint}>Helps AI customize content for your area</p>
            </div>

            {/* Tagline - Optional with "We'll Handle It" */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Tagline
                <span style={customizeStyles.optionalBadge}>Optional</span>
              </label>
              <input
                type="text"
                value={projectData.tagline}
                onChange={(e) => updateProject({ tagline: e.target.value })}
                placeholder={getPlaceholder('tagline')}
                style={styles.formInput}
              />
              <p style={customizeStyles.fieldHintWithIcon}>
                <span style={customizeStyles.hintIcon}>💡</span>
                Skip this and we'll generate a tagline based on your industry
              </p>
            </div>
          </CollapsibleSection>

          {/* SECTION: Quick Impact Questions */}
          <CollapsibleSection
            title="Quick Details"
            icon="⚡"
            defaultOpen={true}
            tooltip="3 quick questions that dramatically improve your site"
          >
            <p style={customizeStyles.sectionIntro}>
              These quick selections help us generate better content. Takes 10 seconds!
            </p>

            {/* Team Size */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Team Size</label>
              <div style={customizeStyles.chipGrid}>
                {teamSizeOptions.map(option => (
                  <button
                    key={option.id}
                    style={{
                      ...customizeStyles.impactChip,
                      ...(projectData.teamSize === option.id ? customizeStyles.impactChipActive : {})
                    }}
                    onClick={() => updateProject({ teamSize: option.id })}
                  >
                    <span style={customizeStyles.impactChipIcon}>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Price Range</label>
              <div style={customizeStyles.chipGrid}>
                {priceRangeOptions.map(option => (
                  <button
                    key={option.id}
                    style={{
                      ...customizeStyles.impactChip,
                      ...(projectData.priceRange === option.id ? customizeStyles.impactChipActive : {})
                    }}
                    onClick={() => updateProject({ priceRange: option.id })}
                  >
                    <span style={customizeStyles.impactChipIcon}>{option.icon}</span>
                    <span>{option.label}</span>
                    {option.description && <span style={customizeStyles.impactChipDesc}>{option.description}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Years Established */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>How Established?</label>
              <div style={customizeStyles.chipGrid}>
                {yearsOptions.map(option => (
                  <button
                    key={option.id}
                    style={{
                      ...customizeStyles.impactChip,
                      ...(projectData.yearsEstablished === option.id ? customizeStyles.impactChipActive : {})
                    }}
                    onClick={() => updateProject({ yearsEstablished: option.id })}
                  >
                    <span style={customizeStyles.impactChipIcon}>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* SECTION 2: Target & Goals - Collapsed by default */}
          <CollapsibleSection
            title="Customize More"
            icon="✨"
            defaultOpen={false}
            tooltip="Optional - we'll use smart defaults if you skip"
            badge={projectData.targetAudience?.length > 0 ? `${projectData.targetAudience.length} selected` : 'Auto'}
          >
            <p style={customizeStyles.sectionIntro}>
              <span style={customizeStyles.hintIcon}>💡</span>
              These are optional! We've pre-selected smart defaults based on your industry.
              The more you customize, the better your site will be - but even skipping this produces great results.
            </p>

            {/* Target Audience */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Who are your customers?</label>
              <p style={customizeStyles.fieldHint}>Select all that apply - helps AI write relevant content</p>
              <div style={customizeStyles.chipGrid}>
                {[
                  { id: 'individuals', label: 'Individuals', icon: '👤' },
                  { id: 'families', label: 'Families', icon: '👨‍👩‍👧' },
                  { id: 'small-business', label: 'Small Businesses', icon: '🏪' },
                  { id: 'enterprise', label: 'Enterprise', icon: '🏢' },
                  { id: 'startups', label: 'Startups', icon: '🚀' },
                  { id: 'professionals', label: 'Professionals', icon: '💼' },
                ].map(audience => (
                  <button
                    key={audience.id}
                    style={{
                      ...customizeStyles.chip,
                      ...(projectData.targetAudience?.includes(audience.id) ? customizeStyles.chipActive : {})
                    }}
                    onClick={() => {
                      const current = projectData.targetAudience || [];
                      if (current.includes(audience.id)) {
                        updateProject({ targetAudience: current.filter(a => a !== audience.id) });
                      } else {
                        updateProject({ targetAudience: [...current, audience.id] });
                      }
                    }}
                  >
                    <span>{audience.icon}</span>
                    <span>{audience.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Primary CTA - Call to Action */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Primary Call-to-Action
                <span style={p1Styles.tooltipIcon} title="The main action button visitors will see on your site">ⓘ</span>
              </label>
              <p style={customizeStyles.fieldHint}>What should visitors do when they land on your site?</p>
              <div style={customizeStyles.radioGrid}>
                {[
                  { id: 'contact', label: 'Contact Us', icon: '📧' },
                  { id: 'book', label: 'Book Appointment', icon: '📅' },
                  { id: 'call', label: 'Call Now', icon: '📞' },
                  { id: 'quote', label: 'Get a Quote', icon: '💬' },
                  { id: 'buy', label: 'Buy Now', icon: '🛒' },
                  { id: 'visit', label: 'Visit Location', icon: '📍' },
                ].map(cta => (
                  <label
                    key={cta.id}
                    style={{
                      ...customizeStyles.radioLabel,
                      ...(projectData.primaryCTA === cta.id ? customizeStyles.radioLabelActive : {})
                    }}
                  >
                    <input
                      type="radio"
                      name="primaryCTA"
                      value={cta.id}
                      checked={projectData.primaryCTA === cta.id}
                      onChange={(e) => updateProject({ primaryCTA: e.target.value })}
                      style={customizeStyles.radioInput}
                    />
                    <span>{cta.icon}</span>
                    <span>{cta.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Communication Tone */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Communication Style
                <span style={p1Styles.tooltipIcon} title="How formal or casual should your website copy sound?">ⓘ</span>
              </label>
              <p style={customizeStyles.fieldHint}>This affects how the AI writes your content</p>
              <div style={customizeStyles.sliderContainer}>
                <span style={customizeStyles.sliderLabel}>Professional</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={projectData.tone || 50}
                  onChange={(e) => updateProject({ tone: parseInt(e.target.value) })}
                  style={customizeStyles.slider}
                />
                <span style={customizeStyles.sliderLabel}>Friendly</span>
              </div>
              <p style={customizeStyles.toneHint}>
                {projectData.tone < 33 ? '👔 Formal, corporate language' :
                 projectData.tone > 66 ? '😊 Casual, conversational tone' : '🤝 Balanced professional tone'}
              </p>
            </div>
          </CollapsibleSection>

          {/* SECTION 3: Design & Colors - Collapsed by default */}
          <CollapsibleSection
            title="Design & Colors"
            icon="🎨"
            defaultOpen={false}
            badge={projectData.selectedPreset || 'Auto'}
            tooltip="Optional - we'll pick colors that match your industry"
          >
            <p style={customizeStyles.sectionIntro}>
              <span style={customizeStyles.hintIcon}>💡</span>
              Skip this and we'll choose a color palette that perfectly matches your industry vibe.
            </p>
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Color Palette</label>
              <p style={customizeStyles.fieldHint}>Pick a preset or customize your own colors</p>

            {/* Presets */}
            <div style={styles.colorPresets}>
              {colorPresets.map(preset => (
                <button
                  key={preset.name}
                  style={{
                    ...styles.colorPreset,
                    ...(projectData.selectedPreset === preset.name ? styles.colorPresetActive : {})
                  }}
                  onClick={() => selectPreset(preset)}
                  title={preset.name}
                >
                  <div style={styles.presetSwatches}>
                    <div style={{...styles.presetSwatch, background: preset.colors.primary}} />
                    <div style={{...styles.presetSwatch, background: preset.colors.secondary}} />
                    <div style={{...styles.presetSwatch, background: preset.colors.accent}} />
                  </div>
                  <span style={styles.presetName}>{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Custom color picker */}
            <div style={styles.customColors}>
              <div style={styles.colorPickerGroup}>
                <label>Primary</label>
                <input
                  type="color"
                  value={projectData.colors.primary}
                  onChange={(e) => updateCustomColor('primary', e.target.value)}
                  style={styles.colorPicker}
                />
              </div>
              <div style={styles.colorPickerGroup}>
                <label>Secondary</label>
                <input
                  type="color"
                  value={projectData.colors.secondary}
                  onChange={(e) => updateCustomColor('secondary', e.target.value)}
                  style={styles.colorPicker}
                />
              </div>
              <div style={styles.colorPickerGroup}>
                <label>Accent</label>
                <input
                  type="color"
                  value={projectData.colors.accent}
                  onChange={(e) => updateCustomColor('accent', e.target.value)}
                  style={styles.colorPicker}
                />
              </div>
            </div>
            </div>
          </CollapsibleSection>

          </div>{/* End of responsiveStyles.sectionsGrid */}

          {/* SECTION 3.5: Layout Style - Visual Layout Selection */}
          <CollapsibleSection
            title="Layout Style"
            icon="📐"
            defaultOpen={true}
            badge={projectData.layoutStyleId ? getLayoutsForIndustry(projectData.industryKey).find(l => l.id === projectData.layoutStyleId)?.name : 'Choose a style'}
            tooltip="Choose how your website sections are arranged"
            fullWidth={true}
          >
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Select a Layout
                <span style={p1Styles.tooltipIcon} title="Different layouts emphasize different content. Pick what works best for your business.">ⓘ</span>
              </label>
              <p style={customizeStyles.fieldHint}>
                {projectData.industryKey
                  ? `Layouts optimized for ${projectData.industry?.name || 'your industry'}`
                  : 'General layouts that work for any business'}
              </p>
              <LayoutStyleSelector
                industryKey={projectData.industryKey}
                selectedLayout={projectData.layoutStyleId}
                onSelectLayout={(layoutId, previewConfig) => {
                  updateProject({
                    layoutStyleId: layoutId,
                    layoutStylePreview: previewConfig
                  });
                }}
                colors={projectData.colors}
              />
            </div>
          </CollapsibleSection>

          {/* SECTION 4: Pages */}
          <CollapsibleSection
            title="Website Pages"
            icon="📄"
            defaultOpen={false}
            badge={`${projectData.selectedPages.length} selected`}
            tooltip="Choose which pages to include in your website"
          >
            <p style={customizeStyles.sectionIntro}>
              <span style={customizeStyles.hintIcon}>💡</span>
              We've pre-selected the essential pages. Add more if needed, or generate now!
            </p>
            {/* Website Pages */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Standard Pages</label>
              <p style={customizeStyles.fieldHint}>Core pages for your website</p>
              <div style={styles.pageGrid}>
                {pageOptions.filter(p => !p.appPage).map(page => (
                  <button
                    key={page.id}
                    style={{
                      ...styles.pageChip,
                      ...(projectData.selectedPages.includes(page.id) ? styles.pageChipActive : {})
                    }}
                    onClick={() => togglePage(page.id)}
                  >
                    <span>{page.icon}</span>
                    <span>{page.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* App/Dashboard Pages */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                App & Dashboard Pages
                <span style={customizeStyles.optionalBadge}>Advanced</span>
              </label>
              <p style={customizeStyles.fieldHint}>Interactive features for member portals, dashboards, and user accounts</p>
              <div style={styles.pageGrid}>
                {pageOptions.filter(p => p.appPage).map(page => (
                  <button
                    key={page.id}
                    style={{
                      ...styles.pageChip,
                      ...(projectData.selectedPages.includes(page.id) ? styles.pageChipActive : {})
                    }}
                    onClick={() => togglePage(page.id)}
                  >
                    <span>{page.icon}</span>
                    <span>{page.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Video Hero Background Toggle */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Hero Enhancements
                <span style={customizeStyles.premiumBadge}>Premium</span>
              </label>
              <div style={customizeStyles.videoToggleContainer}>
                <label style={customizeStyles.videoToggleLabel}>
                  <input
                    type="checkbox"
                    checked={(() => {
                      // If user explicitly set, use that
                      if (projectData.enableVideoHero !== null) return projectData.enableVideoHero;
                      // Otherwise, auto-enable for supported industries
                      const videoIndustries = ['tattoo', 'barbershop', 'barber', 'restaurant', 'pizza', 'pizzeria', 'fitness', 'gym', 'spa', 'salon', 'wellness'];
                      const industry = (projectData.industryKey || '').toLowerCase();
                      return videoIndustries.some(v => industry.includes(v));
                    })()}
                    onChange={(e) => updateProject({ enableVideoHero: e.target.checked })}
                    style={customizeStyles.videoCheckbox}
                  />
                  <span style={customizeStyles.videoToggleText}>
                    <span style={customizeStyles.videoIcon}>🎬</span>
                    Enable Video Hero Background
                  </span>
                </label>
                <p style={customizeStyles.videoToggleHint}>
                  {(() => {
                    const videoIndustries = ['tattoo', 'barbershop', 'barber', 'restaurant', 'pizza', 'pizzeria', 'fitness', 'gym', 'spa', 'salon', 'wellness'];
                    const industry = (projectData.industryKey || '').toLowerCase();
                    const isSupported = videoIndustries.some(v => industry.includes(v));
                    if (isSupported) {
                      return '✨ Your industry has a curated video available! Video auto-plays on desktop, shows image on mobile.';
                    }
                    return 'Video backgrounds create stunning first impressions. Currently available for restaurants, fitness, spas, barbershops, and tattoo studios.';
                  })()}
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* SECTION 5: Advanced - Extra Details */}
          <CollapsibleSection
            title="Advanced AI Instructions"
            icon="🤖"
            defaultOpen={false}
            tooltip="Power users only - give AI specific customization instructions"
          >
            <p style={customizeStyles.sectionIntro}>
              <span style={customizeStyles.hintIcon}>🔧</span>
              For power users: Add specific instructions if you have unique requirements.
              Skip this for a great result using smart defaults!
            </p>
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Extra Details for AI
                <span style={customizeStyles.optionalBadge}>Optional</span>
              </label>
              <p style={customizeStyles.fieldHint}>
                Add specific instructions, unique features, or context the AI should know about
              </p>
              <textarea
                value={projectData.extraDetails}
                onChange={(e) => updateProject({ extraDetails: e.target.value })}
                placeholder="Give AI more context... e.g., 'This is an NFT portfolio tracker. Replace eBay pricing with OpenSea floor prices. Use wallet connection instead of email login. Show ETH values and chain icons.'"
                style={styles.extraDetailsTextarea}
                rows={4}
              />
              <p style={styles.extraDetailsHint}>💡 The more detail you provide, the more customized your pages will be</p>
            </div>
          </CollapsibleSection>

        </div>

        {/* RIGHT: Live Preview - Updates based on layout selection */}
        <div style={{...styles.previewContainer, ...responsiveStyles.preview}}>
          <div style={styles.previewHeader}>
            <span>Live Preview</span>
            {projectData.layoutStyleId && (
              <span style={livePreviewStyles.layoutBadge}>
                {getLayoutsForIndustry(projectData.industryKey).find(l => l.id === projectData.layoutStyleId)?.name}
              </span>
            )}
            <div style={styles.previewDots}>
              <span style={styles.dot} />
              <span style={styles.dot} />
              <span style={styles.dot} />
            </div>
          </div>
          <div style={styles.previewFrame}>
            {/* Dynamic Preview based on layout selection */}
            <LivePreviewRenderer
              projectData={projectData}
              layoutPreview={projectData.layoutStylePreview}
            />
          </div>
        </div>
      </div>

      {/* What You'll Get Preview */}
      <WhatYouGetCard projectData={projectData} />

      {/* Generate Button Section */}
      <div style={styles.generateSection}>
        <div style={styles.generateSummary}>
          <span>{projectData.industry?.icon || '✨'} {projectData.industry?.name || 'Custom'}</span>
          <span style={p1Styles.summarySeparator}>•</span>
          <span>{projectData.selectedPages.length} pages</span>
          <span style={p1Styles.summarySeparator}>•</span>
          <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
            <span style={{width: '10px', height: '10px', borderRadius: '50%', background: projectData.colors.primary}} />
            {projectData.selectedPreset || 'Custom'} theme
          </span>
        </div>
        {!projectData.businessName.trim() && (
          <p style={p1Styles.warningText}>⚠️ Please enter a business name to continue</p>
        )}

        {/* Reassurance message */}
        {projectData.businessName.trim() && (
          <div style={customizeStyles.readyMessage}>
            <span style={customizeStyles.readyIcon}>✨</span>
            <div>
              <p style={customizeStyles.readyTitle}>Ready to generate!</p>
              <p style={customizeStyles.readySubtitle}>
                We'll use smart defaults for anything you skipped. The more details you provide, the better your site will be.
              </p>
            </div>
          </div>
        )}

        <button
          style={{
            ...styles.generateBtn,
            opacity: projectData.businessName.trim() ? 1 : 0.5
          }}
          onClick={onGenerate}
          disabled={!projectData.businessName.trim()}
        >
          🚀 Generate My Website
        </button>
        <p style={p1Styles.generateHint}>Takes about 60 seconds • You can preview before deploying</p>
      </div>
    </div>
  );
}

const customizeStyles = {
  fieldHint: {
    color: '#666',
    fontSize: '12px',
    marginTop: '6px',
    marginBottom: 0
  },
  chipGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  chipActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
    color: '#22c55e'
  },
  radioGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  radioLabelActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
    color: '#22c55e'
  },
  radioInput: {
    display: 'none'
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  slider: {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    background: 'rgba(255,255,255,0.1)',
    appearance: 'none',
    cursor: 'pointer'
  },
  sliderLabel: {
    color: '#666',
    fontSize: '12px',
    minWidth: '70px'
  },
  toneHint: {
    color: '#22c55e',
    fontSize: '12px',
    marginTop: '8px',
    textAlign: 'center'
  },
  optionalBadge: {
    marginLeft: '8px',
    padding: '2px 8px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#666'
  },
  // Business Name Intelligence Styles
  inferenceBox: {
    marginTop: '12px',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '10px'
  },
  inferenceLabel: {
    color: '#22c55e',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '8px',
    display: 'block'
  },
  inferenceChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '6px'
  },
  inferenceChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '500'
  },
  inferenceHint: {
    color: '#666',
    fontSize: '11px',
    margin: 0
  },
  // High-Impact Question Styles
  sectionIntro: {
    color: '#888',
    fontSize: '13px',
    marginBottom: '16px',
    lineHeight: 1.5
  },
  impactChip: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '80px',
    flex: '1 1 auto'
  },
  impactChipActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
    color: '#22c55e'
  },
  impactChipIcon: {
    fontSize: '20px'
  },
  impactChipDesc: {
    fontSize: '10px',
    color: '#666',
    marginTop: '2px'
  },
  // Field Hint with Icon
  fieldHintWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#666',
    fontSize: '12px',
    marginTop: '8px',
    marginBottom: 0
  },
  hintIcon: {
    fontSize: '14px'
  },
  // Ready to Generate Message
  readyMessage: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '12px',
    marginBottom: '16px'
  },
  readyIcon: {
    fontSize: '24px',
    marginTop: '2px'
  },
  readyTitle: {
    color: '#22c55e',
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 4px 0'
  },
  readySubtitle: {
    color: '#888',
    fontSize: '13px',
    margin: 0,
    lineHeight: 1.4
  },
  // Video Hero Toggle Styles
  premiumBadge: {
    marginLeft: '8px',
    padding: '2px 8px',
    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#a855f7',
    fontWeight: '600'
  },
  videoToggleContainer: {
    padding: '16px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px'
  },
  videoToggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer'
  },
  videoCheckbox: {
    width: '20px',
    height: '20px',
    accentColor: '#22c55e',
    cursor: 'pointer'
  },
  videoToggleText: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500'
  },
  videoIcon: {
    fontSize: '18px'
  },
  videoToggleHint: {
    color: '#888',
    fontSize: '12px',
    marginTop: '10px',
    marginLeft: '32px',
    lineHeight: 1.5
  }
};

// P1 Visual Improvement Styles
const p1Styles = {
  subtitle: {
    color: '#888',
    fontSize: '15px',
    textAlign: 'center',
    marginBottom: '24px',
    marginTop: '-8px'
  },
  requiredStar: {
    marginLeft: '8px',
    padding: '2px 8px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#ef4444',
    fontWeight: '500'
  },
  tooltipIcon: {
    marginLeft: '6px',
    fontSize: '14px',
    color: '#666',
    cursor: 'help'
  },
  summarySeparator: {
    color: '#444'
  },
  warningText: {
    color: '#f59e0b',
    fontSize: '13px',
    marginBottom: '12px',
    textAlign: 'center'
  },
  generateHint: {
    color: '#666',
    fontSize: '12px',
    marginTop: '12px',
    textAlign: 'center'
  },
  // Industry picker modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: '#1a1a1f',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '8px',
    textAlign: 'center',
    margin: '0 0 8px 0'
  },
  modalSubtitle: {
    color: '#888',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '24px'
  },
  industryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '24px'
  },
  industryOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  industryOptionActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e'
  },
  industryIcon: {
    fontSize: '28px'
  },
  industryName: {
    fontSize: '12px',
    color: '#fff',
    textAlign: 'center'
  },
  modalClose: {
    width: '100%',
    padding: '14px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer'
  }
};

// Layout Selection Styles
const layoutStyles = {
  detectedBadge: {
    marginLeft: '10px',
    padding: '3px 10px',
    background: 'rgba(34, 197, 94, 0.15)',
    borderRadius: '12px',
    fontSize: '11px',
    color: '#22c55e',
    fontWeight: 'normal'
  },
  layoutGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '12px'
  },
  layoutCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    width: '100%',
    position: 'relative'
  },
  layoutCardActive: {
    background: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
    boxShadow: '0 0 20px rgba(34, 197, 94, 0.15)'
  },
  layoutIcon: {
    fontSize: '24px',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '10px',
    flexShrink: 0
  },
  layoutInfo: {
    flex: 1,
    minWidth: 0
  },
  layoutName: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '4px'
  },
  layoutDesc: {
    color: '#888',
    fontSize: '12px',
    lineHeight: '1.4'
  },
  layoutCheck: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#22c55e',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    flexShrink: 0
  },
  sectionPreview: {
    marginTop: '16px',
    padding: '14px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  sectionPreviewLabel: {
    color: '#666',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '10px'
  },
  sectionFlow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  sectionChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '4px',
    color: '#22c55e',
    fontSize: '11px',
    textTransform: 'capitalize'
  },
  optionalTag: {
    padding: '1px 4px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '3px',
    fontSize: '9px',
    color: '#666',
    marginLeft: '4px'
  }
};

export { CustomizeStep, customizeStyles, p1Styles, layoutStyles };
