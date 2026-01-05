# Textpile v0.3.0 Implementation Plan

**Started:** 2026-01-04
**Target Version:** v0.3.0
**Status:** IN PROGRESS

This document tracks implementation of major enhancements to Textpile. Check off items as completed to track progress.

---

## Phase 1: Troubleshooting Documentation

- [x] Add troubleshooting section to INSTALLATION.md
  - [x] Common 500 error (KV binding + redeploy)
  - [x] Other deployment issues

**Files to modify:**
- `INSTALLATION.md` ✅

---

## Phase 2: Simple UI Changes & Config Variables

### UI Text Changes
- [x] Replace "Submit" with "Add Post"
  - [x] `public/index.html` (navigation link)
  - [x] `public/submit.html` (header, button text)
  - [x] `functions/p/[id].js` (navigation link)
- [x] Replace "TOC" with "Home"
  - [x] `public/submit.html` (navigation link)
  - [x] `functions/p/[id].js` (navigation link)

### Post ID Format
- [x] Remove milliseconds from post IDs
  - [x] Update `makeId()` in `functions/api/submit.js`
  - [x] Test: IDs now format as YYYYMMDDTHHMMSS-random

### Configuration Variables
- [x] `COMMUNITY_NAME` - Replace "the community" in prose
  - [x] Default: "the community"
  - [x] Created `/api/config` endpoint
  - [x] Created `public/textpile-utils.js` utility library
  - [x] Update `public/index.html` description

- [x] `ADMIN_EMAIL` - Footer contact info
  - [x] Default: null (no footer shown)
  - [x] Add footer component to all pages
  - [x] Update `public/index.html`
  - [x] Update `public/submit.html`
  - [x] Update `functions/p/[id].js`

- [x] `DEFAULT_RETENTION` - Default retention period
  - [x] Default: "1month"
  - [x] Valid values: 1week, 1month, 3months, 6months, 1year
  - [x] Update `public/submit.html` (select default)

- [x] `DATE_FORMAT` - Date display format
  - [x] Default: "medium" (Jan 4, 2026)
  - [x] Options: short, medium, long, full
  - [x] Update date rendering in all pages
  - [x] Created formatDateTime helpers

- [x] `TIME_FORMAT` - Time display format
  - [x] Default: "short" (1:23 PM, no seconds)
  - [x] Options: short (no seconds), medium (with seconds)
  - [x] Update time rendering in all pages

**Files created:**
- `functions/api/config.js` ✅
- `public/textpile-utils.js` ✅

**Files modified:**
- `public/index.html` ✅
- `public/submit.html` ✅
- `functions/p/[id].js` ✅
- `functions/api/submit.js` ✅
- `public/style.css` ✅

---

## Phase 3: Admin Interface

### Admin Page (`/admin`)
- [x] Create `public/admin.html`
  - [ ] Token authentication form
  - [ ] Post list with checkboxes
  - [ ] Delete selected button
  - [ ] Export all posts button
  - [ ] Import posts form
  - [ ] Clear all posts button (with confirmation)
  - [ ] Storage statistics display
  - [ ] Audit log viewer

### Admin API Endpoints
- [ ] `functions/api/admin/posts.js` - GET list of all posts
  - [ ] Verify ADMIN_TOKEN
  - [ ] Return all posts with metadata
  - [ ] Include storage size estimates

- [ ] `functions/api/admin/export.js` - GET export posts
  - [ ] Verify ADMIN_TOKEN
  - [ ] Export as JSONL (one post per line)
  - [ ] Include all metadata

- [ ] `functions/api/admin/import.js` - POST import posts
  - [ ] Verify ADMIN_TOKEN
  - [ ] Parse JSONL format
  - [ ] Validate post structure
  - [ ] Store posts with original metadata
  - [ ] Update index

- [ ] `functions/api/admin/clear.js` - POST clear all posts
  - [ ] Verify ADMIN_TOKEN
  - [ ] Delete all post:* keys
  - [ ] Reset index to []
  - [ ] Log action to audit log

- [ ] `functions/api/admin/stats.js` - GET storage statistics
  - [ ] Verify ADMIN_TOKEN
  - [ ] Count total posts
  - [ ] Estimate total storage used
  - [ ] Breakdown by retention period
  - [ ] Warn if approaching limits

- [ ] Update `functions/api/remove.js` - Enhanced for batch
  - [ ] Accept single ID or array of IDs
  - [ ] Log each deletion to audit log

### Audit Logging
- [ ] Implement audit log storage in KV
  - [ ] Key: `audit_log`
  - [ ] Value: Array of log entries (capped at 1000)
  - [ ] Entry format: `{timestamp, action, ip, userAgent, details}`

- [ ] Log post submissions
  - [ ] Update `functions/api/submit.js`
  - [ ] Capture IP from CF-Connecting-IP header
  - [ ] Capture User-Agent

- [ ] Log post deletions
  - [ ] Update `functions/api/remove.js`
  - [ ] Log admin who deleted (from token)

- [ ] Log admin actions
  - [ ] Import, export, clear all

**Files to create:**
- `public/admin.html`
- `functions/api/admin/posts.js`
- `functions/api/admin/export.js`
- `functions/api/admin/import.js`
- `functions/api/admin/clear.js`
- `functions/api/admin/stats.js`

**Files to modify:**
- `functions/api/submit.js` (add audit logging)
- `functions/api/remove.js` (add audit logging, batch support)
- `public/style.css` (admin page styles)

---

## Phase 4: Post Enhancements

### Toggle Markdown Rendering
- [ ] Add toggle button to post view
  - [ ] Update `functions/p/[id].js`
  - [ ] Button: "View as plain text" / "View formatted"
  - [ ] Client-side JavaScript to toggle
  - [ ] Preserve raw markdown in data attribute

### Copy Post Text
- [ ] Add copy button to post view
  - [ ] Update `functions/p/[id].js`
  - [ ] Copy icon/button
  - [ ] JavaScript to copy raw markdown to clipboard
  - [ ] Toast/feedback on successful copy

### Pin Posts
- [ ] Add `pinned` flag to post metadata
  - [ ] Update `functions/api/submit.js` (accept pinned parameter)
  - [ ] Update index sorting (pinned posts first)
  - [ ] Update `functions/api/index.js` (sort pinned to top)
  - [ ] Add visual indicator on index (📌 icon)
  - [ ] Admin interface: checkbox to pin/unpin posts

**Files to modify:**
- `functions/p/[id].js`
- `functions/api/submit.js`
- `functions/api/index.js`
- `public/style.css`

---

## Phase 5: RSS Feed

- [ ] Create `functions/feed.xml.js` (or `functions/rss.js`)
  - [ ] Generate RSS 2.0 XML
  - [ ] Include last 50 posts (or configurable)
  - [ ] Proper XML escaping
  - [ ] Include pub date, description
  - [ ] Link to full post

- [ ] Add RSS link to homepage
  - [ ] Update `public/index.html`
  - [ ] Add `<link rel="alternate" type="application/rss+xml">`
  - [ ] Add visible RSS link/icon

**Files to create:**
- `functions/feed.xml.js`

**Files to modify:**
- `public/index.html`

---

## Phase 6: Size Limits & Validation

### Configuration Variables
- [ ] `MAX_POST_SIZE` - Maximum post size
  - [ ] Default: 1048576 (1 MB in bytes)
  - [ ] Enforce in submit.js
  - [ ] Add to INSTALLATION.md docs

- [ ] `WARN_POST_SIZE` - Warning threshold
  - [ ] Default: 786432 (750 KB in bytes)
  - [ ] Show warning in UI
  - [ ] Add to INSTALLATION.md docs

- [ ] `MAX_KV_SIZE` - Maximum total storage
  - [ ] Default: 1048576000 (1000 MB in bytes)
  - [ ] Check in admin stats
  - [ ] Warn when approaching limit
  - [ ] Add to INSTALLATION.md docs

### Client-Side Validation
- [ ] Update `public/submit.html`
  - [ ] Calculate body size on input
  - [ ] Show size indicator
  - [ ] Warn at WARN_POST_SIZE threshold
  - [ ] Block submit if over MAX_POST_SIZE

### Server-Side Validation
- [ ] Update `functions/api/submit.js`
  - [ ] Check post size before storing
  - [ ] Return 413 Payload Too Large if exceeded
  - [ ] Clear error message with size info

### Admin Statistics
- [ ] Update `functions/api/admin/stats.js`
  - [ ] Calculate estimated total storage
  - [ ] Show as percentage of MAX_KV_SIZE
  - [ ] Warn if over 80%
  - [ ] Error if over 95%

**Files to modify:**
- `public/submit.html`
- `functions/api/submit.js`
- `functions/api/admin/stats.js`
- `INSTALLATION.md`

---

## Phase 7: Documentation Updates

### INSTALLATION.md
- [ ] Add troubleshooting section
- [ ] Document all new config variables
  - [ ] COMMUNITY_NAME
  - [ ] ADMIN_EMAIL
  - [ ] DEFAULT_RETENTION
  - [ ] DATE_FORMAT
  - [ ] TIME_FORMAT
  - [ ] MAX_POST_SIZE
  - [ ] WARN_POST_SIZE
  - [ ] MAX_KV_SIZE
- [ ] Add /admin page setup instructions

### ADMIN-GUIDE.md
- [ ] Add admin interface documentation
  - [ ] How to access /admin
  - [ ] Post management (list, delete, batch delete)
  - [ ] Export/import procedures
  - [ ] Clear all posts procedure
  - [ ] Pin posts functionality
- [ ] Add audit log documentation
  - [ ] What's logged
  - [ ] How to view logs
  - [ ] Log retention
- [ ] Add storage management section
  - [ ] Understanding limits
  - [ ] Monitoring storage usage
  - [ ] What to do when approaching limits
- [ ] Add RSS feed documentation

### User's Guide.md
- [ ] Update with new UI text (Add Post, Home)
- [ ] Document markdown toggle feature
- [ ] Document copy text feature
- [ ] Document RSS feed
- [ ] Update with pinned posts info

### CHANGELOG.md
- [ ] Create v0.3.0 entry
- [ ] List all new features
- [ ] List all config variables
- [ ] Note any breaking changes

### README.md
- [ ] Update current version to v0.3.0
- [ ] Update feature list if needed

---

## Testing Checklist

After all phases complete, test:

- [ ] Submit a post (basic flow)
- [ ] Post appears on homepage
- [ ] Post renders with markdown
- [ ] Toggle markdown on/off works
- [ ] Copy post text works
- [ ] RSS feed generates correctly
- [ ] Admin page authentication works
- [ ] Admin: View all posts
- [ ] Admin: Delete single post
- [ ] Admin: Delete multiple posts (batch)
- [ ] Admin: Export posts
- [ ] Admin: Import posts
- [ ] Admin: Clear all posts
- [ ] Admin: View statistics
- [ ] Admin: View audit log
- [ ] Admin: Pin/unpin posts
- [ ] Pinned posts appear at top of TOC
- [ ] Size validation (client-side warning)
- [ ] Size validation (server-side reject)
- [ ] All config variables work
- [ ] Footer with ADMIN_EMAIL displays
- [ ] Date/time formats apply correctly
- [ ] Post IDs have no milliseconds

---

## Deployment Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Commit all changes
- [ ] Tag as v0.3.0
- [ ] Push to repository
- [ ] Deploy to Cloudflare Pages
- [ ] Verify in production
- [ ] Update version in README.md

---

## Notes

**Size Limit Defaults:**
- MAX_POST_SIZE: 1,048,576 bytes (1 MB)
- WARN_POST_SIZE: 786,432 bytes (750 KB)
- MAX_KV_SIZE: 1,048,576,000 bytes (1000 MB = ~1 GB)

**Cloudflare KV Limits (Free Tier):**
- 25 MiB per value
- 1 GB total storage
- 1,000 writes/day
- 100,000 reads/day

**Export Format (JSONL):**
```jsonl
{"id":"...", "title":"...", "body":"...", "createdAt":"...", "expiresAt":"...", "pinned":false}
{"id":"...", "title":"...", "body":"...", "createdAt":"...", "expiresAt":"...", "pinned":false}
```

**Audit Log Entry Format:**
```json
{
  "timestamp": "2026-01-04T12:34:56.789Z",
  "action": "post_created|post_deleted|posts_imported|posts_cleared",
  "ip": "1.2.3.4",
  "userAgent": "Mozilla/5.0...",
  "details": {"postId": "...", "count": 5}
}
```

---

**Status Legend:**
- [ ] Not started
- [~] In progress
- [x] Completed
