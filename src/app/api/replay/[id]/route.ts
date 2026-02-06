// ABOUTME: API route for fetching replay details and checking processing status.
// ABOUTME: Polls ballchasing.com API to retrieve replay metrics when ready.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import axios from 'axios';
import { extractMetrics } from '@/utils/extractMetrics';

// Define segment config to properly handle params
export const dynamic = 'force-dynamic';

/**
 * GET handler for fetching replay details
 */
export async function GET(
  request: NextRequest
  // { params }: { params: { id: string } }
) {
  try {
    // The simplest solution - hardcode the path and use request.url instead
    // This completely bypasses the params issue
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const replayId = pathParts[pathParts.length - 1];

    // Initialize Supabase client
    const supabase = await createClient();

    // Check authentication
    // const {
    //   data: { user },
    // } = await supabase.auth.getUser();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // if (!user) {
    //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    // Fetch the replay record
    const { data: replay, error } = await supabase
      .from('replays')
      .select('*')
      .eq('id', replayId)
      .single();

    if (error || !replay) {
      console.error('Error fetching replay:', error);
      return NextResponse.json(
        { message: 'Replay not found' },
        { status: 404 }
      );
    }

    // Check authorization - only allow access if:
    // 1. The replay is public, OR
    // 2. The user is authenticated and owns the replay
    if (
      replay.visibility !== 'public' &&
      (!session || replay.user_id !== session.user.id)
    ) {
      return NextResponse.json(
        { error: 'Unauthorized access to replay' },
        { status: 403 }
      );
    }

    // Check if this user has permission to access this replay
    // if (replay.user_id !== user.id) {
    //   return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    // }

    // Return based on status
    switch (replay.status) {
      case 'uploaded':
        // Still waiting to be processed
        return NextResponse.json({
          message: 'Replay uploaded and waiting to be processed',
          status: 'uploaded',
          replay: {
            id: replay.id,
            fileName: replay.file_name,
            visibility: replay.visibility,
            createdAt: replay.created_at,
          },
        });

      case 'processing':
        // Check if replay has been processing for more than 30 seconds
        // Use created_at (stable) instead of updated_at (gets reset on updates)
        const processingTime =
          new Date().getTime() - new Date(replay.created_at).getTime();

        // If no ballchasing_id after 30 seconds, upload failed
        if (processingTime > 30 * 1000 && !replay.ballchasing_id) {
          await supabase
            .from('replays')
            .update({
              status: 'failed',
              metrics: {
                error:
                  'Upload to ballchasing.com did not complete. Please try uploading again.',
                failure_reason: 'missing_ballchasing_id',
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', replay.id);

          return NextResponse.json({
            message: 'Replay upload failed',
            status: 'failed',
            error:
              'Upload to ballchasing.com did not complete. Please try uploading again.',
            replay: {
              id: replay.id,
              fileName: replay.file_name,
              visibility: replay.visibility,
              createdAt: replay.created_at,
            },
          });
        }

        if (processingTime > 30 * 1000 && replay.ballchasing_id) {
          // Throttle: only check ballchasing if not checked in last 30 seconds
          const lastChecked = replay.last_checked_at
            ? new Date(replay.last_checked_at).getTime()
            : 0;
          const timeSinceLastCheck = Date.now() - lastChecked;
          const throttleMs = 30 * 1000; // 30 seconds

          if (timeSinceLastCheck > throttleMs) {
            // Update last_checked_at first (simple throttle, no complex atomic claim)
            await supabase
              .from('replays')
              .update({ last_checked_at: new Date().toISOString() })
              .eq('id', replay.id);

            // Call ballchasing API to check status
            try {
              return await checkBallchasingStatus(supabase, replay);
            } catch (error: any) {
              console.error('Error checking ballchasing status:', error);
              // Fall through to return current status
            }
          }
          // Throttled: return current status without calling ballchasing API
        }

        return NextResponse.json({
          message: 'Replay is being processed by ballchasing.com',
          status: 'processing',
          replay: {
            id: replay.id,
            fileName: replay.file_name,
            ballchasingId: replay.ballchasing_id,
            visibility: replay.visibility,
            createdAt: replay.created_at,
          },
        });

      case 'pending':
        // Replay has been waiting for processing for a while, check status
        if (replay.ballchasing_id) {
          try {
            return await checkBallchasingStatus(supabase, replay);
          } catch (error: any) {
            // On error, still return the current status
            console.error('Error checking ballchasing status:', error);
            return NextResponse.json({
              message: 'Replay is waiting for processing',
              status: 'pending',
              replay: {
                id: replay.id,
                fileName: replay.file_name,
                ballchasingId: replay.ballchasing_id,
                visibility: replay.visibility,
                createdAt: replay.created_at,
              },
            });
          }
        }

        return NextResponse.json({
          message: 'Replay is waiting for processing',
          status: 'pending',
          replay: {
            id: replay.id,
            fileName: replay.file_name,
            ballchasingId: replay.ballchasing_id,
            visibility: replay.visibility,
            createdAt: replay.created_at,
          },
        });

      case 'ready':
        // Everything is processed and ready
        return NextResponse.json({
          message: 'Replay is ready',
          status: 'ready',
          replay: {
            id: replay.id,
            fileName: replay.file_name,
            ballchasingId: replay.ballchasing_id,
            visibility: replay.visibility,
            createdAt: replay.created_at,
            metrics: replay.metrics,
          },
        });

      case 'failed':
        // Processing failed
        return NextResponse.json({
          message: 'Replay processing failed',
          status: 'failed',
          error: replay.metrics?.error || 'Unknown error',
          replay: {
            id: replay.id,
            fileName: replay.file_name,
            ballchasingId: replay.ballchasing_id,
            visibility: replay.visibility,
            createdAt: replay.created_at,
          },
        });

      default:
        return NextResponse.json({
          message: `Replay status: ${replay.status}`,
          status: replay.status,
          replay: {
            id: replay.id,
            fileName: replay.file_name,
            ballchasingId: replay.ballchasing_id,
            visibility: replay.visibility,
            createdAt: replay.created_at,
          },
        });
    }
  } catch (error: any) {
    console.error('Error in replay status API:', error);
    const errorMessage = error.message || 'Internal server error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

async function checkBallchasingStatus(supabase: any, replay: any) {
  try {
    const ballchasingApiKey = process.env.BALLCHASING_API_KEY;

    if (!ballchasingApiKey) {
      throw new Error('Ballchasing API key not configured');
    }

    // Fetch replay details from ballchasing.com with a timeout
    const response = await axios.get(
      `https://ballchasing.com/api/replays/${replay.ballchasing_id}`,
      {
        headers: {
          Authorization: ballchasingApiKey,
        },
        timeout: 5000, // 5 second timeout
      }
    );

    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch replay from ballchasing.com: ${response.status}`
      );
    }

    const replayData = response.data;

    // Check if the replay has been processed
    // Ballchasing returns: "ok" (processed), "pending" (processing), "failed" (error)
    if (replayData.status === 'pending') {
      // Still processing on ballchasing - return current status
      return NextResponse.json({
        message: 'Replay is still being processed by ballchasing.com',
        status: 'processing',
        replay: {
          id: replay.id,
          fileName: replay.file_name,
          ballchasingId: replay.ballchasing_id,
          visibility: replay.visibility,
          createdAt: replay.created_at,
        },
      });
    } else if (replayData.status === 'failed') {
      await supabase
        .from('replays')
        .update({
          status: 'failed',
          metrics: { error: 'Replay processing failed on ballchasing.com' },
          updated_at: new Date().toISOString(),
        })
        .eq('id', replay.id);

      return NextResponse.json({
        message: 'Replay processing failed on ballchasing.com',
        status: 'failed',
        replay: {
          id: replay.id,
          fileName: replay.file_name,
          ballchasingId: replay.ballchasing_id,
          visibility: replay.visibility,
          createdAt: replay.created_at,
        },
      });
    } else if (replayData.status !== 'ok') {
      // Unknown status - return processing and let it retry
      return NextResponse.json({
        message: 'Replay is being processed by ballchasing.com',
        status: 'processing',
        replay: {
          id: replay.id,
          fileName: replay.file_name,
          ballchasingId: replay.ballchasing_id,
          visibility: replay.visibility,
          createdAt: replay.created_at,
        },
      });
    }

    // Status is 'ok' - replay is fully processed, extract metrics
    const metrics = extractMetrics(replayData);

    // Update the replay record with metrics and status
    await supabase
      .from('replays')
      .update({
        status: 'ready',
        metrics: metrics,
        updated_at: new Date().toISOString(),
      })
      .eq('id', replay.id);

    return NextResponse.json({
      message: 'Replay is ready',
      status: 'ready',
      replay: {
        id: replay.id,
        fileName: replay.file_name,
        ballchasingId: replay.ballchasing_id,
        visibility: replay.visibility,
        createdAt: replay.created_at,
        metrics: metrics,
      },
    });
  } catch (error: any) {
    console.error('Error checking ballchasing status:', error);

    const checkFailures = (replay.metrics?.check_failures || 0) + 1;

    // After 10 failures (~5 min of polling), mark as failed
    if (checkFailures >= 10) {
      await supabase
        .from('replays')
        .update({
          status: 'failed',
          metrics: {
            ...replay.metrics,
            error: `Failed to check ballchasing.com after ${checkFailures} attempts: ${error.message}`,
            check_failures: checkFailures,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', replay.id);

      return NextResponse.json({
        message: 'Replay status check failed',
        status: 'failed',
        error: `Unable to retrieve status from ballchasing.com: ${error.message}`,
        replay: {
          id: replay.id,
          fileName: replay.file_name,
          ballchasingId: replay.ballchasing_id,
          visibility: replay.visibility,
          createdAt: replay.created_at,
        },
      });
    }

    // Update failure count
    await supabase
      .from('replays')
      .update({
        metrics: {
          ...replay.metrics,
          check_failures: checkFailures,
          last_check_error: error.message,
        },
      })
      .eq('id', replay.id);

    return NextResponse.json({
      message: 'Temporarily unable to check replay status',
      status: 'processing',
      error: error.message,
      checkFailures: checkFailures,
      replay: {
        id: replay.id,
        fileName: replay.file_name,
        ballchasingId: replay.ballchasing_id,
        visibility: replay.visibility,
        createdAt: replay.created_at,
      },
    });
  }
}
