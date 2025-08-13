# StoryMaps Style Guide & Theming System

## 🎨 Design Philosophy

StoryMaps is a **flexible theming system** that can adapt to different moods, stories, and aesthetics while maintaining consistent usability patterns. Whether you're creating a serious historical documentary, a vibrant travel guide, or a whimsical fantasy map, the core system provides the foundation for any visual narrative.

## 🎯 Universal Design Principles

### 1. **SHARP EDGES BY DEFAULT**
- Default to rectangular, sharp-edged UI elements
- No `border-radius` unless the theme specifically calls for it
- This creates a clean, intentional foundation that works for any theme

### 2. **NO DEFAULT BLUE FOCUS OUTLINES**
- Always override browser default focus styles
- Use theme-appropriate colors for focus states
- Focus indicators should match the overall aesthetic

### 3. **THEME-APPROPRIATE CONTRAST**
- Maintain readable contrast ratios (WCAG AA minimum)
- Contrast can be high and stark OR soft and subtle depending on theme
- Text legibility is non-negotiable regardless of aesthetic choice

### 4. **CONSISTENT SPATIAL RHYTHM**
- Use a consistent spacing scale within each theme
- Default: multiples of 4px (8px, 12px, 16px, 24px)
- Themes can adjust the base unit (e.g., 6px for more generous spacing)

## 🎨 Theming System

### Current Theme: "Berlin Twilight" (Historical Dark)
This is the current active theme optimized for historical content.

```css
/* Core Interface Colors */
--background: #4a4a57      /* Dark purple-gray background */
--foreground: #f5cdb4      /* Light peach text */
--border: #6b6275          /* Muted purple borders */
--muted: #8b7d8e           /* Secondary text */

/* Status Colors (Map States) */
--primary: #97d8c0         /* Mint green - Active businesses */
--warning: #ffcb51         /* Golden yellow - Declining */
--danger: #ee5760          /* Coral red - Closed */
--accent-orange: #eca27d   /* Orange - Dates/highlights */
```

### Theme Variations (Examples)

#### "Sunset Explorer" (Warm & Adventurous)
```css
--background: #2d1810      /* Deep brown */
--foreground: #f4e4bc      /* Warm cream */
--border: #8b4513          /* Saddle brown */
--primary: #ff6b35         /* Vibrant orange */
--warning: #ffd700         /* Bright gold */
--danger: #dc143c          /* Crimson */
```

#### "Ocean Depths" (Cool & Mysterious)
```css
--background: #1a2332      /* Deep navy */
--foreground: #e6f3ff      /* Ice blue */
--border: #4a6fa5          /* Steel blue */
--primary: #00d4aa         /* Turquoise */
--warning: #ffb84d         /* Amber */
--danger: #ff4757          /* Coral pink */
```

#### "Forest Canopy" (Natural & Organic)
```css
--background: #2c3e2d      /* Forest green */
--foreground: #f0f8e8      /* Pale green */
--border: #5d7c47          /* Sage */
--primary: #7fb069         /* Fresh green */
--warning: #e6b31e         /* Golden yellow */
--danger: #b85450          /* Earth red */
```

### Color Usage Guidelines

#### Background Layers
- **Base**: `#4a4a57` - Main application background
- **Elevated**: `#6b6275/40` - Cards and panels
- **Hover**: `#6b6275/50` - Interactive hover states
- **Active**: `#97d8c0/20` - Selected items

#### Text Hierarchy
1. **Primary Text**: `#f5cdb4` - Headers, important content
2. **Secondary Text**: `#8b7d8e` - Descriptions, metadata
3. **Accent Text**: `#97d8c0` - Active states, CTAs
4. **Warning Text**: `#ffcb51` - Important dates
5. **Error Text**: `#ee5760` - Closed/ended states

#### State Colors for Business Status
```javascript
// Always use these exact colors for business states
const stateColors = {
  active: 'rgba(151, 216, 192, 0.98)',   // Mint green
  declining: 'rgba(255, 203, 81, 0.98)',  // Golden yellow
  closed: 'rgba(238, 87, 96, 0.98)',      // Coral red
  future: 'rgba(245, 205, 180, 0.98)'     // Light peach
}
```

## 📐 Typography

### Font Stack
```css
/* Monospace - Data & Technical */
font-family: 'Space Mono', 'Courier New', monospace;

/* Sans-serif - Body & Descriptions */
font-family: 'Inter', -apple-system, system-ui, sans-serif;
```

### Type Scale
```css
/* Headings */
.h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
.h2 { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }
.h3 { font-size: 14px; font-weight: 600; text-transform: uppercase; }

/* Body */
.body { font-size: 14px; line-height: 1.5; }
.small { font-size: 12px; line-height: 1.4; }
.tiny { font-size: 11px; letter-spacing: 0.02em; }
```

### Typography Rules
- **Headers**: Always use Space Mono, uppercase for emphasis
- **Data**: Space Mono for dates, numbers, categories
- **Descriptions**: Inter for readability in longer text
- **Labels**: Space Mono, uppercase, tracked out

## 🗺️ Map Styling

### Mapbox Theme Customization
```javascript
// Base style: dark-v11
// Then apply these customizations:

const mapColors = {
  water: '#5a5766',           // Darker purple
  parks: '#97d8c0',           // Mint green at 20% opacity
  roads_major: '#ee5760',     // Coral red for highways
  roads_secondary: '#ffcb51', // Yellow for main roads
  roads_local: '#f5cdb4',     // Peach for local streets
  buildings: '#564b5a',       // Dark purple at 60% opacity
  labels: '#f5cdb4',          // Peach text
  label_halos: '#3b3340'      // Dark navy halos
}
```

### Marker Styling
```css
/* Individual markers */
.marker-dot {
  width: 8px;
  height: 8px;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

/* Cluster markers */
.cluster-marker {
  width: 32px;
  height: 32px;
  background: #eca27d;
  border: 2px solid white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}

/* Tooltips/Labels */
.map-label {
  padding: 4px 8px;
  font-family: 'Space Mono';
  font-size: 12px;
  font-weight: 600;
  border: 1px solid;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
```

## 🎭 Interactive States

### Hover Effects
```css
/* Standard hover */
.hover-effect {
  transition: all 200ms ease-out;
}
.hover-effect:hover {
  background-color: rgba(107, 98, 117, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Text hover */
.text-hover {
  color: #f5cdb4;
  transition: color 200ms ease;
}
.text-hover:hover {
  color: #97d8c0;
}
```

### Active/Selected States
```css
/* Selected card */
.selected {
  background-color: rgba(151, 216, 192, 0.2);
  border-left: 4px solid #97d8c0;
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

/* Active button */
.button-active {
  background-color: #97d8c0;
  color: #2a2a2a;
  font-weight: 600;
}
```

### Focus States (No Blue!)
```css
/* Input focus */
input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #97d8c0;
  background-color: rgba(151, 216, 192, 0.05);
}

/* Button focus */
button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(151, 216, 192, 0.3);
}
```

## 📦 Component Patterns

### Cards
```css
.story-card {
  background: rgba(107, 98, 117, 0.4);
  border: 1px solid #6b6275;
  border-left: 4px solid [status-color];
  padding: 16px;
  transition: all 500ms ease;
}

.story-card:hover {
  background: rgba(107, 98, 117, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}
```

### Modals
```css
.modal {
  background: #4a4a57;
  border: 2px solid #6b6275;
  box-shadow: 0 24px 48px rgba(0,0,0,0.4);
  /* NO border-radius! */
}

.modal-overlay {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}
```

### Forms
```css
.input-field {
  background: rgba(107, 98, 117, 0.5);
  border: 1px solid #6b6275;
  color: #f5cdb4;
  padding: 10px 12px;
  font-family: 'Space Mono';
  font-size: 12px;
}

.input-field::placeholder {
  color: #8b7d8e;
}
```

## 🎬 Animations

### Timing Functions
```css
/* Standard easing */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);

/* Durations */
--duration-fast: 200ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
```

### Common Animations
```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Modal expand */
@keyframes modalExpand {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Slide transitions */
.slide-enter { transform: translateX(100%); }
.slide-enter-active { transform: translateX(0); }
.slide-exit { transform: translateX(0); }
.slide-exit-active { transform: translateX(-100%); }
```

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile first approach */
--mobile: 320px;    /* min-width */
--tablet: 768px;    /* md: */
--desktop: 1024px;  /* lg: */
--wide: 1440px;     /* xl: */
```

### Mobile Adaptations
- Collapse header on scroll (mobile only)
- Stack sidebar below map on mobile
- Increase touch targets to 44px minimum
- Simplify animations for performance

## ✅ Implementation Checklist

### Before Committing
- [ ] No `border-radius` anywhere
- [ ] No blue focus outlines
- [ ] All colors from defined palette
- [ ] Text is readable (AA contrast minimum)
- [ ] Hover states are defined
- [ ] Focus states use custom styles
- [ ] Animations use defined timing
- [ ] Mobile layout tested

### Component Requirements
- [ ] Uses Space Mono for data/labels
- [ ] Uses Inter for descriptions
- [ ] Has proper hover state
- [ ] Has proper active state
- [ ] Follows spacing scale (4px grid)
- [ ] No inline styles (except dynamic values)

## 🚫 Common Mistakes to Avoid

1. **Adding rounded corners** - Never use border-radius
2. **Using default focus styles** - Always override with custom
3. **Low contrast text** - Check readability on dark backgrounds
4. **Inconsistent spacing** - Stick to the 4px grid
5. **Wrong fonts** - Data = Space Mono, Descriptions = Inter
6. **Opacity overuse** - Keep text solid, only backgrounds can be transparent
7. **Blue anywhere** - This is not part of our palette
8. **Gradients** - Keep backgrounds solid or use subtle overlays
9. **Drop shadows on text** - Use text halos sparingly
10. **Animation overload** - Keep it subtle and purposeful

## 🎯 Quick Reference

### CSS Variables to Use
```css
/* Always use these variables, never hardcode colors */
var(--background)    /* #4a4a57 */
var(--foreground)    /* #f5cdb4 */
var(--primary)       /* #97d8c0 */
var(--warning)       /* #ffcb51 */
var(--danger)        /* #ee5760 */
var(--border)        /* #6b6275 */
var(--muted)         /* #8b7d8e */
```

### Tailwind Classes for Common Patterns
```html
<!-- Card -->
<div class="bg-[#6b6275]/40 border border-[#6b6275] p-4">

<!-- Active state -->
<div class="bg-[#97d8c0]/20 border-l-4 border-l-[#97d8c0]">

<!-- Hover effect -->
<div class="hover:bg-[#6b6275]/50 transition-all duration-300">

<!-- Text hierarchy -->
<h1 class="text-[#97d8c0] font-mono font-bold uppercase">
<p class="text-[#f5cdb4] font-sans">
<span class="text-[#8b7d8e] text-xs">
```

## 🎭 Theming Philosophy

The StoryMaps theming system is designed to **match the mood and purpose of your content**. Different stories call for different aesthetics:

### Theme Selection Guidelines

**For Historical/Documentary Content:**
- Choose muted, sophisticated palettes
- Use serif or monospace fonts for authority
- Employ subtle animations and interactions
- Prioritize clarity and respectful presentation

**For Travel/Adventure Content:**
- Use warm, inviting color schemes
- Incorporate energetic accent colors
- Add playful micro-interactions
- Create a sense of discovery and exploration

**For Fantasy/Creative Content:**
- Experiment with bold color combinations
- Use custom illustrations and icons
- Include whimsical animations
- Let personality shine through the interface

**For Scientific/Technical Content:**
- Employ clean, high-contrast palettes
- Use precise typography and spacing
- Focus on data visualization clarity
- Maintain professional, trustworthy aesthetics

### Universal Principles (Regardless of Theme)

When in doubt, always prioritize:
- **Accessibility** over aesthetics
- **Usability** over visual impact
- **Content clarity** over decoration
- **Consistent patterns** over creative chaos

### Theme Switching Implementation

```css
/* Use CSS custom properties for easy theme switching */
:root[data-theme="berlin-twilight"] {
  --background: #4a4a57;
  --foreground: #f5cdb4;
  /* ... rest of Berlin Twilight theme */
}

:root[data-theme="sunset-explorer"] {
  --background: #2d1810;
  --foreground: #f4e4bc;
  /* ... rest of Sunset Explorer theme */
}
```

```javascript
// Theme switching logic
const setTheme = (themeName) => {
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('preferred-theme', themeName);
}
```

## 📝 Remember

**The interface should serve the story, not overshadow it.** Every theme should enhance the user's connection to the content, whether that's through serious documentary presentation, adventurous exploration, or creative expression.