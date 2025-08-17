'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { StoryMap } from '../types';
import { useTranslation } from '../i18n/useTranslation';

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

export const useStoryMapLogic = () => {
  const { language } = useTranslation();
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
  const [detailedStoriesData, setDetailedStoriesData] = useState<StoryMap[]>([]);
  const [fullDatabaseData, setFullDatabaseData] = useState<StoryMap[]>([]);
  const [mode, setMode] = useState<'stories' | 'database'>('stories');

  // Function to load English data from GeoJSON
  const loadEnglishDataFromGeoJSON = async () => {
    const response = await fetch('/jewish_businesses.geojson');
    const geoData = await response.json();
    
    return geoData.features.map((feature: any, index: number) => ({
      id: `geojson_${index + 1}`,
      title: feature.properties.name,
      author: "Historical Database",
      description: feature.properties.description || "",
      address: feature.properties.address,
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
      startDate: feature.properties.registration_date,
      endDate: feature.properties.liquidation_date,
      midDate: feature.properties.takeover_date,
      category: feature.properties.category || "business",
      businessType: feature.properties.business_type,
      state: "active"
    }));
  };

  // Fetch both datasets once on initial mount, language-aware
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Load stories data (always from main stories file - has English)
        const storiesResponse = await fetch('/api/storymaps-test?all=true&stories=true');
        if (!storiesResponse.ok) {
          throw new Error(`HTTP error! status: ${storiesResponse.status}`);
        }
        const storiesData = await storiesResponse.json();
        const storiesDataArray = Array.isArray(storiesData) ? storiesData : storiesData.data || [];
        
        let fullDataArray;
        
        // Load full dataset based on language
        if (language === 'en') {
          // Load English names from GeoJSON
          console.log('Loading English business names from GeoJSON');
          fullDataArray = await loadEnglishDataFromGeoJSON();
        } else {
          // Load German names from API
          console.log('Loading German business names from API');
          const fullResponse = await fetch('/api/storymaps-test?all=true');
          if (!fullResponse.ok) {
            throw new Error(`HTTP error! status: ${fullResponse.status}`);
          }
          const fullData = await fullResponse.json();
          fullDataArray = Array.isArray(fullData) ? fullData : fullData.data || [];
        }
        
        console.log(`Loaded ${fullDataArray.length} businesses from full dataset`);
        console.log(`Loaded ${storiesDataArray.length} detailed stories`);
        
        // Store both datasets
        setFullDatabaseData(fullDataArray);
        setDetailedStoriesData(storiesDataArray);
        setEnrichedStories(fullDataArray); // Set initial enriched stories
        setTotalItems(fullDataArray.length);
        
        // Convert full dataset to GeoJSON format (used for both modes)
        const geoFeatures: BusinessFeature[] = fullDataArray.map((story: StoryMap) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [story.lng || 13.405, story.lat || 52.52] as [number, number]
          },
          properties: {
            name: story.title,
            business_type: story.businessType || '',
            category: story.category || '',
            address: story.address || '',
            registration_date: story.startDate || '',
            liquidation_date: story.endDate || '',
            takeover_date: story.midDate || ''
          }
        }));
        setJewishBusinesses(geoFeatures);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setEnrichedStories([]);
        setFullDatabaseData([]);
        setDetailedStoriesData([]);
        setJewishBusinesses([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, [language]); // Reload when language changes
  
  // Background loading removed - all data loads upfront for stable clustering

  // Function to extract business type from story title
  const extractBusinessTypeFromTitle = (title: string): string | undefined => {
    const businessTypePatterns = [
      { pattern: /tailor\s*shop/i, type: 'Tailoring' },
      { pattern: /department\s*store/i, type: 'Department Store' },
      { pattern: /medical\s*practice/i, type: 'Medical Practice' },
      { pattern: /photography\s*agency/i, type: 'Photography Agency' },
      { pattern: /fine\s*foods/i, type: 'Fine Foods' },
      { pattern: /textiles/i, type: 'Textiles' },
      { pattern: /bakery/i, type: 'Bakery' },
      { pattern: /restaurant/i, type: 'Restaurant' },
      { pattern: /cafe/i, type: 'Café' },
      { pattern: /theater/i, type: 'Theater' },
      { pattern: /bookstore/i, type: 'Bookstore' },
      { pattern: /furrier/i, type: 'Furrier' },
      { pattern: /bank/i, type: 'Bank' },
      { pattern: /lawyer/i, type: 'Law Office' },
      { pattern: /dentist/i, type: 'Dental Practice' },
      { pattern: /doctor/i, type: 'Medical Practice' },
      { pattern: /pharmacy/i, type: 'Pharmacy' }
    ];

    for (const { pattern, type } of businessTypePatterns) {
      if (pattern.test(title)) {
        return type;
      }
    }
    return undefined;
  };

  useEffect(() => {
    // Enhance stories with business type data
    const enhancedStories = enrichedStories.map(story => {
      // First try to find matching business in Jewish businesses dataset
      const matchingBusiness = jewishBusinesses.find(business =>
        story.title.toLowerCase().includes(business.properties.name.toLowerCase()) ||
        business.properties.name.toLowerCase().includes(story.title.toLowerCase())
      );
      
      // If found in dataset, use that business type
      if (matchingBusiness?.properties.business_type) {
        return {
          ...story,
          businessType: matchingBusiness.properties.business_type
        };
      }
      
      // Otherwise, extract business type from the story title
      const extractedType = extractBusinessTypeFromTitle(story.title);
      if (extractedType) {
        return {
          ...story,
          businessType: extractedType
        };
      }
      
      // Fall back to existing businessType or undefined
      return story;
    });
    
    setVisibleStories(enhancedStories);
  }, [enrichedStories, jewishBusinesses, currentDate]);

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
    
    // Use the appropriate dataset based on mode
    const dataToUse = mode === 'stories' ? detailedStoriesData : fullDatabaseData;
    
    // Add markers from the selected dataset
    dataToUse.forEach(story => {
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
      const enrichedStory = dataToUse.find(story => 
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
  }, [jewishBusinesses, detailedStoriesData, fullDatabaseData, mode]);

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

  // Update visible stories and enriched stories based on mode
  useEffect(() => {
    if (mode === 'stories') {
      setVisibleStories(detailedStoriesData);
      setEnrichedStories(detailedStoriesData);
      setTotalItems(detailedStoriesData.length);
    } else {
      setVisibleStories(fullDatabaseData);
      setEnrichedStories(fullDatabaseData);
      setTotalItems(fullDatabaseData.length);
    }
  }, [fullDatabaseData, detailedStoriesData, mode]);

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
    isLoading,
    mode,
    setMode
  };
};

export const berlinCoordinates: [number, number] = [52.52, 13.405];
export const defaultZoom = 12;