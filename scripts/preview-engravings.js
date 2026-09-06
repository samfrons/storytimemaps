#!/usr/bin/env node
/**
 * Renders each engraving in scripts/engravings.js as a standalone framed SVG
 * (navy field, gold line, caption) for review and for the /plaques page.
 *
 * Usage: node scripts/preview-engravings.js
 * Output: public/plaques/premium/engravings/{slug}.svg
 */
const fs = require('fs')
const path = require('path')
const { ENGRAVINGS } = require('./engravings.js')

const FONT_DIR = path.join(__dirname, 'fonts')
const OUT_DIR = path.join(__dirname, '../public/plaques/premium/engravings')

const C = {
  navy: '#1d2c4f',
  navyDeep: '#152342',
  navyEdge: '#101b33',
  gold: '#d9a441',
  cream: '#f1e4c3',
  creamDim: '#cfc0a0',
}
const DISPLAY = 'Cinzel'
const BODY = 'EB Garamond'

function fontCSS() {
  return ['Cinzel-latin.woff2', 'EBGaramond-latin.woff2']
    .map((f, i) => {
      const b64 = fs.readFileSync(path.join(FONT_DIR, f)).toString('base64')
      return `@font-face { font-family: '${i === 0 ? DISPLAY : BODY}'; font-weight: 100 900;
        src: url(data:font/woff2;base64,${b64}) format('woff2'); }`
    })
    .join('\n')
}

function render(slug, e) {
  const W = 520,
    H = 360
  const art = e.draw({ gold: C.gold, navyDeep: C.navyDeep, display: DISPLAY })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>${fontCSS()}</style>
    <radialGradient id="fieldGrad" cx="50%" cy="42%" r="85%">
      <stop offset="0%" stop-color="${C.navy}"/>
      <stop offset="70%" stop-color="${C.navyDeep}"/>
      <stop offset="100%" stop-color="${C.navyEdge}"/>
    </radialGradient>
    <pattern id="glassHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-55)">
      <line x1="0" y1="0" x2="0" y2="7" stroke="${C.gold}" stroke-width="0.55" opacity="0.38"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#fieldGrad)"/>
  <rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="${C.gold}" stroke-width="1.3"/>
  <g transform="translate(50,44)"><g fill="${C.gold}">${art}</g></g>
  <text x="${W / 2}" y="${H - 26}" text-anchor="middle" font-family="${BODY}" font-size="12.5"
        letter-spacing="1.2" fill="${C.creamDim}">${e.caption}</text>
</svg>`
}

fs.mkdirSync(OUT_DIR, { recursive: true })
for (const [slug, e] of Object.entries(ENGRAVINGS)) {
  fs.writeFileSync(path.join(OUT_DIR, `${slug}.svg`), render(slug, e))
  console.log(`✓ ${slug}.svg`)
}
