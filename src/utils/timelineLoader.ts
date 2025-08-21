// Timeline data loading utilities with caching and error handling

import { TimelineData, TimelineContent } from '../types';

// Cache for timeline data to prevent redundant API calls
const timelineCache = new Map<string, TimelineData | null>();

// Track pending requests to prevent duplicate fetches
const pendingRequests = new Map<string, Promise<TimelineData | null>>();

// Loading state tracking for UI feedback
const loadingStates = new Map<string, boolean>();
const loadingCallbacks = new Map<string, Set<(loading: boolean) => void>>();

/**
 * Subscribe to loading state changes for a specific business
 * @param businessId - The ID of the business to monitor
 * @param callback - Function called when loading state changes
 * @returns Unsubscribe function
 */
export function subscribeToLoadingState(
  businessId: string, 
  callback: (loading: boolean) => void
): () => void {
  if (!loadingCallbacks.has(businessId)) {
    loadingCallbacks.set(businessId, new Set());
  }
  
  const callbacks = loadingCallbacks.get(businessId)!;
  callbacks.add(callback);
  
  // Immediately call with current state
  callback(loadingStates.get(businessId) || false);
  
  return () => {
    callbacks.delete(callback);
    if (callbacks.size === 0) {
      loadingCallbacks.delete(businessId);
    }
  };
}

/**
 * Set loading state and notify subscribers
 */
function setLoadingState(businessId: string, loading: boolean): void {
  loadingStates.set(businessId, loading);
  const callbacks = loadingCallbacks.get(businessId);
  if (callbacks) {
    callbacks.forEach(callback => callback(loading));
  }
}

/**
 * Loads timeline data for a specific business with caching and loading state tracking
 * @param businessId - The ID of the business to load timeline data for
 * @returns Promise resolving to TimelineData or null if no timeline data exists
 */
export async function loadTimelineData(businessId: string): Promise<TimelineData | null> {
  // Check cache first
  if (timelineCache.has(businessId)) {
    return timelineCache.get(businessId) || null;
  }

  // Check if request is already pending
  if (pendingRequests.has(businessId)) {
    return pendingRequests.get(businessId) || null;
  }

  // Set loading state
  setLoadingState(businessId, true);

  // Create new request
  const request = fetchTimelineData(businessId);
  pendingRequests.set(businessId, request);

  try {
    const result = await request;
    timelineCache.set(businessId, result);
    pendingRequests.delete(businessId);
    setLoadingState(businessId, false);
    return result;
  } catch (error) {
    console.warn(`Failed to load timeline data for business ${businessId}:`, error);
    timelineCache.set(businessId, null); // Cache the failure to prevent retry loops
    pendingRequests.delete(businessId);
    setLoadingState(businessId, false);
    return null;
  }
}

/**
 * Internal function to fetch timeline data from the server
 * @param businessId - The ID of the business
 * @returns Promise resolving to TimelineData or null
 */
async function fetchTimelineData(businessId: string): Promise<TimelineData | null> {
  try {
    const response = await fetch(`/data/timeline/${businessId}.json`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // Timeline data doesn't exist for this business - this is normal
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: TimelineData = await response.json();
    
    // Validate the data structure
    if (!data.businessId || !Array.isArray(data.timeline)) {
      throw new Error('Invalid timeline data structure');
    }

    return data;
  } catch (error) {
    console.error(`Error fetching timeline data for business ${businessId}:`, error);
    return null;
  }
}

/**
 * Gets the appropriate timeline content for a specific date
 * @param timelineData - The timeline data for the business
 * @param currentDate - The current timeline date
 * @returns TimelineContent or null if no matching period found
 */
export function getTimelineContentForDate(
  timelineData: TimelineData | null, 
  currentDate: Date
): TimelineContent | null {
  if (!timelineData) return null;

  const currentTime = currentDate.getTime();

  // Find the timeline content that matches the current date
  for (const content of timelineData.timeline) {
    const startTime = new Date(content.startDate).getTime();
    const endTime = content.endDate ? new Date(content.endDate).getTime() : Infinity;

    if (currentTime >= startTime && currentTime <= endTime) {
      return content;
    }
  }

  return null;
}

/**
 * Gets timeline-aware media for a specific date
 * @param timelineData - The timeline data for the business
 * @param currentDate - The current timeline date
 * @returns Array of media items relevant to the current date
 */
export function getTimelineMediaForDate(
  timelineData: TimelineData | null,
  currentDate: Date
) {
  const content = getTimelineContentForDate(timelineData, currentDate);
  return content?.media || [];
}

/**
 * Clears the timeline cache (useful for component cleanup)
 */
export function clearTimelineCache(): void {
  timelineCache.clear();
  // Note: We don't clear pending requests as they should complete naturally
}

/**
 * Preloads timeline data for multiple businesses
 * @param businessIds - Array of business IDs to preload
 * @returns Promise that resolves when all timeline data is loaded or failed
 */
export async function preloadTimelineData(businessIds: string[]): Promise<void> {
  const promises = businessIds.map(id => loadTimelineData(id));
  await Promise.allSettled(promises);
}

/**
 * Checks if a business has timeline data available (from cache or attempts to load)
 * @param businessId - The ID of the business
 * @returns Promise resolving to boolean indicating if timeline data exists
 */
export async function hasTimelineData(businessId: string): Promise<boolean> {
  const data = await loadTimelineData(businessId);
  return data !== null;
}