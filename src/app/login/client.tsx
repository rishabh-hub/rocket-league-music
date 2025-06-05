'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export function LoginPageClient() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Check for authentication changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User just signed in, redirect to home and refresh the page
        router.push('/');
        router.refresh();
      }
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
