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
 * @returns TimelineContent or null if no timeline data exists
 */
export function getTimelineContentForDate(
  timelineData: TimelineData | null, 
  currentDate: Date
): TimelineContent | null {
  if (!timelineData || !timelineData.timeline || timelineData.timeline.length === 0) {
    return null;
  }

  const currentTime = currentDate.getTime();

  // First, try to find exact match
  for (const content of timelineData.timeline) {
    const startTime = new Date(content.startDate).getTime();
    const endTime = content.endDate ? new Date(content.endDate).getTime() : Infinity;

    if (currentTime >= startTime && currentTime <= endTime) {
      return content;
    }
  }

  // If no exact match, find the nearest period
  // Sort timeline by start date to ensure correct ordering
  const sortedTimeline = [...timelineData.timeline].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // If before all periods, return the first period
  const firstPeriodStart = new Date(sortedTimeline[0].startDate).getTime();
  if (currentTime < firstPeriodStart) {
    return sortedTimeline[0];
  }

  // If after all periods, return the last period
  const lastPeriod = sortedTimeline[sortedTimeline.length - 1];
  const lastPeriodEnd = lastPeriod.endDate 
    ? new Date(lastPeriod.endDate).getTime() 
    : Infinity;
  if (currentTime > lastPeriodEnd) {
    return lastPeriod;
  }

  // If between periods, return the previous period (most recent valid state)
  for (let i = sortedTimeline.length - 1; i >= 0; i--) {
    const periodStart = new Date(sortedTimeline[i].startDate).getTime();
    if (currentTime >= periodStart) {
      return sortedTimeline[i];
    }
  }

  // Fallback to first period (should never reach here)
  return sortedTimeline[0];
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