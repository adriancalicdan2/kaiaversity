"use client";

import { useState } from "react";
import { adjustUserPoints } from "@/lib/actions/admin";
import { PlusCircle, X, Loader2, Check, Sparkles } from "lucide-react";

interface AdjustPointsModalProps {
  userId: string;
  userName: string;
  currentPoints: number;
}

export default function AdjustPointsModal({
  userId,
  userName,
  currentPoints,
}: AdjustPointsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<string>("50");
  const [mode, setMode] = useState<"ADD" | "DEDUCT">("ADD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(amount, 10);
    if (isNaN(num) || num <= 0) {
      setError("Please enter a valid positive number.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const delta = mode === "ADD" ? num : -num;

    try {
      await adjustUserPoints(userId, delta);
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setAmount("50");
      }, 1000);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to adjust points.");
    } finally {
      setLoading(false);
    }
  };

  const setQuickAmount = (val: number, newMode: "ADD" | "DEDUCT" = "ADD") => {
    setAmount(val.toString());
    setMode(newMode);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-md hover:bg-emerald-500/25 transition cursor-pointer"
      >
        <PlusCircle size={12} />
        <span>Adjust Pts</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-sm bg-[#0F0F16] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Adjust User Points</h3>
                  <p className="text-xs text-slate-400">
                    {userName} · Current: <span className="text-amber-400 font-semibold">{currentPoints.toLocaleString()} pts</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-xl text-xs font-medium">
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check size={14} /> Points updated successfully!
                </div>
              )}

              {/* Action Mode Toggle */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setMode("ADD")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    mode === "ADD"
                      ? "bg-emerald-500 text-black shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  + Add Points
                </button>
                <button
                  type="button"
                  onClick={() => setMode("DEDUCT")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    mode === "DEDUCT"
                      ? "bg-rose-500 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  − Deduct Points
                </button>
              </div>

              {/* Custom Number Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Amount to {mode === "ADD" ? "Award" : "Deduct"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter points (e.g. 100, 500, 1000)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-500">
                    PTS
                  </span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick Presets
                </span>
                <div className="flex gap-1.5 flex-wrap">
                  {[20, 50, 100, 250, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuickAmount(preset, mode)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-semibold text-slate-300 transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2 justify-end pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !amount}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg ${
                    mode === "ADD"
                      ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                      : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={13} />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>{mode === "ADD" ? `Add +${amount || 0} pts` : `Deduct -${amount || 0} pts`}</span>
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
