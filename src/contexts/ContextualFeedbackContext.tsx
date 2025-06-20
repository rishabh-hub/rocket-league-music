// ABOUTME: React Context to provide single source of truth for contextual feedback state
// ABOUTME: Prevents multiple hook instances creating conflicting states across components

'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useContextualFeedback } from '@/hooks/useContextualFeedback';

type ContextualFeedbackContextType = ReturnType<typeof useContextualFeedback>;

const ContextualFeedbackContext =
  createContext<ContextualFeedbackContextType | null>(null);

export function ContextualFeedbackProvider({
  children,
}: {
  children: ReactNode;
}) {
  const contextualFeedbackState = useContextualFeedback();

  return (
    <ContextualFeedbackContext.Provider value={contextualFeedbackState}>
      {children}
    </ContextualFeedbackContext.Provider>
  );
}

export function useContextualFeedbackContext() {
  const context = useContext(ContextualFeedbackContext);
  if (!context) {
    throw new Error(
      'useContextualFeedbackContext must be used within a ContextualFeedbackProvider'
    );
  }
  return context;
}
