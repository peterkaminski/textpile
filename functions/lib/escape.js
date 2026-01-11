// String escaping utilities for Textpile

/**
 * Escape special characters for safe HTML rendering.
 * Converts characters that have special meaning in HTML to their entity equivalents.
 * Uses HTML5 standard &#39; for single quotes.
 * 
 * @param {string} s - String to escape
 * @returns {string} - HTML-safe string with special characters escaped
 * 
 * @example
 * escapeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
export function escapeHtml(s) {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({ 
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

/**
 * Escape special characters for safe XML rendering.
 * Converts characters that have special meaning in XML to their entity equivalents.
 * Uses XML standard &apos; for single quotes (different from HTML).
 * 
 * @param {string} s - String to escape
 * @returns {string} - XML-safe string with special characters escaped
 * 
 * @example
 * escapeXml("Tom's <book> & Jerry's \"show\"")
 * // Returns: 'Tom&apos;s &lt;book&gt; &amp; Jerry&apos;s &quot;show&quot;'
 */
export function escapeXml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
