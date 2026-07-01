"use client";

import React from "react";

export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        width: "100%",
        gap: 20,
        padding: 24,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 90,
          height: 90,
        }}
      >
        {/* Outer glowing pulsing halo */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
            animation: "pulse-glow 2s infinite ease-in-out",
          }}
        />

        {/* Outer spinning gradient ring */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            border: "3px solid transparent",
            borderTopColor: "#FF6B9D",
            borderBottomColor: "#8B5CF6",
            animation: "spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
          }}
        />

        {/* Inner pulsing logo */}
        <div
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "pulse-scale 1.8s ease-in-out infinite",
          }}
        >
          <img
            src="/kaiaversity.png"
            alt="Loading..."
            style={{
              height: 24,
              width: "auto",
              objectFit: "contain",
            }}
          />
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: "#FF6B9D",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            margin: 0,
            animation: "pulse-text 1.5s infinite ease-in-out",
          }}
        >
          Entering Classroom
        </p>
        <p
          style={{
            fontSize: 11,
            color: "#64748b",
            marginTop: 4,
            marginBottom: 0,
          }}
        >
          Please wait while we gather the materials...
        </p>
      </div>

      {/* Embedded styles for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.92); opacity: 0.8; }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
        @keyframes pulse-text {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
