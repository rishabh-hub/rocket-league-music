// ABOUTME: Contextual feedback prompt shown after a replay uploads, recommendations load, or an error clears.
// ABOUTME: Non-intrusive, dismissible, and leads to full feedback or quick feedback options

'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, MessageCircle, X, ThumbsUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FeedbackContext } from '@/hooks/useContextualFeedback';
import { useContextualFeedbackContext } from '@/contexts/ContextualFeedbackContext';
import { QuickFeedback } from './QuickFeedback';

interface ContextualPromptProps {
  context: FeedbackContext;
  message: string;
  onDismiss: () => void;
  onOpenFullFeedback: () => void;
  onQuickFeedback?: (
    rating: 'helpful' | 'not-helpful' | 'thumbs-up' | 'thumbs-down'
  ) => void;
  className?: string;
}

export function ContextualPrompt({
  context,
  message,
  onDismiss,
  onOpenFullFeedback,
  onQuickFeedback,
  className = '',
}: ContextualPromptProps) {
  const [showQuickOptions, setShowQuickOptions] = useState(false);
  const [isQuickSubmitted, setIsQuickSubmitted] = useState(false);

  // Get hook to trigger full feedback
  const { triggerFullFeedback } = useContextualFeedbackContext();

  const handleOpenFullFeedback = () => {
    // Trigger the global feedback widget to open
    triggerFullFeedback(context);
    // Also call the original callback to dismiss this prompt
    onOpenFullFeedback();
  };

  const handleQuickFeedback = (
    rating: 'helpful' | 'not-helpful' | 'thumbs-up' | 'thumbs-down'
  ) => {
    setIsQuickSubmitted(true);
    onQuickFeedback?.(rating);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      onDismiss();
    }, 3000);
  };

  const getQuickFeedbackVariant = (
    context: FeedbackContext
  ): 'helpful' | 'thumbs' => {
    switch (context) {
      case 'music-recommendations-viewed':
      case 'spotify-integration-used':
        return 'thumbs';
      default:
        return 'helpful';
    }
  };

  if (isQuickSubmitted) {
    return (
      <motion.div
        key="submitted"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`fixed bottom-[5.5rem] right-6 z-40 ${className}`}
      >
        <Card className="border-border bg-popover/95 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <Check className="h-4 w-4 shrink-0 text-primary" />
            <p className="flex-1 text-sm text-muted-foreground">
              Got it. I read these myself.
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="prompt"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`fixed bottom-[5.5rem] right-6 z-40 ${className}`}
    >
      <Card className="w-80 border-border bg-popover/95 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Two seconds?
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDismiss}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <p className="text-sm text-foreground mb-3 leading-relaxed">
                {message}
              </p>

              {!showQuickOptions ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setShowQuickOptions(true)}
                    className="flex-1 text-xs"
                  >
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Rate it
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenFullFeedback}
                    className="flex-1 text-xs"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Write a note
                  </Button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.2 }}
                >
                  <QuickFeedback
                    context={context}
                    label=""
                    variant={getQuickFeedbackVariant(context)}
                    onFeedbackSubmitted={handleQuickFeedback}
                    className="w-full justify-center"
                  />
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
