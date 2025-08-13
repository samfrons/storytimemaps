'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { StoryMap } from '../types';
import { fetchWithCache } from '../utils/fetchWithCache';

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

// Marker interface moved inline as needed

export const useStoryMapLogic = () => {
  const [jewishBusinesses, setJewishBusinesses] = useState<BusinessFeature[]>([]);
  const [enrichedStories, setEnrichedStories] = useState<StoryMap[]>([]);
  const [visibleStories, setVisibleStories] = useState<StoryMap[]>([]);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date('1920-01-01'));
  const [minDate] = useState<Date>(new Date('1920-01-01'));
  const [maxDate] = useState<Date>(new Date('1945-12-31'));

  useEffect(() => {
    // Fetch Jewish businesses data as the primary data source
    const fetchJewishBusinesses = async () => {
      try {
        const data = await fetchWithCache('/jewish_businesses.geojson');
        setJewishBusinesses(data.features || []);
      } catch (error) {
        console.error('Error fetching Jewish businesses:', error);
      }
    };
    
    // Fetch enriched story data (with additional text, images, etc.)
    const fetchEnrichedStories = async () => {
      try {
        const data = await fetchWithCache('/api/storymaps');
        setEnrichedStories(data);
      } catch (error) {
        console.error('Error fetching enriched stories:', error);
      }
    };
    
    // Fetch both in parallel
    Promise.all([fetchJewishBusinesses(), fetchEnrichedStories()]);
  }, []);

  useEffect(() => {
    // Show enriched stories in the sidebar
    setVisibleStories(enrichedStories);
  }, [enrichedStories, currentDate]);

  const handleMarkerClick = useCallback((storyId: string) => {
    setActiveStoryId(storyId);
  }, []);

  // Pre-compute base marker data that doesn't change with date
  const baseMarkers = useMemo(() => {
    const markers: Array<{
      id: string;
      position: [number, number];
      popup: string;
      startYear: number;
      endYear: number;
      midYear: number | null;
      hasEnrichedData?: boolean;
      businessType?: string;
      type: string;
    }> = [];
    
    // First, add markers from enriched stories (these have proper lat/lng)
    enrichedStories.forEach(story => {
      if (story.lat && story.lng) {
        markers.push({
          id: story.id,
          position: [story.lat, story.lng] as [number, number],
          popup: story.title,
          startYear: story.startDate ? new Date(story.startDate).getFullYear() : 1900,
          endYear: story.endDate ? new Date(story.endDate).getFullYear() : 1945,
          midYear: story.midDate ? new Date(story.midDate).getFullYear() : null,
          hasEnrichedData: true,
          type: 'story'
        });
      }
    });
    
    // Then add Jewish businesses that don't have enriched data
    jewishBusinesses.forEach(business => {
      const enrichedStory = enrichedStories.find(story => 
        story.title.toLowerCase().includes(business.properties.name.toLowerCase()) ||
        business.properties.name.toLowerCase().includes(story.title.toLowerCase())
      );
      
      // Only add if not already added from enriched stories
      if (!enrichedStory) {
        markers.push({
          id: `business-${business.properties.name}`,
          position: [business.geometry.coordinates[1], business.geometry.coordinates[0]] as [number, number],
          popup: business.properties.name,
          startYear: business.properties.registration_date ? parseInt(business.properties.registration_date) : 1900,
          endYear: business.properties.liquidation_date ? parseInt(business.properties.liquidation_date) : 1945,
          midYear: business.properties.takeover_date ? parseInt(business.properties.takeover_date) : null,
          businessType: business.properties.business_type,
          hasEnrichedData: false,
          type: 'business'
        });
      }
    });
    
    return markers;
  }, [jewishBusinesses, enrichedStories]);

  // Calculate marker states based on current date
  const testMarkers = useMemo(() => {
    const year = currentDate.getFullYear();
    
    return baseMarkers.map(marker => {
      let state = 'active';
      
      if (year < marker.startYear) {
        state = 'future';
      } else if (year > marker.endYear) {
        state = 'closed';
      } else if (marker.midYear && year >= marker.midYear) {
        state = 'declining';
      }
      
      // Clean up the marker object for output
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { startYear, endYear, midYear, type, ...cleanMarker } = marker;
      return {
        ...cleanMarker,
        state
      };
    });
  }, [baseMarkers, currentDate]);

  return {
    jewishBusinesses,
    enrichedStories,
    visibleStories,
    activeStoryId,
    currentDate,
    minDate,
    maxDate,
    setCurrentDate,
    handleMarkerClick,
    testMarkers,
    setActiveStoryId,
  };
};

export const berlinCoordinates: [number, number] = [52.52, 13.405];
export const defaultZoom = 12;