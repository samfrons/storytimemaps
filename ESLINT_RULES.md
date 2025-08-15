# ESLint Rules for Deployment Success

This document outlines critical ESLint rules that must be followed to prevent deployment failures on Vercel.

## Critical Rules for React/JSX

### 1. No Unescaped Entities (`react/no-unescaped-entities`)

**Rule**: All special characters in JSX text content must be properly escaped.

**Common Issues**:
- Apostrophes (`'`) must be written as `&apos;`
- Quotes (`"`) must be written as `&quot;`
- Ampersands (`&`) must be written as `&amp;`
- Less than (`<`) must be written as `&lt;`
- Greater than (`>`) must be written as `&gt;`

**Examples**:

❌ **Wrong**:
```tsx
<p>Berlin's past</p>
<p>Dr. Kreutzmüller's research</p>
<p>StoryTimeMaps' work</p>
```

✅ **Correct**:
```tsx
<p>Berlin&apos;s past</p>
<p>Dr. Kreutzmüller&apos;s research</p>
<p>StoryTimeMaps&apos; work</p>
```

### 2. Prefer Next.js Image Component (`@next/next/no-img-element`)

**Rule**: Use Next.js `Image` component instead of regular `<img>` elements for better performance and optimization.

❌ **Wrong**:
```tsx
<img src="/photo.jpg" alt="Description" className="w-full" />
```

✅ **Correct**:
```tsx
import Image from 'next/image';

<Image 
  src="/photo.jpg" 
  alt="Description" 
  width={800} 
  height={400}
  className="w-full" 
/>
```

### 3. Cleanup Functions in useEffect

**Rule**: Always provide cleanup functions for event listeners and subscriptions in `useEffect`.

✅ **Correct**:
```tsx
useEffect(() => {
  const observer = new IntersectionObserver(callback);
  
  if (elementRef.current) {
    observer.observe(elementRef.current);
  }

  return () => {
    if (elementRef.current) {
      observer.unobserve(elementRef.current);
    }
  };
}, []);
```

## Prevention Strategies

### 1. Pre-commit Hooks
Consider adding a pre-commit hook that runs ESLint:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "git add"]
  }
}
```

### 2. VS Code Settings
Add to `.vscode/settings.json`:

```json
{
  "eslint.validate": ["typescript", "typescriptreact"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### 3. Regular Linting
Run these commands regularly during development:

```bash
# Check for ESLint errors
pnpm run lint

# Fix auto-fixable issues
pnpm run lint -- --fix

# Type checking
pnpm run typecheck
```

## Quick Reference

### Common HTML Entities
| Character | Entity    | Use Case |
|-----------|-----------|----------|
| `'`       | `&apos;`  | Apostrophes in contractions |
| `"`       | `&quot;`  | Quotes within text |
| `&`       | `&amp;`   | Ampersands |
| `<`       | `&lt;`    | Less than symbols |
| `>`       | `&gt;`    | Greater than symbols |

### Search & Replace Patterns
Use these regex patterns to find and fix common issues:

- Find apostrophes: `'([^']*)'` → Replace: `&apos;$1&apos;`
- Find quotes in JSX: `"([^"]*)"` → Replace: `&quot;$1&quot;`

## Files Fixed in Latest Deployment
- `FutureInitiatives.tsx` - Fixed Stolpersteine apostrophe
- `Homepage.tsx` - Fixed Berlin's and StoryTimeMaps' apostrophes  
- `MethodologySection.tsx` - Fixed Kreutzmüller's apostrophe
- `TimelineSection.tsx` - Fixed city's apostrophe
- `StoryDetail.tsx` - Replaced img with Next.js Image component

## Verification
Before pushing to deployment:

1. Run `pnpm run lint` - should show no errors
2. Run `pnpm run build` - should complete successfully
3. Check that all apostrophes in JSX text use `&apos;`
4. Ensure all images use Next.js `Image` component
5. Verify useEffect cleanup functions are present