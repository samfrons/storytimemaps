# Theming and Routing Guide for StoryMaps

## For Theme-Consistency-Architect Agent

This guide documents the theming system, URL-based theme management, and routing patterns for maintaining theme consistency across the application.

## URL-Based Theme Management

### CRITICAL: All Themes Must Be in URL
The application uses URL query parameters to manage theme state. This ensures bookmarkable, shareable links with the correct theme applied.

### URL Structure
- **`/?theme=moody`** - Default Moody theme (dark, moody atmosphere)
- **`/?theme=bauhaus`** - Bauhaus theme (primary colors, geometric)
- **`/?theme=cool`** - Cool theme (blues and grays)
- **`/?theme=warm`** - Warm theme (oranges and browns)
- **`/?theme=hot`** - Hot theme (reds and oranges)
- **`/?theme=cold`** - Cold theme (icy blues)
- **`/?theme=art-nouveau`** - Art Nouveau theme (muted greens, golds)

### Combined States
- **`/?about=true&theme=bauhaus`** - About panel open with Bauhaus theme
- **`/?about=true&theme=moody`** - About panel open with Moody theme

## Implementation Requirements

### 1. Always Include Theme in URL
```typescript
// BAD - missing theme
router.push('/');

// GOOD - includes theme
router.push('/?theme=moody');
```

### 2. Preserve Theme When Updating Other Parameters
```typescript
const updateURLParams = useCallback((updates: { about?: boolean; theme?: string }) => {
  const params = new URLSearchParams(searchParams.toString());
  
  // Update only what's needed, preserve the rest
  if (updates.about !== undefined) {
    if (updates.about) {
      params.set('about', 'true');
    } else {
      params.delete('about');
    }
  }
  
  if (updates.theme !== undefined) {
    // Always show theme in URL
    if (updates.theme) {
      params.set('theme', updates.theme);
    }
  }
  
  const queryString = params.toString();
  router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
}, [router, searchParams]);
```

### 3. Initial Load Theme Setting
On initial load, if no theme parameter exists, set it to moody:
```typescript
useEffect(() => {
  if (!mounted) return;
  
  const themeParam = searchParams.get('theme');
  if (!themeParam) {
    // Set default theme in URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('theme', 'moody');
    const queryString = params.toString();
    router.replace(`/?${queryString}`, { scroll: false });
  }
}, [searchParams, mounted, router]);
```

## Theme Consistency Across Components

### 1. CSS Variable System
All themes are defined using CSS variables in `globals.css`:

```css
[data-theme="bauhaus"] {
  --primary: #0066ff;
  --primary-rgb: 0, 102, 255;
  --background: #f5f5f0;
  --foreground: #000000;
  /* ... etc */
}
```

### 2. Component Theme Usage
Components should NEVER hardcode colors:
```typescript
// BAD
style={{ backgroundColor: '#4a4a57' }}

// GOOD
style={{ backgroundColor: 'var(--background)' }}
```

### 3. Map Theme Integration
Maps require special handling as Mapbox needs hex values:

```typescript
const getMapColors = () => {
  if (theme === 'bauhaus') {
    return {
      water: '#0066ff',
      parks: '#ffcc00',
      buildings: '#ffffff',
      roads: '#000000'
    };
  }
  // ... other themes
};
```

## Theme Switching Flow

### 1. User Clicks Theme Button
```typescript
const handleThemeSwitch = (newTheme: string) => {
  // Update URL first
  updateURLParams({ theme: newTheme });
  // Then update theme provider
  setTheme(newTheme);
};
```

### 2. URL Changes Trigger Theme Update
```typescript
useEffect(() => {
  const themeParam = searchParams.get('theme');
  if (themeParam && validThemes.includes(themeParam)) {
    setTheme(themeParam);
  }
}, [searchParams, setTheme]);
```

### 3. Theme Provider Applies Classes
The `next-themes` provider automatically adds `data-theme` attribute to HTML.

## Navigation Requirements

### Home Button
Always navigates to moody theme:
```typescript
const goHome = () => {
  router.push('/?theme=moody');
  // ... other logic
};
```

### Theme Switcher
Updates URL with selected theme:
```typescript
<button onClick={() => handleThemeSwitch('bauhaus')}>
  Bauhaus
</button>
```

### About/Info Toggle
Preserves current theme:
```typescript
const toggleInfo = () => {
  updateURLParams({ about: !showInfo });
  // Theme stays in URL
};
```

## WebGL and Map Styling

### Theme-Specific Map Styles
Each theme has custom map styling:

1. **Moody** - Dark base with muted colors
2. **Bauhaus** - High contrast black/white with primary colors
3. **Hot** - Custom Snazzy Maps style with red tones
4. **Cool/Cold** - Blue-tinted layers with reduced contrast

### Applying Map Themes
```typescript
const applyThemeStyles = (map: mapboxgl.Map) => {
  if (theme === 'hot' || theme === 'bauhaus') {
    // These use complete custom styles
    return;
  }
  
  // Apply color modifications to default style
  const colors = getMapColors();
  // ... apply to layers
};
```

## Testing Theme Consistency

### Checklist for Theme Changes
- [ ] Theme appears in URL (`?theme=themeName`)
- [ ] Browser back/forward maintains theme
- [ ] Refreshing page keeps theme
- [ ] All UI elements use CSS variables
- [ ] Map colors match theme
- [ ] Text remains legible
- [ ] Focus states are visible
- [ ] Mobile view maintains theme

### Common Issues to Avoid

1. **Hydration Mismatches**
   - Use `mounted` check before theme operations
   - Wrap in Suspense when using `useSearchParams`

2. **Theme Flash**
   - Set `suppressHydrationWarning` on html element
   - Use `disableTransitionOnChange={false}` in ThemeProvider

3. **Map Style Conflicts**
   - Check `map.isStyleLoaded()` before modifications
   - Use `requestAnimationFrame` for WebGL operations

## Theme Development Workflow

### Adding a New Theme

1. Define CSS variables in `globals.css`:
```css
[data-theme="new-theme"] {
  --primary: #hexcolor;
  /* all variables */
}
```

2. Add to theme list in `layout.tsx`:
```typescript
themes={['moody', 'cool', 'warm', 'hot', 'cold', 'bauhaus', 'art-nouveau', 'new-theme']}
```

3. Add map colors in `MapboxMap.tsx`:
```typescript
if (theme === 'new-theme') {
  return { /* color mappings */ };
}
```

4. Update theme switcher UI to include new option

5. Test all URL combinations with new theme

## Performance Considerations

### Optimize Theme Switching
- Use `requestAnimationFrame` for batch updates
- Throttle map style changes to prevent flashing
- Memoize theme-dependent calculations

### Reduce Re-renders
- Use `React.memo` for theme-dependent components
- Implement proper dependency arrays in hooks
- Avoid inline style objects that recreate on each render

## Accessibility

### Theme Requirements
- Maintain WCAG AA contrast ratios
- Ensure focus indicators are visible in all themes
- Test with screen readers
- Support prefers-reduced-motion

### Testing Tools
- Chrome DevTools contrast checker
- WAVE accessibility extension
- Lighthouse audits per theme

## Summary

The theming system is URL-driven to ensure consistency and shareability. Every theme change updates the URL, and every URL change updates the theme. This creates a single source of truth that works with browser navigation, bookmarks, and shared links.

Remember: **The URL is the state, and the state is the URL.**