// ABOUTME: API endpoint for quick thumbs up/down feedback on specific contexts
// ABOUTME: Supports both authenticated and anonymous users with session tracking

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const quickFeedbackSchema = z.object({
  context: z.string().min(1).max(100), // e.g., 'replay-stats', 'music-recommendations'
  rating: z.enum(['helpful', 'not-helpful', 'thumbs-up', 'thumbs-down']),
  pageUrl: z.string().url().optional(),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = quickFeedbackSchema.parse(body);

    const supabase = await createClient();

    // Get user if authenticated (optional for quick feedback)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Generate session ID if not provided
    const sessionId =
      validatedData.sessionId ||
      `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Insert quick feedback into database
    const { data, error } = await supabase
      .from('quick_feedback')
      .insert({
        user_id: user?.id || null,
        context: validatedData.context,
        rating: validatedData.rating,
        page_url: validatedData.pageUrl || request.headers.get('referer'),
        session_id: sessionId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting quick feedback:', error);
      return NextResponse.json(
        { message: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Quick feedback submitted successfully',
      id: data.id,
      sessionId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error submitting quick feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const context = url.searchParams.get('context');
    const sessionId = url.searchParams.get('sessionId');

    // Build query
    let query = supabase
      .from('quick_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (context) {
      query = query.eq('context', context);
    }

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    // Limit results for performance
    query = query.limit(100);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching quick feedback:', error);
      return NextResponse.json(
        { message: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback: data });
  } catch (error) {
    console.error('Error fetching quick feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
