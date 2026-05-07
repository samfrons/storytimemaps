/**
 * TypeScript types for the proposal system
 */

export type ProposalType = 'new_location' | 'edit_location' | 'correction' | 'plaque_inquiry'
export type ProposalStatus = 'pending' | 'under_review' | 'approved' | 'rejected'
export type BuildingRole = 'owner' | 'tenant' | 'manager' | 'other'

export interface Proposal {
  id: string
  user_id: string | null // NULL for anonymous plaque_inquiry submissions (migration 002)
  proposal_type: ProposalType

  // Original business reference (if editing or inquiring about an existing listing)
  original_business_id?: string

  // Proposed location data
  title: string
  description?: string
  address: string
  lat: number
  lng: number
  start_date?: string
  mid_date?: string
  end_date?: string
  business_type?: string
  category?: string

  // Supporting information
  sources?: string
  notes?: string
  image_urls?: string[]

  // Plaque inquiry fields (added by migration 002, used only when proposal_type='plaque_inquiry')
  inquiry_name?: string
  inquiry_email?: string
  inquiry_phone?: string
  building_role?: BuildingRole

  // Status tracking
  status: ProposalStatus
  admin_notes?: string
  reviewed_by?: string
  reviewed_at?: string

  created_at: string
  updated_at: string
}

export interface CreatePlaqueInquiryInput {
  business_id: string // Listing the inquiry is about
  business_name: string // Snapshot of the listing's title at submit time
  business_address: string // Snapshot of the listing's address
  business_lat: number // Snapshot of the listing's lat
  business_lng: number // Snapshot of the listing's lng
  inquiry_name: string
  inquiry_email: string
  inquiry_phone?: string
  building_role: BuildingRole
  message?: string
  // Honeypot field — must be empty on submit. If present, request is rejected.
  website?: string
}

export interface ProposalComment {
  id: string
  proposal_id: string
  user_id: string
  comment: string
  is_admin: boolean
  created_at: string
}

export interface UserProfile {
  id: string
  display_name?: string
  is_admin: boolean
  bio?: string
  expertise?: string
  created_at: string
  updated_at: string
}

export interface CreateProposalInput {
  proposal_type: ProposalType
  original_business_id?: string
  title: string
  description?: string
  address: string
  lat: number
  lng: number
  start_date?: string
  mid_date?: string
  end_date?: string
  business_type?: string
  category?: string
  sources?: string
  notes?: string
  image_urls?: string[]
}

export interface UpdateProposalStatusInput {
  status: ProposalStatus
  admin_notes?: string
}
