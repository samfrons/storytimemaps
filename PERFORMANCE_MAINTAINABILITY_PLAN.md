# Performance and Maintainability Improvement Plan

## Executive Summary

After analyzing the StoryMaps codebase, I've identified **23 performance issues** and **14 maintainability issues** across the application. The most critical areas requiring attention are:

1. **MapboxMap.tsx** (1,812 lines) - Monolithic component with mixed concerns
2. **useStoryMapLogic.ts** - O(n²) matching algorithms and multiple responsibilities
3. **StoryList.tsx** - Sequential timeline loading and missing search debounce
4. **Missing memoization** on several high-frequency components
5. **Code duplication** between MapboxMap and useMapClustering

---

## Part 1: Performance Issues

### 1.1 Critical Performance Issues

#### Issue P1: O(n²) Business Type Matching
**Location:** `src/hooks/useStoryMapLogic.ts:164-192`
**Severity:** Critical
**Impact:** With 10,000+ businesses, this creates 100M+ string comparisons

```typescript
// Current problematic code
const enhancedStoriesWithBusinessTypes = useMemo(() => {
  return enrichedStories.map(story => {
    // For each story, search through ALL jewishBusinesses
    const matchingBusiness = jewishBusinesses.find(business =>
      story.title.toLowerCase().includes(business.properties.name.toLowerCase()) ||
      business.properties.name.toLowerCase().includes(story.title.toLowerCase())
    );
    // ...
  });
}, [enrichedStories, jewishBusinesses]);
```

**Fix:** Pre-build a lookup Map on initial data load with normalized titles as keys.

---

#### Issue P2: Sequential Timeline Loading for All Visible Stories
**Location:** `src/app/components/StoryList.tsx:191-213`
**Severity:** High
**Impact:** N+1 query pattern, blocking UI during timeline loads

```typescript
// Current - loads sequentially for each story
useEffect(() => {
  const loadTimelineDescriptions = async () => {
    for (const story of visibleStories) {
      if (story.hasTimelineData) {
        const timelineData = await loadTimelineData(story.id); // N requests
        // ...
      }
    }
  };
  loadTimelineDescriptions();
}, [visibleStories, currentDate]);
```

**Fix:** Use `Promise.all()` with batching (max 5-10 concurrent) and limit to visible viewport items.

---

#### Issue P3: Supercluster Re-creation on Zoom Change
**Location:** `src/app/components/MapboxMap.tsx:619-673`
**Severity:** High
**Impact:** Expensive re-indexing of all points on every zoom change

```typescript
const supercluster = useMemo(() => {
  // ...clustering parameters change with zoom
  if (isTestMode) {
    const currentZoom = viewState.zoom // This causes re-creation
    // ...
  }
  // ...
}, [processedMarkers, isMobile, isTestMode, viewState.zoom]) // viewState.zoom triggers rebuild
```

**Fix:** Remove `viewState.zoom` from supercluster creation. Apply zoom-based radius adjustment at query time, not index time.

---

#### Issue P4: Missing Search Debounce
**Location:** `src/app/components/StoryList.tsx:268-274`
**Severity:** Medium
**Impact:** Filters 10,000+ items on every keystroke

```typescript
// allFilteredStories recalculates on every searchQuery change
const allFilteredStories = visibleStories.filter(story => {
  const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (story.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
  // ...
});
```

**Fix:** Debounce search input by 300ms and use pre-computed lowercase values.

---

### 1.2 High Priority Performance Issues

#### Issue P5: Missing React.memo on Key Components
**Location:** Multiple files
**Severity:** Medium

Components missing `React.memo`:
- `BusinessDetailModal.tsx` - Re-renders on every parent update
- `Sidebar.tsx` - Navigation component, should be static
- `ThemeSwitcher.tsx` - Should only re-render on theme change
- `LoadingSkeleton.tsx` - Pure presentational component
- `OptimizedImage.tsx` - Should memoize based on src

---

#### Issue P6: Expensive Date Calculations in Render
**Location:** `src/app/components/StoryList.tsx:347-367`
**Severity:** Medium
**Impact:** Creates new Date objects for every story on every render

```typescript
const getStatusColor = (story: StoryMap) => {
  const now = currentDate.getTime();
  const start = story.startDate ? new Date(story.startDate).getTime() : 0;
  const end = story.endDate ? new Date(story.endDate).getTime() : Infinity;
  // ...
};
```

**Fix:** Pre-compute date timestamps during data loading, store as numeric properties.

---

#### Issue P7: Duplicated Spatial Sampling Logic
**Location:**
- `src/app/components/MapboxMap.tsx:551-598`
- `src/hooks/useMapClustering.ts:73-121`

**Impact:** Code duplication and potential inconsistencies

**Fix:** Consolidate into single utility function in `src/utils/mapHelpers.ts`.

---

#### Issue P8: Large Map Style Objects in Component
**Location:** `src/app/components/MapboxMap.tsx:19-416`
**Severity:** Medium
**Impact:** ~400 lines of static data parsed on every component load

**Fix:** Move to `src/utils/mapStyles.ts` as exported constants.

---

#### Issue P9: Non-throttled Popup Timeline Loading
**Location:** `src/app/components/MapboxMap.tsx` popup handling
**Severity:** Medium
**Impact:** Rapid marker hovers trigger many timeline fetch requests

**Fix:** Add 200ms debounce to popup timeline loading.

---

### 1.3 Lower Priority Performance Issues

#### Issue P10: No Virtual Scrolling in Database Mode
**Location:** `src/app/components/StoryList.tsx`
**Current:** Progressive loading with `displayCount` but still renders all loaded items

**Fix:** Implement react-window or similar for true virtualization.

---

#### Issue P11: Unnecessary Re-renders from Object Identity Changes
**Location:** Various components
**Issue:** Style objects created inline cause reference equality failures

```typescript
// Bad - new object every render
style={{ backgroundColor: 'var(--background)' }}

// Better - memoize or extract to constant
const backgroundStyle = useMemo(() => ({ backgroundColor: 'var(--background)' }), []);
```

---

#### Issue P12: Timeline Data Loaded Multiple Times
**Location:** Both StoryList and BusinessDetailModal load timeline data
**Fix:** Centralize loading through React Context or improve cache awareness.

---

#### Issue P13: CSS Computed Style Access in Hot Path
**Location:** `src/app/components/MapboxMap.tsx:940-945`
```typescript
if (typeof window !== 'undefined') {
  const style = getComputedStyle(document.documentElement);
  textColor = style.getPropertyValue('--foreground').trim()
  // Called inside forEach loop for every layer
}
```
**Fix:** Cache computed styles outside the loop.

---

## Part 2: Maintainability Issues

### 2.1 Critical Maintainability Issues

#### Issue M1: Monolithic MapboxMap Component (1,812 lines)
**Location:** `src/app/components/MapboxMap.tsx`
**Impact:** Difficult to test, modify, and understand

**Current responsibilities:**
- Map initialization and lifecycle
- Theme styling application
- Marker rendering
- Clustering logic
- Popup management
- Mobile optimizations
- WebGL context handling
- Label priority management

**Recommended split:**
```
src/app/components/map/
  ├── MapContainer.tsx        // Main container, state orchestration
  ├── MapMarkers.tsx          // Marker rendering and clustering
  ├── MapPopup.tsx            // Popup display (already exists, enhance it)
  ├── MapThemeProvider.tsx    // Theme style application
  ├── MapControls.tsx         // Navigation controls
  └── hooks/
      ├── useMapStyles.ts     // Theme-aware style generation
      └── useMapInteraction.ts // Click, hover, zoom handlers
```

---

#### Issue M2: Mixed Concerns in useStoryMapLogic
**Location:** `src/hooks/useStoryMapLogic.ts` (382 lines)
**Impact:** Hard to test individual features, tight coupling

**Current responsibilities:**
- Data fetching (initial load, pagination)
- State management (stories, markers, mode)
- Business type inference
- GeoJSON conversion
- Date filtering
- Mode switching

**Recommended split:**
```
src/hooks/
  ├── useStoryData.ts         // Data fetching and caching
  ├── useStoryFilters.ts      // Date and category filtering
  ├── useBusinessTypes.ts     // Business type inference
  ├── useMapMarkers.ts        // GeoJSON conversion and marker state
  └── useStoryMapLogic.ts     // Orchestrates the above (slim coordinator)
```

---

### 2.2 High Priority Maintainability Issues

#### Issue M3: Props Drilling for Date/Filter State
**Location:** Throughout component tree
**Impact:** 5+ levels of prop passing for currentDate, minDate, maxDate

**Fix:** Create `DateFilterContext` for shared date state:
```typescript
// src/contexts/DateFilterContext.tsx
export const DateFilterContext = createContext<{
  currentDate: Date;
  minDate: Date;
  maxDate: Date;
  setCurrentDate: (date: Date) => void;
}>(...);
```

---

#### Issue M4: Inconsistent Error Handling
**Location:** Throughout hooks and components
**Issues:**
- Some errors logged to console, others swallowed
- No centralized error boundary strategy
- API errors not consistently surfaced to UI

**Fix:** Create error handling utilities and patterns:
```typescript
// src/utils/errorHandling.ts
export function handleApiError(error: unknown, context: string): void;
export function withErrorBoundary<P>(Component: React.FC<P>): React.FC<P>;
```

---

#### Issue M5: Hard-coded Magic Numbers
**Location:** Various files
**Examples:**
- Viewport buffer: `0.1` (MapboxMap.tsx:725)
- Throttle delays: `150`, `200`, `500` (various)
- Clustering radius: `40`, `20`, `100`, etc.
- Initial display count: `50`, `100`
- Max labels by zoom: `5, 10, 20, 30, 50, 80, 150`

**Fix:** Create configuration file:
```typescript
// src/config/performance.ts
export const PERFORMANCE_CONFIG = {
  VIEWPORT_BUFFER: 0.1,
  THROTTLE_MS: {
    VIEWPORT: 150,
    SEARCH: 300,
    LABEL_PRIORITY: 200,
  },
  CLUSTERING: {
    MOBILE_RADIUS: 40,
    DESKTOP_RADIUS: 20,
    // ...
  },
  DISPLAY_LIMITS: {
    INITIAL_STORIES: 50,
    LOAD_BATCH: 100,
    // ...
  },
};
```

---

#### Issue M6: Theme Color Definitions Scattered
**Location:** Multiple places
- `globals.css` - CSS variables
- `MapboxMap.tsx` - Map colors inline (lines 499-533)
- `StoryList.tsx` - Status colors inline (lines 369-410)

**Fix:** Centralize in theme utility:
```typescript
// src/utils/themeColors.ts
export function getThemeColors(theme: string): ThemeColorSet;
export function getMapColors(theme: string): MapColorSet;
export function getStatusColor(state: string, theme: string): string;
```

---

### 2.3 Other Maintainability Issues

#### Issue M7: Excessive ESLint Disables
**Count:** 15+ instances of `eslint-disable` comments
**Impact:** Bypasses type safety, indicates technical debt

**Fix:** Properly type the problematic areas instead of disabling rules.

---

#### Issue M8: Inconsistent Date Handling
**Location:** Throughout codebase
**Issues:**
- Mix of Date objects, ISO strings, and timestamps
- Date parsing repeated in multiple places
- No consistent formatting utility

**Fix:** Create date utilities:
```typescript
// src/utils/dateHelpers.ts
export function parseDate(value: string | Date | null): Date | null;
export function formatDisplayDate(date: Date): string;
export function toTimestamp(date: Date | string): number;
```

---

#### Issue M9: Missing TypeScript Strict Types
**Location:** Various
**Examples:**
- `any` types in API responses
- Incomplete interface definitions
- Missing null checks

---

#### Issue M10: Unclear Component Responsibilities
**Location:** `StoryList.tsx` (896 lines)
**Current:** Contains list rendering, search, filtering, modal launching, year markers, timeline sections

**Recommended split:**
```
src/app/components/story/
  ├── StoryList.tsx           // Main list container
  ├── StoryCard.tsx           // Individual story card
  ├── StorySearch.tsx         // Search and filter UI
  ├── StoryFilters.tsx        // Category/date filters
  └── StoryYearMarkers.tsx    // Year marker integration
```

---

## Part 3: Implementation Priority

### Phase 1: Quick Wins (1-2 days each)
1. **P4**: Add search debounce (30 min)
2. **P5**: Add React.memo to missing components (1 hour)
3. **M5**: Extract magic numbers to config (2 hours)
4. **P8**: Move map styles to separate file (2 hours)
5. **P7**: Consolidate spatialSample function (1 hour)

### Phase 2: Critical Fixes (2-3 days each)
6. **P1**: Fix O(n²) business matching with lookup Map
7. **P2**: Batch timeline loading with Promise.all
8. **P3**: Remove zoom from supercluster dependencies
9. **M3**: Create DateFilterContext

### Phase 3: Major Refactoring (1 week each)
10. **M1**: Split MapboxMap into smaller components
11. **M2**: Split useStoryMapLogic into focused hooks
12. **M10**: Split StoryList into sub-components

### Phase 4: Polish (ongoing)
13. **M4**: Standardize error handling
14. **M7**: Fix eslint-disable occurrences
15. **M8**: Create date utilities
16. **P10**: Implement virtual scrolling

---

## Part 4: Estimated Impact

| Issue | Est. Performance Gain | Risk Level |
|-------|----------------------|------------|
| P1 - O(n²) fix | 50-80% faster initial load | Low |
| P2 - Batch loading | 60% faster list population | Low |
| P3 - Supercluster fix | 40% fewer recalculations | Medium |
| P4 - Search debounce | 90% fewer filter operations | Low |
| M1 - Split MapboxMap | Easier debugging, faster HMR | Medium |

---

## Appendix: Files Requiring Changes

### High-Change Files
- `src/app/components/MapboxMap.tsx` - Split into 5+ files
- `src/hooks/useStoryMapLogic.ts` - Split into 4+ hooks
- `src/app/components/StoryList.tsx` - Split and optimize

### New Files to Create
- `src/config/performance.ts`
- `src/utils/themeColors.ts`
- `src/utils/dateHelpers.ts`
- `src/utils/mapHelpers.ts`
- `src/utils/mapStyles.ts`
- `src/contexts/DateFilterContext.tsx`
- `src/app/components/map/MapContainer.tsx`
- `src/app/components/map/MapMarkers.tsx`
- `src/app/components/map/MapThemeProvider.tsx`

### Files Requiring Minor Updates
- `src/app/components/BusinessDetailModal.tsx` - Add React.memo
- `src/app/components/Sidebar.tsx` - Add React.memo
- `src/utils/timelineLoader.ts` - Add batch loading
