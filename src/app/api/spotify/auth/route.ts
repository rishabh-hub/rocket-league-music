// app/api/spotify/auth/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const client_id = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

    console.log('Spotify Auth - Client ID exists:', !!client_id);
    console.log('Spotify Auth - Client Secret exists:', !!client_secret);

    if (!client_id || !client_secret) {
      console.error('Missing Spotify credentials:', {
        client_id: !!client_id,
        client_secret: !!client_secret,
      });
      return NextResponse.json(
        { error: 'Spotify credentials not configured' },
        { status: 500 }
      );
    }

    // Get access token using Client Credentials flow (for public data only)
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Spotify auth failed: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error('Spotify auth error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with Spotify' },
      { status: 500 }
    );
  }
}
