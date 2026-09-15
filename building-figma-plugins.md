---
name: building-figma-plugins
description: >-
  Workflow and patterns for building Figma plugins: structure, UI/UX alignment with Figma's design system, Dev Mode compatibility, performance constraints, and documentation practices.
---

# Building Figma Plugins

This skill captures patterns from iterative Figma plugin development: structure, design fidelity, multi-mode support, and user workflows.

## 1. Plugin Structure & Setup

### Manifest Configuration
- **Entry points**: Define `main` (backend JS), `ui` (HTML UI), `code` (legacy alias)
- **Capabilities**: Request only what's needed (`inspect`, `write`, etc.)
- **Permissions**: List required; most plugins can run with `[]`
- **Document access**: Use `dynamic-page` for multi-page search; `restricted` for isolated scope
- **Network access**: Set to `"none"` if sandboxed; bundle fonts/resources as base64 data URIs instead of external CDN links
- **Editor type**: Define `["figma", "dev"]` for dual Design Mode + Dev Mode support
- **Private API**: Set `enablePrivatePluginApi: true` only if accessing undocumented Figma APIs

**Example (`manifest.json`):**
```json
{
  "name": "Plugin Name",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma", "dev"],
  "capabilities": ["inspect"],
  "permissions": [],
  "documentAccess": "dynamic-page",
  "networkAccess": { "allowedDomains": ["none"] },
  "enablePrivatePluginApi": true
}
```

### Window Management
- **Design Mode**: Fixed-size window (e.g., 456×600px)
- **Dev Mode**: Resizable sidebar — UI must reflow gracefully at narrow widths
- Show window with `figma.showUI()`, setting width/height and optionally `themeColors`
- Use `figma.ui.postMessage()` and message handlers for two-way backend ↔ UI communication

## 2. UI/UX: Design Fidelity & System Consistency

### Figma Design System as Source of Truth
- **Pull component specs from Figma itself**: Use Claude's Figma MCP (`get_design_context`, `get_screenshot`) to extract real component states (default, hover, focus, disabled, loading, etc.)
- **Avoid approximation**: A "guessed" button styling that looks close but doesn't match Figma's native components reads as bolted-on, not native
- **Pixel-perfect match for legitimacy**: Users expect plugins to feel like Figma's own UI — invest in exact state coverage

### Components & States to Define
When redesigning plugin UI:
- **Buttons** (primary, secondary, tertiary): 4 states each (default, hover, focus/outline, disabled)
- **Inputs & textareas**: default, focus/outline, disabled, placeholder styling
- **Toggles/switches**: on/off, hover, focus-visible, disabled variants
- **Dropdowns/selects**: trigger + open states, item hover, selected state, checkmark/badge
- **Cards/containers**: border, shadow, padding, radius consistency with surrounding UI
- **Links**: default, hover, visited, focus-visible (4-directional glow via box-shadow)
- **Checkboxes/radios**: custom `appearance: none` + `::after` for consistency (not browser native)
- **Empty states**: icon + message block, consistent across tabs (e.g., icon `⊙`, centered text, subtle styling)
- **Tooltips**: native `title` attrs don't render inside iframe; use CSS `::after` + `data-tooltip` attr instead

### Token System
- **Embed fonts as base64**: Use `@font-face` data URIs for fonts (e.g., IBM Plex Mono, Bricolage Grotesque) — external CDN links fail silently inside sandboxed plugins
- **Define CSS custom properties (tokens)** for colors, spacing, radius, typography, shadows
- **Light + dark theme support**: Base tokens on `:root`, override under `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`
- **Cross-reference Figma's variables**: Call `get_variable_defs` to align plugin tokens with design-system variables (colors, spacing scales)
- **Missing token patterns**: Half-steps in spacing (`--space-1-5: 6px`), shared shadows, unique gaps (`--gap-nav: 22px`) — define only if they repeat or have semantic meaning

### Responsive/Reflow Strategy (Dev Mode Support)
- **Narrow sidebar constraint**: Use flexbox `flex-wrap` + container queries for graceful stacking
- **Min-width breakpoints**: Set on interactive elements (inputs ~120px, buttons ~140px) so they wrap rather than overflow
- **Full-width stacking at true minimum**: Use `@container (max-width: 360px)` to switch `.search-input-row` to `flex-direction: column` when space is critical
- **Token overflow**: On long text (e.g., `color.container.border.default`), use `overflow-wrap: anywhere` instead of `white-space: nowrap` so tokens wrap onto multiple lines
- **Test in both modes**: Design Mode (fixed ~456px) + Dev Mode resized to ~300–400px minimum

## 3. Backend-to-UI Communication

### Message Flow Pattern
1. **Backend (`code.js`)**: Listen for messages from UI, process against Figma document, send results back
2. **UI (`ui.html`)**: Send user actions as messages, receive data/status, update DOM
3. **State management**: Store UI state in `clientStorage` (persists across plugin close/reopen), use `figma.clientStorage.getAsync(key)` on init

**Example:**
```javascript
// code.js
figma.ui.onmessage = async (msg) => {
  if (msg.type === "search") {
    const results = findVariableUsages(msg.query, msg.scope);
    figma.ui.postMessage({ type: "searchResults", results });
  }
};

// ui.html
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (msg.type === "searchResults") {
    renderResults(msg.results);
  }
};
```

## 4. Feature Patterns & User Workflows

### Search → Export → Action Loop
Common plugin pattern:
1. **Search tab**: User queries (variable/style/effect), results grouped by page/component
2. **Export options**: CSV (spreadsheets), JSON (tooling), one row per result
3. **Action button**: Copy to clipboard for downstream use (e.g., paste into multi-search)
- This keeps the plugin focused and lets users chain actions across tabs/files

### Extraction + Transformation Pattern
If reading rich text from a selected frame:
1. **Extract**: Parse text into structured categories (e.g., Added/Changed/Deleted)
2. **Transform**: Derive secondary layers (e.g., rename suggestions by matching old↔new values)
3. **Keep suggestions non-destructive**: Don't mutate counted totals; show renames as a separate row
4. **Bridge to next tool**: Provide copy-to-clipboard that pre-fills downstream UI (e.g., "Copy for Find search")

### Empty State Consistency
- **Same icon across tabs** (e.g., `⊙` icon for "ready" and "no results")
- **Clear language** ("No components found using…" not "No results lol")
- **Actionable next steps** ("Select a scope above" or "Try a different search")

## 5. Performance & Constraints

### Network Isolation
- **No external URLs**: manifest restricts to `allowedDomains: ["none"]`
- **Bundle assets locally**: Fonts, icons, images → base64 data URIs or inline SVG
- **Document access**: `dynamic-page` lets you search across all pages (slower) vs. `restricted` (current page only, faster)
- **Pagination in results**: If returning thousands of rows, paginate or virtualize in the DOM to avoid freezing the UI

### Figma API Limits
- **Finding nodes**: `figma.currentPage.findAll()` is O(n); cache results if searching repeatedly
- **Variant detection**: Walk up the tree to find the nearest `COMPONENT` parent (whose parent is `COMPONENT_SET`) to extract variant properties
- **Bound nodes**: When a component instance uses a variable, store `{ id, name, variantProperties }` from the bound node for CSV export
- **Text extraction**: Parsing large frame text is synchronous; break into chunks if processing multi-MB frames

## 6. Development Workflow & Testing

### Figma → Plugin UI Extraction
1. **Start in Figma**: Design the plugin UI mockup in Figma as a frame (components, states, spacing)
2. **Export via Figma MCP**: Use `get_screenshot` (visual reference) + `get_design_context` (measurements, variables)
3. **Extract component specs**: Pull exact border-radius, padding, font-size, colors, shadows from the Figma component definitions
4. **Implement incrementally**: Code one component type (buttons, inputs, cards) and test in the plugin before moving to the next
5. **Visual regression testing**: After each UI change, open plugin in both Design Mode and Dev Mode (resized) to confirm no reflow/clipping

### Dual-Mode Testing
- **Design Mode**: Fixed 456px width — test primary layout
- **Dev Mode sidebar**: Resize from ~500px down to ~300px — test reflow, container queries, flex-wrap behavior
- **Light + dark themes**: Toggle `figma.editorType === "dev"` in code to simulate dark mode (`body.dev-mode` class)
- **Message handling**: Verify UI updates from backend messages (no console errors, DOM updates cleanly)

## 7. Documentation & Iteration

### Changelog as Living Record
- **Update per-commit**: Note what changed and why (not just what, but WHY the specific approach won)
- **Structural decisions**: When adding a feature or removing one, note the choice at the top level (e.g., "Merged Freeze report into Find via multi-search toggle — kept one matching function instead of duplicating it")
- **Bug findings**: Log real bugs surfaced while implementing a feature, how they were diagnosed
- **Milestone markers**: Tag sessions/commits with clear breakpoints (e.g., "Figma design fidelity pass", "Dev Mode reflow iteration")

**Example entry:**
```
### Extract + Transform Pattern
- `parseChangelogTokens()` walks raw extracted text, buckets into Added/Changed/Deleted, dedupes across collections/modes
- Rename suggestions added as non-destructive layer: `findRenamedSuggestions()` matches `? → newValue` (unresolved old) against Deleted lines with same value
- Kept out of counted totals deliberately — suggestion, not authoritative bucket. Risk: false-positive value collisions across unrelated tokens.
```

### README Structure
1. **Elevator pitch**: What problem does it solve, who is it for
2. **TL;DR / Quick reference table**: Main features, one row per job
3. **Feature breakdown**: For each tab/mode, step-by-step instructions
4. **Filters/options**: Explain toggles and their behavior
5. **What it doesn't do**: Set expectations (e.g., "read-only", "single-file search only")
6. **Privacy**: Confirm local-only if applicable
7. **Support**: Contact info

### Storytelling for Case Study
If building a high-impact plugin, capture:
1. **Problem**: User quote or workflow gap
2. **Constraints**: Figma API limits, access silos, timeline
3. **Insight**: Aha moment that shaped the solution (e.g., "name-change vs. value-change is the only distinction dev needs")
4. **Solution walkthrough**: User flow from start to export
5. **Craft decision**: A specific architectural choice and why it matters
6. **Outcome**: User validation, adoption signal, known next step

## 8. Multi-Feature Plugins: Tab Architecture

### Section-Based Navigation
For plugins with Find / Changelog / Settings:
- **Single DOM, JS-toggled visibility**: Reuse `.foundations-card` / `.results` across Find and multi-search tabs, toggling `currentSection` and `body.foundations-active` class
- **State snapshots per tab**: When switching tabs, save/restore query/results/filters via `sectionResultsState` object, keyed by section ID
- **Shared components**: Mode-tabs, download section, empty states appear consistently across tabs; any style change propagates everywhere
- **Floating nav**: `position: fixed` bottom-center nav (icons or text), not a sidebar — takes zero layout space and stays always-visible

### Settings Panel Pattern
- **Overlay, not a tab**: Settings hides all other sections when open
- **Exclusive state**: `body.changelog-active` cleared on open, restored on close
- **Card-based layout**: Match the main UI's card styling (border/shadow/padding)
- **Persistent storage**: Use `clientStorage` to save file keys, library names, user preferences

## 9. Common Pitfalls & Fixes

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Buttons/inputs appear disabled in dark mode | No `appearance: none`; Chromium native styles override authored CSS | Add `appearance: none; -webkit-appearance: none;` |
| Dropdown/tooltip clipped inside accordion | Parent has `overflow: hidden` for rounded corners | Override to `overflow: visible` on that element |
| Long token names clipped, overlapping result tabs | `.token-chip { white-space: nowrap }` with no wrap container | Use `overflow-wrap: anywhere` + `max-width: 100%` on chip, `min-width: 0` on `.tokens` container |
| Empty state shows at same time as filled content | Multiple CSS rules at same specificity fighting | Use ID selector (`#extractEmptyState { display: none }`) instead of class (`.empty { display: flex }`) to guarantee specificity win |
| Settings panel showing empty when opened from Changelog tab | `body.changelog-active .library-settings { display: none !important }` still in effect | Clear `changelog-active` + `foundations-active` on settings open, restore correct one on close via `currentSection` |
| Native browser tooltips not visible in iframe | Figma plugin UI is sandboxed; native `title` doesn't render | Replace with CSS pseudo-element `::after` + `data-tooltip` attr, shown on `:hover/:focus-visible` |
| Navbar hides bottom content on scroll | `position: fixed` nav stays in place, content scrolls behind it | Add `--nav-clearance` token (nav height + padding) and `padding-bottom: var(--nav-clearance)` on body; change body to `min-height: 100vh` so padding extends scroll |

## 10. Next Steps & Decision Points

### When Starting a New Plugin
1. **Define manifest**: capabilities, permissions, document access, network policy
2. **Outline core loop**: What does the user do first? (search → export? extract → filter? copy → paste?)
3. **Design in Figma first**: Build a mockup; if it's a redesign, pull live component specs from your design system
4. **Start with stub backend**: Implement UI structure and message handlers, mock data in code.js
5. **Test in both modes**: Open in Design Mode fixed window and Dev Mode resizable sidebar early
6. **Document as you go**: Update CHANGELOG.md per session/commit, capture why decisions were made

### When Scaling a Plugin (V1 → V2)
- **Don't fork the matching logic**: Keep one implementation, extend with multi-term support via array OR-match
- **Reuse UI components**: Shared `.foundations-card`, mode-tabs, empty states across new features
- **Add state snapshots**: Use `sectionResultsState` to let users navigate tabs without losing their search context
- **Clarify scope in copy**: Reflect the user's actual task in button labels and messages ("Find" vs. "Freeze report")

### When Plugin Spans Multiple Files
- **Message bridge**: Backend polls `figma.currentFile` and routes to file-specific handlers if needed
- **Cross-file operations**: Document that one search ≠ all-files-at-once (Figma API limitation)
- **Library references**: Store file key + target library name in settings; prompt user if library moved

---

## References

- [Figma Plugin API docs](https://www.figma.com/plugin-docs/)
- [Figma UI components spec](https://www.figma.com/design-system/) (if public)
- [Manifest schema](https://www.figma.com/plugin-docs/manifest/)
- Claude MCP Figma tools: `get_design_context`, `get_screenshot`, `get_variable_defs`
