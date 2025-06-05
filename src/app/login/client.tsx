'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function AuthSuccessHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const authSuccess = searchParams.get('auth_success');

    if (authSuccess === 'true') {
      // Remove the query parameter and refresh the page to update server-side state
      const url = new URL(window.location.href);
      url.searchParams.delete('auth_success');

      // Force a full page refresh to ensure server-side rendering picks up the new auth state
      window.location.replace(url.toString());
    }
  }, [searchParams, router]);

  return null;
}
