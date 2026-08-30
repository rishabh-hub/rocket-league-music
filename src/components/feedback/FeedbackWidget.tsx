// ABOUTME: Floating feedback widget with feedback type selection and form submission
// ABOUTME: Auto-shows once per month unless dismissed, accessible with keyboard navigation

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@vercel/analytics';
import { useContextualFeedbackContext } from '@/contexts/ContextualFeedbackContext';
import {
  MessageSquare,
  X,
  Bug,
  Lightbulb,
  Heart,
  Wrench,
  MessageCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type FeedbackType =
  | 'bug'
  | 'feature'
  | 'improvement'
  | 'appreciation'
  | 'general';

interface FeedbackWidgetProps {
  autoShowDelay?: number; // milliseconds
  className?: string;
}

// How long a dismissal keeps the widget from auto-showing again
const DISMISS_MEMORY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const DISMISSED_AT_KEY = 'feedback-dismissed-at';

const feedbackTypes = [
  {
    value: 'bug' as const,
    label: 'Bug',
    icon: Bug,
    description: "Something isn't working",
  },
  {
    value: 'feature' as const,
    label: 'Feature idea',
    icon: Lightbulb,
    description: 'Suggest a new feature',
  },
  {
    value: 'improvement' as const,
    label: 'Improvement',
    icon: Wrench,
    description: 'Something that could work better',
  },
  {
    value: 'appreciation' as const,
    label: 'Appreciation',
    icon: Heart,
    description: 'Say something nice',
  },
  {
    value: 'general' as const,
    label: 'Something else',
    icon: MessageCircle,
    description: 'Anything else',
  },
];

export function FeedbackWidget({
  autoShowDelay = 180000,
  className,
}: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showAutoPrompt, setShowAutoPrompt] = useState(false);
  const [selectedType, setSelectedType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAutoShown, setHasAutoShown] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  // Use shared context state
  const {
    shouldSuppressGlobalFeedback,
    shouldOpenFullFeedback,
    clearFullFeedbackTrigger,
  } = useContextualFeedbackContext();

  // Auto-show logic
  useEffect(() => {
    if (isDismissed || hasAutoShown) return;

    const dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY));
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_MEMORY_MS) return;

    const timer = setTimeout(() => {
      // Check if contextual feedback should suppress global auto-show
      if (shouldSuppressGlobalFeedback()) {
        // Don't show global feedback, but mark as shown to prevent retries
        setHasAutoShown(true);

        // Track suppression for analytics
        track('Feedback Widget Auto-Show Suppressed', {
          reason: 'contextual_feedback_active',
          delay: autoShowDelay,
          page: window.location.pathname,
        });
        return;
      }

      setShowAutoPrompt(true);
      setHasAutoShown(true);
      // Track auto-show event
      track('Feedback Widget Auto-Shown', {
        delay: autoShowDelay,
        page: window.location.pathname,
      });
    }, autoShowDelay);

    return () => clearTimeout(timer);
  }, [autoShowDelay, isDismissed, hasAutoShown, shouldSuppressGlobalFeedback]);

  // Listen for contextual feedback trigger to open full feedback
  useEffect(() => {
    if (shouldOpenFullFeedback) {
      // Map contextual context to feedback type
      const contextToFeedbackType = (context: string): FeedbackType => {
        switch (context) {
          case 'replay-upload-success':
          case 'replay-stats-engagement':
            return 'improvement';
          case 'music-recommendations-viewed':
          case 'spotify-integration-used':
            return 'feature';
          case 'error-recovery':
            return 'bug';
          case 'page-engagement':
          default:
            return 'general';
        }
      };

      // Set the appropriate feedback type based on context
      const feedbackType = contextToFeedbackType(
        shouldOpenFullFeedback.context
      );
      setSelectedType(feedbackType);

      // Open the widget
      setIsOpen(true);
      setShowAutoPrompt(false); // Don't show as auto-prompt

      // Clear the trigger
      clearFullFeedbackTrigger();

      // Track the opening from contextual trigger
      track('Feedback Widget Opened', {
        trigger: 'contextual',
        context: shouldOpenFullFeedback.context,
        prefilledType: feedbackType,
        page: window.location.pathname,
      });
    }
  }, [shouldOpenFullFeedback, clearFullFeedbackTrigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast({
        title: 'Write something first',
        variant: 'destructive',
      });
      return;
    }

    if (message.trim().length < 10) {
      toast({
        title: 'A bit more detail',
        description: 'Ten characters minimum.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedType,
          message: message.trim(),
          context: {
            page: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: 'Sign in required',
            description: 'Please sign in to submit feedback.',
            variant: 'destructive',
          });
          router.push('/login');
          return;
        }
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', response.status, errorData);

        // Handle validation errors specifically
        if (response.status === 400 && errorData.errors) {
          const validationErrors = errorData.errors
            .map((err: any) => err.message)
            .join(', ');
          toast({
            title: 'Check that again',
            description: validationErrors,
            variant: 'destructive',
          });
          return;
        }

        throw new Error(errorData.message || 'Failed to submit feedback');
      }

      toast({
        title: 'Got it. I read these myself.',
      });

      // Track successful submission
      track('Feedback Submitted', {
        type: selectedType,
        messageLength: message.trim().length,
        page: window.location.pathname,
        autoTriggered: showAutoPrompt,
      });

      // Reset form
      setMessage('');
      setSelectedType('general');
      setIsOpen(false);
      setShowAutoPrompt(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    // Track dismissal
    track('Feedback Widget Dismissed', {
      page: window.location.pathname,
      autoTriggered: showAutoPrompt,
    });

    localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    setIsDismissed(true);
    setShowAutoPrompt(false);
    setIsOpen(false);
  };

  if (!isOpen && !showAutoPrompt) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={() => {
            setIsOpen(true);
            track('Feedback Widget Opened', {
              trigger: 'manual',
              page: window.location.pathname,
            });
          }}
          size="icon"
          className="size-11 rounded-full border border-border bg-secondary text-secondary-foreground transition-colors duration-instant hover:bg-accent"
          aria-label="Send feedback"
        >
          <MessageSquare className="size-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Card className="w-[22rem] border-border shadow-2xl shadow-black/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Tell me something</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {showAutoPrompt && !isOpen && (
            <CardDescription className="text-primary">
              Found a bug, or something that should work differently?
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-type">What type of feedback?</Label>
              <Select
                value={selectedType}
                onValueChange={(value: FeedbackType) => setSelectedType(value)}
              >
                <SelectTrigger id="feedback-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {feedbackTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {type.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">Your message</Label>
              <Textarea
                id="feedback-message"
                placeholder="What happened, and what did you expect instead?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={2000}
                required
              />
              <div
                className={`text-xs text-right ${
                  message.length < 10
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {message.length}/2000{' '}
                {message.length < 10 ? '(minimum 10 characters)' : ''}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Sending…' : 'Send'}
              </Button>
              {showAutoPrompt && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAutoPrompt(false)}
                >
                  Not now
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
