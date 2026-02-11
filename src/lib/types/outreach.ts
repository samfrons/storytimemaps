/**
 * TypeScript types for the outreach tracking system
 * Used for managing memorial plaque outreach efforts
 */

export type OutreachStatus =
  | 'not_started'
  | 'researching'
  | 'contacted'
  | 'awaiting_response'
  | 'follow_up_needed'
  | 'interested'
  | 'approved'
  | 'declined'
  | 'not_applicable'

export type OccupantType =
  | 'business'
  | 'residential'
  | 'office'
  | 'public'
  | 'vacant'
  | 'demolished'
  | 'unknown'

export type PropertyType =
  | 'commercial'
  | 'residential'
  | 'mixed_use'
  | 'office'
  | 'cultural'
  | 'government'
  | 'memorial'

export type InterestLevel = 'unknown' | 'high' | 'medium' | 'low' | 'none'

export type DataSource =
  | 'google_maps'
  | 'osm'
  | 'manual_research'
  | 'site_visit'
  | 'phone_call'
  | 'website'

export interface OutreachRecord {
  // Original business data
  id: number
  title: string
  description: string
  category: string
  address: string
  lat: number
  lng: number
  startDate: string
  midDate: string
  endDate: string
  imageUrls: string

  // Current occupant information
  current_occupant_name: string
  current_occupant_type: OccupantType
  property_type: PropertyType

  // Contact information
  contact_email: string
  contact_phone: string
  contact_website: string
  contact_person: string

  // Outreach status
  outreach_status: OutreachStatus
  first_contact_date: string
  last_contact_date: string
  next_follow_up_date: string
  outreach_notes: string

  // Research metadata
  data_source: DataSource | ''
  interest_level: InterestLevel
}

export interface OutreachFilters {
  search: string
  status: OutreachStatus | 'all'
  occupantType: OccupantType | 'all'
  interestLevel: InterestLevel | 'all'
}

export interface OutreachStats {
  total: number
  notStarted: number
  researching: number
  contacted: number
  awaitingResponse: number
  followUpNeeded: number
  interested: number
  approved: number
  declined: number
  notApplicable: number
}

export const OUTREACH_STATUS_LABELS: Record<OutreachStatus, string> = {
  not_started: 'Not Started',
  researching: 'Researching',
  contacted: 'Contacted',
  awaiting_response: 'Awaiting Response',
  follow_up_needed: 'Follow-Up Needed',
  interested: 'Interested',
  approved: 'Approved',
  declined: 'Declined',
  not_applicable: 'N/A',
}

export const OCCUPANT_TYPE_LABELS: Record<OccupantType, string> = {
  business: 'Business',
  residential: 'Residential',
  office: 'Office',
  public: 'Public',
  vacant: 'Vacant',
  demolished: 'Demolished',
  unknown: 'Unknown',
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  commercial: 'Commercial',
  residential: 'Residential',
  mixed_use: 'Mixed Use',
  office: 'Office',
  cultural: 'Cultural',
  government: 'Government',
  memorial: 'Memorial',
}

export const INTEREST_LEVEL_LABELS: Record<InterestLevel, string> = {
  unknown: 'Unknown',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'None',
}

export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  google_maps: 'Google Maps',
  osm: 'OpenStreetMap',
  manual_research: 'Manual Research',
  site_visit: 'Site Visit',
  phone_call: 'Phone Call',
  website: 'Website',
}

// Status color mapping for UI
export const STATUS_COLORS: Record<OutreachStatus, { bg: string; text: string }> = {
  not_started: { bg: 'var(--muted)', text: 'var(--foreground)' },
  researching: { bg: 'var(--primary)', text: 'var(--background)' },
  contacted: { bg: 'var(--primary)', text: 'var(--background)' },
  awaiting_response: { bg: 'var(--warning)', text: 'var(--declining-text)' },
  follow_up_needed: { bg: 'var(--warning)', text: 'var(--declining-text)' },
  interested: { bg: 'var(--success)', text: 'var(--active-text)' },
  approved: { bg: 'var(--success)', text: 'var(--active-text)' },
  declined: { bg: 'var(--danger)', text: 'var(--closed-text)' },
  not_applicable: { bg: 'var(--muted)', text: 'var(--foreground-muted)' },
}
