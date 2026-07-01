import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, members } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createEvent, toggleEvent, deleteEvent } from "@/lib/actions/admin";
import { Trophy, Plus, Trash2, Video, Zap, Mic, Cake } from "lucide-react";

export const metadata: Metadata = { title: "Events — Admin" };

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; icon: React.ComponentType<any> }> = {
  LIVE:      { bg: "rgba(239,68,68,0.12)",   text: "#ef4444",  icon: Video },
  CHALLENGE: { bg: "rgba(139,92,246,0.12)",  text: "#a78bfa",  icon: Zap },
  FANMEET:   { bg: "rgba(236,72,153,0.12)",  text: "#ec4899",  icon: Mic },
  BIRTHDAY:  { bg: "rgba(245,158,11,0.12)",  text: "#f59e0b",  icon: Cake },
};

export default async function AdminEventsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  // Fetch events and members in parallel (only 5 members total, so safe to fetch all)
  const [allEvents, membersArr] = await Promise.all([
    db.query.events.findMany({
      orderBy: [desc(events.createdAt)],
    }),
    db.query.members.findMany(),
  ]);
 
  const memberMap = Object.fromEntries(membersArr.map((m) => [m.id, m]));

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <Trophy size={26} style={{ color: "#f59e0b" }} />
          <span>Events Management</span>
        </h1>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          {allEvents.filter((e) => e.isActive).length} active · {allEvents.length} total
        </p>
      </div>

      {/* Create form */}
      <form
        action={createEvent}
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "20px 24px", marginBottom: 28,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: "white", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={16} />
          <span>Create New Event</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <input name="title" placeholder="Event title" required style={inputStyle} />
          <select name="type" required style={inputStyle}>
            <option value="LIVE">Live</option>
            <option value="CHALLENGE">Challenge</option>
            <option value="FANMEET">Fan Meet</option>
            <option value="BIRTHDAY">Birthday</option>
          </select>
          <input name="points" type="number" placeholder="Points" defaultValue={50} style={inputStyle} />
          <input name="startDate" type="date" style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input name="description" placeholder="Description (optional)" style={{ ...inputStyle, flex: 1 }} />
          <button
            type="submit"
            style={{
              padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "white", border: "none", cursor: "pointer", flexShrink: 0,
            }}
          >
            Create Event
          </button>
        </div>
      </form>

      {/* Events list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {allEvents.map((event) => {
          const tc = EVENT_TYPE_COLORS[event.type] ?? EVENT_TYPE_COLORS.LIVE;
          const host = event.hostMemberId ? memberMap[event.hostMemberId] : null;
          return (
            <div
              key={event.id}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${event.isActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"}`,
                borderRadius: 12, padding: "14px 18px",
                display: "flex", alignItems: "center", gap: 14,
                opacity: event.isActive ? 1 : 0.55,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
              }}>
                <tc.icon size={18} style={{ color: tc.text }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: "white", fontSize: 14 }}>{event.title}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  <span style={{ color: tc.text, fontWeight: 700 }}>{event.type}</span>
                  {" · "}{event.points} pts
                  {event.startDate && ` · Starts ${new Date(event.startDate).toLocaleDateString()}`}
                  {host && ` · Hosted by ${host.stageName}`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <form action={async () => { "use server"; await toggleEvent(event.id, event.isActive ?? true); }}>
                  <button type="submit" style={btn(event.isActive ? "#64748b" : "#10b981")}>
                    {event.isActive ? "Deactivate" : "Activate"}
                  </button>
                </form>
                <form action={async () => { "use server"; await deleteEvent(event.id); }}>
                  <button type="submit" style={{ ...btn("#ef4444"), display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 10px" }}>
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {allEvents.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
          No events yet. Create one above!
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px", borderRadius: 10,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "white", fontSize: 13, outline: "none", width: "100%",
};

function btn(color: string): React.CSSProperties {
  return {
    fontSize: 12, fontWeight: 700, color: "white",
    background: `${color}18`, border: `1px solid ${color}50`,
    padding: "6px 14px", borderRadius: 8, cursor: "pointer",
  };
}
