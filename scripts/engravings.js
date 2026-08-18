/**
 * Hand-traced line engravings for the featured stories that have a usable
 * pictorial reference (storefront, vehicle, interior, object or period ad).
 * Each drawing is traced from the story's own image in public/images/ — an
 * engraving cannot be derived from data.
 *
 * Every drawing lives on the same 420 × 244 canvas as the E. Braun storefront
 * in generate-premium-plaques.js, gold line on navy, so engravingPanel() can
 * scale any of them interchangeably.
 *
 * Stories with no traceable reference get NO entry here (and therefore no
 * medium/detailed tier): 8 (photo shows a Nazi propaganda exhibit, not the
 * business), 11 (costume-party poster), 15 (magazine spread), 16 (no image).
 *
 * API: ENGRAVINGS[slug] = { storyId, caption, draw(ctx) }
 *   ctx = { gold, navyDeep, display }  — colors + display font family.
 * Every draw() returns a <g> string; patterns glassHatch/grain are expected in
 * the host <defs> (both generators define them).
 */

// tiny helpers shared by the drawings ---------------------------------------
const L = (x1, y1, x2, y2, w = 1, o = 1) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${w}"${o < 1 ? ` opacity="${o}"` : ''}/>`
const R = (x, y, w, h, sw = 1, o = 1, fill = 'none') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" stroke-width="${sw}"${o < 1 ? ` opacity="${o}"` : ''}${fill !== 'none' ? ` fill="${fill}"` : ''}/>`
const P = (d, w = 1, o = 1) =>
  `<path d="${d}" stroke-width="${w}"${o < 1 ? ` opacity="${o}"` : ''}/>`
const DOT = (cx, cy, r, fill) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="none"/>`
const CIRC = (cx, cy, r, w = 1, o = 1) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" stroke-width="${w}"${o < 1 ? ` opacity="${o}"` : ''}/>`
// Text inside an engraving. The enclosing <g> carries fill="none" for the line
// work, so every <text> must set its own fill — CUR is the active gold, set by
// open(). `&` in sign lettering must be escaped or the SVG will not parse.
let CUR = '#d9a441'
const TXT = (x, y, size, fam, text, ls = 1, anchor = 'middle', style = '') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${fam}" font-weight="700"
     font-size="${size}" letter-spacing="${ls}" fill="${CUR}" stroke="none"${style}>${text.replace(
       /&/g,
       '&amp;'
     )}</text>`

const open = (g) => {
  CUR = g
  return `<g fill="none" stroke="${g}" stroke-width="1.2" stroke-linecap="square">`
}
const ground = (g) => L(2, 236, 418, 236, 1.6) + L(10, 241, 410, 241, 0.7, 0.6)

// wheel with spokes, used by both trucks
function wheel(cx, cy, r) {
  let s = CIRC(cx, cy, r, 1.4) + CIRC(cx, cy, r - 4, 0.8, 0.8) + CIRC(cx, cy, 2.5, 1)
  for (let a = 0; a < 360; a += 36) {
    const rad = (a * Math.PI) / 180
    s += L(
      cx + 2.5 * Math.cos(rad),
      cy + 2.5 * Math.sin(rad),
      cx + (r - 4.5) * Math.cos(rad),
      cy + (r - 4.5) * Math.sin(rad),
      0.7,
      0.85
    )
  }
  return s
}

const ENGRAVINGS = {
  // 2 — Antiquariat Martin Breslauer: the book-lined library salon
  breslauer: {
    storyId: '2',
    caption: 'Bibliothek des Antiquariats · um 1925',
    draw({ gold, navyDeep, display }) {
      let s = open(gold)
      s += ground(gold)
      // rear wall of bookcases: three arched bays
      const bays = [
        [16, 148],
        [156, 264],
        [272, 404],
      ]
      for (const [x0, x1] of bays) {
        const w = x1 - x0
        s += R(x0, 22, w, 208, 1.2)
        s += P(`M${x0 + 4},40 Q${x0 + w / 2},18 ${x1 - 4},40`, 1)
        // shelf rows
        for (let y = 52; y <= 200; y += 26) {
          s += L(x0 + 4, y, x1 - 4, y, 0.9)
          // book spines: irregular verticals
          for (let x = x0 + 8; x < x1 - 6; x += 6) {
            const h = 16 + ((x * 7) % 6)
            s += L(x, y - 2, x, y - h, 0.55, 0.7)
          }
        }
        s += R(x0 + 4, 206, w - 8, 18, 0.7, 0.75) // cupboard base
      }
      // pilasters between bays
      s += R(148, 22, 8, 208, 1)
      s += R(264, 22, 8, 208, 1)
      s += L(151, 30, 151, 224, 0.5, 0.6)
      s += L(261 + 6, 30, 267, 224, 0.5, 0.6)
      // cornice
      s += L(10, 18, 410, 18, 1.4)
      // chandelier
      s += L(210, 0, 210, 26, 0.8)
      s += P('M196,38 Q210,50 224,38', 1)
      s += P('M199,30 q-6,6 -3,12 M221,30 q6,6 3,12', 0.8)
      s += DOT(196, 40, 1.6, gold) + DOT(224, 40, 1.6, gold) + DOT(210, 52, 1.8, gold)
      // library ladder against right bay
      s += L(330, 230, 356, 60, 1.1) + L(346, 230, 372, 60, 1.1)
      for (let t = 0; t < 9; t++)
        s += L(333 + t * 2.85, 211 - t * 18.9, 349 + t * 2.85, 211 - t * 18.9, 0.8)
      // reading table with open folio
      s += R(60, 176, 92, 8, 1.1)
      s += L(66, 184, 66, 228, 1) + L(146, 184, 146, 228, 1)
      s += L(66, 214, 146, 214, 0.6, 0.6)
      s += P('M84,176 q11,-7 22,0 q11,-7 22,0 l0,-3 q-11,-6 -22,0 q-11,-6 -22,0 z', 0.8)
      s += `</g>`
      return s
    },
  },

  // 3 — Deutsches Theater: auditorium toward the balconies
  dtheater: {
    storyId: '3',
    caption: 'Zuschauerraum des Deutschen Theaters',
    draw({ gold, navyDeep, display }) {
      let s = open(gold)
      // ceiling arc + chandelier
      s += P('M14,52 Q210,-14 406,52', 1.6)
      s += L(210, 12, 210, 24, 0.9)
      s += P('M188,38 Q210,58 232,38', 1.2)
      s += P('M192,28 q-8,8 -4,14 M228,28 q8,8 4,14', 0.8)
      for (const dx of [-16, -8, 0, 8, 16]) s += DOT(210 + dx, 44 - Math.abs(dx) * 0.35, 1.4, gold)
      // two balcony rings
      for (const [y, sag, h] of [
        [86, 26, 16],
        [136, 20, 14],
      ]) {
        s += P(`M20,${y} Q210,${y + sag} 400,${y}`, 1.4)
        s += P(`M20,${y + h} Q210,${y + sag + h} 400,${y + h}`, 1)
        // railing balusters
        for (let x = 32; x <= 392; x += 12) {
          const t = (x - 20) / 380
          const yy = y + sag * 4 * t * (1 - t)
          s += L(x, yy + 1, x, yy + h - 1, 0.6, 0.8)
        }
      }
      // side boxes / columns
      for (const x of [20, 400]) {
        s += L(x, 52, x, 210, 1.4)
        s += L(x < 210 ? x + 10 : x - 10, 60, x < 210 ? x + 10 : x - 10, 206, 0.8, 0.7)
      }
      // proscenium opening (rear of view: stalls + stage front)
      // stalls: rows of seat arcs
      for (let row = 0; row < 6; row++) {
        const y = 168 + row * 12
        const inset = 46 - row * 5
        s += P(`M${40 + inset},${y} Q210,${y + 10} ${380 - inset},${y}`, 0.7, 0.75)
        for (let x = 56 + inset; x < 372 - inset; x += 14) {
          const t = (x - (40 + inset)) / (340 - 2 * inset)
          s += P(`M${x},${y + 10 * 4 * t * (1 - t) * 0.9} v6`, 0.5, 0.55)
        }
      }
      // orchestra rail + stage edge
      s += P('M60,232 Q210,240 360,232', 1.2)
      s += L(2, 236, 418, 236, 1.6)
      s += `</g>`
      return s
    },
  },

  // 4 — Ebro Upholstery: the patented horsehair seat cross-section
  ebro: {
    storyId: '4',
    caption: 'Polsteraufbau mit Rosshaar-Pikierung · Werkzeichnung',
    draw({ gold, navyDeep, display }) {
      let s = open(gold)
      s += ground(gold)
      // seat body outline (sweeping wedge, thick at right)
      s += P('M52,150 Q60,96 150,78 Q300,50 366,64 L370,150 Q220,166 52,150 Z', 1.5)
      // top stitched roll
      s += P('M52,150 Q60,104 150,86 Q296,60 362,72', 1)
      // horsehair picking: short tufts along the crown
      for (let i = 0; i < 26; i++) {
        const t = i / 25
        const x = 60 + t * 296
        const y = 96 - 30 * Math.sin(Math.PI * (0.15 + 0.7 * t))
        s += P(`M${x},${y + 14} l2,-6 m-2,6 l-2,-6 m2,6 l0,-7`, 0.5, 0.6)
      }
      // diamond lattice, clipped to the seat body in code — a real clipPath
      // does not survive the Inkscape flatten in the LightBurn pipeline.
      const poly = [
        [52, 150],
        [56, 112],
        [78, 92],
        [150, 78],
        [240, 60],
        [330, 53],
        [366, 64],
        [370, 150],
        [300, 160],
        [220, 163],
        [120, 158],
      ]
      const inside = (x, y) => {
        let odd = false
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const [xi, yi] = poly[i],
            [xj, yj] = poly[j]
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) odd = !odd
        }
        return odd
      }
      const clippedLine = (x0, y0, x1, y1) => {
        const N = 64
        let run = null
        let out = ''
        for (let i = 0; i <= N; i++) {
          const t = i / N
          const x = x0 + (x1 - x0) * t,
            y = y0 + (y1 - y0) * t
          if (inside(x, y)) {
            if (!run) run = [x, y]
          } else if (run) {
            out += L(run[0].toFixed(1), run[1].toFixed(1), x.toFixed(1), y.toFixed(1), 0.55, 0.5)
            run = null
          }
        }
        if (run) out += L(run[0].toFixed(1), run[1].toFixed(1), x1, y1, 0.55, 0.5)
        return out
      }
      for (let k = -6; k < 16; k++) {
        s += clippedLine(52 + k * 26, 160, 52 + k * 26 + 90, 66)
        s += clippedLine(52 + k * 26, 66, 52 + k * 26 + 90, 160)
      }
      // spring band underneath
      s += L(56, 168, 368, 160, 1)
      for (let x = 70; x <= 350; x += 40) {
        s += P(`M${x},170 q10,4 20,0 q-10,10 -20,6 q10,4 20,0`, 0.9, 0.85)
      }
      s += L(56, 190, 368, 184, 1)
      // frame legs
      s += R(84, 190, 16, 42, 1.2)
      s += R(320, 184, 16, 48, 1.2)
      s += L(88, 196, 88, 228, 0.5, 0.6)
      s += L(324, 190, 324, 228, 0.5, 0.6)
      s += `</g>`
      return s
    },
  },

  // 5 — Höxter grain wholesalers: the Börse seen over the Friedrichsbrücke
  hoexter: {
    storyId: '5',
    caption: 'Börse und Friedrichsbrücke · Postkarte um 1910',
    draw({ gold, navyDeep, display }) {
      let s = open(gold)
      // building block
      s += R(46, 34, 330, 92, 1.4)
      s += L(46, 52, 376, 52, 1) // attic line
      // roof balustrade + statues (simplified finials)
      s += L(40, 34, 382, 34, 1.2)
      for (let x = 56; x <= 368; x += 26) s += P(`M${x},34 l0,-7 m-2.5,0 l5,0`, 0.8, 0.85)
      // colonnade: tall pilaster rhythm
      for (let x = 58; x <= 364; x += 17) s += L(x, 58, x, 118, 0.7, 0.8)
      // central portico
      s += R(178, 46, 66, 80, 1.2)
      s += P('M178,46 L211,28 L244,46', 1.2)
      for (let x = 184; x <= 238; x += 9) s += L(x, 54, x, 118, 0.9)
      // window band hint on flanks
      for (const x0 of [58, 254]) {
        for (let x = x0; x < x0 + 102; x += 17) s += R(x + 3, 96, 9, 16, 0.55, 0.6)
      }
      // bridge: parapet + two arches over the Spree
      s += L(10, 152, 410, 146, 1.4) // parapet top
      s += L(10, 168, 410, 164, 1.2) // deck line
      for (let x = 20; x <= 400; x += 12) s += L(x, 153 - (x / 410) * 1.4 + 1, x, 165, 0.55, 0.7)
      s += P('M40,214 Q118,168 196,214', 1.4)
      s += P('M224,212 Q302,166 380,212', 1.4)
      s += P('M46,214 Q118,174 190,214', 0.7, 0.7)
      s += P('M230,212 Q302,172 374,212', 0.7, 0.7)
      // spandrels: tie the arches back to the deck
      s += L(40, 168, 40, 214, 1.2) + L(380, 166, 380, 212, 1.2)
      s += L(2, 214, 418, 212, 1)
      // bridge piers + obelisk lamps
      s += R(196, 172, 28, 42, 1.1)
      s += R(8, 140, 14, 30, 1.1) + R(398, 136, 14, 30, 1.1)
      s += P('M15,140 l0,-16 m-4,2 l8,0', 1) + P('M405,136 l0,-16 m-4,2 l8,0', 1)
      // water
      for (let y = 222; y <= 234; y += 6)
        s += P(`M14,${y} q30,4 60,0 t60,0 t60,0 t60,0 t60,0 t60,0`, 0.6, 0.5)
      s += L(2, 236, 418, 236, 1.6)
      s += `</g>`
      return s
    },
  },

  // 6 — Fröhlich & Pelz: porcelain cockatoo from the range
  pelz: {
    storyId: '6',
    caption: 'Porzellan-Kakadu aus dem Sortiment',
    draw({ gold, navyDeep, display }) {
      let s = open(gold)
      s += ground(gold)
      // display shelf
      s += L(96, 216, 324, 216, 1.4)
      s += R(150, 216, 120, 10, 1)
      // crest feathers
      s += P('M208,64 Q198,28 214,12 Q216,32 222,40', 1.2)
      s += P('M216,66 Q216,24 236,8 Q232,34 236,44', 1.2)
      s += P('M224,70 Q234,30 258,20 Q246,44 246,54', 1.2)
      s += P('M228,76 Q248,44 272,40 Q256,60 252,68', 1.2)
      // feather veins
      s += P('M210,50 q4,-10 8,-16 M222,52 q4,-12 10,-20 M232,58 q8,-12 16,-18', 0.6, 0.7)
      // head + eye patch
      s += P('M206,68 Q188,78 184,96 Q182,112 194,120', 1.4)
      s += CIRC(206, 96, 13, 1.1)
      s += DOT(203, 93, 2.4, gold)
      // beak
      s += P('M192,112 Q178,116 176,130 Q188,138 198,130 Q200,122 195,117', 1.2)
      s += P('M181,130 q7,7 15,4', 0.9)
      // neck ruff + body
      s += P('M226,78 Q246,96 250,124 Q254,162 236,192 Q220,210 200,208', 1.4)
      s += P('M194,120 Q188,140 190,164 Q192,190 200,208', 1.4)
      // wing feather scallops
      for (let row = 0; row < 4; row++) {
        const y = 128 + row * 20
        s += P(`M${198 + row * 4},${y} q10,10 24,8 q12,-2 18,-10`, 0.7, 0.75)
      }
      // feet + perch
      s += P('M206,208 q-4,8 -12,8 M222,206 q2,10 -6,12', 1)
      s += L(180, 218, 246, 218, 1.2)
      // companion crystal goblet on shelf (nod to Glas · Kristall)
      s += P('M290,166 L314,166 Q313,184 305,189 L305,208 L299,208 L299,189 Q291,184 290,166 Z', 1)
      s += P('M294,171 L310,171', 0.6, 0.7)
      s += L(292, 210, 312, 210, 1)
      s += `</g>`
      return s
    },
  },

  // 7 — Theaterkunst: the lettered delivery van
  theaterkunst: {
    storyId: '7',
    caption: 'Lieferwagen der Theaterkunst · um 1930',
    draw({ gold, navyDeep, display }) {
      let s = open(gold)
      s += ground(gold)
      // box body
      s += R(52, 74, 216, 118, 1.5)
      s += R(58, 80, 204, 106, 0.7, 0.7)
      // lettering on the box
      s += TXT(160, 112, 17, display, '„THEATERKUNST“', 1.2)
      s += TXT(160, 132, 9.5, display, 'HERMANN J. KAUFMANN', 1)
      s += L(96, 140, 224, 140, 0.8, 0.8)
      s += TXT(160, 156, 7.5, display, 'KOSTÜME UND REQUISITEN', 0.8)
      s += TXT(160, 168, 7.5, display, 'FÜR THEATER UND FILM', 0.8)
      // cab
      s += P(
        'M268,192 L268,96 Q268,88 276,88 L316,88 L316,116 L344,124 Q354,128 356,140 L358,192',
        1.5
      )
      s += R(276, 94, 34, 26, 1) // cab window
      s += L(316, 116, 316, 192, 1)
      // bonnet + radiator
      s += R(344, 138, 20, 30, 1.2)
      s += L(348, 142, 348, 164, 0.6, 0.7)
      s += L(352, 142, 352, 164, 0.6, 0.7)
      s += L(356, 142, 356, 164, 0.6, 0.7)
      // headlamp
      s += CIRC(368, 146, 6, 1) + DOT(368, 146, 1.6, gold)
      // running board + chassis
      s += L(44, 192, 372, 192, 1.3)
      s += L(260, 200, 340, 200, 1, 0.8)
      // wheels
      s += wheel(104, 210, 24)
      s += wheel(330, 210, 24)
      // mudguards
      s += P('M76,206 Q104,178 132,206', 1.2)
      s += P('M302,206 Q330,178 358,206', 1.2)
      s += `</g>`
      return s
    },
  },

  // 9 — Jonass & Co: the new Kaufhaus at Lothringer Straße
  jonass: {
    storyId: '9',
    caption: 'Jonass-Kaufhaus, Lothringer Straße 1 · 1928',
    draw({ gold, navyDeep, display }) {
      let s = open(gold)
      s += ground(gold)
      // main block with rounded corner (perspective flattened, as in the ad)
      s += P('M30,60 L296,60 Q352,60 388,84 L388,232 L30,232 Z', 1.5)
      // roofline sign
      s += R(96, 34, 150, 26, 1.2)
      s += TXT(171, 52, 13, display, 'JONASS & CO.', 1.5)
      s += L(96, 60, 96, 34, 1) // sign posts already via rect
      // flag on the corner
      s += L(368, 76, 368, 36, 1)
      s += P('M368,38 l26,5 l-26,7 z', 1)
      // horizontal window bands (six floors)
      for (let f = 0; f < 6; f++) {
        const y = 74 + f * 26
        s += P(`M38,${y} L296,${y} Q344,${y} 380,${y + (16 * 0.9 * (84 - 60)) / 84}`, 0.9, 0.9)
        // band of window mullions
        for (let x = 44; x <= 372; x += 12) {
          const yy = x < 296 ? y : y + (x - 296) * 0.27
          s += L(x, yy + 4, x, yy + 16, 0.55, 0.65)
        }
        s += P(`M38,${y + 18} L296,${y + 18} Q344,${y + 18} 380,${y + 18 + 6}`, 0.7, 0.7)
      }
      // ground floor: arcade of display windows + entrance
      s += L(30, 196, 388, 196, 1.2)
      for (let x = 40; x <= 370; x += 44) s += R(x, 202, 34, 26, 0.9, 0.85)
      s += R(172, 200, 44, 32, 1.2)
      s += L(194, 200, 194, 232, 0.9)
      s += DOT(190, 218, 1.4, gold) + DOT(198, 218, 1.4, gold)
      s += `</g>`
      return s
    },
  },

  // 10 — Karl Kutschera: the Zigeunerkeller entrance
  kutschera: {
    storyId: '10',
    caption: 'Eingang zum Zigeunerkeller · um 1935',
    draw({ gold, navyDeep, display }) {
      let s = open(gold)
      s += ground(gold)
      // facade slab
      s += R(60, 8, 300, 228, 1.4)
      // upper storey: ornate window with flower boxes
      s += R(150, 22, 120, 64, 1.2)
      s += R(158, 28, 46, 52, 0.9)
      s += R(216, 28, 46, 52, 0.9)
      s += L(181, 28, 181, 80, 0.6, 0.7)
      s += L(239, 28, 239, 80, 0.6, 0.7)
      // window boxes
      s += R(150, 86, 120, 8, 0.9)
      for (let x = 156; x < 268; x += 10) s += P(`M${x},86 q3,-7 6,0`, 0.6, 0.75)
      // ornament field around window (dot diaper, like the tiled facade)
      for (let y = 26; y <= 80; y += 14)
        for (const x of [82, 104, 126, 296, 318, 340])
          s += DOT(x, y + ((x / 22) % 2) * 7, 1.1, gold)
      // sign band with script lettering
      s += R(66, 108, 288, 44, 1.2)
      s += `<text x="210" y="138" text-anchor="middle" font-family="${display}" font-weight="700"
        font-size="26" font-style="italic" letter-spacing="2" fill="${gold}" stroke="none">Zigeuner Keller</text>`
      // flanking lantern
      s += L(76, 158, 76, 172, 0.9)
      s += R(70, 172, 12, 16, 1)
      s += P('M70,188 l6,6 l6,-6', 0.9)
      // entrance: recessed door + side windows
      s += R(174, 162, 72, 74, 1.3)
      s += L(210, 162, 210, 236, 0.9)
      s += R(180, 168, 26, 40, 0.7, 0.8)
      s += R(214, 168, 26, 40, 0.7, 0.8)
      s += DOT(204, 202, 1.5, gold) + DOT(216, 202, 1.5, gold)
      // menu display case + small window right
      s += R(96, 166, 52, 56, 1)
      s += R(101, 171, 42, 46, 0.6, 0.7)
      s += R(272, 166, 52, 56, 1, 1, 'url(#glassHatch)')
      // step
      s += L(168, 236, 252, 236, 1.4)
      s += `</g>`
      return s
    },
  },

  // 12 — Ruilos: the Handelsregister advertisement, sun and herald
  ruilos: {
    storyId: '12',
    caption: 'Zeitungsannonce · „Gleich der Sonne wirkt Ruilos“',
    draw({ gold, navyDeep, display }) {
      let s = open(gold)
      // ad frame
      s += R(40, 16, 340, 212, 1.5)
      s += R(46, 22, 328, 200, 0.7, 0.7)
      // radiant sun, left — the ad's central device
      const sx = 132,
        sy = 104
      s += CIRC(sx, sy, 40, 1.4)
      s += CIRC(sx, sy, 34, 0.7, 0.7)
      for (let a = 0; a < 360; a += 15) {
        const rad = (a * Math.PI) / 180
        const r1 = 45,
          r2 = a % 30 === 0 ? 72 : 58
        s += L(
          sx + r1 * Math.cos(rad),
          sy + r1 * Math.sin(rad),
          sx + r2 * Math.cos(rad),
          sy + r2 * Math.sin(rad),
          0.9,
          0.85
        )
      }
      s += TXT(sx, sy - 10, 10, display, 'DIE SONNE', 0.8)
      s += TXT(sx, sy + 6, 9, display, 'DAS BESTE', 0.8)
      s += TXT(sx, sy + 20, 9, display, 'MEDIKAMENT', 0.5)
      // copy block right
      s += TXT(292, 62, 16, display, 'GLEICH DER', 1)
      s += TXT(292, 86, 16, display, 'SONNE WIRKT', 1)
      s += TXT(292, 128, 30, display, 'RUILOS', 2.5)
      s += L(228, 140, 356, 140, 1)
      s += TXT(292, 162, 11.5, display, 'NATURELLES', 1.2)
      s += TXT(210, 200, 14, display, 'HAUSMITTEL-HEILVERFAHREN', 1)
      s += `</g>`
      return s
    },
  },

  // 13 — Wassermann: the goose butcher's shopfront, wares in the window
  wassermann: {
    storyId: '13',
    caption: 'Ladenfront der Gänse-Ausschlachterei',
    draw({ gold, navyDeep, display }) {
      let s = open(gold)
      s += ground(gold)
      // facade
      s += R(40, 8, 340, 228, 1.4)
      // fascia with lettering
      s += R(46, 20, 328, 34, 1.2)
      s += TXT(210, 43, 15.5, display, 'GÄNSE-AUSSCHLACHTEREI', 1.4)
      // pair of globe lamps
      for (const lx of [70, 350]) {
        s += L(lx, 54, lx, 66, 0.9)
        s += CIRC(lx, 73, 7, 1)
        s += DOT(lx, 73, 1.6, gold)
      }
      // hanging rail with geese across the front
      s += L(58, 92, 362, 92, 1.3)
      for (let x = 70; x <= 350; x += 20) {
        s += L(x, 92, x, 100, 0.7, 0.8)
        // goose: plump teardrop body, small head hook
        s += P(`M${x},100 q-6,4 -6,14 q0,12 6,16 q6,-4 6,-16 q0,-10 -6,-14`, 0.9)
        s += P(`M${x},130 q-1,5 -3,7`, 0.6, 0.8)
        s += P(`M${x - 3},104 q-3,-2 -2,-5`, 0.55, 0.7)
      }
      // big display window with trays
      s += R(88, 146, 244, 72, 1.3)
      s += R(94, 152, 232, 60, 0.7, 0.75)
      // trays of goods
      s += P('M104,196 q26,-10 52,0 q-26,8 -52,0', 0.8)
      s += P('M168,198 q22,-8 44,0 q-22,8 -44,0', 0.8)
      s += P('M224,196 q26,-10 52,0 q-26,8 -52,0', 0.8)
      for (const [cx, cy] of [
        [130, 192],
        [190, 194],
        [250, 192],
      ])
        for (let i = -2; i <= 2; i++) s += DOT(cx + i * 8, cy, 1.2, gold)
      s += L(88, 218, 332, 218, 1)
      // side door
      s += R(48, 146, 34, 90, 1.1)
      s += L(65, 146, 65, 236, 0.6, 0.6)
      s += DOT(60, 192, 1.4, gold)
      // price board left of window
      s += R(340, 150, 26, 60, 1)
      for (let y = 158; y <= 200; y += 8) s += L(344, y, 362, y, 0.55, 0.6)
      s += `</g>`
      return s
    },
  },

  // 14 — Weinberger butter wholesalers: the canvas-topped lorry
  weinberger: {
    storyId: '14',
    caption: 'Lieferwagen der Gebr. Weinberger',
    draw({ gold, navyDeep, display }) {
      let s = open(gold)
      s += ground(gold)
      // canvas canopy (slightly sagging top)
      s += P('M44,60 Q150,48 262,58 L262,150 L44,150 Z', 1.5)
      s += P('M52,66 Q150,56 254,64', 0.7, 0.7)
      // canvas seams
      for (let x = 76; x <= 236; x += 32)
        s += P(`M${x},${62 - (x - 44) * 0.01} L${x},150`, 0.6, 0.55)
      // lettering on the canvas
      s += TXT(153, 92, 12.5, display, 'GEBR. WEINBERGER', 1.2)
      s += TXT(153, 110, 11, display, 'BUTTER-GROSSHANDLUNG', 1)
      s += L(96, 120, 210, 120, 0.8, 0.8)
      // side board with product panel
      s += R(44, 150, 218, 34, 1.3)
      s += R(50, 154, 76, 26, 1)
      s += TXT(88, 171, 9.5, display, "ASIW'S BUTTER", 0.8)
      s += R(196, 154, 60, 26, 1)
      s += TXT(226, 165, 7, display, "ASIW'S BUTTER", 0.6)
      s += TXT(226, 175, 6.5, display, 'DIE BESTE', 0.6)
      // open cab: flat roof on posts, windscreen, low bonnet
      s += L(262, 96, 330, 96, 1.3) // cab roof
      s += L(268, 96, 268, 122, 0.9) + L(324, 96, 324, 140, 0.9) // posts
      s += R(300, 104, 22, 36, 1.2) // windscreen
      s += L(311, 104, 311, 140, 0.6, 0.7)
      s += P('M262,122 Q290,118 300,122', 0.9, 0.8) // cowl line
      s += L(262, 140, 330, 140, 1) // cab floor line
      // bonnet + radiator
      s += P('M330,140 L330,184 M330,148 L362,148 L362,184', 1.3)
      s += R(362, 146, 10, 38, 1.3) // radiator shell
      s += L(365, 152, 365, 178, 0.6, 0.7) + L(369, 152, 369, 178, 0.6, 0.7)
      s += CIRC(380, 156, 5.5, 1) + DOT(380, 156, 1.4, gold)
      // chassis
      s += L(36, 184, 384, 184, 1.3)
      // solid wheels (period lorry: heavy spoked)
      s += wheel(96, 208, 26)
      s += wheel(322, 208, 26)
      s += P('M66,204 Q96,174 126,204', 1.1)
      s += P('M292,204 Q322,174 352,204', 1.1)
      s += `</g>`
      return s
    },
  },
}

module.exports = { ENGRAVINGS }
