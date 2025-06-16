// ABOUTME: API endpoint for submitting general feedback (bugs, features, improvements, appreciation)
// ABOUTME: Handles POST requests with authentication, validation, and rate limiting

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'appreciation', 'general']),
  category: z.string().optional(),
  message: z.string().min(10).max(2000),
  rating: z.number().min(1).max(5).optional(),
  context: z
    .object({
      page: z.string().optional(),
      userAgent: z.string().optional(),
      timestamp: z.string().optional(),
      sessionId: z.string().optional(),
    })
    .optional(),
});

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
    const validatedData = feedbackSchema.parse(body);

    // Add context data if not provided
    const context = {
      page: validatedData.context?.page || request.headers.get('referer'),
      userAgent:
        validatedData.context?.userAgent || request.headers.get('user-agent'),
      timestamp: validatedData.context?.timestamp || new Date().toISOString(),
      sessionId: validatedData.context?.sessionId,
      ...validatedData.context,
    };

    // Insert feedback into database
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        type: validatedData.type,
        category: validatedData.category,
        message: validatedData.message,
        rating: validatedData.rating,
        context,
        status: 'open',
        priority: 'medium',
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting feedback:', error);
      return NextResponse.json(
        { message: 'Failed to submit feedback', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Feedback submitted successfully',
      id: data.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's own feedback
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json(
        { message: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback: data });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
