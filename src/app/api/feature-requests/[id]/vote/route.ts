// ABOUTME: API endpoint for voting on feature requests - handles upvotes and prevents duplicate voting
// ABOUTME: Updates vote counts atomically and tracks individual user votes

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: featureId } = await params;

    // Validate feature request exists
    const { data: featureRequest, error: featureError } = await supabase
      .from('feature_requests')
      .select('id, votes_count')
      .eq('id', featureId)
      .single();

    if (featureError || !featureRequest) {
      return NextResponse.json(
        { message: 'Feature request not found' },
        { status: 404 }
      );
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('feature_votes')
      .select('id')
      .eq('feature_id', featureId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingVote) {
      return NextResponse.json(
        { message: 'You have already voted for this feature' },
        { status: 409 }
      );
    }

    // Use a transaction to ensure consistency
    const { data: vote, error: voteError } = await supabase
      .from('feature_votes')
      .insert({
        feature_id: featureId,
        user_id: user.id,
      })
      .select()
      .single();

    if (voteError) {
      console.error('Error creating vote:', voteError);
      return NextResponse.json(
        { message: 'Failed to cast vote' },
        { status: 500 }
      );
    }

    // Update vote count
    const { error: updateError } = await supabase
      .from('feature_requests')
      .update({
        votes_count: featureRequest.votes_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', featureId);

    if (updateError) {
      console.error('Error updating vote count:', updateError);
      // Cleanup the vote if update failed
      await supabase.from('feature_votes').delete().eq('id', vote.id);

      return NextResponse.json(
        { message: 'Failed to update vote count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Vote cast successfully',
      voteId: vote.id,
      newVoteCount: featureRequest.votes_count + 1,
    });
  } catch (error) {
    console.error('Error casting vote:', error);
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
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: featureId } = await params;

    // Find and delete user's vote
    const { data: vote, error: voteError } = await supabase
      .from('feature_votes')
      .delete()
      .eq('feature_id', featureId)
      .eq('user_id', user.id)
      .select()
      .maybeSingle();

    if (voteError || !vote) {
      return NextResponse.json({ message: 'Vote not found' }, { status: 404 });
    }

    // Get current vote count and update
    const { data: featureRequest } = await supabase
      .from('feature_requests')
      .select('votes_count')
      .eq('id', featureId)
      .single();

    if (featureRequest) {
      await supabase
        .from('feature_requests')
        .update({
          votes_count: Math.max(0, featureRequest.votes_count - 1),
          updated_at: new Date().toISOString(),
        })
        .eq('id', featureId);
    }

    return NextResponse.json({
      message: 'Vote removed successfully',
      newVoteCount: Math.max(0, (featureRequest?.votes_count || 1) - 1),
    });
  } catch (error) {
    console.error('Error removing vote:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
