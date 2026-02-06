// ABOUTME: Spotify authentication utility for obtaining access tokens.
// ABOUTME: Uses Client Credentials flow for accessing public Spotify data.

export interface SpotifyAuthResponse {
  access_token: string;
  expires_in: number;
}

/**
 * Obtains a Spotify access token using the Client Credentials flow.
 * This is suitable for accessing public data only (not user-specific data).
 *
 * @throws Error if Spotify credentials are not configured or auth fails
 */
export async function getSpotifyAccessToken(): Promise<SpotifyAuthResponse> {
  const client_id = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  console.log('Spotify Auth - Client ID exists:', !!client_id);
  console.log('Spotify Auth - Client Secret exists:', !!client_secret);

  if (!client_id || !client_secret) {
    console.error('Missing Spotify credentials:', {
      client_id: !!client_id,
      client_secret: !!client_secret,
    });
    throw new Error('Spotify credentials not configured');
  }

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

  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  };
}
