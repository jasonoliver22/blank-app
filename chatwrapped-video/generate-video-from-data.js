#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { renderChatWrappedVideo } = require('./render-video');

// Function to convert your analysis data to the format expected by the video
function convertAnalysisData(analysisData) {
  return {
    totalConversations: analysisData.totalConversations,
    firstChat: analysisData.firstChat,
    lastChat: analysisData.lastChat,
    avgPerDay: analysisData.avgPerDay,
    longestBreak: analysisData.longestBreak,
    avgConversationLength: analysisData.avgConversationLength,
    peakHour: analysisData.peakHour,
    weekendCount: analysisData.weekendCount,
    weekdayCount: analysisData.weekdayCount,
    politenessScore: analysisData.politenessScore,
    mostActiveDay: analysisData.mostActiveDay,
    longestConversation: analysisData.longestConversation,
    longestStreak: analysisData.longestStreak,
    themes: analysisData.themes
  };
}

// Function to read analysis data from a JSON file
function readAnalysisData(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Error reading analysis data from ${filePath}:`, error.message);
    throw error;
  }
}

// Main function to generate video from analysis data
async function generateVideoFromData(analysisDataPath) {
  console.log('🎬 Generating ChatWrapped video from analysis data...');
  
  try {
    // Read the analysis data
    const analysisData = readAnalysisData(analysisDataPath);
    console.log('📊 Loaded analysis data:', {
      totalConversations: analysisData.totalConversations,
      avgPerDay: analysisData.avgPerDay,
      peakHour: analysisData.peakHour
    });

    // Convert to video format
    const videoData = convertAnalysisData(analysisData);
    
    // Render the video
    const outputPath = await renderChatWrappedVideo(videoData);
    
    console.log('🎉 Video generation complete!');
    console.log(`📁 Output file: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error('💥 Video generation failed:', error);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node generate-video-from-data.js <path-to-analysis-data.json>');
    console.log('Example: node generate-video-from-data.js ../analysis-data.json');
    process.exit(1);
  }
  
  const analysisDataPath = path.resolve(args[0]);
  
  if (!fs.existsSync(analysisDataPath)) {
    console.error(`❌ Analysis data file not found: ${analysisDataPath}`);
    process.exit(1);
  }
  
  generateVideoFromData(analysisDataPath)
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { generateVideoFromData, convertAnalysisData };
