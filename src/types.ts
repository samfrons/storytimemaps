export interface MediaItem {
  url: string
  caption?: string
  type?: 'image' | 'video'
}

export interface TimelineMediaItem {
  url: string
  caption?: string
  type?: 'image' | 'video'
  startDate: string // ISO date when this media becomes relevant
  endDate?: string // ISO date when this media stops being relevant
}

export interface TimelineContent {
  startDate: string
  endDate?: string
  description?: string
  longDescription?: string
  media?: TimelineMediaItem[]
}

export interface TimelineData {
  businessId: string
  timeline: TimelineContent[]
}

export interface StoryMap {
  id: string
  title: string
  description: string | null
  longDescription: string | null
  lat: number
  lng: number
  address?: string
  category?: 'business' | 'institution' | 'residence'
  businessType?: string
  startDate: string | null
  midDate: string | null
  endDate: string | null
  media?: MediaItem[] | null
  mediaLink?: string
  imageUrls?: string[]
  hasTimelineData?: boolean // Flag to indicate timeline data availability
}

export interface MarkerData {
  id: string
  position: [number, number]
  popup: string
}

export interface GeoJSONFeature {
  type: 'Feature'
  properties: {
    id: string
    name: string
    category?: string
    businessType?: string
    description?: string
    startDate?: string
    endDate?: string
    [key: string]: unknown
  }
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

// Year Marker types for featured story listings
export interface YearMarker {
  id: string
  year: number // The year this marker represents
  month?: number // Optional month (1-12) for more precise positioning
  day?: number // Optional day for exact date events
  title: string // Display title
  description: string // Short description shown in list
  longDescription?: string // Extended description for expanded view
  imageUrl?: string // Optional image for the marker
  imageCaption?: string // Caption for the image
  // i18n support - translation keys
  titleKey?: string
  descriptionKey?: string
  longDescriptionKey?: string
  imageCaptionKey?: string
  // Visual styling and categorization
  type: 'historical-event' | 'period-start' | 'period-end' | 'milestone' | 'legislation'
  // Whether to always show or only show when timeline reaches this point
  showAlways?: boolean
  // Priority for sorting when multiple markers share the same year
  priority?: number
}

export interface YearMarkersConfig {
  markers: YearMarker[]
}
