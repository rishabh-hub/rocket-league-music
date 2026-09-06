// ABOUTME: Unit tests for the share post text and the share dialog's options.
// ABOUTME: The post is published in the player's name, so its voice is part of the contract.

import { fireEvent, render, screen } from '@testing-library/react';

import { ShareDialog, sharePost } from '@/components/ShareDialog';

jest.mock('lucide-react', () => ({
  Check: () => <span data-testid="icon-check" />,
  Copy: () => <span data-testid="icon-copy" />,
  Link2: () => <span data-testid="icon-link" />,
  Share2: () => <span data-testid="icon-share" />,
  // DialogContent's close button uses this one.
  X: () => <span data-testid="icon-close" />,
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

const URL_UNDER_TEST = 'https://replayrhythms.example/replays/abc';

describe('sharePost', () => {
  it('pairs the match with the music, because the pairing is the content', () => {
    expect(sharePost('Blue 2-5 Orange')).toBe(
      'Blue 2-5 Orange, and this is what it sounded like'
    );
  });

  it('keeps the name the player gave the replay, in whatever language', () => {
    expect(sharePost('buena partida para subir a c2')).toContain(
      'buena partida para subir a c2'
    );
  });

  // A thumb-typed result uses a hyphen. The typographically correct dash is
  // the polish that marks a line as machine-written.
  it('types the scoreline with a hyphen rather than an en dash', () => {
    const post = sharePost('Blue 2–5 Orange');
    expect(post).toContain('2-5');
    expect(post).not.toContain('–');
  });

  it('avoids the tells that make a post read as an advert', () => {
    const post = sharePost('Blue 2-5 Orange').toLowerCase();
    for (const tell of [
      'check out',
      'introducing',
      'discover',
      'unleash',
      'elevate',
      'seamless',
      'soundtrack of your',
      'replayrhythms',
      '#',
      '!',
      '—',
    ]) {
      expect(post).not.toContain(tell);
    }
    // One sentence, no closing full stop, and short enough to leave room for
    // the appended link and whatever the poster wants to say in front of it.
    expect(post.endsWith('.')).toBe(false);
    expect(post.length).toBeLessThan(140);
  });
});

describe('ShareDialog', () => {
  it('offers the link, X and Discord once opened', () => {
    render(<ShareDialog url={URL_UNDER_TEST} summary="Blue 2-5 Orange" />);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    expect(
      screen.getByRole('button', { name: 'Copy link' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Post on X' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Copy for Discord' })
    ).toBeInTheDocument();
  });

  it('shows the post before it is sent anywhere', () => {
    render(<ShareDialog url={URL_UNDER_TEST} summary="Blue 2-5 Orange" />);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    expect(screen.getByText(sharePost('Blue 2-5 Orange'))).toBeInTheDocument();
  });
});
