# Changelog

All notable changes to Textpile will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
  - Prevents timing attacks on SUBMIT_TOKEN and ADMIN_TOKEN
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
  - Optional SUBMIT_TOKEN for spam prevention
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

[Unreleased]: https://github.com/peterkaminski/textpile/compare/v0.3.2...HEAD
[0.3.2]: https://github.com/peterkaminski/textpile/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/peterkaminski/textpile/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/peterkaminski/textpile/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/peterkaminski/textpile/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/peterkaminski/textpile/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/peterkaminski/textpile/releases/tag/v0.1.0
