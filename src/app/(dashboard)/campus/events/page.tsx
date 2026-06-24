import type { Metadata } from "next";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { KAIA_MEMBERS } from "@/lib/constants/members";
import { formatDate } from "@/lib/utils";
import { 
  Calendar, 
  Radio, 
  Zap, 
  Users, 
  Cake, 
  Award, 
  Sparkles, 
  Flame, 
  Music, 
  Star 
} from "lucide-react";

export const metadata: Metadata = { title: "Events" };

const EVENT_TYPE: Record<string, { icon: any; color: string }> = {
  LIVE:     { icon: Radio, color: "#ef4444" },
  CHALLENGE:{ icon: Zap, color: "#f59e0b" },
  FANMEET:  { icon: Users, color: "#8B5CF6" },
  BIRTHDAY: { icon: Cake, color: "#ec4899" },
};

function getMemberIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("angela")) return Sparkles;
  if (n.includes("charice")) return Zap;
  if (n.includes("alexa")) return Flame;
  if (n.includes("sophia")) return Music;
  if (n.includes("charlotte")) return Star;
  return Star;
}

export default async function EventsPage() {
  const allEvents = await db.query.events.findMany();

  return (
    <div style={{ padding: "28px 32px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <Calendar size={28} style={{ color: "#8B5CF6" }} />
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "white", margin: 0 }}>
          Events
        </h1>
      </div>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 32 }}>
        Live events, fan meets, challenges, and birthday celebrations
      </p>

      {allEvents.length === 0 ? (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "64px", textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Calendar size={48} style={{ color: "#475569" }} />
          <div>
            <p style={{ color: "#475569", fontSize: 15, margin: 0 }}>No events scheduled yet.</p>
            <p style={{ color: "#334155", fontSize: 13, marginTop: 4, margin: 0 }}>Check back soon — something exciting is coming!</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {allEvents.map((event) => {
            const member = KAIA_MEMBERS.find((m) => m.id === event.hostMemberId);
            const typeInfo = EVENT_TYPE[event.type] ?? { icon: Calendar, color: "#8B5CF6" };
            const TypeIcon = typeInfo.icon;
            const isPast = event.endDate && new Date(event.endDate) < new Date();
            return (
              <div
                key={event.id}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${member?.color ?? typeInfo.color}25`,
                  borderRadius: 16, padding: "20px",
                  opacity: isPast ? 0.6 : 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ display: "inline-flex", color: typeInfo.color }}>
                    <TypeIcon size={22} />
                  </span>
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
                  <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6, marginBottom: 10, flex: 1 }}>
                    {event.description}
                  </p>
                )}
                {event.startDate && (
                  <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569" }}>
                    <Calendar size={13} /> {formatDate(event.startDate)}
                  </p>
                )}
                {member && (() => {
                  const MemberIcon = getMemberIcon(member.name);
                  return (
                    <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: member.color, marginTop: 6, marginBlockEnd: 0 }}>
                      <MemberIcon size={12} />
                      <span>Hosted by {member.name}</span>
                    </p>
                  );
                })()}
                {event.points && (
                  <div style={{ marginTop: 12, alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#8B5CF6", background: "rgba(139,92,246,0.1)", borderRadius: 99, padding: "4px 10px" }}>
                    <Award size={13} /> +{event.points} pts for attending
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
