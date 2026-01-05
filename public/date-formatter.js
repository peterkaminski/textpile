// Textpile Date Formatter - ICU-style format strings
// Supports international date/time formatting with zero dependencies

// Default formats (ISO 8601)
export const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";
export const DEFAULT_TIME_FORMAT = "HH:mm";
export const DEFAULT_DATETIME_FORMAT = "YYYY-MM-DD HH:mm";

// Token regex - matches ICU format tokens
const TOKEN_REGEX = /YYYY|YY|MMMM|MMM|MM|M|dddd|ddd|DD|D|HH|H|hh|h|mm|m|ss|s|a/g;

// Supported tokens list for validation
const SUPPORTED_TOKENS = [
  'YYYY', 'YY',           // Year
  'MMMM', 'MMM', 'MM', 'M', // Month
  'DD', 'D',              // Day
  'dddd', 'ddd',          // Weekday
  'HH', 'H',              // 24-hour
  'hh', 'h',              // 12-hour
  'mm', 'm',              // Minutes
  'ss', 's',              // Seconds
  'a'                     // AM/PM
];

/**
 * Parse ICU format string and extract tokens with their positions
 * @param {string} format - ICU format string (e.g., "YYYY-MM-DD")
 * @returns {Array} Array of { token, index, length } objects
 */
function parseFormatTokens(format) {
  const tokens = [];
  let match;
  const regex = new RegExp(TOKEN_REGEX);

  while ((match = regex.exec(format)) !== null) {
    const token = match[0];
    const index = match.index;

    // For single-letter tokens (m, M, D, d, H, h, s, a), check they're not part of a larger word
    if (token.length === 1) {
      const before = index > 0 ? format[index - 1] : '';
      const after = index + 1 < format.length ? format[index + 1] : '';

      // Skip if surrounded by letters (likely part of a word)
      if (/[a-zA-Z]/.test(before) || /[a-zA-Z]/.test(after)) {
        continue;
      }
    }

    tokens.push({
      token,
      index,
      length: token.length
    });
  }

  return tokens;
}

/**
 * Map ICU token to Intl.DateTimeFormat component
 * @param {string} token - ICU token (e.g., "YYYY", "MM", "HH")
 * @returns {Object} { type, format } for Intl.DateTimeFormat
 */
function mapTokenToIntlComponent(token) {
  const mapping = {
    // Year
    'YYYY': { type: 'year', format: 'numeric' },
    'YY': { type: 'year', format: '2-digit' },

    // Month
    'MMMM': { type: 'month', format: 'long' },
    'MMM': { type: 'month', format: 'short' },
    'MM': { type: 'month', format: '2-digit' },
    'M': { type: 'month', format: 'numeric' },

    // Day
    'DD': { type: 'day', format: '2-digit' },
    'D': { type: 'day', format: 'numeric' },

    // Weekday
    'dddd': { type: 'weekday', format: 'long' },
    'ddd': { type: 'weekday', format: 'short' },

    // Hour (24-hour)
    'HH': { type: 'hour', format: '2-digit', hour12: false },
    'H': { type: 'hour', format: 'numeric', hour12: false },

    // Hour (12-hour)
    'hh': { type: 'hour', format: '2-digit', hour12: true },
    'h': { type: 'hour', format: 'numeric', hour12: true },

    // Minute
    'mm': { type: 'minute', format: '2-digit' },
    'm': { type: 'minute', format: 'numeric' },

    // Second
    'ss': { type: 'second', format: '2-digit' },
    's': { type: 'second', format: 'numeric' },

    // Day period (AM/PM) - use narrow for concise AM/PM
    'a': { type: 'dayPeriod', format: 'narrow' }
  };

  return mapping[token] || null;
}

/**
 * Build Intl.DateTimeFormat options from format string
 * @param {string} format - ICU format string
 * @returns {Object} Options for Intl.DateTimeFormat
 */
function buildIntlOptions(format) {
  const tokens = parseFormatTokens(format);
  const options = {};
  let hour12 = undefined;

  for (const { token } of tokens) {
    const component = mapTokenToIntlComponent(token);
    if (!component) continue;

    const { type, format: formatStyle, hour12: isHour12 } = component;

    // Handle hour12 setting
    if (isHour12 !== undefined) {
      hour12 = isHour12;
    }

    // Set component format
    options[type] = formatStyle;
  }

  // Apply hour12 setting if hour is present
  if (hour12 !== undefined && options.hour) {
    options.hour12 = hour12;
  }

  return options;
}

/**
 * Format date using ICU format string
 * @param {Date} date - Date object to format
 * @param {string} format - ICU format string
 * @param {string} locale - Locale code (default: 'en-US')
 * @returns {string} Formatted date string
 */
function formatWithICU(date, format, locale = 'en-US') {
  try {
    // Parse tokens first to check if 'a' is actually a token
    const tokens = parseFormatTokens(format);
    const hasAmPm = tokens.some(t => t.token === 'a');

    // Build Intl.DateTimeFormat options from format string
    const options = buildIntlOptions(format);

    // Get formatted parts
    const formatter = new Intl.DateTimeFormat(locale, options);
    const parts = formatter.formatToParts(date);

    // Create a map of component types to values
    const componentMap = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        componentMap[part.type] = part.value;
      }
    }

    // Fix midnight issue: Intl may format 00:00 as 24:00 in some locales
    if (componentMap['hour'] === '24') {
      componentMap['hour'] = '00';
    }

    // Manually calculate AM/PM if needed (for cross-platform consistency)
    if (hasAmPm) {
      const hour = date.getHours();
      componentMap['dayPeriod'] = hour >= 12 ? 'PM' : 'AM';
    }

    // Reassemble the format string with actual values
    let result = format;

    // Replace tokens from end to start to maintain correct indices
    for (let i = tokens.length - 1; i >= 0; i--) {
      const { token, index, length } = tokens[i];
      const component = mapTokenToIntlComponent(token);

      if (component && componentMap[component.type]) {
        const value = componentMap[component.type];
        result = result.substring(0, index) + value + result.substring(index + length);
      }
    }

    return result;
  } catch (err) {
    console.warn(`Error formatting date with format "${format}":`, err);
    return null;
  }
}

/**
 * Validate format string
 * @param {string} format - Format string to validate
 * @returns {boolean} True if format is valid
 */
function isValidFormat(format) {
  if (!format || typeof format !== 'string') return false;

  // Check if format contains at least one supported token
  const tokens = parseFormatTokens(format);
  if (tokens.length === 0) return false;

  // Check if all tokens are supported
  for (const { token } of tokens) {
    if (!SUPPORTED_TOKENS.includes(token)) {
      return false;
    }
  }

  return true;
}

/**
 * Format a date string using ICU format string
 * @param {string} dateString - ISO date string
 * @param {string} format - ICU format string (e.g., "YYYY-MM-DD")
 * @param {string} locale - Locale code (default: 'en-US')
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, format, locale = 'en-US') {
  if (!dateString) return "";

  // Validate format
  if (!isValidFormat(format)) {
    console.warn(`Invalid date format: "${format}", falling back to ISO 8601 (${DEFAULT_DATE_FORMAT})`);
    format = DEFAULT_DATE_FORMAT;
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: "${dateString}"`);
      return "";
    }

    const result = formatWithICU(date, format, locale);
    if (result === null) {
      // Fallback failed, use ISO 8601
      return formatWithICU(date, DEFAULT_DATE_FORMAT, locale) || "";
    }

    return result;
  } catch (err) {
    console.warn(`Error formatting date: "${dateString}"`, err);
    return "";
  }
}

/**
 * Format a time string using ICU format string
 * @param {string} dateString - ISO date string
 * @param {string} format - ICU format string (e.g., "HH:mm")
 * @param {string} locale - Locale code (default: 'en-US')
 * @returns {string} Formatted time string
 */
export function formatTime(dateString, format, locale = 'en-US') {
  if (!dateString) return "";

  // Validate format
  if (!isValidFormat(format)) {
    console.warn(`Invalid time format: "${format}", falling back to ISO 8601 (${DEFAULT_TIME_FORMAT})`);
    format = DEFAULT_TIME_FORMAT;
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: "${dateString}"`);
      return "";
    }

    const result = formatWithICU(date, format, locale);
    if (result === null) {
      // Fallback failed, use ISO 8601
      return formatWithICU(date, DEFAULT_TIME_FORMAT, locale) || "";
    }

    return result;
  } catch (err) {
    console.warn(`Error formatting time: "${dateString}"`, err);
    return "";
  }
}

/**
 * Format a date and time string using ICU format strings
 * @param {string} dateString - ISO date string
 * @param {string} dateFormat - ICU date format string (e.g., "YYYY-MM-DD")
 * @param {string} timeFormat - ICU time format string (e.g., "HH:mm")
 * @param {string} locale - Locale code (default: 'en-US')
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(dateString, dateFormat, timeFormat, locale = 'en-US') {
  if (!dateString) return "";

  const datePart = formatDate(dateString, dateFormat, locale);
  const timePart = formatTime(dateString, timeFormat, locale);

  if (!datePart && !timePart) return "";
  if (!datePart) return timePart;
  if (!timePart) return datePart;

  return `${datePart} ${timePart}`;
}
