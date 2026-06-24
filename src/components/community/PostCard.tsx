"use client";

import { useState } from "react";
import { formatTimeAgo } from "@/lib/utils";
import { likePost, addComment, getPostComments, recordPostView } from "@/lib/actions/posts";

interface CommentRow {
  id: string;
  content: string;
  createdAt: Date | null;
  likes: number | null;
  userId: string;
  userName: string | null;
  userRole: string | null;
}

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    excerpt: string | null;
    type: "LECTURE" | "ANNOUNCEMENT" | "DIARY" | "ASSIGNMENT";
    likes: number | null;
    views: number | null;
    createdAt: Date | null;
  };
  member?: {
    id: string;
    name: string;
    emoji: string | null;
    color: string | null;
  };
  initialLiked: boolean;
  currentUserId: string;
}

const POST_TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  LECTURE:      { bg: "rgba(6,182,212,0.15)",  color: "#06b6d4", label: "Lecture" },
  DIARY:        { bg: "rgba(236,72,153,0.15)", color: "#ec4899", label: "Diary" },
  ANNOUNCEMENT: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Announcement" },
  ASSIGNMENT:   { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Assignment" },
};

export default function PostCard({ post, member, initialLiked, currentUserId }: PostCardProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(post.likes ?? 0);
  const [viewsCount, setViewsCount] = useState(post.views ?? 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const typeStyle = POST_TYPE_STYLES[post.type] ?? POST_TYPE_STYLES.LECTURE;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);

    try {
      const res = await likePost(post.id);
      // Ensure sync with server response
      setLiked(res.liked);
    } catch (err) {
      // Revert if error
      setLiked(liked);
      setLikesCount(likesCount);
      console.error(err);
    }
  };

  const handleCardClick = async () => {
    setModalOpen(true);
    setLoadingComments(true);
    
    // Record view
    try {
      await recordPostView(post.id);
      setViewsCount(prev => prev + 1);
    } catch (err) {
      console.error(err);
    }

    // Load comments
    try {
      const fetched = await getPostComments(post.id);
      setComments(fetched as CommentRow[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const comment = await addComment(post.id, newComment.trim());
      
      // Prepend the new comment to the list
      const newRow: CommentRow = {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        likes: comment.likes,
        userId: comment.userId,
        userName: "You",
        userRole: "ZAIA", // Fallback, will sync on next load
      };
      
      setComments(prev => [newRow, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderLeft: member?.color ? `3px solid ${member.color}` : "3px solid #8B5CF6",
          borderRadius: 14,
          padding: "18px 20px",
          transition: "transform 0.2s, background-color 0.2s",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {member && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: member.color || "#8B5CF6",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {member.emoji} {member.name}
              </span>
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 99,
                background: typeStyle.bg,
                color: typeStyle.color,
              }}
            >
              {typeStyle.label}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#475569" }}>
            {post.createdAt ? formatTimeAgo(post.createdAt) : ""}
          </span>
        </div>

        <h3 style={{ color: "white", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
          {post.title}
        </h3>
        <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
          {post.excerpt ?? post.content.slice(0, 120)}…
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            type="button"
            onClick={handleLike}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: liked ? "#ef4444" : "#475569",
              fontSize: 13,
              fontWeight: 600,
              padding: 0,
            }}
          >
            <span style={{ fontSize: 16 }}>{liked ? "❤️" : "🤍"}</span>
            {likesCount}
          </button>
          
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#475569",
              fontSize: 13,
            }}
          >
            <span style={{ fontSize: 16 }}>👁️</span>
            {viewsCount}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#475569",
              fontSize: 13,
              marginLeft: "auto",
            }}
          >
            <span style={{ fontSize: 15 }}>💬</span>
            Discuss
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0d0d12",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              width: "100%",
              maxWidth: 600,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {member && (
                  <span style={{ color: member.color || "white", fontWeight: 700, fontSize: 14 }}>
                    {member.emoji} Prof. {member.name}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: typeStyle.bg,
                    color: typeStyle.color,
                  }}
                >
                  {typeStyle.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div style={{ overflowY: "auto", padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <h2 style={{ color: "white", fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
                  {post.title}
                </h2>
                <p style={{ color: "#475569", fontSize: 12, marginBottom: 16 }}>
                  Posted {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}
                </p>
                <div style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {post.content}
                </div>
              </div>

              {/* Likes/Views strip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  padding: "12px 0",
                }}
              >
                <button
                  type="button"
                  onClick={handleLike}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${liked ? "#ef444450" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: liked ? "#ef4444" : "#cbd5e1",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "6px 12px",
                  }}
                >
                  <span>{liked ? "❤️" : "🤍"}</span>
                  {likesCount} Likes
                </button>
                <span style={{ fontSize: 13, color: "#64748b" }}>
                  👁️ {viewsCount} views
                </span>
              </div>

              {/* Comments Section */}
              <div>
                <h3 style={{ color: "white", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
                  💬 Discussion
                </h3>

                {/* Add Comment Form */}
                <form onSubmit={handleCommentSubmit} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    disabled={submittingComment}
                    required
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "white",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 10,
                      background: "#8B5CF6",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 13,
                      border: "none",
                      cursor: submittingComment ? "not-allowed" : "pointer",
                      opacity: submittingComment ? 0.7 : 1,
                    }}
                  >
                    {submittingComment ? "Posting..." : "Comment"}
                  </button>
                </form>

                {/* Comments List */}
                {loadingComments ? (
                  <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 12 }}>
                    Loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 12 }}>
                    No comments yet. Start the conversation! ✨
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.04)",
                          borderRadius: 10,
                          padding: "10px 14px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: comment.userRole === "ADMIN" ? "#f59e0b" : comment.userRole === "PROFESSOR" ? "#10b981" : "#a78bfa" }}>
                            {comment.userName || "ZAIA"} {comment.userRole === "ADMIN" && "👑"}
                          </span>
                          <span style={{ fontSize: 10, color: "#334155" }}>
                            {comment.createdAt ? formatTimeAgo(comment.createdAt) : ""}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5, margin: 0 }}>
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
