/**
 * Performance configuration constants
 *
 * Centralized location for all performance-related magic numbers
 * to make tuning and maintenance easier.
 */

export const PERFORMANCE_CONFIG = {
  /** Throttle and debounce delays in milliseconds */
  THROTTLE_MS: {
    /** Viewport/map update throttling */
    VIEWPORT: 150,
    /** Scroll event throttling */
    SCROLL: 100,
    /** Label priority updates */
    LABEL_PRIORITY: 200,
  },

  DEBOUNCE_MS: {
    /** Search input debouncing */
    SEARCH: 300,
    /** Timeline loading debounce */
    TIMELINE: 200,
    /** Resize handler debounce */
    RESIZE: 100,
  },

  /** Clustering configuration */
  CLUSTERING: {
    /** Default cluster radius for mobile */
    MOBILE_RADIUS: 40,
    /** Default cluster radius for desktop */
    DESKTOP_RADIUS: 20,
    /** Max zoom level for clustering on mobile */
    MOBILE_MAX_ZOOM: 16,
    /** Max zoom level for clustering on desktop */
    DESKTOP_MAX_ZOOM: 18,
    /** Min points to form cluster on mobile */
    MOBILE_MIN_POINTS: 4,
    /** Min points to form cluster on desktop */
    DESKTOP_MIN_POINTS: 2,
    /** Standard tile extent for Supercluster */
    TILE_EXTENT: 512,
    /** Standard node size for Supercluster */
    NODE_SIZE: 64,
    /** Zoom-based clustering for large datasets */
    LARGE_DATASET: {
      ZOOM_10: { radius: 100, minPoints: 3 },
      ZOOM_12: { radius: 60, minPoints: 2 },
      ZOOM_14: { radius: 40, minPoints: 2 },
      ZOOM_16: { radius: 25, minPoints: 2 },
      ZOOM_18: { radius: 15, minPoints: 2 },
    },
  },

  /** Display limits */
  DISPLAY_LIMITS: {
    /** Initial number of stories to show */
    INITIAL_STORIES: 50,
    /** Batch size for progressive loading */
    LOAD_BATCH: 100,
    /** Initial markers before map loads */
    INITIAL_MARKERS: 30,
    /** Max individual markers at high zoom (desktop) */
    MAX_MARKERS_DESKTOP: 800,
    /** Max individual markers at high zoom (mobile) */
    MAX_MARKERS_MOBILE: 200,
    /** Non-test mode max markers desktop */
    MAX_MARKERS_DESKTOP_NORMAL: 150,
    /** Non-test mode max markers mobile */
    MAX_MARKERS_MOBILE_NORMAL: 50,
  },

  /** Viewport configuration */
  VIEWPORT: {
    /** Buffer around viewport for smooth panning (10% = 0.1) */
    BUFFER: 0.1,
    /** High zoom threshold for spatial sampling */
    HIGH_ZOOM_THRESHOLD: 15,
  },

  /** Label display limits by zoom level */
  MAX_LABELS_BY_ZOOM: {
    12: 5,
    14: 10,
    15: 20,
    16: 30,
    17: 50,
    18: 80,
    MAX: 150,
  },

  /** Timeline/batch loading */
  LOADING: {
    /** Delay before loading more items (ms) */
    PROGRESSIVE_DELAY: 500,
    /** Max concurrent timeline fetches */
    MAX_CONCURRENT_FETCHES: 5,
    /** Delay between fetch batches (ms) */
    BATCH_DELAY: 100,
  },

  /** API configuration */
  API: {
    /** Default page size for initial load */
    INITIAL_PAGE_SIZE: 200,
    /** Full dataset threshold */
    FULL_DATASET_SIZE: 10000,
    /** Known total count for immediate display */
    KNOWN_TOTAL_COUNT: 10847,
  },

  /** Animation durations */
  ANIMATION: {
    /** Modal expand/collapse duration */
    MODAL_DURATION: 500,
    /** Content fade delay */
    CONTENT_FADE_DELAY: 300,
    /** Map fly-to duration */
    MAP_FLY_TO: 800,
  },
} as const

/**
 * Get max labels for a given zoom level
 */
export function getMaxLabelsForZoom(zoom: number): number {
  const { MAX_LABELS_BY_ZOOM } = PERFORMANCE_CONFIG
  if (zoom < 12) return MAX_LABELS_BY_ZOOM[12]
  if (zoom < 14) return MAX_LABELS_BY_ZOOM[14]
  if (zoom < 15) return MAX_LABELS_BY_ZOOM[15]
  if (zoom < 16) return MAX_LABELS_BY_ZOOM[16]
  if (zoom < 17) return MAX_LABELS_BY_ZOOM[17]
  if (zoom < 18) return MAX_LABELS_BY_ZOOM[18]
  return MAX_LABELS_BY_ZOOM.MAX
}

/**
 * Get clustering config for a given zoom level in test mode
 */
export function getClusteringConfigForZoom(zoom: number) {
  const { LARGE_DATASET } = PERFORMANCE_CONFIG.CLUSTERING
  if (zoom < 10) return LARGE_DATASET.ZOOM_10
  if (zoom < 12) return LARGE_DATASET.ZOOM_12
  if (zoom < 14) return LARGE_DATASET.ZOOM_14
  if (zoom < 16) return LARGE_DATASET.ZOOM_16
  return LARGE_DATASET.ZOOM_18
}

export type PerformanceConfig = typeof PERFORMANCE_CONFIG
