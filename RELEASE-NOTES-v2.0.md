# Release notes — v2.0 (vs. original v1.0)

## Short version (for Figma's "Release notes" publish box)

Variable, Style & Effect Finder has grown from a single variable-name search into a fast, focused design-token audit tool. Highlights since v1.0:

- **Multi-term search**: paste a list of names and search them all at once
- Variable, style, and effect search, with export to **CSV** or **JSON**
- **Dev Mode support** — works for teammates on dev seats, not just Design Mode

## Full version

### v1.0 (starting point)
- Search for a single variable by exact name (`name/name/name` notation and `name.name.name` notation), both full and partial search results.
- Style and effect search
- No multi-search, no export
- Design Mode only

### What's new in v2.0

**Search (the "Find" tab)**
- **Multi-search**: switch to "Multiple" and paste a whole list of names (one per line or comma-separated) to search them all in one pass, instead of one variable at a time
- Scope control: search the current page (fast) or the whole file (thorough)
- "Ignore nesting" filter to drop layers that only inherit a match from a parent
- Click any result to jump straight to that layer on canvas
- Export results as **CSV** (for spreadsheets) or **JSON** (for tooling), named after your search term automatically

**Platform / access**
- Full feature parity between Design Mode and Dev Mode — v1.0 was Design Mode only, which meant teammates on dev-only Figma seats couldn't use it at all
- UI reflows correctly in Dev Mode's resizable sidebar (as narrow as ~300px), not just in a fixed Design Mode window

**Interface**
- Rebuilt to match Figma's own UI kit pixel-for-pixel (buttons, switches, dropdowns) so it reads as a native part of Figma rather than a bolted-on tool
- Consistent empty-state language and iconography

**Privacy** (unchanged since v1.0)
- Everything runs locally in Figma. No accounts, no external servers, no data collection.

---

## This fork: personal Community release (no Changelog tab)

This build is a trimmed personal fork prepared for publishing to the Figma Community. It removes the client-specific "Changelog" / "Freeze report" tab and its "Foundations library" targeting settings that existed in an earlier internal build — those depended on one team's specific changelog-frame convention and don't belong in a general-purpose tool. Only **Find** (variable/style/effect search, single or multiple, with CSV/JSON export) ships here.
