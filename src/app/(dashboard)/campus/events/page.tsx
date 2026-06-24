import type { Metadata } from "next";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { KAIA_MEMBERS } from "@/lib/constants/members";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Events" };

const EVENT_TYPE: Record<string, { icon: string; color: string }> = {
  LIVE:     { icon: "🔴", color: "#ef4444" },
  CHALLENGE:{ icon: "⚡", color: "#f59e0b" },
  FANMEET:  { icon: "💜", color: "#8B5CF6" },
  BIRTHDAY: { icon: "🎂", color: "#ec4899" },
};

export default async function EventsPage() {
  const allEvents = await db.query.events.findMany();

  return (
    <div style={{ padding: "28px 32px", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "white", marginBottom: 4 }}>
        📅 Events
      </h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 32 }}>
        Live events, fan meets, challenges, and birthday celebrations
      </p>

      {allEvents.length === 0 ? (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "64px", textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <p style={{ color: "#475569", fontSize: 15 }}>No events scheduled yet.</p>
          <p style={{ color: "#334155", fontSize: 13, marginTop: 4 }}>Check back soon — something exciting is coming!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {allEvents.map((event) => {
            const member = KAIA_MEMBERS.find((m) => m.id === event.hostMemberId);
            const typeInfo = EVENT_TYPE[event.type] ?? { icon: "📅", color: "#8B5CF6" };
            const isPast = event.endDate && new Date(event.endDate) < new Date();
            return (
              <div
                key={event.id}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${member?.color ?? typeInfo.color}25`,
                  borderRadius: 16, padding: "20px",
                  opacity: isPast ? 0.6 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{typeInfo.icon}</span>
                  <span
                    style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
                      background: `${typeInfo.color}15`, color: typeInfo.color,
                    }}
                  >
                    {event.type}
                  </span>
                </div>
                <h3 style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{event.title}</h3>
                {event.description && (
                  <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
                    {event.description}
                  </p>
                )}
                {event.startDate && (
                  <p style={{ fontSize: 12, color: "#475569" }}>
                    📆 {formatDate(event.startDate)}
                  </p>
                )}
                {member && (
                  <p style={{ fontSize: 12, color: member.color, marginTop: 6 }}>
                    {member.emoji} Hosted by {member.name}
                  </p>
                )}
                {event.points && (
                  <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#8B5CF6", background: "rgba(139,92,246,0.1)", borderRadius: 99, padding: "4px 10px" }}>
                    ⭐ +{event.points} pts for attending
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
