// ABOUTME: Extracts structured metrics from ballchasing.com API response data.
// ABOUTME: Used by upload-replay and replay/[id] API routes to parse replay statistics.

export interface ExtractedMetrics {
  title: string;
  map_name: string;
  duration: number;
  date: string;
  playlist: string;
  overtime: boolean;
  overtime_seconds: number;
  season: string;
  teams: Record<string, TeamMetrics>;
}

export interface TeamMetrics {
  name: string;
  goals: number;
  shots: number;
  saves: number;
  assists: number;
  score: number;
  shooting_percentage: number;
  players: PlayerMetrics[];
}

export interface PlayerMetrics {
  name: string;
  platform: string;
  id: string;
  mvp: boolean;
  car_name: string;
  car_id: number;
  score: number;
  goals: number;
  assists: number;
  saves: number;
  shots: number;
  shooting_percentage: number;
  boost: {
    avg_amount: number;
    amount_collected: number;
    amount_stolen: number;
    time_zero_boost_percent: number;
    time_full_boost_percent: number;
  };
  movement: {
    avg_speed: number;
    total_distance: number;
    time_supersonic_speed_percent: number;
  };
  positioning: {
    time_defensive_third_percent: number;
    time_neutral_third_percent: number;
    time_offensive_third_percent: number;
    time_behind_ball_percent: number;
  };
}

/**
 * Extracts structured metrics from a ballchasing.com API response.
 * Normalizes the data structure and provides default values for missing fields.
 */
export function extractMetrics(replayData: any): ExtractedMetrics {
  const metrics: ExtractedMetrics = {
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

      const playerData: PlayerMetrics = {
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
