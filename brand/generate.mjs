// GRECSOC — social asset generator (mark: "Enjambre")
//
// Regenerates everything in brand/social/ and brand/favicon/ from the
// geometry + tokens below. Run from a scratch dir that has the deps:
//
//   mkdir gen && cd gen && npm init -y && npm i puppeteer sharp
//   node /path/to/brand/generate.mjs
//
// Output goes next to this script (../brand/social, ../brand/favicon).
//
// Wordmark is set in Libre Franklin as a PLACEHOLDER — the final wordmark
// typeface is chosen with the design direction (A–E). The descriptor line
// (DESCRIPTOR, below) is editable copy, not a locked tagline.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import puppeteer from 'puppeteer';
import sharp from 'sharp';

// output dir: argv[2] if given (lets the script run from a scratch dir that
// holds node_modules), otherwise the folder this file lives in.
const HERE = process.argv[2] || dirname(fileURLToPath(import.meta.url));
const OUT_SOCIAL = join(HERE, 'social');
const OUT_FAV = join(HERE, 'favicon');

// ---- geometry — one mark, shared with the .svg sources in brand/mark/ -------
// Five beads that DON'T touch, on a rising curve that steepens toward the last
// bead (not a straight line) — reads as acceleration/exponential. Gaps between
// bead edges are equal (~8 units) rather than center-to-center spacing.
const GEOM = [[16,66,3],[31.3,63.3,4.5],[48.4,56.4,6],[66.2,44.4,7.5],[83.3,26.7,9]];
const GEOM_VB = '13 17.7 79.3 51.3';              // tight bounding box of GEOM
const GEOM_NUDGE = 'translate(-2.7 6.7)';         // optical centring for square crops

// ---- tokens ----------------------------------------------------------------
const T = {
  paper:  '#FBFAF7',
  paper2: '#F2EFE8',
  ink:    '#131417',
  navy:   '#34506E',
  onDark: '#A9C4DD',   // mark colour on dark grounds — pale blue, holds at small sizes
  soft:   '#54565E',
  softDark:'#9B9C98',
};

// Expansion of the working acronym — factual, no positioning claim.
// Name and sigla are still "por confirmar" (see docs/grecsoc.md).
const DESCRIPTOR = 'Grupo de Estudios de Ciencias Sociales Computacionales';

// ---- svg helpers ----------------------------------------------------------
const dots = (fill) =>
  GEOM.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`).join('');

// square mark, mark optically centred (for avatars / icons)
const markSquare = (fill, size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="${fill}"
        xmlns="http://www.w3.org/2000/svg"><g transform="${GEOM_NUDGE}">${dots(fill)}</g></svg>`;

// mark cropped to its bounding box — fills its frame, for lockups
const markTight = (fill, h) =>
  `<svg width="${(h * 79.3 / 51.3).toFixed(1)}" height="${h}" viewBox="${GEOM_VB}" fill="${fill}"
        xmlns="http://www.w3.org/2000/svg">${dots(fill)}</svg>`;

// Libre Franklin, fetched once by Node (Chromium here has no network) and
// embedded so rendering is deterministic. Placeholder face — see header note.
let FONT_CSS = '';
async function loadFont() {
  const ua = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } };
  const css = await (await fetch(
    'https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@500;600&display=swap', ua)).text();
  const faces = [...css.matchAll(/@font-face\s*{[^}]*}/g)].map((m) => m[0]);
  const out = [];
  for (const face of faces) {
    const url = face.match(/url\(([^)]+)\)/)[1].replace(/["']/g, '');
    const b = Buffer.from(await (await fetch(url, ua)).arrayBuffer());
    out.push(face.replace(/url\([^)]+\)/, `url(data:font/ttf;base64,${b.toString('base64')})`));
  }
  FONT_CSS = out.join('\n');
}

// full HTML doc rendered at 2x then downscaled for clean edges
const page = (w, h, bg, body) => `<!doctype html><html><head><meta charset="utf-8">
<style>
${FONT_CSS}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${w}px;height:${h}px;overflow:hidden}
  body{background:${bg};font-family:'Libre Franklin',system-ui,-apple-system,'Segoe UI',sans-serif;
       -webkit-font-smoothing:antialiased;display:flex;align-items:center;justify-content:center}
  .wm{font-weight:600;letter-spacing:.02em;line-height:1}
  .desc{font-weight:500;line-height:1.35}
  .row{display:flex;align-items:center}
</style></head><body>${body}</body></html>`;

// ---- asset specs --------------------------------------------------------
// avatars: mark on a plain ground, safe for a circular crop (COMPACT geometry)
const avatarBody = (px, markColor, bg) => `
  <div style="width:${px}px;height:${px}px;background:${bg};display:flex;align-items:center;justify-content:center">
    ${markSquare(markColor, Math.round(px * 0.9))}
  </div>`;

// horizontal lockup used on wide art — mark ~1.15x cap height, nudged to
// sit on the type's optical centre
const lockupRow = (markColor, textColor, markH, fontPx, gapPx) => `
  <div class="row" style="gap:${gapPx}px">
    <span style="display:flex;transform:translateY(${Math.round(fontPx*0.06)}px)">${markTight(markColor, markH)}</span>
    <span class="wm" style="color:${textColor};font-size:${fontPx}px">GRECSOC</span>
  </div>`;

const bannerBody = (w, h, { bg, markColor, textColor, descColor, markPx, fontPx, descPx, gap, stackGap, align = 'center', pad = 0 }) => `
  <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:${align === 'center' ? 'center' : 'flex-end'};padding-right:${pad}px">
    <div style="display:flex;flex-direction:column;align-items:${align === 'center' ? 'center' : 'flex-end'};gap:${stackGap}px;text-align:${align === 'center' ? 'center' : 'right'}">
      ${lockupRow(markColor, textColor, markPx, fontPx, gap)}
      <span class="desc" style="color:${descColor};font-size:${descPx}px;max-width:${Math.round(w*0.85)}px">${DESCRIPTOR}</span>
    </div>
  </div>`;

const SPECS = [
  // ---- avatars ----
  { name: 'avatar-light-1024',  w:1024, h:1024, bg:T.paper, body: avatarBody(1024, T.navy,   T.paper) },
  { name: 'avatar-light-400',   w:400,  h:400,  bg:T.paper, body: avatarBody(400,  T.navy,   T.paper) },
  { name: 'avatar-dark-1024',   w:1024, h:1024, bg:T.ink,   body: avatarBody(1024, T.onDark, T.ink)   },
  { name: 'avatar-dark-400',    w:400,  h:400,  bg:T.ink,   body: avatarBody(400,  T.onDark, T.ink)   },

  // ---- mark only, transparent (for placing on your own colour) ----
  { name: 'mark-navy-1024',   w:1024, h:1024, bg:'transparent', transparent:true,
    body: `<div style="width:1024px;height:1024px;display:flex;align-items:center;justify-content:center">${markTight(T.navy, 860)}</div>` },
  { name: 'mark-paper-1024',  w:1024, h:1024, bg:'transparent', transparent:true,
    body: `<div style="width:1024px;height:1024px;display:flex;align-items:center;justify-content:center">${markTight(T.paper, 860)}</div>` },

  // ---- X / Twitter header 1500x500 ----
  { name: 'x-header-light', w:1500, h:500, bg:T.paper,
    body: bannerBody(1500,500,{ bg:T.paper, markColor:T.navy, textColor:T.navy, descColor:T.soft,
      markPx:88, fontPx:104, descPx:34, gap:40, stackGap:28 }) },
  { name: 'x-header-dark', w:1500, h:500, bg:T.ink,
    body: bannerBody(1500,500,{ bg:T.ink, markColor:T.onDark, textColor:T.paper, descColor:T.softDark,
      markPx:88, fontPx:104, descPx:34, gap:40, stackGap:28 }) },

  // ---- LinkedIn company page cover 1128x191 ----
  // content starts ~150px in, clear of the company logo overlaid at bottom-left
  { name: 'linkedin-cover-light', w:1128, h:191, bg:T.paper,
    body: `<div style="width:100%;height:100%;display:flex;align-items:center;padding-left:150px">
      <div class="row" style="gap:24px">
      <span style="display:flex;transform:translateY(3px)">${markTight(T.navy, 50)}</span>
      <span class="wm" style="color:${T.navy};font-size:54px">GRECSOC</span>
      <span style="width:1px;height:60px;background:${T.soft};opacity:.35;margin:0 12px"></span>
      <span class="desc" style="color:${T.soft};font-size:24px">${DESCRIPTOR}</span></div></div>` },
  { name: 'linkedin-cover-dark', w:1128, h:191, bg:T.ink,
    body: `<div style="width:100%;height:100%;display:flex;align-items:center;padding-left:150px">
      <div class="row" style="gap:24px">
      <span style="display:flex;transform:translateY(3px)">${markTight(T.onDark, 50)}</span>
      <span class="wm" style="color:${T.paper};font-size:54px">GRECSOC</span>
      <span style="width:1px;height:60px;background:${T.softDark};opacity:.4;margin:0 12px"></span>
      <span class="desc" style="color:${T.softDark};font-size:24px">${DESCRIPTOR}</span></div></div>` },

  // ---- LinkedIn personal profile background 1584x396 ----
  // content kept to the right, clear of the profile photo (lower-left)
  { name: 'linkedin-personal-light', w:1584, h:396, bg:T.paper,
    body: bannerBody(1584,396,{ bg:T.paper, markColor:T.navy, textColor:T.navy, descColor:T.soft,
      markPx:66, fontPx:78, descPx:27, gap:30, stackGap:20, align:'right', pad:110 }) },
  { name: 'linkedin-personal-dark', w:1584, h:396, bg:T.ink,
    body: bannerBody(1584,396,{ bg:T.ink, markColor:T.onDark, textColor:T.paper, descColor:T.softDark,
      markPx:66, fontPx:78, descPx:27, gap:30, stackGap:20, align:'right', pad:110 }) },

  // ---- Open Graph / link preview 1200x630 ----
  { name: 'og-light', w:1200, h:630, bg:T.paper,
    body: bannerBody(1200,630,{ bg:T.paper, markColor:T.navy, textColor:T.navy, descColor:T.soft,
      markPx:86, fontPx:100, descPx:34, gap:38, stackGap:30 }) },
  { name: 'og-dark', w:1200, h:630, bg:T.ink,
    body: bannerBody(1200,630,{ bg:T.ink, markColor:T.onDark, textColor:T.paper, descColor:T.softDark,
      markPx:86, fontPx:100, descPx:34, gap:38, stackGap:30 }) },
];

// ---- run ---------------------------------------------------------------
async function run() {
  await mkdir(OUT_SOCIAL, { recursive: true });
  await mkdir(OUT_FAV, { recursive: true });
  await loadFont();

  const browser = await puppeteer.launch();
  const p = await browser.newPage();
  await p.setDefaultNavigationTimeout(60000);

  for (const s of SPECS) {
    await p.setViewport({ width: s.w, height: s.h, deviceScaleFactor: 2 });
    await p.setContent(page(s.w, s.h, s.bg, s.body), { waitUntil: 'load' });
    try { await p.evaluate(() => document.fonts.ready); } catch {}
    const buf = await p.screenshot({
      type: 'png',
      omitBackground: !!s.transparent,
      clip: { x: 0, y: 0, width: s.w, height: s.h },
    });
    // buf is 2x; downscale to exact target for clean edges
    const out = await sharp(buf).resize(s.w, s.h).png({ compressionLevel: 9 }).toBuffer();
    await writeFile(join(OUT_SOCIAL, s.name + '.png'), out);
    console.log('social/' + s.name + '.png  ' + s.w + 'x' + s.h);
  }
  await browser.close();

  // ---- favicons from favicon.svg (navy rounded square + paper dots) ----
  const favSvg = await readFile(join(HERE, 'favicon.svg'));
  const favSizes = [
    ['favicon-16.png', 16], ['favicon-32.png', 32], ['favicon-48.png', 48],
    ['apple-touch-icon-180.png', 180], ['icon-192.png', 192], ['icon-512.png', 512],
  ];
  for (const [file, size] of favSizes) {
    await sharp(favSvg, { density: 384 }).resize(size, size).png({ compressionLevel: 9 })
      .toFile(join(OUT_FAV, file));
    console.log('favicon/' + file + '  ' + size + 'x' + size);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
