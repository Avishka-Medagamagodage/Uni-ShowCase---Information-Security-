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

module.exports = {
  escapeRegex
};
