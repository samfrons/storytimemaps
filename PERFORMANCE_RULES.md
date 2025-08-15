# Performance Rules for StoryMaps Development

## 🚀 Critical Performance Guidelines

### 1. React Component Optimization
- **ALWAYS** wrap exported components with `React.memo()` when they receive props
- **ALWAYS** use `useMemo()` for expensive calculations, especially those involving arrays/objects
- **ALWAYS** use `useCallback()` for event handlers passed as props
- **NEVER** calculate derived state in render - use `useMemo()` instead
- **SEPARATE** static data from dynamic data to minimize recalculation frequency

### 2. Image Optimization
- **ALWAYS** use Next.js `Image` component instead of `<img>` tags
- **NEVER** use PNG for photos - use WebP or AVIF formats
- **ALWAYS** specify width and height or use fill with proper sizing
- **ALWAYS** implement lazy loading for images below the fold
- **NEVER** duplicate image assets in multiple directories

### 3. Bundle Size Management
- **ALWAYS** use dynamic imports for heavy components (maps, charts, editors)
- **ALWAYS** check bundle impact before adding new dependencies
- **PREFER** lightweight alternatives (e.g., date-fns over moment.js)
- **REMOVE** unused dependencies regularly
- **NEVER** import entire libraries when you need specific functions

### 4. Font Loading
- **ALWAYS** use Next.js font optimization (`next/font/google`)
- **NEVER** use @import for Google Fonts in CSS
- **ALWAYS** preload critical fonts
- **SPECIFY** font-display: swap to prevent invisible text

### 5. Data Fetching
- **IMPLEMENT** request deduplication for concurrent identical requests
- **CACHE** API responses appropriately (use SWR or React Query)
- **BATCH** multiple API calls when possible
- **AVOID** fetching data in loops
- **USE** pagination or virtualization for large datasets

### 6. Event Handling
- **ALWAYS** throttle scroll event handlers (100-150ms)
- **ALWAYS** debounce input/search handlers (300-500ms)
- **USE** passive event listeners for scroll/touch events
- **CLEANUP** event listeners in useEffect return functions
- **AVOID** inline function definitions in render

### 7. Map & Visualization Performance
- **IMPLEMENT** viewport-based rendering (only render visible markers)
- **USE** clustering for large marker datasets
- **CACHE** cluster calculations
- **THROTTLE** map movement events
- **LIMIT** initial marker display to reasonable amount (30-50)

### 8. CSS & Styling
- **ENABLE** Tailwind CSS purging in production
- **AVOID** runtime style calculations
- **USE** CSS transforms for animations (not position/width/height)
- **MINIMIZE** CSS-in-JS usage for frequently updating components

### 9. Build Configuration
```javascript
// Required Next.js optimizations
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
}
```

### 10. State Management
- **AVOID** unnecessary state in parent components
- **COLOCATE** state close to where it's used
- **SPLIT** global state to prevent unnecessary re-renders
- **USE** React Context sparingly and split contexts by concern

## 🔍 Performance Checklist

Before committing code, verify:

- [ ] Components are memoized where appropriate
- [ ] Event handlers use useCallback
- [ ] Expensive calculations use useMemo
- [ ] Images use Next.js Image component
- [ ] Large components use dynamic imports
- [ ] Scroll/resize handlers are throttled
- [ ] API calls are deduplicated/cached
- [ ] No console.logs in production code
- [ ] Bundle size impact is acceptable

## 📊 Performance Monitoring

Monitor these metrics:
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

## 🚫 Common Anti-Patterns to Avoid

1. **Direct DOM manipulation** in React components
2. **Synchronous heavy computations** in render
3. **Unoptimized images** in public folder
4. **Unnecessary re-renders** from poor prop design
5. **Memory leaks** from uncleaned effects
6. **Blocking resources** in document head
7. **Large JSON imports** in initial bundle
8. **Unthrottled real-time updates**

## 🛠️ Recommended Tools

- **Bundle Analysis**: `next-bundle-analyzer`
- **Performance Testing**: Lighthouse, WebPageTest
- **React DevTools**: Profiler tab for render analysis
- **Chrome DevTools**: Performance tab for runtime analysis

## 💡 Quick Wins

1. Add loading states for dynamic imports
2. Implement error boundaries for graceful failures
3. Use Intersection Observer for lazy loading
4. Prefetch critical data on hover/focus
5. Use web workers for heavy computations
6. Implement progressive enhancement

Remember: **Measure first, optimize second.** Use Chrome DevTools and React Profiler to identify actual bottlenecks before optimizing.