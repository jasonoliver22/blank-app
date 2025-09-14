import React from "react";
import { AbsoluteFill, interpolate, Easing } from "remotion";

export const Title = ({ frame, duration }) => {
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    easing: Easing.out(Easing.quad),
  });

  const titleScale = interpolate(frame, [0, 30], [0.8, 1], {
    easing: Easing.out(Easing.back(1.2)),
  });

  const subtitleOpacity = interpolate(frame, [30, 60], [0, 1], {
    easing: Easing.out(Easing.quad),
  });

  const emojiScale = interpolate(frame, [0, 45], [0, 1], {
    easing: Easing.out(Easing.elastic(1)),
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 120,
          marginBottom: 20,
          transform: `scale(${emojiScale})`,
        }}
      >
        🎁
      </div>
      
      <div
        style={{
          fontSize: 80,
          fontWeight: "bold",
          color: "#1f2937",
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        ChatWrapped
      </div>
      
      <div
        style={{
          fontSize: 32,
          color: "#6b7280",
          opacity: subtitleOpacity,
          textAlign: "center",
          maxWidth: 800,
          lineHeight: 1.4,
        }}
      >
        Your 2025 Chat Analytics
      </div>
    </AbsoluteFill>
  );
};
