// ABOUTME: Contextual feedback prompt component that appears at perfect moments
// ABOUTME: Non-intrusive, dismissible, and leads to full feedback or quick feedback options

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  X,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
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

  const getContextIcon = (context: FeedbackContext) => {
    switch (context) {
      case 'replay-upload-success':
        return '🎉';
      case 'music-recommendations-viewed':
        return '🎵';
      case 'replay-stats-engagement':
        return '📊';
      case 'spotify-integration-used':
        return '🎧';
      case 'error-recovery':
        return '💪';
      case 'page-engagement':
        return '✨';
      default:
        return '💭';
    }
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
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={`fixed bottom-20 right-6 z-40 ${className}`}
        >
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 shadow-lg">
            <CardContent className="flex items-center gap-3 py-3 px-4">
              <div className="text-lg">{getContextIcon(context)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Thanks for your feedback!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Your input helps us improve ReplayRhythms
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className="h-6 w-6 text-green-600 dark:text-green-400"
              >
                <X className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`fixed bottom-20 right-6 z-40 ${className}`}
      >
        <Card className="w-80 shadow-xl border-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Context Icon */}
              <div className="text-2xl flex-shrink-0 mt-1">
                {getContextIcon(context)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                      Quick Feedback
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
                      Quick Rating
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenFullFeedback}
                      className="flex-1 text-xs"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Tell us more
                      <ArrowRight className="h-3 w-3 ml-1" />
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
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQuickOptions(false)}
                        className="flex-1 text-xs"
                      >
                        Back
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenFullFeedback}
                        className="flex-1 text-xs"
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        More details
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
