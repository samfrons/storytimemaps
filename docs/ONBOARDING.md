# Collaborator Onboarding Guide

Welcome to **StoryMaps** — an interactive memorial platform documenting Jewish-owned
businesses in Berlin (and Frankfurt) from 1900–1945. This guide gets you from zero to
contributing, whether you're here to write code, research history, or run outreach.

> **Read this first:** This project visualizes a difficult period in history. The goal is
> to preserve memory and educate — not to entertain. Keep all work respectful,
> historically accurate, and objective. See [Historical Sensitivity](#historical-sensitivity).

---

## 1. What This Project Is

| Piece | What it does | Where |
|---|---|---|
| Interactive map | Time-based visualization of ~hundreds of businesses with active / declining / closed states | `/` (main page), `src/app/components/MapboxMap.tsx` |
| Business directory | Searchable, filterable listings synced with the map | `src/app/components/StoryList.tsx` |
| Memorial plaques | Physical plaque program for former business locations | `/plaques`, `src/app/plaques/` |
| Outreach tracker | Admin tool for tracking contact with current property occupants about plaques | `/admin/outreach` |
| Museum exhibit | Touch-screen kiosk version of the map | `/museum-exhibit`, `/exhibit-vision` |
| Classroom workbook | Free education materials for ages 13–18 | `/education` |
| Frankfurt pilot | Extension of the model beyond Berlin | `/frankfurt` |
| Collaborate page | Public entry point for new collaborators | `/collaborate` |

## 2. Choose Your Track

You don't need to be a developer to contribute.

- **🔧 Code** — Next.js 16 / React 19 / TypeScript work on the map, UI, themes, performance. Start at [§3](#3-development-setup).
- **📚 Research** — Verify business histories, dates, addresses; process archival sources (OCR pipeline in the repo root Python scripts). Start with `DATASET_CLEANING_REPORT.md` and `GEOCODING_GUIDE.md`.
- **✉️ Outreach** — Contact current occupants of former business addresses about memorial plaques. Start with [`docs/OUTREACH_TRACKING.md`](./OUTREACH_TRACKING.md).
- **🌍 Translation** — English / German / Yiddish / Hebrew localization. See `src/i18n/`.

Whatever your track, skim [§6 Ground Rules](#6-ground-rules) — they apply to everyone.

## 3. Development Setup

### Prerequisites
- Node.js 20+ (the project runs Next.js 16 and React 19)
- pnpm (preferred; npm/yarn also work)
- A [Mapbox account](https://mapbox.com) for a free API token
- Python 3.10+ (only if working on data/scraping scripts)

### Steps

```bash
git clone https://github.com/samfrons/storytimemaps.git
cd storytimemaps
pnpm install

# Environment
cp .env.example .env.local  # or create .env.local manually
# Add: NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
# NEVER commit token values.

pnpm dev        # http://localhost:3000
```

### Verify your setup
1. Map loads at `/` without console errors
2. Time slider changes business marker states
3. Theme switching works instantly (the default theme is `brutal-pop`; try `?theme=cool` in the URL)
4. `pnpm run build` completes without errors

## 4. Codebase Map

```
src/
  app/
    page.tsx              # Main map page (URL param handling — be careful here)
    layout.tsx            # ThemeProvider config — DO NOT change its settings
    globals.css           # Theme color definitions (CSS variables)
    components/           # All React components (PascalCase)
      outreach/           # Outreach tracker UI
    admin/outreach/       # Outreach admin page
    api/outreach/         # Outreach data API
    collaborate/          # Public collaborator page
  lib/types/outreach.ts   # Outreach data model
  i18n/                   # Translations (en/de/yi/he)
public/
  data/                   # All HTTP-served data files (timeline JSON, CSV)
docs/                     # Guides (theming, outreach, tasks, this file)
```

Key docs, in reading order:
1. `CLAUDE.md` — **the rulebook.** Non-negotiable design, theme, and deployment rules.
2. `docs/THEMING_GUIDE.md` — theme system deep-dive
3. `docs/OUTREACH_TRACKING.md` — outreach pipeline and workflow
4. `docs/TASK_TRACKING.md` — how work is organized and claimed
5. `STYLE.md`, `PERFORMANCE_RULES.md` — style and performance specifics

## 5. Contribution Workflow

1. **Claim a task** — see [`docs/TASK_TRACKING.md`](./TASK_TRACKING.md). Open a GitHub issue
   (or comment on an existing one) so two people don't do the same work.
2. **Branch** — `git checkout -b <type>/<short-description>` (e.g. `feat/plaque-filter`).
3. **Develop** — follow the ground rules below and existing component patterns.
4. **Pre-commit checklist** (from `CLAUDE.md`):
   - `pnpm run build` passes with no errors
   - No TypeScript errors (`npx tsc --noEmit`)
   - No border-radius anywhere; all colors via CSS variables
   - All themes tested (brutal-pop — the default — plus moody, hot, cold, warm, cool, bauhaus, art-nouveau, archival, hoefe)
   - Components memoized; pages using `useSearchParams()` wrapped in `<Suspense>`
5. **Commit** — conventional commits: `feat:`, `fix:`, `perf:`, `style:`, `refactor:`, `docs:`
6. **Open a PR** — describe what changed and which themes/pages you tested.

## 6. Ground Rules

The short version of `CLAUDE.md` — the full file always wins:

1. **No rounded corners.** Sharp rectangular edges everywhere.
2. **No hardcoded colors.** Always `var(--variable)`. The only exception is Mapbox layer
   styling, which requires hex values from the theme functions.
   (Ten themes exist; `brutal-pop` is the default and doubles as the museum-exhibit kiosk palette.)
3. **No blue focus outlines.** Custom focus states via border/background instead.
4. **Don't touch the theme system** without reading the theme rules in `CLAUDE.md` first.
5. **Typography:** Space Mono for data/labels/technical text, Inter for body copy.
6. **Performance:** `React.memo()` for props-receiving components, `useMemo` for expensive
   work, throttle scroll (100–150ms), debounce inputs (300–500ms), dynamic-import heavy
   components.
7. **Suspense:** any page touching `useSearchParams()` (including via `Sidebar`) must be
   wrapped in a Suspense boundary or the production build fails.
8. **Static files** live in `/public/` — nothing else is served over HTTP.

## 7. Historical Sensitivity

This is a memorial project. All contributors agree to:

- Treat every business record as the story of real people, many of whom were persecuted,
  dispossessed, deported, or murdered.
- Maintain historical accuracy — cite sources for data changes; when a date or fact is
  uncertain, mark it uncertain rather than guessing.
- Avoid sensationalism in copy, imagery, and UI. Present closures and Aryanization
  objectively; never gamify them.
- In outreach, be respectful of current occupants — they carry no responsibility for the
  history of the address. See tone guidance in `docs/OUTREACH_TRACKING.md`.

## 8. Getting Help

- **Questions about rules/architecture:** open a GitHub issue with the `question` label.
- **Project coordination & outreach access:** contact the maintainer (repo owner).
- **Where things are:** `grep` is your friend — the codebase follows consistent naming
  (components PascalCase, hooks `useX`, utils camelCase).

Welcome aboard — thank you for helping preserve this history.
