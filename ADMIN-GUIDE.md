# Textpile Administrator's Guide

This guide covers operational tasks for Textpile administrators, including spam prevention, access control, emergency procedures, and monitoring.

## Table of Contents

- [Admin Interface](#admin-interface)
- [Spam Prevention](#spam-prevention)
- [Access Control](#access-control)
- [Rate Limiting](#rate-limiting)
- [Emergency Procedures](#emergency-procedures)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Storage Management](#storage-management)
- [RSS Feed](#rss-feed)
- [Security Best Practices](#security-best-practices)

---

## Admin Interface

Textpile v0.3.0+ includes a web-based admin interface for managing posts and viewing statistics.

### Accessing the Admin Interface

1. **Set ADMIN_TOKEN** environment variable (see [INSTALLATION.md](INSTALLATION.md))
2. Visit `https://your-textpile.pages.dev/admin`
3. Enter your ADMIN_TOKEN when prompted
4. The token is stored in browser localStorage for convenience

### Admin Features

#### Post Management

**View All Posts:**
- Lists all posts with ID, title, creation date, and expiry date
- Shows pinned status (📌 icon)
- Displays post count and total storage estimate

**Delete Posts:**
- Select individual posts with checkboxes
- Click "Delete Selected" to remove chosen posts
- Confirmation dialog prevents accidental deletion
- Posts are immediately removed from storage and index

**Pin/Unpin Posts:**
- Use the "Pin" checkbox for any post
- Pinned posts appear at the top of the homepage
- Useful for announcements or important content
- Pinning updates both the post metadata and index

#### Export Data

**Export All Posts:**
- Click "Export All Posts" button
- Downloads a JSONL (JSON Lines) file
- One post per line with all metadata
- Includes: id, title, body, createdAt, expiresAt, pinned
- Use for backups or migration to another instance

**Example JSONL format:**
```jsonl
{"id":"20260104T123045-abc123","title":"Example Post","body":"# Content here","createdAt":"2026-01-04T12:30:45.000Z","expiresAt":"2026-02-04T12:30:45.000Z","pinned":false}
{"id":"20260104T140000-def456","title":"Important Announcement","body":"Please note...","createdAt":"2026-01-04T14:00:00.000Z","expiresAt":"2027-01-04T14:00:00.000Z","pinned":true}
```

#### Import Data

**Import Posts from JSONL:**
1. Click "Choose File" under Import Posts
2. Select a JSONL file (exported from this or another Textpile)
3. Click "Import"
4. System validates each post and stores it
5. Index is automatically rebuilt
6. Shows success message with import count

**Important:**
- Imported posts retain original expiry dates
- If a post has already expired, it will be imported but immediately expire
- Duplicate IDs will overwrite existing posts
- Index is completely rebuilt from imported data

#### Clear All Posts

**Nuclear Option:**
- Click "Clear All Posts" button
- Confirmation dialog requires typing "DELETE" to proceed
- Deletes ALL posts from KV storage
- Resets index to empty array
- **This action cannot be undone** - export first if needed!

#### Storage Statistics

**Dashboard shows:**
- Total number of posts
- Estimated total storage used (in MB)
- Percentage of MAX_KV_SIZE limit
- Warning indicators:
  - Yellow warning at 80% capacity
  - Red alert at 95% capacity
- Breakdown by individual post sizes

**Note**: Storage calculations are estimates based on JSON serialization of posts and metadata.

---

## Spam Prevention

### Submit Token (First Line of Defense)

The simplest anti-spam measure is requiring a shared submit token.

**Enable Submit Token:**

1. Go to Cloudflare Pages → Your Project → Settings → Environment variables
2. Click **Add variable**
3. Set:
   - Variable name: `ADD_POST_PASSWORD`
   - Value: A strong random string (e.g., `openssl rand -hex 32`)
   - Environment: Production
4. Click **Save**
5. Redeploy your site

**Share the token privately** with your community members via email, private chat, etc.

**Rotate the token** if it's compromised:
- Generate a new token
- Update the environment variable
- Notify legitimate users
- Old token immediately stops working

### Content Monitoring

**Check recent posts:**
- Visit your Textpile homepage regularly
- Review the table of contents
- Check for spam patterns (gibberish, commercial content, etc.)

**Set up alerts** (optional):
- Use Cloudflare Logpush to send logs to external services
- Monitor for unusual submission patterns
- Alert on high submission rates

---

## Access Control

### Cloudflare Access (Advanced Protection)

Cloudflare Access adds authentication in front of your entire site or specific paths.

#### Protecting the Submit Page

**Step 1: Enable Cloudflare Access**

1. In Cloudflare Dashboard, go to **Zero Trust**
2. Navigate to **Access** → **Applications**
3. Click **Add an application**
4. Select **Self-hosted**

**Step 2: Configure Application**

- Application name: `Textpile Submit`
- Session duration: `24 hours` (or as needed)
- Application domain: `your-textpile.pages.dev` (or custom domain)
- Path: `/add`

**Step 3: Create Access Policy**

Choose one of these authentication methods:

**Option A: Email-based (Simple)**
- Policy name: `Allowed Submitters`
- Action: `Allow`
- Include: `Emails` → Add allowed email addresses

**Option B: Google Workspace**
- Policy name: `Organization Members`
- Action: `Allow`
- Include: `Emails ending in` → `@yourcompany.com`

**Option C: GitHub (For Open Source Communities)**
- Policy name: `GitHub Team Members`
- Action: `Allow`
- Include: `GitHub` → Select your organization/team

**Step 4: Apply and Test**

1. Click **Save application**
2. Visit `/add` in an incognito window
3. You should see Cloudflare Access login page
4. Authenticate to confirm it works

#### Protecting the Entire Site

To make the entire Textpile private:

1. Set Path to: `/`
2. This requires authentication for reading AND submitting
3. Useful for internal-only deployments

**Cost**: Cloudflare Access free tier includes 50 users. Beyond that, $3/user/month.

### IP Allow Lists (Advanced)

Restrict access to specific IP ranges:

1. Cloudflare Dashboard → **Security** → **WAF**
2. Create a **Custom Rule**:
   - Name: `Textpile Add Post Allowlist`
   - Expression: `(http.request.uri.path contains "/api/add") and (not ip.src in {1.2.3.4 5.6.7.8})`
   - Action: `Block`

This blocks all submit requests except from specified IPs.

---

## Rate Limiting

### Cloudflare Rate Limiting Rules

Prevent abuse by limiting submission frequency.

**Step 1: Create Rate Limiting Rule**

1. Cloudflare Dashboard → **Security** → **WAF**
2. Go to **Rate limiting rules** tab
3. Click **Create rule**

**Step 2: Configure Rule**

**Example: Limit Submissions**

- Rule name: `Textpile Submit Rate Limit`
- If incoming requests match:
  ```
  (http.request.uri.path eq "/api/add" and http.request.method eq "POST")
  ```
- Then:
  - Choose action: `Block`
  - Duration: `1 hour`
  - Requests: `10` requests per `1 minute`
  - With the same: `IP`

**Step 3: Save and Deploy**

This allows max 10 posts per minute per IP. Adjust as needed for your community size.

**Recommended Rates:**

- **Small community (< 20 users)**: 5 posts/minute per IP
- **Medium community (20-100 users)**: 10 posts/minute per IP
- **Large community (100+ users)**: 20 posts/minute per IP

**Cost**: Cloudflare Rate Limiting included in free tier (10,000 requests/month). Pro plan: unlimited.

### Application-Level Rate Limiting

For finer control, implement rate limiting in the submit function using KV:

```javascript
// In functions/api/add.js
const ipKey = `ratelimit:${request.headers.get('CF-Connecting-IP')}`;
const count = await env.KV.get(ipKey);

if (count && parseInt(count) > 10) {
  return Response.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
}

await env.KV.put(ipKey, String((parseInt(count) || 0) + 1), { expirationTtl: 60 });
```

---

## Emergency Procedures

### Disable Posting Immediately

**Method 1: Remove Submit Token** (if using)

1. Cloudflare Pages → Settings → Environment variables
2. Delete the `ADD_POST_PASSWORD` variable
3. Redeploy
43. Result: All submissions fail with "Add post password required"
**Method 2: Set Invalid Token**

1. Set `ADD_POST_PASSWORD` to a known impossible value (e.g., `DISABLED`)
2. Don't share this value
3. Result: All submissions blocked

**Method 3: Block Submit Endpoint via WAF**

1. Cloudflare Dashboard → Security → WAF → Custom Rules
2. Create rule:
   - Name: `Block Add Post`
   - Expression: `(http.request.uri.path eq "/api/add")`
   - Action: `Block`
3. Result: Immediate 403 Forbidden for all submissions

### Hide All Posts (Emergency Blackout)

**Option 1: Clear the Index** (Reversible)

1. Install Wrangler CLI: `npm install -g wrangler`
2. Login: `wrangler login`
3. Clear index:
   ```bash
   wrangler kv:key put --binding=KV "index" "[]"
   ```
4. Result: Homepage shows "No posts yet" but posts still accessible via direct URL

**Option 2: Replace Homepage** (Quick)

Create a temporary `public/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Textpile - Temporarily Offline</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <div style="text-align: center; padding: 60px 20px;">
    <h1>Textpile is temporarily offline</h1>
    <p>We're addressing some issues. Check back soon.</p>
  </div>
</body>
</html>
```

Commit and push. Redeploys in ~1 minute.

**Option 3: Maintenance Mode via WAF**

1. Create custom rule to serve maintenance page for all requests except admin IPs
2. Allows you to review while users see maintenance message

### Remove Individual Posts

**Via API** (if `ADMIN_TOKEN` is set):

```bash
curl -X POST https://your-textpile.pages.dev/api/remove \
  -H 'content-type: application/json' \
  -d '{"id":"POST_ID_HERE","token":"YOUR_ADMIN_TOKEN"}'
```

**Via KV Dashboard** (manual):

1. Cloudflare Dashboard → Workers & Pages → KV
2. Select your Textpile namespace
3. Find key `post:POST_ID`
4. Click **Delete**
5. Also manually edit the `index` key to remove the entry (JSON)

### Nuclear Option: Delete Everything

**Delete all posts and index:**

```bash
wrangler kv:key list --binding=KV | jq -r '.[].name' | xargs -I {} wrangler kv:key delete --binding=KV "{}"
```

**Or via Dashboard:**
1. Delete the entire KV namespace
2. Create a new one with the same name
3. Rebind in Pages settings

---

## Monitoring and Maintenance

### Check Storage Usage

```bash
# List all keys
wrangler kv:key list --binding=KV

# Count total posts
wrangler kv:key list --binding=KV | jq '. | length'
```

### View Recent Activity

**Cloudflare Analytics:**
1. Pages project → Analytics
2. View requests to `/api/add`
3. Check error rates

**Real-time Logs:**
```bash
wrangler pages deployment tail
```

Shows live function invocations, errors, and console.log output.

### Automatic Cleanup

**Textpile automatically maintains itself with zero manual intervention:**

1. **Post Content**: Cloudflare KV automatically deletes posts when they expire (via TTL)
2. **Index Cleanup**: Expired entries are automatically removed from the index during:
   - Homepage loads (`/api/index`)
   - New post submissions (`/api/add`)
   - Post deletions (`/api/remove`)
   - Pin/unpin operations (`/api/admin/pin`)

**Index Capacity:**
- Maximum 10,000 active posts in the index
- Expired entries don't count toward this limit (auto-filtered)
- Oldest posts are dropped if the limit is reached (after removing expired entries)

**No manual cleanup required** - the system self-maintains. However, you can:

**Manually expire old posts** (if needed):
```bash
# List all posts
wrangler kv:key list --binding=KV --prefix="post:"

# Delete specific post
wrangler kv:key delete --binding=KV "post:YYYYMMDDTHHMMSS-xxxxx"
```

**Rebuild index from scratch** (if corrupted):

```javascript
// Script to rebuild index from all posts
const posts = await env.KV.list({ prefix: "post:" });
const index = [];

for (const key of posts.keys) {
  const meta = await env.KV.getWithMetadata(key.name);
  if (meta.metadata) {
    const id = key.name.replace("post:", "");
    index.push({
      id,
      title: meta.metadata.title,
      createdAt: meta.metadata.createdAt,
      expiresAt: meta.metadata.expiresAt,
      url: `/p/${id}`
    });
  }
}

// Sort by creation date, newest first
index.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

await env.KV.put("index", JSON.stringify(index));
```

---

## Storage Management

### Understanding Storage Limits

**Cloudflare KV Free Tier:**
- 1 GB total storage
- 25 MiB per individual value
- 1,000 writes/day
- 100,000 reads/day

**Textpile Defaults:**
- `MAX_POST_SIZE`: 1 MB per post
- `MAX_KV_SIZE`: 1000 MB total storage target

### Monitoring Storage Usage

**Via Admin Interface:**
1. Visit `/admin`
2. Storage statistics show:
   - Total posts count
   - Estimated total storage (MB)
   - Percentage of MAX_KV_SIZE
   - Warning at 80% (yellow)
   - Alert at 95% (red)

**Via Wrangler CLI:**
```bash
# List all keys
wrangler kv:key list --binding=KV

# Count posts
wrangler kv:key list --binding=KV --prefix="post:" | jq '. | length'

# Get approximate storage size (not exact, but useful)
wrangler kv:key list --binding=KV | jq '[.[].metadata.size] | add'
```

### What to Do When Approaching Limits

**At 80% Capacity (Warning):**
- Review post retention periods (consider shorter defaults)
- Export important posts for external archival
- Communicate with users about storage constraints
- Consider deleting expired posts manually (though they should auto-expire)

**At 95% Capacity (Critical):**
- **Immediate actions:**
  1. Disable new submissions (remove or change ADD_POST_PASSWORD)
  2. Export all posts via admin interface
  3. Manually delete old or large posts
  4. Reduce retention windows for new posts

- **Medium-term solutions:**
  - Reduce `MAX_POST_SIZE` to enforce smaller posts
  - Lower `DEFAULT_RETENTION` to expire posts faster
  - Consider upgrading to Workers Paid ($5/month) for more storage

**Emergency: Exceeded 100% (Storage Full):**
- KV writes will start failing
- Submit API will return errors
- Use admin "Clear All Posts" if necessary (after exporting!)
- Or selectively delete posts via admin interface

### Storage Optimization Tips

**Reduce Storage Usage:**
1. **Shorter retention periods**: Default to `1week` instead of `1month`
2. **Smaller post size limit**: Lower `MAX_POST_SIZE` to 512 KB or 256 KB
3. **Reduce index cap**: In submit.js, change from 10,000 to 5,000 posts (though expired entries are auto-cleaned)
4. **Regular exports**: Export and delete old posts periodically

**Estimate Post Size:**
- Plain text: ~1 KB per 1000 characters
- Markdown with formatting: ~1.5 KB per 1000 characters
- Metadata overhead: ~200 bytes per post
- Index entry: ~150 bytes per post

**Example Capacity:**
- 1000 MB storage ÷ 10 KB average post = ~100,000 posts
- But with 1 month retention, turnover keeps it manageable
- Typical small community: 50-200 active posts at any time

### Manual Cleanup Scripts

**Remove all expired posts** (shouldn't be needed with TTL, but useful if index is stale):

```bash
# Get all posts
wrangler kv:key list --binding=KV --prefix="post:" > posts.json

# Filter expired (requires jq and manual scripting)
# Delete individually via wrangler or admin interface
```

**Rebuild index from scratch** (if corrupted or stale):

Use the admin interface "Export" then "Clear All" then "Import" to rebuild cleanly.

---

## RSS Feed

Textpile v0.3.0+ includes an RSS 2.0 feed for recent posts.

### Accessing the Feed

**Feed URL:** `https://your-textpile.pages.dev/feed.xml`

**What's Included:**
- Last 50 active (non-expired) posts
- Post title, link, publication date, GUID
- Community name in feed metadata
- Atom self-link for feed discovery

### Feed Features

**Automatic Filtering:**
- Expired posts are automatically excluded
- Only active posts appear in feed
- Sorted by creation date (newest first)

**Metadata:**
- Feed title: "Textpile - {COMMUNITY_NAME}"
- Feed description: "Long-form posts for {COMMUNITY_NAME}"
- Last build date updated on each request
- Language: en-us

**Caching:**
- Feed is cached for 5 minutes (Cache-Control header)
- Reduces load on KV storage
- Balance between freshness and performance

### Feed Discovery

**Auto-discovery link** is included in `index.html`:
```html
<link rel="alternate" type="application/rss+xml" title="Textpile RSS Feed" href="/feed.xml" />
```

Modern browsers and feed readers will auto-detect the feed when visiting the homepage.

### User Instructions

**For readers who want to follow via RSS:**
1. Copy feed URL: `https://your-textpile.pages.dev/feed.xml`
2. Add to feed reader (Feedly, NewsBlur, NetNewsWire, etc.)
3. New posts appear automatically

**Note to users:**
- RSS feed only shows active posts
- Expired posts disappear from feed
- Feed readers may cache entries, so expired posts might linger briefly
- Consider feed as a "what's currently available" view, not an archive

### Customization

**Change feed size** (default: 50 posts):
Edit `functions/feed.xml.js`:
```javascript
const recentItems = activeItems.slice(0, 50); // Change to desired number
```

**Change cache duration** (default: 5 minutes):
Edit `functions/feed.xml.js`:
```javascript
"Cache-Control": "public, max-age=300", // 300 seconds = 5 minutes
```

**Add custom feed metadata:**
You can extend the RSS channel with additional fields like `<managingEditor>`, `<webMaster>`, `<category>`, etc. See [RSS 2.0 spec](https://www.rssboard.org/rss-specification) for options.

---

## Security Best Practices

### Protect Your Tokens

**DO:**
- ✅ Use long random tokens (`openssl rand -hex 32`)
- ✅ Store tokens in Cloudflare environment variables (encrypted at rest)
- ✅ Use different tokens for `ADD_POST_PASSWORD` and `ADMIN_TOKEN`
- ✅ Rotate tokens periodically (every 3-6 months)
- ✅ Share tokens via secure channels (Signal, encrypted email)

**DON'T:**
- ❌ Commit tokens to git
- ❌ Share tokens in public forums
- ❌ Use simple/guessable tokens
- ❌ Reuse tokens from other services

### Enable HTTPS Only

Cloudflare Pages enforces HTTPS by default, but ensure:

1. Dashboard → SSL/TLS → Overview
2. Encryption mode: **Full** or **Full (strict)**
3. Always Use HTTPS: **On**

### Monitor for Anomalies

Set up alerts for:
- Sudden spike in submissions
- High error rates (might indicate attacks)
- Storage approaching limits
- Unusual traffic patterns

**Cloudflare Notifications:**
1. Dashboard → Notifications
2. Create notification for:
   - WAF events
   - Rate limiting triggered
   - Pages deployment failures

### Regular Security Checklist

**Monthly:**
- [ ] Review recent posts for spam/abuse
- [ ] Check Cloudflare Analytics for unusual patterns
- [ ] Verify rate limiting rules are working
- [ ] Test admin removal endpoint

**Quarterly:**
- [ ] Rotate `ADD_POST_PASSWORD` and `ADMIN_TOKEN`
- [ ] Review Cloudflare Access policies (if using)
- [ ] Check for Textpile updates
- [ ] Verify backups of important posts (user responsibility, but remind them)

**Annually:**
- [ ] Review overall usage and decide if continuing service
- [ ] Communicate expectations with community
- [ ] Consider if additional anti-spam measures needed

---

## Troubleshooting

### "Submit token required or invalid"

**Causes:**
- Token not set in environment variables
- Wrong environment (set in Preview but accessing Production)
- Token has spaces or special characters (escape properly)

**Fix:**
- Verify token is set in Production environment
- Redeploy after setting
- Test in incognito window

### Rate Limiting Too Aggressive

**Symptoms:**
- Legitimate users getting blocked
- "Too many requests" errors

**Fix:**
- Increase rate limit thresholds
- Adjust time windows
- Consider using token buckets instead of fixed windows

### Posts Not Expiring

**Causes:**
- Old posts created before v0.2.0 (no TTL set)
- KV TTL not working (rare)

**Fix:**
- Manually delete old posts without `expiresAt` metadata
- Verify TTL is set in submit.js code
- Check Cloudflare KV status page

### Index Growing Too Large

**Symptoms:**
- Slow loading of homepage
- Index exceeding KV value size limit (25 MB)

**Fix:**
- Reduce cap from 1000 to 500 entries (in submit.js)
- Implement pagination
- Archive old entries

---

## Cost Management

### Cloudflare Pricing (as of 2025)

**Free Tier Includes:**
- Pages: Unlimited requests
- Functions: 100,000 invocations/day
- KV: 100,000 reads/day, 1,000 writes/day, 1 GB storage
- Rate Limiting: 10,000 requests/month

**When You'll Need Paid:**

**Workers Paid ($5/month):**
- More than 100,000 function calls/day
- More than 1,000 KV writes/day
- More than 1 GB KV storage

**Typical Small Community (< 50 active users):**
- ~100 posts/day = 100 KV writes
- ~1,000 page views/day = 1,000 function calls
- ~500 posts stored = 1-2 MB
- **Cost: Free tier is sufficient**

**Medium Community (100-500 users):**
- ~500 posts/day = 500 KV writes
- ~5,000 page views/day = 5,000 function calls
- ~2,000 posts stored = 5-10 MB
- **Cost: Still free, approaching limits**

**Large Community (500+ users):**
- May need Workers Paid ($5/month)
- Consider reducing retention windows
- Implement caching

---

## When to Shut Down

Remember: **Textpile is designed to be easy to shut down.**

**Consider shutting down if:**
- Maintenance burden becomes annoying
- Spam is overwhelming despite anti-spam measures
- Community has moved to another platform
- Costs exceed acceptable budget
- You're no longer willing to be responsible for the service

**How to communicate shutdown:**

1. **Give advance notice** (2-4 weeks if possible)
2. **Remind users** that Textpile is temporary by design
3. **Encourage users** to save their own copies
4. **Set all retention to minimum** (1 week) to accelerate expiration
5. **Disable submissions** via methods above
6. **Delete the Pages project** when ready
7. **Delete the KV namespace**

**Sample shutdown message:**

```html
<div style="background: #fff3cd; border: 1px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 8px;">
  <h3>⚠️ Textpile Shutting Down</h3>
  <p>This Textpile will shut down on <strong>March 1, 2026</strong>.</p>
  <p>Please save any content you need. Textpile does not maintain backups.</p>
  <p>Thank you for being part of this experiment!</p>
</div>
```

---

## Support and Resources

- **Textpile Documentation**: See [README.md](README.md) and [User's Guide](User's%20Guide.md)
- **Cloudflare Docs**: https://developers.cloudflare.com/
- **Cloudflare Community**: https://community.cloudflare.com/
- **Report Security Issues**: Follow [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Remember**: You're providing a service, not making a promise. Set boundaries, communicate clearly, and don't hesitate to shut down if needed.
