// ABOUTME: Admin endpoint for managing feature requests - status updates, priority, implementation notes
// ABOUTME: Allows admins to update feature request lifecycle and planning information

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAdminUser } from '@/utils/admin';
import { z } from 'zod';

const featureRequestUpdateSchema = z.object({
  status: z
    .enum(['considering', 'planned', 'in-progress', 'completed', 'rejected'])
    .optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  implementation_notes: z.string().optional(),
  estimated_effort: z.enum(['small', 'medium', 'large']).optional(),
  target_release: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    await getAdminUser();

    const supabase = await createClient();
    const { id: featureId } = await params;

    // Get feature request with vote details
    const { data, error } = await supabase
      .from('feature_requests')
      .select(
        `
        *,
        votes:feature_votes(
          id,
          user_id,
          created_at
        )
      `
      )
      .eq('id', featureId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { message: 'Feature request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ featureRequest: data });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    console.error('Error fetching feature request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    await getAdminUser();

    const supabase = await createClient();
    const { id: featureId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = featureRequestUpdateSchema.parse(body);

    // Verify feature request exists
    const { data: existingFeature, error: fetchError } = await supabase
      .from('feature_requests')
      .select('id, status, priority')
      .eq('id', featureId)
      .single();

    if (fetchError || !existingFeature) {
      return NextResponse.json(
        { message: 'Feature request not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.priority) updateData.priority = validatedData.priority;
    if (validatedData.implementation_notes !== undefined) {
      updateData.implementation_notes = validatedData.implementation_notes;
    }
    if (validatedData.estimated_effort)
      updateData.estimated_effort = validatedData.estimated_effort;
    if (validatedData.target_release !== undefined)
      updateData.target_release = validatedData.target_release;

    // Update feature request
    const { data: updatedFeature, error: updateError } = await supabase
      .from('feature_requests')
      .update(updateData)
      .eq('id', featureId)
      .select(
        `
        *,
        votes:feature_votes(
          id,
          user_id,
          created_at
        )
      `
      )
      .single();

    if (updateError) {
      console.error('Error updating feature request:', updateError);
      return NextResponse.json(
        { message: 'Failed to update feature request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Feature request updated successfully',
      featureRequest: updatedFeature,
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

    console.error('Error updating feature request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    await getAdminUser();

    const supabase = await createClient();
    const { id: featureId } = await params;

    // Delete feature request (votes will be cascade deleted)
    const { error } = await supabase
      .from('feature_requests')
      .delete()
      .eq('id', featureId);

    if (error) {
      console.error('Error deleting feature request:', error);
      return NextResponse.json(
        { message: 'Failed to delete feature request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Feature request deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    console.error('Error deleting feature request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
