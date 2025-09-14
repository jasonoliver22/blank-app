import React from "react";
import { AbsoluteFill, interpolate, Easing } from "remotion";

const ThemeTag = ({ 
  theme, 
  count, 
  frame, 
  delay = 0,
  color = "#3b82f6"
}) => {
  const tagOpacity = interpolate(frame, [delay, delay + 20], [0, 1], {
    easing: Easing.out(Easing.quad),
  });

  const tagScale = interpolate(frame, [delay, delay + 20], [0.8, 1], {
    easing: Easing.out(Easing.back(1.1)),
  });

  const countValue = interpolate(frame, [delay + 10, delay + 30], [0, count], {
    easing: Easing.out(Easing.quad),
  });

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
        borderRadius: 25,
        padding: "15px 25px",
        margin: "8px",
        opacity: tagOpacity,
        transform: `scale(${tagScale})`,
        border: `2px solid ${color}40`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 200,
        justifyContent: "center",
      }}
    >
      <span style={{ fontSize: 18, fontWeight: "600", color: color }}>
        {theme}
      </span>
      <span 
        style={{ 
          fontSize: 16, 
          color: "#6b7280",
          background: `${color}20`,
          padding: "4px 8px",
          borderRadius: 12,
        }}
      >
        {Math.round(countValue)}
      </span>
    </div>
  );
};

export const ChatThemes = ({ frame, duration, data }) => {
  const containerOpacity = interpolate(frame, [0, 30], [0, 1], {
    easing: Easing.out(Easing.quad),
  });

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    easing: Easing.out(Easing.quad),
  });

  const textOpacity = interpolate(frame, [20, 40], [0, 1], {
    easing: Easing.out(Easing.quad),
  });

  if (!data) {
    return (
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: containerOpacity,
        }}
      >
        <div style={{ fontSize: 32, color: "#6b7280" }}>
          No data available
        </div>
      </AbsoluteFill>
    );
  }

  // Parse themes from the data
  const parseThemes = (themesString) => {
    if (!themesString || themesString === 'No clear themes detected') {
      return [];
    }
    
    const themeMatches = themesString.match(/(\w+)\s*\((\d+)\)/g);
    if (!themeMatches) return [];
    
    return themeMatches.map(match => {
      const [, theme, count] = match.match(/(\w+)\s*\((\d+)\)/);
      return { theme, count: parseInt(count) };
    });
  };

  const themes = parseThemes(data.themes);
  const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: containerOpacity,
        padding: 40,
      }}
    >
      <div
        style={{
          fontSize: 48,
          fontWeight: "bold",
          color: "#1f2937",
          marginBottom: 40,
          opacity: titleOpacity,
        }}
      >
        🎯 Your Chat Themes
      </div>

      {themes.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            maxWidth: 800,
            opacity: textOpacity,
          }}
        >
          {themes.map((theme, index) => (
            <ThemeTag
              key={theme.theme}
              theme={theme.theme}
              count={theme.count}
              frame={frame}
              delay={index * 15}
              color={colors[index % colors.length]}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            fontSize: 24,
            color: "#6b7280",
            textAlign: "center",
            opacity: textOpacity,
            fontStyle: "italic",
          }}
        >
          No clear themes detected in your conversations
        </div>
      )}
    </AbsoluteFill>
  );
};
