// app/api/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';

// const PYTHON_API_URL = 'https://replay-rythms-recs.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.player_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: player_id' },
        { status: 400 }
      );
    }

    // Forward the request to your Python API
    const response = await fetch(`${process.env.PYTHON_API_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player_id: body.player_id,
        replay_data: body.replay_data || null,
        top_n: body.top_n || 5,
      }),
    });

    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Python API error (${response.status}):`, errorText);

      return NextResponse.json(
        {
          success: false,
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the response from Python API
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to Python API:', error);

    // Handle network errors (like if Render service is sleeping)
    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Unable to connect to recommendation service. The service may be starting up - please try again in a moment.',
          technical_error: error.message,
        },
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        technical_error:
          error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId =
      searchParams.get('player_id') || 'ce45140fcd644755b01660aa2dc6977b';
    const topN = searchParams.get('top_n') || '5';

    // Forward the request to your Python API test endpoint
    const response = await fetch(
      `${process.env.PYTHON_API_URL}/recommend/test?player_id=${playerId}&top_n=${topN}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Python API error (${response.status}):`, errorText);

      return NextResponse.json(
        {
          success: false,
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to Python API (GET):', error);

    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Unable to connect to recommendation service. The service may be starting up - please try again in a moment.',
          technical_error: error.message,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        technical_error:
          error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
