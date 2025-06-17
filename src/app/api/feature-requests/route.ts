// ABOUTME: API endpoint for managing feature requests - GET all requests, POST new requests
// ABOUTME: Includes public read access and authenticated write access with validation

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const featureRequestSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);

    // Get query parameters
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('feature_requests')
      .select(
        `
        *,
        votes:feature_votes(count)
      `
      )
      .order('votes_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching feature requests:', error);
      return NextResponse.json(
        { message: 'Failed to fetch feature requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      featureRequests: data,
      pagination: {
        limit,
        offset,
        total: data?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = featureRequestSchema.parse(body);

    // Check for duplicate titles (prevent spam)
    const { data: existing } = await supabase
      .from('feature_requests')
      .select('id')
      .eq('title', validatedData.title)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { message: 'A feature request with this title already exists' },
        { status: 409 }
      );
    }

    // Insert feature request into database
    const { data, error } = await supabase
      .from('feature_requests')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        created_by: user.id,
        status: 'considering',
        priority: 'medium',
        votes_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting feature request:', error);
      return NextResponse.json(
        { message: 'Failed to create feature request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Feature request created successfully',
      featureRequest: data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating feature request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
