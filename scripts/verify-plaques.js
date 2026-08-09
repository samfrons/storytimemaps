#!/usr/bin/env node
/**
 * Plaque benchmark — the acceptance gate for engraving-ready artwork.
 *
 * A LightBurn file that opens and looks right can still be unusable: a stray
 * <text> means the recipient needs our fonts, a surviving stroke engraves as a
 * hairline instead of a filled shape, a wrong viewBox silently rescales the
 * job, and an inverted or clipped QR is only discovered after the plate is
 * cut. Every one of those failures is invisible in a preview, so they are
 * asserted here instead.
 *
 * Checks, per file:
 *   1. exactly one <path> — the whole plaque is a single unioned outline
 *   2. no <text>, strokes, gradients, patterns, clipPaths or masks
 *   3. fill-rule="evenodd" — what makes the negative's counters engrave
 *   4. width/height in mm matching a known format, and viewBox 1 unit = 1 mm
 *   5. the QR decodes to the expected story URL, in BOTH readings
 *
 * Usage: node scripts/verify-plaques.js   (exit 0 = all good, 1 = failures)
 */

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const jsQR = require('jsqr')

const DIR = path.join(__dirname, '../public/plaques/lightburn')
const TMP = fs.mkdtempSync(path.join(require('os').tmpdir(), 'plaque-verify-'))
const RENDER_W = 2400 // px across the plate; 8 px/mm at 300 mm wide

// Plate sizes we accept. The QR position is NOT duplicated here — the
// generator writes a `qr-box mm:` comment into each file and we crop to that,
// so the two can never drift out of sync.
const FORMATS = {
  '300x200': { W: 300, H: 200 },
  '300x100': { W: 300, H: 100 },
}

function sh(cmd, args) {
  return execFileSync(cmd, args, { maxBuffer: 2e8 })
}

/** the QR box the generator recorded, in mm */
function qrBox(svg) {
  const m = svg.match(/qr-box mm: x=([\d.]+) y=([\d.]+) size=([\d.]+) url=(\S+)/)
  return m && { x: +m[1], y: +m[2], size: +m[3], url: m[4] }
}

/**
 * Decode by cropping to the recorded QR box. Cropping matters: on the 300 × 200
 * plate the storefront line-engraving trips the decoder's finder-pattern search
 * when the whole plaque is scanned at once, which reads as a false failure.
 */
function decodeQR(file, fmt, box_) {
  const png = path.join(TMP, 'p.png')
  const crop = path.join(TMP, 'c.png')
  sh('rsvg-convert', ['-w', String(RENDER_W), '-b', 'white', file, '-o', png])
  const s = RENDER_W / fmt.W // px per mm
  const pad = 6 * s // mm of margin around the code
  const box = Math.round(box_.size * s + pad * 2)
  const x = Math.round(box_.x * s - pad)
  const y = Math.round(box_.y * s - pad)
  sh('magick', [png, '-crop', `${box}x${box}+${x}+${y}`, '-colorspace', 'gray', crop])
  const raw = sh('magick', [crop, '-depth', '8', 'rgba:-'])
  const [w, h] = sh('magick', ['identify', '-format', '%w %h', crop])
    .toString()
    .split(' ')
    .map(Number)
  const r = jsQR(new Uint8ClampedArray(raw), w, h)
  return r && r.data
}

function checkFile(name) {
  const file = path.join(DIR, name)
  const svg = fs.readFileSync(file, 'utf8')
  const fails = []

  const key = Object.keys(FORMATS).find((k) => name.includes(k))
  if (!key) return [`unknown format (expected one of ${Object.keys(FORMATS).join(', ')})`]
  const fmt = FORMATS[key]

  const paths = (svg.match(/<path/g) || []).length
  if (paths !== 1) fails.push(`expected 1 <path>, found ${paths}`)

  for (const [label, re] of [
    ['<text>', /<text/],
    ['stroke', /stroke/],
    ['gradient', /(linear|radial)Gradient/],
    ['pattern', /<pattern/],
    ['clipPath', /<clipPath/],
    ['mask', /<mask/],
  ])
    if (re.test(svg)) fails.push(`contains ${label} — not pure filled geometry`)

  if (!/fill-rule="evenodd"/.test(svg)) fails.push('missing fill-rule="evenodd"')

  const dim = svg.match(/width="(\d+)mm" height="(\d+)mm" viewBox="0 0 (\d+) (\d+)"/)
  if (!dim) fails.push('width/height/viewBox not in the expected mm form')
  else {
    const [, w, h, vw, vh] = dim.map(Number)
    if (w !== fmt.W || h !== fmt.H) fails.push(`size ${w}x${h}mm, expected ${fmt.W}x${fmt.H}mm`)
    if (vw !== w || vh !== h) fails.push(`viewBox ${vw}x${vh} does not map 1 unit = 1 mm`)
  }

  const box = qrBox(svg)
  if (!box) {
    fails.push('no qr-box comment — regenerate with the current generator')
  } else {
    const url = decodeQR(file, fmt, box)
    if (!url) fails.push('QR does not decode')
    else if (url !== box.url) fails.push(`QR decodes to ${url}, file declares ${box.url}`)
    else if (!/^https:\/\/b3rlin\.storytimemaps\.com\/\?id=\d+$/.test(url)) {
      fails.push(`QR decodes to unexpected ${url}`)
    }
  }

  return fails
}

function main() {
  if (!fs.existsSync(DIR)) {
    console.error(`no plaques at ${DIR} — run: node scripts/generate-lightburn-plaque.js`)
    process.exit(1)
  }
  const files = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.svg'))
    .sort()
  if (!files.length) {
    console.error('no SVGs to verify')
    process.exit(1)
  }

  let bad = 0
  for (const f of files) {
    const fails = checkFile(f)
    if (fails.length) {
      bad++
      console.log(`FAIL  ${f}`)
      fails.forEach((x) => console.log(`        ${x}`))
    } else {
      console.log(`ok    ${f}`)
    }
  }
  fs.rmSync(TMP, { recursive: true, force: true })

  // Both readings of every plaque must exist — a positive with no negative is
  // half a deliverable and easy to miss when adding a new business.
  const stems = new Set(files.map((f) => f.replace(/-(lines|field)\.svg$/, '')))
  for (const s of stems) {
    for (const r of ['lines', 'field']) {
      if (!files.includes(`${s}-${r}.svg`)) {
        console.log(`FAIL  missing ${s}-${r}.svg`)
        bad++
      }
    }
  }

  console.log(bad ? `\n${bad} problem(s)` : `\n${files.length} files, all clean`)
  process.exit(bad ? 1 : 0)
}

main()
