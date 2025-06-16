// ABOUTME: Floating feedback widget with feedback type selection and form submission
// ABOUTME: Auto-shows after 30 seconds, supports dark/light mode, accessible with keyboard navigation

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

const feedbackTypes = [
  {
    value: 'bug' as const,
    label: 'Bug Report',
    icon: Bug,
    description: "Something isn't working",
  },
  {
    value: 'feature' as const,
    label: 'Feature Request',
    icon: Lightbulb,
    description: 'Suggest a new feature',
  },
  {
    value: 'improvement' as const,
    label: 'Improvement',
    icon: Wrench,
    description: 'How we can do better',
  },
  {
    value: 'appreciation' as const,
    label: 'Appreciation',
    icon: Heart,
    description: 'Share some love',
  },
  {
    value: 'general' as const,
    label: 'General Feedback',
    icon: MessageCircle,
    description: 'Other thoughts',
  },
];

export function FeedbackWidget({
  autoShowDelay = 30000,
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

  // Auto-show logic
  useEffect(() => {
    if (isDismissed || hasAutoShown) return;

    const timer = setTimeout(() => {
      setShowAutoPrompt(true);
      setHasAutoShown(true);
    }, autoShowDelay);

    return () => clearTimeout(timer);
  }, [autoShowDelay, isDismissed, hasAutoShown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast({
        title: 'Message required',
        description: 'Please enter your feedback message.',
        variant: 'destructive',
      });
      return;
    }

    if (message.trim().length < 10) {
      toast({
        title: 'Message too short',
        description: 'Please enter at least 10 characters for your feedback.',
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
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', response.status, errorData);
        
        // Handle validation errors specifically
        if (response.status === 400 && errorData.errors) {
          const validationErrors = errorData.errors.map((err: any) => err.message).join(', ');
          toast({
            title: 'Validation Error',
            description: validationErrors,
            variant: 'destructive',
          });
          return;
        }
        
        throw new Error(errorData.message || 'Failed to submit feedback');
      }

      toast({
        title: 'Feedback submitted!',
        description: "Thank you for your feedback. We'll review it soon.",
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
    setIsDismissed(true);
    setShowAutoPrompt(false);
    setIsOpen(false);
  };

  const selectedTypeData = feedbackTypes.find(
    (type) => type.value === selectedType
  );

  if (!isOpen && !showAutoPrompt) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full shadow-lg hover:scale-105 transition-transform"
          aria-label="Open feedback widget"
        >
          <MessageSquare className="h-5 w-5 mr-2" />
          Feedback
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Card className="w-96 shadow-xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Share Feedback</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8"
              aria-label="Close feedback widget"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {showAutoPrompt && !isOpen && (
            <CardDescription className="text-primary">
              How's your experience so far? Let us know!
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
                placeholder={`Tell us about your ${selectedTypeData?.label.toLowerCase()}...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={2000}
                required
              />
              <div className={`text-xs text-right ${
                message.length < 10 
                  ? 'text-red-500 dark:text-red-400' 
                  : 'text-muted-foreground'
              }`}>
                {message.length}/2000 {message.length < 10 ? '(minimum 10 characters)' : ''}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Submitting...' : 'Send Feedback'}
              </Button>
              {showAutoPrompt && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAutoPrompt(false)}
                >
                  Maybe Later
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
