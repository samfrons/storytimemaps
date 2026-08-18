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
const { storefrontEngraving, D, C, THEMES, esc, wrap, ATTRIBUTION, FEATURED_ENGRAVED } = premium
const { ENGRAVINGS } = require('./engravings.js')
const { CUT } = require('./engravings-cut.js')
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
function txt(
  s,
  x,
  y,
  { font = I, weight = 400, size = 4, ls = 0, anchor = 'start', style = '' } = {}
) {
  return (
    `<text x="${x}" y="${y}" font-family="${font}" font-weight="${weight}" font-size="${size}"` +
    `${ls ? ` letter-spacing="${ls}"` : ''}${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''}` +
    `${style ? ` font-style="${style}"` : ''}` +
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

/**
 * Ornate certificate border (the "rose-braun" design): double outer rule with
 * diamond-rosette corner blocks, top/bottom centre cartouches, an inner frame
 * with concave (scalloped) corners, and a calligraphic scroll flourish in each
 * corner. All strokes ≥ MIN_STROKE so the two-tone contrast survives the cut.
 */
function ornateBorder(W, H) {
  const o1 = 5, // outer rule inset
    o2 = 8, // hairline companion inset
    i = 13.5, // inner scalloped frame inset
    r = 9 // scallop radius
  // corner rosette: square block with a filled diamond, straddling both rules
  const rosette = (x, y) =>
    `<rect x="${x - 3.5}" y="${y - 3.5}" width="7" height="7" fill="none" stroke="#000" stroke-width="0.5"/>
  <rect x="${x - 1.4}" y="${y - 1.4}" width="2.8" height="2.8" transform="rotate(45 ${x} ${y})" fill="#000" stroke="none"/>`
  const rosettes = [
    [6.5, 6.5],
    [W - 6.5, 6.5],
    [6.5, H - 6.5],
    [W - 6.5, H - 6.5],
  ]
    .map(([x, y]) => rosette(x, y))
    .join('\n  ')
  // centre cartouche on the top and bottom rules, small diamond just inside
  const cartouche = (cy, dy) =>
    `<rect x="${W / 2 - 13}" y="${cy - 3.5}" width="26" height="7" fill="none" stroke="#000" stroke-width="0.5"/>
  <rect x="${W / 2 - 10.5}" y="${cy - 1.8}" width="21" height="3.6" fill="none" stroke="#000" stroke-width="${MIN_STROKE}"/>
  <rect x="${W / 2 - 1.3}" y="${dy - 1.3}" width="2.6" height="2.6" transform="rotate(45 ${W / 2} ${dy})" fill="#000" stroke="none"/>`
  // inner frame, corners scalloped inward (sweep 0 = concave)
  const scallop =
    `<path fill="none" stroke="#000" stroke-width="0.5" d="` +
    `M ${i + r},${i} H ${W - i - r} A ${r},${r} 0 0 0 ${W - i},${i + r} ` +
    `V ${H - i - r} A ${r},${r} 0 0 0 ${W - i - r},${H - i} ` +
    `H ${i + r} A ${r},${r} 0 0 0 ${i},${H - i - r} ` +
    `V ${i + r} A ${r},${r} 0 0 0 ${i + r},${i} z"/>`
  // calligraphic corner scroll: arc hugging the scallop, spiral terminals, dot.
  // Drawn once for the top-left corner, mirrored into the other three.
  const flourish = `
    <path d="M 33,18 C 24.5,18 18,24.5 18,33" fill="none" stroke="#000" stroke-width="0.6"/>
    <path d="M 33,18 C 36.2,18 37.8,15.9 36.9,13.6 C 36.1,11.7 33.5,11.5 32.6,13.2 C 31.9,14.6 32.9,16.1 34.4,15.8" fill="none" stroke="#000" stroke-width="0.45"/>
    <path d="M 18,33 C 18,36.2 15.9,37.8 13.6,36.9 C 11.7,36.1 11.5,33.5 13.2,32.6 C 14.6,31.9 16.1,32.9 15.8,34.4" fill="none" stroke="#000" stroke-width="0.45"/>
    <circle cx="24" cy="24" r="0.9" fill="#000" stroke="none"/>`
  const flourishes = [
    '',
    `translate(${W},0) scale(-1,1)`,
    `translate(0,${H}) scale(1,-1)`,
    `translate(${W},${H}) scale(-1,-1)`,
  ]
    .map((t) => `<g${t ? ` transform="${t}"` : ''}>${flourish}</g>`)
    .join('\n  ')
  return `<rect x="${o1}" y="${o1}" width="${W - o1 * 2}" height="${H - o1 * 2}"
        fill="none" stroke="#000" stroke-width="0.7"/>
  <rect x="${o2}" y="${o2}" width="${W - o2 * 2}" height="${H - o2 * 2}"
        fill="none" stroke="#000" stroke-width="${MIN_STROKE}"/>
  ${rosettes}
  ${cartouche(6.5, 11.3)}
  ${cartouche(H - 6.5, H - 11.3)}
  ${scallop}
  ${flourishes}`
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

// ---------------------------------------------------------------- illustration, as layered fill geometry
// The stroke line-art of engravings.js does not survive filling: outlined
// strokes engrave as thin trenches and dense passages merge into mud (seen on
// the first physical Jonass cut). The cut illustrations are therefore separate
// fill-geometry drawings (engravings-cut.js): ordered closed polygons whose
// evenodd nesting produces layered tones — solid mass, light openings, dark
// details inside them.
//
// Crucially this geometry must BYPASS the Inkscape union: path-union is a
// boolean OR, which would fill every opening and flatten the layers. The
// polygons are emitted directly into the final evenodd path instead, and only
// the sign lettering goes through Inkscape (as plate-mm <text>, so the old
// group-scale letter-spacing trap does not apply).

/** polygons (local 420×244 units) → path data in plate mm */
function cutPolysToD(polys, tx, ty, s) {
  return polys
    .map(
      (pts) =>
        'M' +
        pts.map(([x, y]) => `${(tx + x * s).toFixed(3)},${(ty + y * s).toFixed(3)}`).join('L') +
        'z'
    )
    .join(' ')
}

/** the drawing's lettering, placed at final size in plate mm */
function cutTexts(texts, tx, ty, s) {
  return texts
    .map((t) =>
      txt(t.s, tx + t.x * s, ty + t.y * s, {
        font: K,
        weight: t.weight || 700,
        size: t.size * s,
        ls: (t.ls || 0) * s,
        anchor: t.anchor || 'middle',
        style: t.style || '',
      })
    )
    .join('\n  ')
}

// ---------------------------------------------------------------- format 1: featured story, 300 × 200
const FULL = { W: 300, H: 200 }

/** display size for the name column — same idea as nameSize() below, full format */
function fullNameSize(name) {
  const maxW = 134 // colRight - colX
  const est = name.length * 13.5 * 0.62
  if (est <= maxW) return 13.5
  return Math.max(7.5, Math.floor((maxW / (name.length * 0.62)) * 10) / 10)
}

/**
 * 300 × 200 featured-story layout, for any business with an engraving.
 * `d` defaults to E. Braun; other businesses resolve their line art through
 * the ENGRAVINGS registry (drawn with the classic display face, Kameron).
 */
function fullLayout(d = D, id = 1, ornate = false) {
  const { W, H } = FULL
  const L = { colX: 24, colRight: 158, engX: 170, engY: 34, engW: 116, qrSize: 30 }
  const engScale = L.engW / 420
  const engBottom = L.engY + 244 * engScale
  const qrX = L.engX + (L.engW - L.qrSize) / 2
  const qrY = engBottom + 26
  const body = wrap(d.short, 44)
  const trade = d.cities ? `${d.type} · ${d.cities}` : d.type
  const cut = CUT[d.slug]
  if (!cut) throw new Error(`no fill-geometry cut drawing for slug "${d.slug}"`)
  const built = cut.build()

  const art = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
  ${ornate ? ornateBorder(W, H) : border(W, H, { rule: 10, hair: 13.5, sq: 5 })}

  ${txt('GEDENKTAFEL', L.colX, 36, { weight: 700, size: 3.4, ls: 1.5 })}
  ${rule(L.colX + 42, 34.9, L.colRight, 0.35)}
  ${txt('HIER STAND', L.colX, 48, { weight: 700, size: 4.2, ls: 2 })}
  ${txt(d.name, L.colX, 68, { font: K, weight: 700, size: fullNameSize(d.name) })}
  ${txt(trade, L.colX, 78, { font: K, weight: 400, size: trade.length > 34 ? 4.4 : 5.4 })}
  ${txt(d.address, L.colX, 90, { weight: 700, size: d.address.length > 38 ? 3.4 : 4.1, ls: 0.6 })}
  ${txt(d.years, L.colX, 106, { font: K, weight: 700, size: 9.5, ls: 0.8 })}
  ${rule(L.colX, 114, L.colRight, 0.35)}
  ${body.map((l, i) => txt(l, L.colX, 126 + i * 6.4, { size: 4, ls: 0.1 })).join('\n  ')}
  ${attribution(L.colX, 176, 5)}
  ${
    // the ornate corner flourish owns the bottom-left — the site line moves
    // under MEHR ERFAHREN so it doesn't thread through the scrollwork
    ornate
      ? txt(SITE, L.engX + L.engW / 2, qrY + L.qrSize + 15.5, {
          size: 3.2,
          ls: 0.6,
          anchor: 'middle',
        })
      : txt(SITE, L.colX, 186, { size: 3.2, ls: 0.6 })
  }

  ${cutTexts(built.texts, L.engX, L.engY, engScale)}
  ${txt(d.caption, L.engX + L.engW / 2, engBottom + 8, { size: 3.4, ls: 0.5, anchor: 'middle' })}
  ${txt('MEHR ERFAHREN', L.engX + L.engW / 2, qrY + L.qrSize + 9, { weight: 700, size: 3.4, ls: 1.4, anchor: 'middle' })}
</svg>`

  return {
    art,
    W,
    H,
    qr: { url: qrUrl(id), x: qrX, y: qrY, size: L.qrSize },
    extraD: cutPolysToD(built.polys, L.engX, L.engY, engScale),
  }
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

/**
 * The qr-box comment records where the code sits, in mm. verify-plaques.js
 * crops to it to decode. Emitting it here rather than re-deriving the layout
 * in the verifier means the two cannot drift apart.
 */
function wrapSVG(d, W, H, comment, qr) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${comment} -->
<!-- qr-box mm: x=${qr.x} y=${qr.y} size=${qr.size} url=${qr.url} -->
<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
  <path fill="#000000" fill-rule="evenodd" d="${d}"/>
</svg>`
}

/**
 * Editable-text reading: the pre-Inkscape art, with the QR modules and any
 * fill-geometry illustration appended. Text stays <text> so LightBurn (with
 * the scripts/fonts TTFs installed) can still edit the copy. NOT cut-ready as
 * emitted — it still contains strokes and live text; it is the editing source
 * for the outlined -lines/-field pair. Lives in text/ because verify-plaques
 * only scans the flat lightburn dir.
 */
function emitTextVersion(art, extraD, modules, W, H, qr, basename) {
  const dir = path.join(OUT_DIR, 'text')
  fs.mkdirSync(dir, { recursive: true })
  const body = art
    .replace(
      '</svg>',
      `  <path fill="#000" fill-rule="evenodd" d="${extraD ? `${extraD} ` : ''}${modules}"/>\n</svg>`
    )
    .replace(
      '<svg ',
      `<!-- EDITABLE SOURCE — text kept as text for LightBurn edits; regenerate the outlined pair after changes. ${W} x ${H} mm. -->\n<!-- qr-box mm: x=${qr.x} y=${qr.y} size=${qr.size} url=${qr.url} -->\n<svg `
    )
  const file = path.join(dir, `${basename}-text.svg`)
  fs.writeFileSync(file, `<?xml version="1.0" encoding="UTF-8"?>\n${body}`)
  console.log(`✓ text/${path.basename(file)} (${(body.length / 1024).toFixed(0)} KB)`)
}

/** run a layout through Inkscape and write both readings */
function emit(layout, basename) {
  const { art, W, H, qr, extraD = '' } = layout
  const modules = qrModules(qr.url, qr.x, qr.y, qr.size)
  const card = qrCard(qr.x, qr.y, qr.size)
  emitTextVersion(art, extraD, modules, W, H, qr, basename)
  // extraD (the layered fill illustration) joins AFTER the union — its evenodd
  // nesting is the layering, and a boolean union would destroy it
  const d = `${unionPathD(art)} ${extraD}`.trim()
  const size = `${W} x ${H} mm`

  const lines = wrapSVG(
    `${d} ${modules}`,
    W,
    H,
    `POSITIVE — engrave the artwork. Set all geometry to Fill. ${size}.`,
    qr
  )
  // negative: plate, minus artwork (evenodd), plus an unengraved island under
  // the QR so its modules stay dark-on-light and remain scannable
  const plate = `M0,0h${W}v${H}h${-W}z`
  const field = wrapSVG(
    `${plate} ${d} ${card} ${modules}`,
    W,
    H,
    `NEGATIVE — engrave the field, artwork stays cap colour. Set all geometry to Fill. ${size}.`,
    qr
  )

  for (const [suffix, svg] of [
    ['lines', lines],
    ['field', field],
  ]) {
    const file = path.join(OUT_DIR, `${basename}-${suffix}.svg`)
    fs.writeFileSync(file, svg)
    console.log(`✓ ${path.basename(file)} (${(svg.length / 1024).toFixed(0)} KB)`)
  }
  return { d, modules }
}

/**
 * Presentational rendering of a cut file: the same union geometry, navy on a
 * brushed rose-copper field (the "rose-braun" mockup). Not a cut file — lives
 * with the premium web plaques, not in the lightburn dir (verify-plaques
 * checks every SVG there for a qr-box comment).
 */
function copperPreview(d, modules, W, H) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="copper" cx="50%" cy="40%" r="90%">
      <stop offset="0%" stop-color="#e7b899"/>
      <stop offset="60%" stop-color="#d7a181"/>
      <stop offset="100%" stop-color="#bc8365"/>
    </radialGradient>
    <pattern id="brush" width="0.9" height="2" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="2" stroke="#fff" stroke-width="0.25"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#copper)"/>
  <rect width="${W}" height="${H}" fill="url(#brush)" opacity="0.14"/>
  <path fill="#1e2f55" fill-rule="evenodd" d="${d} ${modules}"/>
</svg>`
}

// ---------------------------------------------------------------- main
function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  // Optional slug filter: `node generate-lightburn-plaque.js ruilos` cuts one
  // engraved story only — used to validate a new engraving end-to-end before
  // committing to the full batch.
  const only = process.argv[2]

  // `node generate-lightburn-plaque.js ornate` — E. Braun with the ornate
  // certificate border, plus a rose-copper presentational SVG of the same cut.
  if (only === 'ornate') {
    console.log('300 × 200 — E. Braun, ornate border')
    const { d, modules } = emit(fullLayout(D, 1, true), 'e-braun-300x200-ornate')
    const preview = copperPreview(d, modules, FULL.W, FULL.H)
    const file = path.join(__dirname, '../public/plaques/premium/ebraun-ornate-copper.svg')
    fs.writeFileSync(file, preview)
    console.log(`✓ ${path.basename(file)} (${(preview.length / 1024).toFixed(0)} KB)`)
    return
  }

  console.log('300 × 200 — featured stories with engraving')
  if (!only || only === 'e-braun') emit(fullLayout(), 'e-braun-300x200')
  for (const b of FEATURED_ENGRAVED) {
    if (only && b.slug !== only) continue
    console.log(`  ${b.name} · ${b.address} · ${b.years}`)
    emit(fullLayout(b, b.id), `${b.slug}-300x200`)
  }
  if (only) return

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
