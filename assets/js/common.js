/**
 * Helpers shared by every page. Loaded from the header include.
 */

/* exported escapeHtml, formatDateOnly */

/**
 * Escape text before putting it into HTML so user-entered values can't add markup or scripts.
 * @param {*} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format a stored calendar date (session date, preferred date, ...) as M/D/YYYY.
 * Dates are formatted in UTC so they don't shift back a day in Central time.
 * @param {string|Date} value
 * @returns {string}
 */
function formatDateOnly(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-US', { timeZone: 'UTC' });
}
