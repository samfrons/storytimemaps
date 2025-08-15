# Context Findings

## Current Theme System Architecture

### CSS Variables Structure
The theme system uses CSS custom properties (variables) defined in `/src/app/globals.css`. Each theme has approximately 45+ variables:

#### Core Color Variables:
- `--primary`, `--primary-rgb`, `--primary-light`
- `--secondary`
- `--warning`, `--warning-rgb`
- `--danger`, `--danger-rgb`
- `--success`, `--success-rgb`
- `--background`, `--background-rgb`
- `--foreground`, `--foreground-muted`
- `--muted`, `--muted-rgb`
- `--border`
- `--shadow`

#### Accent Colors:
- `--accent-orange`
- `--accent-yellow`
- `--accent-purple`
- `--accent-coral`
- `--accent-navy`
- `--accent-chartreuse`

#### Component-Specific:
- `--input-bg`, `--input-bg-rgb`
- `--dropdown-bg`, `--dropdown-bg-rgb`
- `--card-bg`, `--card-bg-rgb`
- `--placeholder-color`
- `--map-overlay`

#### Text Colors for States:
- `--active-text`, `--active-text-secondary`
- `--declining-text`, `--declining-text-secondary`
- `--closed-text`, `--closed-text-secondary`

### Map Styling System
Located in `/src/app/components/MapboxMap.tsx`:

1. **Custom Styles**: Bauhaus and Hot themes have complete custom Mapbox styles
2. **Dynamic Styles**: Other themes modify standard Mapbox styles at runtime
3. **Map Colors**: Separate functions `getThemeMapStyle()` and `getMapColors()` handle map theming
4. **Map Elements**: water, parks, roads, buildings, background

### Files That Need Modification

#### Primary Files:
- `/src/app/globals.css` - All CSS variables defined here
- `/src/app/components/MapboxMap.tsx` - Map styling logic
- `/src/app/components/ThemeSwitcher.tsx` - Current theme switcher

#### Secondary Files Using Theme Variables:
- `/src/app/components/StoryList.tsx` - Uses theme context for conditional styling
- `/src/app/components/StoryDetail.tsx` - Uses CSS variables for styling
- `/src/app/components/BusinessDetailModal.tsx` - Uses CSS variables
- `/src/app/components/TimeSlider.tsx` - Theme-aware component

### Current Theme List
1. moody (default)
2. cool
3. warm
4. hot
5. cold
6. bauhaus
7. art-nouveau

### Technical Constraints

1. **Next.js App Router**: Using app directory structure
2. **Theme Provider**: Using next-themes for theme management
3. **Storage**: Theme preference stored in localStorage via next-themes
4. **CSS Variables**: All colors must be CSS variables for runtime switching
5. **Map Constraints**: Mapbox requires hex colors, not CSS variables

### Similar Features Analyzed

1. **ThemeSwitcher Component** (`/src/app/components/ThemeSwitcher.tsx`):
   - Dropdown UI pattern
   - Uses `useTheme` hook from next-themes
   - Mounted state handling for SSR

2. **Theme Application**:
   - CSS variables on `:root` and `[data-theme]` selectors
   - Runtime style application for Mapbox
   - Special handling for hot theme with additional classes

### Integration Points

1. **Theme Context**: Accessible via `useTheme()` hook
2. **CSS Variable Access**: Can use `getComputedStyle(document.documentElement)`
3. **Map Integration**: Need to trigger map style updates when colors change
4. **Component Re-rendering**: Theme changes trigger automatic re-renders

### Patterns to Follow

1. **Color Input**: Use native color pickers for simplicity
2. **Live Preview**: Apply changes via CSS variables immediately
3. **Export Format**: JSON structure matching current CSS variable names
4. **Import/Export**: Use File API for JSON download/upload
5. **Persistence**: Store customizations in localStorage separately from theme preference