'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { StoryMap } from '../types'
import { preloadTimelineData } from '../utils/timelineLoader'
import {
  loadAllPostwarSites,
  isSiteDocumentedInYear,
  postwarBoundsForSite,
  type PostwarSite,
} from '../utils/postwarLoader'

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
  // The timeline used to stop at 1945, which meant the archive ended at the catastrophe and the
  // documented afterlife of these addresses was unreachable. It now runs to the present so the
  // slider can answer "and what is there now?" - see POSTWAR_ERA_START / PRESENT_DAY_YEAR below.
  const [maxDate] = useState<Date>(new Date(`${PRESENT_DAY_YEAR}-12-31`))
  const [postwarSites, setPostwarSites] = useState<Record<string, PostwarSite>>({})
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

  // Post-1945 occupancy for the featured addresses. One cached fetch of a ~36KB file; failure
  // is non-fatal and simply leaves the postwar map empty rather than breaking the wartime map.
  useEffect(() => {
    let cancelled = false
    loadAllPostwarSites()
      .then((sites) => {
        if (!cancelled) setPostwarSites(sites)
      })
      .catch(() => {
        if (!cancelled) setPostwarSites({})
      })
    return () => {
      cancelled = true
    }
  }, [])

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

      // From 1946 the map stops being about businesses - they are all gone - and becomes about
      // the addresses. A pin turns 'standing' only where a source actually documents what
      // occupied the site that year. Everything else stays 'closed', which is the honest
      // reading: the overwhelming majority of these 10,000 addresses have no recorded
      // afterlife at all, and the near-empty postwar map is itself the finding.
      if (
        year >= POSTWAR_ERA_START &&
        isSiteDocumentedInYear(postwarSites[story.id], year, PRESENT_DAY_YEAR)
      ) {
        state = 'standing'
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
  }, [currentDate, viewMode, filterStoriesByMode, isUnlocated, postwarSites])

  // Same points as testMarkers but with the raw year boundaries instead of a resolved `state`,
  // so this array keeps its identity as the slider moves. MapboxMap turns it into a single
  // GeoJSON source and recolours on the GPU; deriving state there is what makes a date change
  // an expression swap rather than a 10k-point re-cluster and full marker re-render.
  // `declineYear` must stay in lockstep with the 70%-of-lifespan rule used in testMarkers above.
  const timeMarkers = useMemo(() => {
    const modeFiltered = filterStoriesByMode(viewMode).filter((story) => !isUnlocated(story))

    return modeFiltered.map((story) => {
      const startYear = story.startDate ? new Date(story.startDate).getFullYear() : 1900
      const endYear = story.endDate ? new Date(story.endDate).getFullYear() : 1945
      // Year bounds, not a resolved state: like startYear/endYear these stay constant while the
      // slider moves, so the GL layer can recolour via a paint property instead of reloading
      // 10k features on every tick.
      const { from: postwarFrom, to: postwarTo } = postwarBoundsForSite(
        postwarSites[story.id],
        PRESENT_DAY_YEAR
      )
      return {
        id: story.id,
        position: [story.lat, story.lng] as [number, number],
        popup: story.title,
        startYear,
        endYear,
        midYear: Math.ceil(startYear + (endYear - startYear) * 0.7),
        postwarFrom,
        postwarTo,
      }
    })
  }, [viewMode, filterStoriesByMode, isUnlocated, postwarSites])

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
    timeMarkers,
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

/**
 * Where the map stops being about businesses and starts being about addresses.
 *
 * 1945, not 1946, because the earliest documented postwar occupancies begin in 1945 itself -
 * the Jonass building passing to the SED, the Ebro factory going under Soviet trusteeship. A
 * 1946 cutoff would have hidden those for a year and put the legend out of step with the pins.
 */
export const POSTWAR_ERA_START = 1945

/**
 * End of the slider. A fixed year, not `new Date().getFullYear()`: the postwar dataset is a
 * fixed extraction from the exhibition catalogue and the occupancy records, so silently
 * extending the axis every 1 January would imply currency the sources do not have.
 */
export const PRESENT_DAY_YEAR = 2025

export const berlinCoordinates: [number, number] = [52.52, 13.405]
export const defaultZoom = 11
