// app/api/get-replay-url/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get file path from query parameters
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { message: 'File path is required' },
        { status: 400 }
      );
    }

    // Check if the file belongs to the user (security check)
    // The file path should start with the user's ID
    if (!filePath.startsWith(user.id + '/')) {
      return NextResponse.json(
        { message: 'Access denied to this file' },
        { status: 403 }
      );
    }

    // Generate a signed URL that expires in 60 minutes
    const { data: signedUrl, error } = await supabase.storage
      .from('replays')
      .createSignedUrl(filePath, 60 * 60);

    if (error || !signedUrl?.signedUrl) {
      return NextResponse.json(
        { message: 'Error generating file access URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: signedUrl.signedUrl,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  } catch (error: unknown) {
    console.error('Error generating signed URL:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
