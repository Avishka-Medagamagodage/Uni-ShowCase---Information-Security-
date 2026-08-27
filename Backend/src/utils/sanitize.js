/**
 * Utility functions for input sanitization and regex safety
 */

/**
 * Escapes characters with special meaning in Regular Expressions.
 * Prevents Regular Expression Denial of Service (ReDoS) and regex query injection.
 * @param {string} str 
 * @returns {string}
 */
const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Validates that a given URL string uses strictly http: or https: protocol.
 * Prevents javascript:, data:, vbscript:, and other dangerous XSS schemes.
 * @param {string} urlString 
 * @returns {boolean}
 */
const isValidHttpUrl = (urlString) => {
  if (!urlString) return true;
  if (typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();
  if (trimmed === '') return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (err) {
    return false;
  }
};

/**
 * Sanitizes a URL string, returning safe http/https URL or empty string.
 * @param {string} urlString 
 * @returns {string}
 */
const sanitizeUrl = (urlString) => {
  if (!urlString || typeof urlString !== 'string') return '';
  const trimmed = urlString.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
    return '';
  } catch (err) {
    return '';
  }
};

module.exports = {
  escapeRegex,
  isValidHttpUrl,
  sanitizeUrl
};
