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

export const useStoryMapLogic = () => {
  const [jewishBusinesses, setJewishBusinesses] = useState<BusinessFeature[]>([]);
  const [enrichedStories, setEnrichedStories] = useState<StoryMap[]>([]);
  const [visibleStories, setVisibleStories] = useState<StoryMap[]>([]);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date('1920-01-01'));
  const [minDate] = useState<Date>(new Date('1920-01-01'));
  const [maxDate] = useState<Date>(new Date('1945-12-31'));
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [totalItems, setTotalItems] = useState(0);

  // Fetch initial page and metadata
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch metadata first
        const metadataResponse = await fetch('/api/storymaps/metadata');
        const metadata = await metadataResponse.json();
        setTotalItems(metadata.totalItems);
        console.log('Total items in database:', metadata.totalItems);
        
        // Fetch first page of data
        const response = await fetch('/api/storymaps?page=1&pageSize=200');
        const result: PaginatedResponse = await response.json();
        
        if (result.data) {
          setEnrichedStories(result.data);
          setHasMorePages(result.metadata.hasNextPage);
          
          // Convert to GeoJSON format
          const geoFeatures: BusinessFeature[] = result.data.map((story: StoryMap) => ({
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
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setEnrichedStories([]);
        setJewishBusinesses([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Load more data in the background
  useEffect(() => {
    if (!isLoading && hasMorePages && currentPage === 1) {
      const loadMoreData = async () => {
        let page = 2;
        let allData = [...enrichedStories];
        
        while (page <= 20) { // Load up to page 20 in background (4000 items)
          try {
            const response = await fetch(`/api/storymaps?page=${page}&pageSize=200`);
            const result: PaginatedResponse = await response.json();
            
            if (result.data && result.data.length > 0) {
              allData = [...allData, ...result.data];
              
              // Update state with accumulated data
              setEnrichedStories(allData);
              
              // Convert new data to GeoJSON
              const geoFeatures: BusinessFeature[] = allData.map((story: StoryMap) => ({
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
              
              if (!result.metadata.hasNextPage) {
                setHasMorePages(false);
                break;
              }
            }
            
            page++;
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Error loading page ${page}:`, error);
            break;
          }
        }
        
        setCurrentPage(page - 1);
      };
      
      // Start loading more data after a short delay
      const timer = setTimeout(loadMoreData, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, hasMorePages, currentPage, enrichedStories]);

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
    isLoading
  };
};

export const berlinCoordinates: [number, number] = [52.52, 13.405];
export const defaultZoom = 12;