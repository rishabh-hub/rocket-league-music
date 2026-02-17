import { type NextRequest, NextResponse } from 'next/server';

import { updateSession } from './utils/supabase/updateSession';

export async function middleware(request: NextRequest) {
  // const response = paraglide(request);
  // const response = await updateSession(request);
  // // Get the pathname from the URL
  // const { pathname } = request.nextUrl;

  // // Get user from Supabase auth
  // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  // const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // const authCookie = request.cookies.get('sb-auth-token')?.value;

  // // Check if user is authenticated
  // const isAuthenticated = !!authCookie;

  // // Define public routes that don't require authentication
  // const publicRoutes = ['/login', '/auth/callback', '/error'];
  // const isPublicRoute = publicRoutes.some((route) =>
  //   pathname.startsWith(route)
  // );

  // // If the user is not authenticated and the route is not public, redirect to login
  // if (!isAuthenticated && !isPublicRoute && pathname !== '/_next/static') {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  // // If the user is authenticated and the route is login, redirect to home
  // if (isAuthenticated && pathname === '/login') {
  //   return NextResponse.redirect(new URL('/', request.url));
  // }
  // return response;
  // Check if the request has the resume query parameter
  const { searchParams } = request.nextUrl;
  const isFromResume = searchParams.get('source') === 'resume';

  // Create response by first running the normal session update
  const response = await updateSession(request);
  // If the visitor came from the resume, set a cookie to track this
  if (isFromResume && !request.cookies.has('from_resume')) {
    // Set a cookie to remember this user came from resume
    response.cookies.set('from_resume', 'true', {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      sameSite: 'lax',
    });

    // Collect basic metadata (without user email yet)
    const metadata = {
      ip: request.headers.get('x-forwarded-for') || 'Unknown',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      referrer: request.headers.get('referer') || 'Direct',
      path: request.nextUrl.pathname,
      timestamp: new Date().toISOString(),
      loggedIn: false, // Will be updated later if they log in
      email: null,
    };

    // Store metadata in a cookie for later use
    // We need to serialize it as cookies have size limits
    response.cookies.set('resume_visitor_data', JSON.stringify(metadata), {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      sameSite: 'lax',
    });
  }

  return response;
  // return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|llms.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
