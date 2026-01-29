// types/spotify.ts
export interface Song {
  title: string;
  artist: string;
  match_score: number;
  bpm: number;
  energy: string | number; // Allow both string ("High") and number (0.8)
  moods: string[];
  themes: string[];
  matched_criteria_details: string[];
  source_url?: string;
}

export interface RecommendationProfile {
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

export interface RecommendationResult {
  success: boolean;
  profile: RecommendationProfile;
  recommendations: Song[];
  player_id: string;
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
