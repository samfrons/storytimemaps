/**
 * Services Index
 * Central export point for all service modules.
 */

// Storymaps Service - Business data fetching and transformation
export {
  // API Functions
  fetchDetailedStories,
  fetchInitialData,
  fetchBusinessesPage,
  fetchAllBusinesses,
  fetchInitialBundle,
  // Data Transformation
  convertToGeoJSON,
  convertToStandardGeoJSON,
  filterByDateRange,
  searchBusinesses,
  getUniqueCategories,
  getUniqueBusinessTypes,
  // Cache Management
  clearStorymapsCache,
  clearCacheForEndpoint,
  // Types
  type BusinessFeature,
  type FetchOptions,
  type StorymapsResponse,
} from './storymapsService'

// Timeline Service - Timeline data loading and management
export {
  // Core Functions (re-exported from utils)
  loadTimelineData,
  getTimelineContentForDate,
  getTimelineMediaForDate,
  clearTimelineCache,
  preloadTimelineData,
  hasTimelineData,
  subscribeToLoadingState,
  // Enhanced Functions
  loadMultipleTimelines,
  getTimelinePeriods,
  getTimelineDateRange,
  isDateInTimeline,
  getBusinessStateAtDate,
  countTimelineMedia,
  getAllTimelineMedia,
  filterTimelineByDateRange,
  // Types
  type TimelineLoadResult,
  type TimelinePeriod,
} from './timelineService'
