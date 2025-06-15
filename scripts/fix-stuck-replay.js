#!/usr/bin/env node

// ABOUTME: Server-side script to fix stuck replays by fetching data from ballchasing.com
// ABOUTME: Bypasses authentication since it runs directly on the server with environment variables

// Load environment variables from .env files
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Configuration - you can change these or pass as command line arguments
const REPLAY_ID = process.argv[2] || '79f74423-27b4-43e4-a048-076a707f9cf7';
const BALLCHASING_ID = process.argv[3] || '115a018e-6b8b-4038-b1cd-0da3e651b7f1';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node scripts/fix-stuck-replay.js [REPLAY_ID] [BALLCHASING_ID]');
  console.log('Example: node scripts/fix-stuck-replay.js 79f74423-27b4-43e4-a048-076a707f9cf7 115a018e-6b8b-4038-b1cd-0da3e651b7f1');
  process.exit(0);
}

// Environment variables - try multiple possible names
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.DATABASE_URL?.split('postgresql://')[0]; // Extract from DATABASE_URL if needed

const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY; // Fallback to anon key if needed

const BALLCHASING_API_KEY = process.env.BALLCHASING_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !BALLCHASING_API_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL:', !!SUPABASE_URL);
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_KEY);
  console.error('   - BALLCHASING_API_KEY:', !!BALLCHASING_API_KEY);
  process.exit(1);
}

// Initialize Supabase with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixStuckReplay() {
  try {
    console.log(`🔍 Checking replay ${REPLAY_ID}...`);

    // 1. Fetch current replay record
    const { data: replay, error: fetchError } = await supabase
      .from('replays')
      .select('*')
      .eq('id', REPLAY_ID)
      .single();

    if (fetchError || !replay) {
      console.error('❌ Replay not found:', fetchError);
      return;
    }

    console.log(`📊 Current status: ${replay.status}`);
    console.log(`🎯 Ballchasing ID: ${replay.ballchasing_id}`);

    // 2. Check ballchasing.com status
    console.log(`🌐 Fetching data from ballchasing.com...`);

    const response = await axios.get(
      `https://ballchasing.com/api/replays/${BALLCHASING_ID}`,
      {
        headers: {
          Authorization: BALLCHASING_API_KEY,
        },
        timeout: 15000,
      }
    );

    if (response.status !== 200) {
      console.error(`❌ Ballchasing API returned status: ${response.status}`);
      return;
    }

    const replayData = response.data;
    console.log(`✅ Ballchasing status: ${replayData.status}`);
    console.log(`📋 Title: ${replayData.title}`);
    console.log(`🗺️  Map: ${replayData.map_name}`);

    // 3. Handle different statuses
    if (replayData.status === 'pending') {
      console.log('⏳ Replay still being processed on ballchasing.com');
      return;
    }

    if (replayData.status === 'failed') {
      console.log('❌ Replay processing failed on ballchasing.com');

      const { error: updateError } = await supabase
        .from('replays')
        .update({
          status: 'failed',
          metrics: { error: 'Replay processing failed on ballchasing.com' },
          updated_at: new Date().toISOString(),
        })
        .eq('id', REPLAY_ID);

      if (updateError) {
        console.error('❌ Failed to update replay status:', updateError);
      } else {
        console.log('✅ Updated replay status to failed');
      }
      return;
    }

    // 4. Extract metrics
    console.log('📊 Extracting metrics...');
    const metrics = extractMetrics(replayData);

    console.log(`👥 Teams: ${Object.keys(metrics.teams).join(', ')}`);
    console.log(`🎮 Blue players: ${metrics.teams.blue?.players?.length || 0}`);
    console.log(
      `🎮 Orange players: ${metrics.teams.orange?.players?.length || 0}`
    );

    // 5. Update database
    console.log('💾 Updating database...');

    const { error: updateError } = await supabase
      .from('replays')
      .update({
        status: 'ready',
        metrics: metrics,
        updated_at: new Date().toISOString(),
      })
      .eq('id', REPLAY_ID);

    if (updateError) {
      console.error('❌ Failed to update replay:', updateError);
      return;
    }

    console.log('🎉 Successfully fixed stuck replay!');
    console.log(`✅ Status: processing → ready`);
    console.log(
      `✅ Metrics populated with ${JSON.stringify(metrics).length} characters`
    );
  } catch (error) {
    console.error('❌ Error fixing replay:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

function extractMetrics(replayData) {
  const metrics = {
    title: replayData.title || '',
    map_name: replayData.map_name || '',
    duration: replayData.duration || 0,
    date: replayData.date || '',
    playlist: replayData.playlist_name || '',
    overtime: replayData.overtime || false,
    overtime_seconds: replayData.overtime_seconds || 0,
    season: replayData.season || '',
    teams: {},
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

// Run the fix
fixStuckReplay();
