// Year Marker Loader Utility
// Handles loading and filtering year markers for featured story listings

import { YearMarker, YearMarkersConfig } from '../types';

// Cache for loaded year markers
let yearMarkersCache: YearMarker[] | null = null;
let loadingPromise: Promise<YearMarker[]> | null = null;

/**
 * Load year markers from the configuration file
 * Uses caching to prevent multiple fetches
 */
export async function loadYearMarkers(): Promise<YearMarker[]> {
  // Return cached data if available
  if (yearMarkersCache) {
    return yearMarkersCache;
  }

  // If already loading, wait for that promise
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start loading
  loadingPromise = (async () => {
    try {
      const response = await fetch('/data/year-markers.json');
      if (!response.ok) {
        console.warn('Failed to load year markers:', response.status);
        return [];
      }
      const config: YearMarkersConfig = await response.json();
      yearMarkersCache = config.markers || [];
      return yearMarkersCache;
    } catch (error) {
      console.warn('Error loading year markers:', error);
      return [];
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * Get the date object for a year marker
 */
export function getMarkerDate(marker: YearMarker): Date {
  return new Date(
    marker.year,
    (marker.month || 1) - 1, // JavaScript months are 0-indexed
    marker.day || 1
  );
}

/**
 * Check if a year marker should be visible based on current timeline date
 * @param marker - The year marker to check
 * @param currentDate - The current timeline date
 * @param showFutureMarkers - Whether to show markers for dates not yet reached
 */
export function isMarkerVisible(
  marker: YearMarker,
  currentDate: Date,
  showFutureMarkers: boolean = true
): boolean {
  // Always show if configured to show always
  if (marker.showAlways && showFutureMarkers) {
    return true;
  }

  // Check if timeline has reached or passed this marker's date
  const markerDate = getMarkerDate(marker);
  return currentDate >= markerDate;
}

/**
 * Get markers that are relevant for the current timeline date
 * @param markers - All year markers
 * @param currentDate - Current timeline date
 * @param options - Filter options
 */
export function getVisibleMarkers(
  markers: YearMarker[],
  currentDate: Date,
  options: {
    showFutureMarkers?: boolean;
    filterByType?: YearMarker['type'][];
  } = {}
): YearMarker[] {
  const { showFutureMarkers = true, filterByType } = options;

  return markers.filter(marker => {
    // Check visibility based on date
    if (!isMarkerVisible(marker, currentDate, showFutureMarkers)) {
      return false;
    }

    // Filter by type if specified
    if (filterByType && filterByType.length > 0) {
      if (!filterByType.includes(marker.type)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort markers by date and priority
 */
export function sortMarkers(markers: YearMarker[]): YearMarker[] {
  return [...markers].sort((a, b) => {
    const dateA = getMarkerDate(a);
    const dateB = getMarkerDate(b);

    // Sort by date first
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }

    // Then by priority (lower number = higher priority)
    const priorityA = a.priority ?? 10;
    const priorityB = b.priority ?? 10;
    return priorityA - priorityB;
  });
}

/**
 * Get the marker that is most relevant for the current date
 * (the most recent marker that has been passed)
 */
export function getCurrentMarker(
  markers: YearMarker[],
  currentDate: Date
): YearMarker | null {
  const sortedMarkers = sortMarkers(markers);
  let currentMarker: YearMarker | null = null;

  for (const marker of sortedMarkers) {
    const markerDate = getMarkerDate(marker);
    if (markerDate <= currentDate) {
      currentMarker = marker;
    } else {
      break;
    }
  }

  return currentMarker;
}

/**
 * Get the next upcoming marker after the current date
 */
export function getNextMarker(
  markers: YearMarker[],
  currentDate: Date
): YearMarker | null {
  const sortedMarkers = sortMarkers(markers);

  for (const marker of sortedMarkers) {
    const markerDate = getMarkerDate(marker);
    if (markerDate > currentDate) {
      return marker;
    }
  }

  return null;
}

/**
 * Get markers within a date range
 */
export function getMarkersInRange(
  markers: YearMarker[],
  startDate: Date,
  endDate: Date
): YearMarker[] {
  return sortMarkers(markers).filter(marker => {
    const markerDate = getMarkerDate(marker);
    return markerDate >= startDate && markerDate <= endDate;
  });
}

/**
 * Get the type color for a marker (using CSS variables)
 */
export function getMarkerTypeColor(type: YearMarker['type']): string {
  switch (type) {
    case 'historical-event':
      return 'var(--danger)';
    case 'period-start':
      return 'var(--success)';
    case 'period-end':
      return 'var(--foreground-muted)';
    case 'milestone':
      return 'var(--primary)';
    case 'legislation':
      return 'var(--warning)';
    default:
      return 'var(--primary)';
  }
}

/**
 * Get a human-readable label for marker type
 */
export function getMarkerTypeLabel(type: YearMarker['type']): string {
  switch (type) {
    case 'historical-event':
      return 'Historical Event';
    case 'period-start':
      return 'Period Begins';
    case 'period-end':
      return 'Period Ends';
    case 'milestone':
      return 'Milestone';
    case 'legislation':
      return 'Legislation';
    default:
      return 'Event';
  }
}

/**
 * Format marker date for display
 */
export function formatMarkerDate(marker: YearMarker): string {
  const date = getMarkerDate(marker);

  // If only year specified, show just year
  if (!marker.month) {
    return marker.year.toString();
  }

  // If month specified, show MM.YYYY
  const month = String(date.getMonth() + 1).padStart(2, '0');

  // If day specified, show DD.MM.YYYY
  if (marker.day) {
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}.${month}.${marker.year}`;
  }

  return `${month}.${marker.year}`;
}

/**
 * Clear the year markers cache (useful for testing or refreshing data)
 */
export function clearYearMarkersCache(): void {
  yearMarkersCache = null;
  loadingPromise = null;
}
