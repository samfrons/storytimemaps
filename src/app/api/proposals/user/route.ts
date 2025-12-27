import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/proposals/user
 * Get all proposals for the currently authenticated user
 */
export async function GET(request: NextRequest) {
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

    // Get user's proposals
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user proposals:', error);
      return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/proposals/user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
