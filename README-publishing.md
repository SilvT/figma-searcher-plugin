# Variable, Style & Effect Finder

**Version:** 2.0.0
**License:** MIT — see LICENSE file
**Author:** Silvia Travieso Gonzalez
**Copyright:** © 2026 Silvia Travieso Gonzalez
**Distribution:** Figma Community (public)
**Support:** Silvia Travieso (silvia.travieso.g@gmail.com)

Finds every component using a specific variable, style, or effect in your Figma file. Search across your entire file or just the current page.

## What's the point?

Can't remember which components use that blue color? Or need to see what breaks when you rename a token? This plugin tells you instantly. Works with variables, styles, and effects.

## What it does

✅ Search for variables, styles, and effects
✅ Get a list of every component using them
✅ Click to jump to that component
✅ Search current page or entire file
✅ Export results as CSV or JSON
✅ Meaningful filenames based on search term

## What it doesn't do

❌ Search across multiple files
❌ Search library components
❌ Rename or update tokens

## Installation

**From Figma Community:**
1. Find "Variable, Style & Effect Finder" in the Figma Community plugins page
2. Click "Open in Figma" or install it from the Plugins menu inside any file
3. Run it from Plugins → Variable, Style & Effect Finder

**For local development:**
1. Download this repo
2. Figma → Plugins → Development → Import plugin from manifest
3. Pick `manifest.json`

## How to use it

1. Open your design file
2. Plugins → Variable, Style & Effect Finder
3. Pick a search mode: **Variable**, **Style**, or **Effect**
4. Type what you're searching for:
   - Variables: `colors/primary` or `blue`
   - Styles: `drop shadow` or `heading large`
   - Effects: `elevation` or `blur`
5. Choose scope: **This page** (fast) or **All pages** (thorough)
6. Press Enter or click Search
7. Click results to jump to components using that token/effect

**Exporting:**
- CSV for spreadsheets and audits
- JSON for integrations and automation
- Filenames based on your search term (e.g., `elevation-report-2026-06-25.csv`)

**Filename Format:**
The exported file uses your search term as the basis:
- Format: `{search-term}-report-{YYYY-MM-DD}.{csv|json}`
- Spaces and slashes converted to hyphens (e.g., `color/primary` → `color-primary`)
- Limited to 40 characters (long names are truncated)
- Date added automatically for version control
- Examples:
  - Search "elevation" → `elevation-report-2026-06-25.csv`
  - Search "drop shadow" → `drop-shadow-report-2026-06-25.csv`
  - Search "colors/primary/default" → `colors-primary-default-report-2026-06-25.csv`

## Privacy & Data Handling

**No data is collected, stored, or transmitted.** This plugin:
- ✅ Operates locally within Figma
- ✅ Never sends data to external servers
- ✅ Does not use cookies or local storage
- ✅ Does not require login or authentication
- ✅ Does not track usage or analytics

All search, analysis, and processing happens within your Figma file. Results are available only in your current session.

## Tech stack

- JavaScript
- Figma API
- HTML/CSS

That's it. Local file only, no accounts, no syncing.

## Why use it

- **Before renaming tokens** → See exactly what breaks
- **Auditing usage** → Find out-of-spec components and effects
- **Impact analysis** → Understand scope of design system changes
- **Cleanup** → Find unused styles and effects
- **Team sync** → Export results and share findings
- **Fast on large files** → Search current page for quick answers

## Features

- **Three search modes** - Variables, Styles, and Effects
- **Scope control** - Search current page or all pages with auto-refresh
- **Results grouping** - Organized by page and component for easy navigation
- **Effect details** - Shows effect type and properties (blur, offset, color)
- **Flexible matching** - Supports spaces, slashes, and partial matches
- **Smart export** - CSV and JSON formats with search-based filenames
- **Design system UI** - Light theme with monospace typography for a clean, professional look

## Known Limitations

❌ **Cannot search library components** — Only searches components in the current file
❌ **Cannot search across multiple files** — One file at a time
❌ **Cannot rename or update tokens** — Search and analysis only
❌ **Team/organization-wide search** — File scope only (design file must be open)

## Troubleshooting

**No results found?**
- Verify the variable/style/effect name exists in the file
- Check capitalization (search is case-insensitive, but style names must match)
- Try a partial match (e.g., "shadow" instead of "drop shadow")
- Ensure the scope toggle is set correctly (Current Page vs All Pages)

**Plugin is slow on large files?**
- Switch to "Current Page" mode for faster searches
- Close other browser tabs to free up memory
- Large files (500+ components) may take 1-2 seconds to search all pages

**Results are incomplete?**
- Verify all pages are included (use "All Pages" scope)
- Check that variables/styles are actually used in the file
- Unused tokens will not appear in results

**Export file won't open?**
- Verify the file downloaded completely
- Check file format (CSV vs JSON) matches your application
- For CSV: try opening in Google Sheets or Excel
- For JSON: use a text editor or JSON viewer

## Support & Contact

For bug reports, questions, or feature requests:
📧 **Email:** Silvia Travieso at silvia.travieso.g@gmail.com
📝 **License:** See LICENSE file (MIT)

## Security & Privacy Notes

- ✅ No external API calls or data transmission
- ✅ No authentication or credential storage required
- ✅ No local file storage or caching
- ✅ No cookies, tracking, or analytics
- ✅ Plugin operates in Figma's iframe sandbox (isolated from host)
- ✅ No dependencies or package managers

**Data Handling:**
- Plugin processes only in-memory data from open Figma files
- No data persists after session closes
- Export files are generated client-side only
- User has full control over downloaded exports

## Version History

See CHANGELOG.md for full version history.
