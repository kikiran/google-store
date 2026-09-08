/**
 * Generates original SVG placeholder imagery for the Nova Store catalog.
 * Writes to client/public/images/{products,categories}/*.svg
 * Usage: node infrastructure/scripts/generate-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const outProducts = path.join(root, 'client', 'public', 'images', 'products');
const outCategories = path.join(root, 'client', 'public', 'images', 'categories');

fs.mkdirSync(outProducts, { recursive: true });
fs.mkdirSync(outCategories, { recursive: true });

const BG = { A: '#f3f0ec', B: '#eef2f6', C: '#faf6ee', D: '#eef5f1', E: '#f7f1f4', F: '#f1f0f4' };

// ---------- primitives ----------
function phone({ tint, accent }) {
  const body = `<rect x="352" y="140" width="236" height="480" rx="34" fill="${accent}" />
    <rect x="366" y="168" width="208" height="424" rx="16" fill="#0b0d0f" />
    <circle cx="470" cy="196" r="9" fill="#202124" />
    <rect x="398" y="316" width="144" height="120" rx="12" fill="url(#screen)" />
    <circle cx="470" cy="398" r="38" fill="none" stroke="#3c4043" stroke-width="6" />
    <rect x="446" y="524" width="48" height="6" rx="3" fill="#3c4043" />`;
  return wrap(body, tint);
}

function foldPhone({ tint, accent }) {
  const body = `<rect x="330" y="150" width="280" height="470" rx="30" fill="${accent}" />
    <rect x="344" y="176" width="224" height="96" rx="12" fill="#0b0d0f" />
    <rect x="344" y="288" width="224" height="290" rx="12" fill="#0b0d0f" />
    <rect x="356" y="298" width="200" height="120" rx="8" fill="url(#screen)" />
    <rect x="356" y="430" width="200" height="112" rx="8" fill="url(#screen)" />
    <rect x="464" y="520" width="24" height="4" rx="2" fill="#5f6368" />
    <circle cx="470" cy="200" r="6" fill="#5f6368" />`;
  return wrap(body, tint);
}

function tablet({ tint, accent }) {
  const body = `<rect x="322" y="120" width="296" height="430" rx="26" fill="${accent}" />
    <rect x="338" y="140" width="264" height="392" rx="14" fill="#0b0d0f" />
    <rect x="354" y="176" width="232" height="220" rx="10" fill="url(#screen)" />
    <circle cx="470" cy="338" r="34" fill="none" stroke="#3c4043" stroke-width="5" />
    <rect x="440" y="500" width="60" height="6" rx="3" fill="#5f6368" />`;
  return wrap(body, tint);
}

function watch({ tint, accent }) {
  const strap = `<rect x="388" y="120" width="164" height="80" rx="24" fill="${accent}" opacity="0.45" />
    <rect x="388" y="452" width="164" height="80" rx="24" fill="${accent}" opacity="0.45" />
    <circle cx="470" cy="324" r="112" fill="${accent}" />
    <circle cx="470" cy="324" r="76" fill="#0b0d0f" />
    <circle cx="470" cy="324" r="48" fill="url(#screen)" />`;
  return wrap(strap, tint);
}

function band({ tint, accent }) {
  const body = `<rect x="400" y="140" width="140" height="380" rx="70" fill="${accent}" />
    <rect x="414" y="180" width="112" height="180" rx="34" fill="#0b0d0f" />
    <rect x="426" y="196" width="88" height="80" rx="10" fill="url(#screen)" />
    <rect x="420" y="292" width="100" height="14" rx="7" fill="#1a1c1e" />`;
  return wrap(body, tint);
}

function earbud({ tint, accent }) {
  const bud = (x, y, s) => `<ellipse cx="${x}" cy="${y}" rx="${48 * s}" ry="${56 * s}" fill="${accent}" />
    <ellipse cx="${x}" cy="${y + 26 * s}" rx="${30 * s}" ry="${22 * s}" fill="#0b0d0f" />`;
  const caseObj = `<rect x="412" y="150" width="116" height="230" rx="58" fill="${accent}" opacity="0.55" />
    <rect x="422" y="162" width="96" height="206" rx="48" fill="#e8eaed" />
    <rect x="432" y="176" width="76" height="178" rx="38" fill="#f6f7f9" />
    <ellipse cx="470" cy="296" rx="26" ry="30" fill="#202124" />`;
  const buds = `${bud(410, 400, 1)}${bud(530, 400, 1)}
    <circle cx="470" cy="368" r="40" fill="${accent}" opacity="0.35" />`;
  return wrap(`${caseObj}${buds}`, tint);
}

function accessory({ tint, accent, kind }) {
  if (kind === 'case') {
    const body = `<rect x="348" y="190" width="244" height="470" rx="34" fill="${accent}" />
      <rect x="360" y="206" width="220" height="120" rx="20" fill="#0b0d0f" />
      <circle cx="470" cy="328" r="20" fill="#0b0d0f" opacity="0.6" />`;
    return wrap(body, tint);
  }
  if (kind === 'charger') {
    const body = `<rect x="402" y="140" width="136" height="160" rx="24" fill="${accent}" />
      <rect x="428" y="300" width="84" height="14" rx="7" fill="${accent}" />
      <rect x="444" y="314" width="52" height="200" rx="26" fill="#c4c7c5" />`;
    return wrap(body, tint);
  }
  if (kind === 'stand') {
    const body = `<rect x="330" y="380" width="280" height="28" rx="14" fill="${accent}" />
      <path d="M420 380 L470 220 L470 140 L438 140 L392 380 Z" fill="#b0b3b8" />
      <rect x="360" y="408" width="220" height="20" rx="10" fill="#8f9399" />
      <rect x="356" y="150" width="228" height="80" rx="12" fill="url(#screen)" />`;
    return wrap(body, tint);
  }
  if (kind === 'budsbox') {
    const body = `<rect x="396" y="170" width="148" height="220" rx="64" fill="${accent}" />
      <rect x="408" y="196" width="124" height="168" rx="50" fill="#f6f7f9" />
      <circle cx="470" cy="296" rx="22" ry="24" fill="#202124" />`;
    return wrap(body, tint);
  }
  if (kind === 'straps') {
    const body = `<rect x="330" y="250" width="130" height="120" rx="24" fill="${accent}" opacity="0.5" />
      <path d="M470 250 q60 60 0 120 q-60 60 0 120" fill="none" stroke="${accent}" stroke-width="34" stroke-linecap="round" />
      <circle cx="470" cy="370" r="26" fill="${accent}" opacity="0.7" />`;
    return wrap(body, tint);
  }
  return wrap('', tint);
}

function wrap(inner, tint) {
  const [a, b] = tint;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="940" height="760" viewBox="0 0 940 760" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4f7cf7"/><stop offset="0.55" stop-color="#7a5af5"/><stop offset="1" stop-color="#ea5bd0"/>
    </linearGradient>
  </defs>
  <rect width="940" height="760" fill="url(#bg)"/>
  <g>${inner}</g>
</svg>
`;
}

const palette = {
  obsidian: ['#efe9e3', '#e4ddd4'], silver: ['#edf1f5', '#dde4ec'], sunset: ['#fdeee0', '#fbdbbe'],
  porcelain: ['#f7f2ee', '#ece1d8'], mint: ['#e7f1ea', '#cfdfd2'], hazel: ['#eef0ea', '#d8ddd0'],
  wintergreen: ['#e9f3f0', '#cfe3dc'], charcoal: ['#ecebeb', '#d7d3d3'], bay: ['#e9effb', '#cdd9f2'],
  white: ['#f5f5f7', '#e4e4e9'], rose: ['#f9ecef', '#f0d3da'], silverBlue: ['#e8eef7', '#cdd9ec'],
};

// slug -> { kind, tint, accent }
const products = {
  'nova-x1-pro': { kind: 'phone', tint: palette.obsidian, accent: '#2c2f33' },
  'nova-x1': { kind: 'phone', tint: palette.obsidian, accent: '#3d4145' },
  'nova-x1-pro-fold': { kind: 'foldPhone', tint: palette.porcelain, accent: '#c7beb4' },
  'nova-x1a': { kind: 'phone', tint: palette.mint, accent: '#7fbea0' },
  'nova-pad': { kind: 'tablet', tint: palette.porcelain, accent: '#c4b8ab' },
  'nova-watch-5': { kind: 'watch', tint: palette.hazel, accent: '#9aa89b' },
  'nova-watch-4': { kind: 'watch', tint: palette.charcoal, accent: '#5b5f63' },
  'nova-buds-pro-2': { kind: 'earbud', tint: palette.wintergreen, accent: '#e8eeec' },
  'nova-buds-a': { kind: 'earbud', tint: palette.charcoal, accent: '#585c60' },
  'nova-band-2': { kind: 'band', tint: palette.mint, accent: '#7fbea0' },
  'nova-case-x1-pro': { kind: 'accessory', tint: palette.obsidian, accent: '#36393d', extra: 'case' },
  'nova-charger-30w': { kind: 'accessory', tint: palette.white, accent: '#dbdbdf', extra: 'charger' },
  'nova-buds-case': { kind: 'accessory', tint: palette.white, accent: '#e0e0e5', extra: 'budsbox' },
  'nova-tablet-stand': { kind: 'accessory', tint: palette.silverBlue, accent: '#e0e6f0', extra: 'stand' },
  'nova-watch-bands': { kind: 'accessory', tint: palette.silverBlue, accent: '#4a5ddb', extra: 'straps' },
};

for (const [slug, cfg] of Object.entries(products)) {
  let svg;
  if (cfg.extra) svg = accessory({ tint: cfg.tint, accent: cfg.accent, kind: cfg.extra });
  else if (cfg.kind === 'phone') svg = phone({ tint: cfg.tint, accent: cfg.accent });
  else if (cfg.kind === 'foldPhone') svg = foldPhone({ tint: cfg.tint, accent: cfg.accent });
  else if (cfg.kind === 'tablet') svg = tablet({ tint: cfg.tint, accent: cfg.accent });
  else if (cfg.kind === 'watch') svg = watch({ tint: cfg.tint, accent: cfg.accent });
  else if (cfg.kind === 'band') svg = band({ tint: cfg.tint, accent: cfg.accent });
  else if (cfg.kind === 'earbud') svg = earbud({ tint: cfg.tint, accent: cfg.accent });
  fs.writeFileSync(path.join(outProducts, `${slug}.svg`), svg);
  console.log('product image:', slug);
}

// category tiles — radial tinted backgrounds with a glyph
const categories = {
  phones: { tint: ['#2b3036', '#1f242a'], glyph: 'phone' },
  tablets: { tint: ['#35515f', '#223640'], glyph: 'tablet' },
  watches: { tint: ['#3d4f3c', '#2a3a2a'], glyph: 'watch' },
  earbuds: { tint: ['#3d3f4a', '#262830'], glyph: 'earbud' },
  accessories: { tint: ['#4a3b4f', '#2e2431'], glyph: 'box' },
};

function catWrap(tint, glyph) {
  const [a, b] = tint;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="940" height="760" viewBox="0 0 940 760" role="img">
  <defs>
    <linearGradient id="bgc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </linearGradient>
  </defs>
  <rect width="940" height="760" fill="url(#bgc)"/>
  <g fill="none" stroke="#ffffff" stroke-linecap="round" stroke-width="22">
    ${glyph}
  </g>
</svg>
`;
}

for (const [slug, cfg] of Object.entries(categories)) {
  let glyph = '';
  if (cfg.glyph === 'phone') glyph = `<rect x="400" y="210" width="140" height="300" rx="30"/><circle cx="470" cy="420" r="26"/>`;
  if (cfg.glyph === 'tablet') glyph = `<rect x="380" y="200" width="180" height="320" rx="24"/><circle cx="470" cy="430" r="22"/>`;
  if (cfg.glyph === 'watch') glyph = `<rect x="440" y="150" width="60" height="70" rx="16"/><rect x="440" y="360" width="60" height="90" rx="16"/><circle cx="470" cy="340" r="110" opacity="0.9"/>`;
  if (cfg.glyph === 'earbud') glyph = `<ellipse cx="420" cy="420" rx="40" ry="52"/><ellipse cx="520" cy="420" rx="40" ry="52"/><rect x="452" y="250" width="36" height="120" rx="18"/>`;
  if (cfg.glyph === 'box') glyph = `<rect x="420" y="300" width="100" height="120" rx="14"/><circle cx="470" cy="360" r="24"/>`;
  fs.writeFileSync(path.join(outCategories, `${slug}.svg`), catWrap(cfg.tint, glyph));
  console.log('category image:', slug);
}

console.log('Assets generated under client/public/images/');