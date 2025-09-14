# ChatWrapped Video Generator

A Remotion-based video generator that creates animated videos from your ChatWrapped analytics data.

## Features

- 🎬 Animated video generation from chat analytics
- 📊 Beautiful stat visualizations with smooth animations
- 🎨 Modern UI with gradient backgrounds and smooth transitions
- ⚡ Easy integration with your existing ChatWrapped app
- 🎯 Multiple stat categories: Overview, Patterns, Themes, Timeline

## Quick Start

### 1. Preview the Video

```bash
npm run dev
```

This opens the Remotion Studio where you can preview and edit the video.

### 2. Render with Sample Data

```bash
npm run render
```

This renders a video using sample data to `chatwrapped-output.mp4`.

### 3. Render with Your Own Data

First, export your analysis data from your ChatWrapped app as JSON, then:

```bash
npm run render:custom path/to/your/analysis-data.json
```

## Video Structure

The video is 17 seconds long and includes:

1. **Title Screen** (3s) - Welcome animation with ChatWrapped branding
2. **Overview Stats** (4s) - Key metrics with animated counters
3. **Chat Patterns** (4s) - Usage patterns and timing data
4. **Chat Themes** (3s) - Top conversation themes
5. **Timeline** (3s) - Important dates and milestones
6. **Outro** (2s) - Thank you message

## Data Format

The video expects analysis data in this format:

```json
{
  "totalConversations": 247,
  "firstChat": "1/15/2025",
  "lastChat": "12/28/2025",
  "avgPerDay": 2.3,
  "longestBreak": 5.2,
  "avgConversationLength": 12.7,
  "peakHour": "2:00 PM",
  "weekendCount": 89,
  "weekdayCount": 158,
  "politenessScore": 4,
  "mostActiveDay": "Wed Dec 18 2025",
  "longestConversation": 45,
  "longestStreak": 12,
  "themes": "Top themes: coding (89), learning (67), work (45)"
}
```

## Integration with ChatWrapped App

To integrate with your existing ChatWrapped app:

1. Export the analysis data as JSON from your app
2. Use the `generate-video-from-data.js` script to create videos
3. Or modify your app to directly call the video generation functions

Example integration:

```javascript
const { generateVideoFromData } = require('./chatwrapped-video/generate-video-from-data');

// After analyzing conversations
const analysisData = analyzeConversations(conversations);
const videoPath = await generateVideoFromData(analysisData);
console.log('Video created:', videoPath);
```

## Customization

### Modifying Animations

Edit the individual component files in `src/ChatWrapped/` to customize:
- Animation timing and easing
- Colors and styling
- Layout and positioning
- Text and content

### Adding New Stats

1. Add new data fields to your analysis
2. Create new components or modify existing ones
3. Update the main video composition timing

### Changing Video Length

Modify the `durationInFrames` in `src/Root.jsx` and adjust section timings in `src/ChatWrapped/index.jsx`.

## Technical Details

- **Framework**: Remotion 4.0
- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 30 FPS
- **Codec**: H.264
- **Duration**: 17 seconds (510 frames)

## Troubleshooting

### Common Issues

1. **Missing dependencies**: Run `npm install` to ensure all packages are installed
2. **Render errors**: Check that your analysis data matches the expected format
3. **Performance**: Large datasets may take longer to render

### Getting Help

- Check the [Remotion documentation](https://www.remotion.dev/docs)
- Review the component files for animation examples
- Test with sample data first before using real data

## License

This project is part of your ChatWrapped application.