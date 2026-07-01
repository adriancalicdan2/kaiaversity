"use client";

import { useState } from "react";
import { addCourseModule } from "@/lib/actions/admin";
import { BookOpen, X, Loader2, Check, Plus } from "lucide-react";

interface CreateModuleModalProps {
  courseId: string;
}

export default function CreateModuleModal({ courseId }: CreateModuleModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pointsReward, setPointsReward] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await addCourseModule(courseId, title, content, pointsReward);

      if (!res.success) {
        setError(res.error || "Failed to add lesson.");
      } else {
        setSuccess(true);
        setTitle("");
        setContent("");
        setPointsReward(10);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-violet-500/10"
      >
        <Plus size={14} />
        <span>Add Lesson</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-[#0F0F16] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-[#a78bfa]" />
                <h3 className="text-lg font-bold text-white">Add New Lecture / Lesson</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Alert Blocks */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-medium">
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check size={14} /> Lesson added successfully!
                </div>
              )}

              {/* Lesson Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Lesson Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                  placeholder="e.g. Introduction to Vocal Warmups"
                />
              </div>

              {/* Points Reward */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  XP Points Reward
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={pointsReward}
                  onChange={(e) => setPointsReward(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                />
              </div>

              {/* Lesson Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Lecture Material (Content)
                </label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition resize-none font-sans"
                  placeholder="Write the lecture study content here (Markdown or text)..."
                />
              </div>

              {/* Actions Footer */}
              <div className="flex gap-3 justify-end pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !title || !content}
                  className="px-5 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-violet-500/10"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Lesson</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
