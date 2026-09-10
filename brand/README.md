# GRECSOC brand assets — mark 18 · Enjambre

The chosen logo mark, redrawn as final artwork, plus ready-to-upload social media
assets. Browse it at <https://grecsoc.github.io/brand/>.

## What's here

```
brand/
  index.html            the brand-kit page (specimens, palette, downloads)
  favicon.svg           navy rounded square + paper beads
  generate.mjs          regenerates social/ and favicon/ from one set of values
  mark/                 vector sources
    enjambre-mark.svg         currentColor, cropped to the artwork
    enjambre-mark-navy.svg    #34506E
    enjambre-mark-ink.svg     #17181C
    enjambre-mark-paper.svg   #FBFAF7  (for dark / navy grounds)
    enjambre-avatar.svg       optically centred in a square, for icons
  lockup/               mark + wordmark  (wordmark font PROVISIONAL — Libre Franklin placeholder)
    grecsoc-horizontal.svg
    grecsoc-stacked.svg
  social/              PNG exports, light + dark:
    avatar-{light,dark}-{1024,400}.png       profile picture (X, LinkedIn, Instagram)
    x-header-{light,dark}.png                1500×500
    linkedin-cover-{light,dark}.png          1128×191  (company page)
    linkedin-personal-{light,dark}.png       1584×396  (personal profile background)
    og-{light,dark}.png                      1200×630  (link preview)
    mark-{navy,paper}-1024.png               transparent, mark only
  favicon/            favicon-16/32/48.png, apple-touch-icon-180.png, icon-192/512.png
```

## Status

- **Mark:** final. One geometry (five beads that don't touch, on a rising curve that steepens toward the last bead, edge-to-edge gaps equal (~8 units)).
- **Colour:** the shared neutral shell palette (navy `#34506E`, ink `#17181C`,
  paper `#FBFAF7`, pale blue `#A9C4DD` for the mark on dark). A direction-specific
  palette replaces this once the design direction (A–E) is chosen.
- **Wordmark:** provisional. Set in Libre Franklin as a placeholder; the typeface
  and the wording (`GRECSOC` is a working acronym — see `docs/grecsoc.md`) are
  confirmed with the design direction. Until then, prefer the mark alone.

## Regenerating

The geometry, palette and the descriptor line are constants at the top of
`generate.mjs`. Chromium in some sandboxes has no network, so the script fetches
Libre Franklin with Node and embeds it.

```sh
mkdir gen && cd gen
npm init -y && npm i puppeteer sharp
node ../brand/generate.mjs ../brand      # 2nd arg = output root (this folder)
```

Rewrites `social/` and `favicon/`. The `.svg` sources in `mark/` and `lockup/`
share the same numbers by hand — edit them alongside `GEOM` in the script.

## Wired into the site

- All pages use the Enjambre favicon (inline data-URI).
- `index.html` also links `brand/favicon.svg`, the apple-touch-icon, and sets
  Open Graph / Twitter-card tags pointing at `brand/social/og-light.png`.
