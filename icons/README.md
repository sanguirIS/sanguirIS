# Icon set

Self-hosted, theme-toggled icons for the `sanguirIS` profile README. Every icon
comes in two variants that a `<picture>` element swaps automatically with the
reader's GitHub theme:

| Path | Shown when | Tuned for |
| --- | --- | --- |
| `icons/light/<name>.svg` | `prefers-color-scheme: light` | white canvas (`#ffffff`) |
| `icons/dark/<name>.svg` | `prefers-color-scheme: dark` | GitHub dark canvas (`#0d1117`) |

Both variants share identical geometry — same 48×48 grid, same 13px corner
radius, same glyph position and optical size — so switching themes swaps colours
only and never shifts the layout.

## Files

| Icon | `light` | `dark` |
| --- | --- | --- |
| CodePen | ![](light/codepen.svg) | ![](dark/codepen.svg) |
| Dev.to | ![](light/devto.svg) | ![](dark/devto.svg) |
| X | ![](light/x.svg) | ![](dark/x.svg) |
| LinkedIn | ![](light/linkedin.svg) | ![](dark/linkedin.svg) |
| Stack Overflow | ![](light/stackoverflow.svg) | ![](dark/stackoverflow.svg) |
| YouTube | ![](light/youtube.svg) | ![](dark/youtube.svg) |
| HackerRank | ![](light/hackerrank.svg) | ![](dark/hackerrank.svg) |
| TikTok | ![](light/tiktok.svg) | ![](dark/tiktok.svg) |
| Home | ![](light/home.svg) | ![](dark/home.svg) |
| Portfolio | ![](light/portfolio.svg) | ![](dark/portfolio.svg) |
| Gmail — KPAHIMNA | ![](light/gmail.svg) | ![](dark/gmail.svg) |

`gmail.svg` is the odd one out: it is a 182×56 pill (envelope + **KPAHIMNA**
wordmark + `@gmail.com`), not a square tile.

## Usage in Markdown

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="icons/dark/codepen.svg">
  <source media="(prefers-color-scheme: light)" srcset="icons/light/codepen.svg">
  <img src="icons/dark/codepen.svg" alt="CodePen" width="44" height="44"
       style="height:44px;width:auto;max-width:100%;display:block">
</picture>
```

`height` on the `<img>` plus `width:auto` is what makes the icons responsive:
they scale with the container instead of overflowing on narrow screens, and the
`width`/`height` attributes keep the aspect ratio stable while loading.

## Regenerating

```bash
python3 tools/build_icons.py   # standard library only, no dependencies
```

Glyph geometry, bounding boxes, optical sizes and colours all live in
[`tools/glyphs.json`](../tools/glyphs.json); `tools/build_icons.py` renders that
into the two themed variants. To add an icon, drop a new entry in `glyphs.json`
and re-run — the script auto-centres the glyph from its bounding box and fits it
to the optical target.

## Credits & licences

* Brand geometry: [simple-icons](https://simpleicons.org) (CC0-1.0). Background
  plates stripped, glyphs re-scaled and re-centred; theme colours are ours.
* **KPAHIMNA** wordmark set in [Montserrat](https://fonts.google.com/specimen/Montserrat)
  700 (SIL Open Font License 1.1), converted to outlines so the badge renders
  identically everywhere with no web-font dependency.
* Trademarks belong to their respective owners; these are profile links, not
  endorsements.
