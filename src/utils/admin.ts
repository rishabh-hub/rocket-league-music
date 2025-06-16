// ABOUTME: Utility functions for admin authentication and authorization
// ABOUTME: Checks if user is admin based on email whitelist for now, can be extended later

import { createClient } from '@/utils/supabase/server';

// Admin email whitelist - can be moved to environment variables later
const ADMIN_EMAILS = [
  'rishabh.1056@gmail.com', // Doctor Biz's email
  // Add more admin emails here
];

export async function isUserAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return false;
    }

    return ADMIN_EMAILS.includes(user.email);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function requireAdmin() {
  const isAdmin = await isUserAdmin();
  if (!isAdmin) {
    throw new Error('Admin access required');
  }
}

export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error('Admin access required');
  }

  return user;
}
