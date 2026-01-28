// ABOUTME: Email OTP verification handler for Supabase authentication.
// ABOUTME: Verifies token hash and redirects user after successful confirmation.
import { type EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';

import { createClient } from '@/utils/supabase/server';

function isValidRedirectPath(path: string): boolean {
  if (!path || typeof path !== 'string') return false;
  if (path.includes('//')) return false;
  if (path.includes('://')) return false;
  if (path.includes('..')) return false;
  if (!path.startsWith('/')) return false;
  return true;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextParam = searchParams.get('next');
  const next = nextParam && isValidRedirectPath(nextParam) ? nextParam : '/';

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // redirect user to specified redirect URL or root of app
      redirect(next);
    }
  }

  // redirect the user to an error page with some instructions
  redirect('/error');
}
