// Post ID Allocator (KV-only)
// Implements claim+verify protocol for unique ID allocation

const SAFE_ALPHABET = 'bcdfghjkmnpqrstvwxyz';
const CLAIM_TTL_SECONDS = 60;
const ATTEMPTS_LEN2 = 10;
const ATTEMPTS_LEN3 = 10;

/**
 * Format UTC date as YYMMDD
 * @param {Date} date
 * @returns {string} YYMMDD format
 */
export function formatDayUTC(date) {
  const year = date.getUTCFullYear() % 100;
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  return String(year).padStart(2, '0') +
         String(month).padStart(2, '0') +
         String(day).padStart(2, '0');
}

/**
 * Generate random nonce from SAFE_ALPHABET
 * @param {2|3} length
 * @returns {string}
 */
export function randomNonce(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let nonce = '';
  for (let i = 0; i < length; i++) {
    const index = bytes[i] % SAFE_ALPHABET.length;
    nonce += SAFE_ALPHABET[index];
  }

  return nonce;
}

/**
 * Generate a cryptographically random token (UUID v4)
 * @returns {string}
 */
function generateToken() {
  return crypto.randomUUID();
}

/**
 * Attempt to allocate a single ID using claim+verify protocol
 * @param {KVNamespace} kv
 * @param {string} id - Candidate ID
 * @returns {Promise<string|null>} The ID if successful, null if collision
 */
async function tryAllocateId(kv, id) {
  const token = generateToken();
  const claimKey = `claim:${id}`;
  const postKey = `post:${id}`;

  // Step 1: Write claim
  await kv.put(claimKey, token, { expirationTtl: CLAIM_TTL_SECONDS });

  // Step 2: Verify claim ownership (minimum cache TTL)
  const token2 = await kv.get(claimKey, { cacheTtl: 30 });
  if (token2 !== token) {
    // Another writer owns the claim
    return null;
  }

  // Step 3: Check post existence (minimum cache TTL)
  const existing = await kv.get(postKey, { cacheTtl: 30 });
  if (existing !== null) {
    // ID already taken
    return null;
  }

  // Success - return the token so caller can verify write
  return token;
}

/**
 * Allocate a unique post ID using KV claim+verify protocol
 * @param {KVNamespace} kv
 * @returns {Promise<{id: string, allocToken: string}>}
 * @throws {Error} If allocation fails after all attempts
 */
export async function allocatePostIdKv(kv) {
  const day = formatDayUTC(new Date());

  // Try 2-letter nonces
  for (let i = 0; i < ATTEMPTS_LEN2; i++) {
    const nonce = randomNonce(2);
    const id = `${day}-${nonce}`;

    const token = await tryAllocateId(kv, id);
    if (token) {
      return { id, allocToken: token };
    }
  }

  // Try 3-letter nonces
  for (let i = 0; i < ATTEMPTS_LEN3; i++) {
    const nonce = randomNonce(3);
    const id = `${day}-${nonce}`;

    const token = await tryAllocateId(kv, id);
    if (token) {
      return { id, allocToken: token };
    }
  }

  // All attempts exhausted
  throw new Error('allocation_failed');
}
