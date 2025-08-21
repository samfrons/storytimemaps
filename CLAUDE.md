# Claude Code Instructions for StoryMaps Project

## Project Context
This is a historical data visualization project showing Jewish businesses in Berlin from 1900-1945. The application must be respectful and historically accurate while providing an engaging user experience.

## Critical Design Rules

### 1. NO BORDER RADIUS
- **NEVER** use border-radius or rounded corners in any styling unless explicitly requested by the user
- Default to sharp, rectangular edges for all UI elements (cards, buttons, inputs, modals, etc.)
- This is a deliberate design choice for a more professional, document-like appearance

### 2. NO BLUE FOCUS OUTLINES
- **ALWAYS** remove default blue focus outlines from all interactive elements
- Use `outline: none` and `box-shadow: none` on focus states
- This includes buttons, links, inputs, and any clickable elements
- Replace with custom focus indicators if needed (using border or background color changes)

### 3. Color System
**CRITICAL: Use CSS Variables, NOT Hardcoded Colors**

#### CSS Variable Usage Rules
1. **NEVER hardcode hex colors** in components - always use CSS variables
2. **Use var() syntax** for all colors: `var(--primary)`, `var(--background)`, etc.
3. **For RGBA needs**, use RGB variables: `rgba(var(--primary-rgb), 0.8)`
4. **Map styling exception**: Map layers require hex values, but should read from theme-specific functions

#### Available CSS Variables
```css
--primary / --primary-rgb      // Theme's main color
--primary-light                // Lighter variant
--secondary                    // Secondary color
--warning                      // Warning state (declining)
--danger                       // Danger state (closed)
--success                      // Success state (active)
--background / --background-rgb // Main background
--foreground                   // Main text color
--foreground-muted             // Secondary text
--muted / --muted-rgb          // Muted elements
--border                       // Border color
--shadow                       // Shadow color
--map-overlay                  // Map overlay backgrounds
--input-bg / --input-bg-rgb    // Input backgrounds
--dropdown-bg                  // Dropdown backgrounds
--card-bg / --card-bg-rgb      // Card backgrounds
--placeholder-color            // Placeholder text
```

#### Theme-Specific Map Colors
Map colors are defined in `getMapColors()` and `getThemeColors()` functions.
These return hex values for Mapbox API compatibility but should still be theme-aware.

#### Default Moody Theme Colors (for reference only)
- Background: `#4a4a57`
- Borders: `#6b6275`
- Active/Success: `#97d8c0` (mint green)
- Warning/Declining: `#ffcb51` (golden yellow)
- Danger/Closed: `#ee5760` (coral red)
- Text Primary: `#f5cdb4` (light peach)
- Text Secondary: `#8b7d8e` (muted purple)
- Accent: `#eca27d` (orange)

### 4. Typography
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

## Theming and Routing
For detailed theming implementation, URL-based theme management, and routing patterns, see:
**`docs/THEMING_GUIDE.md`** - Comprehensive guide for the theme-consistency-architect agent

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

## Implementation Best Practices for Agents

### When Working with Colors
1. **Check existing usage first**: Use `grep` to find how colors are currently implemented
2. **Use CSS variables**: All UI components should use `var(--variable-name)`
3. **Map exception**: Mapbox requires hex values - use theme functions that return hex
4. **Never hardcode**: Even "white" should be `var(--secondary)` or appropriate variable
5. **Test all themes**: Changes should work across moody, hot, cold, warm, cool, bauhaus, art-nouveau

### When Adding New Features
1. **Check CLAUDE.md first**: This file contains critical project rules
2. **Follow existing patterns**: Look at similar components for style/structure
3. **Maintain theme consistency**: New elements must work with all themes
4. **Performance first**: Use React.memo, useMemo, useCallback appropriately
5. **No rounded corners**: Keep sharp edges unless explicitly requested

## TypeScript and Library Compliance

### CRITICAL: Always Ensure Code Quality
1. **Run TypeScript checks** before completing any task:
   - `pnpm run typecheck` or `npx tsc --noEmit`
   - Fix ALL TypeScript errors - no `any` types unless absolutely necessary
   - Properly type all props, state, and function parameters

2. **Follow library rules strictly**:
   - **React**: No direct DOM manipulation, use refs and state properly
   - **Next.js**: 
     - Use `'use client'` directive for client components
     - Avoid hydration mismatches (no `typeof window` checks in initial render)
     - Use CSS variables consistently between server and client
   - **Mapbox GL**: Handle WebGL context properly, check for map readiness
   - **Tailwind**: Use utility classes correctly, no conflicting styles

3. **Common violations to avoid**:
   - Conditional rendering that differs between server/client (hydration errors)
   - Using browser-only APIs without proper checks
   - Hardcoding values that should use CSS variables
   - Missing error boundaries for async operations
   - Incorrect hook dependencies in useEffect/useMemo/useCallback

4. **Always validate**:
   - Props match component interfaces
   - Event handlers are properly typed
   - Async operations have error handling
   - CSS variables exist before using them

## DEPLOYMENT RULES - CRITICAL FOR BUILD SUCCESS

### 1. Suspense Boundaries for useSearchParams
**MANDATORY**: Any page component that uses `useSearchParams()` (directly or indirectly) MUST be wrapped in Suspense boundary:

```typescript
export default function PageName() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="font-mono" style={{ color: 'var(--primary)' }}>Loading...</div>
      </div>
    }>
      <PageContent />
    </Suspense>
  );
}
```

**Components that require Suspense**:
- Any component using `useSearchParams()` directly
- Any component using `useTranslation()` hooks that might read URL params
- Any component importing `Sidebar` component
- Any component using routing hooks (`useRouter`, `usePathname` with search params)

### 2. JSX Syntax Rules
**CRITICAL**: Always use proper JSX syntax:
- ✅ Correct: `<Component />`
- ❌ Wrong: `<Component / />`
- ✅ Correct: `<Component>content</Component>`
- ❌ Wrong: `<Component>content<Component / />`

### 3. TypeScript Property Access
**CRITICAL**: Always type-cast unknown properties:
```typescript
// ✅ Correct
{(selectedBusiness.properties.name as string) || 'Unknown'}

// ❌ Wrong
{selectedBusiness.properties.name}
```

### 4. Text Escaping in JSX
**CRITICAL**: Escape apostrophes in JSX text:
- ✅ Correct: `Frankfurt&apos;s Jewish community`
- ❌ Wrong: `Frankfurt's Jewish community`

### 5. ESLint Configuration
Maintain warning-level ESLint configuration for deployment:
```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "react/no-unescaped-entities": "off",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 6. Pre-Deployment Checklist
**ALWAYS** run before pushing to deployment branch:
1. `pnpm run build` - Must complete without errors
2. Fix all TypeScript errors (not warnings)
3. Ensure all pages with useSearchParams have Suspense boundaries
4. Verify JSX syntax is correct (no malformed closing tags)
5. Check that property access is properly typed
6. Verify apostrophes are escaped in JSX text

### 7. Common Deployment Failures
**Watch out for these patterns that cause build failures**:
- Missing Suspense around useSearchParams usage
- Malformed JSX closing tags (`/ />` instead of `/>`)
- Untyped property access on unknown objects
- Unescaped apostrophes in JSX text content
- TypeScript strict mode violations

## Testing Checklist
Before any commit, verify:
- [ ] **No TypeScript errors** - run `pnpm run typecheck`
- [ ] **No console errors** in browser
- [ ] **No hydration warnings** in Next.js
- [ ] No border-radius used anywhere
- [ ] All colors use CSS variables (except Map API calls)
- [ ] Components are memoized
- [ ] Event handlers are throttled/debounced
- [ ] Map loads without console errors
- [ ] Modal animations are smooth
- [ ] Time slider updates all components
- [ ] All themes display correctly
- [ ] Text remains legible in all themes

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
- don't use hardcoded color values use variables except when you can't like for maps i think