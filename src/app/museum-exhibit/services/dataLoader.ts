interface Business {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  startDate: string;
  endDate: string;
  category: string;
  state: string;
}

interface ProcessedBusiness extends Business {
  status: 'active' | 'declining' | 'takenOver' | 'liquidated' | 'future';
  color: string;
  visible: boolean;
}

// Cache for processed data
let cachedBusinesses: Business[] | null = null;
const processedCache: Map<string, ProcessedBusiness[]> = new Map();

/**
 * Load all 10,021 businesses from the full dataset
 */
export async function loadBusinessData(): Promise<Business[]> {
  if (cachedBusinesses) {
    return cachedBusinesses;
  }

  try {
    const response = await fetch('/data/storymaps_test_full.json');
    if (!response.ok) {
      throw new Error('Failed to load business data');
    }
    
    const data: Business[] = await response.json();
    cachedBusinesses = data;
    return data;
  } catch (error) {
    console.error('Error loading business data:', error);
    // Fallback to smaller dataset if main one fails
    try {
      const fallbackResponse = await fetch('/jewish_businesses.geojson');
      const geoData = await fallbackResponse.json();
      
      // Transform GeoJSON to our format
      const businesses = geoData.features.map((feature: { properties: Record<string, unknown>; geometry: { coordinates: [number, number] } }, index: number) => ({
        id: `business_${index}`,
        title: feature.properties.name || 'Unknown Business',
        address: feature.properties.address || '',
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
        startDate: feature.properties.registration_date || '1920-01-01',
        endDate: feature.properties.liquidation_date || '1945-12-31',
        category: feature.properties.category || 'business',
        state: 'active'
      }));
      
      cachedBusinesses = businesses;
      return businesses;
    } catch (fallbackError) {
      console.error('Fallback data load failed:', fallbackError);
      return [];
    }
  }
}

/**
 * Determine business status based on current date
 */
function getBusinessStatus(business: Business, currentDate: Date): ProcessedBusiness['status'] {
  const current = new Date(currentDate);
  const start = new Date(business.startDate);
  const end = new Date(business.endDate);
  const year = current.getFullYear();
  
  // Business hasn't opened yet
  if (current < start) {
    return 'future';
  }
  
  // Business has been liquidated
  if (current > end) {
    return 'liquidated';
  }
  
  // Historical event-based status
  if (year >= 1938) {
    // After Kristallnacht - most businesses taken over or destroyed
    const monthsSinceKristallnacht = (current.getTime() - new Date(1938, 10, 9).getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsSinceKristallnacht > 6) {
      return 'takenOver';
    }
    return 'declining';
  }
  
  if (year >= 1935) {
    // Nuremberg Laws - increasing pressure
    return 'declining';
  }
  
  if (year >= 1933) {
    // Nazi rise to power - beginning of decline
    // Some businesses still active but under pressure
    const monthsSince1933 = (current.getTime() - new Date(1933, 0, 30).getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsSince1933 > 12) {
      return 'declining';
    }
  }
  
  return 'active';
}

/**
 * Get color for business based on status
 */
function getStatusColor(status: ProcessedBusiness['status']): string {
  switch (status) {
    case 'active':
      return '#22c55e'; // Green
    case 'declining':
      return '#eab308'; // Yellow
    case 'takenOver':
      return '#f97316'; // Orange
    case 'liquidated':
      return '#dc2626'; // Red
    case 'future':
      return 'transparent';
    default:
      return '#6b7280'; // Gray
  }
}

/**
 * Process businesses for a specific date with caching
 */
export async function processBusinessesForDate(currentDate: Date): Promise<ProcessedBusiness[]> {
  const cacheKey = currentDate.toISOString().split('T')[0];
  
  // Check cache first
  if (processedCache.has(cacheKey)) {
    return processedCache.get(cacheKey)!;
  }
  
  const businesses = await loadBusinessData();
  
  // Process in chunks to avoid blocking
  const chunkSize = 500;
  const processed: ProcessedBusiness[] = [];
  
  for (let i = 0; i < businesses.length; i += chunkSize) {
    const chunk = businesses.slice(i, i + chunkSize);
    
    const processedChunk = chunk.map(business => {
      const status = getBusinessStatus(business, currentDate);
      return {
        ...business,
        status,
        color: getStatusColor(status),
        visible: status !== 'future'
      };
    });
    
    processed.push(...processedChunk);
    
    // Allow browser to breathe
    if (i + chunkSize < businesses.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  // Cache the result (limit cache size)
  if (processedCache.size > 100) {
    const firstKey = processedCache.keys().next().value;
    if (firstKey !== undefined) {
      processedCache.delete(firstKey);
    }
  }
  processedCache.set(cacheKey, processed);
  
  return processed;
}

/**
 * Get statistics for current date
 */
export async function getBusinessStatistics(currentDate: Date): Promise<{
  total: number;
  active: number;
  declining: number;
  takenOver: number;
  liquidated: number;
}> {
  const processed = await processBusinessesForDate(currentDate);
  
  return {
    total: processed.length,
    active: processed.filter(b => b.status === 'active').length,
    declining: processed.filter(b => b.status === 'declining').length,
    takenOver: processed.filter(b => b.status === 'takenOver').length,
    liquidated: processed.filter(b => b.status === 'liquidated').length
  };
}

/**
 * Convert processed businesses to GeoJSON for Mapbox
 */
export function toGeoJSON(businesses: ProcessedBusiness[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: businesses
      .filter(b => b.visible)
      .map(business => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [business.lng, business.lat]
        },
        properties: {
          id: business.id,
          title: business.title,
          address: business.address,
          status: business.status,
          color: business.color,
          category: business.category,
          startDate: business.startDate,
          endDate: business.endDate
        }
      }))
  };
}