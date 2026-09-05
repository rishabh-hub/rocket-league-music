// ABOUTME: Floating feedback widget with feedback type selection and form submission
// ABOUTME: Auto-shows once per month unless dismissed, accessible with keyboard navigation

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@vercel/analytics';
import { useContextualFeedbackContext } from '@/contexts/ContextualFeedbackContext';
import { MessageSquare, X, Heart, Wrench, MessageCircle } from 'lucide-react';
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

type FeedbackType = 'improvement' | 'appreciation' | 'general';

interface FeedbackWidgetProps {
  autoShowDelay?: number; // milliseconds
  className?: string;
}

// How long a dismissal keeps the widget from auto-showing again
const DISMISS_MEMORY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const DISMISSED_AT_KEY = 'feedback-dismissed-at';

// A browser set to block site data, and a sandboxed iframe, throw on any
// localStorage access at all. Every read and write goes through these two
// guards so a storage failure can never escape into React's commit phase and
// take the page down with it.
function readDismissedAt(): number {
  try {
    return Number(localStorage.getItem(DISMISSED_AT_KEY));
  } catch {
    // Storage is unreadable, so treat this visitor as never having dismissed.
    return 0;
  }
}

function writeDismissedAt(timestamp: number) {
  try {
    localStorage.setItem(DISMISSED_AT_KEY, String(timestamp));
  } catch {
    // Storage is unwritable or full; the dismissal still holds for this session.
  }
}

// Three options, because nobody writing in wants to first decide whether their
// annoyance is a bug or an improvement — the message itself says which it is.
// The values are the ones the feedback API already accepts, so 'improvement'
// carries everything actionable.
const feedbackTypes = [
  {
    value: 'improvement' as const,
    label: 'Something to fix or add',
    icon: Wrench,
    placeholder: "What broke, or what's missing?",
  },
  {
    value: 'appreciation' as const,
    label: 'Something you liked',
    icon: Heart,
    placeholder: 'Which part?',
  },
  {
    value: 'general' as const,
    label: 'Something else',
    icon: MessageCircle,
    placeholder: 'Anything at all.',
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

    const dismissedAt = readDismissedAt();
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
          case 'music-recommendations-viewed':
          case 'spotify-integration-used':
          case 'error-recovery':
            return 'improvement';
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
            title: 'Sign in to send feedback',
            description: 'Taking you to the sign-in page.',
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
        title: "That didn't send",
        description: 'Try again in a moment.',
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

    writeDismissedAt(Date.now());
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
              This is a one-person project, so it is rough in places. Tell me
              where.
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-type">What&apos;s this about?</Label>
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
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0" />
                          {type.label}
                        </span>
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
                placeholder={
                  feedbackTypes.find((type) => type.value === selectedType)
                    ?.placeholder
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={2000}
                required
              />
              <div className="text-right text-xs text-muted-foreground">
                {message.length === 0
                  ? ''
                  : message.length < 10
                    ? '10 characters minimum'
                    : `${message.length}/2000`}
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
