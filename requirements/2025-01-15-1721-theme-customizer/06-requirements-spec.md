# Theme Customizer Requirements Specification

**Date:** 2025-01-15 17:35
**Status:** Final

## Problem Statement
The user needs to easily modify theme colors without repeatedly asking for assistance when they notice issues. Currently, changing colors requires manually editing CSS variables in globals.css and understanding the complex relationships between UI variables and map styling functions.

## Solution Overview
Build a theme customizer page that provides:
- Visual interface for editing all 45+ CSS variables per theme
- Live preview of changes on both UI components and map
- Export/import functionality for complete theme definitions
- JavaScript style arrays specifically formatted for Mapbox GL JS

## Functional Requirements

### 1. Page Access and Layout
- **URL:** `/theme-customizer`
- **Layout:** Fixed sidebar panel sliding from right (not floating)
- **Toggle:** Button in main app to open/close customizer
- **Width:** 400px on desktop, full width on mobile

### 2. Theme Management
- **Theme Selection:** Dropdown to switch between 7 existing themes
- **No New Themes:** Cannot create new themes (per Q5 answer)
- **Reset Capability:** Button to reset each theme to defaults
- **Persistence:** Save customizations to localStorage

### 3. Color Organization
Based on Q7 answer and codebase analysis, group the 45+ variables:

**Core Colors:**
- --primary / --primary-rgb
- --primary-light
- --secondary
- --background / --background-rgb
- --foreground
- --foreground-muted

**State Colors:**
- --success (active businesses)
- --warning (declining businesses)
- --danger (closed businesses)
- --muted / --muted-rgb

**Accent Colors:**
- --accent-orange
- --accent-yellow
- --accent-green
- --accent-blue
- --accent-purple

**UI Components:**
- --border
- --shadow
- --input-bg / --input-bg-rgb
- --dropdown-bg
- --card-bg / --card-bg-rgb
- --placeholder-color
- --map-overlay

**Map-Specific Colors:**
- --map-label-color
- --map-road-color
- --map-building-color
- --map-water-color
- --map-park-color

**Text State Colors:**
- --active-text / --active-text-secondary
- --declining-text / --declining-text-secondary
- --closed-text / --closed-text-secondary

### 4. Color Controls
- **Input Type:** Color picker with hex input field
- **Live Updates:** Immediate application (no Apply button per Q8)
- **Format Support:** Hex, RGB, RGBA with opacity sliders
- **Copy Button:** Quick copy hex/rgb value to clipboard

### 5. Preview Features
- **Split View:** Show before/after or multiple themes side-by-side
- **Component Gallery:** Display all UI components (buttons, cards, modals)
- **Map Preview:** Miniature map showing style changes
- **State Simulation:** Toggle business states to see color applications

### 6. Export/Import
Per Q10 answer - export ALL variables:
```json
{
  "themeName": "moody",
  "timestamp": "2025-01-15T17:30:00Z",
  "variables": {
    "--primary": "#97d8c0",
    "--primary-rgb": "151, 216, 192",
    // ... all 45+ variables
  },
  "mapStyle": {
    "label": { "text-color": "#f5cdb4" },
    "road": { "line-color": "#6b6275" },
    // ... Mapbox style object
  }
}
```

### 7. Map Integration
- **JavaScript Array Generation:** Format colors for getThemeMapStyle()
- **WebGL Update:** Refresh map layers when colors change
- **Style Object:** Generate complete Mapbox style configuration
- **Copy Code:** Button to copy map style array to clipboard

## Technical Requirements

### 1. File Structure
```
src/app/theme-customizer/
├── page.tsx                 # Main customizer page
├── components/
│   ├── ThemeCustomizer.tsx  # Main customizer component
│   ├── ColorControl.tsx     # Individual color input
│   ├── ColorGroup.tsx       # Grouped color controls
│   ├── PreviewPanel.tsx     # Live preview area
│   ├── ExportPanel.tsx      # Export/import interface
│   └── MapStyleGenerator.tsx # Map style code generator
└── utils/
    ├── themeStorage.ts      # localStorage management
    ├── colorUtils.ts        # Color format conversions
    └── mapStyleBuilder.ts   # Generate Mapbox styles
```

### 2. State Management
```typescript
interface ThemeCustomizerState {
  selectedTheme: string;
  customVariables: Record<string, string>;
  isModified: boolean;
  previewMode: 'single' | 'split';
}
```

### 3. Performance Optimizations
- Debounce color updates by 100ms
- Use React.memo for all components
- Virtualize long color lists if needed
- Lazy load map preview component

### 4. Integration Points
- Read from `globals.css` for default values
- Update CSS variables on document.documentElement
- Call map.setStyle() for WebGL updates
- Sync with next-themes for theme switching

## Implementation Patterns

### 1. Color Variable Updates
```typescript
const updateCSSVariable = (name: string, value: string) => {
  document.documentElement.style.setProperty(name, value);
  if (name.includes('-rgb')) {
    // Handle RGB variant updates
  }
};
```

### 2. Map Style Generation
```typescript
const generateMapStyle = (variables: Record<string, string>) => {
  return {
    version: 8,
    layers: [
      {
        id: 'road',
        paint: {
          'line-color': variables['--map-road-color']
        }
      }
      // ... other layers
    ]
  };
};
```

### 3. Theme Reset
```typescript
const resetTheme = (themeName: string) => {
  const defaults = getThemeDefaults(themeName);
  Object.entries(defaults).forEach(([key, value]) => {
    updateCSSVariable(key, value);
  });
  localStorage.removeItem(`theme-custom-${themeName}`);
};
```

## Acceptance Criteria

1. ✅ User can modify any of the 45+ CSS variables per theme
2. ✅ Changes apply immediately without page refresh
3. ✅ Map updates reflect color changes in real-time
4. ✅ Can reset any theme to its original state
5. ✅ Can export complete theme configuration as JSON
6. ✅ Can generate JavaScript array for map styling
7. ✅ Customizations persist across sessions
8. ✅ Interface is intuitive with grouped color controls
9. ✅ Works on both desktop and mobile devices
10. ✅ No TypeScript errors or console warnings

## Next Steps
1. Create the theme-customizer page structure
2. Implement the ColorControl component with live updates
3. Build the preview panel with component gallery
4. Add map style generation and export functionality
5. Test across all 7 themes for consistency