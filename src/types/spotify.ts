// ABOUTME: Type definitions for Spotify integration and music recommendation system.
// ABOUTME: Supports both deterministic and agentic recommendation pipeline modes.

export interface Song {
  title: string;
  artist: string;
  match_score: number;
  bpm: number;
  energy: string | number; // Allow both string ("High") and number (0.8)
  moods: string[];
  themes: string[];
  matched_criteria: string[];
  source_url?: string;
  song_id?: number;
  track_id?: string;
  // Agentic pipeline fields
  lastfm_tags?: Array<{ name: string; count: number }>;
  llm_moods?: string[];
  llm_themes?: string[];
  llm_energy?: string;
  llm_vibe?: string;
  llm_game_moments?: string[];
}

export interface GameReading {
  narrative: string;
  key_observations: string[];
  player_archetype: string;
  emotional_arc: string;
  song_search_direction: string;
}

export interface DeterministicProfile {
  player_name: string;
  metrics: {
    intensity_score: number;
    performance_score: number;
    teamwork_factor: number;
    game_outcome: any;
  };
  categories: {
    intensity: string;
    performance: string;
    teamwork: string;
    closeness: string;
  };
  desired_song_profile: any;
}

export interface AgenticProfile {
  player_name: string;
  game_reading: GameReading;
  desired_song_profile: any;
}

export type RecommendationProfile = DeterministicProfile | AgenticProfile;

export function isAgenticProfile(
  profile: RecommendationProfile
): profile is AgenticProfile {
  return 'game_reading' in profile;
}

export function isDeterministicProfile(
  profile: RecommendationProfile
): profile is DeterministicProfile {
  return 'metrics' in profile;
}

export interface RecommendationResult {
  success: boolean;
  profile: RecommendationProfile;
  recommendations: Song[];
  player_id: string;
  game_reading?: GameReading;
  metadata: {
    used_sample_data: boolean;
    timestamp: string;
    request_id: string;
    processed_at: string;
  };
  error?: string;
}

export interface Player {
  id: string;
  name: string;
  goals?: number;
  saves?: number;
  assists?: number;
  mvp?: boolean;
}
