// ABOUTME: Unit tests for the CardTitle / CardSectionLabel split in components/ui/card.
// ABOUTME: Locks in that a size override on CardTitle does not leave uppercase or muted colour behind.
import React from 'react';
import { render, screen } from '@testing-library/react';

import { CardSectionLabel, CardTitle } from '@/components/ui/card';

describe('CardTitle', () => {
  it('renders as a sentence-case heading in the card ink by default', () => {
    render(<CardTitle>Upload a replay</CardTitle>);

    const title = screen.getByText('Upload a replay');
    expect(title.className).toContain('text-card-foreground');
    expect(title.className).not.toContain('uppercase');
    expect(title.className).not.toContain('text-muted-foreground');
  });

  it('keeps case and colour when a call site only changes the size', () => {
    render(<CardTitle className="text-2xl tracking-tight">Sign in</CardTitle>);

    const title = screen.getByText('Sign in');
    expect(title.className).toContain('text-2xl');
    expect(title.className).toContain('text-card-foreground');
    expect(title.className).not.toContain('uppercase');
    expect(title.className).not.toContain('text-muted-foreground');
  });
});

describe('CardSectionLabel', () => {
  it('renders the small uppercase label treatment', () => {
    render(<CardSectionLabel>Game summary</CardSectionLabel>);

    const label = screen.getByText('Game summary');
    expect(label.className).toContain('uppercase');
    expect(label.className).toContain('text-sm');
    expect(label.className).toContain('text-muted-foreground');
  });

  it('lets a call site replace the colour, as the team cards do', () => {
    render(
      <CardSectionLabel className="text-primary">Blue Team</CardSectionLabel>
    );

    const label = screen.getByText('Blue Team');
    expect(label.className).toContain('uppercase');
    expect(label.className).toContain('text-primary');
    expect(label.className).not.toContain('text-muted-foreground');
  });
});
