// app/api/replay/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import axios from 'axios';

// Define segment config to properly handle params
export const dynamic = 'force-dynamic';

/**
 * GET handler for fetching replay details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

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

    // Check if this user has permission to access this replay
    if (replay.user_id !== user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

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
        // Check if replay has been processing for more than 2 minutes
        const processingTime =
          new Date().getTime() - new Date(replay.updated_at).getTime();
        if (processingTime > 2 * 60 * 1000 && replay.ballchasing_id) {
          // Check status from ballchasing.com
          try {
            return await checkBallchasingStatus(supabase, replay);
          } catch (error: any) {
            // On error, still return the current status
            console.error('Error checking ballchasing status:', error);
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
    if (replayData.status === 'pending') {
      await supabase
        .from('replays')
        .update({
          status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', replay.id);

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
    }

    // Extract metrics
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

    // Don't update status on error, just return current status
    return NextResponse.json({
      message: 'Error checking replay status',
      status: replay.status,
      error: error.message,
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

function extractMetrics(replayData: any) {
  // Extract the metrics from the ballchasing API response
  const metrics = {
    title: replayData.title || '',
    map_name: replayData.map_name || '',
    duration: replayData.duration || 0,
    date: replayData.date || '',
    playlist: replayData.playlist_name || '',
    overtime: replayData.overtime || false,
    overtime_seconds: replayData.overtime_seconds || 0,
    season: replayData.season || '',
    teams: {} as Record<string, any>,
  };

  // Process team data
  for (const team_color of ['blue', 'orange']) {
    const team = replayData[team_color] || {};
    const teamStats = team.stats || {};
    const teamCore = teamStats.core || {};

    metrics.teams[team_color] = {
      name:
        team.name || team_color.charAt(0).toUpperCase() + team_color.slice(1),
      goals: teamCore.goals || 0,
      shots: teamCore.shots || 0,
      saves: teamCore.saves || 0,
      assists: teamCore.assists || 0,
      score: teamCore.score || 0,
      shooting_percentage: teamCore.shooting_percentage || 0,
      players: [],
    };

    // Process player data
    for (const player of team.players || []) {
      const playerStats = player.stats || {};
      const playerCore = playerStats.core || {};
      const playerBoost = playerStats.boost || {};
      const playerMovement = playerStats.movement || {};
      const playerPositioning = playerStats.positioning || {};

      const playerData = {
        name: player.name || '',
        platform: player.id?.platform || '',
        id: player.id?.id || '',
        mvp: player.mvp || false,
        car_name: player.car_name || '',
        car_id: player.car_id || 0,
        score: playerCore.score || 0,
        goals: playerCore.goals || 0,
        assists: playerCore.assists || 0,
        saves: playerCore.saves || 0,
        shots: playerCore.shots || 0,
        shooting_percentage: playerCore.shooting_percentage || 0,
        boost: {
          avg_amount: playerBoost.avg_amount || 0,
          amount_collected: playerBoost.amount_collected || 0,
          amount_stolen: playerBoost.amount_stolen || 0,
          time_zero_boost_percent: playerBoost.percent_zero_boost || 0,
          time_full_boost_percent: playerBoost.percent_full_boost || 0,
        },
        movement: {
          avg_speed: playerMovement.avg_speed || 0,
          total_distance: playerMovement.total_distance || 0,
          time_supersonic_speed_percent:
            playerMovement.percent_supersonic_speed || 0,
        },
        positioning: {
          time_defensive_third_percent:
            playerPositioning.percent_defensive_third || 0,
          time_neutral_third_percent:
            playerPositioning.percent_neutral_third || 0,
          time_offensive_third_percent:
            playerPositioning.percent_offensive_third || 0,
          time_behind_ball_percent: playerPositioning.percent_behind_ball || 0,
        },
      };

      metrics.teams[team_color].players.push(playerData);
    }
  }

  return metrics;
}
