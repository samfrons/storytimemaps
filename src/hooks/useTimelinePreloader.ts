// Timeline preloading hook for optimistic UI
import { useEffect, useRef } from 'react';
import { preloadTimelineData } from '../utils/timelineLoader';

interface UseTimelinePreloaderProps {
  /** Current date being viewed */
  currentDate: Date;
  /** All visible businesses that might have timeline data */
  businessIds: string[];
  /** Whether preloading is enabled (can be disabled for performance) */
  enabled?: boolean;
}

/**
 * Preloads timeline data for nearby time periods and businesses
 * to enable smooth timeline scrubbing and instant navigation
 */
export function useTimelinePreloader({
  currentDate,
  businessIds,
  enabled = true
}: UseTimelinePreloaderProps) {
  const lastPreloadTime = useRef<number>(0);
  const preloadCache = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || businessIds.length === 0) return;

    // Throttle preloading to avoid excessive requests
    const now = Date.now();
    if (now - lastPreloadTime.current < 1000) { // Max once per second
      return;
    }

    // Create a cache key for this preload batch
    const cacheKey = `${currentDate.getTime()}-${businessIds.slice(0, 10).join(',')}`;
    
    // Skip if we've already preloaded this batch
    if (preloadCache.current.has(cacheKey)) {
      return;
    }

    lastPreloadTime.current = now;
    preloadCache.current.add(cacheKey);

    // Limit preloading to first 10 visible businesses for performance
    const businessesToPreload = businessIds.slice(0, 10);

    // Preload timeline data in background
    const preloadPromise = preloadTimelineData(businessesToPreload);

    // Clean up old cache entries to prevent memory leaks
    if (preloadCache.current.size > 20) {
      const oldEntries = Array.from(preloadCache.current).slice(0, 10);
      oldEntries.forEach(entry => preloadCache.current.delete(entry));
    }

    // Don't wait for preloading to complete - it's optimistic
    preloadPromise.catch((error) => {
      console.debug('Timeline preloading failed (non-critical):', error);
    });

  }, [currentDate, businessIds, enabled]);

  // Clear cache when component unmounts
  useEffect(() => {
    return () => {
      preloadCache.current.clear();
    };
  }, []);
}