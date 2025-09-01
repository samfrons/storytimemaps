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
  description?: string;
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
  const { language } = useTranslation();
  const [jewishBusinesses, setJewishBusinesses] = useState<BusinessFeature[]>([]);
  const [enrichedStories, setEnrichedStories] = useState<StoryMap[]>([]);
  const [visibleStories, setVisibleStories] = useState<StoryMap[]>([]);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date('1920-01-01'));
  const [minDate] = useState<Date>(new Date('1920-01-01'));
  const [maxDate] = useState<Date>(new Date('1945-12-31'));
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(10847); // Start with known total count for immediate display
  const [detailedStoriesData, setDetailedStoriesData] = useState<StoryMap[]>([]);
  const [fullDatabaseData, setFullDatabaseData] = useState<StoryMap[]>([]);
  const [mode, setMode] = useState<'stories' | 'database'>('stories');
  const [viewMode, setViewMode] = useState<'stories' | 'database'>('stories');

  // Note: Removed loadEnglishDataFromGeoJSON - now using API for all languages to ensure all 10,021 businesses are available

  // Fetch both datasets once on initial mount, language-aware
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Load stories data (always from main stories file - has English)
        const storiesResponse = await fetch('/api/storymaps-test?stories=true');
        if (!storiesResponse.ok) {
          throw new Error(`HTTP error! status: ${storiesResponse.status}`);
        }
        const storiesData = await storiesResponse.json();
        const storiesDataArray = Array.isArray(storiesData) ? storiesData : storiesData.data || [];
        
        // Load initial dataset from API for all languages (first page only for stories mode)
        console.log(`Loading initial business data from API for language: ${language}`);
        const initialResponse = await fetch('/api/storymaps-test?page=1&pageSize=200');
        if (!initialResponse.ok) {
          throw new Error(`HTTP error! status: ${initialResponse.status}`);
        }
        const initialData = await initialResponse.json();
        const initialDataArray = Array.isArray(initialData) ? initialData : initialData.data || [];
        
        console.log(`Loaded ${initialDataArray.length} businesses from initial dataset`);
        console.log(`Loaded ${storiesDataArray.length} detailed stories`);
        
        // Store both datasets
        setFullDatabaseData(initialDataArray); // Start with initial data
        setDetailedStoriesData(storiesDataArray);
        setEnrichedStories(initialDataArray); // Set initial enriched stories
        setTotalItems(initialDataArray.length);
        
        // Convert initial dataset to GeoJSON format (memoized to prevent recalculation)
        setJewishBusinesses(prevFeatures => {
          // Only update if the data has actually changed
          if (prevFeatures.length !== initialDataArray.length) {
            return initialDataArray.map((story: StoryMap) => ({
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
          }
          return prevFeatures;
        });
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
  
  // Progressive loading function for additional data from API for all languages
  const loadMoreBusinesses = useCallback(async (page: number, pageSize: number = 200) => {
    try {
      console.log(`Loading more businesses from API - page ${page}, language: ${language}`);
      const response = await fetch(`/api/storymaps-test?page=${page}&pageSize=${pageSize}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error('Error loading more businesses:', error);
      return [];
    }
  }, [language]);

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

  // Memoized enhanced stories to prevent recalculation
  const enhancedStoriesWithBusinessTypes = useMemo(() => {
    return enrichedStories.map(story => {
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
  }, [enrichedStories, jewishBusinesses]);

  // Update visible stories when enhanced stories or current date change
  useEffect(() => {
    setVisibleStories(enhancedStoriesWithBusinessTypes);
  }, [enhancedStoriesWithBusinessTypes, currentDate]);

  // Load all data when switching to database mode
  const loadAllDataForDatabaseMode = useCallback(async () => {
    if (viewMode === 'database' && fullDatabaseData.length < 10000) {
      try {
        setIsLoading(true);
        
        // Load all data from API for all languages (en/de/yi)
        console.log(`Loading all business data from API for language: ${language}`);
        const response = await fetch('/api/storymaps-test?all=true');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const allData = Array.isArray(data) ? data : data.data || [];
        
        console.log(`Loaded ${allData.length} businesses for database mode`);
        setFullDatabaseData(allData);
        setTotalItems(allData.length);
        
        // Update GeoJSON features with all data
        setJewishBusinesses(allData.map((story: StoryMap) => ({
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
        })));
        
      } catch (error) {
        console.error('Error loading all data for database mode:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [viewMode, fullDatabaseData.length, language]);

  // Load all data when switching to database mode
  useEffect(() => {
    loadAllDataForDatabaseMode();
  }, [loadAllDataForDatabaseMode]);

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
    jewishBusinesses.forEach((business, index) => {
      const enrichedStory = dataToUse.find(story => 
        story.title.toLowerCase().includes(business.properties.name.toLowerCase()) ||
        business.properties.name.toLowerCase().includes(story.title.toLowerCase())
      );
      
      // Only add if not already added from enriched stories
      if (!enrichedStory) {
        markers.push({
          id: `business-${business.properties.name}-${index}`,
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
    if (viewMode === 'stories') {
      setVisibleStories(detailedStoriesData);
      setEnrichedStories(detailedStoriesData);
      setTotalItems(detailedStoriesData.length || 15); // Fallback to prevent jump
    } else {
      setVisibleStories(fullDatabaseData);
      setEnrichedStories(fullDatabaseData);
      // In database mode, show actual loaded count or known total if loading all data
      setTotalItems(fullDatabaseData.length >= 10000 ? fullDatabaseData.length : 10021); 
    }
    // Keep mode in sync with viewMode
    setMode(viewMode);
  }, [fullDatabaseData, detailedStoriesData, viewMode]);

  // Calculate stories with detail count - start with known value for immediate display
  const storiesWithDetailCount = useMemo(() => {
    return detailedStoriesData.length > 0 ? detailedStoriesData.length : 15; // Default to known count (15) for immediate display
  }, [detailedStoriesData]);

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
    totalItems,
    viewMode,
    setViewMode,
    storiesWithDetailCount,
    mode,
    setMode,
    loadMoreBusinesses
  };
};

export const berlinCoordinates: [number, number] = [52.52, 13.405];
export const defaultZoom = 12;