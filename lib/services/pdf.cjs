/**
 * PDF Services
 * Extracted from server.cjs
 *
 * Handles: PDF text extraction
 */

/**
 * Extract text from a PDF file (base64 encoded)
 */
async function extractPdfText(base64Data) {
  try {
    const pdf = require('pdf-parse');
    const buffer = Buffer.from(base64Data, 'base64');
    const data = await pdf(buffer);
    return data.text;
  } catch (err) {
    console.log('   ⚠️ PDF parsing failed:', err.message);
    return null;
  }
}

module.exports = {
  extractPdfText
};
