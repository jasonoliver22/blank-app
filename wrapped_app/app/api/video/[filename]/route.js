import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const { filename } = params;
    
    // Security check - only allow .mp4 files
    if (!filename.endsWith('.mp4')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    
    // Path to the video file in the chatwrapped-video directory
    const videoPath = path.join(process.cwd(), '..', 'chatwrapped-video', filename);
    
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    // Read the video file
    const videoBuffer = fs.readFileSync(videoPath);
    
    // Return the video file
    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
    
  } catch (error) {
    console.error('Video serving error:', error);
    return NextResponse.json(
      { error: 'Failed to serve video' },
      { status: 500 }
    );
  }
}
