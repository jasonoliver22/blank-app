import React from "react";
import { AbsoluteFill, interpolate, Easing } from "remotion";

const PatternItem = ({ 
  label, 
  value, 
  icon, 
  frame, 
  delay = 0,
  color = "#3b82f6"
}) => {
  const itemOpacity = interpolate(frame, [delay, delay + 20], [0, 1], {
    easing: Easing.out(Easing.quad),
  });

  const itemSlide = interpolate(frame, [delay, delay + 20], [50, 0], {
    easing: Easing.out(Easing.quad),
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 30px",
        background: `linear-gradient(135deg, ${color}10, ${color}05)`,
        borderRadius: 15,
        margin: "10px 0",
        opacity: itemOpacity,
        transform: `translateX(${itemSlide}px)`,
        border: `1px solid ${color}20`,
        minWidth: 400,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
        <div style={{ fontSize: 24 }}>{icon}</div>
        <span style={{ fontSize: 18, color: "#6b7280", fontWeight: "500" }}>
          {label}:
        </span>
      </div>
      <span 
        style={{ 
          fontSize: 20, 
          fontWeight: "bold", 
          color: color 
        }}
      >
        {value}
      </span>
    </div>
  );
};

export const ChatPatterns = ({ frame, duration, data }) => {
  const containerOpacity = interpolate(frame, [0, 30], [0, 1], {
    easing: Easing.out(Easing.quad),
  });

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
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
        🕐 Your Chat Patterns
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <PatternItem
          label="Peak Hour"
          value={data.peakHour}
          icon="⏰"
          frame={frame}
          delay={0}
          color="#3b82f6"
        />
        
        <PatternItem
          label="Weekend Chats"
          value={data.weekendCount}
          icon="🏖️"
          frame={frame}
          delay={15}
          color="#10b981"
        />
        
        <PatternItem
          label="Weekday Chats"
          value={data.weekdayCount}
          icon="💼"
          frame={frame}
          delay={30}
          color="#8b5cf6"
        />
        
        <PatternItem
          label="Longest Break"
          value={`${data.longestBreak} days`}
          icon="⏸️"
          frame={frame}
          delay={45}
          color="#f59e0b"
        />
        
        <PatternItem
          label="Longest Streak"
          value={`${data.longestStreak} days`}
          icon="🔥"
          frame={frame}
          delay={60}
          color="#ef4444"
        />
      </div>
    </AbsoluteFill>
  );
};
