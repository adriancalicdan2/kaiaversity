"use client";

import React, { useOptimistic, useTransition } from "react";
import { completeQuest } from "@/lib/actions/quests";
import Link from "next/link";

interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  icon?: string | null;
}

interface DailyQuestsProps {
  quests: Quest[];
  initialCompletedQuestIds: string[];
}

export default function DailyQuests({ quests, initialCompletedQuestIds }: DailyQuestsProps) {
  const [isPending, startTransition] = useTransition();

  // React 19 useOptimistic: optimistically tracks completed quest IDs
  const [optimisticCompletedIds, setOptimisticCompletedIds] = useOptimistic(
    initialCompletedQuestIds,
    (state, questId: string) => [...state, questId]
  );

  async function handleClaim(questId: string, points: number) {
    startTransition(async () => {
      // Optimistically add questId to completed list
      setOptimisticCompletedIds(questId);
      
      try {
        await completeQuest(questId, points);
      } catch (err) {
        console.error("Failed to complete quest:", err);
      }
    });
  }

  async function handleShare(questId: string, points: number) {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "KAIAVERSITY",
          text: "Join me at KAIAVERSITY, the official fan university for KAIA! 🎓💜",
          url: window.location.origin,
        });
        await handleClaim(questId, points);
      } catch (err) {
        console.log("Share cancelled or failed:", err);
      }
    } else {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          "Check out KAIAVERSITY, the official fan university for KAIA! 🎓✨ " + window.location.origin
        )}`,
        "_blank"
      );
      await handleClaim(questId, points);
    }
  }

  function renderQuestButton(quest: Quest) {
    const buttonStyle: React.CSSProperties = {
      fontSize: 12,
      fontWeight: 700,
      color: "#a78bfa",
      background: "rgba(139, 92, 246, 0.08)",
      border: "1px solid rgba(139, 92, 246, 0.2)",
      padding: "6px 12px",
      borderRadius: 99,
      whiteSpace: "nowrap",
      cursor: "pointer",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      transition: "all 0.2s ease",
    };

    if (quest.id === "quest-share-joy") {
      return (
        <button
          onClick={() => handleShare(quest.id, quest.points)}
          disabled={isPending}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.08)";
          }}
        >
          Share 📤
        </button>
      );
    }

    if (quest.id === "quest-read-lecture" || quest.id === "quest-professor-spotlight") {
      return (
        <Link
          href="/campus/courses"
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.08)";
          }}
        >
          Go Read 📖
        </Link>
      );
    }

    if (quest.id === "quest-show-love") {
      return (
        <Link
          href="/dashboard"
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.08)";
          }}
        >
          Go Like ❤️
        </Link>
      );
    }

    if (quest.id === "quest-fan-art" || quest.id === "quest-community-helper") {
      return (
        <Link
          href="/community"
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.08)";
          }}
        >
          Go Reply 💬
        </Link>
      );
    }

    return (
      <button
        onClick={() => handleClaim(quest.id, quest.points)}
        disabled={isPending}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(139, 92, 246, 0.18)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(139, 92, 246, 0.08)";
        }}
      >
        Check In 🏫
      </button>
    );
  }

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 16,
        padding: "20px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}
    >
      <h3
        style={{
          color: "white",
          fontWeight: 700,
          fontSize: 16,
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ⚡ Daily Quests
        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400, marginLeft: "auto" }}>
          Resets midnight PH
        </span>
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {quests.map((quest) => {
          const isCompleted = optimisticCompletedIds.includes(quest.id);

          return (
            <div
              key={quest.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 12,
                background: isCompleted ? "rgba(52, 211, 153, 0.03)" : "rgba(255, 255, 255, 0.02)",
                border: isCompleted ? "1px solid rgba(52, 211, 153, 0.2)" : "1px solid rgba(255, 255, 255, 0.05)",
                transition: "all 0.3s ease",
              }}
            >
              <span style={{ fontSize: 20 }}>{quest.icon || "📝"}</span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    color: isCompleted ? "#94a3b8" : "#f1f5f9",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: isCompleted ? "line-through" : "none",
                    margin: 0,
                  }}
                >
                  {quest.title}
                </p>
                <p style={{ color: "#64748b", fontSize: 11, margin: "2px 0 0 0" }}>
                  {quest.description}
                </p>
              </div>

              {isCompleted ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#34d399",
                    background: "rgba(52, 211, 153, 0.12)",
                    padding: "4px 10px",
                    borderRadius: 99,
                    whiteSpace: "nowrap",
                  }}
                >
                  ✓ Completed
                </span>
              ) : (
                renderQuestButton(quest)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
