// app/api/track-resume-visit/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFICATION_EMAIL =
  process.env.NOTIFICATION_EMAIL || 'rishabh.1056@gmail.com';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const visitorDataCookie = (await cookieStore).get('resume_visitor_data');

    // Get the visitor data from the cookie
    let visitorData = visitorDataCookie
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
        <p><strong>Time:</strong> ${new Date(visitorData.timestamp).toLocaleString()}</p>
        <p><strong>IP Address:</strong> ${visitorData.ip || 'Not available'}</p>
        <p><strong>User Agent:</strong> ${visitorData.userAgent || 'Not available'}</p>
        <p><strong>Referrer:</strong> ${visitorData.referrer || 'Not available'}</p>
        <p><strong>Path:</strong> ${visitorData.path || '/'}</p>
        ${visitorData.loggedIn ? `<p><strong>User Email:</strong> ${visitorData.email}</p>` : '<p><strong>Login Status:</strong> Not logged in</p>'}
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
