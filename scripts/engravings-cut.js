/**
 * Fill-geometry versions of the story engravings, for laser cutting.
 *
 * The web engravings (engravings.js) are stroke line-art. Outlining strokes and
 * filling them engraves every line as a thin trench, and dense passages (window
 * rows, hatching) merge into mud on the plate — see the first physical Jonass
 * test cut. A laser wants the opposite construction: LAYERED FILLS.
 *
 * Each drawing here is an ordered list of CLOSED polygons on the same 420 × 244
 * canvas as the web art, rendered as ONE path with fill-rule="evenodd".
 * Containment depth sets the tone:
 *
 *   depth 1  solid mass        → engraved (dark on the positive)
 *   depth 2  opening inside it → un-engraved (light)
 *   depth 3  detail inside the opening → engraved again (dark)
 *
 * Two authoring rules keep evenodd honest:
 *   - polygons at the SAME depth must never overlap (overlap flips to a hole);
 *     adjacent/shared edges are fine
 *   - every feature must survive the cut: at the 300×200 layout's scale
 *     (116/420 ≈ 0.276 mm per unit) a bar must be ≥ 1.2 units ≈ 0.33 mm
 *
 * Sign lettering is NOT geometry here — each drawing exports `texts`, which the
 * generator places as real <text> in plate-mm coordinates so Inkscape outlines
 * them at full size (no group-scale letter-spacing trap). Because the final
 * path is evenodd, text landing inside an opening flips to engraved, which is
 * exactly what a lettered sign panel needs.
 *
 * API: CUT[slug].build() → { polys: [[x,y],...][], texts: [{s,x,y,size,weight,
 * ls,anchor,font}] } — local units; the generator transforms both.
 * CUT covers E. Braun too ('e-braun'), replacing its stroke art in the cut.
 */

// ---------------------------------------------------------------- helpers
const R = (x, y, w, h) => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
]

/** circle as polygon */
function circle(cx, cy, r, n = 28) {
  const pts = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return pts
}

/** sample a quadratic bezier */
function quad(p0, p1, p2, n = 16) {
  const pts = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const u = 1 - t
    pts.push([
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ])
  }
  return pts
}

/** closed band between two sampled curves (top runs L→R, bottom is reversed) */
const strip = (top, bottom) => [...top, ...bottom.slice().reverse()]

/** thin filled quad along a segment — the fill-world replacement for a line */
function seg(x0, y0, x1, y1, t) {
  const dx = x1 - x0,
    dy = y1 - y0
  const len = Math.hypot(dx, dy) || 1
  const nx = (-dy / len) * (t / 2),
    ny = (dx / len) * (t / 2)
  return [
    [x0 + nx, y0 + ny],
    [x1 + nx, y1 + ny],
    [x1 - nx, y1 - ny],
    [x0 - nx, y0 - ny],
  ]
}

const T = (s, x, y, size, o = {}) => ({ s, x, y, size, ...o })

// ---------------------------------------------------------------- drawings
const CUT = {}

// ---- E. Braun & Co. — Unter den Linden 2 facade
CUT['e-braun'] = {
  build() {
    const polys = []
    // balustrade: two rails + balusters (all depth-1, adjacent not overlapping)
    polys.push(R(8, 8, 404, 3), R(8, 24, 404, 3))
    for (let x = 16; x <= 402; x += 12) polys.push(R(x, 11, 2.2, 13))
    // facade mass
    polys.push(R(12, 34, 396, 202))
    // sign band opening + panel dividers + (text via layer)
    polys.push(R(18, 40, 384, 28))
    polys.push(R(126, 40, 3, 28), R(291, 40, 3, 28))
    // transom opening with ticks
    polys.push(R(24, 78, 372, 14))
    for (let x = 46; x < 396; x += 24) polys.push(R(x, 80, 1.6, 10))
    // window bays: openings with a centre mullion, sill stays dark
    for (const [x0, w] of [
      [24, 72],
      [100, 72],
      [248, 72],
      [324, 72],
    ]) {
      polys.push(R(x0, 98, w, 112))
      polys.push(R(x0 + w / 2 - 1.1, 98, 2.2, 112))
    }
    // entrance: opening, dark transom panel, dark door leaves
    polys.push(R(176, 98, 68, 134))
    polys.push(R(180, 100, 60, 20))
    polys.push(R(183, 126, 26, 100), R(211, 126, 26, 100))
    // door gap glazing: light slots inside the leaves
    polys.push(R(187, 132, 18, 38), R(215, 132, 18, 38))
    polys.push(R(187, 176, 18, 42), R(215, 176, 18, 42))
    // pavement
    polys.push(R(2, 236, 416, 2), R(10, 241, 400, 1.2))
    const texts = [
      T('WÄSCHEHAUS', 70, 58.5, 11, { ls: 1.5 }),
      T('E. BRAUN & Cº', 209, 60, 15, { ls: 1.2 }),
      T('WIEN · BERLIN · PARIS', 346, 58, 8.2, { ls: 0.8 }),
    ]
    return { polys, texts }
  },
}

// ---- Jonass & Co. — the 1928 Kaufhaus (the physical test-cut subject)
CUT.jonass = {
  build() {
    const polys = []
    // roof sign: dark frame, light panel, lettering via text layer
    polys.push(R(96, 30, 150, 30))
    polys.push(R(100, 34, 142, 22))
    // flag
    polys.push(R(366, 40, 2.4, 36))
    polys.push([
      [368.4, 40],
      [392, 45],
      [368.4, 52],
    ])
    // building mass with rounded corner
    const outline = [
      [30, 60],
      [296, 60],
      ...quad([296, 60], [352, 60], [388, 84], 12),
      [388, 232],
      [30, 232],
    ]
    polys.push(outline)
    // six window bands: light strips with chunky dark mullions
    for (let f = 0; f < 6; f++) {
      const y = 74 + f * 26
      polys.push(R(38, y, 336, 17))
      for (let x = 44; x <= 368; x += 12) polys.push(R(x, y + 2.5, 2.4, 12))
    }
    // ground floor: light display openings + entrance with dark leaves
    for (const x of [40, 84, 128, 220, 264, 308]) polys.push(R(x, 202, 36, 26))
    polys.push(R(170, 200, 46, 32))
    polys.push(R(174, 204, 18, 28), R(194, 204, 18, 28))
    return {
      polys,
      texts: [T('JONASS & CO.', 171, 50, 13, { ls: 1.5 })],
    }
  },
}

// ---- Martin Breslauer — the book-lined library
CUT.breslauer = {
  build() {
    const polys = []
    polys.push(R(16, 16, 392, 216)) // wall mass
    const bays = [
      [24, 124],
      [160, 100],
      [276, 124],
    ]
    for (const [x0, w] of bays) {
      const x1 = x0 + w
      // arched opening
      polys.push([
        [x0, 226],
        [x0, 46],
        ...quad([x0, 46], [x0 + w / 2, 24], [x1, 46], 12),
        [x1, 226],
      ])
      // shelves (dark bars) + book spines (dark ticks above each shelf)
      for (let y = 58; y <= 202; y += 26) {
        polys.push(R(x0 + 3, y, w - 6, 2.4))
        for (let x = x0 + 6; x < x1 - 7; x += 7.2) {
          const h = 14 + ((Math.round(x) * 7) % 5)
          polys.push(R(x, y - h, 3.4, h))
        }
      }
      // cupboard base
      polys.push(R(x0 + 3, 208, w - 6, 18))
    }
    // ladder into the right bay
    const [lx0] = [340]
    polys.push(seg(lx0, 226, lx0 + 22, 64, 2.4))
    polys.push(seg(lx0 + 14, 226, lx0 + 36, 64, 2.4))
    for (let t = 0; t < 8; t++)
      polys.push(seg(lx0 + 2.5 + t * 2.6, 206 - t * 19.5, lx0 + 16.5 + t * 2.6, 206 - t * 19.5, 2))
    // reading table in the left bay
    polys.push(R(52, 178, 84, 4))
    polys.push(R(58, 182, 4, 44), R(126, 182, 4, 44))
    return { polys, texts: [] }
  },
}

// ---- Deutsches Theater — auditorium
CUT.dtheater = {
  build() {
    const polys = []
    polys.push(R(14, 10, 392, 226)) // hall mass
    // ceiling: light arched band with dark chandelier
    polys.push(
      strip(quad([22, 62], [210, 4], [398, 62], 24), quad([26, 66], [210, 30], [394, 66], 24))
    )
    polys.push(circle(210, 40, 9, 20))
    // two balcony bands: light strips, dark balusters
    for (const [y, sag, h] of [
      [84, 26, 17],
      [134, 20, 15],
    ]) {
      const top = quad([22, y], [210, y + sag], [398, y], 26)
      const bot = quad([22, y + h], [210, y + sag + h], [398, y + h], 26)
      polys.push(strip(top, bot))
      for (let x = 32; x <= 388; x += 12) {
        const t = (x - 22) / 376
        const yy = y + sag * 4 * t * (1 - t)
        polys.push(R(x, yy + 2.5, 2, h - 5))
      }
    }
    // stalls: light floor with dark seat rows
    polys.push([
      [64, 166],
      [356, 166],
      [382, 230],
      [38, 230],
    ])
    for (let row = 0; row < 5; row++) {
      const y = 176 + row * 11
      const inset = 40 - row * 6
      polys.push(
        strip(
          quad([64 + inset, y], [210, y + 8], [356 - inset, y], 20),
          quad([64 + inset, y + 2], [210, y + 10], [356 - inset, y + 2], 20)
        )
      )
    }
    // stage front
    polys.push(
      strip(
        quad([70, 230], [210, 238], [350, 230], 16),
        quad([70, 234], [210, 242], [350, 234], 16)
      )
    )
    return { polys, texts: [] }
  },
}

// ---- Ebro — upholstery cross-section
CUT.ebro = {
  build() {
    const polys = []
    const outline = [
      [52, 150],
      [58, 120],
      [70, 102],
      [90, 90],
      [150, 78],
      [240, 60],
      [320, 53],
      [366, 64],
      [370, 110],
      [370, 150],
      [300, 158],
      [220, 162],
      [120, 158],
    ]
    polys.push(outline) // seat mass
    // light lattice: thin bars clipped to the seat polygon
    const inside = (x, y) => {
      let odd = false
      for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
        const [xi, yi] = outline[i],
          [xj, yj] = outline[j]
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) odd = !odd
      }
      return odd
    }
    const margin = 4 // keep lattice clear of the outline so bars never cross it
    const clippedBar = (x0, y0, x1, y1) => {
      const N = 72
      let run = null
      for (let i = 0; i <= N; i++) {
        const t = i / N
        const x = x0 + (x1 - x0) * t,
          y = y0 + (y1 - y0) * t
        const ok =
          inside(x, y) &&
          inside(x - margin, y) &&
          inside(x + margin, y) &&
          inside(x, y - margin) &&
          inside(x, y + margin)
        if (ok && !run) run = [x, y]
        if (!ok && run) {
          if (Math.hypot(x - run[0], y - run[1]) > 6) polys.push(seg(run[0], run[1], x, y, 1.4))
          run = null
        }
      }
    }
    for (let k = -6; k < 16; k++) {
      clippedBar(52 + k * 26, 160, 52 + k * 26 + 90, 66)
      clippedBar(52 + k * 26, 66, 52 + k * 26 + 90, 160)
    }
    // spring band + legs + ground
    polys.push(R(56, 166, 312, 2.2))
    for (let x = 72; x <= 344; x += 24) polys.push(seg(x, 182, x + 12, 172, 2))
    polys.push(R(56, 186, 312, 2.2))
    polys.push(R(84, 190, 16, 42), R(320, 186, 16, 46))
    polys.push(R(2, 236, 416, 2), R(10, 241, 400, 1.2))
    return { polys, texts: [] }
  },
}

// ---- Höxter — Börse over the Friedrichsbrücke
CUT.hoexter = {
  build() {
    const polys = []
    polys.push(R(46, 34, 330, 92)) // building mass
    // attic: light band with dark finial ticks
    polys.push(R(52, 38, 318, 12))
    for (let x = 60; x <= 362; x += 26) polys.push(R(x, 40.5, 2.4, 7))
    // colonnade: light field with dark columns
    polys.push(R(52, 56, 318, 60))
    for (let x = 60; x <= 358; x += 17) polys.push(R(x, 58, 3.4, 56))
    // portico: pediment + denser columns
    polys.push([
      [176, 46],
      [211, 27],
      [246, 46],
    ])
    for (let x = 185; x <= 234; x += 9) polys.push(R(x, 58, 3.8, 56))
    // bridge deck with parapet ticks
    polys.push([
      [10, 146],
      [410, 141],
      [410, 165],
      [10, 170],
    ])
    for (let x = 20; x <= 400; x += 12) polys.push(R(x, 132, 2, 9))
    // spandrel band with light arch openings
    polys.push([
      [24, 170],
      [396, 165],
      [396, 214],
      [24, 216],
    ])
    polys.push(
      strip(quad([44, 213], [118, 172], [192, 213], 20), [
        [44, 214.2],
        [192, 214.2],
      ])
    )
    polys.push(
      strip(quad([228, 212], [302, 170], [376, 211], 20), [
        [228, 213],
        [376, 213],
      ])
    )
    // obelisk lamps
    polys.push(R(8, 140, 14, 30), R(398, 135, 14, 30))
    polys.push(R(13.5, 122, 3, 18), R(403.5, 117, 3, 18))
    // water
    for (let i = 0; i < 3; i++) {
      const y = 222 + i * 6
      polys.push(
        strip(
          quad([16, y], [210, y + 4], [404, y], 24),
          quad([16, y + 1.4], [210, y + 5.4], [404, y + 1.4], 24)
        )
      )
    }
    polys.push(R(2, 236, 416, 2))
    return { polys, texts: [] }
  },
}

// ---- Fröhlich & Pelz — porcelain cockatoo
CUT.pelz = {
  build() {
    const polys = []
    // crest blades
    polys.push([
      [206, 74],
      [200, 40],
      [212, 14],
      [216, 42],
      [214, 74],
    ])
    polys.push([
      [218, 74],
      [222, 34],
      [238, 10],
      [236, 44],
      [226, 76],
    ])
    polys.push([
      [228, 78],
      [242, 42],
      [260, 22],
      [250, 54],
      [234, 80],
    ])
    // head + body silhouette
    polys.push([
      [176, 130],
      [178, 114],
      [186, 102],
      [196, 90],
      [208, 80],
      [222, 78],
      [238, 90],
      [248, 110],
      [252, 136],
      [250, 164],
      [242, 188],
      [228, 206],
      [210, 214],
      [196, 208],
      [189, 194],
      [187, 168],
      [188, 146],
      [182, 138],
    ])
    // eye: light ring, dark pupil
    polys.push(circle(208, 98, 12, 24))
    polys.push(circle(206, 96, 3.6, 16))
    // beak mouth line + wing scallops as light slits
    polys.push(seg(178, 126, 194, 130, 1.6))
    for (let row = 0; row < 3; row++) {
      const y = 136 + row * 20
      polys.push(
        strip(
          quad([202 + row * 4, y], [220 + row * 3, y + 9], [238, y - 2], 12),
          quad([202 + row * 4, y + 1.5], [220 + row * 3, y + 10.5], [238, y - 0.5], 12)
        )
      )
    }
    // feet + perch
    polys.push(R(198, 214, 4, 6), R(216, 212, 4, 8))
    polys.push(R(178, 220, 68, 2.6))
    // crystal goblet: dark silhouette with a light band in the bowl
    polys.push([
      [288, 166],
      [316, 166],
      [314, 184],
      [306, 190],
      [306, 208],
      [312, 212],
      [292, 212],
      [298, 208],
      [298, 190],
      [290, 184],
    ])
    polys.push(R(293, 170, 18, 2.2))
    // shelf under both
    polys.push(R(96, 226, 228, 2.4))
    return { polys, texts: [] }
  },
}

// ---- Theaterkunst — the lettered van
CUT.theaterkunst = {
  build() {
    const polys = []
    // box body: dark frame, light panel, lettering via text layer
    polys.push(R(52, 74, 216, 118))
    polys.push(R(62, 84, 196, 98))
    polys.push(R(96, 138, 128, 1.8)) // rule between name and services
    // cab with window opening
    polys.push(R(268, 88, 48, 104))
    polys.push(R(274, 94, 36, 26))
    // bonnet with light radiator slot + dark fins
    polys.push(R(316, 138, 48, 54))
    polys.push(R(346, 144, 14, 42))
    for (const dx of [349.5, 353.5, 357.5]) polys.push(R(dx, 147, 2, 36))
    // headlamp on the plate
    polys.push(circle(374, 148, 6, 20))
    polys.push(circle(374, 148, 2.8, 14))
    // chassis + wheels (tire ring, light interior, dark hub)
    polys.push(R(44, 192, 330, 2.4))
    for (const cx of [104, 330]) {
      polys.push(circle(cx, 212, 24, 32))
      polys.push(circle(cx, 212, 16, 28))
      polys.push(circle(cx, 212, 5, 16))
    }
    polys.push(R(2, 236, 416, 2))
    return {
      polys,
      texts: [
        T('„THEATERKUNST“', 160, 112, 15, { ls: 1 }),
        T('HERMANN J. KAUFMANN', 160, 130, 9, { ls: 0.8 }),
        T('KOSTÜME UND REQUISITEN', 160, 156, 7.5, { ls: 0.6 }),
        T('FÜR THEATER UND FILM', 160, 168, 7.5, { ls: 0.6 }),
      ],
    }
  },
}

// ---- Kutschera — Zigeunerkeller entrance
CUT.kutschera = {
  build() {
    const polys = []
    polys.push(R(60, 8, 300, 228)) // facade mass
    // upper window: light opening, dark frames + sill
    polys.push(R(150, 22, 120, 62))
    polys.push(R(180, 26, 2.6, 54), R(237.4, 26, 2.6, 54))
    polys.push(R(150, 84, 120, 3))
    // ornament dots: light on the dark facade
    for (let y = 30; y <= 74; y += 15)
      for (const x of [84, 106, 128, 294, 316, 338])
        polys.push(circle(x + ((y / 15) % 2) * 6, y, 2, 10))
    // sign band: light panel, script lettering via text layer
    polys.push(R(66, 106, 288, 44))
    // entrance: light opening, dark door leaves with light panes
    polys.push(R(174, 160, 72, 76))
    polys.push(R(179, 165, 30, 66), R(211, 165, 30, 66))
    polys.push(R(183, 170, 22, 26), R(215, 170, 22, 26))
    // display case and window
    polys.push(R(96, 164, 52, 58))
    polys.push(R(272, 164, 52, 58))
    polys.push(R(276, 168, 44, 50))
    // step
    polys.push(R(166, 236, 88, 2.4))
    return {
      polys,
      texts: [T('Zigeuner Keller', 210, 138, 26, { ls: 2, style: 'italic' })],
    }
  },
}

// ---- Ruilos — the newspaper advertisement
CUT.ruilos = {
  build() {
    const polys = []
    // ad frame: dark ring, light field
    polys.push(R(40, 16, 340, 212))
    polys.push(R(48, 24, 324, 196))
    // radiant sun
    const sx = 132,
      sy = 104
    polys.push(circle(sx, sy, 40, 36))
    polys.push(circle(sx, sy, 34, 32))
    for (let a = 0; a < 360; a += 15) {
      const rad = (a * Math.PI) / 180
      const r1 = 45,
        r2 = a % 30 === 0 ? 72 : 58
      polys.push(
        seg(
          sx + r1 * Math.cos(rad),
          sy + r1 * Math.sin(rad),
          sx + r2 * Math.cos(rad),
          sy + r2 * Math.sin(rad),
          2
        )
      )
    }
    polys.push(R(228, 138, 128, 2.2))
    return {
      polys,
      texts: [
        T('DIE SONNE', sx, 94, 10, { ls: 0.8 }),
        T('DAS BESTE', sx, 110, 9, { ls: 0.8 }),
        T('MEDIKAMENT', sx, 124, 9, { ls: 0.5 }),
        T('GLEICH DER', 292, 62, 16, { ls: 1 }),
        T('SONNE WIRKT', 292, 86, 16, { ls: 1 }),
        T('RUILOS', 292, 128, 30, { ls: 2.5 }),
        T('NATURELLES', 292, 162, 11.5, { ls: 1.2 }),
        T('HAUSMITTEL-HEILVERFAHREN', 210, 200, 14, { ls: 1 }),
      ],
    }
  },
}

// ---- Wassermann — goose butcher's shopfront
CUT.wassermann = {
  build() {
    const polys = []
    polys.push(R(40, 8, 340, 228)) // facade mass
    // fascia: light panel, lettering via text layer
    polys.push(R(46, 20, 328, 34))
    // hanging band: light strip, dark rail + geese
    polys.push(R(52, 84, 316, 62))
    polys.push(R(58, 90, 304, 2.4))
    for (let x = 70; x <= 350; x += 20) {
      polys.push(R(x - 0.9, 92.4, 1.8, 7))
      polys.push([
        [x, 99],
        [x + 5.5, 104],
        [x + 6.5, 114],
        [x + 4.5, 126],
        [x, 132],
        [x - 4.5, 126],
        [x - 6.5, 114],
        [x - 5.5, 104],
      ])
    }
    // display window: light opening with dark trays of wares
    polys.push(R(88, 152, 244, 66))
    for (const [cx, y, w] of [
      [130, 196, 56],
      [196, 198, 48],
      [262, 196, 56],
    ]) {
      polys.push(
        strip(quad([cx - w / 2, y], [cx, y - 10], [cx + w / 2, y], 14), [
          [cx - w / 2, y + 3],
          [cx + w / 2, y + 3],
        ])
      )
    }
    // side door + price board
    polys.push(R(48, 152, 34, 84))
    polys.push(R(63, 152, 2.4, 84))
    polys.push(R(340, 156, 26, 54))
    for (let y = 164; y <= 200; y += 9) polys.push(R(344, y, 18, 1.8))
    return {
      polys,
      texts: [T('GÄNSE-AUSSCHLACHTEREI', 210, 43, 15.5, { ls: 1.4 })],
    }
  },
}

// ---- Weinberger — canvas-topped butter lorry
CUT.weinberger = {
  build() {
    const polys = []
    // canopy mass
    polys.push(
      strip(quad([44, 60], [150, 48], [262, 58], 20), [
        [44, 150],
        [262, 150],
      ])
    )
    // light sign panel on the canvas + rule
    polys.push(R(60, 72, 190, 54))
    polys.push(R(96, 114, 118, 1.8))
    // side board: dark with two light product panels
    polys.push(R(44, 150, 218, 34))
    polys.push(R(50, 154, 78, 26))
    polys.push(R(196, 154, 60, 26))
    // cab with windscreen opening
    polys.push(R(262, 96, 68, 88))
    polys.push(R(300, 104, 24, 38))
    // bonnet + radiator + headlamp
    polys.push(R(330, 140, 46, 44))
    polys.push(R(358, 146, 12, 34))
    for (const dx of [360.5, 364.5]) polys.push(R(dx, 149, 2, 28))
    polys.push(circle(384, 152, 5.5, 18))
    polys.push(circle(384, 152, 2.4, 12))
    // chassis + wheels
    polys.push(R(36, 184, 348, 2.4))
    for (const cx of [96, 322]) {
      polys.push(circle(cx, 212, 26, 32))
      polys.push(circle(cx, 212, 17, 28))
      polys.push(circle(cx, 212, 5.5, 16))
    }
    polys.push(R(2, 236, 416, 2))
    return {
      polys,
      texts: [
        T('GEBR. WEINBERGER', 155, 92, 12.5, { ls: 1 }),
        T('BUTTER-GROSSHANDLUNG', 155, 108, 10.5, { ls: 0.8 }),
        T("ASIW'S BUTTER", 89, 170, 9, { ls: 0.6 }),
        T("ASIW'S BUTTER", 226, 165, 7, { ls: 0.4 }),
        T('DIE BESTE', 226, 175, 6.5, { ls: 0.4 }),
      ],
    }
  },
}

module.exports = { CUT }
