// ABOUTME: OAuth callback handler for Supabase authentication.
// ABOUTME: Exchanges auth code for session and redirects user to intended destination.
import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

function isValidRedirectPath(path: string): boolean {
  if (!path || typeof path !== 'string') return false;
  if (path.includes('//')) return false;
  if (path.includes('://')) return false;
  if (path.includes('..')) return false;
  if (!path.startsWith('/')) return false;
  return true;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  const next = nextParam && isValidRedirectPath(nextParam) ? nextParam : '/';

  console.log(`########## NEXT IS ${next} ${origin} ###########`);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Add a query parameter to signal successful authentication to client-side
      const redirectUrl = new URL(next, origin);
      redirectUrl.searchParams.set('auth_success', 'true');

      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(redirectUrl.toString());
      } else if (forwardedHost) {
        redirectUrl.hostname = forwardedHost;
        redirectUrl.protocol = 'https:';
        return NextResponse.redirect(redirectUrl.toString());
      } else {
        return NextResponse.redirect(redirectUrl.toString());
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
