# ADR 002: Missing Source Zip Handling

## Status

Accepted

## Context

The public source zip feature (`PUBLIC_SOURCE_ZIP=true`) has a potential misconfiguration scenario:
- Operator sets `PUBLIC_SOURCE_ZIP=true` in environment variables
- Footer displays "Download source code from this instance" link
- But operator forgets to set build command to `npm run build`
- Result: Zip file is never created
- User clicks link → Gets confusing 404 (or page refresh with no download)

This is a **silent failure** - the feature appears to be enabled but doesn't work. The question is: how do we handle this gracefully?

### The Problem

When `PUBLIC_SOURCE_ZIP=true`:
1. `/api/config` returns `publicSourceZip: true`
2. Client-side footer code shows download link
3. Link points to `/assets/textpile-{version}-source.zip`
4. If build command not configured, this file doesn't exist
5. Clicking the link results in 404 (with no helpful message)

### Why This Happens

The build process is optional for Textpile's core functionality:
- Setting `PUBLIC_SOURCE_ZIP=true` alone doesn't trigger builds
- Build command must be explicitly configured: `npm run build`
- Easy to forget one or the other
- No runtime verification that zip actually exists

## Decision

**Implement Option D: Keep current behavior + Smart 404 Page**

Create `public/404.html` that:
1. Shows general "Page Not Found" for most 404s
2. Detects URLs matching `/assets/textpile-*-source.zip`
3. For missing source zips, shows specific troubleshooting:
   - Explanation: "PUBLIC_SOURCE_ZIP enabled but zip not built"
   - Step-by-step fix: Set build command → Redeploy
   - Link to INSTALLATION.md for details

The footer link continues to show when `PUBLIC_SOURCE_ZIP=true`, regardless of whether the zip actually exists.

## Alternatives Considered

### Option A: Build Manifest File

Build script creates `public/assets/source-zip-manifest.json`:
```json
{"available": true, "version": "0.11.1", "filename": "textpile-0.11.1-source.zip"}
```

Client fetches manifest before showing link.

**Pros:**
- Reliable verification
- Single source of truth

**Cons:**
- Extra HTTP request on every page load
- More complex client logic
- Adds build-time file generation

**Decision**: Rejected - unnecessary complexity for edge case

### Option B: HEAD Request Check

Client does HEAD request to zip URL, only shows link if 200 response.

**Pros:**
- Directly verifies file existence

**Cons:**
- HTTP request on every page load
- Slows initial page render
- Network overhead for every visitor

**Decision**: Rejected - performance impact not justified

### Option C: Build Script Modifies Footer Code

Build script directly edits `public/textpile-utils.js` to inject/remove the download link HTML.

**Pros:**
- No runtime checks needed
- Link only appears when zip actually exists
- **Better visibility** - operator sees the problem immediately if testing

**Cons:**
- **Modifies tracked source files during build** (very unusual)
- Git status shows modifications (confusing)
- Source of truth unclear (env var vs modified file)
- Development workflow issues (local differs from repo)
- Harder to understand and maintain
- Violates separation of concerns (build script editing runtime code)

**Decision**: Rejected - architectural issues outweigh visibility benefits

### Option D: Smart 404 Page *(Selected)*

Keep current behavior, create helpful 404 page.

**Pros:**
- Simple, no build-time file manipulation
- No runtime performance impact
- Self-documenting (error explains solution)
- Follows "fail loudly and helpfully" principle
- Also solves general 404 handling
- Treats misconfiguration as what it is: an error to fix

**Cons:**
- User must click link to discover problem (not immediately visible)
- Operator might not test the link after enabling
- Users see operator-level instructions (see Consequences)

**Decision**: Accepted - best balance of simplicity and helpfulness

## Consequences

### Positive

1. **No Performance Overhead**: No manifest fetches or HEAD requests on every page load
2. **Self-Documenting**: Error page teaches operators how to fix the issue
3. **Architectural Simplicity**: No source file modification, no complex verification logic
4. **Solves General Problem**: Also provides proper 404 handling for all missing pages
5. **Fail Loudly**: Misconfiguration produces visible error (when tested) with clear fix

### Negative

1. **Visibility Trade-off**: Problem only discovered when link is clicked
   - **Mitigation**: Testing is expected when enabling new features
   - **Mitigation**: Broken link is better than silent "success" (forces investigation)
   - **Note**: If operator doesn't test, at least users will report the broken link

2. **Delayed Discovery**: Operator might not notice until after deployment
   - **Mitigation**: INSTALLATION.md clearly documents both env var AND build command
   - **Mitigation**: Error page provides immediate fix instructions
   - **Note**: This is fundamentally a configuration error that should be fixed, not worked around

### Neutral

3. **Operator-Level Language Visible to Users**: 404 page shows Cloudflare Pages configuration instructions

   **This is actually acceptable** (even beneficial) because:
   - **Transparency aligns with Textpile philosophy**: "Socially legible" operations, clear about being low-maintenance
   - **Users benefit from understanding**: Can report issues with specific details, see "under the hood"
   - **Not confusing**: Users can understand "operator needs to set build command" even if they can't do it themselves
   - **Precedent**: Textpile already shows operational details (expiration, storage limits, admin interface)
   - **Community-focused**: Makes running your own instance feel achievable

   **Alternative considered**: Add "If you're the operator..." vs "If you're a user..." sections
   - **Decision**: Not needed - unified message is clearer and users aren't harmed by seeing operator details

### Comparison to Option C (Visibility)

**Option C Advantage**: Operator would see problem immediately in footer (e.g., error message in red)

**Why Option D is Still Better**:
1. **Testing is expected**: Operators should test new features after enabling them
2. **Silent success is worse**: Better to have discoverable failure than false success
3. **Correctness over convenience**: Real fix is proper configuration, not UI workarounds
4. **Architectural cleanliness**: Worth slight visibility trade-off

## Implementation

### File: `public/404.html`

Created standard Cloudflare Pages 404 handler that:
1. Uses Textpile header, footer, and styling
2. JavaScript detects path pattern: `/^\/assets\/textpile-[\d.]+(-[a-zA-Z0-9]+)?-source\.zip$/`
3. Dynamically updates content based on detection:
   - **Source zip match**: Show troubleshooting instructions
   - **Other paths**: Show generic 404 message

### Pattern Matching

Regex handles:
- Standard versions: `textpile-0.11.1-source.zip`
- Version suffixes (forks): `textpile-0.11.1-mycommunity-source.zip`
- Different versions: `textpile-1.0.0-source.zip`

Does not match:
- Other file types (`.tar.gz`)
- Other paths
- Random zip files

## Future Reconsideration Triggers

This decision should be revisited if:

1. **Operators frequently misconfigure**: If support requests show this is a common problem and operators consistently fail to test the feature before deploying

2. **User confusion is significant**: If users are confused by seeing operator-level instructions in the 404 page

3. **Build process changes**: If Textpile adopts a mandatory build step for all deployments (making Option A/B feasible without performance cost)

4. **Performance requirements change**: If client-side verification becomes acceptable (e.g., service worker caching makes HEAD requests negligible)

**Current recommendation**: None of these triggers apply. The current approach is working as intended.

## Testing

Verified that:
- ✅ Generic 404 shows for missing pages
- ✅ Source zip 404 shows for `/assets/textpile-*-source.zip`
- ✅ Regex correctly matches valid patterns
- ✅ Regex rejects invalid patterns
- ✅ Instructions are clear and actionable
- ✅ Link to INSTALLATION.md works

## References

- [Public Source Zip Implementation Plan](../design/public-source-zip/plan-public-source-zip.md)
- [INSTALLATION.md](../../INSTALLATION.md) - Documents both PUBLIC_SOURCE_ZIP and build command
- [Cloudflare Pages 404 Handling](https://developers.cloudflare.com/pages/configuration/serving-pages/#not-found-behavior)

## Metadata

- **Date**: 2026-01-20
- **Author**: Claude Code (Sonnet 4.5) with Peter Kaminski
- **Status**: Accepted
- **Related ADRs**: None
