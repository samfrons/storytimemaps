# Exhibit Vision Page — Design Spec

**Date:** 2026-06-04
**Status:** Approved (design); implementation in progress
**Author:** Sam Frons + Claude

## Purpose

Add a narrative "pitch" page describing the **vision for a physical museum
exhibit** built on the StoryTimeMaps dataset (10,021 documented Jewish
businesses in Berlin, 1900–1945). The page is aimed at **grant reviewers** and
prospective institutional partners — it explains the vision, what visitors
would experience, how it builds on the existing digital archive and memorial
plaques work, and the partnership/funding ask.

This is distinct from the existing `/museum-exhibit` route, which is a
*functional interactive kiosk* (touch map, attract mode, session timeout)
intended for a physical touchscreen installation. The new page describes the
**vision**; the kiosk is the working proof-of-concept it links to.

## Decisions (from brainstorming)

- **Routing:** New separate page at `/exhibit-vision`. The interactive kiosk at
  `/museum-exhibit` is left untouched.
- **Content source:** First-draft prose synthesized from existing site
  materials (intro/Kreutzmüller copy, `FutureInitiatives`, plaques voice, the
  kiosk concept). Owner edits afterward.
- **Scope:** Full pitch page.
- **Languages:** English + German now. Yiddish deferred (page falls back to
  English in YI mode — no broken strings).

## Non-goals

- No backend / API / Supabase changes. Pure static narrative page.
- No changes to the existing `/museum-exhibit` kiosk.
- No Yiddish translation in this pass.

## Architecture

Mirrors the proven `/plaques` page pattern.

| File | Role |
|---|---|
| `src/app/exhibit-vision/page.tsx` | Page shell: `'use client'` + `Suspense` wrapper, fixed nav header (back-to-map + `LanguageToggle`), `<main>` with sections, footer. |
| `src/app/components/ExhibitVisionHero.tsx` | Hero section component (parallels `PlaquesHero`): badge, title, subtitle, vision statement, link to live `/museum-exhibit` kiosk, support CTA. `React.memo`. |
| `public/locales/en/common.json` | New `exhibitVision` block (English copy). |
| `public/locales/de/common.json` | New `exhibitVision` block (German copy). |
| `src/app/components/FutureInitiatives.tsx` | Add one discoverability link to `/exhibit-vision` in the existing CTA row. |

### Page sections

1. **Hero** (`ExhibitVisionHero`) — badge "Exhibit Vision", title, subtitle,
   vision paragraph, "See the live interactive exhibit →" link to
   `/museum-exhibit`, support CTA (mailto).
2. **Vision statement** — turning the digital archive into a public physical
   experience.
3. **What visitors experience** — 3–4 cards grounded in the real kiosk: touch
   map, 1900→1945 time-slider journey, individual family-business stories,
   multilingual access.
4. **How it builds on the project** — three-part memory strategy: digital
   archive → memorial plaques in the streets → museum exhibit. Cites
   Kreutzmüller "Final Sale" / Leo Baeck Institute.
5. **Partners & funding ask** — partnerships with Berlin cultural/educational
   institutions; funding for the installation.
6. **Footer CTA** — links back to map and `/plaques`.

## Conventions (per CLAUDE.md)

- Theme **CSS variables only** (`var(--foreground)`, `var(--background)`,
  `rgba(var(--card-bg-rgb), …)`, etc.) — no new hardcoded hex. Exception: the
  edit to `FutureInitiatives` matches that component's pre-existing hardcoded
  palette for visual consistency (its background is a fixed hex gradient).
- **No border-radius.** Sharp edges throughout.
- Fonts: Inter for headings, Space Mono for data/labels.
- Page using `useTranslation` (reads URL params) → wrapped in `Suspense`.
- `i18n`: missing YI keys fall back to English via the existing `t()` fallback.

## i18n key shape (`exhibitVision`)

```
exhibitVision.nav.backToMap
exhibitVision.hero.{badge,title,subtitle,visionTitle,visionDescription,
                    seeLiveExhibit,ctaTitle,ctaDescription,supportInitiative}
exhibitVision.experience.{title,subtitle, card1Title,card1Description, … card4*}
exhibitVision.builds.{title,subtitle, digitalTitle,digitalDescription,
                      plaquesTitle,plaquesDescription, exhibitTitle,exhibitDescription,
                      provenance}
exhibitVision.partners.{title,description, ask1,ask2,ask3}
exhibitVision.footer.{exploreTitle,exploreDescription,exploreMap,viewPlaques,rights}
```

## Verification

- `pnpm build` — route compiles, type-checks, prerenders.
- Manual: load `/exhibit-vision`, toggle EN/DE, sanity-check a couple of themes
  (readability per CLAUDE.md), confirm "See the live exhibit" links to
  `/museum-exhibit` and the landing-page link reaches `/exhibit-vision`.
- All local — no Vercel deploy / spend.

## Out-of-scope follow-ups (noted, not done here)

- Yiddish (YIVO Latin) translation.
- Production Vercel deploy is currently erroring — fix before sending reviewers
  a live link.
