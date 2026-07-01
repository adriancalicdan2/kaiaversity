"use client";

import { GraduationCap, Baby, BookOpen, Briefcase } from "lucide-react";
import { LevelIcon } from "@/components/shared/LevelIcon";
import React, { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { getProgressToNextLevel } from "@/lib/constants/levels";

interface StudentIDProps {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
    points: number;
    role?: string | null;
    favoriteMember?: string | null;
  };
}

export default function StudentID({ user }: StudentIDProps) {
  const isManagement = user.role === "PROFESSOR" || user.role === "ADMIN";
  const isProf = user.role === "PROFESSOR";
  const isAdmin = user.role === "ADMIN";

  const [isFlipped, setIsFlipped] = useState(false);
  const { current, next, progress, pointsNeeded } = getProgressToNextLevel(user.points);

  // 3D Card Hover / Tilt Effect values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Transform values for 3D rotation based on mouse coordinates relative to center
  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-150, 150], [-15, 15]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (isFlipped) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    x.set(mouseX);
    y.set(mouseY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div style={{ perspective: 1000, width: "100%", maxWidth: 650, margin: "0 auto 24px auto" }}>
      <motion.div
        onClick={() => {
          setIsFlipped(!isFlipped);
          x.set(0);
          y.set(0);
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width: "100%",
          height: 240,
          position: "relative",
          transformStyle: "preserve-3d",
          cursor: "pointer",
          rotateX: isFlipped ? 0 : rotateX,
          rotateY: isFlipped ? 180 : rotateY,
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
      >
        {/* FRONT SIDE */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            background: "linear-gradient(135deg, rgba(30, 20, 50, 0.95), rgba(10, 5, 20, 0.98))",
            border: `2px solid ${current.color}80`,
            borderRadius: 20,
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 12px ${current.color}30`,
            overflow: "hidden",
          }}
        >
          {/* Glassmorphic/Grid overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.08,
              backgroundImage: `linear-gradient(${current.color} 1px, transparent 1px), linear-gradient(90deg, ${current.color} 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
              pointerEvents: "none",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 1 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {/* Profile Image with Ring */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  border: `3px solid ${current.color}`,
                  overflow: "hidden",
                  boxShadow: `0 0 15px ${current.color}60`,
                  background: "rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name || "Student"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <GraduationCap size={28} style={{ color: current.color }} />
                )}
              </div>
              <div>
                <span style={{ fontSize: 9, fontWeight: 800, color: isManagement ? "#a78bfa" : current.color, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  {isProf ? "KAIAVERSITY PROFESSOR CARD" : isAdmin ? "KAIAVERSITY ADMIN CARD" : "KAIAVERSITY STUDENT CARD"}
                </span>
                <h3 style={{ color: "white", fontSize: 18, fontWeight: 800, margin: "2px 0 0 0" }}>
                  {user.name || "Anonymous ZAIA"}
                </h3>
                <span style={{ color: "#64748b", fontSize: 12 }}>{user.email}</span>
              </div>
            </div>

            {/* Level/Rarity Badge / Staff Badge */}
            {isManagement ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ display: "inline-flex", padding: "2px 0" }}>
                  <GraduationCap size={44} style={{ color: "#a78bfa" }} />
                </span>
                <span style={{ fontSize: 10, fontWeight: 900, color: "#a78bfa", letterSpacing: "0.1em", marginTop: 4 }}>
                  {isProf ? "FACULTY" : "ADMIN"}
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ display: "inline-flex", padding: "2px 0" }}>
                  <LevelIcon badge={current.badge} size={32} style={{ color: current.color }} />
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: current.color, letterSpacing: "0.08em" }}>
                  {current.title.toUpperCase()}
                </span>
                <span style={{ fontSize: 18, fontWeight: 900, color: "white", marginTop: 2 }}>
                  Level {current.level}
                </span>
              </div>
            )}
          </div>

          {/* Points Progress / Faculty Profile */}
          {isManagement ? (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12, zIndex: 1 }}>
              <span style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                FACULTY PROFILE
              </span>
              <p style={{ color: "#cbd5e1", fontSize: 12, margin: "4px 0 0 0", fontStyle: "italic", lineHeight: 1.4 }}>
                {isProf ? "Educating the future scholars of KAIAVERSITY." : "Overseeing operations and excellence in KAIAVERSITY."}
              </p>
            </div>
          ) : (
            <div style={{ zIndex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 11, marginBottom: 6 }}>
                <div>
                  <span style={{ color: "#475569", fontWeight: 700 }}>TOTAL POINTS: </span>
                  <span style={{ color: "white", fontWeight: 800 }}>{user.points}</span>
                </div>
                {next && (
                  <span style={{ color: "#64748b" }}>
                    {pointsNeeded} pts to {next.title} ({progress}%)
                  </span>
                )}
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${current.color}, ${next?.color || current.color})`,
                    borderRadius: 99,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* BACK SIDE */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            background: "linear-gradient(135deg, rgba(15, 10, 25, 0.98), rgba(5, 2, 10, 1))",
            border: `2px solid ${isManagement ? "#a78bfa" : current.color}60`,
            borderRadius: 20,
            padding: "24px 28px",
            transform: "rotateY(180deg)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
          }}
        >
          <div>
            <h4 style={{ color: "white", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
              {isManagement ? "Faculty Guidelines & Honors" : "University Rules & Badges"}
            </h4>
            <p style={{ color: "#475569", fontSize: 11, lineHeight: 1.4, maxWidth: 300 }}>
              {isManagement ? (
                <>
                  1. Publish high-quality lectures and quizzes.<br />
                  2. Support student growth and engagement.<br />
                  3. Maintain review queues and evaluations.
                </>
              ) : (
                <>
                  1. Attend all classes and lectures.<br />
                  2. Respect fellow ZAIAs and Professors.<br />
                  3. Complete daily quests to earn rewards.
                </>
              )}
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "center" }}>
              <span title="Freshman" style={{ opacity: 0.5, display: "inline-flex" }}><Baby size={20} style={{ color: "#64748b" }} /></span>
              <span title="Sophomore" style={{ opacity: 0.5, display: "inline-flex" }}><Briefcase size={20} style={{ color: "#64748b" }} /></span>
              <span title="Junior" style={{ opacity: 0.5, display: "inline-flex" }}><BookOpen size={20} style={{ color: "#64748b" }} /></span>
              <span title="Senior" style={{ opacity: 0.5, display: "inline-flex" }}><GraduationCap size={20} style={{ color: "#64748b" }} /></span>
            </div>
          </div>

          {/* QR Code Placeholder / Member Hologram */}
          <div
            style={{
              width: 100,
              height: 100,
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: "rgba(255,255,255,0.02)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Mock QR grid */}
            <div
              style={{
                width: 80,
                height: 80,
                backgroundImage: `radial-gradient(circle, #fff 20%, transparent 20%), radial-gradient(circle, #fff 20%, transparent 20%)`,
                backgroundSize: "8px 8px",
                backgroundPosition: "0 0, 4px 4px",
                opacity: 0.4,
              }}
            />
            <span style={{ position: "absolute", fontSize: 10, color: current.color, fontWeight: 800, bottom: 4 }}>
              SECURE ZAIA
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
