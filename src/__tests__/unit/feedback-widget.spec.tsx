// ABOUTME: Unit tests for FeedbackWidget's guarded localStorage access.
// ABOUTME: A browser that blocks site data must not take the widget or the page down.

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';

// --- Mocks ---

jest.mock('@vercel/analytics', () => ({
  track: jest.fn(),
}));

// lucide-react ships ESM that this Jest setup does not transform.
jest.mock('lucide-react', () => ({
  MessageSquare: () => <span data-testid="icon-message-square" />,
  X: () => <span data-testid="icon-x" />,
  Bug: () => <span data-testid="icon-bug" />,
  Lightbulb: () => <span data-testid="icon-lightbulb" />,
  Heart: () => <span data-testid="icon-heart" />,
  Wrench: () => <span data-testid="icon-wrench" />,
  MessageCircle: () => <span data-testid="icon-message-circle" />,
  Check: () => <span data-testid="icon-check" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  ChevronUp: () => <span data-testid="icon-chevron-up" />,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@/contexts/ContextualFeedbackContext', () => ({
  useContextualFeedbackContext: () => ({
    shouldSuppressGlobalFeedback: () => false,
    shouldOpenFullFeedback: null,
    clearFullFeedbackTrigger: jest.fn(),
  }),
}));

// --- Helpers ---

const blockedStorage = () =>
  new DOMException('Access is denied for this document.', 'SecurityError');

const trigger = () => screen.getByRole('button', { name: 'Send feedback' });

describe('FeedbackWidget storage guards', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it('renders when reading localStorage throws', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw blockedStorage();
    });

    // An unguarded read in the auto-show effect throws during commit, which
    // React rethrows out of render and the app-wide ErrorBoundary would catch.
    expect(() => render(<FeedbackWidget />)).not.toThrow();
    expect(trigger()).toBeInTheDocument();
  });

  it('closes when writing localStorage throws', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw blockedStorage();
    });

    render(<FeedbackWidget />);
    fireEvent.click(trigger());
    expect(screen.getByText('Tell me something')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Tell me something')).not.toBeInTheDocument();
    expect(trigger()).toBeInTheDocument();
  });
});

describe('FeedbackWidget auto-show', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    localStorage.clear();
  });

  it('prompts after the delay when nothing is stored', () => {
    render(<FeedbackWidget autoShowDelay={1000} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Tell me something')).toBeInTheDocument();
  });

  it('stays quiet while a stored dismissal is still fresh', () => {
    localStorage.setItem('feedback-dismissed-at', String(Date.now()));

    render(<FeedbackWidget autoShowDelay={1000} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByText('Tell me something')).not.toBeInTheDocument();
    expect(trigger()).toBeInTheDocument();
  });
});
