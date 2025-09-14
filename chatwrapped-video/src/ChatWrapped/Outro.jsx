import React from "react";
import { AbsoluteFill, interpolate, Easing } from "remotion";

export const Outro = ({ frame, duration }) => {
  const containerOpacity = interpolate(frame, [0, 20], [0, 1], {
    easing: Easing.out(Easing.quad),
  });

  const titleOpacity = interpolate(frame, [10, 30], [0, 1], {
    easing: Easing.out(Easing.quad),
  });

  const titleScale = interpolate(frame, [10, 30], [0.9, 1], {
    easing: Easing.out(Easing.back(1.1)),
  });

  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1], {
    easing: Easing.out(Easing.quad),
  });

  const emojiScale = interpolate(frame, [0, 30], [0, 1], {
    easing: Easing.out(Easing.elastic(1.2)),
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        opacity: containerOpacity,
      }}
    >
      <div
        style={{
          fontSize: 100,
          marginBottom: 30,
          transform: `scale(${emojiScale})`,
        }}
      >
        🎉
      </div>
      
      <div
        style={{
          fontSize: 64,
          fontWeight: "bold",
          color: "#1f2937",
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        Thanks for Chatting!
      </div>
      
      <div
        style={{
          fontSize: 28,
          color: "#6b7280",
          opacity: subtitleOpacity,
          textAlign: "center",
          maxWidth: 600,
          lineHeight: 1.4,
        }}
      >
        Keep the conversations flowing in 2025! 💬
      </div>
    </AbsoluteFill>
  );
};
