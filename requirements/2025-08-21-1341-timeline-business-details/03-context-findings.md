# Context Findings

## Codebase Analysis Results

### Current Data Structure
The `StoryMap` interface in `src/types.ts` is well-established:
```typescript
export interface StoryMap {
  id: string;
  title: string;
  description: string | null;
  longDescription: string | null;
  media?: MediaItem[] | null;  // Already supports time-agnostic media
  startDate: string | null;    // Business opening
  midDate: string | null;      // Takeover/decline date
  endDate: string | null;      // Business closure
  // ... other fields
}

export interface MediaItem {
  url: string;
  caption?: string;
  type?: 'image' | 'video';
}
```

### Timeline Integration Points

**1. Time State Calculation (`useStoryMapLogic.ts:269-292`)**
```typescript
const testMarkers = useMemo(() => {
  const year = currentDate.getFullYear();
  return baseMarkers.map(marker => {
    let state = 'active';
    if (year < marker.startYear) {
      state = 'future';
    } else if (year > marker.endYear) {
      state = 'closed';
    } else if (marker.midYear && year >= marker.midYear) {
      state = 'declining';
    }
    return { ...cleanMarker, state };
  });
}, [baseMarkers, currentDate]);
```

**2. Timeline Component (`TimeSlider.tsx:16-44`)**
- Accepts `currentDate` and `onChange` props
- Provides smooth month-by-month animation
- Already integrated with business state system

**3. Business Detail Display (`StoryDetail.tsx:13-334`)**
- Shows static business information
- Uses `story.media` array for image gallery
- Has smooth transitions for media switching (`setSelectedMediaIndex`)

### Transition System Patterns

**1. Modal Transitions (`BusinessDetailModal.tsx:52-61`)**
```typescript
const [isTransitioning, setIsTransitioning] = useState(false);

useEffect(() => {
  if (isTransitioning) {
    setShowContent(false);
    setTimeout(() => {
      setShowContent(true);
      setIsTransitioning(false);
    }, 300);
  }
}, [story.id, isTransitioning]);
```

**2. Carousel Transitions (`AnimatedBusinessCarousel.tsx:33-42`)**
```typescript
const interval = setInterval(() => {
  setIsTransitioning(true);
  setTimeout(() => {
    setCurrentIndex((prev) => (prev + 1) % businesses.length);
    setIsTransitioning(false);
  }, 300);
}, 4500);
```

### Data Loading Architecture

**Primary Data Sources:**
- `data/storymaps.json` - Main detailed stories (20+ entries)
- `jewish_businesses.geojson` - Full database (4000+ entries)
- API routes: `/api/storymaps` and `/api/storymaps-test`

**Loading Strategy (`useStoryMapLogic.ts:69-138`):**
- Loads both detailed and full datasets upfront
- Language-aware loading (English from GeoJSON, German from API)
- No background loading for "stable clustering"

### File Organization Patterns
- Main components: `src/app/components/`
- Types: `src/types.ts` 
- Hooks: `src/hooks/`
- Data: `data/` directory with JSON files
- Public assets: `public/images/` with business-specific folders

### Performance Considerations
- React.memo usage throughout codebase
- useMemo for expensive calculations
- Transition durations: 300ms standard, 500-700ms for modals
- Business data pre-computed for immediate display

### Historical Sensitivity Requirements
From `CLAUDE.md`: "Treat all business data with respect", "Maintain historical accuracy", "Present information objectively"

## Integration Opportunities

**1. Extend MediaItem Interface**
Current structure already supports captions and types - can be extended for date ranges.

**2. Leverage Existing Transition System**
`isTransitioning` pattern can be reused for timeline-based content changes.

**3. Timeline-Specific Data Files**
Following existing pattern: create `data/timeline/` directory for time-varying content.

**4. State Integration**
Time-varying content should work alongside existing business state calculation.

## Technical Constraints

**1. Backward Compatibility**
Current businesses without timeline data must continue to work unchanged.

**2. Performance**
Large dataset (4000+ businesses) requires efficient timeline data loading.

**3. Memory Usage**
Timeline data should load on-demand rather than all upfront.

**4. Smooth UX**
Must maintain 300ms transition standard and polished feel.

## Similar Features Found

**1. Media Gallery System (`StoryDetail.tsx:85-138`)**
- Multiple media items with thumbnails
- Smooth switching between items
- Captions and metadata support

**2. Business State Transitions**
- Color coding based on timeline position
- Real-time updates as timeline changes
- Smooth visual feedback

**3. Modal Content Updates (`BusinessDetailModal.tsx`)**
- Content fading during story changes
- Navigation between different businesses
- Maintaining scroll position and state