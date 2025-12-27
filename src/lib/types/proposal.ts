/**
 * TypeScript types for the proposal system
 */

export type ProposalType = 'new_location' | 'edit_location' | 'correction';
export type ProposalStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export interface Proposal {
  id: string;
  user_id: string;
  proposal_type: ProposalType;

  // Original business reference (if editing)
  original_business_id?: string;

  // Proposed location data
  title: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  start_date?: string;
  mid_date?: string;
  end_date?: string;
  business_type?: string;
  category?: string;

  // Supporting information
  sources?: string;
  notes?: string;
  image_urls?: string[];

  // Status tracking
  status: ProposalStatus;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;

  created_at: string;
  updated_at: string;
}

export interface ProposalComment {
  id: string;
  proposal_id: string;
  user_id: string;
  comment: string;
  is_admin: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  display_name?: string;
  is_admin: boolean;
  bio?: string;
  expertise?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProposalInput {
  proposal_type: ProposalType;
  original_business_id?: string;
  title: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  start_date?: string;
  mid_date?: string;
  end_date?: string;
  business_type?: string;
  category?: string;
  sources?: string;
  notes?: string;
  image_urls?: string[];
}

export interface UpdateProposalStatusInput {
  status: ProposalStatus;
  admin_notes?: string;
}
