# Implementation Plan for Copy Title and URL Button

## Original Wishlist Item

**Status:** In Progress

Add a "Copy Title and URL" button alongside the existing "Copy URL" button.

**Format options:**
- `[Title](URL)` (Markdown link)
- `Title - URL` (plain text)
- `Title\nURL` (multi-line) - **UPDATED:** Changed from `Title\nURL` to `"Title"\nURL`

**Rationale:** Common sharing pattern - people often want to share both title and link together.

**Implementation notes:**
- Use same feedback mechanism as "Copy URL"
- Consider making format configurable via environment variable

---

## Updated Requirements

### Format Options

Three format options will be supported:

1. **`markdown`** - Markdown link format
   - Output: `[Title](URL)`
   - Use case: Sharing in Markdown documents, GitHub, Discord, etc.

2. **`plain`** - Plain text with separator
   - Output: `Title - URL`
   - Use case: Sharing in plain text contexts, emails, etc.

3. **`multiline`** - Multi-line format with quoted title
   - Output: `"Title"\nURL`
   - Use case: Sharing where title and URL should be on separate lines
   - **Change from wishlist:** Title is now wrapped in quotes for clarity

### Configuration

**Environment Variable:** `COPY_TITLE_URL_FORMAT`

**Possible values:**
- `markdown` (default if not set)
- `plain`
- `multiline`

**Rationale for environment variable approach:**
- Reduces cognitive overhead on users - no format selection UI needed
- Admin configures once based on community preference
- Consistent behavior across all posts
- Simpler implementation and maintenance

---

## Implementation Details

### 1. Backend Changes

#### New Configuration Variable

**File:** `functions/api/config.js`

Add new configuration field:

```javascript
copyTitleUrlFormat: env.COPY_TITLE_URL_FORMAT || "markdown"
```

**Documentation:** Add to `CONFIGURATION.md`

### 2. Frontend Changes

#### Post Detail Page (`functions/p/[id].js`)

**Current state:**
- Has "Copy URL" button that copies `window.location.href`
- Uses temporary button text change for feedback ("Copied!")

**Changes needed:**
- Add "Copy Title and URL" button next to existing "Copy URL" button
- Implement format logic based on config value
- Use same feedback mechanism

**Button placement:**
```
[Copy URL] [Copy Title and URL]
```

#### JavaScript Implementation

**Format generation logic:**

```javascript
function formatTitleAndUrl(title, url, format) {
  switch (format) {
    case 'markdown':
      return `[${title}](${url})`;
    case 'plain':
      return `${title} - ${url}`;
    case 'multiline':
      return `"${title}"\n${url}`;
    default:
      return `[${title}](${url})`; // fallback to markdown
  }
}
```

**Copy button handler:**

```javascript
async function copyTitleAndUrl() {
  const title = document.querySelector('h1').textContent || '(untitled)';
  const url = window.location.href;
  const format = CONFIG.copyTitleUrlFormat || 'markdown';
  const formatted = formatTitleAndUrl(title, url, format);
  
  await navigator.clipboard.writeText(formatted);
  
  // Feedback (same pattern as Copy URL button)
  const btn = event.target;
  const originalText = btn.textContent;
  btn.textContent = 'Copied!';
  setTimeout(() => {
    btn.textContent = originalText;
  }, 2000);
}
```

### 3. Documentation Updates

#### CONFIGURATION.md

Add new section:

```markdown
### COPY_TITLE_URL_FORMAT

**Type:** String  
**Default:** `markdown`  
**Possible values:** `markdown`, `plain`, `multiline`

Controls the format used by the "Copy Title and URL" button on post detail pages.

- `markdown`: `[Title](URL)` - Markdown link format
- `plain`: `Title - URL` - Plain text with separator
- `multiline`: `"Title"\nURL` - Multi-line format with quoted title

**Example:**
```
COPY_TITLE_URL_FORMAT=plain
```
```

#### User's Guide.md

Add section explaining the copy buttons:

```markdown
### Sharing Posts

Each post detail page includes two copy buttons:

- **Copy URL** - Copies just the post URL
- **Copy Title and URL** - Copies both title and URL in a configured format

The format for "Copy Title and URL" is set by your administrator.
```

#### WISHLIST.md

Update status from "Proposed" to "Implemented" and add implementation notes.

---

## Testing Plan

### Manual Testing

1. **Test each format:**
   - Set `COPY_TITLE_URL_FORMAT=markdown` and verify output
   - Set `COPY_TITLE_URL_FORMAT=plain` and verify output
   - Set `COPY_TITLE_URL_FORMAT=multiline` and verify output
   - Test with unset variable (should default to markdown)

2. **Test edge cases:**
   - Post with no title (should use "(untitled)")
   - Post with special characters in title
   - Post with very long title
   - Post with quotes in title (for multiline format)

3. **Test feedback mechanism:**
   - Verify "Copied!" message appears
   - Verify button text returns to original after 2 seconds
   - Test rapid clicking

4. **Test clipboard:**
   - Verify copied text matches expected format
   - Test pasting in different contexts (Markdown editor, plain text, etc.)

### Browser Compatibility

- Test in Chrome/Edge (Chromium)
- Test in Firefox
- Test in Safari
- Verify `navigator.clipboard.writeText()` works in all browsers

---

## Files to Modify

1. **`functions/api/config.js`** - Add COPY_TITLE_URL_FORMAT to config
2. **`functions/p/[id].js`** - Add button and copy logic
3. **`CONFIGURATION.md`** - Document new environment variable
4. **`User's Guide.md`** - Document copy buttons for users
5. **`WISHLIST.md`** - Update status to "Implemented"
6. **`CHANGELOG.md`** - Add to next release notes

---

## Estimated Effort

- Backend config: 5 minutes
- Frontend implementation: 30 minutes
- Documentation: 15 minutes
- Testing: 20 minutes

**Total:** ~70 minutes

---

## Future Enhancements (Out of Scope)

- Per-user format preference (would require user accounts)
- Custom format templates via environment variable
- Additional format options (HTML link, BBCode, etc.)
- Copy button on index page for each post
- Bulk copy of multiple posts

---

## Questions for Review

1. Should the multiline format escape quotes in the title? (e.g., `"Title with \"quotes\""\nURL`)
2. Should there be a fourth format option for just `Title\nURL` without quotes?
3. Should the button text be "Copy Title and URL" or something shorter like "Copy Both"?
4. Should we add this button to the index page as well, or just post detail pages?

---

## Implementation Checklist

- [ ] Add `COPY_TITLE_URL_FORMAT` to `functions/api/config.js`
- [ ] Implement format logic in `functions/p/[id].js`
- [ ] Add "Copy Title and URL" button to post detail page
- [ ] Test all three formats
- [ ] Test edge cases (no title, special characters, etc.)
- [ ] Update `CONFIGURATION.md` with new environment variable
- [ ] Update `User's Guide.md` with copy button documentation
- [ ] Update `WISHLIST.md` status to "Implemented"
- [ ] Add to `CHANGELOG.md`
- [ ] Test in multiple browsers
- [ ] Create pull request

---

## Notes

- This feature maintains consistency with existing Textpile patterns (environment variable configuration, simple UI)
- No database changes required
- No breaking changes
- Fully backward compatible (existing "Copy URL" button unchanged)
