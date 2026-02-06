// ABOUTME: API endpoint for obtaining Spotify access tokens.
// ABOUTME: Provides a REST interface to the shared Spotify auth utility.
import { NextResponse } from 'next/server';
import { getSpotifyAccessToken } from '@/lib/spotify';

export async function POST() {
  try {
    const authData = await getSpotifyAccessToken();

    return NextResponse.json({
      access_token: authData.access_token,
      expires_in: authData.expires_in,
    });
  } catch (error) {
    console.error('Spotify auth error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to authenticate with Spotify',
      },
      { status: 500 }
    );
  }
}
