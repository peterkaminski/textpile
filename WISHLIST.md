# Textpile Wishlist

Feature ideas and enhancements for future consideration. Not all items may be implemented.

## Post Expiration Awareness

**Status:** Proposed

Add a prominent notice at the top of each post page reminding readers that the content will expire:

> "This post will expire in X days. Save it now if you want to keep it."

**Rationale:** Makes the temporary nature of Textpile explicit to readers who may not be familiar with the platform.

**Implementation notes:**
- Calculate days remaining from `expiresAt` metadata
- Show different messaging for posts expiring soon (< 7 days)
- Style as an info banner, not intrusive

---

## Show Expiration Dates in Index

**Status:** Proposed

Display expiration information alongside creation dates throughout the interface.

**Options:**
- "Created Jan 8 · Expires Feb 8"
- "Created Jan 8 (29 days remaining)"
- Relative time: "Created 2 hours ago · Expires in 29 days"

**Rationale:** Helps readers understand post lifecycle at a glance.

**Implementation notes:**
- Add to index listing
- Add to post view header
- Consider color coding for posts expiring soon

---

## Copy Title and URL Button

**Status:** Proposed

Add a "Copy Title and URL" button alongside the existing "Copy URL" button.

**Format options:**
- `[Title](URL)` (Markdown link)
- `Title - URL` (plain text)
- `Title\nURL` (multi-line)
- Let user configure preference

**Rationale:** Common sharing pattern - people often want to share both title and link together.

**Implementation notes:**
- Use same feedback mechanism as "Copy URL"
- Consider making format configurable via environment variable

---

## Post Comparison Tool

**Status:** Proposed (limited scope)

Provide a way to compare two posts when people submit multiple versions of the same content.

**Approaches:**
- Line-by-line diff (like git diff)
- Side-by-side comparison view
- ~~AI-powered qualitative comparison~~ (out of scope for standard Textpile)

**Use cases:**
- Author posts v1, then posts v2 with edits
- Community posts similar content, want to see differences
- Reviewing edits before reposting

**Implementation notes:**
- Could be client-side JavaScript using a diff library
- Requires way to specify which two posts to compare (URL parameters?)
- Consider privacy implications of cross-referencing posts

---

## Privacy and Security Content Scanning

**Status:** Proposed

Add pre-submission scanning to detect and warn about potential privacy/security risks.

**Detection patterns:**
- Email addresses
- Credit card numbers (Luhn validation)
- National ID numbers (SSN, passport numbers, etc.)
- Keywords: "password", "secret", "api key", "token", etc.
- Phone numbers
- Street addresses (harder, may generate false positives)

**Response levels:**

1. **Warning + Allow:** Email addresses, phone numbers
   - "This post appears to contain an email address. Are you sure you want to post this publicly?"
   - User can confirm or go back to edit

2. **Warning + Strong Discourage:** SSN, passwords, API keys
   - "This post contains what looks like a password or secret key. This is likely a mistake."
   - Require explicit confirmation checkbox

3. **Block:** Credit card numbers, other financial data
   - "Posts containing credit card numbers cannot be submitted. Please remove this information and try again."
   - No way to bypass

**Implementation notes:**
- Client-side scanning (immediate feedback)
- Server-side validation as backup
- Regex patterns for common formats
- Consider false positive rate carefully
- Make patterns configurable via environment variables

**Privacy consideration:** Scanning happens locally/server-side only, no data sent to third parties.

---

## Smart Untitled Post Previews

**Status:** Proposed

When a post has no title, show a meaningful snippet instead of just "(Untitled)".

**Current behavior:**
```
(Untitled)
Created Jan 8, 2026
```

**Proposed behavior:**
```
(Untitled) "Lorem ipsum dolor sit amet, consectetur..."
Created Jan 8, 2026
```

**Snippet extraction algorithm:**
1. Skip common preamble patterns:
   - Markdown headers that are just "Introduction", "Summary", etc.
   - Quoted greetings ("Hi everyone", "Hello", etc.)
   - Common starting phrases ("This is a post about...", "I wanted to share...")
2. Take first 40-60 characters of meaningful content
3. Try to break at word boundaries
4. Add ellipsis if truncated

**Implementation notes:**
- Extract snippet during post submission (store in index)
- Or extract client-side when rendering index (slower but more flexible)
- Consider storing snippet in post metadata for performance
- Fallback to simple truncation if algorithm fails

**Edge cases:**
- Post is only whitespace → "(Untitled - Empty post)"
- Post is only code → Use first line of code
- Post is all Markdown syntax → Strip syntax and extract text

---

## Delete Code for Self-Service Removal

**Status:** Proposed

After submitting a post, show a unique "delete code" that allows the author to remove their post later without admin intervention.

**User flow:**
1. User submits post successfully
2. Post view page displays:
   ```
   ✓ Post created successfully!

   Delete Code: a7b3c9f2

   [Copy Delete Code]

   Save this code if you want to delete this post later.
   You can delete it at: /remove?code=a7b3c9f2
   ```
3. User can bookmark the delete URL or save the code
4. Later, visiting the delete URL removes the post

**Rationale:**
- Enables self-service deletion without requiring admin contact
- Maintains non-attribution (no account needed)
- Empowers authors to control their content

**Implementation notes:**
- Generate cryptographically random delete code on submission (16-32 chars)
- Store delete code in post metadata: `{ ..., deleteCode: "a7b3c9f2" }`
- Create `/remove` page that accepts `?code=` parameter
- Verify code matches post before deletion
- Consider rate limiting to prevent brute force attacks
- Delete code is single-use (post is removed after use)

**Security considerations:**
- Code must be long enough to prevent guessing (128+ bits entropy)
- Consider expiring delete codes after some time (e.g., 24 hours after post expires)
- Don't leak delete codes in index or public APIs

**Alternative approach:**
- Use delete URL instead: `/delete/<post-id>/<delete-token>`
- Requires both post ID and random token to delete

---

## Community Flagging System

**Status:** Proposed

Allow non-admin users to flag problematic posts, automatically hiding them after N flags from different IP addresses.

**Configuration (environment variables):**
```
FLAG_THRESHOLD=3          # Number of flags needed to hide post
FLAG_ENABLED=true         # Enable/disable flagging feature
FLAG_WINDOW_HOURS=24      # Time window for collecting flags
```

**User flow:**
1. Reader sees concerning post
2. Clicks "Flag this post" icon/button on post view
3. System records flag (IP address, timestamp)
4. Once threshold reached (e.g., 3 different IPs), post is hidden
5. Post remains in index but marked as "Hidden (flagged by community)"

**Implementation notes:**
- Store flags in KV: `flag:<post-id>` → `[{ ip, timestamp }, ...]`
- Check unique IPs (deduplicate by IP address)
- Hidden posts stay in KV but add `hidden: true` to metadata
- Post view shows "This post has been hidden by community flags" message
- Admin can still view and un-hide if needed
- Flags expire after `FLAG_WINDOW_HOURS` to prevent old flags from accumulating

**Anti-abuse measures:**
- Rate limit flags per IP (max N flags per hour)
- Consider requiring simple CAPTCHA for flagging
- Log all flag actions for admin review
- Admin interface to see flagged posts and flag history
- **Require ADD_POST_PASSWORD if set:** If `ADD_POST_PASSWORD` environment variable is configured, flagging must also require the add post password (prevents open flagging on gated instances)

**Privacy considerations:**
- Store only hashed IP addresses, not full IPs
- Or use IP address + date (not timestamp) to allow some privacy
- Clear flag data when post expires

**Admin visibility:**
- Admin panel shows flagged posts
- Show flag count and timestamps
- Allow admin to "un-hide" false positives
- Allow admin to "confirm hide" to prevent un-flagging

**Edge cases:**
- What if same person flags from different IPs? (VPN, mobile switching)
- False positives - community might flag legitimate content
- Coordination attacks - group decides to mass-flag

---

## Home Page Filtering and Views

**Status:** Proposed

Add filtering options to the home page for different ways to browse posts.

**Filter options:**

1. **Most Recent 25** (current default)
   - Show latest 25 posts, sorted by creation date

2. **Random 25**
   - Show 25 random posts from the entire index
   - Shuffled each page load
   - Good for discovering older content

3. **All Posts**
   - Show complete index (up to 10,000 posts)
   - Paginated in groups of 50 or 100
   - May be slow/heavy for large instances

4. **Filter by Month**
   - Dropdown or button row: "Jan 2026", "Dec 2025", etc.
   - Show all posts from selected month
   - Display months for which posts exist (not all 12 months)
   - Goes back 12 months or to first post, whichever is less

**UI Design:**

```
┌─────────────────────────────────────────────────────┐
│ Textpile                                            │
│                                                     │
│ View: [Recent 25 ▾] [Random 25] [All] [By Month ▾]│
│                                                     │
│ Post 1 Title                                        │
│ Post 2 Title                                        │
│ ...                                                 │
└─────────────────────────────────────────────────────┘
```

**Implementation notes:**

- Use URL parameters: `/?view=recent25`, `/?view=random25`, `/?view=all`, `/?view=month&m=2026-01`
- Recent 25: Existing behavior (default)
- Random 25: Shuffle index client-side or server-side
- All posts: Return full index, implement client-side pagination
- By month: Filter by `createdAt` month in index

**Performance considerations:**
- "All posts" could be heavy (10,000 posts × metadata)
- Consider server-side pagination for "All" view
- Random sampling: shuffle in JavaScript vs server-side
- Cache month lists (months with posts available)

**Additional features:**
- "Surprise me!" button → redirects to random post
- Search within filtered results (future enhancement)
- Combine filters: "Random 25 from March 2026"

**Month filtering logic:**
```javascript
// Extract month from createdAt: "2026-01-08T..."
const postMonth = createdAt.substring(0, 7); // "2026-01"
if (postMonth === selectedMonth) {
  // Include in filtered results
}
```

**Alternative: Date range picker**
- Instead of month dropdown, allow custom date ranges
- "From: 2026-01-01 To: 2026-01-31"
- More flexible but more complex UI

---

## TOTP Submit Token

**Status:** Proposed

Support Time-based One-Time Password (TOTP) as an alternative or supplement to the static `ADD_POST_PASSWORD`.

**Configuration (environment variables):**
```
ADD_POST_PASSWORD_TYPE=totp       # Options: static, totp, both
TOTP_SECRET=BASE32SECRET     # Base32-encoded TOTP secret
TOTP_WINDOW=1                # Accept codes ±N windows (30s each)
```

**User flow with TOTP:**
1. Instance operator generates TOTP secret and QR code
2. Users add secret to authenticator app (Google Authenticator, Authy, 1Password, etc.)
3. When submitting post, user enters current 6-digit TOTP code
4. Server validates code using RFC 6238 algorithm
5. If valid, post is accepted

**Rationale:**
- More secure than static shared password
- Can be revoked by changing secret (forces all users to re-setup)
- No shared secret to leak (each user has same secret but generates time-based codes)
- Standard protocol supported by all authenticator apps

**Implementation notes:**
- Use lightweight TOTP library (or implement RFC 6238 directly)
- TOTP secret is instance-wide (not per-user - maintains non-attribution)
- Validate against time window (accept ±30-60 seconds for clock drift)
- Consider rate limiting TOTP attempts per IP
- Provide QR code generator for easier setup: `/setup-totp` (admin-only page)

**Alternative: Hybrid mode**
```
ADD_POST_PASSWORD_TYPE=both
ADD_POST_PASSWORD=static-password
TOTP_SECRET=BASE32SECRET
```
Accept either static token OR valid TOTP code.

**Security considerations:**
- TOTP secret must be kept secure (same security level as ADMIN_TOKEN)
- Consider rotating TOTP secret periodically
- Log failed TOTP attempts for monitoring
- TOTP doesn't prevent brute force if window is large

**Drawbacks:**
- More complex than static password
- Requires users to have authenticator app
- Setup is more involved (scan QR code or manually enter secret)
- Clock synchronization issues can cause validation failures

---

## Environment Variables Reference Table (Admin Page)

**Status:** Proposed

Add a section to the admin page showing all possible environment variables and their current values.

**UI Design:**
```
┌──────────────────────────────────────────────────────────┐
│ Environment Configuration                                │
├────────────────────┬─────────────────┬────────────────────┤
│ Variable           │ Current Value   │ Possible Values    │
├────────────────────┼─────────────────┼────────────────────┤
│ INSTANCE_NAME      │ "My Textpile"   │ Any string         │
│ COMMUNITY_NAME     │ "Our Community" │ Any string         │
│ ADMIN_EMAIL        │ admin@example   │ Email address      │
│ ADMIN_TOKEN        │ ******** (set)  │ Random string      │
│ ADD_POST_PASSWORD  │ (unset)         │ Random string      │
│ DEFAULT_RETENTION  │ 1month          │ 1week, 1month,     │
│                    │                 │ 3months, 6months,  │
│                    │                 │ 1year              │
│ MAX_POST_SIZE      │ 1048576         │ Bytes (number)     │
│ DATE_FORMAT        │ "MMM D, YYYY"   │ Date format string │
│ TIME_FORMAT        │ "h:mm a"        │ Time format string │
│ TIMEZONE           │ (unset)         │ IANA timezone      │
└────────────────────┴─────────────────┴────────────────────┘
```

**Rationale:**
- Helps operators verify configuration at a glance
- Shows what's unset vs set
- Documents expected values for each variable
- Useful for debugging configuration issues

**Implementation notes:**
- Server-side: read from `env` object
- Mask sensitive values: show `******** (set)` for tokens/secrets
- Show `(unset)` for undefined variables
- Include description column (optional): what each var controls
- Link to CONFIGURATION.md for detailed documentation
- Consider showing env vars in categories:
  - Identity & Branding
  - Access Control
  - Retention & Limits
  - Display & Formatting

**Security considerations:**
- **NEVER** show actual values of `ADMIN_TOKEN`, `ADD_POST_PASSWORD`, or `TOTP_SECRET`
- Only show masked indicators: `******** (set)` or `(unset)`
- Ensure this page is admin-protected

**Additional features:**
- Color code: green for set, yellow for unset-but-optional, red for unset-and-recommended
- Show defaults when unset: `(unset, default: 1month)`
- Add "Edit" button that links to Cloudflare dashboard settings page
- Validation status: show warning if value looks invalid

**Example implementation:**
```javascript
const ENV_VARS = [
  { name: 'INSTANCE_NAME', sensitive: false, default: 'Textpile', type: 'string' },
  { name: 'ADMIN_TOKEN', sensitive: true, default: null, type: 'secret' },
  { name: 'DEFAULT_RETENTION', sensitive: false, default: '1month',
    options: ['1week', '1month', '3months', '6months', '1year'] },
  // ...
];

function getEnvValue(name, sensitive) {
  const value = env[name];
  if (sensitive && value) return '******** (set)';
  if (!value) return '(unset)';
  return value;
}
```

---

## Public Admin Page (When ADMIN_TOKEN Unset)

**Status:** Proposed

Make the `/admin` page publicly accessible when `ADMIN_TOKEN` environment variable is unset.

**Current behavior:**
- Admin page requires `ADMIN_TOKEN` to be configured
- If unset, admin page returns error or is inaccessible
- No way to access admin features without setting token

**Proposed behavior:**
- If `ADMIN_TOKEN` is **set**: Require token for access (current behavior)
- If `ADMIN_TOKEN` is **unset**: Allow public access to admin page

**Rationale:**
- Single-person instances don't need admin authentication
- Testing and development environments benefit from easier access
- Some communities operate on trust and don't need access control
- Follows convention of "no token = public access"

**Use cases:**
- Personal Textpile instance on local network
- Development and testing
- Small trusted communities
- Read-only admin page for transparency

**Security warning:**
When admin page is public (ADMIN_TOKEN unset), add prominent warning banner:

```
⚠️ Warning: Admin page is publicly accessible
ADMIN_TOKEN is not set. Anyone can access this page and
perform admin operations (delete posts, export data, etc.).

To secure this page, set the ADMIN_TOKEN environment variable.
```

**Implementation notes:**
```javascript
export async function onRequestGet({ request, env }) {
  const adminToken = env.ADMIN_TOKEN;

  // If ADMIN_TOKEN is unset, allow public access
  if (!adminToken) {
    return renderAdminPage(env, {
      warning: 'Admin page is publicly accessible'
    });
  }

  // If ADMIN_TOKEN is set, require authentication
  const providedToken = getCookie(request, 'admin_token');
  if (!providedToken || !await timingSafeEqual(providedToken, adminToken)) {
    return Response.redirect('/admin/login');
  }

  return renderAdminPage(env);
}
```

**Security considerations:**
- Make the warning banner very prominent (red background, icon)
- Consider logging access to public admin page
- Admin operations (delete, pin, etc.) should still require confirmation
- Document this behavior clearly in CONFIGURATION.md

**Related configuration:**
Could extend this to other features:
```
ADD_POST_PASSWORD (unset)  → Public posting
ADMIN_TOKEN (unset)   → Public admin access
FLAG_ENABLED=false    → No community flagging
```

**Alternative approach:**
Add explicit config option:
```
ADMIN_ACCESS=public   # Options: public, private (requires token)
```
But this adds complexity - the current approach (token presence) is simpler.

---

## Notes

- Items are listed in rough order of proposal, not priority
- Some items may conflict with Textpile's core philosophy of simplicity
- Implementation complexity varies significantly
- Community feedback welcome on priorities

