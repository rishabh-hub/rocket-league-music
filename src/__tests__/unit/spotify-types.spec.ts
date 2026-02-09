// ABOUTME: Unit tests for type guard functions in the spotify types module.
// ABOUTME: Validates isAgenticProfile and isDeterministicProfile discriminate correctly.

import {
  isAgenticProfile,
  isDeterministicProfile,
  DeterministicProfile,
  AgenticProfile,
} from '@/types/spotify';

const deterministicProfile: DeterministicProfile = {
  player_name: 'TestPlayer',
  metrics: {
    intensity_score: 75,
    performance_score: 80,
    teamwork_factor: 60,
    game_outcome: 'win',
  },
  categories: {
    intensity: 'High',
    performance: 'Excellent',
    teamwork: 'Good',
    closeness: 'Medium',
  },
  desired_song_profile: { energy: 'high' },
};

const agenticProfile: AgenticProfile = {
  player_name: 'TestPlayer',
  game_reading: {
    narrative: 'An intense aerial duel match with constant pressure.',
    key_observations: ['Aggressive playstyle', 'High boost usage'],
    player_archetype: 'Aerial Ace',
    emotional_arc: 'Tense buildup to triumphant finish',
    song_search_direction: 'High energy electronic with triumphant drops',
  },
  desired_song_profile: { energy: 'high' },
};

describe('isAgenticProfile', () => {
  it('returns true for an agentic profile', () => {
    expect(isAgenticProfile(agenticProfile)).toBe(true);
  });

  it('returns false for a deterministic profile', () => {
    expect(isAgenticProfile(deterministicProfile)).toBe(false);
  });
});

describe('isDeterministicProfile', () => {
  it('returns true for a deterministic profile', () => {
    expect(isDeterministicProfile(deterministicProfile)).toBe(true);
  });

  it('returns false for an agentic profile', () => {
    expect(isDeterministicProfile(agenticProfile)).toBe(false);
  });
});
