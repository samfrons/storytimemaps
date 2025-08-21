# Requirements Specification: Timeline-Based Business Details & Media

## Problem Statement

The StoryMaps application currently displays static business information that doesn't change as users navigate through the timeline. Users need to see how business details, descriptions, and media evolved over time to understand the full historical narrative of persecution and survival.

## Solution Overview

Implement a timeline-aware content system that dynamically updates business details and media galleries based on the current timeline position, while maintaining backward compatibility with existing static business data.

## Functional Requirements

### FR1: Timeline-Aware Content Display
**Priority:** High
- Business descriptions must completely replace with period-specific content when timeline changes
- Media galleries must show only period-relevant images/videos
- Content changes must trigger when user moves TimeSlider component
- Businesses without timeline data must continue displaying static content unchanged

### FR2: Smooth Content Transitions  
**Priority:** High
- Timeline content changes must use 300ms transition duration (consistent with existing app patterns)
- Follow existing `isTransitioning` pattern from BusinessDetailModal and AnimatedBusinessCarousel
- Maintain content fade-out/fade-in sequence during timeline navigation
- Prevent content flickering during rapid timeline scrubbing

### FR3: Integration with Business State System
**Priority:** High  
- Timeline content must work alongside existing business state colors (active/declining/closed/future)
- State calculation logic in useStoryMapLogic must remain unchanged
- Business state and timeline content must update simultaneously during timeline changes

### FR4: Lazy Loading Performance
**Priority:** High
- Timeline data must load only when business detail modal opens (not during initial app load)
- Loading must be transparent to user with appropriate loading states
- Failed timeline data loads must gracefully fallback to static content
- Multiple rapid timeline changes must not trigger redundant API calls

### FR5: Detailed Stories Only
**Priority:** Medium
- Timeline functionality must be available only for the ~20 detailed stories (not full 4000+ database)
- Implementation must clearly distinguish between stories with/without timeline data
- Database mode businesses must continue showing static information only

## Technical Requirements

### TR1: Data Structure Extensions

**New TimelineMediaItem Interface:**
```typescript
export interface TimelineMediaItem {
  url: string;
  caption?: string;
  type?: 'image' | 'video';
  startDate: string;    // ISO date when this media becomes relevant
  endDate?: string;     // ISO date when this media stops being relevant
}

export interface TimelineContent {
  startDate: string;
  endDate?: string;
  description?: string;
  longDescription?: string;
  media?: TimelineMediaItem[];
}

export interface TimelineData {
  businessId: string;
  timeline: TimelineContent[];
}
```

**StoryMap Interface Extension:**
```typescript
export interface StoryMap {
  // ... existing fields
  hasTimelineData?: boolean;  // Flag to indicate timeline data availability
}
```

### TR2: File Organization
- Create `data/timeline/` directory for timeline-specific JSON files
- Timeline files named by business ID: `data/timeline/{businessId}.json`
- Follow existing data file patterns for consistency
- Maintain separation from main business data files

### TR3: API Integration
- Extend existing `/api/storymaps` endpoints to include timeline data availability
- Create new `/api/timeline/{businessId}` endpoint for lazy loading
- Implement caching strategy for timeline data to prevent redundant loads
- Include proper error handling for missing timeline files

### TR4: Component Modifications

**StoryDetail Component (`src/app/components/StoryDetail.tsx`):**
- Add timeline data state management
- Implement content filtering based on current date
- Maintain existing media gallery structure with timeline-aware filtering
- Add loading states for timeline data fetching

**BusinessDetailModal Component (`src/app/components/BusinessDetailModal.tsx`):**
- Pass currentDate prop to StoryDetail component
- Maintain existing transition system
- Add timeline data loading trigger on modal open

**useStoryMapLogic Hook (`src/hooks/useStoryMapLogic.ts`):**
- Add timeline data loading functions
- Maintain existing business state calculation
- Provide timeline data cache management

### TR5: Performance Optimization
- Timeline data cache with component unmount cleanup
- Debounce timeline data fetching during rapid slider movement
- Implement cleanup for aborted timeline data requests
- Maintain existing React.memo patterns

## Implementation Hints

### Phase 1: Data Structure & Types
1. Add new interfaces to `src/types.ts`
2. Create `data/timeline/` directory structure  
3. Implement sample timeline data for 2-3 businesses

### Phase 2: API Layer
1. Create timeline data loading utilities in `src/utils/`
2. Implement caching strategy
3. Add error handling and fallback logic

### Phase 3: Component Integration
1. Modify StoryDetail to accept and use timeline data
2. Add timeline data fetching to BusinessDetailModal
3. Implement content filtering based on currentDate

### Phase 4: Transition System
1. Extend existing `isTransitioning` pattern
2. Add timeline-specific transition states
3. Implement smooth content switching

### Phase 5: Testing & Performance
1. Test with rapid timeline scrubbing
2. Verify backward compatibility with static businesses
3. Optimize timeline data caching strategy

## Acceptance Criteria

### AC1: Core Functionality
- [ ] Users can scrub timeline and see business descriptions change dramatically
- [ ] Media galleries show completely different images for different time periods  
- [ ] Businesses without timeline data continue working exactly as before
- [ ] Timeline changes integrate smoothly with existing business state colors

### AC2: Performance Requirements
- [ ] Timeline data loads only when business modal opens (not during app initialization)
- [ ] Content transitions complete within 300ms
- [ ] No flickering during rapid timeline scrubbing
- [ ] App remains responsive during timeline data loading

### AC3: User Experience
- [ ] Smooth fade transitions between timeline content match existing app patterns
- [ ] Loading states are subtle and don't disrupt narrative flow
- [ ] Failed timeline loads gracefully show static content without errors
- [ ] Timeline functionality works seamlessly with existing modal navigation

### AC4: Technical Quality
- [ ] All existing businesses continue functioning without modification
- [ ] No TypeScript errors or warnings
- [ ] Maintains existing performance characteristics
- [ ] Follows project's React.memo and optimization patterns

## Assumptions

1. **Timeline Data Scope:** Only ~20 detailed stories will have timeline data initially
2. **Historical Accuracy:** Timeline data will be curated by historians and verified for accuracy
3. **Media Availability:** Period-specific media exists for key historical moments (early prosperity, persecution, closure)
4. **User Behavior:** Users will primarily explore 2-3 businesses in detail per session
5. **Performance Target:** Timeline data files will be <100KB per business
6. **Browser Support:** Modern browsers supporting ES6+ features (matching existing app requirements)

## Historical Sensitivity Notes

Following project guidelines from CLAUDE.md:
- Timeline content must "treat all business data with respect"
- Descriptions must "maintain historical accuracy" and avoid sensationalism
- Content should "present information objectively" while telling compelling stories
- Media transitions should be respectful of the difficult historical period being represented