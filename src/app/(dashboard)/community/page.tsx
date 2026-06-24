import type { Metadata } from "next";
import { db } from "@/lib/db";
import { comments, users, posts } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatTimeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Community" };

export default async function CommunityPage() {
  const recentComments = await db.query.comments.findMany({
    orderBy: [desc(comments.createdAt)],
    limit: 30,
  });

  return (
    <div style={{ padding: "28px 32px", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "white", marginBottom: 4 }}>
        💬 Community
      </h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 32 }}>
        See what ZAIAs are saying
      </p>

      {recentComments.length === 0 ? (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "64px", textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <p style={{ color: "#475569", fontSize: 15 }}>No comments yet — be the first ZAIA to speak up!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {recentComments.map((comment) => (
            <div
              key={comment.id}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, padding: "16px 20px",
                display: "flex", gap: 14,
              }}
            >
              <div
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(139,92,246,0.15)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                }}
              >
                🎓
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>
                    ZAIA
                  </span>
                  <span style={{ fontSize: 11, color: "#334155" }}>
                    {comment.createdAt ? formatTimeAgo(comment.createdAt) : ""}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.6 }}>
                  {comment.content}
                </p>
                <div style={{ marginTop: 6, fontSize: 12, color: "#334155" }}>
                  ❤️ {comment.likes ?? 0}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
