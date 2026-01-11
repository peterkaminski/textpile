// Authentication utilities for Textpile

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Uses SHA-256 hashing to ensure constant-time comparison.
 * 
 * @param {string} a - First string to compare
 * @param {string} b - Second string to compare
 * @returns {Promise<boolean>} - True if strings are equal, false otherwise
 */
export async function timingSafeEqual(a, b) {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  const result = await crypto.subtle.digest("SHA-256", aBytes);
  const result2 = await crypto.subtle.digest("SHA-256", bBytes);
  const a32 = new Uint32Array(result);
  const b32 = new Uint32Array(result2);
  let diff = 0;
  for (let i = 0; i < a32.length; i++) {
    diff |= a32[i] ^ b32[i];
  }
  return diff === 0;
}
