import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quests, userQuests } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createQuest, toggleQuest, deleteQuest } from "@/lib/actions/admin";
import { Target, Plus, Trash2, RefreshCw, Zap } from "lucide-react";

export const metadata: Metadata = { title: "Quests — Admin" };

export default async function AdminQuestsPage() {
  const session = await auth();
  if (!session?.user || !["PROFESSOR", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Fetch quests and completion counts in parallel
  const [allQuests, completionCounts] = await Promise.all([
    db.query.quests.findMany({
      orderBy: (q, { asc }) => [asc(q.order)],
    }),
    db
      .select({ questId: userQuests.questId, count: count() })
      .from(userQuests)
      .where(eq(userQuests.completed, true))
      .groupBy(userQuests.questId),
  ]);

  const completionMap = Object.fromEntries(completionCounts.map((c) => [c.questId, c.count]));

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <Target size={26} style={{ color: "#ec4899" }} />
          <span>Quests Management</span>
        </h1>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          {allQuests.filter((q) => q.active).length} active quests · Daily challenges for ZAIAs
        </p>
      </div>

      {/* Create form */}
      <form
        action={createQuest}
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 28,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: "white", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={16} />
          <span>Create New Quest</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <input name="title" placeholder="Quest title" required style={inputStyle} />
          <input name="description" placeholder="What the user must do (e.g. Post a comment today)" required style={inputStyle} />
          <input name="points" type="number" placeholder="Points" defaultValue={10} min={1} style={inputStyle} />
          <select name="resetDaily" style={inputStyle}>
            <option value="true">Daily Reset</option>
            <option value="false">One-time</option>
          </select>
        </div>
        <button
          type="submit"
          style={{
            padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13,
            background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
            color: "white", border: "none", cursor: "pointer",
          }}
        >
          Create Quest
        </button>
      </form>

      {/* Quest list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {allQuests.map((quest) => (
          <div
            key={quest.id}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${quest.active ? "rgba(236,72,153,0.15)" : "rgba(255,255,255,0.04)"}`,
              borderRadius: 12,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: quest.active ? 1 : 0.55,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: quest.active ? "rgba(236,72,153,0.12)" : "rgba(100,116,139,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
            }}>
              <Target size={20} style={{ color: quest.active ? "#ec4899" : "#64748b" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, color: "white", fontSize: 14 }}>{quest.title}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {quest.description}
              </div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>
                <span style={{ color: "#ec4899" }}>{quest.points} pts</span>
                {" · "}
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {quest.resetDaily ? <RefreshCw size={10} /> : <Zap size={10} />}
                  <span>{quest.resetDaily ? "Resets daily" : "One-time"}</span>
                </span>
                {" · "}
                {completionMap[quest.id] ?? 0} completions
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <form action={async () => { "use server"; await toggleQuest(quest.id, quest.active ?? true); }}>
                <button type="submit" style={btn(quest.active ? "#64748b" : "#10b981")}>
                  {quest.active ? "Disable" : "Enable"}
                </button>
              </form>
                <form action={async () => { "use server"; await deleteQuest(quest.id); }}>
                  <button type="submit" style={{ ...btn("#ef4444"), display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 10px" }}>
                    <Trash2 size={14} />
                  </button>
                </form>
            </div>
          </div>
        ))}
      </div>

      {allQuests.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
          No quests yet. Create one above!
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "white",
  fontSize: 13,
  outline: "none",
  width: "100%",
};

function btn(color: string): React.CSSProperties {
  return {
    fontSize: 12, fontWeight: 700, color: "white",
    background: `${color}18`, border: `1px solid ${color}50`,
    padding: "6px 14px", borderRadius: 8, cursor: "pointer",
  };
}
