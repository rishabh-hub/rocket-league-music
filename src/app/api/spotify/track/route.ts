// app/api/spotify/track/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('id');
    const spotifyUrl = searchParams.get('url');

    if (!trackId && !spotifyUrl) {
      return NextResponse.json(
        { error: 'Track ID or Spotify URL required' },
        { status: 400 }
      );
    }

    // Extract track ID from Spotify URL if provided
    let finalTrackId = trackId;
    if (spotifyUrl && !trackId) {
      const match = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/);
      if (match) {
        finalTrackId = match[1];
      }
    }

    if (!finalTrackId) {
      return NextResponse.json(
        { error: 'Invalid track ID or URL' },
        { status: 400 }
      );
    }

    // Get Spotify access token - construct the URL properly
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:3000');

    const authResponse = await fetch(`${baseUrl}/api/spotify/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Auth response error:', errorText);
      throw new Error(`Failed to get Spotify token: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    const { access_token } = authData;

    // Fetch track data from Spotify
    const trackResponse = await fetch(
      `https://api.spotify.com/v1/tracks/${finalTrackId}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!trackResponse.ok) {
      if (trackResponse.status === 404) {
        return NextResponse.json({ error: 'Track not found' }, { status: 404 });
      }
      throw new Error(`Spotify API error: ${trackResponse.status}`);
    }

    const trackData = await trackResponse.json();

    // Return formatted track data
    return NextResponse.json({
      id: trackData.id,
      name: trackData.name,
      artists: trackData.artists.map((artist: any) => artist.name),
      album: {
        name: trackData.album.name,
        images: trackData.album.images,
      },
      preview_url: trackData.preview_url, // 30-second preview (free tier)
      duration_ms: trackData.duration_ms,
      external_urls: trackData.external_urls,
      popularity: trackData.popularity,
    });
  } catch (error) {
    console.error('Spotify track error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch track data' },
      { status: 500 }
    );
  }
}
