import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { featuredReleases } from "@/lib/db/schema";
import { updateFeaturedRelease } from "@/lib/actions/streaming";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export const metadata = { title: "Latest Release — Admin" };

export default async function FeaturedReleaseAdminPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin/dashboard");

  const release = await db.query.featuredReleases.findFirst({
    where: eq(featuredReleases.id, "latest-kaia-release"),
  });

  return (
    <div style={{ padding: "32px 36px", maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ color: "white", fontSize: 26, fontWeight: 900, marginBottom: 6 }}>🎵 Latest KAIA Release</h1>
      <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 28 }}>Choose the YouTube and optional Spotify embeds shown on every student dashboard. Students earn +10 at one minute and +50 after completing the YouTube video.</p>
      <form action={updateFeaturedRelease} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, display: "grid", gap: 18 }}>
        <label style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700 }}>Song title<input name="title" required maxLength={120} defaultValue={release?.title ?? ""} placeholder="e.g. KAIA — Latest Release" style={inputStyle} /></label>
        <label style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700 }}>YouTube link<input name="youtubeUrl" required defaultValue={release ? `https://www.youtube.com/watch?v=${release.videoId}` : ""} placeholder="https://www.youtube.com/watch?v=..." style={inputStyle} /></label>
        <label style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700 }}>Spotify track link <span style={{ color: "#64748b", fontWeight: 500 }}>(optional)</span><input name="spotifyUrl" defaultValue={release?.spotifyTrackId ? `https://open.spotify.com/track/${release.spotifyTrackId}` : ""} placeholder="https://open.spotify.com/track/..." style={inputStyle} /></label>
        <button type="submit" style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)", color: "white", border: 0, borderRadius: 10, padding: "11px 16px", fontWeight: 800, cursor: "pointer", width: "fit-content" }}>Save featured release</button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = { display: "block", width: "100%", marginTop: 7, boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 12px", color: "white", outline: "none" };
