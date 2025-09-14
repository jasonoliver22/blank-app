import React from "react";
import { AbsoluteFill, interpolate, Easing } from "remotion";

const TimelineItem = ({ 
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

  const itemSlide = interpolate(frame, [delay, delay + 20], [30, 0], {
    easing: Easing.out(Easing.quad),
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "25px 35px",
        background: `linear-gradient(135deg, ${color}10, ${color}05)`,
        borderRadius: 15,
        margin: "15px 0",
        opacity: itemOpacity,
        transform: `translateX(${itemSlide}px)`,
        border: `1px solid ${color}20`,
        minWidth: 500,
        boxShadow: `0 4px 15px ${color}10`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ fontSize: 28 }}>{icon}</div>
        <span style={{ fontSize: 20, color: "#6b7280", fontWeight: "500" }}>
          {label}:
        </span>
      </div>
      <span 
        style={{ 
          fontSize: 22, 
          fontWeight: "bold", 
          color: color 
        }}
      >
        {value}
      </span>
    </div>
  );
};

export const Timeline = ({ frame, duration, data }) => {
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
        📅 Timeline
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 5,
        }}
      >
        <TimelineItem
          label="First Chat"
          value={data.firstChat}
          icon="🚀"
          frame={frame}
          delay={0}
          color="#3b82f6"
        />
        
        <TimelineItem
          label="Last Chat"
          value={data.lastChat}
          icon="🏁"
          frame={frame}
          delay={20}
          color="#10b981"
        />
        
        <TimelineItem
          label="Most Active Day"
          value={data.mostActiveDay}
          icon="⭐"
          frame={frame}
          delay={40}
          color="#8b5cf6"
        />
      </div>
    </AbsoluteFill>
  );
};
