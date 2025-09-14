#!/usr/bin/env node

const { renderMedia, selectComposition } = require('@remotion/renderer');
const { bundle } = require('@remotion/bundler');
const path = require('path');

async function renderChatWrappedVideo(analysisData) {
  console.log('🎬 Starting ChatWrapped video render...');
  
  try {
    // Bundle the video
    console.log('📦 Bundling video...');
    const bundleLocation = await bundle({
      entryPoint: path.resolve(__dirname, 'src', 'index.js'),
      webpackOverride: (config) => config,
    });

    // Select the composition
    const compositions = await selectComposition({
      serveUrl: bundleLocation,
      id: 'ChatWrapped',
      inputProps: {
        analysisData: analysisData,
      },
    });

    // Render the video
    console.log('🎥 Rendering video...');
    const outputLocation = path.resolve(__dirname, 'chatwrapped-output.mp4');
    
    await renderMedia({
      composition: compositions,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputLocation,
      inputProps: {
        analysisData: analysisData,
      },
    });

    console.log(`✅ Video rendered successfully to: ${outputLocation}`);
    return outputLocation;
  } catch (error) {
    console.error('❌ Error rendering video:', error);
    throw error;
  }
}

// Export for use in other scripts
module.exports = { renderChatWrappedVideo };

// If run directly, use sample data
if (require.main === module) {
  const { sampleAnalysisData } = require('./src/sampleData');
  renderChatWrappedVideo(sampleAnalysisData)
    .then(() => {
      console.log('🎉 Render complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Render failed:', error);
      process.exit(1);
    });
}
