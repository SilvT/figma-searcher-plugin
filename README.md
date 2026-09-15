# Variable, Style & Effect Finder

A Figma plugin that finds every layer using a specific variable, style, or effect — so you know exactly what's affected before you rename or delete a token.

Figma has no native way to search token usage across a file. This closes that gap.

## What it does

- Search by **variable**, **style**, or **effect** name
- Partial matches work — search "background" and find `core/background`, `brand/background`, `input-field/active/background`, etc.
- Type names with `/` or `.` — both work the same
- Search **one name at a time**, or paste a list to search **many at once**
- Choose scope: current page (fast) or the whole file (thorough)
- **Ignore nesting** — hide layers that only inherit a match from a parent, and see just the direct hits
- Click any result to jump straight to that layer
- Export results as **CSV** or **JSON**, named after your search term

## Good for

- Checking what breaks before renaming or deleting a token
- Auditing where an old or deprecated style is still used
- Sanity-checking a design system rollout

## What it doesn't do

- Search across multiple files at once
- Search inside library components you haven't inserted into the file
- Rename or edit anything — it's read-only, always

## Install

**From Figma Community:** search "Variable, Style & Effect Finder" and run it from the Plugins menu.

**Local dev version:** clone this repo → Figma → Plugins → Development → Import plugin from manifest → pick `manifest.json`.

## Privacy

Runs entirely inside Figma. No accounts, no external servers, no tracking, nothing leaves your file.

## License

MIT — see [LICENSE](LICENSE).

## Support

Questions or bug reports: **Silvia Travieso** — silvia.travieso.g@gmail.com
