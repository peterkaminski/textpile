# Changelog

All notable changes to Textpile will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.8.0] - 2026-01-10

### Added
- Self-documenting environment variable defaults (INSTANCE_NAME, COMMUNITY_NAME, ADMIN_EMAIL now show literal variable names when unset)
- Environment Variables Reference Table on admin page showing all configuration with current values
- Comprehensive error handling for missing KV namespace binding across all endpoints
- Helpful setup instructions displayed when KV namespace is not configured
- Better error messages in admin login with actual API error details

### Changed
- Improved error handling on home page with user-friendly configuration guidance
- Enhanced admin page error display with console logging for debugging

### Fixed
- Cryptic "Cannot read properties of undefined" errors now show clear "KV namespace not configured" message
- Admin login errors now display actual error message instead of generic "Invalid admin token"
- Home page now shows step-by-step setup instructions when KV is missing

### Code Quality
- Refactored `timingSafeEqual()` into shared utility module (`functions/lib/auth.js`)
- Refactored `escapeHtml()` and `escapeXml()` into shared utility module (`functions/lib/escape.js`)
- Created `checkKvNamespace()` utility for consistent KV error handling (`functions/lib/kv.js`)
- Removed ~100 lines of duplicated code across 17 files

## [0.7.0] - 2026-01-10

### ⚠️ BREAKING CHANGES

**Route Rename: Submit → Add**

This release renames all "submit" terminology to "add" for clarity and consistency.

**Changed routes:**
- `/submit` → `/add` (user-facing page)
- `POST /api/submit` → `POST /api/add` (API endpoint)

**Changed terminology:**
- "submit token" → "add post password" (UI text)
- "Submit" button/concept → "Add Post" / "Publish"

**Impact:**
- Old routes `/submit` and `/api/submit` no longer exist (404)
- No redirects or aliases provided
- Update any bookmarks, scripts, or documentation that reference old routes
- Environment variable renamed: `SUBMIT_TOKEN` → `ADD_POST_PASSWORD`

**Migration:**
- Rename environment variable: `SUBMIT_TOKEN` → `ADD_POST_PASSWORD` in Cloudflare Pages settings
- Update any external scripts or tools to use `/api/add` instead of `/api/submit`
- Share updated `/add` URL with users
- Update any custom documentation or instructions
- Redeploy after renaming environment variable

## [0.6.0] - 2026-01-08

### ⚠️ BREAKING CHANGES

**New Post ID Format (KV-only)**

This release introduces a completely new ID format using KV-only allocation with claim+verify protocol.

**Old format (v0.5.1):** `20260107T211418-k4j2n5` (22 characters, timestamp-based)

**New format (v0.6.0):** `260108-bc` or `260108-bcf` (9-10 characters, day-based with random nonce)

**Impact:**
- No backwards compatibility needed (test instances only)
- Old posts can be cleared before deploying (or left as-is, both formats work in URLs)
- All new posts use the new format
- Much shorter, more readable IDs

**Migration:** Clear all existing posts before deploying if desired (instructions in POST-ID-V2-KV.md)

### Added

- **KV-Only ID Allocator**
  - New `allocatePostIdKv()` function using claim+verify protocol
  - Guaranteed uniqueness without Durable Objects
  - Cryptographically secure random nonce generation
  - Works on Cloudflare free plan

- **Improved ID Format**
  - Format: `YYMMDD-nonce` (e.g., `260108-bc` or `260108-bcf`)
  - Consonant-only alphabet: `bcdfghjkmnpqrstvwxyz` (20 chars)
  - Nonce lengths: 2 or 3 characters
  - 9-10 characters total (vs 22 before)

- **Claim+Verify Protocol**
  - Uses `claim:<id>` keys with 60s TTL
  - Prevents race conditions during allocation
  - Verifies post write with allocToken
  - Handles concurrent submissions safely

- **Testing**
  - Added unit tests for `formatDayUTC()` and `randomNonce()`
  - Added ID format validation tests
  - Test suite uses Vitest

- **Documentation**
  - Added POST-ID-V2-KV.md with comprehensive explanation
  - Documented allocation protocol, capacity analysis
  - Added troubleshooting guide

### Changed

- **Submit Endpoint** (`functions/api/submit.js`)
  - Replaced `makeId()` with async `allocatePostIdKv()`
  - Added allocToken to post metadata for write verification
  - Better error handling for allocation failures (HTTP 503)
  - ID generation now takes ~20-40ms (KV round-trips)

- **Capacity**
  - 2-char nonces: 400 IDs/day (10 attempts)
  - 3-char nonces: 8,000 IDs/day (10 attempts)
  - Total: 8,400 possible IDs/day with 20 attempts

Files added:
- functions/lib/idAllocator.js
- functions/lib/idAllocator.test.js
- POST-ID-V2-KV.md

Files modified:
- functions/api/submit.js
- package.json (added vitest, test scripts)

**See POST-ID-V2-KV.md for full details and implementation spec.**

## [0.5.1] - 2026-01-07

### Fixed

- **Build Error in Pin Endpoint**
  - Fixed duplicate variable declaration (`now`) in `/api/admin/pin` endpoint
  - Renamed second instance to `nowTimestamp` to avoid conflict
  - This was causing build failures on Cloudflare Pages deployment
  - Bug introduced in v0.5.0 when adding automatic index cleanup

Files changed: 1 (functions/api/admin/pin.js)

## [0.5.0] - 2026-01-06

### Added

- **Automatic Index Cleanup**
  - Expired entries are now automatically removed from the index during reads and writes
  - Cleanup happens on homepage loads, post submissions, deletions, and pin operations
  - Prevents accumulation of dead entries in the index
  - Maintains index efficiency without manual intervention

### Changed

- **Increased Index Capacity**
  - Index cap increased from 1,000 to 10,000 active posts
  - Expired entries don't count toward this limit (auto-filtered)
  - All endpoints updated: `/api/submit`, `/api/index`, `/api/remove`, `/api/admin/pin`, `/api/admin/import`

- **Documentation Updates**
  - Updated CLAUDE.md to reflect new 10,000 entry cap and auto-cleanup
  - Updated ADMIN-GUIDE.md with automatic cleanup behavior details
  - Added comprehensive cleanup documentation to Monitoring section

**Why this is 0.5.0 (minor version):** New automatic cleanup feature changes system behavior, though backwards compatible.

Files changed: 5 (functions/api/index.js, functions/api/submit.js, functions/api/remove.js, functions/api/admin/pin.js, functions/api/admin/import.js)

## [0.4.3] - 2026-01-06

### Added

- **Pin/Unpin Functionality**
  - Added `/api/admin/pin` endpoint for toggling post pin status
  - Added Pin/Unpin buttons in admin panel post table
  - Posts can now be pinned/unpinned through the admin interface
  - Pinned posts automatically appear first in the homepage listing
  - Pin button dynamically shows "Pin" or "Unpin" based on current state

### Changed

- **Navigation Improvements**
  - Added "About" link to navigation on all pages (except about page itself)
  - Added middot (·) separators between navigation links for better visual distinction
  - Separator styling: `opacity: 0.6`, `margin: 0 0.4em`, `aria-hidden="true"`
  - Updated `.actions` CSS: reduced gap from 10px to 0 (separators handle spacing)

- **Navigation Link Order**
  - Home page: About · Add Post · RSS
  - Submit page: Home · About
  - Admin page: Home · About · Add Post
  - Post pages: Home · About · Add Post
  - About page: Home (no changes)

Files changed: 6 (public/index.html, public/submit.html, public/admin.html, functions/p/[id].js, public/style.css, functions/api/admin/pin.js)

## [0.4.2] - 2026-01-06

### Changed

- **Header Layout Improvements**
  - Replaced header `<h1>` with persistent instance identity link
  - Moved page-specific `<h1>` elements into main content area
  - Applied consistently across all pages (index, about, submit, admin, posts)
  - Instance name now links to homepage from all pages
  - Improved semantic HTML structure and visual hierarchy

- **JavaScript Improvements**
  - Renamed `updateH1WithInstanceName()` to `updateInstanceName()` for clarity
  - Simplified `initPage()` - now always sets instance name and page title
  - Admin page now uses `initPage()` for consistent configuration loading

- **CSS Updates**
  - Added `.instance-name` style (14px, 75% opacity) for visual de-emphasis

Files changed: 7 (public/index.html, public/submit.html, public/about.html, public/admin.html, functions/p/[id].js, public/textpile-utils.js, public/style.css)

Merged from PR #1: "Refine header layout to add persistent instance link and unify title handling"

## [0.4.1] - 2026-01-05

### Changed

- **Footer Text Update**
  - Changed footer text from "Instance of Textpile {version}" to "This site runs Textpile {version} · source"
  - Improved clarity and readability of footer attribution
  - Updated documentation to reflect new footer format

## [0.4.0] - 2026-01-05

### ⚠️ BREAKING CHANGES

**Date/Time Format Presets Removed**

This release removes the hardcoded date/time format presets (short/medium/long/full) in favor of flexible ICU-style format strings. This provides full customization for international date formatting.

**Migration Required**:
If you have `DATE_FORMAT` or `TIME_FORMAT` environment variables set, you must update them:

| Old Value (v0.3.x) | New Value (v0.4.0) | Output |
|--------------------|-------------------|--------|
| `DATE_FORMAT=short` | `DATE_FORMAT=M/D/YY` | 1/4/26 |
| `DATE_FORMAT=medium` | `DATE_FORMAT=MMM D, YYYY` | Jan 4, 2026 |
| `DATE_FORMAT=long` | `DATE_FORMAT=MMMM D, YYYY` | January 4, 2026 |
| `DATE_FORMAT=full` | `DATE_FORMAT=dddd, MMMM D, YYYY` | Saturday, January 4, 2026 |
| `TIME_FORMAT=short` | `TIME_FORMAT=h:mm a` | 1:23 PM |
| `TIME_FORMAT=medium` | `TIME_FORMAT=h:mm:ss a` | 1:23:45 PM |

**New Defaults**:
- `DATE_FORMAT` default changed from `"medium"` → `"YYYY-MM-DD"` (ISO 8601)
- `TIME_FORMAT` default changed from `"short"` → `"HH:mm"` (24-hour)

If you don't have these variables set, Textpile will use ISO 8601 format automatically.

### Added

- **ICU-Style Date/Time Formatting**
  - Custom format strings using tokens like `YYYY`, `MM`, `DD`, `HH`, `mm`, `ss`
  - Supports international formats (e.g., `DD/MM/YYYY` for Europe, `YYYY年MM月DD日` for Japan)
  - Full token reference: `YYYY`, `YY`, `MMMM`, `MMM`, `MM`, `M`, `DD`, `D`, `dddd`, `ddd`, `HH`, `H`, `hh`, `h`, `mm`, `m`, `ss`, `s`, `a`
  - Fallback to ISO 8601 (`YYYY-MM-DD HH:mm`) for invalid formats

- **New Shared Date Formatter Module**
  - Created `/public/date-formatter.js` - zero-dependency ICU parser (~280 lines)
  - Single source of truth for date/time formatting
  - Used by both client-side and server-side code
  - Eliminates code duplication (~60 lines removed)

- **Comprehensive Documentation**
  - Added ICU format token reference to CONFIGURATION.md
  - 14+ country-specific format examples (USA, UK, Germany, Japan, China, Korea, etc.)
  - Migration guide for upgrading from v0.3.x
  - Combined date & time examples by region

### Changed

- **Default Formats**
  - `DATE_FORMAT`: `"medium"` → `"YYYY-MM-DD"` (ISO 8601)
  - `TIME_FORMAT`: `"short"` → `"HH:mm"` (24-hour)
  - More internationally accessible defaults

- **Client-Side Formatting**
  - `public/textpile-utils.js`: Now imports from `date-formatter.js` instead of duplicating logic
  - Removed hardcoded format maps (dateFormatMap, timeFormatMap)
  - Functions simplified to wrapper calls
  - Net reduction: ~32 lines

- **Server-Side Formatting**
  - `functions/p/[id].js`: Now imports from `date-formatter.js`
  - Removed duplicate `formatDateTime()` function
  - Changed default parameters to ISO 8601
  - Net reduction: ~24 lines

- **Admin Interface**
  - `public/admin.html`: Now uses configured date formats (consistent with public pages)
  - Replaced `toLocaleString()` with `formatDateTime()` from textpile-utils.js
  - Shows dates in same format as rest of the site

- **API Configuration**
  - `functions/api/config.js`: Updated defaults and comments
  - Documents ICU format string usage
  - Examples: `"DD/MM/YYYY"`, `"YYYY年MM月DD日"`

### Removed

- **Named Format Presets**
  - Removed `short`, `medium`, `long`, `full` date presets
  - Removed `short`, `medium` time presets
  - Replaced with flexible ICU format strings

### Files Modified

- `public/date-formatter.js` (NEW) - ICU format parser and formatter
- `public/textpile-utils.js` - Import from date-formatter, remove format maps
- `functions/p/[id].js` - Import from date-formatter, remove duplicate function
- `functions/api/config.js` - Change defaults to ISO 8601
- `public/admin.html` - Use formatDateTime instead of toLocaleString
- `CONFIGURATION.md` - Complete rewrite of DATE_FORMAT and TIME_FORMAT sections

### Technical Details

- **Zero new dependencies**: Custom lightweight ICU parser
- **Zero build step**: Pure ES modules work with Cloudflare Pages as-is
- **Code reduction**: Net -80 lines despite adding new functionality
- **Parsing**: Uses `Intl.DateTimeFormat.formatToParts()` for token mapping
- **Compatibility**: Works in all modern browsers and Cloudflare Workers runtime

### Developer Experience

- **Single source of truth**: All date formatting in one module
- **No code duplication**: Client and server share same logic
- **Better defaults**: ISO 8601 is internationally recognized
- **Full flexibility**: Support any date/time format worldwide
- **Clear error handling**: Invalid formats fall back gracefully with console warnings

---

## [0.3.3] - 2026-01-05

### Changed

- **Footer Design Update**
  - Redesigned footer format for cleaner, more prominent display
  - Instance name now shown in bold at the start
  - Format: `**{instance_name}** · operated by {email}` on first line
  - "Instance of Textpile {version}" link on second line
  - Changed footer class from `"site-footer"` to `"small"` for consistency
  - Uses middle dot (·) separator for cleaner visual separation

### Files Modified

- `public/textpile-utils.js` - Updated `addFooter()` function with new format
- `CONFIGURATION.md` - Updated footer example to match new format

## [0.3.2] - 2026-01-04

### Added

- **Centralized Version Management**
  - Created `/public/version.js` as single source of truth for version number
  - Both `functions/api/config.js` and `public/textpile-utils.js` now import from `version.js`
  - Version updates now require editing only ONE file instead of 5+
  - Added `scripts/update-version.js` automation script to update documentation files
  - Created `package.json` to enable ES module support for scripts

### Changed

- **Version Management Workflow**
  - Release workflow simplified: edit `version.js`, run `npm run update-version`, update CHANGELOG
  - Documentation files (README.md, CONFIGURATION.md) auto-updated via script
  - Guaranteed version consistency across all files

### Developer Experience

- **New npm script**: `npm run update-version` - Updates documentation to match version.js
- **Reduced maintenance**: 80% fewer files to edit when releasing new versions
- **No build step required**: Works with Cloudflare Pages as-is, pure ES modules

### Technical Details

- `/public/version.js` exports `TEXTPILE_VERSION` constant
- `functions/api/config.js` imports version using relative path: `../../public/version.js`
- `public/textpile-utils.js` imports version using relative path: `./version.js`
- Script uses Node.js ES modules (enabled via `"type": "module"` in package.json)

### Files Modified

- `functions/api/config.js` - Import TEXTPILE_VERSION from version.js
- `public/textpile-utils.js` - Import TEXTPILE_VERSION from version.js
- `README.md` - Auto-updated to v0.3.2 via script
- `CONFIGURATION.md` - Auto-updated to v0.3.2 via script

### Files Created

- `public/version.js` - Single source of truth for version
- `scripts/update-version.js` - Documentation updater script
- `package.json` - Package metadata and ES module configuration

### Notes

- **No breaking changes**: All features are backwards compatible
- **No runtime changes**: Version is still available via `/api/config` as before
- **Pure refactoring**: User-facing behavior unchanged
- Future releases: Edit `public/version.js` and run `npm run update-version`

## [0.3.1] - 2026-01-04

### Added

- **Instance Customization**
  - `INSTANCE_NAME` environment variable (default: "Textpile")
  - Instance name appears in page titles: "Page Title - Instance Name"
  - Instance name appears in homepage H1 header
  - Customizable per deployment for multi-instance operators

- **Copy URL Feature**
  - "Copy URL" button added to post view (next to "Copy text")
  - Copies current post URL to clipboard
  - Shows "URL copied!" confirmation message
  - Useful for sharing posts or saving references

- **About Page** (`/about`)
  - Comprehensive use notes and policies
  - Explains what Textpile is and is not
  - Details on attribution and identity handling
  - Retention and expiration policies
  - Use expectations and guidelines
  - Operation and shutdown policy

- **Configuration Documentation** (`CONFIGURATION.md`)
  - Complete reference for all 10 environment variables
  - Organized by category (Identity, Access Control, Retention, Display, Size)
  - Includes defaults, examples, and valid values
  - Quick reference table
  - Security best practices
  - Troubleshooting guide

- **Improved Page Copy**
  - Homepage now links to `/about` for important use notes
  - Submit page includes clear disclosure: "No author identity is collected. IP addresses are logged."
  - All pages link to `/about` for full details
  - Copy emphasizes ephemerality and author responsibility

### Changed

- **Enhanced Footer** (all pages)
  - New format: "This is an instance of Textpile {version}, operated by {email}."
  - Always shown (even if ADMIN_EMAIL not configured)
  - Links to GitHub repository
  - Shows Textpile version (0.3.1)
  - Shows operator email if ADMIN_EMAIL is set

- **Page Titles**
  - All pages now use dynamic titles with instance name
  - Format: "{Page Title} - {Instance Name}"
  - Homepage updates H1 to show instance name
  - Better browser tab identification for multi-instance users

- **Post View Improvements**
  - Converted from server-side to client-side footer rendering
  - Consistent footer format with other pages
  - Added Copy URL button alongside Copy text button
  - Dynamic page title based on post title

- **Configuration Access**
  - `/api/config` now includes `instanceName` and `textpileVersion`
  - Cached for 5 minutes for performance
  - Client-side utilities use config for all dynamic content

- **textpile-utils.js Enhancements**
  - Added `updatePageTitle()` function for dynamic page titles
  - Added `updateH1WithInstanceName()` for homepage branding
  - Updated `addFooter()` with new format and version display
  - Modified `initPage()` to accept options: `pageTitle`, `updateH1`

### Fixed

- Removed redundant `renderFooter()` function from post view
- Removed unused `adminEmail` variable from post view server code
- Consistent footer rendering across all pages

### Documentation

- Created **CONFIGURATION.md** with comprehensive environment variable documentation
- Updated **INSTALLATION.md** to reference CONFIGURATION.md for detailed config info
- Added **IMPROVED-COPY.md** documenting copy improvements and rationale
- Updated **LICENSE** with Use Notice (non-binding) section clarifying intended use

### Notes

- **No breaking changes**: All new features are backwards compatible
- **Instance name**: Defaults to "Textpile" if not configured
- **Footer**: Now always rendered, even without admin email configured
- Version number hardcoded in `/api/config` - update when releasing new versions

## [0.3.0] - 2026-01-04

### Added

- **Admin Interface** (`/admin`)
  - Web-based admin panel for post management
  - Authentication via ADMIN_TOKEN (stored in localStorage)
  - View all posts with metadata (ID, title, dates, pinned status, size)
  - Delete individual or multiple posts with batch selection
  - Pin/unpin posts to highlight at top of homepage
  - Export all posts as JSONL format for backups
  - Import posts from JSONL for migration or restoration
  - Clear all posts with confirmation (nuclear option)
  - Storage statistics dashboard with capacity warnings

- **Admin API Endpoints**
  - `GET /api/admin/posts` - List all posts with metadata
  - `GET /api/admin/export` - Export posts as JSONL
  - `POST /api/admin/import` - Import posts from JSONL
  - `POST /api/admin/clear` - Delete all posts and reset index
  - `GET /api/admin/stats` - Storage statistics and capacity monitoring
  - All endpoints require ADMIN_TOKEN authentication

- **RSS 2.0 Feed** (`/feed.xml`)
  - RSS feed with last 50 active (non-expired) posts
  - Automatic filtering of expired posts
  - Includes title, link, publication date, GUID
  - Community name in feed metadata
  - Atom self-link for feed discovery
  - Auto-discovery link in `<head>` of index.html
  - 5-minute cache for performance
  - Visible RSS link in homepage header

- **Configuration System**
  - `GET /api/config` - Public configuration endpoint
  - `public/textpile-utils.js` - Shared client-side utility library
  - Centralized configuration loading and formatting
  - Community name replacement throughout site
  - Dynamic footer with admin email contact
  - Date/time formatting based on configuration

- **Configuration Variables** (all optional)
  - `COMMUNITY_NAME` - Customize community name (default: "the community")
  - `ADMIN_EMAIL` - Contact email shown in footer (default: not shown)
  - `DEFAULT_RETENTION` - Default retention window (default: "1month")
  - `DATE_FORMAT` - Date display format: short, medium, long, full (default: "medium")
  - `TIME_FORMAT` - Time display format: short, medium (default: "short")
  - `MAX_POST_SIZE` - Maximum post size in bytes (default: 1048576 = 1 MB)
  - `MAX_KV_SIZE` - Total storage target in bytes (default: 1048576000 = 1000 MB)

- **Post Enhancement Features**
  - **Toggle Markdown rendering**: Switch between formatted and plain text view
  - **Copy post text**: Copy raw Markdown to clipboard
  - **Pin posts**: Administrators can pin posts to top of homepage
  - Pinned posts show 📌 icon in table of contents
  - Pinned posts sorted first, then by date

- **Size Validation**
  - Client-side real-time size calculation as user types
  - Visual feedback with color coding (green → yellow → red)
  - Submit button disabled when over MAX_POST_SIZE
  - Server-side enforcement with HTTP 413 response
  - Clear error messages showing current size vs. limit
  - Warning threshold at 750 KB (75% of default 1 MB limit)

- **UI Improvements**
  - Replaced "Submit" with "Add Post" throughout
  - Replaced "TOC" with "Home" throughout
  - Post IDs no longer include milliseconds (cleaner, more sortable)
  - Enhanced post view with metadata display
  - Better date/time formatting with configurable styles
  - Footer component with optional admin email

- **Documentation Enhancements**
  - Comprehensive troubleshooting section in INSTALLATION.md
  - Documented all new configuration variables
  - Admin interface usage guide in ADMIN-GUIDE.md
  - Storage management best practices in ADMIN-GUIDE.md
  - RSS feed documentation in ADMIN-GUIDE.md and User's Guide.md
  - Updated User's Guide with all new features

### Changed

- **Post ID format**: Removed milliseconds from IDs (YYYYMMDDTHHMMSS-random instead of YYYYMMDDTHHMMSSmmm-random)
  - Cleaner, more human-readable IDs
  - Still sortable and unique
  - Functions/api/submit.js:7 - Changed `.slice(0, 19)` to `.slice(0, 15)`

- **Index sorting**: Pinned posts always appear first
  - Functions/api/submit.js and functions/api/index.js
  - Sort order: pinned first (by date within pinned), then unpinned by date

- **Post view enhancements** (functions/p/[id].js)
  - Added toggle button for Markdown/plain text view
  - Added copy text button with clipboard API
  - Shows expiry date in metadata
  - Navigation updated to "Add Post" and "Home"

- **Homepage improvements** (public/index.html)
  - Added RSS feed link in header
  - Pinned posts show 📌 icon
  - Uses formatDateTime from textpile-utils.js
  - Community name dynamically loaded from config

- **Submit form improvements** (public/submit.html)
  - Real-time size validation with visual feedback
  - Size display updates as user types
  - Warning at 750 KB, error at 1 MB
  - Submit button disabled when over limit
  - Default retention period loaded from config

### Fixed

- Improved error messages throughout API endpoints
- Better handling of edge cases in admin operations
- Consistent response format across all endpoints

### Security

- All admin endpoints use timing-safe token comparison (from v0.2.0)
- Storage statistics prevent information leakage
- Import validation prevents malformed data injection

### Documentation

- Updated INSTALLATION.md with all new configuration variables
- Updated ADMIN-GUIDE.md with admin interface, storage management, and RSS sections
- Updated User's Guide.md with new features and UI changes
- Updated README.md with v0.3.0 features and routes
- All documentation cross-referenced and consistent

### Notes

- **No breaking changes**: All new features are backwards compatible
- **No database migrations**: KV storage schema unchanged
- **Optional features**: All new functionality is optional via configuration
- Audit logging was planned but deferred to manage scope

## [0.2.1] - 2026-01-04

### Added
- **ADMIN-GUIDE.md**: Comprehensive administrator's guide
  - Spam prevention strategies (submit tokens, rate limiting)
  - Cloudflare Access setup for authentication
  - Rate limiting configuration with WAF rules
  - Emergency procedures (disable posting, hide posts, remove content)
  - Monitoring and maintenance guidance
  - Cost management and graceful shutdown procedures
- **ARCHITECTURE.md**: Non-technical architectural overview
  - Plain-language explanation of how Textpile works
  - Cost implications and sustainability analysis
  - Risk scenarios (spam, legal issues, user expectations)
  - Social and ethical considerations for operators
  - Decision guide: "Should you run a Textpile?"
  - Clear explanation of operator and user responsibilities
- **CONTRIBUTING.md**: Developer contribution guidelines
  - Bug reporting process and template
  - Feature request guidelines aligned with project philosophy
  - Development setup instructions
  - Coding standards and style guide
  - Pull request workflow
  - Security vulnerability reporting procedures

### Changed
- **README.md**: Added organized Documentation section
  - Categorized guides by audience (Getting Started, Understanding, Admin, Developer)
  - Clear descriptions for each documentation file

## [0.2.0] - 2026-01-04

### Added
- **Auto-expiration feature** (critical missing functionality)
  - User-selectable retention windows: 1 week, 1 month, 3 months, 6 months, 1 year
  - Retention period selector in submit form UI
  - KV entries now use `expirationTtl` for automatic deletion
  - Posts include `expiresAt` metadata for tracking
  - Index filtering: expired items automatically removed at read time
  - 410 Gone response for expired posts with clear explanation page
  - Default retention: 1 month
- **Timing-safe token comparison** (security enhancement)
  - Implemented in `functions/api/submit.js` and `functions/api/remove.js`
  - Uses `crypto.subtle` when available with XOR fallback
  - Prevents timing attacks on ADD_POST_PASSWORD and ADMIN_TOKEN
- **Client-side form validation**
  - Body field validated before submission
  - Immediate user feedback
  - Reduces unnecessary API calls
- **Comprehensive documentation** in CLAUDE.md
  - Race condition analysis and mitigation options
  - CORS considerations with implementation examples
  - Security best practices

### Fixed
- **ID generation bug** (functions/api/submit.js:7)
  - Changed `.replace("Z", "Z")` (no-op) to `.replace(/[-:.Z]/g, "")`
  - IDs now properly sortable without trailing "Z"
- **Redundant KV fetches** (functions/p/[id].js:7-14)
  - Reduced from 3 separate fetches to 1 single `getWithMetadata()` call
  - Saves KV read costs and reduces latency by ~200ms
- **XSS vulnerability** (public/index.html:45)
  - URL now escaped before insertion into href attribute
  - Defense-in-depth security enhancement
- **Race condition in index updates** (documented)
  - Added inline code comments explaining read-modify-write pattern
  - Documented acceptable trade-off for low-traffic sites
  - Provided mitigation options for high-traffic scenarios

### Changed
- **Standardized API error responses**
  - All endpoints now return consistent format with `success` field
  - Proper HTTP status codes: 200, 201, 400, 403, 410, 501
  - Clear, actionable error messages
- **Enhanced post view**
  - Shows expiration information in metadata
  - Graceful handling of legacy posts without expiry
- **Submit form UI improvements**
  - Added retention period selector with clear labels
  - Warning text about auto-expiration and no backups
  - HTML5 `required` attribute for body field
- **Style enhancements**
  - Added `select` element styling to match existing form inputs

### Security
- Timing-safe comparison prevents token guessing attacks
- XSS vulnerability patched in index rendering
- HTML escaping applied to all user-generated content

## [0.1.0] - 2026-01-04

### Added
- Initial Textpile implementation
- **Core architecture**: Cloudflare Pages + Functions + KV
- **Public pages**:
  - `public/index.html`: Table of contents page
  - `public/submit.html`: Submission form
  - `public/style.css`: Shared stylesheet with light/dark mode
- **API endpoints**:
  - `GET /api/index`: Returns TOC JSON
  - `POST /api/submit`: Publish new posts
  - `POST /api/remove`: Admin removal endpoint
- **Post rendering**:
  - `GET /p/:id`: Individual post view
  - Client-side Markdown rendering with marked.js
- **Features**:
  - Non-attributed posting (no author identity stored)
  - Instant publishing with sortable IDs
  - Optional ADD_POST_PASSWORD for spam prevention
  - Optional ADMIN_TOKEN for quick takedown
  - Index capped at 1000 posts
  - HTML escaping for security
- **Documentation**:
  - README.md with project overview
  - INSTALLATION.md with Cloudflare deployment guide
  - User's Guide.md for end users
  - CLAUDE.md for technical architecture
  - LICENSE (MIT)
  - .gitignore for Node.js/Cloudflare projects

### Known Issues (Fixed in v0.2.0)
- ⚠️ Auto-expiration not implemented (documented but missing)
- ⚠️ ID generation bug (no-op .replace)
- ⚠️ Redundant KV fetches (performance issue)
- ⚠️ XSS vulnerability in index.html
- ⚠️ Non-timing-safe token comparison
- ⚠️ No 410 Gone for expired posts

## Project Philosophy

Textpile is designed to be:
- **Temporary by default**: Forced expiration prevents accidental permanence
- **Low-maintenance by design**: Zero background jobs, no database migrations
- **Non-attributed at artifact layer**: No author metadata stored
- **Socially legible shutdown**: Clear expectations that service may end if burdensome
- **No implied custody**: Authors responsible for their own content archival

---

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (0.x.x → 1.x.x): Breaking changes, incompatible API changes
- **MINOR** (0.0.x → 0.1.x): New features, backwards compatible
- **PATCH** (0.0.0 → 0.0.1): Bug fixes, documentation, backwards compatible

## Links

- [Repository](https://github.com/peterkaminski/textpile) (update with actual URL)
- [Documentation](README.md)
- [Installation Guide](INSTALLATION.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

**Note**: Dates use YYYY-MM-DD format (ISO 8601).

[Unreleased]: https://github.com/peterkaminski/textpile/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/peterkaminski/textpile/compare/v0.3.3...v0.4.0
[0.3.3]: https://github.com/peterkaminski/textpile/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/peterkaminski/textpile/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/peterkaminski/textpile/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/peterkaminski/textpile/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/peterkaminski/textpile/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/peterkaminski/textpile/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/peterkaminski/textpile/releases/tag/v0.1.0
