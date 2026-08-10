# Plaque design benchmark — 2026-08-08

Status: **locked**. Two plaque formats, both engraving-ready, both passing an
automated acceptance gate. This is the reference point — if a later change makes
`pnpm run plaques:verify` fail, the change is wrong, not the benchmark.

## Reproduce

```bash
pnpm run plaques         # web SVGs + cutting files + verify, in one pass
pnpm run plaques:verify  # gate only; exit 0 = benchmark holds
```

Prerequisites: Inkscape 1.4+ at `/Applications/Inkscape.app` (override with
`INKSCAPE=`), and the static TTFs installed as system fonts:

```bash
cp scripts/fonts/*.ttf ~/Library/Fonts/
```

## What is locked

### Design language
Deep navy field, gold engraving, Kameron (display) + Inter (body). Border is a
weighted rule with a hairline companion inside it and a small square at each
corner — **no corner scrollwork, no centre tabs**. Two earlier rounds rejected a
busier certificate frame; do not reintroduce it.

### Formats

| Format | Content | Files |
|---|---|---|
| 300 × 200 mm | featured story — narrative copy + storefront line-engraving | `e-braun-300x200-{lines,field}.svg` |
| 300 × 100 mm | compact, no illustration — four facts only | `<slug>-300x100-{lines,field}.svg` |

Both readings ship for every plaque, for 1.3 mm two-tone ABS:
- `-lines` **positive** — engrave the artwork; it appears in the core colour.
- `-field` **negative** — engrave everything else; artwork stays cap colour.
  This is the reading that matches the on-screen navy/gold design.

### Mandatory content
1. **Stiftung Zurückgeben** attribution, on every plaque without exception.
2. Four facts: business name, trade, address, dates.
3. **GEDENKTAFEL** label, **HIER STAND**, and the standing context line
   *„Jüdisches Unternehmen, unter nationalsozialistischer Herrschaft enteignet
   und liquidiert."* — so the object explains itself to a passer-by.

Rules and the reasoning behind the wording live in `CLAUDE.md` → Memorial
Plaques.

## The gate (`scripts/verify-plaques.js`)

Per file: exactly one `<path>`; no text, strokes, gradients, patterns, clips or
masks; `fill-rule="evenodd"` present; mm dimensions matching a known format with
viewBox mapping 1 unit = 1 mm; and the QR decodes to the URL the file declares.
Plus: every plaque has both readings.

Negative-tested — it catches a stripped fill-rule, a wrong plate size, a
mismatched viewBox and a missing counterpart file.

Why these checks: each failure is invisible in a preview and only shows up after
a plate is cut. A stray `<text>` means the recipient needs our fonts; a
surviving stroke engraves as a hairline instead of a filled shape; a wrong
viewBox silently rescales the job.

## Current benchmark result

10 files, all clean (2 × 300 × 200, 8 × 300 × 100).

Compact prototypes, all from outside the 16 featured stories:

| Business | Trade | Location | Dates |
|---|---|---|---|
| A. Jandorf & Co | Warenhaus | Krausenstr. 46/47 | 1900–1935 |
| A. Asher & Co | Buch- und Kunsthandlung | Behrenstr. 17 | 1900–1938 |
| A. Breslauer | Gaststätte | Marburger Str. 5 | 1900–1933 |
| A. Mustroph | Juwelier | Charlottenstr. 6 | 1902–1935 |

## Non-obvious things that cost time

- **Inkscape ignores the enclosing group's scale for `letter-spacing`**, so the
  storefront sign band came out ~3.6× over-tracked and the three panels
  collided. The generator pre-multiplies tracking by the group scale to cancel
  it. Consequence: the *intermediate* looks under-tracked in a browser; only the
  post-Inkscape output is correct.
- **`select-all` alone does not union everything.** Groups must be ungrouped
  first (which also bakes their transforms), then `select-all:no-groups`.
  Without the ungroup pass the engraving lands at 420 mm wide.
- **Fonts must be static per-weight TTFs.** The variable woff2 files the web
  generator embeds flatten to weight 400 when Inkscape outlines them, so bold
  display type silently lost its weight.
- **`xml:space="preserve"`** on the attribution, or renderers collapse the space
  into "StiftungZurückgeben".
- **The negative would invert the QR**, making it cap-colour modules on an
  engraved field. It sits on an unengraved island so it stays dark-on-light.
- **Minimum feature width 0.3 mm.** The storefront's hairlines scale to 0.14 mm
  at 116 mm wide — below kerf. They are widened before outlining.
- **The QR box is written into each SVG as a comment** and read back by the
  verifier. An earlier version duplicated the coordinates in both scripts and
  they drifted within an hour.

## Open — for the physical prototype

- Not yet cut. Everything above is verified in software only; feed rate, power
  and the actual contrast of the two-tone plate are unproven.
- Start with `a-jandorf-co-300x100-field.svg`: smallest plate, and its context
  line at 3.2 mm is the finest type in the set, so it tests the 0.3 mm minimum.
- The 300 × 200 QR needs a real phone test. It decodes reliably when cropped,
  but the storefront line art confuses software decoders scanning the whole
  plaque at once. Physical clearance around the code is ~9 mm (spec wants ~3.6),
  so it should be fine — worth confirming rather than assuming.
- `data/storymaps.json` now yields **2,464** plaque-eligible non-story records
  (up from 60 before the `sectorKey` recovery), so the compact format can scale
  well past the four prototypes.
