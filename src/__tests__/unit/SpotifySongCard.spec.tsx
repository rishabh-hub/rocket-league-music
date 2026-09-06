// ABOUTME: Unit tests for SpotifySongCard component.
// ABOUTME: Validates rendering of deterministic and agentic song fields.

import React from 'react';
import { render, screen } from '@testing-library/react';
import SpotifySongCard, {
  SPOTIFY_EMBED_HEIGHT,
} from '@/components/SpotifySongCard';
import { Song } from '@/types/spotify';

// --- Mocks ---

// Mock motion/react to render plain divs
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
  ExternalLink: () => <span data-testid="icon-external-link">ExtLink</span>,
  Music: () => <span data-testid="icon-music">Music</span>,
  Maximize2: () => <span data-testid="icon-maximize">Max</span>,
  Minimize2: () => <span data-testid="icon-minimize">Min</span>,
}));

// Mock UI primitives
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
  return { Card };
});

jest.mock('@/components/ui/button', () => {
  // asChild renders the child in place of the button, matching Radix Slot.
  const Button = ({
    children,
    asChild,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
    [key: string]: any;
  }) => (asChild ? <>{children}</> : <button {...props}>{children}</button>);
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

// --- Fixtures ---

const baseSong: Song = {
  title: 'Midnight Drive',
  artist: 'Synthwave Sam',
  match_score: 85,
  bpm: 128,
  energy: 'High',
  moods: ['Energetic', 'Uplifting'],
  themes: ['Competition', 'Victory'],
  matched_criteria: ['Energetic', 'Competition'],
  source_url: 'https://open.spotify.com/track/abc123',
};

const agenticSong: Song = {
  ...baseSong,
  llm_vibe: 'Futuristic arena energy with a neon glow',
  llm_game_moments: ['Aerial goal', 'Last-second save', 'Overtime winner'],
};

// --- Tests ---

describe('SpotifySongCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders core song fields (title, artist, match_score, bpm)', () => {
    render(<SpotifySongCard song={baseSong} index={0} />);

    expect(screen.getByText('Midnight Drive')).toBeInTheDocument();
    expect(screen.getByText('Synthwave Sam')).toBeInTheDocument();
    expect(screen.getByText('85% match')).toBeInTheDocument();
    expect(screen.getByText('128 BPM • High')).toBeInTheDocument();
  });

  it('highlights matched moods and themes using matched_criteria', () => {
    render(<SpotifySongCard song={baseSong} index={0} />);

    // "Energetic" is in matched_criteria, so its mood badge is filled
    expect(screen.getByText('Energetic')).toHaveAttribute(
      'data-variant',
      'default'
    );
    expect(screen.getByText('Uplifting')).toHaveAttribute(
      'data-variant',
      'outline'
    );

    // "Competition" is in matched_criteria, so its theme badge is tinted
    expect(screen.getByText('Competition')).toHaveAttribute(
      'data-variant',
      'success'
    );
    expect(screen.getByText('Victory')).toHaveAttribute(
      'data-variant',
      'secondary'
    );
  });

  it('carries chip colour on the badge variant, never in className', () => {
    render(<SpotifySongCard song={baseSong} index={0} />);

    // A hand-written fill on top of a variant lets the variant's own hover
    // state survive tailwind-merge and paint over the label.
    for (const label of ['Energetic', 'Uplifting', 'Competition', 'Victory']) {
      expect(screen.getByText(label).className).toBe('text-xs');
    }
  });

  it('does not reprint matched criteria as a summary line', () => {
    render(<SpotifySongCard song={baseSong} index={0} />);

    expect(screen.queryByText(/^Matched:/)).not.toBeInTheDocument();
  });

  it('orders matched moods ahead of unmatched ones', () => {
    const manyMoods: Song = {
      ...baseSong,
      moods: ['Calm', 'Driving', 'Wistful', 'Energetic'],
      matched_criteria: ['Energetic'],
    };
    render(<SpotifySongCard song={manyMoods} index={0} />);

    // The matched mood survives the cap of three; the last unmatched one does not
    expect(screen.getByText('Energetic')).toBeInTheDocument();
    expect(screen.queryByText('Wistful')).not.toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('renders llm_vibe when present (agentic song)', () => {
    render(<SpotifySongCard song={agenticSong} index={0} />);

    expect(
      screen.getByText('Futuristic arena energy with a neon glow')
    ).toBeInTheDocument();
  });

  it('renders llm_game_moments badges when present (agentic song)', () => {
    render(<SpotifySongCard song={agenticSong} index={0} />);

    expect(screen.getByText('Aerial goal')).toBeInTheDocument();
    expect(screen.getByText('Last-second save')).toBeInTheDocument();
    expect(screen.getByText('Overtime winner')).toBeInTheDocument();
  });

  it('omits agentic sections when those fields are absent', () => {
    render(<SpotifySongCard song={baseSong} index={0} />);

    // llm_vibe text should not appear
    expect(
      screen.queryByText('Futuristic arena energy with a neon glow')
    ).not.toBeInTheDocument();

    // llm_game_moments should not appear
    expect(screen.queryByText('Aerial goal')).not.toBeInTheDocument();
  });

  it('shows the match score exactly once, with no qualitative label', () => {
    render(<SpotifySongCard song={baseSong} index={0} />);

    expect(screen.getAllByText('85% match')).toHaveLength(1);
    expect(screen.queryByText('Perfect Match')).not.toBeInTheDocument();
  });

  it('shows the match score for a mid-range score', () => {
    const midMatchSong: Song = {
      ...baseSong,
      match_score: 70,
    };
    render(<SpotifySongCard song={midMatchSong} index={0} />);

    expect(screen.getByText('70% match')).toBeInTheDocument();
    expect(screen.queryByText('Good Match')).not.toBeInTheDocument();
  });

  // Spotify's embed draws its standard player only when it is given a full
  // 152px, and its full player at 352px. One pixel short of either and it
  // silently swaps to the 80px compact player and paints the leftover space
  // white. The container's border must therefore sit outside the height the
  // iframe receives, which is what box-content buys.
  it('offers only the two heights the Spotify embed honours', () => {
    expect(SPOTIFY_EMBED_HEIGHT.standard).toBe(152);
    expect(SPOTIFY_EMBED_HEIGHT.full).toBe(352);
  });

  it('keeps the player border outside the height the iframe is given', () => {
    const { container } = render(<SpotifySongCard song={baseSong} index={0} />);

    const player = container.querySelector('iframe')?.parentElement;
    expect(player).toBeTruthy();
    expect(player).toHaveClass('box-content');
    expect(player).toHaveClass('border');
  });
});
