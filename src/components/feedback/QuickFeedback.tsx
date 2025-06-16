// ABOUTME: Quick thumbs up/down feedback component for contextual placement
// ABOUTME: Supports anonymous users and provides immediate feedback confirmation

'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
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
  label = 'Was this helpful?',
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

      // Show success message briefly
      toast({
        title: 'Thanks for your feedback!',
        description: 'Your input helps us improve.',
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
        className={`inline-flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 ${className}`}
      >
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        <span className="text-sm text-green-700 dark:text-green-300">
          Thanks for your feedback!
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
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                : 'hover:bg-green-50 dark:hover:bg-green-950'
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
                ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                : 'hover:bg-red-50 dark:hover:bg-red-950'
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
              ? 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
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
              ? 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
              : ''
          }`}
        >
          No
        </Button>
      </div>
    </Card>
  );
}
