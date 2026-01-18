# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Textpile is a Cloudflare Pages site with Pages Functions and KV storage that enables small-medium communities to post Markdown content instantly without attribution. Posts expire automatically based on user-selected retention windows, and the system requires zero maintenance (no databases, no builds, no manual review).

## Architecture

### Platform: Cloudflare Pages + Functions + KV

- **Static Assets**: Served from `public/` directory
- **Server Functions**: File-based routing in `functions/` directory
- **Storage**: Cloudflare KV namespace (bound as `env.KV`)

### Directory Structure

```
public/
  index.html      # TOC (table of contents) page
  submit.html     # Submission form
  style.css       # Shared styles
functions/
  api/
    index.js      # GET /api/index - returns TOC JSON
    add.js        # POST /api/add - publish new post
    remove.js     # POST /api/remove - admin takedown
  p/
    [id].js       # GET /p/:id - render individual post
```

### Key Routes

- `GET /` - TOC listing (latest posts)
- `GET /submit` - Submission form
- `GET /p/:id` - Individual post view (renders Markdown)
- `GET /api/index` - JSON API for TOC
- `POST /api/submit` - Publish endpoint
- `POST /api/remove` - Admin removal endpoint (optional)

## KV Data Model

### Post Storage
- **Key**: `post:${id}` where ID is sortable timestamp + random suffix
- **Value**: Raw Markdown body text
- **Metadata**: `{ createdAt, title, expiresAt }`
- **TTL**: Automatically expires based on user-selected retention window

### Index Storage
- **Key**: `index`
- **Value**: JSON array of post entries `[{ id, title, createdAt, url, expiresAt, pinned }, ...]`
- **Ordering**: Pinned first, then newest first, capped at 10,000 entries
- **Cleanup**: Expired entries automatically removed during reads and writes

### ID Format
`YYYYMMDDTHHMMSSZ-${random}` - sortable by creation time

## Environment Variables

Configure via Cloudflare Pages Settings → Variables and Secrets:

- `ADD_POST_PASSWORD` (optional) - Shared password to gate adding posts (anti-spam)
- `ADMIN_TOKEN` (optional) - Required for `/api/remove` endpoint

**Behavior**:
- If `ADD_POST_PASSWORD` is unset, adding posts is open to all
- If set, users must provide it in the add post form
- `ADMIN_TOKEN` enables quick takedown via API

## Expiration & Retention Philosophy

**Core Principle**: Textpile is a temporary reading surface, not an archive.

- Posts expire automatically via KV TTL (no cron jobs needed)
- Maintainers do not back up content
- Authors are responsible for retaining their own copies
- Retention windows: 1 week, 1 month, 3 months, 6 months, 1 year (no "forever")

### Expiration Behavior

- When a post expires, KV automatically deletes it
- `/api/index` filters out expired items at read time
- Expired post URLs return **410 Gone** (not 404)
- No background cleanup tasks required

## Development & Deployment

### Local Development

Cloudflare Pages Functions can be tested locally using Wrangler:

```bash
# Install Wrangler CLI
npm install -g wrangler

# Run local dev server
wrangler pages dev public/

# With KV namespace binding for local development
wrangler pages dev public/ --kv=KV
```

### Deployment

1. **Create KV Namespace** in Cloudflare dashboard (e.g., `COMMUNITY_PASTES`)
2. **Create Pages Project** from GitHub repo
3. **Build Settings**:
   - Framework preset: **None**
   - Build command: *(blank)*
   - Output directory: `public`
4. **Add KV Binding**:
   - Settings → Bindings → KV Namespace
   - Variable name: `KV`
   - Select your namespace
5. **Configure Environment Variables** (optional):
   - `ADD_POST_PASSWORD` for add post gating
   - `ADMIN_TOKEN` for admin removal

## Client-Side Rendering

- Markdown rendering uses **marked.js** (loaded from CDN)
- Rendering happens client-side in `/p/:id` to keep Functions lightweight
- HTML escaping is critical for security (prevent XSS)

## Important Coding Patterns

### Template Literal Escaping in Server Functions

**CRITICAL**: When embedding JavaScript code inside template literals in server-side functions (e.g., `functions/p/[id].js`), backslashes in regex patterns must be **double-escaped**.

**Problem**: JavaScript regex patterns use backslashes for escape sequences. When these patterns are inside a template literal that's being constructed server-side, the backslashes are processed during template literal evaluation, causing the regex to break.

**Examples**:

❌ **Wrong** (inside template literal):
```javascript
const html = `<script>
  filename.replace(/\s+/g, ' ')       // \s becomes just s
  filename.replace(/^\.+/, '')        // \. becomes just .
  filename.replace(/[/\\:*?"<>|]/g)   // \\ becomes just \
</script>`;
```

✅ **Correct** (inside template literal):
```javascript
const html = `<script>
  filename.replace(/\\s+/g, ' ')      // \\s → \s in output
  filename.replace(/^\\.+/, '')       // \\. → \. in output
  filename.replace(/[/\\\\:*?"<>|]/g) // \\\\ → \\ in output
</script>`;
```

**Rule of thumb**: When writing JavaScript regex inside a template literal in server functions, double all backslashes:
- `\s` → `\\s`
- `\d` → `\\d`
- `\.` → `\\.`
- `\\` → `\\\\`

**Where this applies**:
- All `functions/**/*.js` files that return HTML with embedded `<script>` tags
- Particularly `functions/p/[id].js` which has extensive client-side JavaScript

## Security Considerations

- No authentication or user identity is collected or stored
- HTML escaping required in all user-generated content displays
- Admin takedown requires `ADMIN_TOKEN` in request body
- Optional `ADD_POST_PASSWORD` prevents open spam posts
- Timing-safe token comparison prevents timing attacks on tokens

## Known Limitations

### Race Condition in Index Updates

The index update operation in `functions/api/add.js` follows a read-modify-write pattern that is susceptible to race conditions if multiple posts are added simultaneously. This is documented in the code and is an acceptable trade-off for low-traffic sites:

```javascript
// Read
const rawIndex = await env.KV.get("index");
let index = rawIndex ? JSON.parse(rawIndex) : [];

// Filter expired entries
const now = Date.now();
index = index.filter(item => {
  if (!item.expiresAt) return true;
  return new Date(item.expiresAt).getTime() > now;
});

// Modify
const entry = { id, title, createdAt, expiresAt, pinned, url };
const next = [entry, ...index];
next.sort((a, b) => {
  if (a.pinned && !b.pinned) return -1;
  if (!a.pinned && b.pinned) return 1;
  return new Date(b.createdAt) - new Date(a.createdAt);
});

// Write (capped at 10,000)
await env.KV.put("index", JSON.stringify(next.slice(0, 10000)));
```

**Impact**: If two posts are submitted at exactly the same time, one entry might be lost from the index. The post itself is still stored and accessible via direct URL.

**Mitigation options** (if needed for high-traffic sites):
- Use Cloudflare Durable Objects for atomic operations
- Implement optimistic locking with version numbers
- Accept eventual consistency (current approach)

### CORS (Cross-Origin Resource Sharing)

**Current state**: CORS headers are NOT configured.

**Impact**: The API endpoints (`/api/index`, `/api/submit`, `/api/remove`) can only be accessed from:
- The same origin (same domain)
- Server-side requests (no origin header)

**When CORS is needed**:
- If you want to build a separate frontend on a different domain
- If you want third-party applications to submit posts via API
- If you want to embed Textpile content in other sites via JavaScript

**How to add CORS** (if needed):

Add headers to API responses in `functions/api/*.js`:

```javascript
return Response.json({ ... }, {
  headers: {
    "Access-Control-Allow-Origin": "*",  // or specific domain
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "cache-control": "no-store",
  },
});
```

And add OPTIONS handlers for preflight requests:

```javascript
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
```

**Recommendation**: Only add CORS if specifically needed. Leaving it disabled provides defense-in-depth against certain attack vectors.

## Quick Takedown

If `ADMIN_TOKEN` is configured:

```bash
curl -X POST https://YOURDOMAIN/api/remove \
  -H 'content-type: application/json' \
  -d '{"id":"PASTE_ID","token":"ADMIN_TOKEN"}'
```

## Design Philosophy

- **Low-maintenance by design**: Zero background jobs, no database migrations
- **Socially legible shutdown**: Clear expectations that service may end if burdensome
- **No implied custody**: Authors responsible for their own content archival
- **Temporary by default**: Forced expiration prevents accidental permanence
- **Non-attributed at artifact layer**: No author metadata stored
