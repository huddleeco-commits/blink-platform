/**
 * Services Index
 * Re-exports all service functions
 */

const { extractPdfText } = require('./pdf.cjs');
const { fetchPexelsVideo, getIndustryVideo, videoCache } = require('./video.cjs');

module.exports = {
  extractPdfText,
  fetchPexelsVideo,
  getIndustryVideo,
  videoCache
};
