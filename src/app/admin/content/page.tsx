import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { togglePostPublished, togglePostPinned, deletePost } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Content Management — Admin" };

const POST_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  LECTURE:      { bg: "rgba(6,182,212,0.12)",   text: "#06b6d4" },
  ANNOUNCEMENT: { bg: "rgba(245,158,11,0.12)",  text: "#f59e0b" },
  DIARY:        { bg: "rgba(236,72,153,0.12)",  text: "#ec4899" },
  ASSIGNMENT:   { bg: "rgba(139,92,246,0.12)",  text: "#a78bfa" },
};

export default async function AdminContentPage() {
  const session = await auth();
  if (!session?.user || !["PROFESSOR", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const allPosts = await db.query.posts.findMany({
    orderBy: [desc(posts.createdAt)],
  });

  // Fetch authors separately
  const authorIds = [...new Set(allPosts.map((p) => p.authorId).filter(Boolean))] as string[];
  const authorsArr = authorIds.length > 0
    ? await db.query.users.findMany({ where: (u, { inArray }) => inArray(u.id, authorIds) })
    : [];
  const authorMap = Object.fromEntries(authorsArr.map((u) => [u.id, u]));

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4 }}>
            ✍️ Content Management
          </h1>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            {allPosts.length} total posts · Publish, pin, or remove content
          </p>
        </div>
        <Link
          href="/admin/posts"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg, #FF6B9D, #8B5CF6)",
            color: "white", textDecoration: "none",
            padding: "10px 18px", borderRadius: 10, fontWeight: 700, fontSize: 13,
          }}
        >
          ✍️ Create Post
        </Link>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16, overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)", color: "#475569" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Title</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Type</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Author</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700 }}>Views / Likes</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700 }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allPosts.map((post) => {
              const typeStyle = POST_TYPE_COLORS[post.type] ?? POST_TYPE_COLORS.LECTURE;
              const author = post.authorId ? authorMap[post.authorId] : null;
              return (
                <tr key={post.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", color: "#e2e8f0" }}>
                  <td style={{ padding: "13px 16px", maxWidth: 260 }}>
                    <div style={{ fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {post.pinned && <span style={{ color: "#f59e0b", marginRight: 4 }}>📌</span>}
                      {post.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "—"}
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: typeStyle.bg, color: typeStyle.text, letterSpacing: "0.05em" }}>
                      {post.type}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px", color: "#94a3b8", fontSize: 12 }}>
                    {author?.name ?? "Unknown"}
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "center" }}>
                    <span style={{ color: "#06b6d4" }}>{post.views ?? 0}</span>
                    <span style={{ color: "#475569" }}> / </span>
                    <span style={{ color: "#ec4899" }}>{post.likes ?? 0}</span>
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "center" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6,
                      background: post.published ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.12)",
                      color: post.published ? "#10b981" : "#64748b",
                    }}>
                      {post.published ? "LIVE" : "DRAFT"}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <form action={async () => { "use server"; await togglePostPublished(post.id, post.published ?? false); }}>
                        <button type="submit" style={btn(post.published ? "#64748b" : "#10b981")}>
                          {post.published ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                      <form action={async () => { "use server"; await togglePostPinned(post.id, post.pinned ?? false); }}>
                        <button type="submit" style={btn("#f59e0b")}>
                          {post.pinned ? "Unpin" : "Pin"}
                        </button>
                      </form>
                      <form action={async () => { "use server"; await deletePost(post.id); }}>
                        <button type="submit" style={btn("#ef4444")}>🗑</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {allPosts.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#475569" }}>
            No posts yet. <Link href="/admin/posts" style={{ color: "#8b5cf6" }}>Create the first one →</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function btn(color: string): React.CSSProperties {
  return {
    fontSize: 11, fontWeight: 700, color: "white",
    background: `${color}18`, border: `1px solid ${color}50`,
    padding: "4px 10px", borderRadius: 6, cursor: "pointer",
  };
}
