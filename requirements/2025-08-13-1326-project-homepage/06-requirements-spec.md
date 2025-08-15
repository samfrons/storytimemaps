# Requirements Specification - Project Homepage

## Problem Statement
The StoryMaps application currently launches directly into the map visualization without any introduction or context. Users need a landing page that introduces the historical significance of the project, provides context about the Jewish businesses in Berlin (1900-1945), and offers a preview of the interactive map experience before entering the full application.

## Solution Overview
Create a bilingual (English/German) homepage that serves as an entry point to the StoryMaps application. The homepage will feature:
- Project introduction with historical context
- Animated carousel preview of business data
- Statistics dashboard showing collection scope
- Clear navigation to the full map application
- Responsive design maintaining the existing dark theme

## Functional Requirements

### 1. Routing Structure
- Move existing map application from `/` to `/map`
- Create new homepage component at root `/` route
- Maintain all existing routes under their current paths

### 2. Language Support
- Implement English/German bilingual content
- Add language toggle button in header
- Store language preference in localStorage
- Default to browser language if German, otherwise English

### 3. Animated Preview Section
- Auto-cycling carousel showcasing 5-8 businesses
- Display business name, type, address, and operational dates
- Transition between businesses every 4-5 seconds
- Include pause on hover functionality
- Use CSS transforms for smooth animations
- Show business state colors (active/declining/closed)

### 4. Statistics Dashboard
- Total number of businesses in dataset
- Time span covered (1900-1945)
- Business categories with counts
- Peak year for Jewish businesses
- Animated number counters on scroll into view

### 5. Content Sections
- **Hero Section**: Title, subtitle, language toggle
- **Introduction**: Historical context (2-3 paragraphs)
- **Preview**: Animated business carousel
- **Statistics**: Key metrics about the collection
- **Call-to-Action**: "Explore the Map" button

### 6. Visual Design
- Follow existing Snazzy Maps color palette
- NO border-radius (sharp corners only)
- NO blue focus outlines
- Background: #4a4a57
- Text: #f5cdb4 (primary), #8b7d8e (secondary)
- Accent colors for business states

## Technical Requirements

### 1. File Structure
```
src/app/
├── page.tsx (new homepage)
├── map/
│   └── page.tsx (relocated map application)
├── components/
│   ├── Homepage.tsx
│   ├── AnimatedBusinessCarousel.tsx
│   ├── StatisticsSection.tsx
│   └── LanguageToggle.tsx
└── i18n/
    ├── translations.ts
    └── useTranslation.ts
```

### 2. Performance Optimizations
- Wrap all components with React.memo()
- Use dynamic imports for heavy components
- Implement intersection observer for statistics animations
- Throttle scroll events
- Pre-load business data for carousel

### 3. Data Handling
- Fetch subset of businesses from public/jewish_businesses.geojson
- Select diverse business types for carousel
- Calculate statistics on build time or with useMemo

### 4. Animation Specifications
- Carousel transitions: 500ms ease-in-out
- Fade effects: opacity 0 to 1 over 300ms
- Statistics counters: 2s duration with easing
- Stagger animations for visual hierarchy

### 5. Responsive Design
- Mobile: Single column layout
- Tablet: 2-column for statistics
- Desktop: Full width with centered content (max-width: 1200px)

## Implementation Hints

### Component Patterns to Follow
```typescript
const Component: React.FC<Props> = ({ ...props }) => {
  // Hooks first
  // State declarations
  // Memoized values
  // Callbacks
  // Effects
  // Return JSX
}
export default React.memo(Component)
```

### Translation Structure
```typescript
const translations = {
  en: {
    hero: {
      title: "Jewish Businesses in Berlin",
      subtitle: "1900-1945: A Historical Journey"
    }
  },
  de: {
    hero: {
      title: "Jüdische Geschäfte in Berlin",
      subtitle: "1900-1945: Eine historische Reise"
    }
  }
}
```

### Animation Example
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Acceptance Criteria

### Must Have
- [x] Homepage loads at root route
- [x] Map application accessible at /map
- [x] Language toggle between English and German
- [x] Animated carousel with real business data
- [x] Statistics section with key metrics
- [x] Responsive on mobile, tablet, desktop
- [x] Maintains existing dark theme
- [x] No border-radius anywhere
- [x] No blue focus outlines

### Should Have
- [x] Smooth animations without jank
- [x] Carousel pauses on hover
- [x] Statistics animate on scroll
- [x] Language preference persists
- [x] Loading states for data

### Nice to Have
- [ ] Keyboard navigation for carousel
- [ ] Share buttons for social media
- [ ] Print-friendly version
- [ ] Skip intro option

## Assumptions
- Business data structure remains consistent
- Mapbox token remains valid
- No authentication required
- Modern browser support only (ES6+)
- No SEO requirements beyond basic meta tags

## Dependencies
- Existing Next.js and React setup
- Tailwind CSS for styling
- Business data from GeoJSON file
- Font families: Inter and Space Mono

## Timeline Estimate
- Homepage component: 2-3 hours
- Carousel implementation: 2-3 hours
- Statistics section: 1-2 hours
- Language support: 2-3 hours
- Testing and refinement: 2 hours
- **Total: 9-13 hours**

## Risk Mitigation
- **Performance**: Use React.memo and lazy loading
- **Animation jank**: Use CSS transforms, not position
- **Data loading**: Pre-compute statistics
- **Browser compatibility**: Test on major browsers
- **Language switching**: Simple key-based system

## Success Metrics
- Page load time < 2 seconds
- Smooth 60fps animations
- Zero console errors
- Accessible with keyboard navigation
- Clear visual hierarchy