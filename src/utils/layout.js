/**
 * Layout Utilities
 * Helper functions for responsive layout handling
 */

import { BREAKPOINTS } from '../constants';

/**
 * Get responsive layout mode based on width
 */
export function getLayoutMode(width) {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  if (width < BREAKPOINTS.desktop) return 'desktop';
  return 'largeDesktop';
}
