# Supplementary Methodologies & Testing Strategies

## Overview

This document provides actionable methodologies for addressing unconventional patterns identified in the Architecture Analysis Report. Each methodology includes implementation steps, validation criteria, and success metrics.

---

## 1. Theme System Validation Methodology

### 1.1 Automated Theme Testing

**Create test file:** `/src/__tests__/theme-system.test.ts`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { useRouter } from 'next/navigation';

describe('Theme System', () => {
  it('should read theme from URL on mount', async () => {
    mockSearchParams({ theme: 'cool' });
    render(<ThemeAwareComponent />);
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'cool');
    });
  });

  it('should not flash wrong theme on hydration', () => {
    // Use SSR render with theme='moody' in URL
    // Verify no intermediate theme state
  });

  it('should update URL when theme changes', () => {
    // Change theme via UI
    // Verify URL updated with router.replace, not push
  });
});
```

### 1.2 Visual Regression Testing

**Setup Playwright for theme screenshots:**

```typescript
// e2e/theme-visual.spec.ts
import { test, expect } from '@playwright/test';

const themes = ['moody', 'hot', 'cold', 'warm', 'cool', 'bauhaus', 'art-nouveau', 'hoefe'];

for (const theme of themes) {
  test(`theme ${theme} renders correctly`, async ({ page }) => {
    await page.goto(`/?theme=${theme}`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`theme-${theme}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });
}
```

### 1.3 Theme Flash Detection

```typescript
// src/utils/themeFlashDetector.ts (development only)
export function detectThemeFlash() {
  if (process.env.NODE_ENV !== 'development') return;

  let lastTheme: string | null = null;
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'data-theme') {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (lastTheme && lastTheme !== currentTheme) {
          console.warn(`Theme flash detected: ${lastTheme} -> ${currentTheme}`);
          console.trace();
        }
        lastTheme = currentTheme;
      }
    }
  });

  observer.observe(document.documentElement, { attributes: true });
}
```

---

## 2. API Cache Improvement Methodology

### 2.1 Implement TTL-Based Cache

```typescript
// src/lib/cache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}

export const apiCache = new SimpleCache();
```

### 2.2 Refactor API Route

```typescript
// src/app/api/storymaps/route.ts
import { apiCache } from '@/lib/cache';

const CACHE_KEY = 'storymaps';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  let data = apiCache.get<StoryMap[]>(CACHE_KEY);

  if (!data) {
    const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf8');
    data = JSON.parse(fileContent);
    apiCache.set(CACHE_KEY, data, CACHE_TTL);
  }

  return Response.json({ data });
}

// POST endpoint for cache invalidation (admin only)
export async function POST(request: Request) {
  const { action } = await request.json();
  if (action === 'invalidate-cache') {
    apiCache.invalidate(CACHE_KEY);
    return Response.json({ success: true });
  }
}
```

---

## 3. Device Capability Detection Enhancement

### 3.1 Fallback Detection Matrix

```typescript
// src/hooks/useMobileOptimizations.ts - Enhanced version
export function useMobileOptimizations() {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(getDefaultCapabilities);

  useEffect(() => {
    const detect = async () => {
      const caps: DeviceCapabilities = {
        tier: 'high',
        memory: null,
        cores: null,
        connection: null,
        reducedMotion: false,
        screenSize: 'desktop',
      };

      // Primary detection (experimental APIs)
      if ('deviceMemory' in navigator) {
        caps.memory = (navigator as any).deviceMemory;
      }

      if ('hardwareConcurrency' in navigator) {
        caps.cores = navigator.hardwareConcurrency;
      }

      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        caps.connection = {
          effectiveType: conn?.effectiveType,
          saveData: conn?.saveData,
        };
      }

      // Fallback detection
      caps.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      caps.screenSize = window.innerWidth < 768 ? 'mobile' :
                        window.innerWidth < 1024 ? 'tablet' : 'desktop';

      // Calculate tier
      caps.tier = calculateTier(caps);

      setCapabilities(caps);
    };

    detect();
  }, []);

  return capabilities;
}

function calculateTier(caps: DeviceCapabilities): 'low' | 'medium' | 'high' {
  // Low tier: reduced motion OR low memory OR mobile with slow connection
  if (caps.reducedMotion) return 'low';
  if (caps.memory && caps.memory < 4) return 'low';
  if (caps.connection?.saveData) return 'low';
  if (caps.connection?.effectiveType === '2g') return 'low';

  // Medium tier: mobile OR limited cores OR medium connection
  if (caps.screenSize === 'mobile') return 'medium';
  if (caps.cores && caps.cores < 4) return 'medium';
  if (caps.connection?.effectiveType === '3g') return 'medium';

  return 'high';
}
```

### 3.2 Capability-Based Feature Flags

```typescript
// src/contexts/CapabilityContext.tsx
const CapabilityContext = createContext<CapabilityFlags>({
  enableAnimations: true,
  enableWebGL: true,
  maxMarkers: 100,
  clusteringEnabled: true,
  imageQuality: 'high',
});

export function CapabilityProvider({ children }: { children: React.ReactNode }) {
  const capabilities = useMobileOptimizations();

  const flags: CapabilityFlags = useMemo(() => {
    switch (capabilities.tier) {
      case 'low':
        return {
          enableAnimations: false,
          enableWebGL: false,
          maxMarkers: 30,
          clusteringEnabled: true,
          imageQuality: 'low',
        };
      case 'medium':
        return {
          enableAnimations: true,
          enableWebGL: true,
          maxMarkers: 60,
          clusteringEnabled: true,
          imageQuality: 'medium',
        };
      default:
        return {
          enableAnimations: true,
          enableWebGL: true,
          maxMarkers: 100,
          clusteringEnabled: false,
          imageQuality: 'high',
        };
    }
  }, [capabilities.tier]);

  return (
    <CapabilityContext.Provider value={flags}>
      {children}
    </CapabilityContext.Provider>
  );
}
```

---

## 4. SSR Fallback Generation

### 4.1 Build-Time Fallback Script

```javascript
// scripts/generate-ssr-fallbacks.js
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../public/locales');
const OUTPUT_FILE = path.join(__dirname, '../src/i18n/ssr-fallbacks.json');

function generateFallbacks() {
  const englishDir = path.join(LOCALES_DIR, 'en');
  const namespaces = fs.readdirSync(englishDir).filter(f => f.endsWith('.json'));

  const fallbacks = {};

  for (const namespace of namespaces) {
    const ns = namespace.replace('.json', '');
    const content = JSON.parse(
      fs.readFileSync(path.join(englishDir, namespace), 'utf8')
    );

    flattenObject(content, ns, fallbacks);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fallbacks, null, 2));
  console.log(`Generated ${Object.keys(fallbacks).length} SSR fallbacks`);
}

function flattenObject(obj, prefix, result) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      flattenObject(value, path, result);
    } else {
      result[path] = value;
    }
  }
}

generateFallbacks();
```

### 4.2 Add to Build Pipeline

```json
// package.json
{
  "scripts": {
    "prebuild": "node scripts/generate-ssr-fallbacks.js",
    "build": "next build"
  }
}
```

### 4.3 Update Translation Hook

```typescript
// src/i18n/useTranslationNew.ts
import ssrFallbacks from './ssr-fallbacks.json';

const t = useCallback((path: string): string => {
  if (typeof window === 'undefined' || !i18n?.isInitialized) {
    return ssrFallbacks[path] || path;
  }
  return i18n.t(path);
}, []);
```

---

## 5. URL State Management Refactor

### 5.1 Centralized URL State Hook

```typescript
// src/hooks/useUrlState.ts
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

type UrlState = {
  theme: string | null;
  lang: string | null;
  id: string | null;
  about: boolean;
};

export function useUrlState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state: UrlState = useMemo(() => ({
    theme: searchParams.get('theme'),
    lang: searchParams.get('lang'),
    id: searchParams.get('id'),
    about: searchParams.get('about') === 'true',
  }), [searchParams]);

  const updateUrl = useCallback((updates: Partial<UrlState>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === false) {
        params.delete(key);
      } else if (typeof value === 'boolean') {
        params.set(key, 'true');
      } else {
        params.set(key, value);
      }
    }

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [searchParams, router, pathname]);

  const clearParam = useCallback((key: keyof UrlState) => {
    updateUrl({ [key]: null });
  }, [updateUrl]);

  return { state, updateUrl, clearParam };
}
```

### 5.2 Usage Example

```typescript
// In component
const { state, updateUrl } = useUrlState();

// Read state
const currentTheme = state.theme;
const selectedBusiness = state.id;

// Update state (replaces, doesn't push to history)
updateUrl({ theme: 'cool', id: 'business-123' });

// Clear single param
updateUrl({ about: false });
```

---

## 6. Performance Monitoring Setup

### 6.1 Core Web Vitals Tracking

```typescript
// src/lib/vitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

type MetricHandler = (metric: { name: string; value: number; id: string }) => void;

export function initVitals(onMetric: MetricHandler) {
  onCLS(onMetric);
  onFID(onMetric);
  onFCP(onMetric);
  onLCP(onMetric);
  onTTFB(onMetric);
}

// Usage in layout.tsx
initVitals((metric) => {
  console.log(metric);
  // Send to analytics
  if (process.env.NEXT_PUBLIC_ANALYTICS_ID) {
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify(metric),
    });
  }
});
```

### 6.2 React Render Tracking

```typescript
// src/components/RenderTracker.tsx (development only)
import { Profiler, ProfilerOnRenderCallback } from 'react';

const renderLog: Map<string, number[]> = new Map();

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  if (!renderLog.has(id)) {
    renderLog.set(id, []);
  }
  renderLog.get(id)!.push(actualDuration);

  if (actualDuration > 16) { // Longer than 1 frame
    console.warn(`Slow render: ${id} took ${actualDuration.toFixed(2)}ms`);
  }
};

export function withRenderTracking<P extends object>(
  Component: React.ComponentType<P>,
  id: string
) {
  return function TrackedComponent(props: P) {
    if (process.env.NODE_ENV !== 'development') {
      return <Component {...props} />;
    }

    return (
      <Profiler id={id} onRender={onRender}>
        <Component {...props} />
      </Profiler>
    );
  };
}

// Usage
export default withRenderTracking(MapboxMap, 'MapboxMap');
```

---

## 7. Testing Checklists

### 7.1 Theme System Checklist

- [ ] Theme persists across page refreshes
- [ ] Theme shareable via URL
- [ ] No flash on initial load
- [ ] No flash on navigation
- [ ] Theme changes instantly (no transition)
- [ ] All 8 themes render correctly
- [ ] Text readable in all themes
- [ ] Map styling matches theme

### 7.2 Hydration Safety Checklist

- [ ] No React hydration warnings in console
- [ ] useIsMounted pattern applied to all theme-dependent UI
- [ ] Server and client render match
- [ ] Translation fallbacks work on server

### 7.3 Performance Checklist

- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Initial bundle < 300KB
- [ ] No unnecessary re-renders (check Profiler)
- [ ] Memoization effective (stable references)

---

## 8. Maintenance Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| Review ESLint disabled rules | Monthly | Tech Lead |
| Update SSR fallbacks | After translation changes | Automation |
| Cache TTL review | Quarterly | Backend |
| Performance audit | Monthly | Performance Team |
| Visual regression review | Per PR | CI/CD |
| Device capability API support check | Quarterly | Frontend |

---

## 9. Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Theme flash incidents | Unknown | 0 | Visual regression tests |
| Hydration warnings | Unknown | 0 | CI console monitoring |
| Cache hit rate | Unknown | >90% | API logging |
| LCP (p75) | Unknown | <2.0s | Web Vitals |
| Memoization effectiveness | Unknown | >80% | React Profiler |

---

*Document maintained by: Engineering Team*
*Last updated: February 2026*
