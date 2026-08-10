# Site Elevation — Design Spec

**Date:** 2026-08-07
**Status:** Approved in brainstorm, pending spec review
**Deadline context:** Grant-relevant deadline within ~4–6 weeks. Every phase must be independently shippable.

## Goal

Elevate the StoryMaps site from "working prototype" to institution-grade. Primary audience: **grant board / funders**. Secondary audiences get dedicated entry paths: general public, museums & institutions, educators & researchers.

Weaknesses being fixed (all four): first impression / homepage, storytelling depth, coherence between pages, visual design polish.

Existing homepage mockups (v1-editorial, v2-museum, React redesign worktree) are **raw material only** — steal freely, none is "the one."

## Approach

One narrative spine (A) + two audience portals (B, scoped to single pages) + design tokens applied progressively (lightweight C). Sequenced so grant-board-critical work lands first; if the schedule slips, portals slip — never the spine.

## Phasing

### Phase 1 (weeks 1–3): Narrative spine + design tokens
- New homepage: cinematic scroll narrative → map reveal → four audience doors.
- Design-token layer: type scale, spacing, canonical card/header treatment. Every page touched from now on adopts it.
- Ships end of week 3; grant-board-ready on its own.

### Phase 2 (weeks 3–5): Two audience portals
- `/for-institutions` and `/for-educators` (details below).
- No funder portal: homepage + methodology **is** the funder portal. Grant boards distrust pages addressed to them.

### Phase 3 (weeks 5–6): Coherence sweep
- Unified nav/footer, token adoption in the map app, route hygiene, cross-linking.

## Phase 1 — Narrative Spine homepage

Five beats, single scroll journey:

1. **Open on one name.** Full-viewport, near-black, one line of type: business name, address, "Est. 1901." No nav clutter. Space Mono documentary voice. Business chosen from the 15 "Final Sale" narratives — pick the one with the strongest photo + full arc (decided during implementation planning).
2. **The arc, 3–4 scroll steps.** Dated fragments (MM.YYYY format) telling rise and forced dissolution. Text plus one or two images per step, each a full viewport. Scroll-triggered reveals restricted to opacity/transform (no color transitions, per theme rules).
3. **The zoom-out.** The single address becomes a dot on a dark Berlin map; thousands of dots ignite: "This happened over 10,000 times." Reuses the existing Mapbox layer with a scripted camera + staged dot reveal. Static-image fallback for low-power devices / reduced-motion.
4. **What we do about it.** Three blocks: the dataset (verified against HU Berlin source — provenance stated on the homepage), the stories, the plaques program.
5. **Four doors.** Explore the map · For educators · For institutions · Methodology. Sharp-edged cards, one row.

Theme handling: language toggle and theme system persist, but the homepage narrative section renders in the moody/dark look regardless of saved theme (readability of beats 1–3 depends on it). Approved deviation from theme rules, homepage only.

## Phase 2 — Audience portals

### `/for-institutions` — partnership pitch, one scroll
- Hero: "Bring this history to your space" over an existing exhibit-vision render.
- Three offer blocks: traveling exhibit (from `/exhibit-vision`), plaques program (from `/plaques`), data/curatorial collaboration. Existing pages remain; this page is the unifying front door.
- Credibility strip: dataset scale, HU Berlin verification, methodology link.
- One CTA: contact form (reuse `PlaqueInquiryForm` mechanics) — "Start a conversation."

### `/for-educators` — working resource page
- Browsable index of all 16 stories: thumbnail, era, one-line summary. A teacher can pick a lesson topic in under a minute.
- "Using this in the classroom": framings by age group + guidance note on teaching difficult history respectfully.
- Data access: citation format, dataset description, CSV/JSON download of public data.
- **Neighborhood Walk workbook** (see below): featured on-page section + printable download.
- German version prioritized for this page (existing i18n infrastructure).

### Neighborhood Walk workbook
Classroom activity drafted at `docs/education/neighborhood-walk-workbook.md` (subagent deliverable). Concept: students pick a neighborhood — ideally their own — walk it, discover which Jewish businesses existed there 1900–1945 via the map, document what occupies those addresses today, then reimagine how that business could operate sustainably (environmentally + economically) if it still existed — framed as honoring continuity and imagining what was lost, never as gamification. Three phases: before (map research), during (the walk), after (sustainability reimagining + presentation). Includes teacher guidance for difficult history, printable worksheets, Berlin-first with adaptation notes for elsewhere. English first; German version planned.

## Phase 3 — Coherence sweep

1. **Unified nav**: one shared header/footer across homepage, map, portals, plaques, methodology, exhibit-vision. Consistent language-toggle placement.
2. **Token adoption**: map app sidebar, modals, story panels restyled with Phase-1 tokens. No functional map changes.
3. **Route hygiene**: remove or gate scaffolding — `page.tsx.old`, `page.tsx.backup`, `overlay-test`, `business-details-test`, `test-full-dataset`, `MapboxMapTest*` — so no reviewer or crawler finds a test page.
4. **Cross-linking**: every page ends with the same four-doors "where next" strip. No dead ends.

## Constraints & rules honored

- All existing CLAUDE.md rules: no border radius, no blue focus outlines, CSS variables only (Mapbox hex exception), Space Mono / Inter, React.memo + Suspense patterns, i18n (EN/DE/Yiddish), historical sensitivity throughout.
- No color transitions in CSS (theme-flash rule).
- Vercel budget is tight during grant phase — no new paid services; deploys are previews until explicitly promoted.
- `pnpm` package manager; `pnpm run build` must pass before any push.

## Definition of done (grant-board test)

A board member landing cold on the homepage understands within 60 seconds what this is, why it matters, and that it's rigorous. Every link looks like the same institution built it. There's an obvious path for each audience type. Build passes, all themes legible, works on a phone.

## Out of scope

- Map application rework (polish only).
- Funder-specific portal page.
- German translation of the workbook (planned, not in this cycle).
- New data collection or dataset changes.
