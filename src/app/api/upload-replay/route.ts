// app/api/upload-replay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import FormData from 'form-data';

// Increase max duration for handling larger files and external API calls
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let tempFilePath = null;

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
    const visibility = (formData.get('visibility') as string) || 'public';

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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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
    const fileUrl = storageData?.path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/replays/${storageData.path}`
      : null;

    // Create a record in the replays table
    const { data: replayRecord, error: insertError } = await supabase
      .from('replays')
      .insert({
        user_id: user.id,
        file_name: file.name,
        storage_path: storageData?.path || filepath,
        status: 'uploaded',
        visibility,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { message: 'Failed to record upload in database' },
        { status: 500 }
      );
    }

    // For ballchasing upload, we need to save the file temporarily
    // to avoid issues with form-data in serverless environments
    const tempDir = os.tmpdir();
    const tempFileName = `${uuidv4()}-${sanitizedFileName}`;
    tempFilePath = path.join(tempDir, tempFileName);

    // Write the file to disk
    fs.writeFileSync(tempFilePath, buffer);

    // Start the ballchasing upload in the background
    // We're NOT awaiting this, so it won't block the response
    try {
      // Since we're in a serverless environment, we need to do this part
      // synchronously to ensure it runs before the function terminates

      // Update status to processing
      await supabase
        .from('replays')
        .update({ status: 'processing' })
        .eq('id', replayRecord.id);

      // Get ballchasing API key
      const ballchasingApiKey = process.env.BALLCHASING_API_KEY;
      if (!ballchasingApiKey) {
        throw new Error('Ballchasing API key not configured');
      }

      // Create FormData using the form-data package (Node.js compatible)
      const formData = new FormData();

      // Add the file from disk
      formData.append('file', fs.createReadStream(tempFilePath));

      // Upload to ballchasing.com
      const ballchasingResponse = await axios.post(
        `https://ballchasing.com/api/v2/upload?visibility=${visibility}`,
        formData,
        {
          headers: {
            Authorization: ballchasingApiKey,
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      let ballchasingId;

      if (
        ballchasingResponse.status === 201 ||
        ballchasingResponse.status === 409
      ) {
        // Successful upload or duplicate replay
        ballchasingId = ballchasingResponse.data.id;

        // Update the record with ballchasing ID
        await supabase
          .from('replays')
          .update({
            ballchasing_id: ballchasingId,
            // Keep status as "processing" - we'll check status when user views the replay
            status: 'processing',
          })
          .eq('id', replayRecord.id);
      } else {
        throw new Error(
          `Unexpected response from ballchasing.com: ${ballchasingResponse.status}`
        );
      }
    } catch (uploadError: any) {
      console.error('Error in ballchasing upload:', uploadError);

      // Update status to failed on error
      await supabase
        .from('replays')
        .update({
          status: 'failed',
          metrics: {
            error:
              uploadError.message || 'Unknown error during ballchasing upload',
          },
        })
        .eq('id', replayRecord.id);
    }

    // Return success response with file details
    return NextResponse.json({
      message: 'File uploaded successfully',
      fileName: file.name,
      fileSize: file.size,
      path: storageData?.path || null,
      url: fileUrl,
      replayId: replayRecord.id,
      status: 'uploaded',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    const errorMessage = error.message || 'Internal server error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  } finally {
    // Clean up the temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }
    }
  }
}
