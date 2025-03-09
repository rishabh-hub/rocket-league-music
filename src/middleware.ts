import type { NextRequest } from 'next/server';

import { updateSession } from './utils/supabase/updateSession';

export async function middleware(request: NextRequest) {
  // const response = paraglide(request);
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
