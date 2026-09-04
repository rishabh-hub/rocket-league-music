// ABOUTME: Unit tests for SongRecommendations component.
// ABOUTME: Validates conditional rendering for deterministic vs agentic profile modes.

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SongRecommendations from '@/components/SongRecommendations';

// --- Mocks ---

// Mock motion/react
jest.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: any;
    }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Music: () => <span data-testid="icon-music">Music</span>,
  Loader2: ({ className }: { className?: string }) => (
    <span data-testid="icon-loader" className={className}>
      Loader
    </span>
  ),
  Zap: () => <span data-testid="icon-zap">Zap</span>,
  Users: () => <span data-testid="icon-users">Users</span>,
  Trophy: () => <span data-testid="icon-trophy">Trophy</span>,
  Target: () => <span data-testid="icon-target">Target</span>,
  RefreshCw: () => <span data-testid="icon-refresh">Refresh</span>,
}));

// Mock UI components
jest.mock('@/components/ui/card', () => {
  const Card = ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  );
  Card.displayName = 'Card';

  const CardContent = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  );
  CardContent.displayName = 'CardContent';

  const CardHeader = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  );
  CardHeader.displayName = 'CardHeader';

  const CardTitle = ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <h2 data-testid="card-title" className={className}>
      {children}
    </h2>
  );
  CardTitle.displayName = 'CardTitle';

  return { Card, CardContent, CardHeader, CardTitle };
});

jest.mock('@/components/ui/button', () => {
  const Button = ({
    children,
    onClick,
    disabled,
    variant,
    className,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    className?: string;
    [key: string]: any;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      className={className}
    >
      {children}
    </button>
  );
  Button.displayName = 'Button';
  return { Button };
});

jest.mock('@/components/ui/badge', () => {
  const Badge = ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <span data-testid="badge" className={className} data-variant={variant}>
      {children}
    </span>
  );
  Badge.displayName = 'Badge';
  return { Badge };
});

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock SpotifySongCard as a simple div (per navbar pattern). It exposes the
// play-state callback in both directions so the parent's bookkeeping is testable.
jest.mock('@/components/SpotifySongCard', () => {
  const MockSpotifySongCard = ({
    song,
    index,
    isPlaying,
    onPlayStateChange,
  }: {
    song: any;
    index: number;
    isPlaying?: boolean;
    onPlayStateChange?: (isPlaying: boolean, songIndex: number) => void;
  }) => (
    <div data-testid={`song-card-${index}`} data-playing={String(!!isPlaying)}>
      <span>
        {song.title} by {song.artist}
      </span>
      <button onClick={() => onPlayStateChange?.(true, index)}>
        expand {index}
      </button>
      <button onClick={() => onPlayStateChange?.(false, index)}>
        collapse {index}
      </button>
    </div>
  );
  MockSpotifySongCard.displayName = 'SpotifySongCard';
  return MockSpotifySongCard;
});

// --- Fixtures ---

const replayData = {
  metrics: {
    teams: {
      blue: {
        players: [
          {
            id: 'player-123',
            name: 'TestPlayer',
            goals: 2,
            saves: 1,
            assists: 3,
          },
        ],
      },
    },
  },
};

const deterministicResult = {
  success: true,
  profile: {
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
  },
  recommendations: [
    {
      title: 'Test Song',
      artist: 'Test Artist',
      match_score: 85,
      bpm: 128,
      energy: 'High',
      moods: ['Energetic'],
      themes: ['Victory'],
      matched_criteria: ['Energetic'],
    },
  ],
  player_id: 'player-123',
  metadata: {
    used_sample_data: true,
    timestamp: '2025-01-01T00:00:00Z',
    request_id: 'req-123',
    processed_at: '2025-01-01T00:00:01Z',
  },
};

const twoSongResult = {
  ...deterministicResult,
  recommendations: [
    { ...deterministicResult.recommendations[0], title: 'First Song' },
    { ...deterministicResult.recommendations[0], title: 'Second Song' },
  ],
};

const weakCategoriesResult = {
  ...deterministicResult,
  profile: {
    ...deterministicResult.profile,
    categories: {
      intensity: 'Low',
      performance: 'Poor',
      teamwork: 'Medium',
      closeness: 'Excellent',
    },
  },
};

const agenticResult = {
  success: true,
  profile: {
    player_name: 'TestPlayer',
    game_reading: {
      narrative:
        'An explosive match with relentless aerial pressure and clutch saves.',
      key_observations: [
        'Dominant aerial presence',
        'Consistent boost management',
        'Strong rotation discipline',
      ],
      player_archetype: 'Aerial Ace',
      emotional_arc: 'Tense buildup to triumphant finish',
      song_search_direction:
        'High energy electronic music with triumphant drops and soaring synths',
    },
    desired_song_profile: { energy: 'high' },
  },
  recommendations: [
    {
      title: 'Agentic Song',
      artist: 'AI Artist',
      match_score: 90,
      bpm: 140,
      energy: 'High',
      moods: ['Intense'],
      themes: ['Triumph'],
      matched_criteria: ['Intense'],
      llm_vibe: 'Arena energy',
      llm_game_moments: ['Aerial goal'],
    },
  ],
  player_id: 'player-456',
  metadata: {
    used_sample_data: false,
    timestamp: '2025-01-01T00:00:00Z',
    request_id: 'req-456',
    processed_at: '2025-01-01T00:00:01Z',
  },
};

// --- Tests ---

describe('SongRecommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a button per player in the replay', () => {
    render(<SongRecommendations replayData={replayData} />);

    expect(
      screen.getByRole('button', { name: /TestPlayer/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText('2 goals · 1 saves · 3 assists')
    ).toBeInTheDocument();
  });

  describe('deterministic mode', () => {
    it('renders categories grid and metrics after fetch', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => deterministicResult,
      });

      render(<SongRecommendations replayData={replayData} />);

      // Pick the player the recommendations are generated for
      fireEvent.click(screen.getByRole('button', { name: /TestPlayer/i }));

      await waitFor(() => {
        // Categories should render
        expect(screen.getByText('intensity')).toBeInTheDocument();
        expect(screen.getByText('performance')).toBeInTheDocument();
        expect(screen.getByText('teamwork')).toBeInTheDocument();
        expect(screen.getByText('closeness')).toBeInTheDocument();

        // Category values
        expect(screen.getByText('High')).toBeInTheDocument();
        expect(screen.getByText('Excellent')).toBeInTheDocument();
        expect(screen.getByText('Good')).toBeInTheDocument();
        expect(screen.getByText('Medium')).toBeInTheDocument();

        // Metrics
        expect(screen.getByText('Intensity')).toBeInTheDocument();
        expect(screen.getByText('75/100')).toBeInTheDocument();
        expect(screen.getByText('Performance')).toBeInTheDocument();
        expect(screen.getByText('80/100')).toBeInTheDocument();
        expect(screen.getByText('Teamwork')).toBeInTheDocument();
        expect(screen.getByText('60/100')).toBeInTheDocument();
      });
    });

    it('does NOT render game_reading fields in deterministic mode', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => deterministicResult,
      });

      render(<SongRecommendations replayData={replayData} />);

      fireEvent.click(screen.getByRole('button', { name: /TestPlayer/i }));

      await waitFor(() => {
        expect(screen.getByText('75/100')).toBeInTheDocument();
      });

      // Agentic-specific content should NOT be present
      expect(screen.queryByText('Aerial Ace')).not.toBeInTheDocument();
      expect(
        screen.queryByText(/relentless aerial pressure/)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Tense buildup to triumphant finish')
      ).not.toBeInTheDocument();
    });

    it('grades each category with a badge variant, not a hand-written tint', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => weakCategoriesResult,
      });

      render(<SongRecommendations replayData={replayData} />);

      fireEvent.click(screen.getByRole('button', { name: /TestPlayer/i }));

      await waitFor(() => {
        expect(screen.getByText('Excellent')).toBeInTheDocument();
      });

      expect(screen.getByText('Excellent')).toHaveAttribute(
        'data-variant',
        'success'
      );
      expect(screen.getByText('Medium')).toHaveAttribute(
        'data-variant',
        'secondary'
      );
      expect(screen.getByText('Low')).toHaveAttribute(
        'data-variant',
        'outline'
      );
      expect(screen.getByText('Poor')).toHaveAttribute(
        'data-variant',
        'outline'
      );

      // No colour utilities ride in on className, where the variant's own
      // hover state would survive tailwind-merge and override them.
      for (const value of ['Excellent', 'Medium', 'Low', 'Poor']) {
        expect(screen.getByText(value).className).toBe('');
      }
    });

    it('renders song cards', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => deterministicResult,
      });

      render(<SongRecommendations replayData={replayData} />);

      fireEvent.click(screen.getByRole('button', { name: /TestPlayer/i }));

      await waitFor(() => {
        expect(screen.getByTestId('song-card-0')).toBeInTheDocument();
        expect(
          screen.getByText('Test Song by Test Artist')
        ).toBeInTheDocument();
      });
    });
  });

  describe('agentic mode', () => {
    it('renders narrative, player_archetype, emotional_arc and key_observations, but not song_search_direction', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => agenticResult,
      });

      render(<SongRecommendations replayData={replayData} />);

      fireEvent.click(screen.getByRole('button', { name: /TestPlayer/i }));

      await waitFor(() => {
        // Narrative
        expect(
          screen.getByText(
            'An explosive match with relentless aerial pressure and clutch saves.'
          )
        ).toBeInTheDocument();

        // Player Archetype
        expect(screen.getByText('Aerial Ace')).toBeInTheDocument();

        // Emotional Arc
        expect(
          screen.getByText('Tense buildup to triumphant finish')
        ).toBeInTheDocument();

        // Key Observations
        expect(
          screen.getByText('Dominant aerial presence')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Consistent boost management')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Strong rotation discipline')
        ).toBeInTheDocument();

        // The internal search direction stays out of the UI
        expect(
          screen.queryByText(
            'High energy electronic music with triumphant drops and soaring synths'
          )
        ).not.toBeInTheDocument();
      });
    });

    it('does NOT render categories or metrics in agentic mode', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => agenticResult,
      });

      render(<SongRecommendations replayData={replayData} />);

      fireEvent.click(screen.getByRole('button', { name: /TestPlayer/i }));

      await waitFor(() => {
        expect(screen.getByText('Aerial Ace')).toBeInTheDocument();
      });

      // Deterministic-specific content should NOT be present
      expect(screen.queryByText('75/100')).not.toBeInTheDocument();
      expect(screen.queryByText('80/100')).not.toBeInTheDocument();
      expect(screen.queryByText('60/100')).not.toBeInTheDocument();
    });

    it('renders agentic song cards', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => agenticResult,
      });

      render(<SongRecommendations replayData={replayData} />);

      fireEvent.click(screen.getByRole('button', { name: /TestPlayer/i }));

      await waitFor(() => {
        expect(screen.getByTestId('song-card-0')).toBeInTheDocument();
        expect(
          screen.getByText('Agentic Song by AI Artist')
        ).toBeInTheDocument();
      });
    });
  });

  describe('now-playing bookkeeping', () => {
    const renderTwoCards = async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => twoSongResult,
      });

      render(<SongRecommendations replayData={replayData} />);

      fireEvent.click(screen.getByRole('button', { name: /TestPlayer/i }));

      await waitFor(() => {
        expect(screen.getByTestId('song-card-1')).toBeInTheDocument();
      });
    };

    it('moves the highlight to whichever card was expanded last', async () => {
      await renderTwoCards();

      fireEvent.click(screen.getByRole('button', { name: 'expand 0' }));
      expect(screen.getByTestId('song-card-0')).toHaveAttribute(
        'data-playing',
        'true'
      );

      fireEvent.click(screen.getByRole('button', { name: 'expand 1' }));
      expect(screen.getByTestId('song-card-1')).toHaveAttribute(
        'data-playing',
        'true'
      );
      expect(screen.getByTestId('song-card-0')).toHaveAttribute(
        'data-playing',
        'false'
      );
    });

    it('lets a collapsing card clear only its own highlight', async () => {
      await renderTwoCards();

      fireEvent.click(screen.getByRole('button', { name: 'expand 0' }));
      fireEvent.click(screen.getByRole('button', { name: 'expand 1' }));

      // Card 0 is still open; collapsing it must not touch card 1
      fireEvent.click(screen.getByRole('button', { name: 'collapse 0' }));
      expect(screen.getByTestId('song-card-1')).toHaveAttribute(
        'data-playing',
        'true'
      );

      // The card that owns the highlight can still give it up
      fireEvent.click(screen.getByRole('button', { name: 'collapse 1' }));
      expect(screen.getByTestId('song-card-1')).toHaveAttribute(
        'data-playing',
        'false'
      );
    });

    it('reports Spotify engagement once per expand', async () => {
      const onSpotifyIntegrationUsed = jest.fn();
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => twoSongResult,
      });

      render(
        <SongRecommendations
          replayData={replayData}
          onSpotifyIntegrationUsed={onSpotifyIntegrationUsed}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /TestPlayer/i }));

      await waitFor(() => {
        expect(screen.getByTestId('song-card-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'expand 0' }));
      fireEvent.click(screen.getByRole('button', { name: 'collapse 0' }));

      expect(onSpotifyIntegrationUsed).toHaveBeenCalledTimes(1);
    });
  });
});
