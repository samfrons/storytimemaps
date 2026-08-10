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
  // Vestigial. Holds 'business' in storymaps.json but a main-branch value
  // ('trade', 'industry', …) in storymaps_test_full.json, so it is no longer
  // read for filtering or labelling — use mainBranch/sectorKey below.
  category?: 'business' | 'institution' | 'residence'

  // HU Berlin taxonomy, recovered by scripts/recover_branch_fields_2026.py.
  businessType?: string // raw Branche label from the source (EN or DE as emitted)
  sectorKey?: string // stable slug for i18n, e.g. 'TEXTILES_AND_CLOTHING'
  mainBranch?: 'trade' | 'industry' | 'services' | 'handicraft' // Hauptbranche
  branchSource?: string // provenance of the two fields above
  startDate: string | null
  midDate: string | null
  endDate: string | null
  media?: MediaItem[] | null
  mediaLink?: string
  imageUrls?: string[]
  hasTimelineData?: boolean // Flag to indicate timeline data availability

  // Track D (data verification) outputs — populated by scripts/verify_dataset_2026.py
  source_url?: string // HU Berlin scrape URL the record was sourced from
  last_verified?: string // ISO 8601 timestamp of last verification pass
  verified_address?: boolean // True only when the address was confirmed against the source
  // OR manually corrected and re-geocoded. Gates Track A.2's
  // per-listing plaque CTA visibility.
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
    sectorKey?: string
    mainBranch?: string
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
