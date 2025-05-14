// hooks/useResumeTracking.ts
import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export function useResumeTracking() {
  const supabase = createClient();

  useEffect(() => {
    // Check if this visitor came from the resume
    const checkResumeVisit = async () => {
      // Check for the from_resume cookie
      const fromResume = document.cookie.includes('from_resume=true');

      if (!fromResume) return;

      // Check if user is logged in
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // If the user is logged in, send the notification with their email
      if (session?.user) {
        try {
          await fetch('/api/track-resume-visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          // Clear the from_resume cookie to avoid duplicate notifications
          document.cookie = 'from_resume=; Max-Age=0; path=/; SameSite=Lax';
        } catch (error) {
          console.error('Failed to send notification:', error);
        }
      }
    };

    checkResumeVisit();

    // Also set up a listener for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        // If user just signed in, check if they came from resume
        const fromResume = document.cookie.includes('from_resume=true');

        if (fromResume) {
          // Send notification with their email
          try {
            await fetch('/api/track-resume-visit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            // Clear the from_resume cookie
            document.cookie = 'from_resume=; Max-Age=0; path=/; SameSite=Lax';
          } catch (error) {
            console.error('Failed to send notification:', error);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);
}
