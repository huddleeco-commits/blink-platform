/**
 * Page Name Utilities
 * Extracted from server.cjs
 *
 * Converts page IDs to various formats:
 * - Component names (PascalCase)
 * - File names
 * - Route paths
 * - Navigation labels
 */

/**
 * Convert page ID to valid JS component name
 * "franchise-opportunities" → "FranchiseOpportunities"
 * "Order Online" → "OrderOnline"
 * "about-us" → "AboutUs"
 * @param {string} pageId
 * @returns {string}
 */
function toComponentName(pageId) {
  if (!pageId) return 'Unknown';
  return pageId
    .replace(/[^a-zA-Z0-9\s-]/g, '')  // Remove special chars except spaces and hyphens
    .split(/[\s-]+/)                   // Split by spaces or hyphens
    .filter(part => part.length > 0)   // Remove empty parts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert page ID to file-safe name (for .jsx files)
 * "Order Online" → "OrderOnlinePage"
 * @param {string} pageId
 * @returns {string}
 */
function toPageFileName(pageId) {
  return toComponentName(pageId) + 'Page';
}

/**
 * Convert page ID to URL-safe route path
 * "Order Online" → "/order-online"
 * "About Us" → "/about-us"
 * "home" → "/"
 * @param {string} pageId
 * @returns {string}
 */
function toRoutePath(pageId) {
  if (!pageId) return '/unknown';
  const slug = pageId
    .replace(/[^a-zA-Z0-9\s-]/g, '')  // Remove special chars
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');            // Replace spaces with hyphens
  return slug === 'home' ? '/' : `/${slug}`;
}

/**
 * Convert page ID to display label
 * "about-us" → "About Us"
 * "Order Online" → "Order Online"
 * @param {string} pageId
 * @returns {string}
 */
function toNavLabel(pageId) {
  if (!pageId) return 'Unknown';
  return pageId
    .replace(/[^a-zA-Z0-9\s-]/g, '')  // Remove special chars
    .split(/[\s-]+/)                   // Split by spaces or hyphens
    .filter(part => part.length > 0)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

module.exports = {
  toComponentName,
  toPageFileName,
  toRoutePath,
  toNavLabel
};
