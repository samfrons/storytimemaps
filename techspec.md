# Technical Specification: Erased Spaces - Interactive Historical Map Application

## Project Overview

**Application Name:** Bygone Business  
**Description:** An interactive web and mobile application mapping Jewish businesses, institutions, and notable figures in pre-1945 Berlin, designed to preserve and present historical data through an elegant, performant interface.

## Core Features & Requirements

### 1. Interactive Time-Based Map System with High-Performance Navigation

- **Map Engine:** Mapbox GL JS for web, React Native Maps for mobile
- **Time Control:** Horizontal time slider (1930-1945) with smooth animations
- **Marker States:**
  - Active (blue) - Business operating
  - Declining (yellow) - Under pressure
  - Closed/Aryanized (black) - Taken over or destroyed
  - Future/Not Yet Established (custom style) - Businesses not yet founded, style to be determined in design phase
- **Critical Performance Requirements:**
  - **Smooth Camera Transitions:** 60fps eased camera movements with customizable duration (200ms-2s)
  - **Intelligent Zoom Levels:** Auto-calculate optimal zoom based on marker density and screen size
  - **Frame Rate Optimization:** Maintain 60fps during all pan/zoom operations using RAF scheduling
  - **Predictive Loading:** Pre-load marker data for anticipated navigation targets
  - **Memory Management:** Efficient marker pooling and texture atlas optimization
- **Advanced Navigation Features:**
  - **Smart Framing:** Automatically frame multiple related markers with optimal padding
  - **Momentum Preservation:** Smooth deceleration curves for natural feel
  - **Collision Avoidance:** Intelligent camera positioning to avoid UI elements
  - **Multi-touch Support:** Gesture conflict resolution for mobile devices

### 2. High-Performance Tooltip System with Navigation Integration

- **Instant Hover Response:** Sub-50ms tooltip appearance with optimized event handling
- **Click-to-Navigate Integration:**
  - **Seamless Camera Control:** Tooltip clicks trigger smooth pan/zoom to optimal viewing position
  - **Context-Aware Framing:** Intelligent zoom level selection based on marker importance and surrounding density
  - **Smooth Transitions:** Cubic-bezier easing curves for natural camera movement (300-800ms duration)
  - **Interrupt Management:** Cancel previous animations gracefully when new tooltip clicked
- **State-Specific Styling:**
  - Active: Clean white background with blue accent
  - Declining: Amber warning styling
  - Closed: Dark styling with memorial aesthetic
  - Future: Custom styling (design phase)
- **Smart Positioning:** Advanced collision detection with boundary awareness
- **Mobile Optimization:** Touch-friendly tooltips with haptic feedback integration
- **Performance Optimizations:**
  - **Tooltip Pooling:** Reuse DOM elements to minimize creation/destruction
  - **Viewport Culling:** Only render tooltips for visible markers
  - **Debounced Updates:** Batch tooltip position updates during map movement

### 3. Scrollable List Panel with Synchronized Map Navigation

- **Layout:** Responsive sidebar (desktop) / bottom sheet (mobile)
- **Advanced Search:** Full-text search across names, descriptions, addresses, and historical content
- **Multi-Filter System:**
  - Category (business type, institution, residence)
  - Time period (custom date ranges)
  - Status (active, declining, closed, future)
  - Location (district, street, proximity)
  - Person attributes (occupation, nationality)
- **Smart Suggestions:** Auto-complete and search suggestions
- **Saved Searches:** Bookmark frequently used search/filter combinations
- **Critical Performance Features:**
  - **Instant Map Synchronization:** Zero-latency camera movement triggered by scroll focus
  - **Smooth List Scrolling:** 120fps scroll performance with momentum preservation
  - **Predictive Navigation:** Pre-calculate camera positions for visible list items
  - **Adaptive Zoom Strategy:** Context-aware zoom levels (street view for single locations, area view for clusters)
  - **Interrupt Handling:** Graceful cancellation of in-progress animations when new target selected
- **Auto-scroll:** List automatically scrolls to active map marker with smooth easing
- **Performance:** Virtual scrolling for large datasets with efficient search indexing

### 4. Rich Media Detail Panes

- **Slide-out Design:** Elegant panel animation from right (desktop) / bottom (mobile)
- **Flexible Content System:**
  - Rich text editor with markdown support
  - Image galleries with zoom and lightbox functionality
  - Video embedding (YouTube, Vimeo, custom uploads)
  - Audio clips and oral histories
  - Document viewers (PDFs, historical documents)
  - Interactive timelines and custom widgets
  - Embedded maps and 3D models
- **Content Management:**
  - Drag-and-drop content arrangement
  - Custom embed codes for external content
  - Responsive media that adapts to screen size
  - Alt text and accessibility descriptions
- **Historical Context:**
  - Timeline of key events
  - Related entries and cross-references
  - Source citations and bibliography
- **Navigation:** Previous/next buttons, breadcrumb navigation, table of contents
- **Sharing:** Deep linking to specific entries with social media previews

### 5. User-Generated Content System

- **Submission Form:** Structured form for new entries or corrections
- **Media Upload:** Support for images, documents, and audio
- **Moderation Queue:** Admin dashboard for reviewing submissions
- **Version Control:** Track changes and maintain data integrity
- **Attribution:** Credit contributors appropriately

## Technical Architecture

### Frontend Stack

- **Framework:** Next.js  15.4.6 with App Router
- **Styling:** Tailwind CSS with custom design system
- **State Management:** Zustand for global state
- **Maps:** Mapbox GL JS with custom clustering
- **Animations:** Framer Motion for smooth transitions
- **Forms:** React Hook Form with Zod validation
- **Testing:** Vitest + React Testing Library

### Mobile Application

- **Framework:** React Native with Expo
- **Navigation:** React Navigation v6
- **Maps:** React Native Maps with Mapbox integration
- **State:** Zustand (shared with web)
- **Storage:** Expo SecureStore for offline data

### Backend Architecture

- **Runtime:** Node.js with TypeScript
- **Framework:** Fastify for high performance
- **Database:** PostgreSQL with PostGIS for geospatial data
- **ORM:** Drizzle ORM for type-safe database operations
- **Authentication:** Auth0 or Supabase Auth
- **File Storage:** AWS S3 or Cloudinary for media
- **API:** GraphQL with Apollo Server for flexible data fetching

### Database Schema

```sql
-- Core entities
locations (id, name, address, coordinates, category, founded_date, closed_date, search_vector)
people (id, name, birth_date, death_date, occupation, biography, search_vector)
timeline_events (id, location_id, event_date, event_type, description)
media (id, url, caption, media_type, location_id, person_id, embed_code, metadata)
content_blocks (id, entry_id, block_type, content, position, settings)
user_submissions (id, content, status, submitted_by, reviewed_by)

-- Search and filtering
search_indexes (full-text search optimization)
categories (id, name, icon, color, parent_id)
tags (id, name, category)
entry_tags (entry_id, tag_id)
```

### Performance Requirements

- **Page Load:** < 2 seconds initial load
- **Map Performance Critical Metrics:**
  - **Camera Transitions:** < 16ms frame time (60fps) during all pan/zoom operations
  - **List-to-Map Navigation:** < 50ms response time from list item focus to camera movement initiation
  - **Tooltip Click Response:** < 30ms from click to camera animation start
  - **Smooth Animation Curves:** Consistent easing functions across all map movements
  - **Memory Efficiency:** < 100MB memory usage for map operations
- **Animations:** 60fps smooth transitions with no dropped frames
- **Offline Support:** Critical data cached for mobile
- **Accessibility:** WCAG 2.1 AA compliance with keyboard navigation support for map controls

### Design System

- **Typography:** Clean, readable fonts (Inter/Source Sans Pro)
- **Color Palette:**
  - Primary: Deep blue (#1e3a8a)
  - Secondary: Warm gold (#f59e0b)
  - Warning: Amber (#d97706)
  - Danger: Dark red (#7f1d1d)
- **Spacing:** 8pt grid system
- **Breakpoints:** Mobile-first responsive design
- **Dark Mode:** Optional toggle with appropriate theming

## Feature Specifications

### Map Interactions

- **High-Performance Camera Control:**
  - Custom styled zoom in/out buttons with smooth acceleration
  - **Intelligent Pan Limits:** Dynamic bounds adjustment based on content density
  - **Optimized Clustering:** GPU-accelerated marker clustering with smooth expansion animations
  - **Layer Toggle:** Instant show/hide with fade transitions
- **Advanced Search Integration:**
  - Geocoding search with autocomplete
  - Filter markers directly from map interface
  - Search results highlighted on map with smooth focus transitions
  - Saved search overlays
- **Navigation Performance Features:**
  - **Predictive Caching:** Pre-load marker details for likely navigation targets
  - **Smooth State Transitions:** Seamless visual feedback during loading states
  - **Gesture Optimization:** Debounced touch handling for responsive mobile experience
  - **Camera Memory:** Remember previous zoom/pan positions for quick return navigation

### Time Navigation

- **Scrubbing:** Smooth timeline scrubbing with preview
- **Play Mode:** Auto-advance through time periods
- **Bookmarks:** Save interesting time periods
- **Speed Control:** Adjustable playback speed

### Content Management

- **Admin Dashboard:**
  - Review submission queue
  - Edit existing entries
  - Manage user permissions
  - Analytics and usage stats
- **Bulk Operations:** Import/export functionality
- **Backup System:** Automated data backups

### User Experience

- **Onboarding:** Interactive tutorial for first-time users
- **Help System:** Contextual help and documentation
- **Feedback:** Easy reporting of issues or suggestions
- **Multilingual:** Support for German and English

## Development Guidelines

### Code Quality

- **TypeScript:** Strict mode enabled throughout
- **Linting:** ESLint with custom rules
- **Formatting:** Prettier with project standards
- **Testing:** Minimum 80% code coverage
- **Documentation:** Comprehensive JSDoc comments

### Deployment

- **Staging:** Automated deployment on feature branches
- **Production:** Blue-green deployment strategy
- **Monitoring:** Application performance monitoring
- **Error Tracking:** Sentry or similar for error reporting

### Security

- **Authentication:** Secure user management
- **Authorization:** Role-based access control
- **Data Validation:** Input sanitization and validation
- **HTTPS:** SSL certificates and secure headers
- **Privacy:** GDPR compliance for EU users

## Success Metrics

- **User Engagement:** Average session duration > 5 minutes
- **Performance:** Core Web Vitals in “Good” range
- **Accessibility:** 100% keyboard navigation support
- **Mobile:** Responsive design working on all devices
- **Content Growth:** Active user contribution system

## Timeline Estimation

- **Phase 1 (Weeks 1-4):** Core map functionality and basic UI
- **Phase 2 (Weeks 5-8):** User system and content management
- **Phase 3 (Weeks 9-12):** Advanced features and mobile optimization
- **Phase 4 (Weeks 13-16):** Testing, polish, and deployment

This specification provides a comprehensive blueprint for creating a world-class historical mapping application that honors the memory of Berlin’s Jewish community while leveraging modern technology for an exceptional user experience.