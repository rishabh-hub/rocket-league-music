// app/api/upload-replay/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    if (!file.name.toLowerCase().endsWith('.replay')) {
      return NextResponse.json(
        { message: 'Only Rocket League replay files (.replay) are accepted' },
        { status: 400 }
      );
    }

    // Generate a unique filename to prevent overwriting existing files
    // Format: userId/timestamp-originalfilename.replay
    const timestamp = new Date().getTime();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filepath = `${user.id}/${timestamp}-${sanitizedFileName}`;

    // Convert file to buffer for further processing
    const buffer = await file.arrayBuffer();

    // This is where you would integrate with ballchasing APIs
    // For now, we'll just return a success response

    // Upload to Supabase storage
    const { data: storageData, error } = await supabase.storage
      .from('replays')
      .upload(filepath, buffer, {
        contentType: 'application/octet-stream',
        upsert: true, // Set to true to overwrite if a file with the same path exists
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return NextResponse.json(
        { message: 'Failed to store file' },
        { status: 500 }
      );
    }

    // Generate the public URL for the file (if bucket is public)
    // If your bucket is private, consider creating a signed URL instead
    const fileUrl = storageData?.path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/replays/${storageData.path}`
      : null;

    // Return success response with file details
    return NextResponse.json({
      message: 'File uploaded successfully',
      fileName: file.name,
      fileSize: file.size,
      path: storageData?.path || null,
      url: fileUrl,
    });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
