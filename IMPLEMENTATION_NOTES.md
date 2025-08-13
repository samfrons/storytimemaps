# StoryMaps Implementation Documentation

## Overview
This is a Next.js application that visualizes historical Jewish businesses in Berlin from 1900-1945. It features an interactive map with time-based filtering and a detailed business listing sidebar.

## Color Scheme & Styling

### Snazzy Maps-Inspired Palette
The application uses a custom color palette inspired by Snazzy Maps:
- **Background**: `#4a4a57` (lighter purple-gray)
- **Borders/UI**: `#6b6275` (light purple-gray)
- **Primary (Active)**: `#97d8c0` (mint green)
- **Warning (Declining)**: `#ffcb51` (golden yellow)
- **Danger (Closed)**: `#ee5760` (coral red)
- **Text**: `#f5cdb4` (light peach)
- **Accent**: `#eca27d` (orange for categories/clusters)
- **Secondary**: `#9dc8fc` (light blue)
- **Muted**: `#8b7d8e` (gray-purple for secondary text)

### Important Styling Rules
1. **NO BORDER RADIUS**: Never use border-radius or rounded corners unless explicitly requested (documented in CLAUDE.md)
2. **Typography**: Uses 'Space Mono' for monospace elements, 'Inter' for body text
3. **Tooltips**: Solid colors (no gradients) with state-based styling
4. **Connected markers**: Tooltips connect to map points via angled line and dot pointer

## Component Architecture

### MapboxMap Component (`/src/app/components/MapboxMap.tsx`)
- Uses `react-map-gl/mapbox` for map rendering
- Implements Supercluster for marker clustering
- Custom map styling applied on load to match color scheme
- Features:
  - Dynamic marker states based on time (active/declining/closed/future)
  - Custom cluster markers (32px circles with Space Mono font, weight 700)
  - Tooltip system with enhanced details on click
  - Custom zoom controls (Mapbox controls hidden)
  - Connected line and dot pointer system for precise location indication
  - Map label opacity reduction (to 20%) when tooltips are active
  - Pre-computed initial markers for immediate display

### StoryList Component (`/src/app/components/StoryList.tsx`)
- Implements `React.memo` with custom comparison function
- Uses throttled scroll handling (100ms) for performance
- Features:
  - Search and category filtering
  - Collapsible header for mobile (triggers at 50px scroll)
  - Active card highlighting with mint green accent (`#97d8c0/20` background)
  - Business detail modal system with origin-based animation
  - Synchronized scrolling with map interactions
  - Categories: business, institution, residence

### BusinessDetailModal Component (`/src/app/components/BusinessDetailModal.tsx`)
- Animated modal expanding from card origin
- Navigation between businesses with sliding transitions
- Features:
  - 95% viewport height for maximum content visibility
  - Cubic-bezier easing for smooth animations
  - Previous/Next navigation with slide effects (100px offset)
  - 600ms cleanup timeout for smooth closing
  - Action buttons: "View on Map" and "Share Location"

### TimeSlider Component (`/src/app/components/TimeSlider.tsx`)
- Custom-styled range input with no rounded corners
- Play/pause animation feature (100ms intervals)
- Date display format: MM.YYYY
- Color-coded legend for business states
- Fixed date range: 1920-1945
- React.memo optimized with comparison function

## State Management

### useStoryMapLogic Hook (`/src/hooks/useStoryMapLogic.ts`)
- Central business logic for marker states
- Determines business status based on current date:
  - **Future**: Before startDate (light peach `#f5cdb4`)
  - **Active**: Between startDate and midDate (mint green `#97d8c0`)
  - **Declining**: Between midDate and endDate (golden yellow `#ffcb51`)
  - **Closed**: After endDate (coral red `#ee5760`)

## Performance Optimizations

### 1. React.memo Implementation
- MapboxMap, StoryList, and TimeSlider all use React.memo
- Custom comparison functions prevent unnecessary re-renders
- Particularly important for map interactions

### 2. Dynamic Imports
- MapboxMap loaded dynamically with `next/dynamic`
- SSR disabled for map component
- Custom loading state with matching theme colors

### 3. Cluster Optimization
- Supercluster reduces marker rendering overhead
- Initial 40 markers pre-computed and shown before map loads
- Viewport-based clustering for performance
- useMemo for cluster calculations

### 4. Utility Functions (`/src/utils/performance.ts`)
- Throttle function for scroll events
- Debounce function for input handlers
- RequestIdleCallback polyfill for background tasks

### 5. Event Handling
- Scroll events throttled at 100ms
- Passive event listeners for better performance
- Proper cleanup in useEffect returns

## Data Structure

### StoryMap Type
```typescript
interface StoryMap {
  id: string;
  title: string;
  description: string | null;
  longDescription: string | null;
  lat: number;
  lng: number;
  address?: string;
  category?: 'business' | 'institution' | 'residence';
  startDate: string | null;
  midDate: string | null;
  endDate: string | null;
  media?: MediaItem[] | null;
  mediaLink?: string;
  imageUrls?: string[];
}
```

## Known Issues & Considerations

### Map Styling
- Custom styling applied after map loads (may cause brief flash)
- Individual layer modifications wrapped in try-catch
- Error handling prevents crashes from missing layers
- Map labels dynamically fade when tooltips appear

### Tooltip System
- Z-index: 999999 !important for guaranteed visibility
- Position: relative for proper stacking context
- Connected pointer system ensures precise location indication

### Business Detail Modal
- Expansion animation from card origin point
- 600ms cleanup timeout prevents animation glitches
- Sliding transitions for navigation between businesses
- Transform-based animations for performance

## File Structure

```
src/
├── app/
│   ├── components/
│   │   ├── MapboxMap.tsx           # Map visualization with clustering
│   │   ├── StoryList.tsx           # Business listing sidebar
│   │   ├── TimeSlider.tsx          # Time control component
│   │   ├── BusinessDetailModal.tsx # Animated detail view modal
│   │   ├── StoryDetail.tsx         # Business detail content
│   │   └── OptimizedImage.tsx      # Image optimization wrapper
│   ├── globals.css                 # Global styles and CSS variables
│   └── page.tsx                    # Main page component
├── hooks/
│   ├── useStoryMapLogic.ts        # Central business logic
│   ├── useMapFocus.ts              # Map focus management
│   └── useMarkerStates.ts         # Marker state calculations
├── utils/
│   ├── performance.ts              # Throttle/debounce utilities
│   └── fetchWithCache.ts          # Data fetching with cache
└── types.ts                        # TypeScript definitions
```

## Next.js Configuration

```javascript
// next.config.mjs
{
  transpilePackages: ['mapbox-gl', 'react-map-gl'],
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  }
}
```

## Environment Variables
- Mapbox token currently hardcoded (should move to .env)
- Token: `pk.eyJ1Ijoic2FtZnJvbnMiLCJhIjoiY21lOTU4cnlxMG5wbjJtcTVtcGc4aWhhaiJ9.V-JWJlxk2hksMuxe0wsolQ`
- Recommended: `NEXT_PUBLIC_MAPBOX_TOKEN` in .env.local

## Build & Deployment

### Common Issues
1. **TypeScript Errors**: 
   - Unused variables suppressed with eslint-disable comments
   - Strict null checks may require additional guards

2. **Syntax Errors**:
   - Watch for missing closing tags in JSX
   - Ensure proper string template literal syntax

3. **CSS Class Conflicts**:
   - Tailwind arbitrary values `[#hexcolor]` for custom colors
   - Inline styles take precedence for critical properties

## Testing Checklist

- [ ] Map loads without errors
- [ ] Markers appear and cluster properly
- [ ] Time slider updates marker states
- [ ] Date displays as MM.YYYY format
- [ ] Search and filtering work correctly
- [ ] Active card highlighting syncs with map
- [ ] Modal animations expand from card origin
- [ ] Modal navigation slides between businesses
- [ ] Map labels fade when tooltips appear
- [ ] Mobile responsive behavior works
- [ ] Throttled scroll performs smoothly
- [ ] No console errors in production build

## Browser Compatibility
- Modern browsers required (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- WebGL support required for Mapbox
- CSS Grid and Flexbox required
- ES6+ JavaScript features used throughout
- ResizeObserver API for responsive behavior

## Performance Metrics Target
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms

## Future Improvements

1. **Performance**:
   - Implement virtual scrolling for story list
   - Add intersection observer for lazy loading
   - Implement service worker for offline support
   - Consider WebGL marker rendering for 1000+ points

2. **Features**:
   - Add data export functionality (CSV/JSON)
   - Implement user preferences persistence
   - Add print-friendly view
   - Historical photo gallery integration
   - Multi-language support (German/English)

3. **Code Quality**:
   - Move Mapbox token to environment variables
   - Add comprehensive error boundaries
   - Implement structured logging system
   - Add unit tests for business logic
   - Add E2E tests for critical user flows