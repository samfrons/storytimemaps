# Theming Guidelines

## Core Principle: Always Use CSS Variables

**Never hardcode colors** - Always use CSS variables so themes can properly override colors.

## CSS Variable Structure

### Primary Variables (Required for all themes)
```css
--primary: #hexcolor;           /* Main theme color */
--primary-rgb: R, G, B;         /* RGB values for transparency */
--primary-light: #hexcolor;     /* Lighter variant */
--secondary: #hexcolor;         /* Secondary accent */
--warning: #hexcolor;           /* Warning state */
--danger: #hexcolor;            /* Error/danger state */
--success: #hexcolor;           /* Success state */
```

### Background & Text
```css
--background: #hexcolor;        /* Main background */
--background-rgb: R, G, B;      /* For transparency */
--foreground: #hexcolor;        /* Main text color */
--foreground-muted: #hexcolor;  /* Muted text */
--muted: #hexcolor;            /* Muted elements */
--border: #hexcolor;           /* Border color */
```

## Usage Examples

### In React Components

#### ❌ WRONG - Hardcoded colors
```tsx
style={{
  backgroundColor: '#97d8c0',
  color: '#2a2a2a'
}}
```

#### ✅ CORRECT - Using variables
```tsx
style={{
  backgroundColor: 'var(--primary)',
  color: 'var(--foreground)'
}}
```

### For Transparency
```tsx
// Using RGB variables for transparency
style={{
  backgroundColor: 'rgba(var(--primary-rgb), 0.85)'
}}
```

### Theme-Conditional Styling
```tsx
// When certain themes need different treatment
color: theme === 'cool' || theme === 'cold' ? '#ffffff' : 'var(--foreground)'
```

## Popup & Tooltip Styling

### Active State
- Background: `var(--primary)` or `rgba(var(--primary-rgb), 0.98)`
- Text: `var(--foreground)`
- Border: `var(--primary)`

### Declining State  
- Background: `var(--warning)` or `rgba(255, 203, 81, 0.98)`
- Text: Contrasting color based on background
- Border: `var(--warning)`

### Closed State
- Background: `var(--danger)` or `rgba(238, 87, 96, 0.98)`
- Text: Usually white for contrast
- Border: `var(--danger)`

## Map Markers & Clusters

### Clusters
```tsx
// Theme-aware cluster styling
const getClusterStyle = () => {
  switch(theme) {
    case 'moody':
      return {
        backgroundColor: 'var(--foreground)', // Peach for moody
        border: '3px solid var(--border)',
        color: 'var(--background)'
      }
    // Other themes...
  }
}
```

### Marker States
```tsx
const colors = getThemeColors()
// Use theme colors object
colors.active   // Active business
colors.declining // Declining business  
colors.closed   // Closed business
```

## Component Backgrounds

### Cards & Lists
```tsx
// Inactive state
backgroundColor: 'var(--card-bg, rgba(107, 98, 117, 0.4))'

// Active/selected state
backgroundColor: 'rgba(var(--primary-rgb), 0.85)'
```

### Inputs & Dropdowns
```tsx
backgroundColor: 'var(--input-bg, rgba(107, 98, 117, 0.5))'
borderColor: 'var(--border)'
```

## Testing Theme Changes

When adding new features:
1. Test with moody theme (default dark theme)
2. Test with bauhaus theme (light theme with strong colors)
3. Test with cool/cold themes (blue-based)
4. Ensure text contrast is readable in all themes

## Common Mistakes to Avoid

1. **Don't use hex colors directly** - Always use variables
2. **Don't forget RGB variables** - Needed for transparency
3. **Don't assume text color** - Use `var(--foreground)`
4. **Don't hardcode state colors** - Use semantic variables (primary, warning, danger)
5. **Don't mix shorthand and longhand** - Use specific border properties when needed

## Adding New Themes

When creating a new theme, ensure ALL these variables are defined:
- All color variables (primary, secondary, etc.)
- RGB equivalents for transparency
- Special variables for dropdowns/cards if needed
- Test all components for proper color inheritance