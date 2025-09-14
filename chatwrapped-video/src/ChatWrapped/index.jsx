import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { Title } from "./Title";
import { OverviewStats } from "./OverviewStats";
import { ChatPatterns } from "./ChatPatterns";
import { ChatThemes } from "./ChatThemes";
import { Timeline } from "./Timeline";
import { Outro } from "./Outro";

export const ChatWrapped = ({ analysisData }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Define timing for each section (in frames)
  const titleDuration = 3 * fps; // 3 seconds
  const overviewDuration = 4 * fps; // 4 seconds
  const patternsDuration = 4 * fps; // 4 seconds
  const themesDuration = 3 * fps; // 3 seconds
  const timelineDuration = 3 * fps; // 3 seconds
  const outroDuration = 2 * fps; // 2 seconds

  const totalDuration = titleDuration + overviewDuration + patternsDuration + themesDuration + timelineDuration + outroDuration;

  // Calculate which section we're currently in
  let currentSection = "title";
  let sectionFrame = frame;

  if (frame >= titleDuration) {
    currentSection = "overview";
    sectionFrame = frame - titleDuration;
  }
  if (frame >= titleDuration + overviewDuration) {
    currentSection = "patterns";
    sectionFrame = frame - titleDuration - overviewDuration;
  }
  if (frame >= titleDuration + overviewDuration + patternsDuration) {
    currentSection = "themes";
    sectionFrame = frame - titleDuration - overviewDuration - patternsDuration;
  }
  if (frame >= titleDuration + overviewDuration + patternsDuration + themesDuration) {
    currentSection = "timeline";
    sectionFrame = frame - titleDuration - overviewDuration - patternsDuration - themesDuration;
  }
  if (frame >= titleDuration + overviewDuration + patternsDuration + themesDuration + timelineDuration) {
    currentSection = "outro";
    sectionFrame = frame - titleDuration - overviewDuration - patternsDuration - themesDuration - timelineDuration;
  }

  // Background gradient animation
  const backgroundOpacity = interpolate(frame, [0, 30], [0, 1], {
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, 
          rgba(59, 130, 246, ${backgroundOpacity * 0.1}) 0%, 
          rgba(147, 51, 234, ${backgroundOpacity * 0.1}) 100%)`,
      }}
    >
      {currentSection === "title" && (
        <Title frame={sectionFrame} duration={titleDuration} />
      )}
      {currentSection === "overview" && (
        <OverviewStats 
          frame={sectionFrame} 
          duration={overviewDuration} 
          data={analysisData} 
        />
      )}
      {currentSection === "patterns" && (
        <ChatPatterns 
          frame={sectionFrame} 
          duration={patternsDuration} 
          data={analysisData} 
        />
      )}
      {currentSection === "themes" && (
        <ChatThemes 
          frame={sectionFrame} 
          duration={themesDuration} 
          data={analysisData} 
        />
      )}
      {currentSection === "timeline" && (
        <Timeline 
          frame={sectionFrame} 
          duration={timelineDuration} 
          data={analysisData} 
        />
      )}
      {currentSection === "outro" && (
        <Outro frame={sectionFrame} duration={outroDuration} />
      )}
    </AbsoluteFill>
  );
};
