import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpdateProposalStatusInput } from '@/lib/types/proposal';

/**
 * GET /api/proposals/[id]
 * Get a specific proposal by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    // Get proposal
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching proposal:', error);
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/proposals/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/proposals/[id]
 * Update a proposal (status change, admin notes)
 * Regular users can only update their own pending proposals
 * Admins can update any proposal and change status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    // Get user profile to check if admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.is_admin || false;

    // Parse request body
    const body = await request.json();

    // Get current proposal
    const { data: currentProposal } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentProposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Check permissions
    const isOwner = currentProposal.user_id === user.id;
    const isPending = currentProposal.status === 'pending';

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isAdmin && !isPending) {
      return NextResponse.json(
        { error: 'Can only edit pending proposals' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    // Regular users can only update content fields
    if (!isAdmin) {
      const allowedFields = [
        'title',
        'description',
        'address',
        'lat',
        'lng',
        'start_date',
        'mid_date',
        'end_date',
        'business_type',
        'category',
        'sources',
        'notes',
        'image_urls',
      ];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      }
    } else {
      // Admins can update everything including status
      for (const [key, value] of Object.entries(body)) {
        if (key !== 'id' && key !== 'user_id' && key !== 'created_at' && key !== 'updated_at') {
          updateData[key] = value;
        }
      }

      // If changing status, record reviewer info
      if (body.status && body.status !== currentProposal.status) {
        updateData.reviewed_by = user.id;
        updateData.reviewed_at = new Date().toISOString();
      }
    }

    // Update proposal
    const { data, error } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating proposal:', error);
      return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/proposals/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/proposals/[id]
 * Delete a proposal
 * Only the owner can delete their own pending proposals
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    // Get current proposal
    const { data: currentProposal } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentProposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Check permissions
    const isOwner = currentProposal.user_id === user.id;
    const isPending = currentProposal.status === 'pending';

    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isPending) {
      return NextResponse.json(
        { error: 'Can only delete pending proposals' },
        { status: 403 }
      );
    }

    // Delete proposal
    const { error } = await supabase.from('proposals').delete().eq('id', id);

    if (error) {
      console.error('Error deleting proposal:', error);
      return NextResponse.json({ error: 'Failed to delete proposal' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/proposals/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
