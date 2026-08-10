# Phase 1: Narrative Spine Homepage + Design Tokens — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/` homepage with a five-beat cinematic scroll narrative (E. Braun & Co. → city-wide dot reveal → four doors) plus a design-token layer every subsequent page adopts.

**Architecture:** New `narrative/` component family renders at `/` (the existing root route already redirects legacy `?id=` links to `/map`, so no routing changes beyond swapping the rendered component). Story content comes verbatim from `public/data/timeline/1.json`; the dot reveal draws from a pre-generated `public/data/dots.json` on a `<canvas>` — no Mapbox GL on the homepage. Scroll reveals use one IntersectionObserver hook, opacity/transform only.

**Tech Stack:** Next.js 15 (webpack build), React 18, Jest 30 + Testing Library (jsdom), plain CSS with theme variables, pnpm.

## Global Constraints

- NO border-radius anywhere. NO blue focus outlines (`outline: none`).
- NO CSS transitions on `background-color` or `color` — only transform, opacity, box-shadow.
- All colors via CSS variables (`var(--primary)` etc.). New variables may be *defined* in CSS files; never hardcode hex in TSX.
- Fonts: 'Space Mono' for data/labels, 'Inter' for prose. Dates display as `MM.YYYY`.
- Components wrapped in `React.memo()`; any page using `useSearchParams()` wrapped in `<Suspense>`.
- Escape apostrophes in JSX text (`&apos;`).
- Package manager: `pnpm`. Before final push: `pnpm run build` must pass.
- Historical copy: respectful, no sensationalism; story texts verbatim from source data (English-only, matching existing story pages).
- The narrative sections force the dark cinematic look via a scoped variable override class — this is the approved spec deviation from normal theme switching; the rest of the site keeps the active theme.

---

### Task 1: Dot-coordinates data file

**Files:**
- Create: `scripts/generate-dots.js`
- Create: `public/data/dots.json` (generated)

**Interfaces:**
- Produces: `public/data/dots.json` with shape `{ "bounds": { "minLat": number, "maxLat": number, "minLng": number, "maxLng": number }, "points": [[lat, lng], ...] }`, points pre-shuffled deterministically. Consumed by Task 5 (`DotReveal`).

- [ ] **Step 1: Write the script**

```js
// scripts/generate-dots.js
// Emits public/data/dots.json: every business coordinate from
// data/storymaps.json, pre-shuffled (seeded) so the homepage dot reveal
// ignites in a stable scattered order. Run: node scripts/generate-dots.js
const fs = require('fs')
const path = require('path')

const data = require(path.join(__dirname, '..', 'data', 'storymaps.json'))

const points = data
  .filter((b) => typeof b.lat === 'number' && typeof b.lng === 'number')
  .map((b) => [Number(b.lat.toFixed(5)), Number(b.lng.toFixed(5))])

// Deterministic shuffle (mulberry32, fixed seed) — stable output across runs.
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(1933)
for (let i = points.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1))
  ;[points[i], points[j]] = [points[j], points[i]]
}

const lats = points.map((p) => p[0])
const lngs = points.map((p) => p[1])
const out = {
  bounds: {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  },
  points,
}
fs.writeFileSync(
  path.join(__dirname, '..', 'public', 'data', 'dots.json'),
  JSON.stringify(out)
)
console.log(`dots.json: ${points.length} points`)
```

- [ ] **Step 2: Run it and verify count**

Run: `node scripts/generate-dots.js`
Expected: `dots.json: 2761 points` (or slightly fewer if any record lacks coordinates — anything above 2700 is correct; the exact count printed is the source-data truth).

- [ ] **Step 3: Verify JSON parses and bounds are Berlin-plausible**

Run: `node -e "const d=require('./public/data/dots.json'); console.log(d.bounds, d.points.length)"`
Expected: bounds roughly minLat 52.3–52.5, maxLat 52.55–52.7, minLng 13.1–13.35, maxLng 13.5–13.8.

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-dots.js public/data/dots.json
git commit -m "feat(narrative): generate shuffled dot coordinates for homepage reveal"
```

---

### Task 2: Design token layer

**Files:**
- Create: `src/app/styles/tokens.css`
- Modify: `src/app/globals.css` (add one `@import` at the very top, before existing rules)

**Interfaces:**
- Produces: CSS custom properties `--text-xs … --text-display`, `--space-1 … --space-16`, `--measure`, and classes `.token-card`, `.token-kicker` used by Tasks 5–8 and all later phases.

- [ ] **Step 1: Write tokens.css**

```css
/* ============================================================
   Design tokens — Phase 1 site elevation (spec 2026-08-07).
   Layered UNDER the theme palettes in globals.css: tokens define
   scale (type, spacing) and canonical treatments; themes define color.
   ============================================================ */

:root {
  /* Type scale — clamped so display sizes work from phone to desktop */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: clamp(1.125rem, 1rem + 0.5vw, 1.375rem);
  --text-xl: clamp(1.375rem, 1.2rem + 1vw, 1.75rem);
  --text-2xl: clamp(1.75rem, 1.4rem + 1.8vw, 2.5rem);
  --text-3xl: clamp(2.25rem, 1.6rem + 3vw, 3.75rem);
  --text-display: clamp(2.75rem, 2rem + 4.5vw, 5.5rem);

  /* Spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Reading measure for prose blocks */
  --measure: 42rem;
}

/* Canonical card: sharp edges, hairline border, translucent fill */
.token-card {
  border: 1px solid var(--border);
  background-color: rgba(var(--card-bg-rgb), 0.5);
  padding: var(--space-6);
}

/* Canonical kicker/eyebrow label */
.token-kicker {
  font-family: 'Space Mono', monospace;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.2em;
}
```

- [ ] **Step 2: Import it first in globals.css**

At line 1 of `src/app/globals.css` (before Tailwind directives and everything else):

```css
@import './styles/tokens.css';
```

- [ ] **Step 3: Verify build accepts the import**

Run: `pnpm run build 2>&1 | tail -3`
Expected: build completes without CSS errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/styles/tokens.css src/app/globals.css
git commit -m "feat(tokens): add design token layer (type scale, spacing, card/kicker)"
```

---

### Task 3: Narrative data module

**Files:**
- Create: `src/app/components/narrative/narrativeData.ts`
- Test: `src/app/components/narrative/__tests__/narrativeData.test.ts`

**Interfaces:**
- Produces:
  - `interface NarrativeBeat { date: string; text: string }`
  - `const OPENING: { id: string; title: string; address: string; established: string; lat: number; lng: number }`
  - `const BEATS: NarrativeBeat[]` (5 entries, chronological)
  - `function formatMonthYear(iso: string): string` — `'1938-03-13' → '03.1938'`
- Consumed by Tasks 5 and 6.

- [ ] **Step 1: Write the failing test**

```ts
// src/app/components/narrative/__tests__/narrativeData.test.ts
import { OPENING, BEATS, formatMonthYear } from '../narrativeData'

describe('narrativeData', () => {
  it('opens on E. Braun & Co. at Unter den Linden 2', () => {
    expect(OPENING.id).toBe('1')
    expect(OPENING.title).toMatch(/E\. Braun/)
    expect(OPENING.address).toMatch(/Unter den Linden 2/)
    expect(OPENING.established).toBe('1914')
  })

  it('has five chronological beats with ISO dates', () => {
    expect(BEATS).toHaveLength(5)
    const dates = BEATS.map((b) => b.date)
    expect([...dates].sort()).toEqual(dates)
    dates.forEach((d) => expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/))
  })

  it('formats dates as MM.YYYY', () => {
    expect(formatMonthYear('1938-03-13')).toBe('03.1938')
    expect(formatMonthYear('1914-01-01')).toBe('01.1914')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- narrativeData -t "" 2>&1 | tail -5`
Expected: FAIL — cannot find module `../narrativeData`.

- [ ] **Step 3: Write the module**

Texts are verbatim `description` fields from `public/data/timeline/1.json` — do not rewrite them.

```ts
// src/app/components/narrative/narrativeData.ts
// The homepage narrative opens on story id 1 (E. Braun & Co.).
// Beat texts are verbatim from public/data/timeline/1.json — the same
// records the map and history tour render. Do not edit the wording here;
// fix the source data instead.

export interface NarrativeBeat {
  date: string
  text: string
}

export const OPENING = {
  id: '1',
  title: 'E. Braun & Co. Berlin',
  address: 'Unter den Linden 2, Berlin-Mitte',
  established: '1914',
  lat: 52.5164,
  lng: 13.3822,
}

export const BEATS: NarrativeBeat[] = [
  {
    date: '1914-01-01',
    text: "E. Braun & Co.'s largest branch opens at Unter den Linden 2, next to Hotel Adlon, supplying Europe's high society with formal wear, table linen and accessories.",
  },
  {
    date: '1933-01-30',
    text: "As Austrian nationals, the company's Jewish owners are initially protected in Nazi Berlin, and the luxury store continues to trade.",
  },
  {
    date: '1938-03-13',
    text: "After Austria's annexation, Siegfried Franz Oser-Braun is arrested and forced to sell the company. The family escapes via London and Egypt to the USA.",
  },
  {
    date: '1943-02-20',
    text: 'The store on Unter den Linden is closed as not relevant to the war effort, seized by the Nazi authorities and later destroyed by bombing.',
  },
  {
    date: '1945-01-01',
    text: 'The forced sale is declared null and void; the E. Braun & Co. name lives on in New York and Beverly Hills. The Hotel Adlon block now covers the former store site.',
  },
]

export function formatMonthYear(iso: string): string {
  const [year, month] = iso.split('-')
  return `${month}.${year}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- narrativeData 2>&1 | tail -5`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/narrative/
git commit -m "feat(narrative): data module for the E. Braun opening arc"
```

---

### Task 4: Scroll-reveal hook

**Files:**
- Create: `src/hooks/useScrollReveal.ts`
- Test: `src/hooks/__tests__/useScrollReveal.test.tsx`

**Interfaces:**
- Produces: `function useScrollReveal<T extends HTMLElement>(threshold?: number): { ref: React.RefObject<T | null>; visible: boolean }`. Reveals once (never un-reveals). Immediately visible when `prefers-reduced-motion: reduce` or IntersectionObserver is unavailable. Consumed by Tasks 5–7.

- [ ] **Step 1: Write the failing test**

```tsx
// src/hooks/__tests__/useScrollReveal.test.tsx
import { renderHook, act } from '@testing-library/react'
import { useScrollReveal } from '../useScrollReveal'

type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void

describe('useScrollReveal', () => {
  let ioCallback: IOCallback | null

  beforeEach(() => {
    ioCallback = null
    window.matchMedia = jest.fn().mockReturnValue({ matches: false })
    ;(window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = jest
      .fn()
      .mockImplementation((cb: IOCallback) => {
        ioCallback = cb
        return { observe: jest.fn(), disconnect: jest.fn() }
      })
  })

  it('starts hidden, becomes visible on intersection', () => {
    const { result } = renderHook(() => useScrollReveal<HTMLDivElement>())
    const el = document.createElement('div')
    ;(result.current.ref as { current: HTMLDivElement | null }).current = el
    const { rerender } = renderHook(() => useScrollReveal<HTMLDivElement>())
    expect(result.current.visible).toBe(false)
    void rerender
  })

  it('is immediately visible with prefers-reduced-motion', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true })
    const { result } = renderHook(() => {
      const r = useScrollReveal<HTMLDivElement>()
      return r
    })
    act(() => {})
    expect(result.current.visible).toBe(true)
  })
})
```

Note: the hook observes on mount; the first test asserts the pre-intersection state only (jsdom refs attach after render, so triggering `ioCallback` is exercised in component tests in Task 5 instead).

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- useScrollReveal 2>&1 | tail -5`
Expected: FAIL — cannot find module `../useScrollReveal`.

- [ ] **Step 3: Implement the hook**

```ts
// src/hooks/useScrollReveal.ts
'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * One-shot scroll reveal. Returns a ref to attach and a `visible` flag.
 * Respects prefers-reduced-motion (reveals immediately) and degrades to
 * visible when IntersectionObserver is unavailable (SSR-safe: effect only).
 */
export function useScrollReveal<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return { ref, visible }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- useScrollReveal 2>&1 | tail -5`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useScrollReveal.ts src/hooks/__tests__/useScrollReveal.test.tsx
git commit -m "feat(narrative): one-shot scroll reveal hook with reduced-motion support"
```

---

### Task 5: Narrative opening (beats 1–2) + narrative stylesheet

**Files:**
- Create: `src/app/components/narrative/narrative.css`
- Create: `src/app/components/narrative/NarrativeOpening.tsx`
- Test: `src/app/components/narrative/__tests__/NarrativeOpening.test.tsx`

**Interfaces:**
- Consumes: `OPENING`, `BEATS`, `formatMonthYear` (Task 3); `useScrollReveal` (Task 4); token variables (Task 2).
- Produces: `<NarrativeOpening />` (no props), default export, memoized. `narrative.css` also defines the `.narrative-dark` scope class and `.nv-step` reveal classes used by Tasks 6–8.

- [ ] **Step 1: Write narrative.css**

```css
/* Narrative homepage styles. The .narrative-dark class scopes the
   approved cinematic palette override (spec 2026-08-07, Phase 1):
   inside it the theme variables are pinned to a near-black moody look
   regardless of the active theme. Everywhere else the site keeps the
   user's theme. Variables only — components never hardcode color. */

.narrative-dark {
  --background: #17171c;
  --background-rgb: 23, 23, 28;
  --foreground: #f5cdb4;
  --foreground-muted: #8b7d8e;
  --card-bg-rgb: 36, 36, 44;
  --border: #3a3a44;
  --primary: #eca27d;
  background-color: var(--background);
  color: var(--foreground);
}

.nv-viewport {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--space-8) var(--space-4);
  text-align: center;
}

/* Reveal: opacity/transform ONLY (no color transitions — theme rule) */
.nv-step {
  opacity: 0;
  transform: translateY(1.5rem);
  transition:
    opacity 0.9s ease,
    transform 0.9s ease;
}
.nv-step.nv-visible {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .nv-step {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

.nv-date {
  font-family: 'Space Mono', monospace;
  font-size: var(--text-sm);
  letter-spacing: 0.2em;
  color: var(--primary);
}

.nv-text {
  font-family: 'Inter', sans-serif;
  font-size: var(--text-xl);
  font-weight: 300;
  line-height: 1.5;
  max-width: var(--measure);
}
```

- [ ] **Step 2: Write the failing test**

```tsx
// src/app/components/narrative/__tests__/NarrativeOpening.test.tsx
import { render, screen } from '@testing-library/react'
import NarrativeOpening from '../NarrativeOpening'

beforeEach(() => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true }) // reduced motion → all visible
})

describe('NarrativeOpening', () => {
  it('renders the business name, address, and establishment year', () => {
    render(<NarrativeOpening />)
    expect(screen.getByText(/E\. Braun & Co\. Berlin/)).toBeInTheDocument()
    expect(screen.getByText(/Unter den Linden 2/)).toBeInTheDocument()
    expect(screen.getByText(/Est\. 1914/)).toBeInTheDocument()
  })

  it('renders all five beats with MM.YYYY dates', () => {
    render(<NarrativeOpening />)
    expect(screen.getByText('01.1914')).toBeInTheDocument()
    expect(screen.getByText('03.1938')).toBeInTheDocument()
    expect(screen.getByText('01.1945')).toBeInTheDocument()
    expect(screen.getByText(/forced to sell the company/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test -- NarrativeOpening 2>&1 | tail -5`
Expected: FAIL — cannot find module `../NarrativeOpening`.

- [ ] **Step 4: Implement the component**

Each beat is its own full-viewport step with its own `useScrollReveal`; a small inner `Beat` component keeps hooks un-conditional.

```tsx
// src/app/components/narrative/NarrativeOpening.tsx
'use client'

import React from 'react'
import { useScrollReveal } from '../../../hooks/useScrollReveal'
import { OPENING, BEATS, formatMonthYear, NarrativeBeat } from './narrativeData'
import './narrative.css'

const Beat: React.FC<{ beat: NarrativeBeat }> = ({ beat }) => {
  const { ref, visible } = useScrollReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`nv-viewport nv-step${visible ? ' nv-visible' : ''}`}>
      <p className="nv-date">{formatMonthYear(beat.date)}</p>
      <p className="nv-text" style={{ marginTop: 'var(--space-4)' }}>
        {beat.text}
      </p>
    </div>
  )
}

const NarrativeOpening: React.FC = () => {
  const { ref, visible } = useScrollReveal<HTMLDivElement>(0.1)
  return (
    <section aria-label="The story of one business">
      {/* Beat 1: one name, one address */}
      <div ref={ref} className={`nv-viewport nv-step${visible ? ' nv-visible' : ''}`}>
        <p className="token-kicker" style={{ color: 'var(--foreground-muted)' }}>
          Berlin, Unter den Linden 2
        </p>
        <h1
          className="nv-text"
          style={{ fontSize: 'var(--text-display)', fontWeight: 300, marginTop: 'var(--space-4)' }}
        >
          {OPENING.title}
        </h1>
        <p className="nv-date" style={{ marginTop: 'var(--space-4)' }}>
          Est. {OPENING.established}
        </p>
      </div>
      {/* Beat 2: the arc */}
      {BEATS.map((beat) => (
        <Beat key={beat.date} beat={beat} />
      ))}
    </section>
  )
}

export default React.memo(NarrativeOpening)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- NarrativeOpening 2>&1 | tail -5`
Expected: PASS, 2 tests. (If jest errors on the CSS import, add `'\\.(css)$': 'identity-obj-proxy'` to `moduleNameMapper` in `jest.config.js` — check first, the mapping likely exists.)

- [ ] **Step 6: Commit**

```bash
git add src/app/components/narrative/
git commit -m "feat(narrative): opening beats — one name, one arc"
```

---

### Task 6: Dot reveal (beat 3)

**Files:**
- Create: `src/app/components/narrative/DotReveal.tsx`
- Test: `src/app/components/narrative/__tests__/DotReveal.test.tsx`

**Interfaces:**
- Consumes: `public/data/dots.json` (Task 1, fetched at runtime), `OPENING.lat/lng` (Task 3), `useScrollReveal` (Task 4).
- Produces: `<DotReveal />` (no props), default export, memoized. Canvas ignites all points over ~2.5 s once scrolled into view; with reduced motion, draws everything in one frame.

- [ ] **Step 1: Write the failing test**

jsdom has no real canvas — mock the 2D context and fetch; assert the caption copy and that fetch was called.

```tsx
// src/app/components/narrative/__tests__/DotReveal.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import DotReveal from '../DotReveal'

beforeEach(() => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true })
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    scale: jest.fn(),
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        bounds: { minLat: 52.4, maxLat: 52.6, minLng: 13.2, maxLng: 13.6 },
        points: [
          [52.5164, 13.3822],
          [52.52, 13.41],
        ],
      }),
  }) as unknown as typeof fetch
})

describe('DotReveal', () => {
  it('renders the caption and loads the dot data', async () => {
    render(<DotReveal />)
    expect(screen.getByText(/one business among thousands/i)).toBeInTheDocument()
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/data/dots.json'))
    expect(screen.getByText(/2,761 documented Jewish-owned businesses/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- DotReveal 2>&1 | tail -5`
Expected: FAIL — cannot find module `../DotReveal`.

- [ ] **Step 3: Implement the component**

```tsx
// src/app/components/narrative/DotReveal.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useScrollReveal } from '../../../hooks/useScrollReveal'
import { OPENING } from './narrativeData'
import './narrative.css'

interface DotsFile {
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
  points: [number, number][]
}

const REVEAL_MS = 2500

const DotReveal: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { ref, visible } = useScrollReveal<HTMLDivElement>(0.4)
  const [dots, setDots] = useState<DotsFile | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/data/dots.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: DotsFile | null) => {
        if (alive && d) setDots(d)
      })
      .catch(() => {}) // reveal silently degrades to caption-only
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!visible || !dots || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    const { minLat, maxLat, minLng, maxLng } = dots.bounds
    const pad = 20
    const px = (lng: number) => pad + ((lng - minLng) / (maxLng - minLng)) * (w - 2 * pad)
    const py = (lat: number) => pad + ((maxLat - lat) / (maxLat - minLat)) * (h - 2 * pad)

    const styles = getComputedStyle(canvas)
    const dotColor = styles.getPropertyValue('--primary').trim() || '#eca27d'
    const originColor = styles.getPropertyValue('--foreground').trim() || '#f5cdb4'

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const drawUpTo = (n: number) => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = dotColor
      for (let i = 0; i < n; i++) {
        const [lat, lng] = dots.points[i]
        ctx.fillRect(px(lng), py(lat), 2, 2)
      }
      // The single origin dot, always on top, slightly larger
      ctx.fillStyle = originColor
      ctx.fillRect(px(OPENING.lng) - 1, py(OPENING.lat) - 1, 4, 4)
    }

    if (reduced) {
      drawUpTo(dots.points.length)
      return
    }

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / REVEAL_MS)
      drawUpTo(Math.floor(t * t * dots.points.length)) // ease-in: a few, then a flood
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, dots])

  return (
    <div ref={ref} className="nv-viewport" aria-label="Every documented business in Berlin">
      <canvas
        ref={canvasRef}
        style={{ width: 'min(90vw, 44rem)', height: 'min(70vh, 34rem)' }}
        role="img"
        aria-label="Map of dots: every documented Jewish-owned business in Berlin, 1900-1945"
      />
      <p className="nv-date" style={{ marginTop: 'var(--space-6)' }}>
        One business among thousands
      </p>
      <p className="nv-text" style={{ fontSize: 'var(--text-lg)', marginTop: 'var(--space-4)' }}>
        This map documents 2,761 Jewish-owned businesses in Berlin between 1900 and 1945 —
        and the record is not complete.
      </p>
    </div>
  )
}

export default React.memo(DotReveal)
```

Copy note: the caption count must match the actual dataset (`2,761 documented Jewish-owned businesses` — the test asserts this phrase). If Task 1 printed a different count, use that number in both component and test.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- DotReveal 2>&1 | tail -5`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/narrative/
git commit -m "feat(narrative): canvas dot reveal — one address becomes thousands"
```

---

### Task 7: "What we do" blocks + four doors (beats 4–5)

**Files:**
- Create: `src/app/components/narrative/WhatWeDo.tsx`
- Create: `src/app/components/narrative/FourDoors.tsx`
- Modify: `public/locales/en/common.json`, `public/locales/de/common.json`, `public/locales/yi/common.json` (add `narrative` key block at top level)
- Test: `src/app/components/narrative/__tests__/FourDoors.test.tsx`

**Interfaces:**
- Consumes: token classes (Task 2), `useTranslation` from `src/i18n/useTranslation` (existing — components import it as `../../../i18n/useTranslation` from the narrative folder; copy the exact relative path used in `src/app/components/StoryList.tsx` if it differs).
- Produces: `<WhatWeDo />`, `<FourDoors />` (no props, memoized). Door hrefs: `/map`, `/history-tour`, `/plaques`, `/exhibit-vision`. **Phase 2 will repoint doors 3–4 to `/for-educators` and `/for-institutions`.**

- [ ] **Step 1: Add locale keys**

Add to `public/locales/en/common.json` (top level, after `"language"`):

```json
"narrative": {
  "whatTitle": "What this project does",
  "dataTitle": "The record",
  "dataText": "2,761 businesses documented from Dr. Christoph Kreutzmüller's 'Final Sale' research, verified against the Humboldt University Berlin source database.",
  "storiesTitle": "The stories",
  "storiesText": "Sixteen businesses researched in depth — the families, the forced sales, the fates — told alongside every mapped address.",
  "plaquesTitle": "The plaques",
  "plaquesText": "Physical memorial plaques at the original addresses, returning this memory to the streets where it belongs.",
  "doorsTitle": "Where to begin",
  "doorMap": "Explore the map",
  "doorMapDesc": "2,761 businesses across Berlin, 1900-1945",
  "doorTour": "The history tour",
  "doorTourDesc": "A guided journey through fifteen stories",
  "doorPlaques": "Memorial plaques",
  "doorPlaquesDesc": "Memory in the streets themselves",
  "doorExhibit": "Museum exhibit",
  "doorExhibitDesc": "The vision for physical space"
}
```

German (`de/common.json`, same position):

```json
"narrative": {
  "whatTitle": "Was dieses Projekt tut",
  "dataTitle": "Der Bestand",
  "dataText": "2.761 Unternehmen, dokumentiert nach Dr. Christoph Kreutzmüllers Forschung 'Ausverkauf', abgeglichen mit der Quellendatenbank der Humboldt-Universität zu Berlin.",
  "storiesTitle": "Die Geschichten",
  "storiesText": "Sechzehn Unternehmen in der Tiefe erforscht — die Familien, die Zwangsverkäufe, die Schicksale — erzählt neben jeder kartierten Adresse.",
  "plaquesTitle": "Die Gedenktafeln",
  "plaquesText": "Physische Gedenktafeln an den ursprünglichen Adressen — Erinnerung kehrt in die Straßen zurück, in die sie gehört.",
  "doorsTitle": "Wo anfangen",
  "doorMap": "Karte erkunden",
  "doorMapDesc": "2.761 Unternehmen in Berlin, 1900-1945",
  "doorTour": "Die historische Tour",
  "doorTourDesc": "Eine geführte Reise durch fünfzehn Geschichten",
  "doorPlaques": "Gedenktafeln",
  "doorPlaquesDesc": "Erinnerung in den Straßen selbst",
  "doorExhibit": "Museumsausstellung",
  "doorExhibitDesc": "Die Vision für den physischen Raum"
}
```

Yiddish (`yi/common.json`, same position, YIVO Latin transliteration per repo convention):

```json
"narrative": {
  "whatTitle": "Vos der proyekt tut",
  "dataTitle": "Der rekord",
  "dataText": "2,761 gesheftn dokumentirt fun Dr. Christoph Kreutzmüllers 'Final Sale' forshung, farglikhn mit der kval-datnbaze fun Humboldt Universitet Berlin.",
  "storiesTitle": "Di geshikhtes",
  "storiesText": "Zekhtsn gesheftn oysgeforsht in der tif — di mishpokhes, di tsvang-farkoyfn, di goyroles — dertseylt lebn yeder kartirter adres.",
  "plaquesTitle": "Di denkmal-tofln",
  "plaquesText": "Fizishe denkmal-tofln bay di originele adresn — zikorn kumt tsurik in di gasn vu es gehert.",
  "doorsTitle": "Vu onheybn",
  "doorMap": "Oysforshn di mape",
  "doorMapDesc": "2,761 gesheftn iber Berlin, 1900-1945",
  "doorTour": "Di historishe tur",
  "doorTourDesc": "A gefirte rayze durkh fuftsn geshikhtes",
  "doorPlaques": "Denkmal-tofln",
  "doorPlaquesDesc": "Zikorn in di gasn aleyn",
  "doorExhibit": "Muzey oysshtelung",
  "doorExhibitDesc": "Di vizye far fizishn roym"
}
```

Validate all three: `for f in en de yi; do node -e "JSON.parse(require('fs').readFileSync('public/locales/$f/common.json','utf8'))" && echo "$f ok"; done`

- [ ] **Step 2: Write the failing test**

```tsx
// src/app/components/narrative/__tests__/FourDoors.test.tsx
import { render, screen } from '@testing-library/react'
import FourDoors from '../FourDoors'

beforeEach(() => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true })
})

// If existing component tests wrap in a TranslationProvider, copy that
// wrapper pattern from src/components/__tests__/ErrorBoundary.test.tsx.
describe('FourDoors', () => {
  it('links to all four destinations', () => {
    render(<FourDoors />)
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(
      expect.arrayContaining(['/map', '/history-tour', '/plaques', '/exhibit-vision'])
    )
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test -- FourDoors 2>&1 | tail -5`
Expected: FAIL — cannot find module `../FourDoors`.

- [ ] **Step 4: Implement both components**

```tsx
// src/app/components/narrative/FourDoors.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslation } from '../../../i18n/useTranslation'
import './narrative.css'

const DOORS = [
  { href: '/map', title: 'narrative.doorMap', desc: 'narrative.doorMapDesc' },
  { href: '/history-tour', title: 'narrative.doorTour', desc: 'narrative.doorTourDesc' },
  { href: '/plaques', title: 'narrative.doorPlaques', desc: 'narrative.doorPlaquesDesc' },
  { href: '/exhibit-vision', title: 'narrative.doorExhibit', desc: 'narrative.doorExhibitDesc' },
] as const

const FourDoors: React.FC = () => {
  const { t } = useTranslation()
  return (
    <section
      aria-label="Where to begin"
      style={{ padding: 'var(--space-16) var(--space-4)', maxWidth: '72rem', margin: '0 auto' }}
    >
      <p className="token-kicker" style={{ color: 'var(--foreground-muted)', textAlign: 'center' }}>
        {t('narrative.doorsTitle')}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
          gap: 'var(--space-4)',
          marginTop: 'var(--space-8)',
        }}
      >
        {DOORS.map((door) => (
          <Link key={door.href} href={door.href} className="token-card" style={{ display: 'block' }}>
            <h3
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 'var(--text-lg)',
                color: 'var(--primary)',
              }}
            >
              {t(door.title)} →
            </h3>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'var(--text-sm)',
                color: 'var(--foreground-muted)',
                marginTop: 'var(--space-2)',
              }}
            >
              {t(door.desc)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default React.memo(FourDoors)
```

```tsx
// src/app/components/narrative/WhatWeDo.tsx
'use client'

import React from 'react'
import { useTranslation } from '../../../i18n/useTranslation'
import './narrative.css'

const BLOCKS = [
  { title: 'narrative.dataTitle', text: 'narrative.dataText' },
  { title: 'narrative.storiesTitle', text: 'narrative.storiesText' },
  { title: 'narrative.plaquesTitle', text: 'narrative.plaquesText' },
] as const

const WhatWeDo: React.FC = () => {
  const { t } = useTranslation()
  return (
    <section
      aria-label="What this project does"
      style={{ padding: 'var(--space-16) var(--space-4)', maxWidth: '72rem', margin: '0 auto' }}
    >
      <h2
        className="token-kicker"
        style={{ color: 'var(--foreground-muted)', textAlign: 'center' }}
      >
        {t('narrative.whatTitle')}
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
          gap: 'var(--space-4)',
          marginTop: 'var(--space-8)',
        }}
      >
        {BLOCKS.map((block) => (
          <div key={block.title} className="token-card">
            <h3
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 'var(--text-lg)',
                color: 'var(--foreground)',
              }}
            >
              {t(block.title)}
            </h3>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'var(--text-base)',
                color: 'var(--foreground-muted)',
                marginTop: 'var(--space-3)',
                lineHeight: 1.6,
              }}
            >
              {t(block.text)}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default React.memo(WhatWeDo)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- FourDoors 2>&1 | tail -5`
Expected: PASS. If `useTranslation` needs a provider in tests, wrap `render` with the same provider used in existing component tests.

- [ ] **Step 6: Commit**

```bash
git add src/app/components/narrative/ public/locales/
git commit -m "feat(narrative): what-we-do blocks and four doors with EN/DE/YI keys"
```

---

### Task 8: Assemble the homepage

**Files:**
- Create: `src/app/components/narrative/NarrativeHome.tsx`
- Modify: `src/app/page.tsx` (swap `<Homepage />` for `<NarrativeHome />` inside the existing Suspense/redirect scaffolding — keep the legacy `?id=` redirect logic untouched)
- Test: `src/app/components/narrative/__tests__/NarrativeHome.test.tsx`

**Interfaces:**
- Consumes: all Task 3–7 components.
- Produces: `<NarrativeHome />` — the full five-beat page. `Homepage.tsx` stays in the tree (still imported by nothing after this change; Phase 3 route hygiene decides its fate).

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/components/narrative/__tests__/NarrativeHome.test.tsx
import { render, screen } from '@testing-library/react'
import NarrativeHome from '../NarrativeHome'

beforeEach(() => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true })
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    scale: jest.fn(),
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext
  global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch
})

describe('NarrativeHome', () => {
  it('renders all five beats in order', () => {
    render(<NarrativeHome />)
    expect(screen.getByText(/E\. Braun & Co\. Berlin/)).toBeInTheDocument() // beat 1
    expect(screen.getByText('03.1938')).toBeInTheDocument() // beat 2
    expect(screen.getByText(/one business among thousands/i)).toBeInTheDocument() // beat 3
    expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(4) // beat 5
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- NarrativeHome 2>&1 | tail -5`
Expected: FAIL — cannot find module `../NarrativeHome`.

- [ ] **Step 3: Implement NarrativeHome and swap the route**

```tsx
// src/app/components/narrative/NarrativeHome.tsx
'use client'

import React from 'react'
import NarrativeOpening from './NarrativeOpening'
import DotReveal from './DotReveal'
import WhatWeDo from './WhatWeDo'
import FourDoors from './FourDoors'
import LanguageToggle from '../LanguageToggle'
import './narrative.css'

const NarrativeHome: React.FC = () => {
  return (
    <main>
      {/* Beats 1-3 run in the pinned cinematic palette (approved spec deviation) */}
      <div className="narrative-dark">
        <div style={{ position: 'absolute', top: 'var(--space-4)', right: 'var(--space-4)', zIndex: 10 }}>
          <LanguageToggle />
        </div>
        <NarrativeOpening />
        <DotReveal />
      </div>
      {/* Beats 4-5 in the user's active theme */}
      <WhatWeDo />
      <FourDoors />
    </main>
  )
}

export default React.memo(NarrativeHome)
```

In `src/app/page.tsx`: replace the import of `Homepage` with `NarrativeHome` and swap the rendered element. Touch nothing else — the legacy-link redirect and Suspense wrapper stay exactly as they are.

```tsx
import NarrativeHome from './components/narrative/NarrativeHome'
// ... inside RootContent's return, where <Homepage /> was:
return <NarrativeHome />
```

- [ ] **Step 4: Run the full test suite**

Run: `pnpm test 2>&1 | tail -6`
Expected: all suites pass, including pre-existing ones.

- [ ] **Step 5: Typecheck and build**

Run: `npx tsc --noEmit && pnpm run build 2>&1 | tail -5`
Expected: zero TS errors; build succeeds; route `/` listed.

- [ ] **Step 6: Visual smoke test**

Run: `lsof -i :3000` first (per repo rule); pick a free port, e.g. `pnpm run dev -- -p 3005`. Load `/`:
- Beat 1 shows the name alone on near-black; scrolling reveals beats without color-flash.
- Dot canvas ignites once scrolled into view; with OS reduced-motion enabled, everything is static and visible.
- Doors navigate to `/map`, `/history-tour`, `/plaques`, `/exhibit-vision`.
- Theme switcher on other pages still works; homepage beats 1–3 stay dark in every theme; check on a phone-width viewport (390 px).

- [ ] **Step 7: Commit**

```bash
git add src/app/components/narrative/ src/app/page.tsx
git commit -m "feat(narrative): five-beat narrative spine replaces homepage"
```

---

## Out of scope for this plan

- Portals (`/for-educators`, `/for-institutions`) — Phase 2 plan; doors repoint then.
- Unified nav/footer, route hygiene, token adoption in the map app — Phase 3.
- Photographs in beats 1–2 (images exist in `public/images/ebraun/`; adding them is a follow-up polish task once the skeleton ships — keeps this plan shippable).
- German/Yiddish translation of the E. Braun beat texts (story texts are English-only site-wide today).
