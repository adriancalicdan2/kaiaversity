"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { featuredReleases, userStreamRewards } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { addPoints } from "./points";

const FEATURED_RELEASE_ID = "latest-kaia-release";
const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const SPOTIFY_TRACK_ID = /^[A-Za-z0-9]{22}$/;

type StreamingMilestone = "ONE_MINUTE" | "COMPLETED";

function getYouTubeVideoId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId: string | null = null;

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") videoId = url.searchParams.get("v");
      else {
        const [first, second] = url.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(first)) videoId = second ?? null;
      }
    }

    return videoId && YOUTUBE_VIDEO_ID.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

function getSpotifyTrackId(value: string): string | null {
  if (!value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.hostname.toLowerCase().replace(/^www\./, "") !== "open.spotify.com") return null;
    const [, type, trackId] = url.pathname.split("/");
    return type === "track" && trackId && SPOTIFY_TRACK_ID.test(trackId) ? trackId : null;
  } catch {
    return null;
  }
}

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized. Admin role required.");
}

/** Update the one YouTube release featured on every student dashboard. */
export async function updateFeaturedRelease(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const videoId = getYouTubeVideoId(String(formData.get("youtubeUrl") ?? ""));
  const spotifyInput = String(formData.get("spotifyUrl") ?? "");
  const spotifyTrackId = getSpotifyTrackId(spotifyInput);
  if (!title) throw new Error("Release title is required.");
  if (!videoId) throw new Error("Enter a valid YouTube watch, short, embed, live, or youtu.be URL.");
  if (spotifyInput.trim() && !spotifyTrackId) throw new Error("Enter a valid Spotify track URL.");

  await db
    .insert(featuredReleases)
    .values({ id: FEATURED_RELEASE_ID, title: title.slice(0, 120), videoId, spotifyTrackId, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: featuredReleases.id,
      set: { title: title.slice(0, 120), videoId, spotifyTrackId, updatedAt: new Date() },
    });

  revalidatePath("/dashboard");
  revalidatePath("/admin/release");
}

/** Award each fixed streaming milestone at most once for the active release. */
export async function claimStreamingReward(videoId: string, milestone: StreamingMilestone) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!YOUTUBE_VIDEO_ID.test(videoId)) throw new Error("Invalid video");

  const release = await db.query.featuredReleases.findFirst({
    where: eq(featuredReleases.id, FEATURED_RELEASE_ID),
  });
  if (!release || release.videoId !== videoId) throw new Error("This release is no longer active.");

  const existing = await db.query.userStreamRewards.findFirst({
    where: and(eq(userStreamRewards.userId, session.user.id), eq(userStreamRewards.videoId, videoId)),
  });

  const isComplete = milestone === "COMPLETED";
  const needsMinute = !existing?.oneMinuteAwarded;
  const needsCompletion = isComplete && !existing?.completedAwarded;
  const points = (needsMinute ? 10 : 0) + (needsCompletion ? 50 : 0);

  if (points === 0) return { awarded: 0, alreadyAwarded: true };

  if (existing) {
    await db
      .update(userStreamRewards)
      .set({
        oneMinuteAwarded: existing.oneMinuteAwarded || needsMinute,
        completedAwarded: existing.completedAwarded || needsCompletion,
        oneMinuteAwardedAt: needsMinute ? new Date() : existing.oneMinuteAwardedAt,
        completedAwardedAt: needsCompletion ? new Date() : existing.completedAwardedAt,
      })
      .where(eq(userStreamRewards.id, existing.id));
  } else {
    await db.insert(userStreamRewards).values({
      userId: session.user.id,
      videoId,
      oneMinuteAwarded: needsMinute,
      completedAwarded: needsCompletion,
      oneMinuteAwardedAt: needsMinute ? new Date() : undefined,
      completedAwardedAt: needsCompletion ? new Date() : undefined,
    });
  }

  await addPoints(points, isComplete ? "KAIA release stream completed" : "KAIA release streamed for 1 minute", videoId);
  revalidatePath("/dashboard");
  return { awarded: points, alreadyAwarded: false };
}
