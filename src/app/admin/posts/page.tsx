"use client";

import { useState, useTransition, useEffect } from "react";
import { createPost } from "@/lib/actions/posts";
import { KAIA_MEMBERS } from "@/lib/constants/members";
import { BookOpen, Book, Megaphone, ClipboardList, CheckCircle2, AlertCircle, PenTool, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { getProfMemberId } from "@/lib/constants/profMap";

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const userEmail = session?.user?.email;
  const userRole = session?.user?.role;

  const autoMemberId = getProfMemberId(userEmail) ?? undefined;

  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "LECTURE" as "LECTURE" | "ANNOUNCEMENT" | "DIARY" | "ASSIGNMENT",
    memberId: "",
  });

  useEffect(() => {
    if (autoMemberId && !form.memberId) {
      setForm((f) => ({ ...f, memberId: autoMemberId }));
    }
  }, [autoMemberId, form.memberId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    setError("");

    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content are required.");
      return;
    }

    startTransition(async () => {
      try {
        await createPost({
          title: form.title,
          content: form.content,
          type: form.type,
          memberId: form.memberId || undefined,
        });
        setSuccess(true);
        setForm({ title: "", content: "", type: "LECTURE", memberId: "" });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to create post.");
      }
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "11px 14px",
    color: "white",
    fontSize: 14,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#94a3b8",
    marginBottom: 6,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "white", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
        <PenTool size={26} style={{ color: "#a78bfa" }} />
        <span>Create Post</span>
      </h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>
        Post lectures, diary entries, announcements, or assignments.
      </p>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18, padding: "28px",
            display: "flex", flexDirection: "column", gap: 20,
          }}
        >
          {/* Professor */}
          <div>
            <label style={labelStyle}>Professor (Member)</label>
            {autoMemberId ? (
              <div
                style={{
                  ...inputStyle,
                  background: "rgba(139,92,246,0.1)",
                  border: "1px solid rgba(139,92,246,0.25)",
                  color: "#a78bfa",
                  fontWeight: 700,
                }}
              >
                Posting as {KAIA_MEMBERS.find((m) => m.id === autoMemberId)?.name}
              </div>
            ) : (
              <select
                value={form.memberId}
                onChange={(e) => setForm((f) => ({ ...f, memberId: e.target.value }))}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">— Select Professor —</option>
                {KAIA_MEMBERS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Post type */}
          <div>
            <label style={labelStyle}>Post Type</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["LECTURE", "DIARY", "ANNOUNCEMENT", "ASSIGNMENT"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type }))}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 99,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: form.type === type
                      ? "1px solid #8B5CF6"
                      : "1px solid rgba(255,255,255,0.1)",
                    background: form.type === type
                      ? "rgba(139,92,246,0.2)"
                      : "rgba(255,255,255,0.04)",
                    color: form.type === type ? "#a78bfa" : "#64748b",
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {type === "LECTURE" && <BookOpen size={14} />}
                    {type === "DIARY" && <Book size={14} />}
                    {type === "ANNOUNCEMENT" && <Megaphone size={14} />}
                    {type === "ASSIGNMENT" && <ClipboardList size={14} />}
                    <span>{type}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Enter post title..."
              style={inputStyle}
              required
            />
          </div>

          {/* Content */}
          <div>
            <label style={labelStyle}>Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Write your post here..."
              rows={8}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.7 }}
              required
            />
          </div>

          {/* Feedback */}
          {success && (
            <div
              style={{
                background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)",
                borderRadius: 10, padding: "12px 16px", color: "#34d399", fontSize: 14,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={16} />
                <span>Post published successfully!</span>
              </span>
            </div>
          )}
          {error && (
            <div
              style={{
                background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
                borderRadius: 10, padding: "12px 16px", color: "#f87171", fontSize: 14,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            style={{
              background: isPending
                ? "rgba(139,92,246,0.3)"
                : "linear-gradient(135deg, #FF6B9D, #8B5CF6)",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: "13px 28px",
              fontSize: 16,
              fontWeight: 700,
              cursor: isPending ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center", width: "100%" }}>
              {isPending ? (
                <span>Publishing…</span>
              ) : (
                <>
                  <span>Publish Post</span>
                  <Send size={16} />
                </>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
