import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/supabase/admin';
import type { CreateProposalInput } from '@/lib/types/proposal';

/**
 * GET /api/proposals
 * Get all proposals (with optional filters)
 * Query params:
 *   - status: filter by status
 *   - user_id: filter by user
 *   - proposal_type: filter by type
 */
export async function GET(request: NextRequest) {
  try {
    // Listing ALL proposals exposes every user's submissions plus plaque-inquiry
    // contact PII — admins only. Regular users read their own via
    // GET /api/proposals/user.
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = await createClient();

    // Return error if Supabase is not configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service is not configured' },
        { status: 503 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const userId = searchParams.get('user_id');
    const proposalType = searchParams.get('proposal_type');

    // Build query
    let query = supabase
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (proposalType) {
      query = query.eq('proposal_type', proposalType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching proposals:', error);
      return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/proposals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/proposals
 * Create a new proposal
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Return error if Supabase is not configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service is not configured' },
        { status: 503 }
      );
    }

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: CreateProposalInput = await request.json();

    // Validate required fields
    if (!body.title || !body.address || !body.lat || !body.lng || !body.proposal_type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, address, lat, lng, proposal_type' },
        { status: 400 }
      );
    }

    // Create proposal
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        user_id: user.id,
        proposal_type: body.proposal_type,
        original_business_id: body.original_business_id,
        title: body.title,
        description: body.description,
        address: body.address,
        lat: body.lat,
        lng: body.lng,
        start_date: body.start_date,
        mid_date: body.mid_date,
        end_date: body.end_date,
        business_type: body.business_type,
        category: body.category,
        sources: body.sources,
        notes: body.notes,
        image_urls: body.image_urls,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating proposal:', error);
      return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/proposals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
