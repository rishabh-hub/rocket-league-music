// ABOUTME: API endpoint to track and notify when someone visits the app from a resume link.
// ABOUTME: Sends an email notification with visitor details (IP, user agent, referrer).
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL;

function escapeHtml(str: string | undefined | null): string {
  if (!str) return 'Not available';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST() {
  try {
    if (!NOTIFICATION_EMAIL) {
      console.error('NOTIFICATION_EMAIL environment variable is not set');
      return NextResponse.json(
        { error: 'Notification email not configured' },
        { status: 500 }
      );
    }

    const cookieStore = cookies();
    const visitorDataCookie = (await cookieStore).get('resume_visitor_data');

    // Get the visitor data from the cookie
    const visitorData = visitorDataCookie
      ? JSON.parse(visitorDataCookie.value)
      : { timestamp: new Date().toISOString() };

    // Check if user is authenticated
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Add user email if they're logged in
    if (session?.user) {
      visitorData.loggedIn = true;
      visitorData.email = session.user.email;
    }

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: NOTIFICATION_EMAIL,
      subject:
        'Resume Link Visit' + (visitorData.email ? ' - User Logged In' : ''),
      html: `
        <h1>Someone visited your app from your resume!</h1>
        <p><strong>Time:</strong> ${escapeHtml(new Date(visitorData.timestamp).toLocaleString())}</p>
        <p><strong>IP Address:</strong> ${escapeHtml(visitorData.ip)}</p>
        <p><strong>User Agent:</strong> ${escapeHtml(visitorData.userAgent)}</p>
        <p><strong>Referrer:</strong> ${escapeHtml(visitorData.referrer)}</p>
        <p><strong>Path:</strong> ${escapeHtml(visitorData.path || '/')}</p>
        ${visitorData.loggedIn ? `<p><strong>User Email:</strong> ${escapeHtml(visitorData.email)}</p>` : '<p><strong>Login Status:</strong> Not logged in</p>'}
      `,
    });

    // Clear the tracking cookie as we've now sent the notification
    (
      await // Clear the tracking cookie as we've now sent the notification
      cookieStore
    ).set('resume_visitor_data', '', { maxAge: 0 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send resume visit notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
