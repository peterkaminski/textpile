# Textpile Post ID v2 Implementation Spec (Durable Object Allocator)

## Overview

Implement a Durable Object (DO) that allocates unique post IDs in the format:

```
YYMMDD-<slug>
```

Example: `260107-bcf`

The DO is the sole allocator of new IDs. Posts continue to be stored in Workers KV (or the existing storage layer) under `post:<id>`.

## ID Format

### Date prefix

- `YYMMDD` using **UTC date** from `new Date()` at allocation time.
- `YY = (UTC full year % 100)`, zero-padded to 2 digits.
- `MM` and `DD` zero-padded to 2 digits.

### Slug

- Lowercase letters only, drawn from this fixed alphabet:

```
bcdfghjkmnpqrstvwxyz
```

- Slug lengths attempted in this order:
  - 2 characters: 10 attempts
  - 3 characters: 10 attempts
  - 4 characters: 10 attempts
  - 5 characters: 10 attempts
- If all attempts fail, allocation fails.

### Final ID

```
{YYMMDD}-{slug}
```

## Durable Object: `PostIdAllocator`

### Binding name

```
POST_ID_ALLOCATOR
```

### DO name/class

```
PostIdAllocator
```

### DO responsibilities

- Allocate a unique slug for a given UTC day.
- Ensure uniqueness by persisting allocations in DO SQLite-backed storage.

### Storage schema (SQLite via DO storage)

Create a table:

- `allocations`
  - `day TEXT NOT NULL`
  - `slug TEXT NOT NULL`
  - `createdAt TEXT NOT NULL` (ISO string)
  - `PRIMARY KEY (day, slug)`

### Allocation algorithm

Given `day = YYMMDD` (UTC):

For each `len` in `[2, 3, 4, 5]`:

- Repeat up to 10 times:
  1. Generate `slug` of length `len` using cryptographically secure randomness and the alphabet above.
  2. Attempt to insert:
     - `INSERT INTO allocations (day, slug, createdAt) VALUES (?, ?, ?)`
  3. If insert succeeds, return the allocated ID:
     - `id = `${day}-${slug}``
     - `createdAt = now.toISOString()`
  4. If insert fails due to primary-key conflict, retry with a new random slug.

If no slug can be allocated after all attempts, return an error.

## Worker API changes

### Replace current ID generation

Replace the current `makeId()` in `functions/api/submit.js` with an async allocation call to the DO.

### DO allocation call flow (in submit handler)

1. Compute `createdAt = new Date().toISOString()` for the post record.
2. Request a new ID from the DO.
3. Store the post under the existing storage keys (e.g., KV):
   - Key: `post:<id>`
   - Value includes at minimum: `id`, `createdAt`, and existing post fields.

### DO request interface

The Worker must call the DO using a fixed DO instance name (singleton allocator), e.g.:

- `env.POST_ID_ALLOCATOR.idFromName("global")`

The Worker sends a request:

- `POST /allocate`

No request body required.

### DO response (success)

HTTP 200 JSON:

```json
{
  "id": "260107-bcf",
  "day": "260107",
  "slug": "bcf"
}
```

### DO response (failure)

HTTP 503 JSON:

```json
{
  "error": "allocation_failed"
}
```

## Routing compatibility

### No backwards compatibility needed

No backwards compatibility  is required; only test instances are currently deployed, and we can clear all posts from them.

## Wrangler configuration

### Add Durable Object binding

Update `wrangler.toml`:

- Declare the DO binding `POST_ID_ALLOCATOR` referencing class `PostIdAllocator`.
- Add required migrations block for the DO class.

(Implementor must follow Cloudflare’s standard DO binding + migrations format used in Workers projects.)

## Implementation details

### Random slug generation

- Use cryptographically secure randomness (Web Crypto).
- Each character is chosen uniformly from the alphabet string.

### UTC day formatting

Compute `YYMMDD` from UTC components.

## Data consistency rules

- The DO is the only component responsible for uniqueness.
- The Worker must not generate IDs locally.
- Storing the post under `post:<id>` must be performed only after a successful DO allocation.

## Testing requirements

### Unit tests

- `formatDayUTC()` returns correct `YYMMDD`.
- `randomSlug(len)` uses only the allowed alphabet and correct length.

### Integration tests

- Concurrent allocations (e.g., 100 allocations) produce unique IDs.
- IDs match regex: `^[0-9]{6}-[bcdfghjkmnpqrstvwxyz]{2,5}$`
- Legacy IDs still resolve through existing routing.

## Deliverables / files touched

- Add DO class implementation file (location consistent with repo conventions).
- Update `functions/api/submit.js` to use DO allocation and remove timestamp-based `makeId()`.
- Update `wrangler.toml` with DO binding + migrations.
- Add/adjust tests per above.