// ABOUTME: Admin endpoint for updating individual feedback items - status, priority, internal notes
// ABOUTME: Supports PATCH operations for feedback management and admin responses

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAdminUser } from '@/utils/admin';
import { z } from 'zod';

const feedbackUpdateSchema = z.object({
  status: z
    .enum([
      'open',
      'reviewing',
      'planned',
      'in-progress',
      'completed',
      'dismissed',
    ])
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  internal_notes: z.string().optional(),
  admin_response: z
    .object({
      response_text: z.string().min(1).max(2000),
      response_type: z
        .enum(['comment', 'status-update', 'resolution'])
        .default('comment'),
    })
    .optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check admin authentication
    await getAdminUser();

    const supabase = await createClient();
    const feedbackId = params.id;

    // Get feedback with responses
    const { data, error } = await supabase
      .from('feedback')
      .select(
        `
        *,
        responses:feedback_responses(*)
      `
      )
      .eq('id', feedbackId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { message: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ feedback: data });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check admin authentication
    const adminUser = await getAdminUser();

    const supabase = await createClient();
    const feedbackId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = feedbackUpdateSchema.parse(body);

    // Verify feedback exists
    const { data: existingFeedback, error: fetchError } = await supabase
      .from('feedback')
      .select('id, status, priority')
      .eq('id', feedbackId)
      .single();

    if (fetchError || !existingFeedback) {
      return NextResponse.json(
        { message: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.priority) updateData.priority = validatedData.priority;
    if (validatedData.internal_notes !== undefined)
      updateData.internal_notes = validatedData.internal_notes;

    // Update feedback
    const { error: updateError } = await supabase
      .from('feedback')
      .update(updateData)
      .eq('id', feedbackId);

    if (updateError) {
      console.error('Error updating feedback:', updateError);
      return NextResponse.json(
        { message: 'Failed to update feedback' },
        { status: 500 }
      );
    }

    // Add admin response if provided
    if (validatedData.admin_response) {
      const { error: responseError } = await supabase
        .from('feedback_responses')
        .insert({
          feedback_id: feedbackId,
          admin_user_id: adminUser.id,
          response_text: validatedData.admin_response.response_text,
          response_type: validatedData.admin_response.response_type,
        });

      if (responseError) {
        console.error('Error adding admin response:', responseError);
        return NextResponse.json(
          { message: 'Failed to add admin response' },
          { status: 500 }
        );
      }
    }

    // Fetch updated feedback with responses
    const { data: updatedFeedback } = await supabase
      .from('feedback')
      .select(
        `
        *,
        responses:feedback_responses(*)
      `
      )
      .eq('id', feedbackId)
      .single();

    return NextResponse.json({
      message: 'Feedback updated successfully',
      feedback: updatedFeedback,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
