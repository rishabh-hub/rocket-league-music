// ABOUTME: API endpoint for submitting general feedback (bugs, features, improvements, appreciation)
// ABOUTME: Stores the feedback, then emails it so a report reaches a person rather than a table.

import { NextRequest, NextResponse, after } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';
import { escapeHtml } from '@/utils/escapeHtml';
import {
  FEEDBACK_MAX_LENGTH,
  FEEDBACK_MIN_LENGTH,
} from '@/utils/feedbackLimits';
import { z } from 'zod';

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'appreciation', 'general']),
  category: z.string().optional(),
  message: z.string().min(FEEDBACK_MIN_LENGTH).max(FEEDBACK_MAX_LENGTH),
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

// What the widget calls each type, so the inbox reads the way the app does.
const TYPE_LABELS: Record<string, string> = {
  bug: 'Something to fix or add',
  feature: 'Something to fix or add',
  improvement: 'Something to fix or add',
  appreciation: 'Something you liked',
  general: 'Something else',
};

/**
 * Emails a submission to whoever runs the site. Feedback is already stored by
 * the time this runs, so a delivery failure is logged and swallowed rather than
 * reported to the person who wrote in — from their side the message did land.
 */
async function notifyOwner(feedback: {
  id: string;
  type: string;
  message: string;
  email?: string;
  page?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFICATION_EMAIL;

  if (!apiKey || !to) {
    console.error(
      'Feedback stored but not emailed: RESEND_API_KEY or NOTIFICATION_EMAIL is unset'
    );
    return;
  }

  const label = TYPE_LABELS[feedback.type] ?? feedback.type;

  try {
    // The SDK reports a rejected send in its return value rather than by
    // throwing, so the error branch below is the one that actually fires. The
    // try/catch still guards a genuine throw, such as a malformed key.
    const { error } = await new Resend(apiKey).emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject: `ReplayRhythms feedback: ${label}`,
      html: `
        <h1>${escapeHtml(label)}</h1>
        <p style="white-space:pre-wrap">${escapeHtml(feedback.message)}</p>
        <hr />
        <p><strong>From:</strong> ${escapeHtml(feedback.email)}</p>
        <p><strong>Page:</strong> ${escapeHtml(feedback.page)}</p>
        <p><strong>Feedback row:</strong> ${escapeHtml(feedback.id)}</p>
      `,
    });

    if (error) {
      console.error(
        'Feedback stored but the notification email failed:',
        error
      );
    }
  } catch (error) {
    console.error('Feedback stored but the notification email threw:', error);
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

    // after() runs once the response is on its way, so the person who wrote in
    // waits on the insert and not on an email round-trip.
    after(() =>
      notifyOwner({
        id: data.id,
        type: validatedData.type,
        message: validatedData.message,
        email: user.email,
        page: context.page,
      })
    );

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
