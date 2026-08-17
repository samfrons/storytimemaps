#!/usr/bin/env node
/**
 * Premium memorial plaque generator — "Gedenktafel" series
 *
 * Three tiers (simple / medium / detailed) × two type themes.
 *
 * The `simple` tier is pure typography and is generated for EVERY featured
 * story that carries the four facts a plaque must state. `medium` and
 * `detailed` embed a hand-traced line engraving of the storefront, so they are
 * only produced for businesses that have one (see ENGRAVINGS below) — an
 * engraving cannot be derived from data, it has to be drawn from the photo.
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
 * Output: public/plaques/premium/{slug}-{tier}[-cinzel].svg
 *         public/plaques/premium/index.json  (manifest for the /plaques page)
 */

const fs = require('fs')
const path = require('path')
const QRCode = require('qrcode')
const { ENGRAVINGS } = require('./engravings.js')

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

const SITE = 'https://b3rlin.storytimemaps.com'

/**
 * Context line for businesses that have no researched fate sentence of their
 * own. Kept identical to CONTEXT_DE in generate-lightburn-plaque.js — the
 * wording is deliberate ("enteignet und liquidiert" is what the records
 * document) and the two generators must not drift apart. See CLAUDE.md.
 */
const CONTEXT_DE =
  'Jüdisches Unternehmen, unter nationalsozialistischer Herrschaft enteignet und liquidiert.'

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
  {
    suffix: '-sans',
    display: 'Inter',
    body: 'Inter',
    files: { Inter: 'Inter-latin.woff2' },
    bScale: 1,
    bodyBold: 700,
    dispMed: 500,
    medSub: 15,
  },
]

let T = THEMES[0] // active theme (set in main loop)
const bs = (px) => Math.round(px * T.bScale * 10) / 10 // body size helper

/**
 * Trade line. `cities` is only set for a firm that genuinely traded in more
 * than one city; without this guard a single-city business gets a dangling
 * "TRADE · " on the plaque.
 */
const tradeLine = (d) => (d.cities ? `${esc(d.type)} · ${esc(d.cities)}` : esc(d.type))

/**
 * Display size for the business name, shrunk to fit the plate.
 *
 * The name is set in caps at a fixed optical size, and the archive is full of
 * long firm names ("A. B. C. Apotheken-Bedarfs-Contor"). Without this they ran
 * straight off both edges of the plate. Caps in the display faces average
 * ~0.62em wide, so the widest name that still fits `maxWidth` sets the size,
 * clamped so a short name never balloons past the design size.
 */
function fitDisplay(text, maxWidth, designSize, minSize) {
  const est = text.length * designSize * 0.62
  if (est <= maxWidth) return designSize
  return Math.max(minSize, Math.floor((maxWidth / (text.length * 0.62)) * 10) / 10)
}

/**
 * Split a name that cannot be set on one line without dropping below the
 * legible floor. Shrinking indefinitely is not an option on a memorial — the
 * longest firm names in the archive run to 80+ characters and would end up
 * under 12px — and clipping a name is worse than either. Break on the last
 * comma or space in the first half so the split falls at a real boundary.
 */
function fitDisplayLines(text, maxWidth, designSize, minSize) {
  const chars = Math.floor(maxWidth / (minSize * 0.62))
  if (text.length <= chars) return [text]
  const cut = Math.max(
    text.lastIndexOf(',', Math.ceil(text.length / 2)),
    text.lastIndexOf(' ', Math.ceil(text.length / 2))
  )
  if (cut <= 0) return [text]
  return [text.slice(0, cut).replace(/,$/, ''), text.slice(cut + 1).trim()]
}

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
async function qrGroup(size, url) {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' })
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
function storefrontEngraving(sign = EBRAUN.sign) {
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
        letter-spacing="1.5" fill="${g}" stroke="none">${esc(sign.left)}</text>`
  s += `<text x="210" y="60" text-anchor="middle" font-family="${T.display}" font-weight="700" font-size="15"
        letter-spacing="1.2" fill="${g}" stroke="none">${esc(sign.centre)}</text>`
  s += `<text x="350" y="58.5" text-anchor="middle" font-family="${T.display}" font-weight="700" font-size="9.5"
        letter-spacing="1" fill="${g}" stroke="none">${esc(sign.right)}</text>`

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

/**
 * The artwork for a business: E. Braun keeps its in-file facade (selected by
 * `sign`), everyone else resolves through the ENGRAVINGS registry by slug.
 * Resolved at render time because the sign-band lettering inside a drawing
 * reads the active theme's display face.
 */
function artFor(d) {
  if (d.sign) return storefrontEngraving(d.sign)
  const e = ENGRAVINGS[d.slug]
  if (!e) throw new Error(`no engraving for slug "${d.slug}"`)
  return e.draw({ gold: C.gold, navyDeep: C.navyDeep, display: T.display })
}

/** engraving scaled to a target width, with optional caption */
function engravingPanel(x, y, w, caption, d) {
  const scale = w / 420
  const h = 244 * scale
  let s = `<g transform="translate(${x},${y})">`
  s += `<g transform="scale(${scale})">${artFor(d)}</g>`
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

// ---------------------------------------------------------------- data
/**
 * E. Braun & Co. (story id=1) — the fully researched record. It is the only
 * business with a traced storefront engraving and its own narrative copy, so
 * it is the only one that can carry the medium and detailed tiers.
 *
 * Still exported as `D` at the bottom of this file because
 * generate-lightburn-plaque.js builds its 300 × 200 format from it.
 */
const EBRAUN = {
  id: '1',
  slug: 'e-braun',
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
  sign: { left: 'WÄSCHEHAUS', centre: 'E. BRAUN & Cº', right: 'WIEN · BERLIN · PARIS' },
}

// ---------------------------------------------------------------- tier 1: SIMPLE (800×450)
async function simple(d) {
  const W = 800,
    H = 450,
    cx = W / 2
  const qrSize = 56
  const qr = await qrGroup(qrSize, d.url)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs()}
  ${chrome(W, H)}
  ${gedenktafelTab(cx, 74, 250)}
  <text x="${cx}" y="122" text-anchor="middle" font-family="${T.body}" font-weight="${T.bodyBold}" font-size="${bs(15)}"
        letter-spacing="7" fill="${C.cream}">HIER STAND</text>
  ${(() => {
    const lines = fitDisplayLines(d.name, 640, 50, 21)
    const size = Math.min(...lines.map((l) => fitDisplay(l, 640, 50, 21)))
    // Two lines have to grow upward from the same baseline so the divider,
    // address and years below them do not move.
    const y0 = lines.length > 1 ? 185 - (size + 4) : 185
    return lines
      .map(
        (l, i) =>
          `<text x="${cx}" y="${y0 + i * (size + 4)}" text-anchor="middle" font-family="${T.display}"
        font-weight="700" font-size="${size}" letter-spacing="2" fill="${C.goldBright}">${esc(l)}</text>`
      )
      .join('\n  ')
  })()}
  <text x="${cx}" y="218" text-anchor="middle" font-family="${T.display}" font-weight="${T.dispMed}" font-size="19"
        letter-spacing="1" fill="${C.cream}">${tradeLine(d)}</text>
  ${divider(cx, 248, 180)}
  <text x="${cx}" y="284" text-anchor="middle" font-family="${T.body}" font-weight="${T.bodyBold}" font-size="${bs(15)}"
        letter-spacing="2.5" fill="${C.cream}">${esc(d.address)}</text>
  <text x="${cx}" y="325" text-anchor="middle" font-family="${T.display}" font-weight="700" font-size="30"
        letter-spacing="3" fill="${C.gold}">${esc(d.years)}</text>
  <text x="${cx}" y="356" text-anchor="middle" font-family="${T.body}" font-weight="400" font-size="${bs(13)}"
        fill="${C.creamDim}">${esc(d.fate)}</text>
  ${attribution(118, 398, 13, 'start')}
  <text x="${cx}" y="398" text-anchor="middle" font-family="${T.body}" font-weight="400" font-size="${bs(10.5)}"
        letter-spacing="1.5" fill="${C.creamDim}" opacity="0.8">b3rlin.storytimemaps.com</text>
  ${qrBlock(qr, W - 78 - qrSize, H - 108 - qrSize + 14, qrSize, 'MEHR ERFAHREN')}
</svg>`
}

// ---------------------------------------------------------------- tier 2: MEDIUM (800×450, two-column w/ engraving)
async function medium(d) {
  const W = 800,
    H = 450
  const qrSize = 52
  const qr = await qrGroup(qrSize, d.url)
  const lx = 62
  const shortLines = wrap(d.short, 52)
  const eng = engravingPanel(452, 108, 288, d.caption, d)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs()}
  ${chrome(W, H)}
  <g text-anchor="start">
    <text x="${lx}" y="80" font-family="${T.body}" font-weight="${T.bodyBold}" font-size="${bs(10.5)}" letter-spacing="4"
          fill="${C.gold}">GEDENKTAFEL</text>
    <line x1="${lx + 130}" y1="76.5" x2="392" y2="76.5" stroke="${C.gold}" stroke-width="1"/>
    <text x="${lx}" y="110" font-family="${T.body}" font-weight="${T.bodyBold}" font-size="${bs(13)}" letter-spacing="6"
          fill="${C.cream}">HIER STAND</text>
    <text x="${lx}" y="152" font-family="${T.display}" font-weight="700"
          font-size="${fitDisplay(d.name, 330, 35, 20)}" letter-spacing="1"
          fill="${C.goldBright}">${esc(d.name)}</text>
    <text x="${lx}" y="178" font-family="${T.display}" font-weight="${T.dispMed}" font-size="${T.medSub}"
          fill="${C.cream}">${tradeLine(d)}</text>
    <text x="${lx}" y="206" font-family="${T.body}" font-weight="${T.bodyBold}" font-size="${bs(d.address.length > 38 ? 10.5 : 12.5)}" letter-spacing="1.8"
          fill="${C.cream}">${esc(d.address)}</text>
    <text x="${lx}" y="240" font-family="${T.display}" font-weight="700" font-size="24" letter-spacing="2"
          fill="${C.gold}">${esc(d.years)}</text>
    <line x1="${lx}" y1="258" x2="392" y2="258" stroke="${C.gold}" stroke-width="0.8" opacity="0.7"/>
    ${textBlock(shortLines, lx, 282, 18, `font-family="${T.body}" font-weight="400" font-size="${bs(12.5)}" fill="${C.cream}"`)}
  </g>
  ${eng.svg}
  ${attribution(118, H - 48, 13, 'start')}
  ${qrBlock(qr, 452 + 288 / 2 - qrSize / 2, 326, qrSize, 'MEHR ERFAHREN')}
</svg>`
}

// ---------------------------------------------------------------- tier 3: DETAILED (800×680)
async function detailed(d) {
  const W = 800,
    H = 680,
    cx = W / 2
  const qrSize = 52
  const qr = await qrGroup(qrSize, d.url)
  const col1 = wrap(d.p1, 60)
  const col2 = wrap(d.p2, 60)
  const engW = 340
  const eng = engravingPanel((W - engW) / 2, 172, engW, null, d)
  const engBottom = 172 + eng.h
  const colsY = engBottom + 92
  const factsY = H - 86
  // Facts row laid out left-to-right from measured label widths — fixed
  // positions collide as soon as a business has longer facts than E. Braun's.
  const factCells = (() => {
    const gap = 34
    const width = (t) => t.length * bs(9.5) * 0.66 + 8
    let x = 74
    let out = ''
    d.facts.forEach((f, i) => {
      const w = width(f)
      out += `<text x="${x + w / 2}" y="0" text-anchor="middle" font-family="${T.body}" font-weight="${T.bodyBold}"
        font-size="${bs(9.5)}" letter-spacing="1" fill="${C.gold}">${esc(f)}</text>`
      x += w
      if (i < d.facts.length - 1) {
        const dx = x + gap / 2
        out += `<rect x="${dx - 2.5}" y="-6" width="5" height="5" transform="rotate(45 ${dx} ${-3.5})" fill="${C.gold}"/>`
        x += gap
      }
    })
    return out
  })()
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs()}
  ${chrome(W, H)}
  ${gedenktafelTab(cx, 66, 240)}
  <text x="${cx}" y="102" text-anchor="middle" font-family="${T.body}" font-weight="${T.bodyBold}" font-size="${bs(13)}"
        letter-spacing="6" fill="${C.cream}">HIER STAND</text>
  <text x="${cx}" y="150" text-anchor="middle" font-family="${T.display}" font-weight="700"
        font-size="${fitDisplay(d.name, 660, 40, 24)}"
        letter-spacing="1.5" fill="${C.goldBright}">${esc(d.name)}</text>
  ${eng.svg}
  <text x="${cx}" y="${engBottom + 20}" text-anchor="middle" font-family="${T.body}" font-weight="400"
        font-size="${bs(10.5)}" letter-spacing="1.2" fill="${C.creamDim}">${esc(d.caption)}</text>
  ${(() => {
    const meta = `${d.type} · ${(d.shortAddress || d.address).replace(' · ', ', ')} · ${d.years}`
    return `<text x="${cx}" y="${engBottom + 48}" text-anchor="middle" font-family="${T.display}"
      font-weight="${T.dispMed}" font-size="${meta.length > 72 ? 13.5 : 16}"
      fill="${C.cream}">${esc(meta)}</text>`
  })()}
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
</svg>`
}

// ---------------------------------------------------------------- exports
// generate-lightburn-plaque.js reuses the storefront line-engraving, the QR
// module geometry and the plaque copy. setTheme() must be called first — the
// engraving's sign-band lettering reads the active theme's display face.
module.exports = {
  storefrontEngraving,
  qrGroup,
  D: EBRAUN,
  C,
  THEMES,
  esc,
  wrap,
  ATTRIBUTION,
  setTheme: (t) => {
    T = t
  },
}

// ---------------------------------------------------------------- business set
const { usable } = require('./lightburn-businesses.js')

/**
 * Which businesses get a premium plaque.
 *
 * NOT the 16 featured stories. Those records carry no `businessType` — see
 * isComplete() in lightburn-businesses.js — and a plaque must state the type of
 * business (CLAUDE.md). The trade cannot be recovered from the archive either:
 * matching the featured titles against the typed records finds exactly one true
 * hit (E. Braun) and at least one false one, so deriving it would put a wrong
 * trade on a memorial. They become eligible the day someone adds a sourced
 * businessType to those records, and this generator will pick them up
 * automatically.
 *
 * So the set is drawn from the 2,464 records that ARE complete, one per trade.
 * That rule is deterministic (usable() is already sorted), it is honest about
 * why these and not others, and it puts the full range of Jewish commercial
 * life on the page rather than fifteen shops of the same kind.
 *
 * One per trade also keeps the asset set small: each SVG embeds its fonts as
 * base64 and weighs ~150 KB, so generating all 2,464 in two type themes would
 * be about 740 MB of repository.
 */
function oneBusinessPerTrade() {
  const seenTrade = new Set()
  const seenSlug = new Set()
  const out = []
  for (const b of usable()) {
    if (seenTrade.has(b.trade) || seenSlug.has(b.slug)) continue
    seenTrade.add(b.trade)
    seenSlug.add(b.slug)
    out.push({
      id: String(b.id),
      slug: b.slug,
      name: b.name.toUpperCase(),
      type: b.trade,
      cities: '',
      address: b.address,
      years: b.years,
      fate: CONTEXT_DE,
      url: `${SITE}/?id=${b.id}`,
    })
  }
  return out
}

/** E. Braun's own record, in the same shape, keeping its researched copy. */
const EBRAUN_TIERS = { ...EBRAUN, url: `${SITE}/?id=${EBRAUN.id}` }

/**
 * The featured stories that carry an engraving (scripts/engravings.js) and
 * therefore the medium and detailed tiers. Copy is condensed from each story's
 * researched description/longDescription in data/storymaps.json — nothing here
 * is invented. Slugs must match ENGRAVINGS keys; captions come from there.
 */
const FEATURED_ENGRAVED = [
  {
    id: '2',
    slug: 'breslauer',
    name: 'MARTIN BRESLAUER',
    type: 'Antiquariat und Sortimentsbuchhandlung',
    cities: '',
    address: 'FRANZÖSISCHE STRASSE 46 · BERLIN-MITTE',
    years: '1898 – 1937',
    fate: '1936 zur Geschäftsübergabe gezwungen · 1937 Emigration nach London',
    short:
      'Martin Breslauers Antiquariat war seit 1898 das Herz des bibliophilen Berlin. 1936 zwang ihn die Reichskulturkammer, das Geschäft „an einen geeigneten Arier“ zu übergeben; Anfang 1937 floh die Familie nach London, wo Breslauer 1940 nach einem deutschen Bombenangriff starb.',
    p1: '1898 gegründet, wurde die Buchhandlung Martin Breslauers zum Treffpunkt der Berliner Bibliophilen. Breslauer beriet die Preußische Staatsbibliothek, vermittelte fürstliche Bibliotheken und trug mit 21.000 Bänden die größte bibliographische Privatsammlung der Welt zusammen.',
    p2: '1936 erzwang die Reichskulturkammer die Übergabe des Geschäfts „an einen geeigneten Arier“. Die Steuerbehörden nahmen ihm den Erlös seiner verkauften Sammlung ab; Anfang 1937 floh die Familie nach London. Dort starb Martin Breslauer 1940 in der Nacht eines deutschen Bombenangriffs.',
    facts: ['GEGRÜNDET 1898', '21.000 BÄNDE', 'SCHLIESSUNG 1937', 'EXIL LONDON 1937'],
  },
  {
    id: '3',
    slug: 'dtheater',
    name: 'DEUTSCHES THEATER',
    type: 'Theater',
    cities: '',
    address: 'SCHUMANNSTRASSE 13A · BERLIN-MITTE',
    years: '1906 – 1934',
    fate: 'Max Reinhardt ab 1933 planmäßig enteignet · 1934 Übernahme durch die DAF',
    short:
      'Unter Max Reinhardt wurde das Deutsche Theater ab 1906 zu einer der berühmtesten Bühnen Europas — 1931 umfasste sein Konzern zwölf Theater. Ab 1933 entzogen die NS-Behörden Reinhardt planmäßig sein Lebenswerk; 1934 fiel das Haus an die Deutsche Arbeitsfront.',
    p1: '1906 übernahm Max Reinhardt das 1883 gegründete Haus in der Schumannstraße und machte es mit den Kammerspielen zu einer der ersten Bühnen Europas. Bis 1931 wuchs sein Konzern auf zwölf Theater mit über 10.000 Plätzen.',
    p2: 'Ab 1933 wurde Reinhardt Schritt für Schritt enteignet: Steuerforderungen, erzwungene Rücktritte, entwertete Aktien. Im September 1934 ersteigerte die von der Deutschen Arbeitsfront kontrollierte AG auch das Grundstück. Erst 1995 wurden die Immobilien an Reinhardts Erben zurückgegeben.',
    facts: ['REINHARDT AB 1906', '12 BÜHNEN 1931', 'ENTZOGEN 1933/34', 'RÜCKGABE ERST 1995'],
  },
  {
    id: '4',
    slug: 'ebro',
    name: 'EBRO A.G.',
    type: 'Rosshaarspinnerei und Polsterwaren',
    cities: '',
    address: 'PISTORIUSSTRASSE 66–69 & 95–96 · WEISSENSEE',
    shortAddress: 'PISTORIUSSTRASSE 66–69, WEISSENSEE',
    years: '1900 – 1938',
    fate: '1938 unter Gewaltandrohung zwangsverkauft',
    short:
      'Die Erste Berliner Dampf-Rosshaarspinnerei der Brüder Richard und Ernst Friedmann lieferte patentierte Polster an Daimler-Benz, Opel und BMW. 1938 wurde die Familie unter Drohungen zum Verkauf weit unter Wert gezwungen; die Brüder überlebten die Verfolgung nicht.',
    p1: 'Um 1900 gründete Ingenieur Richard Friedmann die Rosshaarspinnerei Ebro in Weißensee; sein Bruder Ernst wurde Teilhaber. Mit einem patentierten Polsterverfahren wurde Ebro Zulieferer von Auto-Union, Daimler-Benz, Opel und BMW.',
    p2: 'Ab 1936 erzwang der Berliner Wirtschaftsberater Heinrich Hunke die Übernahme; 1938 mussten die Friedmanns unter Drohungen weit unter Wert verkaufen. Richard Friedmann nahm sich 1942 vor der Deportation das Leben, Ernst Friedmann wurde nach Kulmhof deportiert und ermordet.',
    facts: ['GEGRÜNDET UM 1900', 'PATENTVERFAHREN', 'ZWANGSVERKAUF 1938', 'ERMORDET 1942'],
  },
  {
    id: '5',
    slug: 'hoexter',
    name: 'ALFRED HÖXTER',
    type: 'Getreidegroßhandlung',
    cities: '',
    address: 'PARISER STRASSE 32 · BERLIN-WILMERSDORF',
    years: '1919 – 1937',
    fate: 'Durch Boykott und Zwangsbewirtschaftung verdrängt · 1937 aufgegeben',
    short:
      'Alfred Höxter handelte seit 1919 an der Berliner Produktenbörse mit Getreide. Boykott, Sondergesetze und die antiliberale Wirtschaftspolitik der Nationalsozialisten entzogen dem jüdischen Großhandel schrittweise die Grundlage; 1937 musste das Geschäft aufgegeben werden.',
    p1: 'Seit 1919 führte Alfred Höxter seine Getreidegroßhandlung von Wilmersdorf aus und handelte an der Berliner Produktenbörse, dem Zentrum des regionalen Agrarhandels.',
    p2: 'Nach 1933 trafen den jüdischen Getreidehandel Boykott und gezielte Sondermaßnahmen; zugleich zerstörte die staatliche Zwangsbewirtschaftung den freien Handel, von dem er lebte. 1937 musste Alfred Höxter sein Geschäft aufgeben.',
    facts: ['GEGRÜNDET 1919', 'PRODUKTENBÖRSE', 'BOYKOTT AB 1933', 'AUFGABE 1937'],
  },
  {
    id: '6',
    slug: 'pelz',
    name: 'FRÖHLICH & PELZ',
    type: 'Glas · Kristall · Porzellan',
    cities: '',
    address: 'RITTERSTRASSE 86 · BERLIN-KREUZBERG',
    years: '1924 – 1939',
    fate: 'Inhaber Moritz Fröhlich 1938 aus der eigenen Firma gedrängt · 1939 Emigration',
    short:
      'Moritz Fröhlich baute ab 1924 in Kreuzberg einen florierenden Handel mit Glas, Kristall und Porzellan auf. Ab 1936 drängte ihn sein Teilhaber Kurt Pelz mit Rückendeckung der NS-Behörden aus der eigenen Firma; Fröhlich verlor seine Existenz; im April 1939 gelang der Familie die Flucht über Kuba in die USA.',
    p1: '1924 eröffnete Moritz Fröhlich, Sohn eines oberschlesischen Gastwirts, sein Geschäft für Glas, Kristall und Porzellan in der Ritterstraße. Auch nach 1933 florierte der Handel zunächst weiter.',
    p2: 'Ab 1936 nutzte Teilhaber Kurt Pelz die Entrechtung der jüdischen Unternehmer: Bis 1938 drängte er Moritz Fröhlich vollständig aus dessen eigener Firma. Fröhlich verlor seine Existenzgrundlage. Im April 1939 gelang der Familie die Emigration über Kuba in die USA — unter ihnen der Sohn, der spätere Historiker Peter Gay.',
    facts: ['GEGRÜNDET 1924', 'GLAS · PORZELLAN', 'VERDRÄNGT 1938', 'EMIGRATION 1939'],
  },
  {
    id: '7',
    slug: 'theaterkunst',
    name: 'THEATERKUNST',
    type: 'Theaterausstattung',
    cities: '',
    address: 'SCHWEDTER STRASSE 9 · PRENZLAUER BERG',
    years: '1907 – 1936',
    fate: 'Unter wachsendem Druck 1936 verkauft',
    short:
      'Hermann J. Kaufmanns Theaterkunst stattete seit 1907 Bühne und Film mit Kostümen und Requisiten aus und zählte in den 1920er Jahren zur Weltspitze. Unter wachsendem Druck verkaufte Kaufmann 1936; als Theaterkunst GmbH besteht die Firma bis heute.',
    p1: 'Seit 1907 belieferte Hermann J. Kaufmann Theater und Film mit Kostümen, Dekorationen und Requisiten. In den 1920er Jahren zählte die Theaterkunst zu den führenden Ausstattern der Welt.',
    p2: 'Nach 1933 wuchs der Druck von Behörden, Institutionen und Konkurrenten auf den jüdischen Inhaber. 1936 verkaufte Kaufmann das Unternehmen. Unter dem Namen Theaterkunst GmbH besteht die Firma bis heute fort.',
    facts: ['GEGRÜNDET 1907', 'BÜHNE UND FILM', 'VERKAUF 1936', 'BESTEHT FORT'],
  },
  {
    id: '9',
    slug: 'jonass',
    name: 'JONASS & CO.',
    type: 'Kredit-Kaufhaus',
    cities: '',
    address: 'LOTHRINGER STRASSE 1 · BERLIN-MITTE',
    years: '1926 – 1938',
    fate: '1938 zum Verkauf gezwungen',
    short:
      'Das Kreditkaufhaus Jonass & Co. verkaufte auf Teilzahlung an Berlins weniger Wohlhabende; 1928 eröffnete der markante Neubau an der Lothringer Straße 1. 1938 wurden die jüdischen Inhaber zum Verkauf des Unternehmens gezwungen.',
    p1: '1926 gegründet, brachte Jonass & Co. das Kaufhaus zu Berlins kleinen Einkommen: Kauf auf Teilzahlung, „¼ Anzahlung und 4 Monatsraten“. 1928 eröffnete an der Lothringer Straße 1 der sechsgeschossige Neubau — „Groß-Berlin hat jetzt 2 Jonass-Häuser“.',
    p2: '1938 zwangen die NS-Behörden die jüdischen Eigentümer, Kaufhaus und Haus abzugeben. Das Gebäude an der heutigen Torstraße 1 steht noch; an die Firma Jonass erinnerte dort lange nichts.',
    facts: ['ERÖFFNET 1926', 'KAUF AUF RATEN', 'NEUBAU 1928', 'ZWANGSVERKAUF 1938'],
  },
  {
    id: '10',
    slug: 'kutschera',
    name: 'KARL KUTSCHERA',
    type: 'Café Wien und Zigeunerkeller',
    cities: '',
    address: 'KURFÜRSTENDAMM 26 · CHARLOTTENBURG',
    years: '1913 – 1937',
    fate: 'Nach Hetzkampagne des „Stürmer“ 1937 zum Verkauf gezwungen',
    short:
      'Karl Kutscheras Café Wien und der Weinkeller Zigeunerkeller am Kurfürstendamm waren Treffpunkte von internationalem Ruf. Ab 1936 hetzte das NS-Blatt „Der Stürmer“ gegen den jüdischen Wirt; ein Jahr später musste Kutschera verkaufen.',
    p1: 'Seit 1913 führte Karl Kutschera am Kurfürstendamm 26 das Café Wien und im Keller den Zigeunerkeller — mit Musik, Wein und Gästen aus Theater und Film ein Begriff weit über Berlin hinaus.',
    p2: 'Ab 1936 machte das Hetzblatt „Der Stürmer“ Kutschera mit verleumderischen Artikeln zur Zielscheibe. Nach einem Jahr war das Ziel erreicht: 1937 musste Karl Kutschera Café und Keller verkaufen.',
    facts: ['ERÖFFNET 1913', 'KURFÜRSTENDAMM 26', 'STÜRMER-HETZE 1936', 'VERKAUF 1937'],
  },
  {
    id: '12',
    slug: 'ruilos',
    name: 'RUILOS G.M.B.H.',
    type: 'Naturheilmittel',
    cities: '',
    address: 'ACHENBACHSTRASSE 33–35 · BERLIN-KÖPENICK',
    years: '1921 – 1951',
    fate: 'Inhaber Dr. Georg Eppenstein 1933 von der SA ermordet',
    short:
      'Die Ruilos G.m.b.H. des Chemikers Dr. Georg Eppenstein stellte in Köpenick Knoblauch-Heilmittel her. In der „Köpenicker Blutwoche“ im Juni 1933 verschleppten und misshandelten SA-Männer Eppenstein; er starb am 3. August 1933. Seine Frau führte den Betrieb weiter.',
    p1: '1921 gründete der Chemiker Dr. Georg Eppenstein die Ruilos G.m.b.H. in Köpenick. Ihre Knoblauch-Präparate — „Gleich der Sonne wirkt Ruilos“ — wurden als natürliche Hausmittel beworben.',
    p2: 'Am 21. Juni 1933, dem ersten Tag der „Köpenicker Blutwoche“, verschleppten SA-Männer Georg Eppenstein und misshandelten ihn schwer. Er erlag seinen Verletzungen am 3. August 1933. Seine nichtjüdische Frau führte das Unternehmen bis 1951 weiter.',
    facts: ['GEGRÜNDET 1921', 'DR. G. EPPENSTEIN', 'VERSCHLEPPT 1933', 'ERMORDET 1933'],
  },
  {
    id: '13',
    slug: 'wassermann',
    name: 'GEBR. WASSERMANN',
    type: 'Lebensmittel- und Gänsehandlung',
    cities: '',
    address: 'BRUNNENSTRASSE 71 · BERLIN-MITTE',
    years: '1923 – 1939',
    fate: '1939 zur Geschäftsaufgabe gedrängt',
    short:
      'Die Brüder Eduard Elias und Max Moses Wassermann handelten in der Brunnenstraße mit Lebensmitteln und Gänsen. Mit Teilhaberschaften und Branchenwechseln widerstanden sie jahrelang der Verdrängung — im September 1939 mussten auch sie aufgeben.',
    p1: 'Seit 1923 gehörten die Läden der Brüder Wassermann zur Brunnenstraße im Berliner Norden. Der eine hielt sich als stiller Teilhaber, der andere blieb durch Branchenwechsel im Geschäft — Strategien jüdischer Kaufleute gegen die Verdrängung.',
    p2: 'Auch wirtschaftlicher Erfolg bot keinen Schutz: Im September 1939 mussten die Brüder ihr Gewerbe endgültig aufgeben. Diese Tafel erinnert an sie und an die vielen kleinen Läden des Berliner Nordens.',
    facts: ['SEIT 1923', 'BRUNNENSTRASSE 71', 'BRANCHENWECHSEL', 'AUFGABE 1939'],
  },
  {
    id: '14',
    slug: 'weinberger',
    name: 'GEBR. WEINBERGER',
    type: 'Butter-Großhandlung',
    cities: '',
    address: 'BRUNNENSTRASSE 188–190 · BERLIN-MITTE',
    years: '1889 – 1938',
    fate: '1938 liquidiert',
    short:
      'Die Gebrüder Weinberger führten Berlins größte Butter-Großhandlung. Ausländisches Kapital und die polnische Botschaft schützten die Firma eine Zeit lang — doch 1938 gab es für das jüdische Unternehmen kein Entkommen mehr: Es wurde liquidiert.',
    p1: 'Seit 1889 belieferten die Gebrüder Weinberger Berlin mit Butter — zuletzt als größtes Buttergeschäft der Stadt, mit eigener Marke und eigenem Fuhrpark. Die Beteiligung eines ausländischen Konzerns und die polnische Botschaft boten zunächst Schutz.',
    p2: 'Den örtlichen Nationalsozialisten war das Unternehmen ein Dorn im Auge. 1938 halfen weder Kapital noch Diplomatie: Die Firma wurde liquidiert. Diese Tafel erinnert an Berlins größte Butterhandlung.',
    facts: ['GEGRÜNDET 1889', 'GRÖSSTE BERLINS', 'SCHUTZ BIS 1937', 'LIQUIDIERT 1938'],
  },
].map((d) => ({ ...d, caption: ENGRAVINGS[d.slug].caption, url: `${SITE}/?id=${d.id}` }))

// declared after module.exports above, so attach rather than inline
module.exports.FEATURED_ENGRAVED = FEATURED_ENGRAVED

// ---------------------------------------------------------------- main
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const others = oneBusinessPerTrade()
  const entries = []

  for (const theme of THEMES) {
    T = theme

    // E. Braun: every tier, every type theme — the one record with a traced
    // storefront engraving and researched narrative copy.
    for (const [tier, fn] of Object.entries({ simple, medium, detailed })) {
      const file = `${EBRAUN.slug}-${tier}${theme.suffix}.svg`
      fs.writeFileSync(path.join(OUT_DIR, file), await fn(EBRAUN_TIERS))
    }

    // Featured stories with an engraving: the two illustrated tiers, both
    // type themes (they sit beside E. Braun on the /plaques page).
    for (const b of FEATURED_ENGRAVED) {
      for (const [tier, fn] of Object.entries({ medium, detailed })) {
        const file = `${b.slug}-${tier}${theme.suffix}.svg`
        fs.writeFileSync(path.join(OUT_DIR, file), await fn(b))
      }
    }

    // Everyone else: the typographic tier only (no engraving exists for them),
    // and only in the classic type theme — a second theme would double an
    // already font-heavy asset set for a variant the page never shows.
    if (theme.suffix !== '') continue
    for (const b of others) {
      const file = `${b.slug}-simple.svg`
      fs.writeFileSync(path.join(OUT_DIR, file), await simple(b))
      entries.push({
        id: b.id,
        slug: b.slug,
        name: b.name,
        type: b.type,
        address: b.address,
        years: b.years,
        file,
      })
    }
  }

  // The /plaques page reads this instead of rebuilding filenames from business
  // names. Slugging in two places is exactly how the old asset paths drifted
  // until every image on that page 404'd.
  const index = {
    note: 'Generated by scripts/generate-premium-plaques.js — do not edit by hand.',
    featured: {
      id: EBRAUN.id,
      slug: EBRAUN.slug,
      name: EBRAUN.name,
      type: EBRAUN.type,
      address: EBRAUN.address,
      years: EBRAUN.years,
      tiers: ['simple', 'medium', 'detailed'],
      themes: THEMES.map((t) => t.suffix),
    },
    engraved: FEATURED_ENGRAVED.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      type: b.type,
      address: b.address,
      years: b.years,
      tiers: ['medium', 'detailed'],
      themes: THEMES.map((t) => t.suffix),
    })),
    plaques: entries,
  }
  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2) + '\n')

  console.log(
    `\u2713 E. Braun (3 tiers) + 11 engraved stories (2 tiers) x ${THEMES.length} themes + ${entries.length} trades \u2192 ${OUT_DIR}`
  )
}

if (require.main === module) main()
