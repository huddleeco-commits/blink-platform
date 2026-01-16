/**
 * Visual Archetypes Configuration
 * Extracted from server.cjs
 *
 * Forces AI to use different structural layout molds
 */

const VISUAL_ARCHETYPES = {
  'bento': "Use a 'Bento Box' layout with varying card sizes, rounded corners (24px+), and subtle borders. Avoid standard full-width rows.",
  'split': "Use a heavy 'Split-Screen' approach where text is locked to one side and imagery/interactables are locked to the other.",
  'editorial': "Use an 'Editorial' style with massive overlapping typography, high whitespace (150px+ padding), and asymmetrical image placement.",
  'minimal-stack': "Use an ultra-minimal 'Center Stack'. Everything is centered, zero borders, using only typography and whitespace to create hierarchy.",
  'glassmorphic': "Use a 'Glassmorphic' depth style with frosted glass panels, soft blurs (backdrop-filter), and vibrant background gradients."
};

module.exports = {
  VISUAL_ARCHETYPES
};
