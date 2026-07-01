import type { Metadata } from "next";
import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import CommunityView from "@/components/community/CommunityView";

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
        Connect with other ZAIAs in real-time or view course discussions
      </p>

      <CommunityView recentComments={recentComments} />
    </div>
  );
}
