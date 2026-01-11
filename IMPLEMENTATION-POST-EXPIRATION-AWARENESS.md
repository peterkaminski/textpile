# Implementation Document: Post Expiration Awareness

**Feature:** Add a prominent notice at the top of each post page reminding readers that the content will expire.

**Status:** Implementation planning
**Date:** 2026-01-11
**Branch:** `claude/pkcc-post-expire-2025-01-11-Bhw3n`

---

## Overview

This feature adds a visible expiration notice to post pages, making the temporary nature of Textpile explicit to readers who may not be familiar with the platform. The notice will:

1. Display prominently at the top of each post page (below header, above title)
2. Calculate and show days remaining until expiration
3. Use different messaging for posts expiring soon (< 7 days)
4. Style as an informational banner, not intrusive

### Example Messages

**Standard notice (≥ 7 days remaining):**
> ℹ️ **This post will expire in 23 days.** Save it now if you want to keep it.

**Urgent notice (< 7 days remaining):**
> ⚠️ **This post will expire in 3 days.** Save it now if you want to keep it.

**Very urgent notice (< 24 hours remaining):**
> ⚠️ **This post will expire in 8 hours.** Save it now if you want to keep it.

---

## Current Behavior

### Post Page Rendering (`functions/p/[id].js`)

Currently, the post page displays:
- Header with navigation links
- Post title (or "(untitled)")
- Creation date and post ID
- Action buttons (view as plain text, copy text, copy URL)
- Post content rendered as Markdown

The `expiresAt` metadata is available in the backend (line 23) but is **not displayed** to users. The system checks if a post has expired (lines 30-76) and returns a 410 Gone page if so, but provides no advance warning to readers of active posts.

### Relevant Code Locations

- **Post rendering:** `functions/p/[id].js:6-175`
- **Metadata retrieval:** `functions/p/[id].js:13` (includes `expiresAt`)
- **Expiration check:** `functions/p/[id].js:30-76`
- **Client utilities:** `public/textpile-utils.js` (date formatting functions)
- **Styling:** `public/style.css`

---

## Proposed Changes

### 1. Server-Side Calculation

In `functions/p/[id].js`, after fetching post metadata:

1. Calculate time remaining until expiration
2. Determine appropriate message level (standard, urgent, very urgent)
3. Pass this information to the HTML template
4. Include formatted expiration date/time

**Calculation logic:**

```javascript
const now = Date.now();
const expiryTime = new Date(expiresAt).getTime();
const msRemaining = expiryTime - now;
const daysRemaining = Math.floor(msRemaining / (24 * 60 * 60 * 1000));
const hoursRemaining = Math.floor(msRemaining / (60 * 60 * 1000));

let urgencyLevel = 'standard'; // 'standard', 'urgent', 'veryUrgent'
if (hoursRemaining < 24) {
  urgencyLevel = 'veryUrgent';
} else if (daysRemaining < 7) {
  urgencyLevel = 'urgent';
}
```

### 2. HTML Banner Insertion

Insert the expiration banner immediately after the `<header>` element and before the `<h1>` title.

**Banner HTML structure:**

```html
<div class="expiration-notice expiration-notice-{urgencyLevel}">
  <span class="expiration-icon">{icon}</span>
  <span class="expiration-message">
    <strong>This post will expire in {timeRemaining}.</strong>
    Save it now if you want to keep it.
  </span>
</div>
```

**Time remaining format:**
- ≥ 7 days: "X days" (e.g., "23 days")
- 2-6 days: "X days" (e.g., "3 days")
- < 2 days: "X hours" (e.g., "8 hours")
- < 1 hour: "X minutes" (e.g., "45 minutes")

### 3. CSS Styling

Add new styles to `public/style.css`:

```css
/* Expiration notice banner */
.expiration-notice {
  border-radius: 10px;
  padding: 12px 16px;
  margin: 12px 0 18px 0;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  line-height: 1.4;
}

.expiration-icon {
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
}

.expiration-message {
  font-size: 14px;
  flex: 1;
}

/* Standard notice (≥ 7 days) */
.expiration-notice-standard {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: inherit;
}

/* Urgent notice (< 7 days) */
.expiration-notice-urgent {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: inherit;
}

/* Very urgent notice (< 24 hours) */
.expiration-notice-veryUrgent {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: inherit;
}
```

**Design rationale:**
- Uses semi-transparent backgrounds to respect light/dark mode
- Subtle borders for definition without being jarring
- Icon + text layout for scannability
- Consistent with existing `.card` styling patterns
- Not overly prominent but clearly visible

---

## Implementation Plan

### Phase 1: Core Functionality

**File:** `functions/p/[id].js`

**Changes:**

1. **After line 23** (where `expiresAt` is extracted), add calculation logic:

```javascript
const expiresAt = metadata.expiresAt || null;

// Calculate expiration notice details
let expirationNotice = null;
if (expiresAt) {
  const now = Date.now();
  const expiryTime = new Date(expiresAt).getTime();
  const msRemaining = expiryTime - now;
  const daysRemaining = Math.floor(msRemaining / (24 * 60 * 60 * 1000));
  const hoursRemaining = Math.floor(msRemaining / (60 * 60 * 1000));
  const minutesRemaining = Math.floor(msRemaining / (60 * 1000));

  // Determine urgency level and time display
  let urgencyLevel = 'standard';
  let icon = 'ℹ️';
  let timeDisplay = '';

  if (hoursRemaining < 24) {
    urgencyLevel = 'veryUrgent';
    icon = '⚠️';
    if (hoursRemaining < 1) {
      timeDisplay = minutesRemaining === 1 ? '1 minute' : `${minutesRemaining} minutes`;
    } else {
      timeDisplay = hoursRemaining === 1 ? '1 hour' : `${hoursRemaining} hours`;
    }
  } else if (daysRemaining < 7) {
    urgencyLevel = 'urgent';
    icon = '⚠️';
    timeDisplay = daysRemaining === 1 ? '1 day' : `${daysRemaining} days`;
  } else {
    timeDisplay = daysRemaining === 1 ? '1 day' : `${daysRemaining} days`;
  }

  expirationNotice = {
    urgencyLevel,
    icon,
    timeDisplay,
  };
}
```

2. **After line 98** (after the `</header>` closing tag), insert the expiration notice banner:

```javascript
  </header>

  ${expirationNotice ? `
  <div class="expiration-notice expiration-notice-${expirationNotice.urgencyLevel}">
    <span class="expiration-icon">${expirationNotice.icon}</span>
    <span class="expiration-message">
      <strong>This post will expire in ${escapeHtml(expirationNotice.timeDisplay)}.</strong>
      Save it now if you want to keep it.
    </span>
  </div>
  ` : ''}

  <h1>${escapeHtml(title || "(untitled)")}</h1>
```

### Phase 2: Styling

**File:** `public/style.css`

**Changes:** Add the CSS rules described in section 3 above to the end of the file.

### Phase 3: Testing

**Test cases:**

1. **Post with 30+ days remaining**
   - Should show blue info banner with ℹ️ icon
   - Message: "This post will expire in X days"

2. **Post with 3 days remaining**
   - Should show orange warning banner with ⚠️ icon
   - Message: "This post will expire in 3 days"

3. **Post with 12 hours remaining**
   - Should show red urgent banner with ⚠️ icon
   - Message: "This post will expire in 12 hours"

4. **Post with 30 minutes remaining**
   - Should show red urgent banner with ⚠️ icon
   - Message: "This post will expire in 30 minutes"

5. **Legacy post without expiresAt**
   - Should not show any expiration notice (graceful fallback)

6. **Expired post**
   - Current 410 Gone behavior should remain unchanged
   - No expiration notice shown (post is already expired)

**Testing approach:**

Since we cannot easily manipulate time in production:
- Test with posts at various retention windows (1 week, 1 month, etc.)
- Verify banner appearance on newly created posts
- Test visual styling across different screen sizes
- Verify dark mode compatibility
- Check posts created before this feature (no `expiresAt` in old schema)

---

## Edge Cases & Considerations

### 1. Posts Without Expiration Metadata

**Issue:** Older posts may not have `expiresAt` in metadata (if created before expiration tracking was added).

**Solution:** Check for null/undefined `expiresAt` and gracefully skip the notice:

```javascript
if (!expiresAt) {
  expirationNotice = null; // No notice shown
}
```

### 2. Time Zone Considerations

**Issue:** Server time vs. user local time may differ.

**Solution:** All calculations use server time (Date.now()) compared against UTC timestamps stored in `expiresAt`. This is consistent with KV TTL expiration which also uses server time. Users see relative time ("3 days") which is timezone-agnostic.

### 3. Expiration Race Condition

**Issue:** A post might expire between page load and user reading.

**Impact:** Minimal - the banner shows a snapshot at page load time. If the user tries to reload after expiration, they'll see the 410 Gone page. This is acceptable behavior.

**No action needed:** The notice explicitly says "Save it now" which encourages immediate action.

### 4. Very Short Expiration Windows

**Issue:** Posts expiring in < 1 minute might show "0 minutes" or negative values.

**Solution:** Add minimum floor:

```javascript
if (minutesRemaining < 1) {
  timeDisplay = 'less than 1 minute';
  // Or: don't show the notice if < 1 minute (user can't reasonably act on it)
}
```

### 5. Mobile & Responsive Design

**Issue:** Banner should work well on small screens.

**Solution:** The flex layout (`display: flex`) automatically wraps on narrow screens. The icon stays left-aligned, text wraps naturally. No additional media queries needed.

### 6. Accessibility

**Considerations:**
- Banner uses semantic HTML (divs with descriptive classes)
- Icon is purely decorative (visual indicator), message is text
- Color is not the only indicator (emoji/icon + text both convey urgency)
- Works with screen readers (reads as normal text)

**Optional enhancement:** Add `role="alert"` for screen reader announcements:

```html
<div class="expiration-notice expiration-notice-{urgencyLevel}" role="status" aria-live="polite">
```

(Use `role="status"` instead of `role="alert"` to avoid being too intrusive)

---

## Alternative Approaches Considered

### 1. Client-Side Calculation

**Approach:** Calculate time remaining in JavaScript on page load.

**Pros:**
- Could show a live countdown timer
- Respects user's local timezone

**Cons:**
- Requires passing `expiresAt` to client
- More complex JavaScript
- Doesn't work if JS disabled
- Server-side is simpler and sufficient

**Decision:** Use server-side calculation for simplicity.

### 2. Exact Expiration Time

**Approach:** Show exact expiration date/time instead of relative time.

**Example:** "This post will expire on January 15, 2026 at 3:42 PM UTC."

**Pros:**
- Precise information
- No ambiguity about "days" calculation

**Cons:**
- More verbose
- Timezone confusion (UTC vs. local time)
- Less actionable than relative time

**Decision:** Use relative time ("X days") which is more scannable and actionable.

### 3. Collapsible Banner

**Approach:** Allow users to dismiss/collapse the banner.

**Pros:**
- Less intrusive for repeat readers
- Could use localStorage to remember preference

**Cons:**
- Adds complexity
- Risk that users dismiss and forget
- Textpile philosophy is "non-attributed" - no user tracking/preferences

**Decision:** Keep banner always visible. It's not intrusive enough to need dismissal.

---

## Migration & Compatibility

### Backward Compatibility

**No breaking changes:**
- All posts created after v0.8.0 already have `expiresAt` in metadata
- Posts without `expiresAt` gracefully skip the notice
- No database migration needed
- No API changes

### Forward Compatibility

**Future enhancements that would build on this:**
- Show expiration date in index listing (separate wishlist item)
- Add expiration date to RSS feed
- Export expiration metadata in admin panel
- Allow extending/shortening expiration for individual posts

---

## Performance Impact

**Negligible:**
- Calculation is simple arithmetic (< 1ms)
- No additional KV reads (uses existing metadata fetch)
- HTML template grows by ~150 bytes
- CSS adds ~800 bytes (minified: ~400 bytes)

**No caching implications:**
- Posts are already marked `cache-control: no-store`
- Expiration notice is calculated per-request (correct behavior)

---

## Code Review Checklist

- [ ] Expiration calculation logic is correct
- [ ] All time units handled (days, hours, minutes)
- [ ] Edge cases covered (null expiresAt, < 1 minute, negative values)
- [ ] HTML escaping applied to dynamic values
- [ ] CSS respects light/dark mode (transparent backgrounds)
- [ ] Banner is visually consistent with existing UI
- [ ] No accessibility regressions
- [ ] Works without JavaScript (server-rendered)
- [ ] No breaking changes to existing posts

---

## Testing Plan

### Manual Testing

1. **Create test posts with various expiration windows:**
   ```bash
   # Via /add form or API:
   POST /api/add
   {
     "body": "Test post content",
     "title": "Test: Expires in 1 week",
     "expiry": "1week"
   }

   # Repeat for: 1week, 1month, 3months, 6months, 1year
   ```

2. **Verify banner appearance:**
   - Check each test post's page
   - Confirm correct urgency level (color + icon)
   - Verify time remaining display

3. **Visual testing:**
   - Test in light mode
   - Test in dark mode
   - Test on mobile (narrow viewport)
   - Test on desktop (wide viewport)

4. **Browser testing:**
   - Chrome/Edge (Chromium)
   - Firefox
   - Safari (if available)

### Automated Testing

**Unit tests** (if test framework exists):

```javascript
describe('Expiration notice calculation', () => {
  test('calculates days remaining correctly', () => {
    const now = Date.now();
    const expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
    const result = calculateExpirationNotice(expiresAt);
    expect(result.timeDisplay).toBe('30 days');
    expect(result.urgencyLevel).toBe('standard');
  });

  test('shows urgent notice for < 7 days', () => {
    const now = Date.now();
    const expiresAt = new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString();
    const result = calculateExpirationNotice(expiresAt);
    expect(result.urgencyLevel).toBe('urgent');
  });

  test('handles missing expiresAt gracefully', () => {
    const result = calculateExpirationNotice(null);
    expect(result).toBe(null);
  });
});
```

---

## Deployment Plan

### Pre-Deployment

1. Create feature branch (already created: `claude/pkcc-post-expire-2025-01-11-Bhw3n`)
2. Implement changes (Phase 1 & 2)
3. Test locally with `wrangler pages dev`
4. Manual QA (visual testing, different expiration windows)
5. Code review

### Deployment

1. Merge to main branch (or create PR)
2. Deploy to Cloudflare Pages (automatic or manual)
3. Verify in production:
   - View existing posts
   - Create new test post
   - Check banner appears correctly

### Post-Deployment

1. Monitor for issues:
   - Check Cloudflare logs for errors
   - Test a few post pages manually
   - Verify CSS loads correctly

2. User feedback:
   - Observe if users report confusion or issues
   - Adjust messaging if needed (minor iteration)

### Rollback Plan

**If issues occur:**

1. **Quick fix:** Revert changes to `functions/p/[id].js` (remove banner HTML)
2. **CSS rollback:** Remove new styles from `style.css`
3. **Deploy:** Push rollback commit and redeploy

**No data migration needed** - feature is purely presentational.

---

## Documentation Updates

After implementation, update the following documentation:

### WISHLIST.md
- Change status from "Proposed" to "Implemented"
- Add implementation date and version
- Link to this implementation document

### CLAUDE.md (optional)
- Add brief note about expiration notice feature
- Mention that posts show expiration warnings

### README.md (if exists)
- Update features list to mention expiration awareness

---

## Success Metrics

**How to measure success:**

1. **Clarity:** Users understand posts are temporary
2. **No confusion:** No user reports of unexpected expiration
3. **Visual quality:** Banner fits naturally into existing design
4. **Performance:** No noticeable slowdown in page load times

**Qualitative indicators:**
- Fewer user questions about "where did my post go?"
- Positive feedback on transparency of expiration policy

---

## Summary

This feature enhances Textpile's core philosophy of temporary, non-archived content by making expiration explicit and visible to all readers. The implementation is:

- **Simple:** Server-side calculation, minimal code changes
- **Non-intrusive:** Informational banner, not a modal or alert
- **Accessible:** Works without JavaScript, respects color schemes
- **Backward compatible:** Gracefully handles posts without expiration metadata
- **Maintainable:** No new dependencies, uses existing date formatting utilities

**Files to modify:**
1. `functions/p/[id].js` - Add expiration calculation and banner HTML
2. `public/style.css` - Add banner styling

**Estimated effort:** 1-2 hours implementation + testing

**Risk level:** Low (purely additive, no breaking changes)
