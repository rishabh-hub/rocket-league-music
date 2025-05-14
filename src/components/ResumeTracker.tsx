// components/resume-tracker.tsx
'use client';

import { useResumeTracking } from '@/hooks/useResumeTracking';

export default function ResumeTracker() {
  useResumeTracking();
  // This component doesn't render anything
  return null;
}
