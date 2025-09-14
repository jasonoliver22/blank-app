import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request) {
  try {
    const analysisData = await request.json();
    
    // Create a temporary file for the analysis data
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempDataFile = path.join(tempDir, `analysis-${Date.now()}.json`);
    fs.writeFileSync(tempDataFile, JSON.stringify(analysisData, null, 2));
    
    // Use absolute paths to avoid any resolution issues
    const videoDir = path.resolve(process.cwd(), '..', 'chatwrapped-video');
    
    // Instead of using the script, let's use the Remotion CLI directly
    const outputFile = path.join(videoDir, `chatwrapped-${Date.now()}.mp4`);
    
    return new Promise((resolve, reject) => {
      console.log('Starting video generation with Remotion CLI');
      
      // Use npx remotion render directly
      const child = spawn('npx', [
        'remotion', 
        'render', 
        'ChatWrapped', 
        outputFile,
        '--props', JSON.stringify({ analysisData })
      ], {
        cwd: videoDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      let errorOutput = '';
      
      child.stdout.on('data', (data) => {
        const text = data.toString();
        console.log('Video generation output:', text);
        output += text;
      });
      
      child.stderr.on('data', (data) => {
        const text = data.toString();
        console.log('Video generation error:', text);
        errorOutput += text;
      });
      
      child.on('close', (code) => {
        console.log('Video generation process closed with code:', code);
        
        // Clean up temp file
        try {
          fs.unlinkSync(tempDataFile);
        } catch (e) {
          console.warn('Could not delete temp file:', e.message);
        }
        
        if (code === 0) {
          if (fs.existsSync(outputFile)) {
            // Extract just the filename for the API route
            const filename = path.basename(outputFile);
            resolve(NextResponse.json({ 
              success: true, 
              videoPath: outputFile,
              filename: filename,
              message: 'Video generated successfully' 
            }));
          } else {
            console.error('Video file not found. Output:', output);
            reject(new Error('Video file not found after generation'));
          }
        } else {
          console.error('Video generation failed. Error output:', errorOutput);
          reject(new Error(`Video generation failed: ${errorOutput}`));
        }
      });
      
      child.on('error', (error) => {
        console.error('Failed to start video generation:', error);
        reject(new Error(`Failed to start video generation: ${error.message}`));
      });
    });
    
  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}