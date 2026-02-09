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

// Mock SpotifySongCard as a simple div (per navbar pattern)
jest.mock('@/components/SpotifySongCard', () => {
  const MockSpotifySongCard = ({ song, index }: { song: any; index: number }) => (
    <div data-testid={`song-card-${index}`}>
      {song.title} by {song.artist}
    </div>
  );
  MockSpotifySongCard.displayName = 'SpotifySongCard';
  return MockSpotifySongCard;
});

// --- Fixtures ---

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

  it('renders "Test with Sample Data" button', () => {
    render(<SongRecommendations replayData={null} />);

    expect(
      screen.getByRole('button', { name: /test with sample data/i })
    ).toBeInTheDocument();
  });

  describe('deterministic mode', () => {
    it('renders categories grid and metrics after fetch', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => deterministicResult,
      });

      render(<SongRecommendations replayData={null} />);

      // Click "Test with Sample Data"
      fireEvent.click(
        screen.getByRole('button', { name: /test with sample data/i })
      );

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
        expect(screen.getByText('Intensity Score')).toBeInTheDocument();
        expect(screen.getByText('75')).toBeInTheDocument();
        expect(screen.getByText('Performance Score')).toBeInTheDocument();
        expect(screen.getByText('80')).toBeInTheDocument();
        expect(screen.getByText('Teamwork Factor')).toBeInTheDocument();
        expect(screen.getByText('60')).toBeInTheDocument();
      });
    });

    it('does NOT render game_reading fields in deterministic mode', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => deterministicResult,
      });

      render(<SongRecommendations replayData={null} />);

      fireEvent.click(
        screen.getByRole('button', { name: /test with sample data/i })
      );

      await waitFor(() => {
        expect(screen.getByText('75')).toBeInTheDocument();
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

    it('renders song cards', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => deterministicResult,
      });

      render(<SongRecommendations replayData={null} />);

      fireEvent.click(
        screen.getByRole('button', { name: /test with sample data/i })
      );

      await waitFor(() => {
        expect(screen.getByTestId('song-card-0')).toBeInTheDocument();
        expect(
          screen.getByText('Test Song by Test Artist')
        ).toBeInTheDocument();
      });
    });
  });

  describe('agentic mode', () => {
    it('renders narrative, player_archetype, emotional_arc, key_observations, and song_search_direction', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => agenticResult,
      });

      render(<SongRecommendations replayData={null} />);

      fireEvent.click(
        screen.getByRole('button', { name: /test with sample data/i })
      );

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

        // Song Search Direction
        expect(
          screen.getByText(
            'High energy electronic music with triumphant drops and soaring synths'
          )
        ).toBeInTheDocument();
      });
    });

    it('does NOT render categories or metrics in agentic mode', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => agenticResult,
      });

      render(<SongRecommendations replayData={null} />);

      fireEvent.click(
        screen.getByRole('button', { name: /test with sample data/i })
      );

      await waitFor(() => {
        expect(screen.getByText('Aerial Ace')).toBeInTheDocument();
      });

      // Deterministic-specific content should NOT be present
      expect(screen.queryByText('Intensity Score')).not.toBeInTheDocument();
      expect(screen.queryByText('Performance Score')).not.toBeInTheDocument();
      expect(screen.queryByText('Teamwork Factor')).not.toBeInTheDocument();
    });

    it('renders agentic song cards', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => agenticResult,
      });

      render(<SongRecommendations replayData={null} />);

      fireEvent.click(
        screen.getByRole('button', { name: /test with sample data/i })
      );

      await waitFor(() => {
        expect(screen.getByTestId('song-card-0')).toBeInTheDocument();
        expect(
          screen.getByText('Agentic Song by AI Artist')
        ).toBeInTheDocument();
      });
    });
  });
});
