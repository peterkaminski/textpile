# Textpile Configuration Reference

This document provides a comprehensive reference for all Textpile environment variables.

All configuration is done via environment variables in Cloudflare Pages. See [INSTALLATION.md](INSTALLATION.md) for setup instructions.

---

## Table of Contents

- [Identity and Branding](#identity-and-branding)
- [Access Control](#access-control)
- [Content Retention](#content-retention)
- [Display Formatting](#display-formatting)
- [Size Limits](#size-limits)
- [Quick Reference Table](#quick-reference-table)

---

## Identity and Branding

### INSTANCE_NAME

**Purpose**: Customize the name of this Textpile instance

**Default**: `"Textpile"`

**Usage**: Appears in:
- Page titles (e.g., "Add Post - My Textpile")
- Homepage H1 header
- Browser tabs

**Example Values**:
- `"Research Team Textpile"`
- `"Acme Corp Notes"`
- `"Community Archive"`

**Set in**: Cloudflare Pages → Settings → Environment variables

```
INSTANCE_NAME=Research Team Textpile
```

---

### COMMUNITY_NAME

**Purpose**: Describe the community or group using this instance

**Default**: `"the community"`

**Usage**: Appears in descriptive text on homepage and RSS feed

**Example Values**:
- `"the Acme Research Team"`
- `"Open Source Contributors"`
- `"the Design Working Group"`

**Set in**: Cloudflare Pages → Settings → Environment variables

```
COMMUNITY_NAME=the Acme Research Team
```

**Note**: Include "the" in your value if grammatically appropriate (e.g., "the team" not just "team")

---

### ADMIN_EMAIL

**Purpose**: Display contact email in footer

**Default**: `null` (footer shown without email)

**Usage**: When set, footer displays:
> **Textpile** · operated by [email]
> This site runs Textpile 0.4.0 · source

**Example Values**:
- `"admin@example.com"`
- `"textpile-admin@company.org"`

**Set in**: Cloudflare Pages → Settings → Environment variables

```
ADMIN_EMAIL=admin@example.com
```

**Security Note**: This email will be visible to all visitors

---

## Access Control

### ADD_POST_PASSWORD

**Purpose**: Require a shared secret password for adding posts (anti-spam, referred to as "add post password" in the UI)

**Default**: Not set (adding posts is open)

**Behavior**:
- If set: Users must provide this password when adding posts
- If not set: Anyone can add posts

**Recommended Value**: Use a strong random string
```bash
openssl rand -hex 32
```

**Set in**: Cloudflare Pages → Settings → Environment variables → Production

```
ADD_POST_PASSWORD=your-long-random-string-here
```

**Usage**: Users enter token in submit form (optional field becomes required)

**Security**:
- Share token privately with community members only
- Rotate periodically if compromised
- Timing-safe comparison prevents guessing attacks

**See Also**: [ADMIN-GUIDE.md](ADMIN-GUIDE.md#spam-prevention) for spam prevention strategies

---

### ADMIN_TOKEN

**Purpose**: Enable admin interface and removal API

**Default**: Not set (admin features disabled)

**Behavior**:
- Enables `/admin` web interface
- Enables `/api/remove` and other admin endpoints

**Recommended Value**: Use a strong random string (different from ADD_POST_PASSWORD)
```bash
openssl rand -hex 32
```

**Set in**: Cloudflare Pages → Settings → Environment variables → Production

```
ADMIN_TOKEN=your-different-long-random-string
```

**Admin Features** (when ADMIN_TOKEN is set):
- View all posts
- Delete posts (individually or batch)
- Pin/unpin posts
- Export/import posts (JSONL format)
- Clear all posts
- View storage statistics

**Security**:
- NEVER commit this token to git
- Use a different value from ADD_POST_PASSWORD
- Timing-safe comparison prevents guessing attacks
- Token stored in browser localStorage after first login

**See Also**: [ADMIN-GUIDE.md](ADMIN-GUIDE.md#admin-interface) for admin interface usage

---

## Content Retention

### DEFAULT_RETENTION

**Purpose**: Set default retention period selected in submit form

**Default**: `"1month"`

**Valid Values**:
- `"1week"` - 7 days
- `"1month"` - 30 days
- `"3months"` - 90 days
- `"6months"` - 180 days
- `"1year"` - 365 days

**Set in**: Cloudflare Pages → Settings → Environment variables

```
DEFAULT_RETENTION=1month
```

**Behavior**:
- Pre-selects this option in the retention dropdown on `/add`
- Users can still choose any retention period
- Does not affect already-added posts

**Recommendation**: Choose based on your community's needs and storage constraints

---

## Display Formatting

### DATE_FORMAT

**Purpose**: Control how dates are displayed throughout the site using ICU-style format strings

**Default**: `"YYYY-MM-DD"` (ISO 8601)

**⚠️ BREAKING CHANGE (v0.4.0)**: Named presets (short/medium/long/full) have been removed in favor of ICU format strings. See migration guide below.

#### ICU Format Tokens

Build custom date formats using these tokens:

**Year:**
- `YYYY` → Full year (2026)
- `YY` → Two-digit year (26)

**Month:**
- `MMMM` → Full month name (January)
- `MMM` → Short month name (Jan)
- `MM` → Zero-padded month (01)
- `M` → Month without padding (1)

**Day:**
- `DD` → Zero-padded day (04)
- `D` → Day without padding (4)

**Weekday:**
- `dddd` → Full weekday (Sunday)
- `ddd` → Short weekday (Sun)

#### Common Date Formats by Country

| Country/Region | Format | Example Output |
|----------------|--------|----------------|
| USA | `M/D/YYYY` | 1/4/2026 |
| USA (alt) | `MMM D, YYYY` | Jan 4, 2026 |
| UK/Europe | `DD/MM/YYYY` | 04/01/2026 |
| Germany | `DD.MM.YYYY` | 04.01.2026 |
| France | `DD/MM/YYYY` | 04/01/2026 |
| Japan | `YYYY年MM月DD日` | 2026年01月04日 |
| China | `YYYY年M月D日` | 2026年1月4日 |
| Korea | `YYYY년 M월 D일` | 2026년 1월 4일 |
| ISO 8601 | `YYYY-MM-DD` | 2026-01-04 |
| Canada | `YYYY-MM-DD` | 2026-01-04 |
| Australia | `D/M/YYYY` | 4/1/2026 |
| India | `DD-MM-YYYY` | 04-01-2026 |
| Brazil | `DD/MM/YYYY` | 04/01/2026 |
| Mexico | `DD/MM/YYYY` | 04/01/2026 |

#### Examples

```bash
# ISO 8601 format (recommended for international audiences)
DATE_FORMAT=YYYY-MM-DD

# US format with slashes
DATE_FORMAT=M/D/YYYY

# US format with month name
DATE_FORMAT=MMM D, YYYY

# European format
DATE_FORMAT=DD/MM/YYYY

# German format with dots
DATE_FORMAT=DD.MM.YYYY

# Japanese format
DATE_FORMAT=YYYY年MM月DD日

# Include weekday
DATE_FORMAT=ddd, MMM D, YYYY
```

**Set in**: Cloudflare Pages → Settings → Environment variables

```
DATE_FORMAT=YYYY-MM-DD
```

**Applies to**: Index page, post metadata, admin interface

#### Migration from v0.3.x

If you're upgrading from Textpile v0.3.x, update your DATE_FORMAT value:

| Old Value | New Value | Output |
|-----------|-----------|--------|
| `short` | `M/D/YY` | 1/4/26 |
| `medium` | `MMM D, YYYY` | Jan 4, 2026 |
| `long` | `MMMM D, YYYY` | January 4, 2026 |
| `full` | `dddd, MMMM D, YYYY` | Saturday, January 4, 2026 |

**Invalid formats**: If you specify an invalid format string, the system falls back to `YYYY-MM-DD` (ISO 8601) and logs a warning in the browser console.

---

### TIME_FORMAT

**Purpose**: Control how times are displayed throughout the site using ICU-style format strings

**Default**: `"HH:mm"` (24-hour format)

**⚠️ BREAKING CHANGE (v0.4.0)**: Named presets (short/medium) have been removed in favor of ICU format strings. See migration guide below.

#### ICU Format Tokens

Build custom time formats using these tokens:

**Hour (24-hour):**
- `HH` → Zero-padded 24-hour (13)
- `H` → 24-hour without padding (13)

**Hour (12-hour):**
- `hh` → Zero-padded 12-hour (01)
- `h` → 12-hour without padding (1)

**Minute:**
- `mm` → Zero-padded minutes (05)
- `m` → Minutes without padding (5)

**Second:**
- `ss` → Zero-padded seconds (09)
- `s` → Seconds without padding (9)

**Day Period:**
- `a` → AM/PM marker (PM)

#### Common Time Formats by Country

| Country/Region | Format | Example Output |
|----------------|--------|----------------|
| USA/UK (12-hour) | `h:mm a` | 1:23 PM |
| USA (12-hour with seconds) | `h:mm:ss a` | 1:23:45 PM |
| Europe/Asia (24-hour) | `HH:mm` | 13:23 |
| ISO 8601 (24-hour) | `HH:mm:ss` | 13:23:45 |
| Military | `HHmm` | 1323 |

#### Examples

```bash
# 24-hour format (default, international standard)
TIME_FORMAT=HH:mm

# 24-hour with seconds
TIME_FORMAT=HH:mm:ss

# 12-hour format with AM/PM (USA)
TIME_FORMAT=h:mm a

# 12-hour with seconds
TIME_FORMAT=h:mm:ss a

# Compact 24-hour (no separator)
TIME_FORMAT=HHmm
```

**Set in**: Cloudflare Pages → Settings → Environment variables

```
TIME_FORMAT=HH:mm
```

**Applies to**: Index page, post metadata, admin interface

#### Migration from v0.3.x

If you're upgrading from Textpile v0.3.x, update your TIME_FORMAT value:

| Old Value | New Value | Output |
|-----------|-----------|--------|
| `short` | `h:mm a` | 1:23 PM |
| `medium` | `h:mm:ss a` | 1:23:45 PM |

**Invalid formats**: If you specify an invalid format string, the system falls back to `HH:mm` (24-hour) and logs a warning in the browser console.

---

### Combined Date & Time Examples

| Region | DATE_FORMAT | TIME_FORMAT | Combined Output |
|--------|-------------|-------------|-----------------|
| USA | `M/D/YYYY` | `h:mm a` | 1/4/2026 1:23 PM |
| USA (alt) | `MMM D, YYYY` | `h:mm a` | Jan 4, 2026 1:23 PM |
| UK | `DD/MM/YYYY` | `HH:mm` | 04/01/2026 13:23 |
| Germany | `DD.MM.YYYY` | `HH:mm` | 04.01.2026 13:23 |
| Japan | `YYYY年MM月DD日` | `HH:mm` | 2026年01月04日 13:23 |
| ISO 8601 | `YYYY-MM-DD` | `HH:mm:ss` | 2026-01-04 13:23:45 |

---

## Size Limits

### MAX_POST_SIZE

**Purpose**: Maximum size for individual posts (in bytes)

**Default**: `1048576` (1 MB)

**Behavior**:
- **Client-side**: Real-time validation, submit button disabled if exceeded
- **Server-side**: HTTP 413 Payload Too Large if validation bypassed

**Set in**: Cloudflare Pages → Settings → Environment variables

```
MAX_POST_SIZE=1048576
```

**Examples**:
- 256 KB: `262144`
- 512 KB: `524288`
- 1 MB: `1048576` (default)
- 2 MB: `2097152`

**Important**: Cannot exceed Cloudflare KV limit of 25 MiB per value

**Warning Threshold**: Client displays warning at 750 KB (75% of default)

**See Also**: [ADMIN-GUIDE.md](ADMIN-GUIDE.md#storage-management) for capacity planning

---

### MAX_KV_SIZE

**Purpose**: Target maximum for total storage (in bytes)

**Default**: `1048576000` (1000 MB = ~1 GB)

**Behavior**:
- Used by admin interface to calculate storage percentage
- Yellow warning shown at 80% capacity
- Red alert shown at 95% capacity
- Does NOT enforce limit (Cloudflare KV enforces 1 GB hard limit on free tier)

**Set in**: Cloudflare Pages → Settings → Environment variables

```
MAX_KV_SIZE=1048576000
```

**Examples**:
- 500 MB: `524288000`
- 1000 MB (1 GB): `1048576000` (default)

**Important**:
- Cloudflare KV free tier limit is 1 GB
- This setting is for monitoring, not enforcement
- Admin interface uses this to show capacity warnings

**See Also**: [ADMIN-GUIDE.md](ADMIN-GUIDE.md#storage-management) for capacity management

---

## Quick Reference Table

| Variable | Default | Purpose | Required? |
|----------|---------|---------|-----------|
| `INSTANCE_NAME` | `"Textpile"` | Name of this instance | No |
| `COMMUNITY_NAME` | `"the community"` | Community description | No |
| `ADMIN_EMAIL` | `null` | Contact email in footer | No |
| `ADD_POST_PASSWORD` | Not set | Anti-spam password | No |
| `ADMIN_TOKEN` | Not set | Admin access token | No |
| `DEFAULT_RETENTION` | `"1month"` | Default retention period | No |
| `DATE_FORMAT` | `"medium"` | Date display format | No |
| `TIME_FORMAT` | `"short"` | Time display format | No |
| `MAX_POST_SIZE` | `1048576` | Max post size (bytes) | No |
| `MAX_KV_SIZE` | `1048576000` | Storage target (bytes) | No |

---

## Configuration Best Practices

### Security

1. **Never commit tokens to git**
   - Use Cloudflare environment variables
   - Never store in code or config files

2. **Use strong random tokens**
   - Generate with `openssl rand -hex 32`
   - Use different tokens for ADD_POST_PASSWORD and ADMIN_TOKEN

3. **Limit token exposure**
   - Share ADD_POST_PASSWORD only with community members
   - Keep ADMIN_TOKEN completely private
   - Rotate tokens if compromised

### Branding

1. **Instance Name**
   - Keep it concise (appears in page titles)
   - Make it distinctive from "Textpile" if running multiple instances

2. **Community Name**
   - Include "the" if grammatically appropriate
   - Use lowercase for consistency with surrounding text

3. **Admin Email**
   - Only set if you're willing to be contacted
   - Consider using a role-based email (e.g., admin@) not personal

### Retention

1. **Start conservative**
   - Shorter default retention = less storage pressure
   - Users can still choose longer periods

2. **Match community expectations**
   - Research notes: 3-6 months
   - Announcements: 1 month
   - Reference docs: 6-12 months

### Size Limits

1. **Balance usability and capacity**
   - 1 MB allows substantial Markdown documents
   - Lower to 512 KB or 256 KB if storage is tight
   - Warn users before enforcing strict limits

2. **Monitor storage usage**
   - Check admin interface regularly
   - Adjust limits before hitting 80% capacity

---

## Environment Variable Setup

### In Cloudflare Pages Dashboard

1. Navigate to your Pages project
2. Go to **Settings** → **Environment variables**
3. Click **Add variable**
4. Enter variable name and value
5. Select environment (Production, Preview, or both)
6. Click **Save**
7. **Redeploy your site** for changes to take effect

### Example: Setting INSTANCE_NAME

```
Variable name: INSTANCE_NAME
Value: Research Team Textpile
Environment: Production
```

### Testing Locally

Create a `.dev.vars` file in your project root (automatically gitignored):

```
INSTANCE_NAME=My Local Textpile
COMMUNITY_NAME=test community
ADD_POST_PASSWORD=test-token-123
ADMIN_TOKEN=admin-token-456
DEFAULT_RETENTION=1week
DATE_FORMAT=short
TIME_FORMAT=short
MAX_POST_SIZE=524288
MAX_KV_SIZE=1048576000
```

Run with Wrangler:
```bash
wrangler pages dev public/
```

**Important**: Never commit `.dev.vars` to git!

---

## Troubleshooting

### Changes not taking effect

**Problem**: Updated environment variable but site shows old value

**Solution**:
1. Verify variable is set in correct environment (Production vs Preview)
2. **Redeploy the site** (bindings only apply to new deployments)
3. Clear browser cache
4. Check browser console for errors

### Token not working

**Problem**: ADD_POST_PASSWORD or ADMIN_TOKEN rejected

**Causes**:
- Variable not set in Production environment
- Site not redeployed after setting variable
- Token has spaces or special characters
- Typed incorrectly when submitting

**Solution**:
1. Verify exact token value in Cloudflare dashboard
2. Redeploy site
3. Test in incognito window
4. Copy-paste token instead of typing

### Configuration not loading

**Problem**: Default values shown instead of configured values

**Causes**:
- `/api/config` endpoint failing
- JavaScript error in browser
- Network/CORS issue

**Solution**:
1. Visit `/api/config` directly in browser
2. Check browser console for errors
3. Verify Functions are working (not just static files)
4. Check Cloudflare Pages Functions logs

---

## See Also

- **[INSTALLATION.md](INSTALLATION.md)** - How to deploy and configure Textpile
- **[ADMIN-GUIDE.md](ADMIN-GUIDE.md)** - Admin interface and operational tasks
- **[User's Guide.md](User's%20Guide.md)** - End-user documentation
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and philosophy
