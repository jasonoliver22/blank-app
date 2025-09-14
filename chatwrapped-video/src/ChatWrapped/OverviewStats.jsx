import React from "react";
import { AbsoluteFill, interpolate, Easing } from "remotion";

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color, 
  frame, 
  delay = 0,
  duration = 60 
}) => {
  const cardOpacity = interpolate(frame, [delay, delay + 20], [0, 1], {
    easing: Easing.out(Easing.quad),
  });

  const cardScale = interpolate(frame, [delay, delay + 20], [0.8, 1], {
    easing: Easing.out(Easing.back(1.1)),
  });

  const numberValue = interpolate(frame, [delay + 10, delay + 40], [0, value], {
    easing: Easing.out(Easing.quad),
  });

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
        borderRadius: 20,
        padding: 40,
        textAlign: "center",
        opacity: cardOpacity,
        transform: `scale(${cardScale})`,
        border: `2px solid ${color}40`,
        boxShadow: `0 10px 30px ${color}20`,
        minWidth: 280,
        margin: 20,
      }}
    >
      <div style={{ fontSize: 60, marginBottom: 15 }}>
        {icon}
      </div>
      <div
        style={{
          fontSize: 48,
          fontWeight: "bold",
          color: color,
          marginBottom: 10,
        }}
      >
        {Math.round(numberValue)}
      </div>
      <div
        style={{
          fontSize: 18,
          color: "#6b7280",
          fontWeight: "500",
        }}
      >
        {title}
      </div>
    </div>
  );
};

export const OverviewStats = ({ frame, duration, data }) => {
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
        📊 Your 2025 Chat Stats
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
        }}
      >
        <StatCard
          title="Total Conversations"
          value={data.totalConversations}
          icon="💬"
          color="#3b82f6"
          frame={frame}
          delay={0}
        />
        
        <StatCard
          title="Avg per Day"
          value={data.avgPerDay}
          icon="📅"
          color="#10b981"
          frame={frame}
          delay={15}
        />
        
        <StatCard
          title="Avg Conversation Length"
          value={data.avgConversationLength}
          icon="📏"
          color="#8b5cf6"
          frame={frame}
          delay={30}
        />
        
        <StatCard
          title="Politeness Score"
          value={data.politenessScore}
          icon="😊"
          color="#f59e0b"
          frame={frame}
          delay={45}
        />
      </div>
    </AbsoluteFill>
  );
};
