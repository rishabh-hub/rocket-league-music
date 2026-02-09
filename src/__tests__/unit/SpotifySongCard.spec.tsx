// ABOUTME: Unit tests for SpotifySongCard component.
// ABOUTME: Validates rendering of deterministic and agentic song fields.

import React from 'react';
import { render, screen } from '@testing-library/react';
import SpotifySongCard from '@/components/SpotifySongCard';
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
  const Button = ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: any;
  }) => <button {...props}>{children}</button>;
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
    expect(screen.getByText('by Synthwave Sam')).toBeInTheDocument();
    expect(screen.getByText('Match: 85%')).toBeInTheDocument();
    expect(screen.getByText('128 BPM • High')).toBeInTheDocument();
  });

  it('highlights matched moods and themes using matched_criteria', () => {
    render(<SpotifySongCard song={baseSong} index={0} />);

    // "Energetic" is in matched_criteria, should have a checkmark
    const energeticBadge = screen.getByText((content, element) => {
      return (
        element?.tagName.toLowerCase() === 'span' &&
        content.includes('Energetic') &&
        (element?.textContent?.includes('\u2713') ?? false)
      );
    });
    expect(energeticBadge).toBeInTheDocument();

    // "Competition" is in matched_criteria for themes, should have a star
    const competitionBadge = screen.getByText((content, element) => {
      return (
        element?.tagName.toLowerCase() === 'span' &&
        content.includes('Competition') &&
        (element?.textContent?.includes('\u2605') ?? false)
      );
    });
    expect(competitionBadge).toBeInTheDocument();
  });

  it('renders matched criteria summary text', () => {
    render(<SpotifySongCard song={baseSong} index={0} />);

    expect(
      screen.getByText('Matched: Energetic, Competition')
    ).toBeInTheDocument();
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

  it('renders quality badge based on match_score', () => {
    render(<SpotifySongCard song={baseSong} index={0} />);

    // 85% should get "Perfect Match"
    expect(screen.getByText('Perfect Match')).toBeInTheDocument();
  });

  it('renders "Good Match" badge for scores between 60-79', () => {
    const goodMatchSong: Song = {
      ...baseSong,
      match_score: 70,
    };
    render(<SpotifySongCard song={goodMatchSong} index={0} />);

    expect(screen.getByText('Good Match')).toBeInTheDocument();
  });
});
