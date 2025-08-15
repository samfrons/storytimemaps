# Context Findings

## Current Implementation Analysis

### CSS Architecture
- **CSS Variables**: Already using CSS variables in `:root` (globals.css:7-26)
- **Tailwind CSS**: v3.4.1 with custom color mappings to CSS variables
- **Dark Mode**: Basic dark mode selector exists but identical to light mode
- **Font System**: Using Inter and Space Mono fonts with CSS variables

### Component Structure
- **Main Components**: MapboxMap, StoryList, BusinessDetailModal, TimeSlider, StoryDetail
- **Styling Pattern**: Mix of Tailwind classes and hardcoded colors
- **No Theme Context**: No existing theme provider or context

### Files Requiring Modification
1. `/src/app/globals.css` - Define theme variables
2. `/src/app/layout.tsx` - Add theme provider wrapper
3. `/src/app/mapStyle.ts` - Map styles for different themes
4. All component files with hardcoded colors:
   - `StoryList.tsx` - Uses hardcoded colors like #97d8c0, #f5cdb4
   - `BusinessDetailModal.tsx` - Hardcoded background/text colors
   - `TimeSlider.tsx` - Hardcoded indicator colors
   - `MapboxMap.tsx` - Map marker colors

### Current Color Palette
- Primary: #97d8c0 (mint green)
- Secondary: #ee5760 (coral red)
- Background: #4a4a57 (dark purple-gray)
- Foreground: #f5cdb4 (peach)
- Muted: #8b7d8e (muted purple)
- Border: #6b6275 (purple-gray)
- Accents: orange (#eca27d), yellow (#ffcb51), purple (#9dc8fc)

### Storage & Persistence
- No current localStorage usage
- No cookie implementation
- Need to implement persistence mechanism

### Map Integration
- Custom map style in mapStyle.ts
- Mapbox GL JS v3.14.0
- Map colors hardcoded in style object

## Recommended Approach

### Theme System Architecture
1. **CSS Variables**: Continue using CSS variables for performance
2. **next-themes**: Implement next-themes library for theme management
3. **Theme Presets**: Create 3-4 predefined themes
4. **localStorage**: Use for persistence across sessions

### Implementation Strategy
1. Install next-themes package
2. Create theme provider component
3. Define theme presets in CSS
4. Create theme switcher component
5. Update all hardcoded colors to use variables
6. Create themed map styles

### Theme Preset Ideas
1. **Dark Berlin** (current theme) - dark, moody, historical
2. **Light Archive** - light, clean, document-like
3. **Sepia Memory** - warm, vintage, nostalgic
4. **High Contrast** - accessibility focused

### Performance Considerations
- CSS variables update without re-renders
- Lazy load map style changes
- Minimize theme switching animations
- Preload theme preferences on server

### Map Theme Integration (Future)
- Create style objects for each theme
- Switch map styles dynamically
- Coordinate marker colors with themes
- Consider performance impact of style switching