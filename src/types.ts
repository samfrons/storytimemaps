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

