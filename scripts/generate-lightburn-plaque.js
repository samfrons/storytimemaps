#!/usr/bin/env node
/**
 * LightBurn plaque generator
 *
 * Target material: 1.3 mm two-tone ABS engraving plate (cap layer over a
 * contrasting core). Engraving removes the cap and reveals the core, so the
 * same artwork has two useful readings, and every plaque is emitted twice:
 *
 *   *-lines.svg  positive — engrave the text, rules and line art.
 *                Artwork appears in the CORE colour on a CAP-colour plate.
 *   *-field.svg  negative — engrave everything EXCEPT the artwork.
 *                Artwork stays CAP colour, surrounded by CORE colour.
 *                This is the reading that matches the navy/gold screen design.
 *
 * Two formats:
 *
 *   300 × 200 mm  featured story (E. Braun & Co.) — narrative copy plus the
 *                 storefront line-engraving.
 *   300 × 100 mm  compact, no illustration — for the long tail of the database
 *                 where all we hold is name, trade, address and dates. Uses
 *                 real records from data/storymaps.json that are NOT among the
 *                 16 featured stories (see lightburn-businesses.js).
 *
 * Every plaque carries the "Stiftung Zurückgeben" funding attribution. That is
 * a project rule, not a layout choice — see CLAUDE.md.
 *
 * Both files are pure filled geometry: no text elements, no strokes, no
 * gradients, no patterns, no clipping. Set the whole thing to Fill in
 * LightBurn. Units are real millimetres (viewBox 1 unit = 1 mm), so the import
 * lands at exactly the stated size.
 *
 * Pipeline: this script emits an intermediate SVG that still uses <text> and
 * strokes, then Inkscape converts text→path, stroke→path and unions the lot
 * into a single outline. The negative is derived from that union by adding a
 * plate rectangle and switching to fill-rule="evenodd", which also turns the
 * counters of letterforms into engraved area (correct — the inside of an "o"
 * is field, not artwork).
 *
 * Requires: Inkscape 1.x, and the static TTFs in scripts/fonts installed as
 * system fonts (cp scripts/fonts/*.ttf ~/Library/Fonts/). The variable-weight
 * woff2 files used by the web generator flatten to weight 400 here, which is
 * why the static per-weight files exist.
 *
 * Usage: node scripts/generate-lightburn-plaque.js
 * Output: public/plaques/lightburn/
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const { execFileSync } = require('child_process')
const QRCode = require('qrcode')

const premium = require('./generate-premium-plaques.js')
const { storefrontEngraving, D, C, THEMES, esc, wrap, ATTRIBUTION } = premium
const businesses = require('./lightburn-businesses.js')
premium.setTheme(THEMES[0]) // classic: Kameron + Inter

const OUT_DIR = path.join(__dirname, '../public/plaques/lightburn')
const INKSCAPE = process.env.INKSCAPE || '/Applications/Inkscape.app/Contents/MacOS/inkscape'
const SITE = 'b3rlin.storytimemaps.com'
const qrUrl = (id) => `https://${SITE}/?id=${id}`

// Thinnest feature we are willing to cut. Below roughly 0.25 mm a diode/CO2
// kerf swallows the line and the two-tone contrast disappears, so every
// hairline in the source art is widened to this before outlining.
const MIN_STROKE = 0.3

const K = 'Kameron',
  I = 'Inter'

// ---------------------------------------------------------------- primitives (all values in mm)
function txt(s, x, y, { font = I, weight = 400, size = 4, ls = 0, anchor = 'start' } = {}) {
  return (
    `<text x="${x}" y="${y}" font-family="${font}" font-weight="${weight}" font-size="${size}"` +
    `${ls ? ` letter-spacing="${ls}"` : ''}${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''}` +
    ` fill="#000">${esc(s)}</text>`
  )
}

function rule(x1, y, x2, w = 0.4) {
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#000" stroke-width="${Math.max(MIN_STROKE, w)}"/>`
}

/** border: weighted rule + hairline companion + corner squares (matches the web plaques) */
function border(W, H, { rule: o, hair: o2, sq }) {
  const corners = [
    [o, o],
    [W - o, o],
    [o, H - o],
    [W - o, H - o],
  ]
    .map(
      ([x, y]) =>
        `<rect x="${x - sq / 2}" y="${y - sq / 2}" width="${sq}" height="${sq}"
           fill="none" stroke="#000" stroke-width="0.5"/>`
    )
    .join('\n  ')
  return `<rect x="${o}" y="${o}" width="${W - o * 2}" height="${H - o * 2}"
        fill="none" stroke="#000" stroke-width="0.7"/>
  <rect x="${o2}" y="${o2}" width="${W - o2 * 2}" height="${H - o2 * 2}"
        fill="none" stroke="#000" stroke-width="${MIN_STROKE}"/>
  ${corners}`
}

/** attribution lock-up, thin/bold like the Zurückgeben wordmark */
function attribution(x, y, size) {
  const [thin, bold] = ATTRIBUTION.split(' ')
  // xml:space="preserve" — without it Inkscape collapses the trailing space
  // and the lock-up reads "StiftungZurückgeben"
  return (
    `<text x="${x}" y="${y}" font-family="${I}" font-size="${size}" fill="#000" xml:space="preserve"` +
    `><tspan font-weight="400">${esc(thin)} </tspan>` +
    `<tspan font-weight="700">${esc(bold)}</tspan></text>`
  )
}

// ---------------------------------------------------------------- QR (kept out of the union — see below)
function qrModules(url, x, y, size) {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' })
  const n = qr.modules.size
  const data = qr.modules.data
  const m = size / n
  let d = ''
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (data[r * n + c]) {
        const px = +(x + c * m).toFixed(4),
          py = +(y + r * m).toFixed(4),
          mm = +m.toFixed(4)
        d += `M${px},${py}h${mm}v${mm}h${-mm}z`
      }
    }
  }
  return d
}

/**
 * The unengraved island the QR sits on in the negative version. Without it the
 * modules would be the only un-engraved thing in an engraved field — an
 * inverted code, which not every scanner will read.
 */
function qrCard(x, y, size, pad = 4) {
  return `M${x - pad},${y - pad}h${size + pad * 2}v${size + pad * 2}h${-(size + pad * 2)}z`
}

// ---------------------------------------------------------------- storefront engraving, retuned for cutting
// The web engraving is gold-on-navy with pattern fills, hairlines down to
// 0.5 units and decorative opacity. None of that survives a laser, so the
// colours collapse to black, the pattern/knockout fills drop to none, and
// every stroke is widened so that it still reads after the scale-down.
function engravingForCutting(scale) {
  let s = storefrontEngraving()
  s = s
    .replace(/fill="url\(#glassHatch\)"/g, 'fill="none"')
    .replace(new RegExp(`fill="${C.navyDeep}"`, 'g'), 'fill="none"')
    .replace(new RegExp(`(fill|stroke)="${C.gold}"`, 'g'), '$1="#000"')
    .replace(/\s+opacity="[\d.]+"/g, '')
  const minRaw = MIN_STROKE / scale
  s = s.replace(
    /stroke-width="([\d.]+)"/g,
    (_, v) => `stroke-width="${Math.max(+v, minRaw).toFixed(3)}"`
  )
  // Inkscape resolves letter-spacing in root user units and ignores the
  // enclosing group's scale, so the sign-band tracking comes out 1/scale too
  // wide and the three panels collide. Pre-multiply to cancel that out. The
  // intermediate therefore looks under-tracked in a browser — only the
  // post-Inkscape output is correct.
  s = s.replace(
    /letter-spacing="([\d.]+)"/g,
    (_, v) => `letter-spacing="${(+v * scale).toFixed(4)}"`
  )
  return s
}

// ---------------------------------------------------------------- format 1: featured story, 300 × 200
const FULL = { W: 300, H: 200 }

function fullLayout() {
  const { W, H } = FULL
  const L = { colX: 24, colRight: 158, engX: 170, engY: 34, engW: 116, qrSize: 30 }
  const engScale = L.engW / 420
  const engBottom = L.engY + 244 * engScale
  const qrX = L.engX + (L.engW - L.qrSize) / 2
  const qrY = engBottom + 26
  const body = wrap(D.short, 44)

  const art = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
  ${border(W, H, { rule: 10, hair: 13.5, sq: 5 })}

  ${txt('GEDENKTAFEL', L.colX, 36, { weight: 700, size: 3.4, ls: 1.5 })}
  ${rule(L.colX + 42, 34.9, L.colRight, 0.35)}
  ${txt('HIER STAND', L.colX, 48, { weight: 700, size: 4.2, ls: 2 })}
  ${txt(D.name, L.colX, 68, { font: K, weight: 700, size: 13.5 })}
  ${txt(`${D.type} · ${D.cities}`, L.colX, 78, { font: K, weight: 400, size: 5.4 })}
  ${txt(D.address, L.colX, 90, { weight: 700, size: 4.1, ls: 0.6 })}
  ${txt(D.years, L.colX, 106, { font: K, weight: 700, size: 9.5, ls: 0.8 })}
  ${rule(L.colX, 114, L.colRight, 0.35)}
  ${body.map((l, i) => txt(l, L.colX, 126 + i * 6.4, { size: 4, ls: 0.1 })).join('\n  ')}
  ${attribution(L.colX, 176, 5)}
  ${txt(SITE, L.colX, 186, { size: 3.2, ls: 0.6 })}

  <g transform="translate(${L.engX},${L.engY}) scale(${engScale})">
    ${engravingForCutting(engScale)}
  </g>
  ${txt(D.caption, L.engX + L.engW / 2, engBottom + 8, { size: 3.4, ls: 0.5, anchor: 'middle' })}
  ${txt('MEHR ERFAHREN', L.engX + L.engW / 2, qrY + L.qrSize + 9, { weight: 700, size: 3.4, ls: 1.4, anchor: 'middle' })}
</svg>`

  return { art, W, H, qr: { url: qrUrl(1), x: qrX, y: qrY, size: L.qrSize } }
}

// ---------------------------------------------------------------- format 2: compact, 300 × 100, no illustration
const COMPACT = { W: 300, H: 100 }

/**
 * Standing context line. Without it a compact plaque is just a shop name and a
 * pair of dates — a passer-by has no way to know what the object commemorates.
 *
 * Wording is deliberate. "Enteignet und liquidiert" is what the records
 * actually document: businesses were expropriated under the "Arisierung"
 * programme and then wound up, which is where the end dates in the database
 * come from. Vaguer verbs would either overstate (implying every firm was
 * physically destroyed) or understate the coercion.
 */
const CONTEXT_DE =
  'Jüdisches Unternehmen, unter nationalsozialistischer Herrschaft enteignet und liquidiert.'

/**
 * With no photograph and no narrative, the four facts carry the plaque, framed
 * by the two things that tell a passer-by what they are looking at: the
 * GEDENKTAFEL label at the top and the context line at the foot. Trade and
 * address share a line so the name keeps the full display size.
 */
function nameSize(name) {
  if (name.length <= 16) return 14
  if (name.length <= 24) return 11
  if (name.length <= 34) return 9
  return 7.5
}

function compactLayout(b) {
  const { W, H } = COMPACT
  const colX = 20,
    qrSize = 22
  const qrX = W - 18 - qrSize
  const qrY = 24
  const colRight = qrX - 12

  const art = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
  ${border(W, H, { rule: 8, hair: 11, sq: 4 })}

  ${txt('GEDENKTAFEL', colX, 21, { weight: 700, size: 3.2, ls: 1.5 })}
  ${rule(colX + 40, 19.9, colRight, 0.35)}
  ${txt('HIER STAND', colX, 29.5, { weight: 700, size: 3.6, ls: 2 })}
  ${txt(b.name, colX, 44, { font: K, weight: 700, size: nameSize(b.name) })}
  ${txt(`${b.trade} · ${b.address}`, colX, 53, { weight: 700, size: 3.6, ls: 0.6 })}
  ${txt(b.years, colX, 65, { font: K, weight: 700, size: 7.5, ls: 0.8 })}
  ${rule(colX, 70.5, colRight, 0.35)}
  ${txt(CONTEXT_DE, colX, 76.5, { size: 3.2, ls: 0.1 })}
  ${attribution(colX, 84, 3.6)}
  ${txt(SITE, colRight, 84, { size: 3, ls: 0.5, anchor: 'end' })}
</svg>`

  return { art, W, H, qr: { url: qrUrl(b.id), x: qrX, y: qrY, size: qrSize } }
}

// ---------------------------------------------------------------- Inkscape: text→path, stroke→path, union
function unionPathD(svgText) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lb-plaque-'))
  const inFile = path.join(tmp, 'art.svg')
  const outFile = path.join(tmp, 'art-flat.svg')
  fs.writeFileSync(inFile, svgText)
  // Ungroup first: that bakes the engraving group's translate/scale into the
  // child geometry. Without it the union output is a bare `d` in source units
  // and the engraving lands at 420 mm wide in the middle of the plate.
  // select-all:no-groups after ungrouping is what makes path-union see every
  // object rather than a handful of top-level ones.
  const ungroup = 'select-all:all;selection-ungroup;'.repeat(4)
  execFileSync(
    INKSCAPE,
    [
      inFile,
      `--actions=${ungroup}select-all:no-groups;object-to-path;object-stroke-to-path;` +
        'select-all:no-groups;path-union;' +
        `export-filename:${outFile};export-plain-svg;export-do`,
    ],
    { stdio: 'pipe' }
  )
  const out = fs.readFileSync(outFile, 'utf8')
  if (process.env.DEBUG_LB) {
    fs.mkdirSync(path.join(OUT_DIR, '.debug'), { recursive: true })
    fs.copyFileSync(inFile, path.join(OUT_DIR, '.debug', 'art-in.svg'))
    fs.copyFileSync(outFile, path.join(OUT_DIR, '.debug', 'art-flat.svg'))
  }
  const ds = [...out.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1])
  if (!ds.length) throw new Error('Inkscape produced no path geometry')
  fs.rmSync(tmp, { recursive: true, force: true })
  return ds.join(' ')
}

function wrapSVG(d, W, H, comment) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${comment} -->
<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
  <path fill="#000000" fill-rule="evenodd" d="${d}"/>
</svg>`
}

/** run a layout through Inkscape and write both readings */
function emit(layout, basename) {
  const { art, W, H, qr } = layout
  const modules = qrModules(qr.url, qr.x, qr.y, qr.size)
  const card = qrCard(qr.x, qr.y, qr.size)
  const d = unionPathD(art)
  const size = `${W} x ${H} mm`

  const lines = wrapSVG(
    `${d} ${modules}`,
    W,
    H,
    `POSITIVE — engrave the artwork. Set all geometry to Fill. ${size}.`
  )
  // negative: plate, minus artwork (evenodd), plus an unengraved island under
  // the QR so its modules stay dark-on-light and remain scannable
  const plate = `M0,0h${W}v${H}h${-W}z`
  const field = wrapSVG(
    `${plate} ${d} ${card} ${modules}`,
    W,
    H,
    `NEGATIVE — engrave the field, artwork stays cap colour. Set all geometry to Fill. ${size}.`
  )

  for (const [suffix, svg] of [
    ['lines', lines],
    ['field', field],
  ]) {
    const file = path.join(OUT_DIR, `${basename}-${suffix}.svg`)
    fs.writeFileSync(file, svg)
    console.log(`✓ ${path.basename(file)} (${(svg.length / 1024).toFixed(0)} KB)`)
  }
}

// ---------------------------------------------------------------- main
function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  console.log('300 × 200 — featured story')
  emit(fullLayout(), 'e-braun-300x200')

  console.log('\n300 × 100 — compact, no illustration')
  for (const b of businesses.samples()) {
    console.log(`  ${b.name} · ${b.trade} · ${b.address} · ${b.years}`)
    emit(compactLayout(b), `${b.slug}-300x100`)
  }
}

if (require.main === module) {
  try {
    main()
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}
