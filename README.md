# Figma Searcher

A Figma plugin for **designers and design system technologists**. It finds every layer using a variable, style, or effect — so you know exactly what's affected before you rename or delete a token.

Figma has no native way to search variable/style/effect usage across a file. This plugin closes that gap without changing how your library is built.

---

## TL;DR

| You want to... | Use the... |
|---|---|
| Find every layer using a color, spacing, text style, or effect | **Find** tab |

No accounts. No syncing. Nothing leaves your file.

---

## 🔍 Find — "who's using this?"

Search for a variable, style, or effect. Get a list of every layer using it, grouped by page.

**Steps:**
1. Open the plugin
2. Pick a mode: **Variable**, **Style**, or **Effect**
3. Type a name — partial matches work (`blue` finds `color/blue/500`)
4. Pick a scope: **This page** (fast) or **All pages** (thorough)
5. Hit Search
6. Click any result to jump straight to that layer

**Good to know:**
- Flip the **Single → Multiple** switch to paste a whole list of names (one per line, or comma-separated) and search them all at once
- **Ignore nesting** hides layers that only inherit the match from a parent — leaves you with the direct hits
- Export your results as **CSV** (for spreadsheets) or **JSON** (for tooling), named after your search term automatically

**Use it for:**
- Checking what breaks *before* you rename or delete a token
- Auditing where an old/deprecated style is still used
- Sanity-checking a design system rollout

---

## What it doesn't do

- Doesn't search across multiple files at once (one file per search)
- Doesn't search inside library components you haven't inserted into the file
- Doesn't rename or edit anything — read-only, always

---

## Privacy

Everything runs locally inside Figma. No data collection, no external servers, no tracking, no login required.

---

## Support

Questions or bug reports: **Silvia Travieso** — silvia.travieso.g@gmail.com

Built with Claude Code.
