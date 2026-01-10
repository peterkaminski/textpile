# Textpile User's Guide

## For Authors: Adding Content

### How to Add a Post

1. Click the "Add Post" link on the homepage
2. Enter an optional title (max 140 characters)
3. Paste your content in Markdown or plain text (max 1 MB by default)
4. Select a retention period (how long before the post expires)
5. If required, enter the shared add post password
6. Click "Publish"
7. You'll be redirected to your published post

### Important Notes for Authors

**Textpile does not retain your content permanently:**
- Posts expire automatically based on retention settings
- Maintainers do not back up content
- **Keep your own copy** of everything you add
- Save the Textpile URL along with your local copy

**No attribution is stored:**
- Textpile does not collect or store author identity
- Keep attribution and context in your own records
- Consider including version strings in your document title (e.g., "v2026-01-04-001")

### Content Formatting

Textpile supports Markdown formatting:

```markdown
# Heading 1
## Heading 2

**Bold text**
*Italic text*

- Bullet points
- Work great

[Links](https://example.com) are supported

> Blockquotes for emphasis

`inline code` and

```
code blocks
```
```

### Retention Windows

When expiration is enabled, posts automatically expire after:
- 1 week
- 1 month
- 3 months
- 6 months
- 1 year

**There is no "forever" option.** This is intentional to keep Textpile low-maintenance.

### What Happens When a Post Expires

When your post expires:
- The content is automatically deleted from storage
- The post URL will return "410 Gone"
- It will disappear from the table of contents
- **There is no recovery** - maintainers do not have backups

## For Readers: Finding and Reading Content

### Browsing Posts

The homepage displays the table of contents:
- Posts are listed with pinned posts first, then newest to oldest
- 📌 icon indicates pinned posts (announcements, important content)
- Each entry shows: title (or "untitled"), creation date, and post ID
- Click any title to read the full post
- Click "RSS" link to subscribe to the RSS feed

### Reading a Post

Individual posts (`/p/:id`) display:
- Title and metadata (creation date, post ID, expiry date)
- Full Markdown-rendered content
- **View toggle button**: Switch between formatted Markdown and plain text
- **Copy text button**: Copy the raw Markdown to your clipboard
- Navigation links: "Add Post" to add new content, "Home" to return to homepage

**Post View Features:**

**Toggle Markdown Rendering:**
- Default: Post displays with Markdown formatting (headings, bold, links, etc.)
- Click "View as plain text" to see raw Markdown source
- Click "View formatted" to return to rendered view
- Useful for copying formatted content or troubleshooting rendering

**Copy Post Text:**
- Click "Copy text" button to copy raw Markdown to clipboard
- Shows "Copied!" confirmation message
- Great for saving your own posts or quoting content
- **Remember**: Always keep your own copies! Textpile doesn't back up content.

### Expired Content

If you visit a URL for an expired post, you'll see:
- **410 Gone** status (not 404)
- A message explaining the content has expired
- Reminder that Textpile doesn't retain backups

## Following via RSS

Textpile provides an RSS 2.0 feed for following new posts in your feed reader.

**How to Subscribe:**
1. Copy the feed URL: `https://your-textpile.pages.dev/feed.xml`
2. Add it to your RSS feed reader (Feedly, NewsBlur, NetNewsWire, Inoreader, etc.)
3. New posts will appear automatically in your reader

**What the RSS feed includes:**
- Last 50 active (non-expired) posts
- Post titles, links, and publication dates
- Automatically excludes expired posts
- Updated every 5 minutes

**Feed Discovery:**
- Modern browsers auto-detect the RSS feed when you visit the homepage
- Look for the RSS icon in your browser's address bar

**Note:** Expired posts disappear from the feed. Your feed reader may cache entries briefly, so recently expired posts might linger for a short time.

## For Administrators

### Optional Add Post Password

If `ADD_POST_PASSWORD` is configured as an environment variable:
- Users must provide the password when adding posts
- Share the password privately with your community
- Prevents open spam posts

If `ADD_POST_PASSWORD` is not set:
- Anyone can add posts
- Useful for fully open communities or internal networks

### Admin Interface

If `ADMIN_TOKEN` is configured, you can manage posts via the admin interface:

**Access:** Visit `https://YOURDOMAIN/admin`

**Features:**
- View all posts with metadata
- Delete individual or multiple posts
- Pin/unpin posts (pinned posts appear at top of homepage)
- Export all posts as JSONL (for backups)
- Import posts from JSONL (for migration or restoration)
- Clear all posts (nuclear option)
- View storage statistics and capacity warnings

See [ADMIN-GUIDE.md](ADMIN-GUIDE.md) for detailed admin documentation.

### Quick Takedown via API

You can also remove posts directly via API:

```bash
curl -X POST https://YOURDOMAIN/api/remove \
  -H 'content-type: application/json' \
  -d '{"id":"POST_ID_HERE","token":"YOUR_ADMIN_TOKEN"}'
```

This immediately:
- Deletes the post from KV storage
- Removes it from the table of contents
- Makes the URL return 404

### Pinned Posts

Administrators can pin important posts to keep them at the top of the homepage:

**Via Admin Interface:**
1. Visit `/admin`
2. Check the "Pin" checkbox next to any post
3. Pinned posts display with a 📌 icon
4. Pinned posts always appear above unpinned posts, regardless of date

**Use cases for pinning:**
- Community announcements
- Guidelines or rules
- Important reference documents
- Urgent notices

**Note:** Pinned posts still expire normally according to their retention period.

### Maintenance Expectations

**Textpile is designed to require zero ongoing maintenance:**
- No database backups needed (but export feature available)
- No manual content moderation required
- No sweeper jobs or cron tasks
- KV handles expiration automatically
- Admin interface for occasional management

**If maintenance becomes burdensome:**
- It's socially acceptable to shut down Textpile
- Users know this is a temporary surface
- No implied promise of stewardship

## Community Guidelines

### Recommended Practices

**For users:**
- Keep your own archive of added content
- Include title + version in your documents
- Add Textpile URLs back to your own records

**For maintainers:**
- Set clear expectations about retention
- Use `ADD_POST_PASSWORD` (add post password) if spam becomes an issue
- Don't hesitate to shut down if overhead grows

### What Textpile Is Not

- **Not an archive**: Content expires automatically
- **Not a publishing platform**: No author profiles or attribution
- **Not a discussion forum**: No comments or replies
- **Not a permanent record**: Maintainers can shut down anytime

### What Textpile Is

- **A temporary reading surface**: Share content for limited time
- **A coordination tool**: Complement to email/chat for long-form posts
- **A low-burden service**: Easy to maintain, easy to shut down
- **A conscious choice**: Temporary by design, not by accident
