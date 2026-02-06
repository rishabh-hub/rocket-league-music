// ABOUTME: Shared TypeScript interfaces for Rocket League replay data structures.
// ABOUTME: Used across components and pages for consistent type definitions.

/**
 * Player statistics from a replay including boost, movement, and positioning data.
 */
export interface Player {
  name: string;
  platform?: string;
  id?: string;
  mvp: boolean;
  car_name?: string;
  car_id?: number;
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
 * Team statistics including aggregated stats and player list.
 */
export interface Team {
  name: string;
  goals: number;
  shots: number;
  saves: number;
  assists: number;
  score: number;
  shooting_percentage: number;
  players: Player[];
}

/**
 * Complete metrics extracted from a processed replay.
 */
export interface ReplayMetrics {
  title: string;
  map_name: string;
  duration: number;
  date: string;
  playlist: string;
  overtime?: boolean;
  overtime_seconds?: number;
  season?: string;
  teams: {
    blue: Team;
    orange: Team;
  };
}

/**
 * Full replay data structure used in replay detail pages.
 */
export interface ReplayData {
  id: string;
  fileName: string;
  ballchasingId?: string;
  visibility: string;
  createdAt: string;
  metrics?: ReplayMetrics;
  user_id?: string;
}

/**
 * Replay list item structure used in listing pages.
 */
export interface Replay {
  id: string;
  file_name: string;
  status: string;
  ballchasing_id?: string;
  visibility: string;
  created_at: string;
  updated_at: string;
  metrics?: any;
}
