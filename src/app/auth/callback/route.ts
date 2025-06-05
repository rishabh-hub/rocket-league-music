import { NextResponse } from 'next/server';

// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

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
