# Plan: Add Markdown Preview to "Add Post"

## Goal

Add optional Markdown preview to `/add` so authors can verify formatting before publishing, while keeping the default authoring experience simple and fast for users who do not need preview.

## Current Baseline

- `/add` is a single-page HTML form in `public/add.html` with:
  - title
  - body textarea
  - retention selector
  - optional add-post password (inside `<details>`)
- Published posts render Markdown on `/p/[id]` via client-side `marked` loaded from CDN (`functions/p/[id].js`).
- `/api/add` stores raw body text and does not transform Markdown (`functions/api/add.js`).

## Product/UX Principles

- Keep the default flow unchanged: write text and publish.
- Make preview opt-in and unobtrusive (progressive disclosure).
- Preserve trust by matching preview rendering to real post rendering as closely as possible.
- Avoid visual clutter on mobile and small screens.
- Maintain fast initial page load for users who never open preview.

## Proposed UX

1. Add a compact control near the body field:
   - `Show Markdown preview` (toggle button).
2. Keep preview collapsed/off by default.
3. When enabled:
   - show a preview panel below the textarea, labeled `Preview`.
   - render current textarea content as Markdown.
4. Add a lightweight mode switch only when preview is enabled:
   - `Split` (editor + preview) on wide screens.
   - `Preview only` and `Edit only` options on narrow screens.
5. Include a short note in the preview area:
   - `Preview approximates final rendering.`
6. Do not add mandatory settings or extra fields.

## Technical Approach

### 1) Shared renderer utility (preferred)

- Create a small shared browser module for Markdown rendering options, e.g. `public/markdown-renderer.js`.
- Configure `marked` once in that module and reuse it in:
  - `/add` preview
  - `/p/[id]` post rendering
- This reduces divergence between preview and final display.

Alternative (acceptable for first iteration):
- Keep `/p/[id]` as-is and mirror equivalent `marked` config in `/add`.
- Follow-up task to centralize config.

### 2) Lazy-load Markdown parser

- Do not load `marked` on initial `/add` page load.
- Load parser only after user enables preview.
- Cache load state so repeated toggles do not re-fetch.

### 3) Add preview UI in `public/add.html`

- Add hidden preview container below body textarea:
  - `<section id="preview-panel" hidden>...`
- Add toggle and mode buttons with clear ARIA labels.
- Use existing styles plus a few scoped classes in `public/style.css`:
  - preview panel card
  - split layout container
  - active/inactive mode buttons

### 4) Live rendering behavior

- On body input, debounce preview render (e.g., 120-200ms).
- Render with `marked.parse(bodyValue)`.
- Empty state text when textarea is blank.
- Error fallback in panel if parser load/render fails.

### 5) Safety hardening

- Confirm `marked` configuration does not allow unsafe raw HTML execution.
- If needed, sanitize rendered HTML before assigning `innerHTML`.
- Ensure links in preview use safe attributes (`rel="noopener noreferrer"` for external targets) if opening new tabs is added.

### 6) Keep publish path unchanged

- No changes to `/api/add` contract.
- No changes to stored post format.
- No preview dependency for submission.

## Accessibility and Mobile Requirements

- Toggle and mode controls keyboard-accessible and screen-reader labeled.
- Respect reduced-motion preferences (no required animations).
- On small screens, default preview mode to stacked or single-pane (never cramped side-by-side).
- Maintain current form readability and tap target sizes.

## Testing Plan

1. Manual UI checks on `/add`:
   - Preview off by default.
   - Enable/disable preview without affecting form fields.
   - Live update with headings, lists, links, code blocks.
   - Mobile-width behavior remains readable.
2. Submission regression:
   - Publish flow works with preview never opened.
   - Publish flow works after preview opened/closed multiple times.
3. Rendering parity checks:
   - Compare sample content in `/add` preview vs resulting `/p/:id` rendering.
4. Failure-path checks:
   - Simulate markdown parser load failure and verify graceful message.

## Rollout Plan

1. Implement behind default-off UI (no feature flag required for v1).
2. Validate with a short sample set of real markdown posts.
3. Ship with concise user-facing note in `User's Guide.md`:
   - Preview is optional and intended as a convenience.

## Files Expected to Change

- `public/add.html` (preview controls + logic)
- `public/style.css` (preview layout styles)
- `functions/p/[id].js` (optional: align with shared renderer config)
- `public/markdown-renderer.js` (new, if shared utility chosen)
- `User's Guide.md` (brief documentation update)

## Out of Scope (for this iteration)

- WYSIWYG editor
- autosave drafts
- markdown linting
- collaborative editing
- server-side markdown rendering pipeline changes
