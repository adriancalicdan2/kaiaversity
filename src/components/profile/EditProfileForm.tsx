"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { updateProfile } from "@/lib/actions/profile";
import { KAIA_MEMBERS } from "@/lib/constants/members";
import { Pencil, X, Loader2, Check } from "lucide-react";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  bio: string | null;
  image: string | null;
  favoriteMember: string | null;
}

interface EditProfileFormProps {
  user: UserProfile;
}

export default function EditProfileForm({ user }: EditProfileFormProps) {
  const { update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [imageUrl, setImageUrl] = useState(user.image || "");
  const [favoriteMember, setFavoriteMember] = useState(user.favoriteMember || "");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await updateProfile(user.id, {
        name,
        bio: bio || null,
        favoriteMember: favoriteMember || null,
        image: imageUrl || null,
      });

      if (!res.success) {
        setError(res.error);
      } else {
        setSuccess(true);
        // Refresh NextAuth session instantly
        await update();
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 1200);
      }
    } catch (err: unknown) {
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
        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm"
      >
        <Pencil size={14} />
        <span>Edit Profile</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-[#0F0F16] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">Edit Profile Details</h3>
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
                  <Check size={14} /> Profile details updated successfully!
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                  placeholder="Your display name"
                />
              </div>

              {/* Profile Image URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Profile Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              {/* Favorite Member */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Favorite Professor
                </label>
                <select
                  value={favoriteMember}
                  onChange={(e) => setFavoriteMember(e.target.value)}
                  className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                >
                  <option value="">Select a member...</option>
                  {KAIA_MEMBERS.map((member) => (
                    <option key={member.id} value={member.slug}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Biography
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={250}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition resize-none"
                  placeholder="Tell ZAIAs a bit about yourself..."
                />
                <span className="text-[10px] text-slate-500 block text-right">
                  {bio.length}/250 characters
                </span>
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
                  disabled={loading || !name.trim()}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-violet-900/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
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
