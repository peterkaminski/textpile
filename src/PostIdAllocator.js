// Textpile Post ID v2 - Durable Object Allocator
// Allocates unique IDs in format: YYMMDD-slug
// Example: 260107-bcf

const ALPHABET = 'bcdfghjkmnpqrstvwxyz'; // 20 consonants
const SLUG_ATTEMPTS = [
  { length: 2, tries: 10 },
  { length: 3, tries: 10 },
  { length: 4, tries: 10 },
  { length: 5, tries: 10 },
];

export class PostIdAllocator {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async initialize() {
    // Initialize SQLite table for allocations
    await this.state.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS allocations (
        day TEXT NOT NULL,
        slug TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (day, slug)
      )
    `);
  }

  async fetch(request) {
    await this.initialize();

    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/allocate') {
      return await this.allocate();
    }

    return new Response('Not Found', { status: 404 });
  }

  async allocate() {
    const now = new Date();
    const day = formatDayUTC(now);
    const createdAt = now.toISOString();

    // Try progressively longer slugs
    for (const { length, tries } of SLUG_ATTEMPTS) {
      for (let attempt = 0; attempt < tries; attempt++) {
        const slug = randomSlug(length);
        const id = `${day}-${slug}`;

        try {
          // Attempt to insert the allocation
          await this.state.storage.sql.exec(
            `INSERT INTO allocations (day, slug, createdAt) VALUES (?, ?, ?)`,
            day,
            slug,
            createdAt
          );

          // Success! Return the allocated ID
          return Response.json({
            id,
            day,
            slug
          });
        } catch (err) {
          // Primary key conflict - slug already allocated, try again
          if (err.message && err.message.includes('UNIQUE constraint failed')) {
            continue;
          }
          // Other error - rethrow
          throw err;
        }
      }
    }

    // Failed to allocate after all attempts
    return Response.json(
      { error: 'allocation_failed' },
      { status: 503 }
    );
  }
}

/**
 * Format UTC date as YYMMDD
 * @param {Date} date
 * @returns {string} YYMMDD string
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
 * Generate random slug of specified length using consonant alphabet
 * @param {number} length
 * @returns {string} Random slug
 */
export function randomSlug(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let slug = '';
  for (let i = 0; i < length; i++) {
    const index = bytes[i] % ALPHABET.length;
    slug += ALPHABET[index];
  }

  return slug;
}
