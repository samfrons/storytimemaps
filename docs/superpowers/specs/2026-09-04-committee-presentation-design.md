# Funding-committee presentation — StoryMaps Berlin (design spec, 2026-09-04)

## Context

Sam presents live to the Stiftung Zurückgeben committee (20–30 min slot, room for 45). The goal is **not** a funding ask: it's a progress + vision briefing that ends by asking the committee for **ideas, introductions and visibility** across four partner categories (museums/memorials, schools/educators, physical plaques in the city, press/academia/co-funders). Bilingual DE/EN toggle. Live site sections embedded. PDF leave-behind from the same file.

Decisions already made with Sam:
- **Approach A**: standalone HTML deck, no build coupling, served from the live domain.
- **Palette**: match the live site's default theme `brutal-pop` (not the `moody` palette CLAUDE.md describes).
- **Anchor story**: E. Braun & Co., Unter den Linden 2 (record id 1).
- **Roadmap slide** lists all four: first physical plaques installed, institution & educator portals, museum exhibit pilot, beyond Berlin.
- **No** live notes-capture panel. Prompts only.
- PDF: yes, via the existing `deck-to-pdf` skill.

## Deliverable

```
public/presentation/committee-2026/
  index.html      # the whole deck: CSS + slides + JS in one file
  posters/        # 4 static screenshots used as iframe fallbacks + PDF stills
    map.webp  history-tour.webp  home-hero.webp  museum-exhibit.webp
  committee-2026.pdf   # generated, committed as leave-behind
```

Live URL after deploy: `https://b3rlin.storytimemaps.com/presentation/committee-2026/`. Also opens from disk (`file://`), so all asset paths are **relative** (`../../images/ebraun/ebraun1.webp`), never `/images/...`.

Add `Disallow: /presentation/` to `src/app/robots.ts` so it isn't indexed. Only change to app code.

## Deck architecture (single `index.html`)

**Slides**: `<section class="slide" data-kind="...">` in a `#deck` container, 1920×1080 design space scaled to viewport with a single `transform: scale()` on `#deck` (`--s = min(vw/1920, vh/1080)`). This keeps typography identical on the projector and in the PDF.

**Navigation**: → / ← / Space / PgDn / PgUp, click right/left third of screen, `Home`/`End`. Hash routing `#7` so a refresh keeps the slide. Thin progress bar top edge (`--primary` on `--border`). Slide counter bottom-right in Space Mono.

**Language toggle**: every string is written as `<span data-en="…" data-de="…">`. `L` key and a small `DE | EN` control (top-right) set `html[lang]`; a 10-line JS function swaps `textContent`. Persist choice in `localStorage`. Default **DE** (committee is German). No i18n library.

**Presenter notes**: `N` opens a right-hand drawer (`--card-bg`, 420px) showing `<aside class="notes">` for the current slide, in the current language. Notes are short cue lines, not scripts.

**Live iframes**: each live slide has a `.live` block containing a poster `<img>` (from `posters/`) and an `<iframe data-src="https://b3rlin.storytimemaps.com/map">`. The iframe `src` is set only when the slide becomes current (and the previous/next one, for preload), and cleared two slides away so the map's WebGL contexts don't pile up. If `load` doesn't fire within 6 s, keep showing the poster with a small "live demo unavailable" label. Iframes get `allow="fullscreen"`; an `F` key toggles the current iframe fullscreen for the actual demo moment. Iframes carry `?theme=brutal-pop` where the route accepts it, so the embed matches the deck.

**Print contract** (for `deck-to-pdf`): `?print` in the URL adds `body.print`; CSS stacks all slides at exactly 1920×1080 each with `page-break-after: always`, `#deck { transform:none; height:auto; overflow:visible }`, hides iframes and shows posters, kills all `opacity`/`transform` entrance animations (final frame). No counters animate, so nothing needs driving. `@page { size: 1920px 1080px; margin: 0 }`.

**Entrance animation**: one only, reused everywhere: `.reveal` children fade + rise 12px on slide enter, staggered 60 ms. Respect `prefers-reduced-motion`. No transitions on `color`/`background-color` (project rule).

**Design rules carried over**: zero `border-radius`, no blue focus outlines, all colours as CSS variables copied verbatim from `src/app/globals.css:414–462` (brutal-pop block), fonts via Google Fonts `<link>` for Space Mono + Inter with real fallbacks. Hard 2px `--border` rules and `--shadow` offset blocks (4px 4px 0) are the brutal-pop signature; use them for cards and stat tiles.

Load `frontend-design` before writing the CSS and `dataviz` before slide 11's stat tiles.

## Slide content (all copy DE + EN; numbers sourced)

Timing target: slides 1–3 in 3 min, 4–9 in 12 min, 10–13 in 5 min, 14 discussion 10 min.

| # | Title (EN) | Content & assets | Mode |
|---|---|---|---|
| 1 | **StoryMaps Berlin** | Full-bleed `../../images/ebraun/ebraun1.webp` with dark overlay; eyebrow "Unter den Linden 2 · 1914–1943"; name "E. Braun & Co."; subtitle: Jewish commercial life in Berlin 1900–1945 · a project supported by Stiftung Zurückgeben (thin/bold lock-up, same rule as plaques). Presenter name/date. | still |
| 2 | **One name** | 3-beat strip from `public/data/timeline/1.json`: 1914 opens next to Hotel Adlon · 1938 owner arrested, forced sale · 1943 closed, seized, bombed. Right column: `../../images/plaques/e-braun-plaque.webp`. Footer line: "Today the Hotel Adlon covers the site." | still |
| 3 | **Zoom out** | Headline `10,021 Jewish-owned businesses` / `8,838 placed on the map` (be explicit about the gap: the rest lack a resolvable historical address). Live home hero dot-field. Quote from `homepage.memorial.quote` (EN/DE already in locales). | iframe `/` + poster |
| 4 | **Demo 1 · The map** | Cue: drag slider 1933 → 1938, watch mint turn coral. Legend of the 3 states + "standing today". | iframe `/map` + poster |
| 5 | **Demo 2 · The virtual tour** | Cue: scroll; 15 storefronts, modelled 1930s Berlin, 1925 → 1945. | iframe `/history-tour` + poster |
| 6 | **Plaques on the street** | Row of 4 plaque SVGs from `../../plaques/premium/` (e-braun-ornate-serif, e-braun-medium, one 300×100 compact, one other featured). Facts: 2 formats (300×200 narrative / 300×100 compact), 18 engraving-ready plaques = 36 cut files, 181 candidate addresses in the outreach tracker, Stiftung Zurückgeben attribution on every plaque. Status: *fabrication-ready, not yet installed*. | still |
| 7 | **For classrooms** | "Six Lessons From One Archive" (6 single-lesson activities) + "The Street You Walk On" (3-phase neighbourhood walk workbook), ages 13–18, free, printable. Screenshot of `/education`. | still |
| 8 | **The exhibit** | 3 renders `../../images/exhibit/*.webp` (floor-map installation, isometric gallery plan, kiosk in gallery). "The kiosk already works" → optional live `/museum-exhibit`. Status: prototype. | still + optional iframe |
| 9 | **Rigor** | Source: Dr. Christoph Kreutzmüller, *Final Sale* (2015), Leo Baeck Institute. Verification 2026: 9,177 of 10,021 records (91.6 %) match the HU Berlin source on every field; 607 conservative fixes; 254 flagged for manual review. Languages: DE / EN / YI. | still |
| 10 | **What the grant built** | Horizontal milestone strip June → Sept 2026 (from `.remember` + git): data verification & 587 addresses restored (Jun) · i18n DE/EN/YI + exhibit-vision (Jun) · b3rlin hub deployed, postwar layer, kiosk (Aug) · education suite, SEO, 11 premium plaques, 32 cut files, outreach list (Aug) · narrative homepage + 3D tour (Aug) · engraving registry, ornate variant, editable-text SVGs (Aug–Sep). | still |
| 11 | **By the numbers** | Stat tiles: 10,021 records · 8,838 mapped · 16 featured stories · 15 tour stops · 18 plaques cut-ready · 181 addresses · 6 lessons · 3 languages · 167 Frankfurt records. Use `dataviz` stat-tile rules; no chart needed. | still |
| 12 | **The vision** | Three-part memory strategy as 3 columns with status badge: **Archive** (live) → **Street** (plaques, in progress) → **Museum** (prototype). Fourth, lighter: **Beyond Berlin** (Frankfurt pilot, 167 businesses). Badge status words from `AboutSection.tsx`. | still |
| 13 | **Next 12 months** | 4 rows: first physical plaques installed at pilot addresses · institution & educator portals (`/for-institutions`, `/for-educators`) · museum exhibit pilot in a partner venue · Frankfurt full dataset, further cities. Each with "what it needs": permissions, a venue, a school partner, data access. **Do not** present portals as existing. | still |
| 14 | **Where we need you** | Four cards, click/`1–4` keys to expand one at a time: **Museums & memorials** (which venue would host the kiosk? who to talk to at Jewish Museum Berlin, Topographie des Terrors, Bezirksmuseen, Stolpersteine?) · **Schools** (Landesinstitut, teacher networks, who pilots the workbook?) · **Plaques in the city** (property owners, Bezirksämter, shop owners on the 181 list, who can open doors / co-fund installation?) · **Press, academia, co-funders** (HU Berlin, Leo Baeck, media, EU/Bundes programmes). Each card ends with one concrete "the single most useful introduction would be…". | interactive |
| 15 | **Thank you** | `b3rlin.storytimemaps.com` · `info@storytimemaps.com` · QR (inline SVG generated at build time via a tiny script or embedded from a data URI) · Stiftung Zurückgeben lock-up. | still |
| A1–A5 | **Appendix** (45-min case) | Frankfurt map (`/frankfurt` iframe) · Outreach pipeline (screenshot of `/admin/outreach`, gated) · Anatomy of a plaque (reuse copy from `PlaqueAnatomy.tsx`) · Collaborate tracks (`/collaborate`) · Data browser (`/jewish-businesses`). Marked "Appendix" in the counter; `End` key jumps to 15, not A5. | mixed |

Honesty guardrails baked into copy: 10,021 vs 8,838 stated on slide 3; plaques are "fabrication-ready" not "installed"; portals are roadmap; exhibit is "prototype".

## Posters

Capture with the Chrome DevTools MCP at 1920×1080, `?theme=brutal-pop`, from the production site: `/` (hero), `/map` (slider at 1936), `/history-tour` (stop 3), `/museum-exhibit`. Convert to WebP (`cwebp -q 80` or sharp, whichever is installed). These are the PDF stills and offline fallbacks.

## Files touched

- **Create** `public/presentation/committee-2026/index.html`, `posters/*.webp`, `committee-2026.pdf`
- **Edit** `src/app/robots.ts` — add `/presentation/` to disallow
- **Create** `docs/superpowers/specs/2026-09-04-committee-presentation-design.md` — this plan, committed as the spec (brainstorming workflow)

Reuse: EN/DE strings from `public/locales/{en,de}/common.json` (`homepage.hero`, `homepage.memorial.quote`, `intro.paragraph1`); palette from `globals.css:414–462`; timeline copy from `public/data/timeline/1.json`; `ATTRIBUTION` string value from `scripts/generate-premium-plaques.js:310` (copied, since HTML can't import it).

## Build order

1. Skeleton: deck container, scaling, nav, hash routing, progress bar, counter, `?print` CSS, lang toggle, notes drawer. Verify with 3 placeholder slides in Chrome and one PDF run.
2. Palette + type system + the three layout primitives (full-bleed, split, card grid).
3. Slides 1–3 and 15 (stills), then 4–5 (iframes + posters), then 6–13, then 14, then appendix.
4. Presenter notes for all slides, DE + EN.
5. Posters, PDF, robots.ts, spec doc, commit on this branch.

Estimate: ~4 h of build, plus ~30 min of Sam's review for copy in German.

## Verification

1. Open `public/presentation/committee-2026/index.html` from disk and via `pnpm dev` at `http://localhost:3000/presentation/committee-2026/` — both must render; iframes load only on the served version if the site blocks nothing (checked: no `X-Frame-Options`/CSP in `next.config.mjs`).
2. Keyboard walk 1 → A5 and back; hash updates; `L` swaps every visible string (grep the DOM for any element with `data-en` whose text didn't change); `N` shows notes; `F` fullscreens the map iframe.
3. Kill wifi (or block the domain in DevTools) → live slides fall back to posters within 6 s, no broken-frame icon.
4. `node ~/.claude/skills/deck-to-pdf/generate.mjs public/presentation/committee-2026/index.html` → page count = 20 (15 + 5 appendix) via the skill's `/MediaBox` check; spot-check that posters, not blank iframes, appear on slides 3–5, 8.
5. `pnpm run typecheck` (robots.ts change) and `pnpm run build` (prebuild runs plaque generation; must still pass).
6. Screenshot every slide at 1920×1080 with Chrome DevTools MCP and eyeball for overflow in DE (German strings run ~30 % longer).

## Implementation notes (post-build)

- Next.js does not serve directory index files from `public/`, so the live URL is
  `https://b3rlin.storytimemaps.com/presentation/committee-2026/index.html`.
- Headings use the site's own self-hosted `Kame Poster` (`public/fonts/`) so the deck
  reads as the product; body Inter, numerals Space Mono.
- The site shows a cookie banner on first visit. Because the deck is served from the
  same origin, accepting it once (in any iframe) silences it for every embed. Do this
  on the presenting laptop before the meeting.
- Only the current slide and the next one hold a live iframe; the poster/offline
  fallback timer starts when a slide is actually shown, not when it is preloaded.
- PDF: `node ~/.claude/skills/deck-to-pdf/generate.mjs public/presentation/committee-2026/index.html`
  (system-Chrome fallback; Playwright is not a dependency of this repo).
