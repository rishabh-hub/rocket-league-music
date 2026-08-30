// ABOUTME: Quick thumbs up/down feedback component for contextual placement
// ABOUTME: Supports anonymous users and provides immediate feedback confirmation

'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { track } from '@vercel/analytics';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type QuickRating = 'thumbs-up' | 'thumbs-down' | 'helpful' | 'not-helpful';

interface QuickFeedbackProps {
  context: string; // e.g., 'replay-stats', 'music-recommendations'
  label?: string;
  className?: string;
  variant?: 'thumbs' | 'helpful';
  onFeedbackSubmitted?: (rating: QuickRating) => void;
}

export function QuickFeedback({
  context,
  label = 'Do these songs fit?',
  className = '',
  variant = 'helpful',
  onFeedbackSubmitted,
}: QuickFeedbackProps) {
  const [selectedRating, setSelectedRating] = useState<QuickRating | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { toast } = useToast();

  const handleRating = async (rating: QuickRating) => {
    if (isSubmitting || isSubmitted) return;

    setIsSubmitting(true);
    setSelectedRating(rating);

    try {
      const response = await fetch('/api/feedback/quick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context,
          rating,
          pageUrl: window.location.href,
          sessionId: getSessionId(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quick feedback');
      }

      setIsSubmitted(true);
      onFeedbackSubmitted?.(rating);

      // Track quick feedback submission
      track('Quick Feedback Submitted', {
        context,
        rating,
        variant,
        page: window.location.pathname,
        authenticated: !!sessionStorage.getItem('supabase.auth.token'),
      });

      // Show success message briefly
      toast({
        title: 'Got it. I read these myself.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error submitting quick feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
      setSelectedRating(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate or retrieve session ID for anonymous users
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('feedback-session-id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem('feedback-session-id', sessionId);
    }
    return sessionId;
  };

  if (isSubmitted) {
    return (
      <Card
        className={`inline-flex items-center gap-2 rounded-lg border-border bg-secondary px-3 py-2 ${className}`}
      >
        <Check className="h-4 w-4 text-primary" />
        <span className="text-sm text-muted-foreground">
          Got it. I read these myself.
        </span>
      </Card>
    );
  }

  if (variant === 'thumbs') {
    return (
      <Card className={`inline-flex items-center gap-3 px-4 py-2 ${className}`}>
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRating('thumbs-up')}
            disabled={isSubmitting}
            className={`h-8 w-8 p-0 ${
              selectedRating === 'thumbs-up'
                ? 'bg-accent text-accent-foreground'
                : ''
            }`}
            aria-label="Thumbs up"
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRating('thumbs-down')}
            disabled={isSubmitting}
            className={`h-8 w-8 p-0 ${
              selectedRating === 'thumbs-down'
                ? 'bg-accent text-accent-foreground'
                : ''
            }`}
            aria-label="Thumbs down"
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  // Default 'helpful' variant
  return (
    <Card className={`inline-flex items-center gap-3 px-4 py-2 ${className}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRating('helpful')}
          disabled={isSubmitting}
          className={`text-xs ${
            selectedRating === 'helpful'
              ? 'bg-accent text-accent-foreground'
              : ''
          }`}
        >
          Yes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRating('not-helpful')}
          disabled={isSubmitting}
          className={`text-xs ${
            selectedRating === 'not-helpful'
              ? 'bg-accent text-accent-foreground'
              : ''
          }`}
        >
          No
        </Button>
      </div>
    </Card>
  );
}
