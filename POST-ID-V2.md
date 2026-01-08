# Post ID v2 - Durable Object Allocator

## Overview

As of v0.6.0, Textpile uses a new ID format for posts: `YYMMDD-slug`

**Example:** `260107-bcf`

This replaces the previous timestamp-based format: `20260107T211418-k4j2n5`

## Why the Change?

### Benefits of v2 IDs

1. **Shorter**: `260107-bcf` (10 chars) vs `20260107T211418-k4j2n5` (22 chars)
2. **More Readable**: Clear date prefix, clean consonant-only slugs
3. **Guaranteed Unique**: Durable Object ensures uniqueness across all Workers
4. **Better UX**: Easier to type, read, and share
5. **URL-friendly**: No special characters, all lowercase

### Alphabet Design

Uses only consonants: `bcdfghjkmnpqrstvwxyz` (20 characters)

**Why consonants only?**
- Avoids accidental words or offensive combinations
- Easier to distinguish (no confusion between 'O' and '0', 'l' and '1')
- Still provides excellent capacity (see below)

## ID Structure

### Format

```
YYMMDD-slug
```

Where:
- `YYMMDD`: UTC date (e.g., `260107` = January 7, 2026)
- `slug`: 2-5 random consonants (e.g., `bcf`)

### Slug Allocation

The system tries progressively longer slugs:

1. **2 characters** (10 attempts) → 400 possibilities per day
2. **3 characters** (10 attempts) → 8,000 possibilities per day
3. **4 characters** (10 attempts) → 160,000 possibilities per day
4. **5 characters** (10 attempts) → 3.2M possibilities per day

**Total capacity:** More than sufficient for any Textpile instance!

### Uniqueness Guarantee

A Durable Object (DO) ensures that each ID is unique:
- All Workers call the same DO instance
- DO uses SQLite storage to track allocations
- Concurrent requests are serialized
- No ID can be allocated twice

## Technical Implementation

### Durable Object: `PostIdAllocator`

**Location:** `src/PostIdAllocator.js`

**Responsibilities:**
- Generate random slugs using Web Crypto API
- Store allocations in SQLite table
- Ensure uniqueness across all requests
- Return allocated IDs to Workers

### Storage Schema

```sql
CREATE TABLE allocations (
  day TEXT NOT NULL,        -- YYMMDD
  slug TEXT NOT NULL,       -- Random consonants
  createdAt TEXT NOT NULL,  -- ISO timestamp
  PRIMARY KEY (day, slug)
);
```

### Allocation Algorithm

```javascript
// 1. Compute UTC day
const day = formatDayUTC(new Date()); // "260107"

// 2. Try lengths [2, 3, 4, 5] with 10 attempts each
for (const { length, tries } of SLUG_ATTEMPTS) {
  for (let attempt = 0; attempt < tries; attempt++) {
    const slug = randomSlug(length);

    // 3. Attempt to insert (will fail if duplicate)
    try {
      await sql.exec(
        `INSERT INTO allocations (day, slug, createdAt) VALUES (?, ?, ?)`,
        day, slug, createdAt
      );

      // Success!
      return `${day}-${slug}`;
    } catch (err) {
      // Collision - retry with new slug
      continue;
    }
  }
}

// 4. All attempts exhausted
throw new Error("allocation_failed");
```

## API Changes

### Submit Endpoint

**Before (v0.5.0):**
```javascript
const id = makeId(); // "20260107T211418-k4j2n5"
```

**After (v0.6.0):**
```javascript
const id = await allocateId(env); // "260107-bcf"
```

### DO Request

Workers call the DO like this:

```javascript
const doId = env.POST_ID_ALLOCATOR.idFromName("global");
const stub = env.POST_ID_ALLOCATOR.get(doId);

const response = await stub.fetch("https://do/allocate", {
  method: "POST"
});

const { id, day, slug } = await response.json();
```

**Response (success):**
```json
{
  "id": "260107-bcf",
  "day": "260107",
  "slug": "bcf"
}
```

**Response (failure):**
```json
{
  "error": "allocation_failed"
}
```

Returns HTTP 503 if all allocation attempts fail.

## Configuration

### Wrangler.toml

```toml
[durable_objects]
bindings = [
  { name = "POST_ID_ALLOCATOR", class_name = "PostIdAllocator", script_name = "textpile" }
]

[[migrations]]
tag = "v1"
new_classes = ["PostIdAllocator"]
```

### Deployment

1. Deploy to Cloudflare Pages
2. DO is automatically created on first use
3. No manual initialization needed

## Migration

### Breaking Change

**v0.6.0 is a breaking change.** Old IDs will no longer be generated.

**However:** Old posts remain accessible at their original URLs. The routing layer continues to work with both ID formats.

### Clearing Old Posts

Since no backwards compatibility is required (test instances only), you can clear all posts:

```bash
# Via Wrangler
wrangler kv:key delete --binding=KV "index"
wrangler kv:key list --binding=KV --prefix="post:" | \
  jq -r '.[].name' | \
  xargs -I {} wrangler kv:key delete --binding=KV "{}"
```

### ID Format Detection

Both formats work in URLs:

- Old: `/p/20260107T211418-k4j2n5` (22 chars, contains `T`)
- New: `/p/260107-bcf` (10 chars, no `T`)

The post renderer doesn't care about ID format - it just fetches by key.

## Testing

### Unit Tests

Located in `src/PostIdAllocator.test.js`:

```bash
npm test
```

**Tests:**
- ✅ `formatDayUTC()` produces correct YYMMDD
- ✅ `randomSlug()` uses only consonants
- ✅ `randomSlug()` generates specified length
- ✅ Slugs are random (no duplicates in 100 samples)
- ✅ IDs match regex: `^[0-9]{6}-[bcdfghjkmnpqrstvwxyz]{2,5}$`

### Integration Tests

Test uniqueness with concurrent allocations:

```javascript
// Allocate 100 IDs concurrently
const promises = Array.from({ length: 100 }, () => allocateId(env));
const ids = await Promise.all(promises);

// All unique?
const unique = new Set(ids);
expect(unique.size).toBe(100);
```

## Performance

### DO Latency

- **Cold start**: ~50-100ms (first request of the day)
- **Warm requests**: ~5-10ms
- **Database writes**: ~1-2ms (SQLite)

**Total allocation time:** ~10-20ms per ID (warm DO)

### Capacity

At typical Textpile scale:
- **Small instance**: <100 posts/day → 2-char slugs (400 capacity)
- **Medium instance**: <1,000 posts/day → 3-char slugs (8,000 capacity)
- **Large instance**: <10,000 posts/day → 4-char slugs (160,000 capacity)

**Collision rate:** Extremely low with 10 attempts per length.

## Troubleshooting

### "allocation_failed" Error

If you see HTTP 503 with `allocation_failed`:

1. **Cause:** All 40 attempts (4 lengths × 10 tries) exhausted
2. **Likelihood:** Virtually impossible at normal scale
3. **Solution:** Retry the request

### DO Not Found

If submit fails with DO binding error:

1. Verify `wrangler.toml` has correct DO binding
2. Redeploy to Cloudflare Pages
3. Check Pages settings for DO bindings

### Testing Locally

```bash
# Install dependencies
npm install

# Run tests
npm test

# Test with wrangler (requires DO support)
wrangler pages dev public/
```

**Note:** Local DO support requires Wrangler 3.0+

## See Also

- [Specification](Textpile%20Post%20ID%20v2%20Implementation%20Spec%20(Durable%20Object%20Allocator).md) - Full implementation spec
- [CHANGELOG.md](CHANGELOG.md) - v0.6.0 release notes
- [Cloudflare DO Docs](https://developers.cloudflare.com/durable-objects/) - Official documentation
