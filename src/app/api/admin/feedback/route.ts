// ABOUTME: Admin endpoint for viewing all feedback submissions with filtering and pagination
// ABOUTME: Requires admin authentication to access all user feedback data

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAdmin } from '@/utils/admin';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdmin();

    const supabase = await createClient();
    const url = new URL(request.url);

    // Get query parameters
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query with service role for admin access
    let query = supabase
      .from('feedback')
      .select(
        `
        *,
        responses:feedback_responses(*)
      `
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (category) {
      query = query.eq('category', category);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching feedback for admin:', error);
      return NextResponse.json(
        { message: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('feedback')
      .select('id', { count: 'exact', head: true });

    if (type) countQuery = countQuery.eq('type', type);
    if (status) countQuery = countQuery.eq('status', status);
    if (priority) countQuery = countQuery.eq('priority', priority);
    if (category) countQuery = countQuery.eq('category', category);

    const { count } = await countQuery;

    return NextResponse.json({
      feedback: data,
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    console.error('Error fetching admin feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
