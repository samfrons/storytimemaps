# Claude Code Instructions for StoryMaps Project

## Project Context
This is a historical data visualization project showing Jewish businesses in Berlin from 1900-1945. The application must be respectful and historically accurate while providing an engaging user experience.

## Critical Design Rules

### 1. NO BORDER RADIUS
- **NEVER** use border-radius or rounded corners in any styling unless explicitly requested by the user
- Default to sharp, rectangular edges for all UI elements (cards, buttons, inputs, modals, etc.)
- This is a deliberate design choice for a more professional, document-like appearance

### 2. Color Palette (Snazzy Maps Inspired)
Always use these specific colors:
- Background: `#4a4a57`
- Borders: `#6b6275`
- Active/Success: `#97d8c0` (mint green)
- Warning/Declining: `#ffcb51` (golden yellow)
- Danger/Closed: `#ee5760` (coral red)
- Text Primary: `#f5cdb4` (light peach)
- Text Secondary: `#8b7d8e` (muted purple)
- Accent: `#eca27d` (orange)

### 3. Typography
- Monospace fonts: Use 'Space Mono' for all data displays, labels, and technical text
- Body text: Use 'Inter' for descriptions and longer content
- Font weights: 400 for regular, 600-700 for emphasis

## Performance Requirements

### Always Apply These Optimizations
1. Wrap all components with `React.memo()` when they receive props
2. Use `useMemo()` for expensive calculations, especially with arrays/objects
3. Throttle scroll events at 100-150ms
4. Debounce search/input handlers at 300-500ms
5. Use dynamic imports for heavy components (maps, modals)

### Map-Specific Rules
- Pre-compute initial markers for immediate display
- Limit initial display to 40 markers
- Use viewport-based clustering
- Fade map labels when tooltips are active

## Code Style Guidelines

### Component Structure
```typescript
// Always use this pattern for components
const ComponentName: React.FC<Props> = ({ ...props }) => {
  // Hooks first
  // State declarations
  // Memoized values
  // Callbacks
  // Effects
  // Return JSX
}

export default React.memo(ComponentName)
```

### State Management
- Keep state as close to usage as possible
- Use custom hooks for complex logic
- Avoid prop drilling - consider context for deep hierarchies

### Error Handling
- Wrap map layer modifications in try-catch blocks
- Provide fallback UI for loading states
- Log errors to console in development only

## Data Handling

### Business State Logic
The time-based state system is critical:
- **Active**: Business is operating normally (mint green)
- **Declining**: Business is struggling (golden yellow)  
- **Closed**: Business has shut down (coral red)
- **Future**: Not yet opened at current date (light peach)

### Date Formats
- Display format: MM.YYYY (e.g., "03.1933")
- Storage format: ISO 8601 strings
- Always validate dates before display

## Testing Checklist
Before any commit, verify:
- [ ] No border-radius used anywhere
- [ ] Colors match the defined palette exactly
- [ ] Components are memoized
- [ ] Event handlers are throttled/debounced
- [ ] Map loads without console errors
- [ ] Modal animations are smooth
- [ ] Time slider updates all components

## Common Pitfalls to Avoid

1. **Don't use PNG for photos** - Use WebP or AVIF
2. **Don't import entire libraries** - Use specific imports
3. **Don't calculate in render** - Use useMemo
4. **Don't use inline styles for animations** - Use CSS transforms
5. **Don't forget cleanup** in useEffect returns
6. **Don't hardcode tokens** - Move to environment variables

## Mapbox Specific

### Current Token (move to .env)
```
pk.eyJ1Ijoic2FtZnJvbnMiLCJhIjoiY21lOTU4cnlxMG5wbjJtcTVtcGc4aWhhaiJ9.V-JWJlxk2hksMuxe0wsolQ
```

### Style Application
- Apply custom styles after map loads
- Use dark-v11 as base style
- Modify layers individually with error handling

## File Naming Conventions
- Components: PascalCase (e.g., `BusinessDetailModal.tsx`)
- Hooks: camelCase with 'use' prefix (e.g., `useStoryMapLogic.ts`)
- Utils: camelCase (e.g., `performance.ts`)
- Types: PascalCase for interfaces/types

## Git Commit Messages
Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `perf:` Performance improvement
- `style:` Styling changes
- `refactor:` Code restructuring
- `docs:` Documentation

## Accessibility Notes
- Ensure all interactive elements have proper ARIA labels
- Maintain keyboard navigation support
- Provide alt text for historical images
- Keep contrast ratios WCAG AA compliant

## Historical Sensitivity
- Treat all business data with respect
- Maintain historical accuracy
- Avoid sensationalizing closures
- Present information objectively

## Remember
This project visualizes a difficult period in history. The goal is to preserve memory and educate, not to entertain. Keep the interface professional and the data presentation respectful.