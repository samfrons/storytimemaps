'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { StoryMap } from '../types';

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
  const [enrichedStories, setEnrichedStories] = useState<StoryMap[]>([]);
  const [visibleStories, setVisibleStories] = useState<StoryMap[]>([]);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date('1920-01-01'));
  const [minDate] = useState<Date>(new Date('1920-01-01'));
  const [maxDate] = useState<Date>(new Date('1945-12-31'));
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<'stories' | 'database'>('stories');
  const [detailedStoriesData, setDetailedStoriesData] = useState<StoryMap[]>([]);

  // Fetch data from the test API endpoint based on view mode
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch both datasets
        const [fullResponse, storiesResponse] = await Promise.all([
          fetch('/api/storymaps-test?all=true'),
          fetch('/api/storymaps-test?all=true&stories=true')
        ]);
        
        if (!fullResponse.ok || !storiesResponse.ok) {
          throw new Error(`HTTP error! status: ${fullResponse.status} or ${storiesResponse.status}`);
        }
        
        const [fullData, storiesData] = await Promise.all([
          fullResponse.json(),
          storiesResponse.json()
        ]);
        
        // Handle both paginated and non-paginated responses
        const fullStoryMaps = Array.isArray(fullData) ? fullData : fullData.data || [];
        const detailedStories = Array.isArray(storiesData) ? storiesData : storiesData.data || [];
        
        console.log(`Loaded ${fullStoryMaps.length} businesses from full test dataset`);
        console.log(`Loaded ${detailedStories.length} detailed stories`);
        
        // Store both datasets - we'll use them based on mode
        setEnrichedStories(fullStoryMaps);
        setTotalItems(fullStoryMaps.length);
        
        // Store detailed stories count
        setDetailedStoriesData(detailedStories);
        
      } catch (error) {
        console.error('Error fetching test storymaps data:', error);
        // Set empty data rather than crashing
        setEnrichedStories([]);
        setVisibleStories([]);
        setDetailedStoriesData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to check if a business has detailed story content
  const hasDetailedStory = useCallback((story: StoryMap) => {
    return !!(story.longDescription && story.longDescription.trim().length > 0);
  }, []);

  // Filter stories based on view mode
  const filterStoriesByMode = useCallback((mode: 'stories' | 'database') => {
    if (mode === 'stories') {
      return detailedStoriesData; // Return the detailed stories from main dataset
    }
    return enrichedStories; // Return all test data for database mode
  }, [detailedStoriesData, enrichedStories]);

  // Filter stories based on current date
  const filterStoriesByDate = useCallback((stories: StoryMap[], date: Date) => {
    return stories.filter(story => {
      // Handle null startDate - include all businesses without dates for the full dataset
      if (!story.startDate) return true; // Show businesses without dates
      const startDate = new Date(story.startDate);
      const endDate = story.endDate ? new Date(story.endDate) : new Date('1945-12-31');
      
      return date >= startDate && date <= endDate;
    });
  }, []);

  // Update visible stories when enriched stories or view mode changes
  // Remove date filtering for list display - show all stories in the selected mode
  useEffect(() => {
    if (enrichedStories.length > 0 || detailedStoriesData.length > 0) {
      const modeFiltered = filterStoriesByMode(viewMode);
      setVisibleStories(modeFiltered);
    }
  }, [enrichedStories, detailedStoriesData, viewMode, filterStoriesByMode]);

  // Create test markers based on view mode
  const testMarkers = useMemo(() => {
    const year = currentDate.getFullYear();
    const modeFiltered = filterStoriesByMode(viewMode);
    
    return modeFiltered.map((story) => {
      // Calculate state based on current date
      let state = 'active';
      const startYear = story.startDate ? new Date(story.startDate).getFullYear() : 1900;
      const endYear = story.endDate ? new Date(story.endDate).getFullYear() : 1945;
      
      if (year < startYear) {
        state = 'future';
      } else if (year > endYear) {
        state = 'closed';
      } else if (year >= startYear + (endYear - startYear) * 0.7) {
        // Business is declining in its last 30% of life
        state = 'declining';
      }
      
      return {
        id: story.id,
        position: [story.lat, story.lng] as [number, number],
        popup: story.title,
        state: state,
        // Convert null to undefined for type compatibility
        description: story.description ?? undefined,
        startDate: story.startDate ?? undefined,
        endDate: story.endDate ?? undefined
      };
    });
  }, [currentDate, viewMode, filterStoriesByMode]);

  const handleMarkerClick = useCallback((markerId: string) => {
    setActiveStoryId(markerId);
  }, []);

  // Calculate counts for the mode toggle
  const storiesWithDetailCount = useMemo(() => {
    return detailedStoriesData.length;
  }, [detailedStoriesData]);

  return {
    visibleStories,
    enrichedStories,  // Export all stories for test page
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
    hasDetailedStory
  };
};

export const berlinCoordinates: [number, number] = [52.5200, 13.4050];
export const defaultZoom = 11;