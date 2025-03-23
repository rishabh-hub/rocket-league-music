import { type NextRequest } from 'next/server';

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
  return await updateSession(request);
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
