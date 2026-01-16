/**
 * File System Utilities
 * Extracted from server.cjs
 */

const fs = require('fs');
const path = require('path');

/**
 * Recursively copy a directory
 * Skips node_modules and .git directories
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDirectorySync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    if (entry.isDirectory()) {
      copyDirectorySync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

module.exports = {
  copyDirectorySync
};
