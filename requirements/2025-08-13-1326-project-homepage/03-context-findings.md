# Context Findings - Project Homepage

## Current Architecture Analysis

### Routing Structure
- **Next.js App Router** (v15.4.6) with React 18
- Current main map application lives at `/` (src/app/page.tsx)
- Existing routes:
  - `/` - Main map application
  - `/theme-preview` - Theme selection page with Link navigation
  - `/jewish-businesses` - Alternative map view
  - `/business-details-test` - Testing page

### Data Structure
- **GeoJSON format** for business data (public/jewish_businesses.geojson)
- Business properties include:
  - name, business_type, category, address
  - date_range, registration_date, dissolution_date
  - coordinates for map positioning
- TypeScript interfaces defined in src/types.ts (StoryMap, MarkerData)

### Styling System
- **Tailwind CSS** with custom color palette in globals.css
- CSS variables for theming (recently added ThemeProvider)
- Fonts: Inter for body, Space Mono for data display
- Consistent dark theme colors:
  - Background: #4a4a57
  - Borders: #6b6275
  - Success/Active: #97d8c0
  - Warning/Declining: #ffcb51
  - Danger/Closed: #ee5760
  - Text: #f5cdb4 (primary), #8b7d8e (secondary)

### Animation Patterns Found
- **BusinessDetailModal**: Complex expand/collapse animations
  - Uses transform scale and translate
  - Transition durations: 300-700ms
  - Fade transitions for content: opacity changes
  - Backdrop blur effects
- **Theme Preview page**: hover:shadow-xl transitions
- **Map components**: Smooth marker transitions
- CSS transition utilities throughout

### Component Patterns
- Dynamic imports for heavy components (MapboxMap)
- React.memo usage for optimization
- Custom hooks for business logic (useStoryMapLogic)
- Modular component structure with clear separation

## Files That Need Modification

### Required Changes
1. **src/app/page.tsx**
   - Move current map application to new route
   - Replace with new homepage component

2. **New file: src/app/map/page.tsx**
   - Destination for relocated map application
   - Import existing Home component logic

3. **New file: src/app/components/Homepage.tsx**
   - Main homepage component
   - Preview section with animations
   - Project introduction content

4. **New file: src/app/components/AnimatedPreview.tsx**
   - Animated content showcase component
   - Data visualization animations

5. **Update: src/app/layout.tsx**
   - Metadata might need updating for homepage

## Similar Features Analyzed

### Theme Preview Page Pattern
- Grid layout for showcasing options
- Color palette display
- Status indicators (ready/pending)
- Link navigation to sub-routes
- Clean card-based design

### BusinessDetailModal Animation
- Sophisticated expand animations from origin point
- Fade-in content after expansion
- Backdrop blur for focus
- Smooth transitions between states

## Technical Constraints

1. **Performance Requirements** (from CLAUDE.md):
   - Components must be wrapped with React.memo()
   - Use useMemo for expensive calculations
   - Throttle/debounce event handlers
   - Dynamic imports for heavy components

2. **Design Constraints**:
   - NO border-radius (sharp edges only)
   - NO blue focus outlines
   - Must follow exact color palette
   - Monospace font for data display

3. **Historical Sensitivity**:
   - Respectful presentation of data
   - Educational focus
   - Avoid sensationalization

## Integration Points

1. **Data Loading**:
   - Can fetch from public/jewish_businesses.geojson
   - Or use API route at /api/storymaps

2. **Navigation**:
   - Use Next.js Link component
   - Maintain existing routing patterns

3. **State Management**:
   - Keep state close to usage
   - Consider context for deep hierarchies

4. **Animation Libraries**:
   - Currently using CSS transitions
   - No external animation libraries detected

## Recommended Implementation Approach

1. Create homepage at root with animated preview section
2. Relocate map to /map route
3. Use CSS transforms for smooth animations
4. Display 3-5 sample businesses with staggered animations
5. Include timeline visualization showing date progression
6. Add call-to-action button linking to full map