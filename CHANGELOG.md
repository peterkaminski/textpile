# Changelog

All notable changes to Textpile will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.4] - 2026-06-11

### Fixed
- Post page title now stacks above the Created/Expires/ID metadata line again; the site-header flex layout had been applying to the post page's inner article header introduced in v1.2.0, placing them side by side

## [1.2.3] - 2026-06-11

### Fixed
- Restored the compact post-card appearance on the homepage, lost in the v1.2.0 semantic-HTML redesign: post titles are body-sized links again (not bold headings), the pin badge precedes the title, and Created/Expires/ID metadata renders as a single line instead of a label/value grid. The semantic `<h2>`/`<dl>` markup is kept; only the styling changed.

## [1.2.2] - 2026-06-11

### Removed
- Removed `wrangler.toml` (added in v1.2.1). Because it contained `pages_build_output_dir`, Cloudflare Pages treated it as the source of truth for project configuration, superseding all dashboard-configured environment variables and bindings on existing instances. The "Could not resolve marked" build failure is fully fixed by setting the build command to `npm run build` in dashboard build settings (see INSTALLATION.md); the file was not needed.

### Upgrade note for operators who deployed v1.2.1
If you deployed v1.2.1, your dashboard-configured environment variables and KV binding were superseded by the (empty) `wrangler.toml`. After upgrading to this version and redeploying, dashboard-managed configuration takes effect again. If your dashboard values were lost, recover the display-related ones from a pre-v1.2.1 deployment's unique URL via `GET /api/config`, and re-enter secrets (`ADMIN_TOKEN`, `ADD_POST_PASSWORD`) from your own records. Verify your KV binding (Settings → Bindings) is still present.

## [1.2.1] - 2026-06-11

### Fixed
- Long lines in code blocks (`<pre>`) now wrap instead of forcing horizontal scrolling, matching the plain-text view; unbreakable strings such as long URLs also wrap
- Fixed SyntaxError that broke all buttons (copy, download, view toggle) on post pages, caused by an unescaped `\n` in a server-side template literal
- Fixed Cloudflare Pages "Could not resolve marked" build failures by adding `wrangler.toml` and requiring `npm run build` as the deployment build command

### Changed
- Installation documentation updated to require `npm run build` for deployment

## [1.2.0] - 2026-02-10

### Added
- **AI Agent and Accessibility Improvements**
  - Server-side markdown rendering for no-JavaScript fallback
  - Semantic HTML structure with `<article>`, `<time>`, and `<nav>` elements
  - JSON-LD structured data (Schema.org BlogPosting) for better SEO
  - OpenGraph and Twitter Card metadata for social sharing
  - Content negotiation support for plain text and markdown formats
  - Skip-to-content links for keyboard navigation
  - `robots.txt` for web crawler guidance
  - `sitemap.xml` for search engine indexing
  - Enhanced RSS feed with full content and proper metadata
- **Documentation**
  - Comprehensive AI readability improvement plan document
  - Conditional AI readability automation tests
  - Updated User's Guide with Preview tab reference
  - Updated ROUTES.md with new endpoints

### Changed
- Improved post list rendering with semantic HTML elements
- Enhanced RSS feed structure and content
- Better accessibility semantics throughout the application
- Refined add-post password label from "add post password" to "use post password" for clarity

### Internal
- Added `marked` package for server-side markdown rendering
- New utility functions for content sanitization and excerpt generation

## [1.1.1] - 2026-02-09

### Changed
- Hardened source-zip build version parsing in `scripts/build-source-zip.sh`:
  - explicit check that `public/version.js` exists
  - clearer parse-failure error when `TEXTPILE_VERSION` cannot be extracted
  - more readable Node parsing snippet

### Fixed
- Version format validation now uses SemVer 2.0.0-compatible matching, including:
  - prerelease identifiers (for example `1.2.3-rc.1`)
  - build metadata (for example `1.2.3+build.5`)
  - proper rejection of malformed versions

## [1.1.0] - 2026-02-09

### Added
- Optional Markdown preview workflow on the add-post page
  - New `Edit` and `Preview` tabs above the body editor
  - Live Markdown rendering in preview mode
  - Markdown parser is loaded lazily when preview is first opened
- Markdown preview implementation plan document:
  - `docs/design/markdown-preview/plan-add-post-markdown-preview.md`

### Changed
- Refined add-post editor UI styling
  - Soft rounded folder-tab appearance for `Edit`/`Preview`
  - Improved tab alignment and visual hierarchy
  - Preview pane styling refinements and working resize handle behavior
- Updated author documentation to reference the new Preview tab flow

### Internal
- Updated local Claude permissions/settings configuration:
  - `.claude/settings.local.json`

## [1.0.2] - 2026-01-20

### Improved
- **Admin Page Loading UX**
  - Added loading cursor (wait/spinner) during admin page data fetch
  - Cursor changes to 'wait' immediately on login, restores to 'default' after loading
  - Improved perceived responsiveness during ~2 second load time
  - Optimized data loading with parallel API requests via `Promise.all()`

### Added
- **Wishlist Item:** Admin page performance optimization proposals
  - Documented potential approaches: combined endpoint, pagination, caching, KV optimization
  - Marked as low priority since current UX is acceptable with loading cursor

## [1.0.1] - 2026-01-20

### Added
- **Admin Environment Configuration Display**
  - Added `SOFTWARE_NAME` to admin environment variables display (Identity & Branding category)
  - Added `PUBLIC_SOURCE_ZIP` to admin environment variables display (new Build & Deployment category)
  - Admin dashboard now shows all configurable environment variables

### Fixed
- Updated ROUTES.md documentation with missing routes (`/404`, `/api/admin/env`)

## [1.0.0] - 2026-01-20

### 🎉 Stable Release

Textpile 1.0.0 marks the project as production-ready and stable. The codebase has been battle-tested, the API is stable, and the feature set is complete for typical community use cases. This release focuses on making Textpile easy to fork, deploy, and customize.

### Added

- **Public Source Zip Feature**
  - Automatic source code download via `/assets/textpile-{version}-source.zip`
  - Generated during Cloudflare Pages build using `git archive`
  - Controlled by `PUBLIC_SOURCE_ZIP` environment variable (default: disabled)
  - Clean git exports automatically exclude node_modules and untracked files
  - Version number embedded in filename for clarity

- **Smart 404 Page**
  - Custom 404 page with intelligent source zip detection
  - Automatically checks if source zip is available
  - Provides helpful "Get the Source Code" link when applicable
  - Falls back to standard 404 message when source zip is unavailable

- **Fork Rebranding Support**
  - `SOFTWARE_NAME` environment variable for customizing software name in footer
  - Defaults to "Textpile" for canonical instances
  - Allows forks to rebrand while maintaining attribution

- **Documentation Improvements**
  - Organized documentation structure with `docs/` directory
  - Added `docs/adr/` for Architecture Decision Records
  - Added ADR 002: Missing Source Zip Handling
  - Moved `ROUTES.md` to `docs/ROUTES.md` for better organization
  - Added comprehensive CONTRIBUTING.md with release process
  - Added WISHLIST.md for tracking potential future enhancements

- **Version Management**
  - Single source of truth for version in `public/version.js`
  - Automated version sync script (`npm run update-version`)
  - ADR 001: Version Source of Truth documentation
  - Version appears in footer and admin dashboard

### Changed

- **Footer Enhancements**
  - Dynamic software name display (uses `SOFTWARE_NAME` env var)
  - Conditional source zip download link
  - Cleaner, more informative footer layout

- **Admin Dashboard**
  - Added environment variable display
  - Shows all configurable settings with descriptions
  - Organized by category (Identity & Branding, Build & Deployment)

- **Build Process**
  - Added `scripts/build-source-zip.sh` for automated source packaging
  - Integrated with Cloudflare Pages build pipeline
  - Version number automatically extracted from `public/version.js`

### Fixed

- Corrected documentation inconsistencies
- Updated all version references to use single source of truth

### Internal

- Improved code organization
- Better separation of concerns in utility functions
- Enhanced error handling in admin endpoints

---

## [0.7.0] - 2026-01-19

### Added
- Admin dashboard for managing posts
  - View all posts with metadata
  - Delete posts individually
  - Bulk delete expired posts
  - Protected by admin token
- Admin authentication system
  - Token-based authentication
  - Secure token comparison
  - Session management

### Changed
- Improved error messages
- Better handling of expired posts
- Enhanced security for admin operations

---

## [0.6.0] - 2026-01-15

### Added
- RSS feed support at `/feed.xml`
- Post expiration system
- Configurable retention periods
- Pin posts feature

### Changed
- Improved post metadata display
- Better date formatting
- Enhanced mobile responsiveness

---

## [0.5.0] - 2026-01-10

### Added
- Markdown rendering support
- Code syntax highlighting
- Post password protection
- Configurable post size limits

### Changed
- Improved UI styling
- Better error handling
- Enhanced form validation

---

## [0.4.0] - 2026-01-05

### Added
- Basic post creation
- Post listing on homepage
- Individual post pages
- Cloudflare Pages integration

### Changed
- Initial public release
- Core functionality established

---

## Earlier Versions

Earlier versions were development releases and are not documented in detail.
