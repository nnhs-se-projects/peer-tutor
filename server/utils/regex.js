/**
 * Helpers for building safe regular expressions from user-supplied text.
 */

// Escape characters that have a special meaning inside a regular expression
const escapeRegex = input => String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Case-insensitive regular expression that only matches the whole value
const exactMatch = input => new RegExp(`^${escapeRegex(String(input).trim())}$`, 'i');

module.exports = { escapeRegex, exactMatch };
