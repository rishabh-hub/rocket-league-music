// ABOUTME: Client component wrapper that lazy-loads FeedbackWidget with ssr: false.
// ABOUTME: Required because next/dynamic ssr:false is only valid in Client Components.
'use client';

import dynamic from 'next/dynamic';

const FeedbackWidget = dynamic(
  () => import('@/components/feedback/FeedbackWidget').then(m => ({ default: m.FeedbackWidget })),
  { ssr: false }
);

export function FeedbackWidgetLazy() {
  return <FeedbackWidget />;
}
