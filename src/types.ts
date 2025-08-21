export interface MediaItem {
  url: string;
  caption?: string;
  type?: 'image' | 'video';
}

export interface StoryMap {
  id: string;
  title: string;
  description: string | null;
  longDescription: string | null;
  lat: number;
  lng: number;
  address?: string;
  category?: 'business' | 'institution' | 'residence';
  businessType?: string;
  startDate: string | null;
  midDate: string | null;
  endDate: string | null;
  media?: MediaItem[] | null;
  mediaLink?: string;
  imageUrls?: string[]; 
}

export interface MarkerData {
  id: string;
  position: [number, number];
  popup: string;
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    category?: string;
    businessType?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    [key: string]: unknown;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

