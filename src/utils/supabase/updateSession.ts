import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = await NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get the current URL path
  const path = request.nextUrl.pathname;

  // THIS IS THE KEY FIX - be very careful with this logic

  // Define public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/auth/callback',
    '/auth/auth-code-error',
    '/error',
    '/showcase',
  ];

  // Check if the current path is in the public paths
  const isPublicPath = publicPaths.some(
    (pp) => path === pp || path.startsWith(pp)
  );

  // Very important - exclude the root path '/' from all checks to break the infinite loop
  if (path === '/') {
    // Allow access to home page regardless of auth status
    return supabaseResponse;
  }

  // Check if this is a replay route and if the replay is public
  const replayMatch = path.match(/^\/replays\/([^\/]+)$/);
  if (replayMatch && !user) {
    const replayId = replayMatch[1];
    
    try {
      // Check if this replay is public
      const { data: replay, error } = await supabase
        .from('replays')
        .select('visibility')
        .eq('id', replayId)
        .single();

      console.log(`Middleware check for replay ${replayId}:`, { replay, error });

      if (!error && replay?.visibility === 'public') {
        console.log(`Allowing unauthenticated access to public replay: ${replayId}`);
        // Allow access to public replays even without authentication
        return supabaseResponse;
      }
      
      if (error) {
        console.log(`Error checking replay ${replayId}:`, error);
        // If replay doesn't exist, let the API handle the 404
        if (error.code === 'PGRST116') {
          console.log(`Replay ${replayId} not found, allowing API to handle 404`);
          return supabaseResponse;
        }
      }
    } catch (error) {
      // If there's an error checking the replay, fall through to normal auth check
      console.error('Error checking replay visibility:', error);
    }
  }

  if (
    !user &&
    !isPublicPath
    // !request.nextUrl.pathname.startsWith('/') && // undo later
    // !request.nextUrl.pathname.startsWith('/login') &&
    // !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    // const url = request.nextUrl.clone();
    // url.pathname = '/login'; // undo later
    // url.pathname = '/';
    return NextResponse.redirect(new URL('/login', request.url));

    // return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access login page
  // If user is logged in and trying to access login page, redirect to home
  if (user && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!
  return supabaseResponse;
}
