# Requirements Specification: Theme Options Feature

## Problem Statement
Users currently cannot customize the visual appearance of the StoryMap application. The interface uses a single dark theme with hardcoded colors throughout the codebase, limiting accessibility and user preference options.

## Solution Overview
Implement a comprehensive theming system that allows users to select from 6 artistic theme presets. The system will use CSS variables for performance, next-themes library for management, and localStorage for persistence.

## Functional Requirements

### Theme Selection
- **FR1**: Users can choose from 6 predefined themes: cool, warm, hot, cold, bauhaus, art-nouveau
- **FR2**: Theme selection persists across browser sessions using localStorage
- **FR3**: Theme changes apply instantly without page reload
- **FR4**: Default theme is set programmatically (not system preference)

### Theme Switcher UI
- **FR5**: Theme switcher component placed in top navigation area
- **FR6**: Switcher displays current theme name/icon
- **FR7**: Dropdown/modal shows all 6 theme options with preview colors
- **FR8**: Smooth color transitions (200-300ms) when switching themes

### Theme Coverage
- **FR9**: All UI components use theme colors (no hardcoded values)
- **FR10**: Map styles eventually adapt to selected theme (future enhancement)
- **FR11**: Marker colors coordinate with theme palette

## Technical Requirements

### Implementation Architecture
- **TR1**: Use next-themes library (npm install next-themes)
- **TR2**: Wrap app with ThemeProvider in layout.tsx
- **TR3**: Define all 6 themes as CSS variable sets in globals.css
- **TR4**: Create ThemeSwitcher component with dropdown UI

### File Modifications Required
- **TR5**: `/src/app/layout.tsx` - Add ThemeProvider wrapper
- **TR6**: `/src/app/globals.css` - Define theme variable sets
- **TR7**: Create `/src/app/components/ThemeSwitcher.tsx`
- **TR8**: Update all components to use CSS variables:
  - StoryList.tsx (hardcoded #97d8c0, #f5cdb4, etc.)
  - BusinessDetailModal.tsx (background/text colors)
  - TimeSlider.tsx (indicator colors)
  - MapboxMap.tsx (marker colors)
  - StoryDetail.tsx (any hardcoded colors)

### Theme Definitions
- **TR9**: Each theme defines these CSS variables:
  ```css
  --primary, --primary-light, --secondary
  --background, --foreground
  --muted, --border
  --warning, --danger, --success
  --accent-1, --accent-2, --accent-3
  --map-bg, --map-roads, --map-buildings
  ```

### Performance Considerations
- **TR10**: Use CSS variable updates (no React re-renders)
- **TR11**: Transition duration limited to 200-300ms
- **TR12**: Preload theme on server to prevent flash

## Theme Palette Specifications

### Cool Theme
- Blues, teals, purples
- Professional, modern feel
- Good for data visualization

### Warm Theme
- Oranges, yellows, warm browns
- Inviting, comfortable atmosphere
- Good for storytelling

### Hot Theme
- Reds, oranges, bright yellows
- High energy, attention-grabbing
- Good for highlighting important data

### Cold Theme
- Icy blues, whites, grays
- Minimal, clean aesthetic
- Good for focus and clarity

### Bauhaus Theme
- Primary colors (red, blue, yellow)
- Black, white, geometric
- Bold, modernist style

### Art Nouveau Theme
- Muted greens, browns, golds
- Organic, flowing colors
- Vintage, artistic feel

## Implementation Steps

1. Install next-themes package
2. Create theme CSS variable definitions
3. Add ThemeProvider to layout
4. Create ThemeSwitcher component
5. Replace all hardcoded colors with variables
6. Test theme switching functionality
7. Add smooth transitions
8. Implement localStorage persistence

## Acceptance Criteria

- [ ] All 6 themes are selectable and distinct
- [ ] Theme persists on page refresh
- [ ] No hardcoded colors remain in components
- [ ] Smooth transitions between themes
- [ ] Theme switcher is accessible in navigation
- [ ] Default theme loads without flash
- [ ] All UI elements respond to theme changes
- [ ] Marker colors match theme palette

## Future Enhancements

- Custom theme creator
- Map style synchronization
- Theme-specific animations
- Accessibility mode themes
- Time-based automatic theme switching
- Export/import custom themes