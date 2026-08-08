'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { StoryMap } from '../types'
import { preloadTimelineData } from '../utils/timelineLoader'

// Keeping for future use when integrating Jewish business data
// interface JewishBusiness {
//   name: string;
//   business_type: string;
//   category: string;
//   address: string;
//   registration_date: string;
//   liquidation_date: string;
//   takeover_date: string;
// }

// Keeping for future use when integrating GeoJSON data
// interface BusinessFeature {
//   type: 'Feature';
//   geometry: {
//     type: 'Point';
//     coordinates: [number, number];
//   };
//   properties: JewishBusiness;
// }

// Keeping for future use when pagination is needed
// interface PaginatedResponse {
//   data: StoryMap[];
//   metadata: {
//     page: number;
//     pageSize: number;
//     totalItems: number;
//     totalPages: number;
//     hasNextPage: boolean;
//     hasPreviousPage: boolean;
//   };
// }

// Marker interface moved inline as needed

export const useStoryMapLogicTest = () => {
  // Keeping for future use when Jewish businesses data is integrated
  // const [jewishBusinesses, setJewishBusinesses] = useState<BusinessFeature[]>([]);
  const [enrichedStories, setEnrichedStories] = useState<StoryMap[]>([])
  const [visibleStories, setVisibleStories] = useState<StoryMap[]>([])
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState<Date>(new Date('1920-01-01'))
  const [minDate] = useState<Date>(new Date('1920-01-01'))
  const [maxDate] = useState<Date>(new Date('1945-12-31'))
  const [isLoading, setIsLoading] = useState(true)

  const [totalItems, setTotalItems] = useState(0)
  const [viewMode, setViewMode] = useState<'stories' | 'database'>('stories')
  const [detailedStoriesData, setDetailedStoriesData] = useState<StoryMap[]>([])

  // Fetch data from the test API endpoint - combined endpoint for better performance
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Single combined request instead of 2 parallel requests
        const response = await fetch('/api/storymaps-test?combined=true')

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const combinedData = await response.json()

        // Extract both datasets from combined response
        const fullStoryMaps = combinedData.full || []
        const detailedStories = combinedData.stories || []

        console.log(`Loaded ${fullStoryMaps.length} businesses from full test dataset`)
        console.log(`Loaded ${detailedStories.length} detailed stories`)

        // Store both datasets - we'll use them based on mode
        setEnrichedStories(fullStoryMaps)
        setTotalItems(fullStoryMaps.length)

        // Store detailed stories
        setDetailedStoriesData(detailedStories)
      } catch (error) {
        console.error('Error fetching test storymaps data:', error)
        // Set empty data rather than crashing
        setEnrichedStories([])
        setVisibleStories([])
        setDetailedStoriesData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Prefetch timeline JSONs for the first detailed stories that have
  // timeline data, so the BusinessDetailModal opens instantly when a
  // user clicks a marker. Runs once after the dataset arrives. The
  // request is fire-and-forget; failures are absorbed by the loader.
  useEffect(() => {
    if (detailedStoriesData.length === 0) return
    const ids = detailedStoriesData
      .filter((s) => s.hasTimelineData)
      .slice(0, 10)
      .map((s) => s.id)
    if (ids.length === 0) return
    void preloadTimelineData(ids)
  }, [detailedStoriesData])

  // Helper function to check if a business has detailed story content
  const hasDetailedStory = useCallback((story: StoryMap) => {
    return !!(story.longDescription && story.longDescription.trim().length > 0)
  }, [])

  // Filter stories based on view mode
  const filterStoriesByMode = useCallback(
    (mode: 'stories' | 'database') => {
      if (mode === 'stories') {
        return detailedStoriesData // Return the detailed stories from main dataset
      }
      return enrichedStories // Return all test data for database mode
    },
    [detailedStoriesData, enrichedStories]
  )

  // Update visible stories when enriched stories or view mode changes
  // Remove date filtering for list display - show all stories in the selected mode
  useEffect(() => {
    if (enrichedStories.length > 0 || detailedStoriesData.length > 0) {
      const modeFiltered = filterStoriesByMode(viewMode)
      setVisibleStories(modeFiltered)
    }
  }, [enrichedStories, detailedStoriesData, viewMode, filterStoriesByMode])

  // Records whose address could not be geocoded fall back to the Berlin centroid, so ~1,000 of
  // them stack on one pixel and render as a permanent blob that no clustering radius can break
  // apart. Drop them from the MAP only - they stay in the list, and the count is surfaced via
  // unlocatedCount so the omission is visible rather than silent. Deliberately not jittered into
  // invented positions: CLAUDE.md requires historical accuracy, and these addresses are unresolved.
  const isUnlocated = useCallback(
    (story: { lat: number; lng: number }) =>
      story.lat === berlinCoordinates[0] && story.lng === berlinCoordinates[1],
    []
  )

  const unlocatedCount = useMemo(
    () => filterStoriesByMode(viewMode).filter(isUnlocated).length,
    [viewMode, filterStoriesByMode, isUnlocated]
  )

  // Create test markers based on view mode
  const testMarkers = useMemo(() => {
    const year = currentDate.getFullYear()
    const modeFiltered = filterStoriesByMode(viewMode).filter((story) => !isUnlocated(story))

    return modeFiltered.map((story) => {
      // Calculate state based on current date
      let state = 'active'
      const startYear = story.startDate ? new Date(story.startDate).getFullYear() : 1900
      const endYear = story.endDate ? new Date(story.endDate).getFullYear() : 1945

      if (year < startYear) {
        state = 'future'
      } else if (year > endYear) {
        state = 'closed'
      } else if (year >= startYear + (endYear - startYear) * 0.7) {
        // Business is declining in its last 30% of life
        state = 'declining'
      }

      return {
        id: story.id,
        position: [story.lat, story.lng] as [number, number],
        popup: story.title,
        state: state,
        // Convert null to undefined for type compatibility
        description: story.description ?? undefined,
        startDate: story.startDate ?? undefined,
        endDate: story.endDate ?? undefined,
      }
    })
  }, [currentDate, viewMode, filterStoriesByMode, isUnlocated])

  const handleMarkerClick = useCallback((markerId: string) => {
    setActiveStoryId(markerId)
  }, [])

  // Calculate counts for the mode toggle
  const storiesWithDetailCount = useMemo(() => {
    return detailedStoriesData.length
  }, [detailedStoriesData])

  return {
    visibleStories,
    enrichedStories, // Export all stories for test page
    activeStoryId,
    currentDate,
    minDate,
    maxDate,
    setCurrentDate,
    handleMarkerClick,
    testMarkers,
    setActiveStoryId,
    isLoading,
    totalItems,
    viewMode,
    setViewMode,
    storiesWithDetailCount,
    hasDetailedStory,
    unlocatedCount,
  }
}

export const berlinCoordinates: [number, number] = [52.52, 13.405]
export const defaultZoom = 11
