'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { StoryMap } from '../types';

interface JewishBusiness {
  name: string;
  business_type: string;
  category: string;
  address: string;
  registration_date: string;
  liquidation_date: string;
  takeover_date: string;
}

interface BusinessFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: JewishBusiness;
}

interface PaginatedResponse {
  data: StoryMap[];
  metadata: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Marker interface moved inline as needed

export const useStoryMapLogicTest = () => {
  const [jewishBusinesses, setJewishBusinesses] = useState<BusinessFeature[]>([]);
  const [enrichedStories, setEnrichedStories] = useState<StoryMap[]>([]);
  const [visibleStories, setVisibleStories] = useState<StoryMap[]>([]);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date('1920-01-01'));
  const [minDate] = useState<Date>(new Date('1920-01-01'));
  const [maxDate] = useState<Date>(new Date('1945-12-31'));
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [totalItems, setTotalItems] = useState(0);

  // Fetch data from the test API endpoint
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Use the test API endpoint for full dataset
        const response = await fetch('/api/storymaps-test?all=true');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle both paginated and non-paginated responses
        const storyMaps = Array.isArray(data) ? data : data.data || [];
        
        if (storyMaps.length === 0) {
          console.warn('No data received from test API. The test dataset may not be ready yet.');
          setEnrichedStories([]);
          setVisibleStories([]);
          setIsLoading(false);
          return;
        }
        
        console.log(`Loaded ${storyMaps.length} businesses from test dataset`);
        
        setEnrichedStories(storyMaps);
        setTotalItems(storyMaps.length);
        
      } catch (error) {
        console.error('Error fetching test storymaps data:', error);
        // Set empty data rather than crashing
        setEnrichedStories([]);
        setVisibleStories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter stories based on current date
  const filterStoriesByDate = useCallback((stories: StoryMap[], date: Date) => {
    return stories.filter(story => {
      const startDate = new Date(story.startDate);
      const endDate = story.endDate ? new Date(story.endDate) : new Date('1945-12-31');
      
      return date >= startDate && date <= endDate;
    });
  }, []);

  // Update visible stories when enriched stories or current date changes
  useEffect(() => {
    if (enrichedStories.length > 0) {
      const filtered = filterStoriesByDate(enrichedStories, currentDate);
      setVisibleStories(filtered);
    }
  }, [enrichedStories, currentDate, filterStoriesByDate]);

  // Create test markers from visible stories
  const testMarkers = useMemo(() => {
    return visibleStories.map((story, index) => ({
      id: story.id,
      position: [story.lat, story.lng] as [number, number],
      title: story.title,
      description: story.description,
      author: story.author,
      address: story.address,
      startDate: story.startDate,
      endDate: story.endDate,
      category: story.category,
      state: story.state || 'active',
      index
    }));
  }, [visibleStories]);

  const handleMarkerClick = useCallback((markerId: string) => {
    setActiveStoryId(markerId);
  }, []);

  return {
    visibleStories,
    activeStoryId,
    currentDate,
    minDate,
    maxDate,
    setCurrentDate,
    handleMarkerClick,
    testMarkers,
    setActiveStoryId,
    isLoading,
    totalItems
  };
};

export const berlinCoordinates: [number, number] = [52.5200, 13.4050];
export const defaultZoom = 11;