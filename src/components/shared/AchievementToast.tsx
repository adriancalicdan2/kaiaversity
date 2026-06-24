"use client";

import { useToast } from "@/lib/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { EmojiIcon } from "@/components/shared/EmojiIcon";
import { X } from "lucide-react";

export function AchievementToast() {
  const { toasts, dismissToast } = useToast();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        pointerEvents: "none", // Let clicks pass through empty area
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.9), rgba(255,107,157,0.9))",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 16,
              padding: "16px 20px",
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(139,92,246,0.3)",
              minWidth: 300,
              maxWidth: 400,
              pointerEvents: "auto", // Make toast clickable if needed
            }}
          >
            <div
              style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <EmojiIcon emoji={toast.icon ?? "🌟"} size={24} style={{ color: "white" }} />
            </div>
            <div style={{ flex: 1, paddingTop: 2 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>
                ACHIEVEMENT UNLOCKED
              </div>
              <h3 style={{ color: "white", fontWeight: 800, fontSize: 16, marginBottom: 2 }}>
                {toast.title}
              </h3>
              {toast.description && (
                <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.4 }}>
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              style={{
                background: "transparent", border: "none", color: "rgba(255,255,255,0.6)",
                cursor: "pointer", padding: 4, alignSelf: "flex-start",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
