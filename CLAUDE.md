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
- `PUBLIC_SOURCE_ZIP` (optional) - Set to `"true"` to generate downloadable source zip during build (default: disabled)
- `SOFTWARE_NAME` (optional) - Software name displayed in footer (default: "Textpile"). Use for fork rebranding.

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
   - Build command: `npm run build`
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

**CRITICAL**: When embedding JavaScript code inside template literals in server-side functions (e.g., `functions/p/[id].js`), certain JavaScript syntax must be **escaped** because the server-side template literal processes it first.

**Problem**: When you write JavaScript code inside a server-side template literal (backtick string), the server evaluates the template literal syntax before sending it to the browser. This means backslashes, template literal syntax, and other special characters get processed twice - once server-side, once client-side.

**What needs escaping in server-side template literals**:

1. **Backslashes in regex patterns** - must be doubled:
   - `\s` → `\\s`
   - `\d` → `\\d`
   - `\.` → `\\.`
   - `\\` → `\\\\`

2. **Template literal syntax** - must be escaped with backslash:
   - Backticks: `` ` `` → `` \` ``
   - Dollar-brace: `${expr}` → `\${expr}`

**Examples**:

❌ **Wrong** (inside server-side template literal):
```javascript
const html = `<script>
  filename.replace(/\s+/g, ' ')           // \s becomes just s (broken)
  const msg = \`Hello \${name}\`;         // Evaluated server-side (broken)
  const days = \`\${count} days\`;        // Evaluated server-side (broken)
</script>`;
```

✅ **Correct** (inside server-side template literal):
```javascript
const html = `<script>
  filename.replace(/\\s+/g, ' ')          // \\s → \s in output ✓
  const msg = \\\`Hello \\\${name}\\\`;   // \` and \$ escaped ✓
  const days = \\\`\\\${count} days\\\`;  // Template literal preserved ✓
</script>`;
```

**Where this applies**:
- **ONLY** in `functions/**/*.js` files that return HTML with embedded `<script>` tags
- Particularly `functions/p/[id].js` which has extensive client-side JavaScript
- **Does NOT apply** to client-side files like `public/**/*.html` or `public/**/*.js`

**Where this does NOT apply**:
- Regular `<script>` tags in `public/**/*.html` files - use normal JavaScript syntax
- Standalone `.js` files in `public/` directory - use normal JavaScript syntax
- Client-side JavaScript code that isn't being embedded in a server-side template literal

**Quick check**: If you're editing a file in `functions/` that builds an HTML string with embedded JavaScript, you need escaping. If you're editing a file in `public/`, you don't.

### Source Zip Generation

The build process can optionally generate a source zip using `git archive`:

```bash
# Only runs when PUBLIC_SOURCE_ZIP="true"
./scripts/build-source-zip.sh
```

**Key points:**
- Uses `git archive` to automatically exclude node_modules and untracked files
- Reads version from `public/version.js` (source of truth)
- Outputs to `public/assets/textpile-{version}-source.zip`

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

## Release Process

**IMPORTANT**: When creating a new release, follow the documented process in CONTRIBUTING.md exactly. Do not skip steps.

### Version Numbering

Textpile follows [Semantic Versioning](https://semver.org/):
- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): New features (backwards compatible)
- **PATCH** (0.0.X): Bug fixes

### Required Steps

**Complete all steps in order:**

1. **Update version in source**
   ```bash
   # Edit public/version.js
   export const TEXTPILE_VERSION = "0.10.0";
   ```

2. **Run version sync script**
   ```bash
   npm run update-version
   ```
   This auto-updates: README.md, CONFIGURATION.md, package.json

3. **Update CHANGELOG.md**
   - Add new version section with date
   - List changes under categories: Added, Changed, Fixed, Security, etc.
   - Note breaking changes with `⚠️ BREAKING CHANGES`

4. **Commit and tag**
   ```bash
   git add -A
   git commit -m "Release v0.10.0"
   git tag -a v0.10.0 -m "Release v0.10.0"
   ```
   **CRITICAL**: The git tag step is required - do not skip it.

5. **Push to GitHub with tags**
   ```bash
   git push origin main --tags
   ```
   **CRITICAL**: Use `--tags` flag to push the release tag.

6. **Verify deployment**
   - Check Cloudflare Pages deployment succeeds
   - Verify tag exists on GitHub
   - Test production site

### Release Checklist

- [ ] Updated `public/version.js` with new version number
- [ ] Ran `npm run update-version` successfully
- [ ] Updated `CHANGELOG.md` with release notes
- [ ] Committed with `Release vX.Y.Z` message
- [ ] Created git tag with `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
- [ ] Pushed with `--tags` using `git push origin main --tags`
- [ ] Verified tag exists on GitHub
- [ ] Verified Cloudflare deployment succeeded
- [ ] Tested production site

### Version Files

- **Source of truth**: `public/version.js` (manually edited)
- **Auto-updated**: `README.md`, `CONFIGURATION.md`, `package.json` (via script)
- **Manual**: `CHANGELOG.md` (add release notes manually)
