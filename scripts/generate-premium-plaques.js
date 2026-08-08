#!/usr/bin/env node
/**
 * Premium memorial plaque generator — "Gedenktafel" series
 *
 * Three tiers (simple / medium / detailed) × two type themes for
 * E. Braun & Co. (story id=1).
 *
 * Design language: deep navy enamel field + gold engraving (old Jewish
 * shop-sign palette), storefront line-engraving based on the historical photo
 * (public/images/ebraun/ebraun1.webp), Zurückgeben wordmark, gold-on-navy QR.
 * No mounting hardware — the artwork is exactly what would be engraved.
 *
 * Type themes:
 *   classic — Kameron (slab serif) + Inter
 *   cinzel  — Cinzel (Roman inscription capitals) + EB Garamond
 *
 * Fonts are embedded as base64 woff2 so the SVGs render identically everywhere.
 *
 * Usage: node scripts/generate-premium-plaques.js
 * Output: public/plaques/premium/e-braun-{tier}[-cinzel].svg
 */

const fs = require('fs')
const path = require('path')
const QRCode = require('qrcode')

const FONT_DIR = process.env.FONT_DIR || path.join(__dirname, 'fonts')
const OUT_DIR = path.join(__dirname, '../public/plaques/premium')

// ---------------------------------------------------------------- palette
const C = {
  navy: '#1d2c4f',
  navyDeep: '#152342',
  navyEdge: '#101b33',
  gold: '#d9a441',
  goldBright: '#e8bc63',
  goldDim: '#a8802f',
  cream: '#f1e4c3',
  creamDim: '#cfc0a0',
}

const QR_URL = 'https://b3rlin.storytimemaps.com/?id=1'

// ---------------------------------------------------------------- type themes
// bScale compensates for x-height differences so body copy reads the same size.
const THEMES = [
  {
    suffix: '',
    display: 'Kameron',
    body: 'Inter',
    files: { Kameron: 'Kameron-latin.woff2', Inter: 'Inter-latin.woff2' },
    bScale: 1,
    bodyBold: 700,
    dispMed: 500,
    medSub: 16,
  },
  {
    suffix: '-cinzel',
    display: 'Cinzel',
    body: 'EB Garamond',
    files: { Cinzel: 'Cinzel-latin.woff2', 'EB Garamond': 'EBGaramond-latin.woff2' },
    bScale: 1.14,
    bodyBold: 600,
    dispMed: 400,
    medSub: 12.5,
  },
]

let T = THEMES[0] // active theme (set in main loop)
const bs = (px) => Math.round(px * T.bScale * 10) / 10 // body size helper

// ---------------------------------------------------------------- helpers
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** naive greedy word-wrap by character budget */
function wrap(text, maxChars) {
  const words = text.split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      lines.push(cur.trim())
      cur = w
    } else cur += ' ' + w
  }
  if (cur.trim()) lines.push(cur.trim())
  return lines
}

function textBlock(lines, x, y, lineHeight, attrs) {
  return lines
    .map((l, i) => `<text x="${x}" y="${y + i * lineHeight}" ${attrs}>${esc(l)}</text>`)
    .join('\n')
}

// ---------------------------------------------------------------- fonts
function fontFaceCSS() {
  return (
    Object.entries(T.files)
      .map(([family, file]) => {
        const b64 = fs.readFileSync(path.join(FONT_DIR, file)).toString('base64')
        return `@font-face {
      font-family: '${family}';
      font-weight: 100 900;
      src: url(data:font/woff2;base64,${b64}) format('woff2');
    }`
      })
      .join('\n') + `\n text { -webkit-font-smoothing: antialiased; }`
  )
}

// ---------------------------------------------------------------- QR — gold modules straight on the navy field
async function qrGroup(size) {
  const qr = QRCode.create(QR_URL, { errorCorrectionLevel: 'M' })
  const n = qr.modules.size
  const data = qr.modules.data
  const m = size / n
  let d = ''
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (data[r * n + c]) d += `M${c * m},${r * m}h${m}v${m}h${-m}z`
    }
  }
  const pad = 7
  return `<g>
    <rect x="${-pad}" y="${-pad}" width="${size + pad * 2}" height="${size + pad * 2}"
          fill="${C.navyDeep}" stroke="${C.gold}" stroke-width="1"/>
    <path d="${d}" fill="${C.gold}"/>
  </g>`
}

// ---------------------------------------------------------------- shared chrome (no hardware — engraving-ready)
// One weighted rule with a hairline companion inside it, and a small square at
// each corner. Enough articulation to read as a plaque border rather than a
// box, without the corner scrollwork and center tabs of the earlier
// certificate frame.

function chrome(W, H) {
  const o = 18 // primary rule inset
  const o2 = 24 // hairline companion inset
  const sq = 9 // corner square size
  const corners = [
    [o, o],
    [W - o, o],
    [o, H - o],
    [W - o, H - o],
  ]
    .map(
      ([x, y]) =>
        `<rect x="${x - sq / 2}" y="${y - sq / 2}" width="${sq}" height="${sq}"
           fill="${C.navyDeep}" stroke="${C.gold}" stroke-width="1.1"/>`
    )
    .join('\n  ')
  return `
  <rect width="${W}" height="${H}" fill="url(#fieldGrad)"/>
  <rect width="${W}" height="${H}" fill="url(#grain)" opacity="0.05"/>
  <rect x="${o}" y="${o}" width="${W - o * 2}" height="${H - o * 2}"
        fill="none" stroke="${C.gold}" stroke-width="1.5"/>
  <rect x="${o2}" y="${o2}" width="${W - o2 * 2}" height="${H - o2 * 2}"
        fill="none" stroke="${C.gold}" stroke-width="0.6" opacity="0.8"/>
  ${corners}
  `
}

function defs() {
  return `<defs>
    <style>${fontFaceCSS()}</style>
    <radialGradient id="fieldGrad" cx="50%" cy="42%" r="85%">
      <stop offset="0%" stop-color="${C.navy}"/>
      <stop offset="70%" stop-color="${C.navyDeep}"/>
      <stop offset="100%" stop-color="${C.navyEdge}"/>
    </radialGradient>
    <pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" stroke="${C.cream}" stroke-width="0.5"/>
    </pattern>
    <pattern id="glassHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-55)">
      <line x1="0" y1="0" x2="0" y2="7" stroke="${C.gold}" stroke-width="0.55" opacity="0.38"/>
    </pattern>
  </defs>`
}

// header device: GEDENKTAFEL tab + rules, centered at cx
function gedenktafelTab(cx, y, halfRule) {
  return `
  <g>
    <line x1="${cx - halfRule}" y1="${y}" x2="${cx - 66}" y2="${y}" stroke="${C.gold}" stroke-width="1"/>
    <line x1="${cx + 66}" y1="${y}" x2="${cx + halfRule}" y2="${y}" stroke="${C.gold}" stroke-width="1"/>
    <text x="${cx}" y="${y + 3.5}" text-anchor="middle" font-family="${T.body}" font-weight="${T.bodyBold}"
          font-size="${bs(11)}" letter-spacing="4.5" fill="${C.gold}">GEDENKTAFEL</text>
  </g>`
}

// ornamental divider: rule + diamond
function divider(cx, y, half) {
  return `<g stroke="${C.gold}" fill="${C.gold}">
    <line x1="${cx - half}" y1="${y}" x2="${cx - 14}" y2="${y}" stroke-width="1"/>
    <line x1="${cx + 14}" y1="${y}" x2="${cx + half}" y2="${y}" stroke-width="1"/>
    <rect x="${cx - 3.4}" y="${y - 3.4}" width="6.8" height="6.8" transform="rotate(45 ${cx} ${y})" stroke="none"/>
  </g>`
}

// Funding attribution. Every plaque this project produces carries it — the
// plaques are grant-funded and must read as such in the field, not only in the
// paperwork. Keep the thin/bold contrast of the Zurückgeben wordmark.
// See ATTRIBUTION in the exports and the plaque rule in CLAUDE.md.
const ATTRIBUTION = 'Stiftung Zurückgeben'

function attribution(x, y, size, anchor) {
  // xml:space="preserve" — without it renderers collapse the trailing space
  // and the lock-up reads "StiftungZurückgeben"
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Inter, ${T.body}" font-size="${size}"
      fill="${C.gold}" opacity="0.85" letter-spacing="0.3" xml:space="preserve"><tspan font-weight="400">Stiftung </tspan><tspan font-weight="700">Zurückgeben</tspan></text>`
}

// ---------------------------------------------------------------- storefront engraving
// Line-engraving of Unter den Linden 2 based on the historical photograph.
// Natural size 420 × 244, stroke in gold on navy.
function storefrontEngraving() {
  const g = C.gold
  let s = `<g fill="none" stroke="${g}" stroke-width="1.2" stroke-linecap="square">`

  // ground / pavement
  s += `<line x1="2" y1="236" x2="418" y2="236" stroke-width="1.6"/>`
  s += `<line x1="10" y1="241" x2="410" y2="241" stroke-width="0.7" opacity="0.6"/>`
  for (let x = 20; x < 410; x += 34)
    s += `<line x1="${x}" y1="236" x2="${x - 6}" y2="241" stroke-width="0.5" opacity="0.45"/>`

  // balustrade (top)
  s += `<line x1="8" y1="8" x2="412" y2="8" stroke-width="1.6"/>`
  s += `<line x1="8" y1="26" x2="412" y2="26" stroke-width="1.2"/>`
  for (let x = 16; x <= 404; x += 12) {
    s += `<path d="M${x},10.5 q2.4,3 0,7 q-2.4,4 0,6.5" stroke-width="0.8" opacity="0.85"/>`
  }
  s += `<rect x="8" y="6" width="7" height="22" fill="${C.navyDeep}" stroke="${g}" stroke-width="1"/>`
  s += `<rect x="405" y="6" width="7" height="22" fill="${C.navyDeep}" stroke="${g}" stroke-width="1"/>`
  s += `<rect x="196" y="6" width="7" height="22" fill="${C.navyDeep}" stroke="${g}" stroke-width="1"/>`

  // cornice under balustrade
  s += `<line x1="8" y1="31" x2="412" y2="31" stroke-width="0.8" opacity="0.7"/>`

  // sign band — three panels
  s += `<rect x="12" y="36" width="396" height="36"/>`
  s += `<rect x="15" y="39" width="390" height="30" stroke-width="0.6" opacity="0.7"/>`
  s += `<line x1="128" y1="36" x2="128" y2="72" stroke-width="0.8"/>`
  s += `<line x1="292" y1="36" x2="292" y2="72" stroke-width="0.8"/>`
  s += `<text x="70" y="58.5" text-anchor="middle" font-family="${T.display}" font-weight="700" font-size="11"
        letter-spacing="1.5" fill="${g}" stroke="none">WÄSCHEHAUS</text>`
  s += `<text x="210" y="60" text-anchor="middle" font-family="${T.display}" font-weight="700" font-size="15"
        letter-spacing="1.2" fill="${g}" stroke="none">E. BRAUN &amp; Cº</text>`
  s += `<text x="350" y="58.5" text-anchor="middle" font-family="${T.display}" font-weight="700" font-size="9.5"
        letter-spacing="1" fill="${g}" stroke="none">WIEN · BERLIN · PARIS</text>`

  // pilasters
  for (const px of [12, 400]) {
    s += `<rect x="${px}" y="72" width="8" height="160"/>`
    s += `<line x1="${px + 2.5}" y1="78" x2="${px + 2.5}" y2="226" stroke-width="0.5" opacity="0.6"/>`
    s += `<line x1="${px + 5.5}" y1="78" x2="${px + 5.5}" y2="226" stroke-width="0.5" opacity="0.6"/>`
  }

  // transom row (small lights above the glazing)
  s += `<rect x="20" y="76" width="380" height="18"/>`
  for (let x = 44; x < 400; x += 24)
    s += `<line x1="${x}" y1="76" x2="${x}" y2="94" stroke-width="0.6" opacity="0.7"/>`

  // five bays: [24-96][100-172] door[176-244] [248-320][324-396]
  const winBays = [
    [24, 96],
    [100, 172],
    [248, 320],
    [324, 396],
  ]
  for (const [x0, x1] of winBays) {
    const w = x1 - x0
    s += `<rect x="${x0}" y="98" width="${w}" height="112" fill="url(#glassHatch)"/>`
    s += `<line x1="${x0 + w / 2}" y1="98" x2="${x0 + w / 2}" y2="210" stroke-width="0.8" opacity="0.8"/>`
    s += `<path d="M${x0 + w * 0.28},206 q-3,-16 0,-30 q3,-10 0,-16 l3,-4 l3,4 q-3,6 0,16 q3,14 0,30 z" stroke-width="0.7" opacity="0.8"/>`
    s += `<path d="M${x0 + w * 0.72},206 q-4,-20 0,-34 q2.5,-8 0,-12 l3,-4 l3,4 q-2.5,4 0,12 q4,14 0,34 z" stroke-width="0.7" opacity="0.65"/>`
    s += `<rect x="${x0}" y="214" width="${w}" height="16"/>`
    s += `<rect x="${x0 + 4}" y="217.5" width="${w - 8}" height="9" stroke-width="0.6" opacity="0.7"/>`
    s += `<line x1="${x0 - 2}" y1="94" x2="${x0 - 2}" y2="232" stroke-width="1"/>`
    s += `<line x1="${x1 + 2}" y1="94" x2="${x1 + 2}" y2="232" stroke-width="1"/>`
  }

  // central entrance bay
  s += `<rect x="176" y="98" width="68" height="132"/>`
  s += `<rect x="180" y="100" width="60" height="22"/>`
  for (const dx of [-18, -9, 0, 9, 18]) {
    s += `<line x1="210" y1="120" x2="${210 + dx}" y2="102" stroke-width="0.6" opacity="0.75"/>`
  }
  s += `<rect x="182" y="126" width="27" height="96"/>`
  s += `<rect x="211" y="126" width="27" height="96"/>`
  for (const dx of [186, 215]) {
    s += `<rect x="${dx}" y="132" width="19" height="38" stroke-width="0.7" opacity="0.85"/>`
    s += `<rect x="${dx}" y="176" width="19" height="38" stroke-width="0.7" opacity="0.85"/>`
  }
  s += `<circle cx="206.5" cy="176" r="1.6" fill="${g}" stroke="none"/>`
  s += `<circle cx="213.5" cy="176" r="1.6" fill="${g}" stroke="none"/>`
  s += `<line x1="176" y1="226" x2="244" y2="226" stroke-width="0.8"/>`
  s += `<line x1="172" y1="231" x2="248" y2="231" stroke-width="0.8"/>`
  for (const lx of [170, 250]) {
    s += `<line x1="${lx}" y1="104" x2="${lx}" y2="112" stroke-width="0.8"/>`
    s += `<circle cx="${lx}" cy="116.5" r="4.5" stroke-width="0.9"/>`
    s += `<circle cx="${lx}" cy="116.5" r="1.4" fill="${g}" stroke="none" opacity="0.8"/>`
  }

  s += `</g>`
  return s
}

/** engraving scaled to a target width, with optional caption */
function engravingPanel(x, y, w, caption) {
  const scale = w / 420
  const h = 244 * scale
  let s = `<g transform="translate(${x},${y})">`
  s += `<g transform="scale(${scale})">${storefrontEngraving()}</g>`
  if (caption) {
    s += `<text x="${w / 2}" y="${h + 18}" text-anchor="middle" font-family="${T.body}" font-weight="400"
      font-size="${bs(10.5)}" letter-spacing="1.2" fill="${C.creamDim}">${esc(caption)}</text>`
  }
  s += `</g>`
  return { svg: s, h }
}

function qrBlock(qr, x, y, size, label) {
  return `<g transform="translate(${x},${y})">
    ${qr}
    <text x="${size / 2}" y="${size + 24}" text-anchor="middle" font-family="${T.body}" font-weight="${T.bodyBold}"
      font-size="${bs(9.5)}" letter-spacing="2" fill="${C.gold}">${label}</text>
  </g>`
}

// ---------------------------------------------------------------- data (real, from data/storymaps.json id=1)
const D = {
  name: 'E. BRAUN & CO.',
  type: 'Wäsche- und Modewarenhaus',
  cities: 'Wien · Berlin · Paris',
  address: 'UNTER DEN LINDEN 2 · BERLIN-MITTE',
  years: '1914 – 1943',
  fate: '1938 unter nationalsozialistischem Zwang verkauft · 1943 liquidiert',
  short:
    'Seit 1914 stand das Wiener Traditionshaus E. Braun & Co. neben dem Hotel Adlon für feine Wäsche und Mode. Nach dem „Anschluss“ Österreichs 1938 wurden die jüdischen Inhaber zum Verkauf des Unternehmens gezwungen; 1943 wurde die Firma liquidiert.',
  p1: '1914 eröffneten die Wiener Brüder Emanuel und Josef Braun hier ihre größte Filiale — neben dem Hotel Adlon, mit Wäsche, Mode und Tafelwäsche für Europas Gesellschaft. Zu den Kunden zählten Käthe Dorsch, Emil Jannings, Fritz Kortner und Paul Hindemith. 1926–28 baute der Wiener Architekt Ferdinand Kratzky das Haus aufwendig um.',
  p2: 'Im Mai 1938, nach dem „Anschluss“ Österreichs, wurde Mitinhaber Siegfried Franz Oser-Braun von der Gestapo verhaftet und in der Haft gezwungen, das Unternehmen weit unter Wert zu verkaufen. 1943 wurde die Firma liquidiert. Diese Tafel erinnert an die Menschen, die dieses Haus aufgebaut haben.',
  facts: ['GEGRÜNDET 1914', 'UMBAU 1926–28', 'ZWANGSVERKAUF 1938', 'LIQUIDATION 1943'],
  caption: 'Unter den Linden 2 · Aufnahme um 1930',
}

// ---------------------------------------------------------------- tier 1: SIMPLE (800×450)
async function simple() {
  const W = 800,
    H = 450,
    cx = W / 2
  const qrSize = 56
  const qr = await qrGroup(qrSize)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs()}
  ${chrome(W, H)}
  ${gedenktafelTab(cx, 74, 250)}
  <text x="${cx}" y="122" text-anchor="middle" font-family="${T.body}" font-weight="${T.bodyBold}" font-size="${bs(15)}"
        letter-spacing="7" fill="${C.cream}">HIER STAND</text>
  <text x="${cx}" y="185" text-anchor="middle" font-family="${T.display}" font-weight="700" font-size="50"
        letter-spacing="2" fill="${C.goldBright}">${esc(D.name)}</text>
  <text x="${cx}" y="218" text-anchor="middle" font-family="${T.display}" font-weight="${T.dispMed}" font-size="19"
        letter-spacing="1" fill="${C.cream}">${esc(D.type)} · ${esc(D.cities)}</text>
  ${divider(cx, 248, 180)}
  <text x="${cx}" y="284" text-anchor="middle" font-family="${T.body}" font-weight="${T.bodyBold}" font-size="${bs(15)}"
        letter-spacing="2.5" fill="${C.cream}">${esc(D.address)}</text>
  <text x="${cx}" y="325" text-anchor="middle" font-family="${T.display}" font-weight="700" font-size="30"
        letter-spacing="3" fill="${C.gold}">${esc(D.years)}</text>
  <text x="${cx}" y="356" text-anchor="middle" font-family="${T.body}" font-weight="400" font-size="${bs(13)}"
        fill="${C.creamDim}">${esc(D.fate)}</text>
  ${attribution(118, 398, 13, 'start')}
  <text x="${cx}" y="398" text-anchor="middle" font-family="${T.body}" font-weight="400" font-size="${bs(10.5)}"
        letter-spacing="1.5" fill="${C.creamDim}" opacity="0.8">b3rlin.storytimemaps.com</text>
  ${qrBlock(qr, W - 78 - qrSize, H - 108 - qrSize + 14, qrSize, 'MEHR ERFAHREN')}
</svg>`
}

// ---------------------------------------------------------------- tier 2: MEDIUM (800×450, two-column w/ engraving)
async function medium() {
  const W = 800,
    H = 450
  const qrSize = 52
  const qr = await qrGroup(qrSize)
  const lx = 62
  const shortLines = wrap(D.short, 52)
  const eng = engravingPanel(452, 108, 288, D.caption)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs()}
  ${chrome(W, H)}
  <g text-anchor="start">
    <text x="${lx}" y="80" font-family="${T.body}" font-weight="${T.bodyBold}" font-size="${bs(10.5)}" letter-spacing="4"
          fill="${C.gold}">GEDENKTAFEL</text>
    <line x1="${lx + 130}" y1="76.5" x2="392" y2="76.5" stroke="${C.gold}" stroke-width="1"/>
    <text x="${lx}" y="110" font-family="${T.body}" font-weight="${T.bodyBold}" font-size="${bs(13)}" letter-spacing="6"
          fill="${C.cream}">HIER STAND</text>
    <text x="${lx}" y="152" font-family="${T.display}" font-weight="700" font-size="35" letter-spacing="1"
          fill="${C.goldBright}">${esc(D.name)}</text>
    <text x="${lx}" y="178" font-family="${T.display}" font-weight="${T.dispMed}" font-size="${T.medSub}"
          fill="${C.cream}">${esc(D.type)} · ${esc(D.cities)}</text>
    <text x="${lx}" y="206" font-family="${T.body}" font-weight="${T.bodyBold}" font-size="${bs(12.5)}" letter-spacing="1.8"
          fill="${C.cream}">${esc(D.address)}</text>
    <text x="${lx}" y="240" font-family="${T.display}" font-weight="700" font-size="24" letter-spacing="2"
          fill="${C.gold}">${esc(D.years)}</text>
    <line x1="${lx}" y1="258" x2="392" y2="258" stroke="${C.gold}" stroke-width="0.8" opacity="0.7"/>
    ${textBlock(shortLines, lx, 282, 18, `font-family="${T.body}" font-weight="400" font-size="${bs(12.5)}" fill="${C.cream}"`)}
  </g>
  ${eng.svg}
  ${attribution(118, H - 48, 13, 'start')}
  ${qrBlock(qr, 452 + 288 / 2 - qrSize / 2, 326, qrSize, 'MEHR ERFAHREN')}
</svg>`
}

// ---------------------------------------------------------------- tier 3: DETAILED (800×680)
async function detailed() {
  const W = 800,
    H = 680,
    cx = W / 2
  const qrSize = 52
  const qr = await qrGroup(qrSize)
  const col1 = wrap(D.p1, 60)
  const col2 = wrap(D.p2, 60)
  const engW = 340
  const eng = engravingPanel((W - engW) / 2, 172, engW, null)
  const engBottom = 172 + eng.h
  const colsY = engBottom + 92
  const factsY = H - 86
  const factX = [124, 258, 420, 578]
  const diamondX = [193, 323, 507]
  const factCells =
    D.facts
      .map(
        (f, i) =>
          `<text x="${factX[i]}" y="0" text-anchor="middle" font-family="${T.body}" font-weight="${T.bodyBold}"
      font-size="${bs(9.5)}" letter-spacing="1" fill="${C.gold}">${esc(f)}</text>`
      )
      .join('') +
    diamondX
      .map(
        (dx) =>
          `<rect x="${dx - 2.5}" y="-6" width="5" height="5" transform="rotate(45 ${dx} ${-3.5})" fill="${C.gold}"/>`
      )
      .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs()}
  ${chrome(W, H)}
  ${gedenktafelTab(cx, 66, 240)}
  <text x="${cx}" y="102" text-anchor="middle" font-family="${T.body}" font-weight="${T.bodyBold}" font-size="${bs(13)}"
        letter-spacing="6" fill="${C.cream}">HIER STAND</text>
  <text x="${cx}" y="150" text-anchor="middle" font-family="${T.display}" font-weight="700" font-size="40"
        letter-spacing="1.5" fill="${C.goldBright}">${esc(D.name)}</text>
  ${eng.svg}
  <text x="${cx}" y="${engBottom + 20}" text-anchor="middle" font-family="${T.body}" font-weight="400"
        font-size="${bs(10.5)}" letter-spacing="1.2" fill="${C.creamDim}">${esc(D.caption)}</text>
  <text x="${cx}" y="${engBottom + 48}" text-anchor="middle" font-family="${T.display}" font-weight="${T.dispMed}" font-size="16"
        fill="${C.cream}">${esc(D.type)} · ${esc(D.address.replace(' · ', ', '))} · ${esc(D.years)}</text>
  <line x1="62" y1="${engBottom + 66}" x2="${W - 62}" y2="${engBottom + 66}" stroke="${C.gold}" stroke-width="0.8" opacity="0.7"/>
  <g transform="translate(0,${colsY})">
    ${textBlock(col1, 62, 0, 16, `font-family="${T.body}" font-weight="400" font-size="${bs(11)}" fill="${C.cream}"`)}
    ${textBlock(col2, 412, 0, 16, `font-family="${T.body}" font-weight="400" font-size="${bs(11)}" fill="${C.cream}"`)}
  </g>
  <g transform="translate(0,${factsY})">${factCells}</g>
  ${attribution(118, H - 46, 13, 'start')}
  <text x="${cx - 40}" y="${H - 46}" text-anchor="middle" font-family="${T.body}" font-weight="400" font-size="${bs(10.5)}"
        letter-spacing="1.5" fill="${C.creamDim}" opacity="0.8">b3rlin.storytimemaps.com</text>
  <g transform="translate(${W - 78 - qrSize},${H - 78 - qrSize})">${qr}</g>
  <text x="${W - 78 - qrSize - 16}" y="${H - 78 - qrSize / 2 + 4}" text-anchor="end" font-family="${T.body}"
        font-weight="${T.bodyBold}" font-size="${bs(9.5)}" letter-spacing="2" fill="${C.gold}">MEHR ERFAHREN</text>
</svg>`
}

// ---------------------------------------------------------------- exports
// generate-lightburn-plaque.js reuses the storefront line-engraving, the QR
// module geometry and the plaque copy. setTheme() must be called first — the
// engraving's sign-band lettering reads the active theme's display face.
module.exports = {
  storefrontEngraving,
  qrGroup,
  D,
  C,
  THEMES,
  esc,
  wrap,
  ATTRIBUTION,
  setTheme: (t) => {
    T = t
  },
}

// ---------------------------------------------------------------- main
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const tiers = { simple, medium, detailed }
  for (const theme of THEMES) {
    T = theme
    for (const [name, fn] of Object.entries(tiers)) {
      const svg = await fn()
      const file = path.join(OUT_DIR, `e-braun-${name}${theme.suffix}.svg`)
      fs.writeFileSync(file, svg)
      console.log(`✓ ${file} (${(svg.length / 1024).toFixed(0)} KB)`)
    }
  }
}

if (require.main === module) main()
