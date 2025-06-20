// ABOUTME: Hook for tracking user context and triggering contextual feedback prompts
// ABOUTME: Manages timing, frequency controls, and smart moment detection for feedback collection

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { track } from '@vercel/analytics';

export type FeedbackContext =
  | 'replay-upload-success'
  | 'music-recommendations-viewed'
  | 'replay-stats-engagement'
  | 'spotify-integration-used'
  | 'error-recovery'
  | 'page-engagement';

export interface ContextualTrigger {
  context: FeedbackContext;
  delayMs: number;
  message: string;
  maxPerSession: number;
  cooldownMs: number;
}

interface FeedbackSession {
  sessionId: string;
  startTime: number;
  triggers: Record<FeedbackContext, number>; // Count of triggers per context
  lastTriggerTime: Record<FeedbackContext, number>; // Last trigger timestamp
  dismissed: Set<FeedbackContext>; // Contexts dismissed this session
}

const DEFAULT_TRIGGERS: Record<FeedbackContext, ContextualTrigger> = {
  'replay-upload-success': {
    context: 'replay-upload-success',
    delayMs: 3000, // 3 seconds after upload success
    message: '🎉 Great! How was the upload experience?',
    maxPerSession: 1,
    cooldownMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  'music-recommendations-viewed': {
    context: 'music-recommendations-viewed',
    delayMs: 10000, // 10 seconds after viewing recommendations
    message: '🎵 What do you think of these music recommendations?',
    maxPerSession: 1,
    cooldownMs: 6 * 60 * 60 * 1000, // 6 hours
  },
  'replay-stats-engagement': {
    context: 'replay-stats-engagement',
    delayMs: 120000, // 2 minutes of viewing stats
    message: '📊 Found the replay analysis helpful? Let us know!',
    maxPerSession: 1,
    cooldownMs: 12 * 60 * 60 * 1000, // 12 hours
  },
  'spotify-integration-used': {
    context: 'spotify-integration-used',
    delayMs: 5000, // 5 seconds after using Spotify
    message: '🎧 How was the Spotify integration experience?',
    maxPerSession: 1,
    cooldownMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  'error-recovery': {
    context: 'error-recovery',
    delayMs: 8000, // 8 seconds after error recovery
    message: '💪 We noticed an issue earlier. How can we improve?',
    maxPerSession: 1,
    cooldownMs: 48 * 60 * 60 * 1000, // 48 hours
  },
  'page-engagement': {
    context: 'page-engagement',
    delayMs: 180000, // 3 minutes on page
    message: "✨ How's your experience with ReplayRhythms so far?",
    maxPerSession: 1,
    cooldownMs: 7 * 24 * 60 * 60 * 1000, // 1 week
  },
};

export function useContextualFeedback() {
  const [activePrompt, setActivePrompt] = useState<{
    context: FeedbackContext;
    message: string;
  } | null>(null);

  const [shouldOpenFullFeedback, setShouldOpenFullFeedback] = useState<{
    context: FeedbackContext;
    fromContextual: boolean;
  } | null>(null);

  const sessionRef = useRef<FeedbackSession | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pageStartTimeRef = useRef<number>(Date.now());

  // Initialize or restore session
  useEffect(() => {
    const sessionKey = 'contextual-feedback-session';
    const stored = sessionStorage.getItem(sessionKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        sessionRef.current = {
          ...parsed,
          dismissed: new Set(parsed.dismissed || []),
        };
      } catch {
        // Create new session if parsing fails
        sessionRef.current = createNewSession();
      }
    } else {
      sessionRef.current = createNewSession();
    }

    // Save session when component unmounts
    return () => {
      if (sessionRef.current) {
        const toSave = {
          ...sessionRef.current,
          dismissed: Array.from(sessionRef.current.dismissed),
        };
        sessionStorage.setItem(sessionKey, JSON.stringify(toSave));
      }
    };
  }, []);

  // Track page engagement time
  useEffect(() => {
    pageStartTimeRef.current = Date.now();

    // Set up page engagement trigger
    const engagementTimer = setTimeout(() => {
      triggerContextualFeedback('page-engagement');
    }, DEFAULT_TRIGGERS['page-engagement'].delayMs);

    return () => clearTimeout(engagementTimer);
  }, []);

  const createNewSession = (): FeedbackSession => ({
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    startTime: Date.now(),
    triggers: {} as Record<FeedbackContext, number>,
    lastTriggerTime: {} as Record<FeedbackContext, number>,
    dismissed: new Set(),
  });

  const shouldTrigger = useCallback(
    (context: FeedbackContext): boolean => {
      if (!sessionRef.current) return false;

      const session = sessionRef.current;
      const trigger = DEFAULT_TRIGGERS[context];
      const now = Date.now();

      // Check if context was dismissed this session
      if (session.dismissed.has(context)) {
        return false;
      }

      // Check max per session limit
      const triggerCount = session.triggers[context] || 0;
      if (triggerCount >= trigger.maxPerSession) {
        return false;
      }

      // Check cooldown period
      const lastTrigger = session.lastTriggerTime[context] || 0;
      if (now - lastTrigger < trigger.cooldownMs) {
        return false;
      }

      // Check if there's already an active prompt
      if (activePrompt) {
        return false;
      }

      return true;
    },
    [activePrompt]
  );

  const triggerContextualFeedback = useCallback(
    (context: FeedbackContext, customMessage?: string) => {
      if (!shouldTrigger(context) || !sessionRef.current) {
        return;
      }

      const trigger = DEFAULT_TRIGGERS[context];
      const session = sessionRef.current;

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout for the trigger
      timeoutRef.current = setTimeout(() => {
        // Double-check conditions haven't changed
        if (!shouldTrigger(context)) {
          return;
        }

        // Update session tracking
        session.triggers[context] = (session.triggers[context] || 0) + 1;
        session.lastTriggerTime[context] = Date.now();

        // Show the prompt
        setActivePrompt({
          context,
          message: customMessage || trigger.message,
        });

        // Track the event
        track('Contextual Feedback Triggered', {
          context: String(context),
          sessionId: session.sessionId,
          triggerCount: session.triggers[context],
          pageTime: Date.now() - pageStartTimeRef.current,
          page: window.location.pathname,
        });
      }, trigger.delayMs);
    },
    [shouldTrigger]
  );

  const dismissPrompt = useCallback(
    (context?: FeedbackContext) => {
      if (activePrompt && sessionRef.current) {
        const contextToDismiss = context || activePrompt.context;


        // Mark as dismissed for this session
        sessionRef.current.dismissed.add(contextToDismiss);

        // Track dismissal
        track('Contextual Feedback Dismissed', {
          context: String(contextToDismiss),
          sessionId: sessionRef.current.sessionId || 'unknown',
          page: window.location.pathname,
        });
      }

      setActivePrompt(null);

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    },
    [activePrompt]
  );

  const completePrompt = useCallback(
    (context?: FeedbackContext) => {
      if (activePrompt) {
        // Track completion
        track('Contextual Feedback Completed', {
          context: String(context || activePrompt.context),
          sessionId: sessionRef.current?.sessionId || 'unknown',
          page: window.location.pathname,
        });
      }

      setActivePrompt(null);

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    },
    [activePrompt]
  );

  // Specific trigger functions for common use cases
  const triggerReplayUploadSuccess = useCallback(() => {
    triggerContextualFeedback('replay-upload-success');
  }, [triggerContextualFeedback]);

  const triggerMusicRecommendationsViewed = useCallback(() => {
    triggerContextualFeedback('music-recommendations-viewed');
  }, [triggerContextualFeedback]);

  const triggerReplayStatsEngagement = useCallback(() => {
    triggerContextualFeedback('replay-stats-engagement');
  }, [triggerContextualFeedback]);

  const triggerSpotifyIntegrationUsed = useCallback(() => {
    triggerContextualFeedback('spotify-integration-used');
  }, [triggerContextualFeedback]);

  const triggerErrorRecovery = useCallback(() => {
    triggerContextualFeedback('error-recovery');
  }, [triggerContextualFeedback]);

  // Trigger full feedback widget to open
  const triggerFullFeedback = useCallback((context: FeedbackContext) => {
    setShouldOpenFullFeedback({
      context,
      fromContextual: true,
    });

    // Track the transition from contextual to full feedback
    track('Contextual Feedback Escalated to Full', {
      context: String(context),
      sessionId: sessionRef.current?.sessionId || 'unknown',
      page: window.location.pathname,
    });
  }, []);

  // Clear full feedback trigger (called by FeedbackWidget)
  const clearFullFeedbackTrigger = useCallback(() => {
    setShouldOpenFullFeedback(null);
  }, []);

  // Check if global feedback widget should be suppressed
  const shouldSuppressGlobalFeedback = useCallback(() => {
    if (!sessionRef.current) {
      return false;
    }

    // Suppress if there's an active contextual prompt
    if (activePrompt) {
      return true;
    }

    // Suppress if contextual feedback was triggered recently (within 5 minutes)
    const now = Date.now();
    const recentTriggerThreshold = 5 * 60 * 1000; // 5 minutes

    for (const context of Object.keys(
      sessionRef.current.lastTriggerTime
    ) as FeedbackContext[]) {
      const lastTrigger = sessionRef.current.lastTriggerTime[context];
      if (lastTrigger && now - lastTrigger < recentTriggerThreshold) {
        return true;
      }
    }

    return false;
  }, [activePrompt]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    activePrompt,
    shouldOpenFullFeedback,

    // Actions
    dismissPrompt,
    completePrompt,

    // Full feedback control
    triggerFullFeedback,
    clearFullFeedbackTrigger,

    // Specific triggers
    triggerReplayUploadSuccess,
    triggerMusicRecommendationsViewed,
    triggerReplayStatsEngagement,
    triggerSpotifyIntegrationUsed,
    triggerErrorRecovery,

    // Generic trigger (for custom contexts)
    triggerContextualFeedback,

    // Global feedback control
    shouldSuppressGlobalFeedback,

    // Session info
    sessionId: sessionRef.current?.sessionId,
  };
}
