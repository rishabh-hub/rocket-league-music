// ABOUTME: Mounts the resume-visitor tracking hook at the app root.
// ABOUTME: Renders nothing; exists so the hook runs on every route.

'use client';

import { useResumeTracking } from '@/hooks/useResumeTracking';

export default function ResumeTracker() {
  useResumeTracking();
  // This component doesn't render anything
  return null;
}
