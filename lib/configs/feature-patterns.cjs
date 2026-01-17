/**
 * Feature Patterns - Architectural guidance for AI generation
 *
 * THIS IS NOT CODE TO COPY.
 * These are principles and patterns the AI uses to generate UNIQUE implementations.
 * Each generation will be different. The patterns ensure it works correctly.
 */

const FEATURE_PATTERNS = {
  // ============================================
  // CART / E-COMMERCE PATTERN
  // ============================================
  cart: {
    name: 'Shopping Cart',
    purpose: 'Allow users to collect items before purchase',

    stateShape: `
      Cart state should include:
      - items: array of {id, name, price, quantity, variants, customizations}
      - computed totals: subtotal, tax, fees, discounts, total
      - order metadata: type (delivery/pickup), address, special instructions
      - promo/discount tracking
    `,

    architecture: `
      Use React Context + useReducer for cart state:
      - Context provides global access without prop drilling
      - useReducer handles complex state transitions (add, remove, update quantity, clear)
      - Persist to localStorage so cart survives page refresh
      - Compute totals as derived state, not stored state
    `,

    actions: [
      'addItem(item) - Add item or increase quantity if exists',
      'removeItem(id) - Remove item completely',
      'updateQuantity(id, quantity) - Change quantity, remove if 0',
      'clearCart() - Empty the cart',
      'applyPromo(code) - Validate and apply discount',
      'setOrderType(type) - Delivery, pickup, dine-in',
      'setDeliveryAddress(address) - For delivery orders'
    ],

    principles: [
      'Generate unique cart item IDs from item + variant + customizations combo',
      'Same item with different options = different cart entries',
      'Never mutate state directly, always return new objects',
      'Tax and fees should be configurable, not hardcoded',
      'Cart should work for guests (no auth required)'
    ],

    connectsTo: ['payments', 'auth', 'tracking']
  },

  // ============================================
  // PAYMENTS PATTERN
  // ============================================
  payments: {
    name: 'Payment Processing',
    purpose: 'Securely collect payment for orders/bookings',

    architecture: `
      Use Stripe Payment Intents flow:
      1. Frontend sends order details to backend
      2. Backend creates PaymentIntent, returns client_secret
      3. Frontend uses Stripe Elements (CardElement) to collect card
      4. Frontend confirms payment with client_secret
      5. Backend webhook or polling confirms payment success
      6. Order status updates to confirmed
    `,

    backendNeeds: `
      - POST /api/orders - Create order + PaymentIntent
      - POST /api/orders/:id/confirm-payment - Confirm payment completed
      - Stripe secret key in environment
      - Order table with payment_intent_id, payment_status fields
    `,

    frontendNeeds: `
      - @stripe/stripe-js and @stripe/react-stripe-js
      - Elements provider wrapping checkout
      - CardElement for secure card input
      - confirmCardPayment() call with client_secret
      - Loading states during payment processing
      - Error handling for declined cards
    `,

    principles: [
      'NEVER send raw card numbers to your server',
      'Always use Stripe Elements for PCI compliance',
      'Show clear loading state during payment',
      'Handle payment failures gracefully with retry option',
      'Store payment_intent_id for refunds/disputes',
      'Webhook is more reliable than polling for confirmation'
    ],

    connectsTo: ['cart', 'auth', 'notifications']
  },

  // ============================================
  // BOOKING / SCHEDULING PATTERN
  // ============================================
  booking: {
    name: 'Appointment Booking',
    purpose: 'Let users schedule appointments or reservations',

    stateShape: `
      Booking state includes:
      - selectedService: what they're booking
      - selectedDate: the day
      - selectedTime: specific time slot
      - availableSlots: fetched from backend
      - customerInfo: name, email, phone, notes
    `,

    architecture: `
      Multi-step booking flow:
      1. Select service/type
      2. Pick date from calendar
      3. Fetch available times for that date
      4. Select time slot
      5. Enter contact info
      6. Confirm booking

      Backend calculates availability based on:
      - Business hours
      - Existing bookings
      - Service duration
      - Buffer time between appointments
    `,

    backendNeeds: `
      - GET /api/services - List bookable services with duration
      - GET /api/availability?date=X&service=Y - Available slots
      - POST /api/bookings - Create booking
      - Booking table: date, time, service_id, customer_id, status
      - Business hours configuration
    `,

    frontendNeeds: `
      - Date picker (can be simple calendar grid)
      - Time slot display (show available, hide/disable unavailable)
      - Multi-step form with validation
      - Confirmation screen with booking details
      - "Add to calendar" link generation
    `,

    principles: [
      'Always fetch fresh availability - never cache slots',
      'Show timezone clearly',
      'Disable past dates and fully booked dates',
      'Require email/phone for confirmation sending',
      'Hold slot temporarily during checkout to prevent double-booking',
      'Send confirmation email/SMS immediately after booking'
    ],

    connectsTo: ['auth', 'notifications', 'payments']
  },

  // ============================================
  // AUTHENTICATION PATTERN
  // ============================================
  auth: {
    name: 'User Authentication',
    purpose: 'User accounts, login, registration, sessions',

    stateShape: `
      Auth state includes:
      - user: {id, email, name, role} or null
      - isAuthenticated: boolean
      - isLoading: boolean (checking session)
      - token: JWT or null
    `,

    architecture: `
      JWT-based authentication:
      1. Register: POST /api/auth/register → returns JWT
      2. Login: POST /api/auth/login → returns JWT
      3. Store JWT in localStorage (or httpOnly cookie for more security)
      4. Send JWT in Authorization header for protected routes
      5. Backend validates JWT, attaches user to request

      Context provides auth state globally:
      - AuthProvider wraps app
      - useAuth() hook for components
      - ProtectedRoute component for guarded pages
    `,

    backendNeeds: `
      - POST /api/auth/register - Create user, return JWT
      - POST /api/auth/login - Validate credentials, return JWT
      - GET /api/auth/me - Get current user from JWT
      - PUT /api/auth/profile - Update user profile
      - POST /api/auth/forgot-password - Send reset email
      - POST /api/auth/reset-password - Reset with token
      - Auth middleware that validates JWT
    `,

    frontendNeeds: `
      - AuthContext with user state
      - Login form with email/password
      - Register form with validation
      - Protected route wrapper
      - Automatic redirect to login for protected pages
      - Token refresh handling (optional)
    `,

    principles: [
      'Hash passwords with bcrypt, never store plaintext',
      'JWT should contain minimal info (id, email, role)',
      'Set reasonable JWT expiry (1-7 days)',
      'Clear token on logout',
      'Handle token expiry gracefully (redirect to login)',
      'Role-based access: check role for admin features'
    ],

    connectsTo: ['admin', 'cart', 'booking', 'tracking']
  },

  // ============================================
  // ORDER TRACKING PATTERN
  // ============================================
  tracking: {
    name: 'Order Tracking',
    purpose: 'Real-time order status updates',

    stateShape: `
      Order tracking state:
      - order: full order object with status
      - status: current status string
      - statusHistory: array of {status, timestamp}
      - estimatedTime: delivery/ready estimate
      - isPolling: boolean
    `,

    architecture: `
      Polling-based real-time updates:
      1. User enters order number or views from account
      2. Fetch order details including status
      3. Poll every 10-30 seconds for status changes
      4. Stop polling when order reaches terminal state (delivered/cancelled)
      5. Show timeline of status progression

      Alternative: WebSocket for true real-time (more complex)
    `,

    statusFlow: `
      Typical order status flow:
      pending → confirmed → preparing → ready → out_for_delivery → delivered

      For pickup:
      pending → confirmed → preparing → ready → picked_up

      Any status can go to: cancelled
    `,

    frontendNeeds: `
      - Order lookup by number (for guests)
      - Order detail display
      - Status timeline/stepper visualization
      - Polling hook with auto-stop
      - Estimated time countdown
      - Refresh button for manual update
    `,

    principles: [
      'Poll every 10-30 seconds, not faster (server load)',
      'Stop polling on terminal status',
      'Show last updated timestamp',
      'Work for guests (order number lookup) and logged-in users',
      'Timeline should show completed, current, and upcoming steps',
      'Handle order not found gracefully'
    ],

    connectsTo: ['auth', 'notifications']
  },

  // ============================================
  // ADMIN DASHBOARD PATTERN
  // ============================================
  admin: {
    name: 'Admin Dashboard',
    purpose: 'Business management, analytics, order management',

    architecture: `
      Tab-based or sidebar navigation:
      - Overview: Key stats, recent activity
      - Orders: List with filters, status management
      - Analytics: Charts, date range selection
      - Settings: Business configuration

      Role-based access:
      - Check user role before showing admin
      - Different roles see different features
    `,

    dataNeeds: `
      Dashboard data:
      - Today's orders count and revenue
      - Comparison to yesterday/last week
      - Active orders count
      - Recent orders list
      - Top selling items

      Analytics data:
      - Daily sales over time
      - Order type breakdown
      - Peak hours
      - Customer metrics
    `,

    backendNeeds: `
      - GET /api/admin/dashboard - Summary stats
      - GET /api/admin/orders - Paginated, filterable
      - PUT /api/orders/:id/status - Update order status
      - GET /api/admin/analytics - Sales data with date range
      - GET /api/admin/settings - Business settings
      - PUT /api/admin/settings - Update settings
    `,

    frontendNeeds: `
      - Stat cards for key metrics
      - Orders table with status badges
      - Status update buttons/dropdowns
      - Date range picker for analytics
      - Simple charts (bar, line)
      - Auto-refresh for real-time feel
    `,

    principles: [
      'Protect all admin routes with role check',
      'Show loading states for all data fetches',
      'Optimistic updates for status changes',
      'Pagination for large order lists',
      'Date range analytics, not all-time by default',
      'Mobile-friendly for on-the-go management'
    ],

    connectsTo: ['auth', 'tracking']
  },

  // ============================================
  // SEARCH / FILTERING PATTERN
  // ============================================
  search: {
    name: 'Search & Filtering',
    purpose: 'Help users find items/content',

    architecture: `
      Client-side for small datasets (<1000 items):
      - Load all items upfront
      - Filter/search in browser
      - Instant results

      Server-side for large datasets:
      - Send search query to backend
      - Backend does database search
      - Return paginated results
    `,

    features: `
      - Text search across multiple fields
      - Category/tag filtering
      - Price range (for products)
      - Sort options (price, name, date, popularity)
      - Active filter display with clear option
    `,

    frontendNeeds: `
      - Search input with debounce (300ms)
      - Filter dropdowns/checkboxes
      - Results count display
      - Clear filters button
      - URL sync for shareable filtered views
    `,

    principles: [
      'Debounce search input to avoid excessive queries',
      'Show "no results" state clearly',
      'Preserve filters on page refresh (URL params)',
      'Show active filters visually',
      'Search should be forgiving (fuzzy match)'
    ],

    connectsTo: ['gallery']
  },

  // ============================================
  // REVIEWS / RATINGS PATTERN
  // ============================================
  reviews: {
    name: 'Reviews & Ratings',
    purpose: 'Social proof, customer feedback',

    architecture: `
      Review display:
      - Star rating (1-5)
      - Review text
      - Reviewer name
      - Date
      - Optional: photos, verified purchase badge

      Review submission:
      - Usually requires auth or order verification
      - Moderation optional
    `,

    backendNeeds: `
      - GET /api/reviews?item=X - Reviews for item
      - POST /api/reviews - Submit review (auth required)
      - Review table: item_id, user_id, rating, text, created_at
      - Aggregate rating calculation
    `,

    frontendNeeds: `
      - Star display component (filled/empty stars)
      - Review list with pagination
      - Review form with star selection
      - Average rating display
      - Rating distribution (optional)
    `,

    principles: [
      'Show aggregate rating prominently',
      'Most recent reviews first',
      'Verify purchase before allowing review (optional)',
      'Handle zero reviews state gracefully',
      'Star selection should be intuitive (click or hover)'
    ],

    connectsTo: ['auth']
  },

  // ============================================
  // CONTACT FORM PATTERN
  // ============================================
  contact: {
    name: 'Contact Form',
    purpose: 'Let visitors send inquiries',

    architecture: `
      Simple form → Backend → Email/Storage:
      1. User fills form (name, email, message, optional fields)
      2. Frontend validates
      3. POST to backend
      4. Backend sends email notification and/or stores in database
      5. Show success message
    `,

    backendNeeds: `
      - POST /api/contact - Receive submission
      - Email service integration (SendGrid, Resend, etc.)
      - Optional: store in database for CRM
      - Rate limiting to prevent spam
    `,

    frontendNeeds: `
      - Form with validation
      - Loading state during submit
      - Success message after submit
      - Error handling
      - Optional: CAPTCHA for spam prevention
    `,

    principles: [
      'Validate email format',
      'Show clear success message',
      'Don\'t clear form until success confirmed',
      'Rate limit submissions',
      'Honeypot field for basic spam prevention'
    ],

    connectsTo: ['notifications']
  },

  // ============================================
  // GALLERY / PORTFOLIO PATTERN
  // ============================================
  gallery: {
    name: 'Image Gallery',
    purpose: 'Showcase photos, work, products',

    architecture: `
      Grid display with lightbox:
      - Responsive grid of thumbnails
      - Click to open full-size in lightbox/modal
      - Navigation between images
      - Optional: categories/filtering
    `,

    frontendNeeds: `
      - Responsive image grid (CSS Grid or Masonry)
      - Lightbox modal with image
      - Previous/next navigation
      - Close button and click-outside-to-close
      - Lazy loading for performance
      - Optional: category filter tabs
    `,

    principles: [
      'Lazy load images for performance',
      'Use appropriate image sizes (thumbnail vs full)',
      'Keyboard navigation in lightbox (arrow keys, escape)',
      'Mobile: swipe gestures',
      'Alt text for accessibility',
      'Preload adjacent images in lightbox'
    ],

    connectsTo: ['search']
  },

  // ============================================
  // LOCATIONS / MAP PATTERN
  // ============================================
  locations: {
    name: 'Locations & Maps',
    purpose: 'Show business locations, enable finding nearest',

    architecture: `
      Location display:
      - List of locations with details
      - Map showing all locations
      - Click location to see details
      - Optional: "Near me" using geolocation
    `,

    dataNeeds: `
      Location data:
      - name, address, phone, hours
      - latitude, longitude (for map)
      - Optional: photos, services available
    `,

    frontendNeeds: `
      - Location cards with info
      - Embedded map (Google Maps, Mapbox, or static)
      - Click to get directions link
      - Hours display with open/closed status
      - Optional: geolocation for nearest
    `,

    principles: [
      'Maps can be static images for simplicity',
      'Or embed Google Maps iframe (free, no API key)',
      'Link to Google Maps for directions',
      'Show open/closed based on current time',
      'Mobile: tap to call phone number'
    ],

    connectsTo: []
  },

  // ============================================
  // PRICING / PLANS PATTERN
  // ============================================
  pricing: {
    name: 'Pricing Display',
    purpose: 'Show pricing tiers, plans, or menus',

    architecture: `
      Pricing table/cards:
      - Multiple tiers side by side
      - Feature comparison
      - Highlighted "recommended" tier
      - CTA button for each tier

      For menus:
      - Categories with items
      - Name, description, price
      - Optional: modifiers, sizes
    `,

    frontendNeeds: `
      - Pricing cards or table
      - Feature checkmarks/comparison
      - Monthly/annual toggle (if applicable)
      - Clear CTA buttons
      - Mobile: stack cards vertically
    `,

    principles: [
      'Highlight most popular/recommended option',
      'Show savings for annual vs monthly',
      'Keep feature comparison scannable',
      'CTA should be clear (Sign Up, Get Started, etc.)',
      'If too many tiers, consider comparison table'
    ],

    connectsTo: ['payments', 'auth']
  },

  // ============================================
  // NOTIFICATIONS PATTERN
  // ============================================
  notifications: {
    name: 'Notifications',
    purpose: 'Email/SMS confirmations and alerts',

    architecture: `
      Backend-triggered notifications:
      - Order confirmation
      - Booking confirmation
      - Status updates
      - Password reset

      Email service (SendGrid, Resend, SES):
      - Template-based emails
      - Variable substitution
    `,

    backendNeeds: `
      - Email service integration
      - Email templates for each notification type
      - Trigger points in order/booking workflows
      - Optional: SMS via Twilio
    `,

    principles: [
      'Send confirmation immediately after action',
      'Include all relevant details in notification',
      'Make emails mobile-friendly',
      'Include unsubscribe for marketing emails',
      'Track delivery/open rates (optional)'
    ],

    connectsTo: ['booking', 'cart', 'auth']
  }
};

/**
 * Get pattern guidance for a specific feature
 */
function getPatternGuidance(feature) {
  return FEATURE_PATTERNS[feature] || null;
}

/**
 * Get all patterns for a list of features
 */
function getPatternsForFeatures(features) {
  return features
    .map(f => ({ feature: f, pattern: FEATURE_PATTERNS[f] }))
    .filter(p => p.pattern !== null);
}

/**
 * Build prompt section for detected features
 * This is what gets injected into the AI generation prompt
 */
function buildFeaturePromptSection(features) {
  const patterns = getPatternsForFeatures(features);

  if (patterns.length === 0) {
    return '';
  }

  let prompt = `\n\n## FEATURE IMPLEMENTATION GUIDANCE\n\n`;
  prompt += `This application requires the following features. Use these architectural patterns while maintaining complete visual freedom:\n\n`;

  for (const { feature, pattern } of patterns) {
    prompt += `### ${pattern.name}\n`;
    prompt += `Purpose: ${pattern.purpose}\n\n`;

    if (pattern.architecture) {
      prompt += `Architecture:\n${pattern.architecture.trim()}\n\n`;
    }

    if (pattern.stateShape) {
      prompt += `State Structure:\n${pattern.stateShape.trim()}\n\n`;
    }

    if (pattern.principles && pattern.principles.length > 0) {
      prompt += `Key Principles:\n`;
      pattern.principles.forEach(p => {
        prompt += `- ${p}\n`;
      });
      prompt += '\n';
    }

    if (pattern.frontendNeeds) {
      prompt += `Frontend Requirements:\n${pattern.frontendNeeds.trim()}\n\n`;
    }

    if (pattern.backendNeeds) {
      prompt += `Backend Requirements:\n${pattern.backendNeeds.trim()}\n\n`;
    }

    prompt += `---\n\n`;
  }

  prompt += `IMPORTANT: These patterns describe WHAT to build, not HOW it should look. `;
  prompt += `You have complete creative freedom for visual design, layout, styling, and UX. `;
  prompt += `Make each implementation unique to this brand and business.\n`;

  return prompt;
}

/**
 * Get a compact version for token efficiency
 */
function buildCompactFeaturePrompt(features) {
  const patterns = getPatternsForFeatures(features);

  if (patterns.length === 0) {
    return '';
  }

  let prompt = `\n\n## REQUIRED FEATURES\n\n`;

  for (const { feature, pattern } of patterns) {
    prompt += `**${pattern.name}**: ${pattern.purpose}\n`;

    if (pattern.principles) {
      prompt += `Key: ${pattern.principles.slice(0, 3).join('; ')}\n`;
    }

    if (pattern.connectsTo && pattern.connectsTo.length > 0) {
      prompt += `Integrates with: ${pattern.connectsTo.join(', ')}\n`;
    }

    prompt += '\n';
  }

  prompt += `Full visual freedom - make it unique to this brand.\n`;

  return prompt;
}

module.exports = {
  FEATURE_PATTERNS,
  getPatternGuidance,
  getPatternsForFeatures,
  buildFeaturePromptSection,
  buildCompactFeaturePrompt
};
