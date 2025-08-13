'use client';

import { useState, useEffect, useMemo } from 'react';
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

interface Marker {
  id: string;
  position: [number, number];
  popup: string;
  state: string;
  hasEnrichedData?: boolean;
  businessType?: string;
}

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
        const response = await fetch('/jewish_businesses.geojson');
        if (response.ok) {
          const data = await response.json();
          setJewishBusinesses(data.features || []);
        }
      } catch (error) {
        console.error('Error fetching Jewish businesses:', error);
      }
    };
    
    // Fetch enriched story data (with additional text, images, etc.)
    const fetchEnrichedStories = async () => {
      try {
        const response = await fetch('/api/storymaps');
        if (response.ok) {
          const data = await response.json();
          setEnrichedStories(data);
        }
      } catch (error) {
        console.error('Error fetching enriched stories:', error);
      }
    };
    
    fetchJewishBusinesses();
    fetchEnrichedStories();
  }, []);

  useEffect(() => {
    // Show enriched stories in the sidebar
    setVisibleStories(enrichedStories);
  }, [enrichedStories, currentDate]);

  const handleMarkerClick = (storyId: string) => {
    setActiveStoryId(storyId);
  };

  // Create markers from both enriched stories and Jewish businesses database
  const testMarkers = useMemo(() => {
    const markers: Marker[] = [];
    const year = currentDate.getFullYear();
    
    // First, add markers from enriched stories (these have proper lat/lng)
    enrichedStories.forEach(story => {
      if (story.lat && story.lng) {
        // Determine story state based on dates
        let state = 'active';
        const startYear = story.startDate ? new Date(story.startDate).getFullYear() : 1900;
        const endYear = story.endDate ? new Date(story.endDate).getFullYear() : 1945;
        const midYear = story.midDate ? new Date(story.midDate).getFullYear() : null;
        
        if (year < startYear) {
          state = 'future';
        } else if (year > endYear) {
          state = 'closed';
        } else if (midYear && year >= midYear) {
          state = 'declining';
        }
        
        markers.push({
          id: story.id,
          position: [story.lat, story.lng] as [number, number],
          popup: story.title,
          state,
          hasEnrichedData: true
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
        // Determine business state based on dates
        let state = 'active';
        const regYear = business.properties.registration_date ? parseInt(business.properties.registration_date) : 1900;
        const liqYear = business.properties.liquidation_date ? parseInt(business.properties.liquidation_date) : 1945;
        const takeoverYear = business.properties.takeover_date ? parseInt(business.properties.takeover_date) : null;
        
        if (year < regYear) {
          state = 'future';
        } else if (year > liqYear) {
          state = 'closed';
        } else if (takeoverYear && year >= takeoverYear) {
          state = 'declining';
        }
        
        markers.push({
          id: `business-${business.properties.name}`,
          position: [business.geometry.coordinates[1], business.geometry.coordinates[0]] as [number, number],
          popup: business.properties.name,
          state,
          businessType: business.properties.business_type,
          hasEnrichedData: false
        });
      }
    });
    
    return markers;
  }, [jewishBusinesses, enrichedStories, currentDate]);

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