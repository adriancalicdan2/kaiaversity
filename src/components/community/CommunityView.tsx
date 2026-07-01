"use client";

import { useState } from "react";
import GlobalChat from "./GlobalChat";
import { formatTimeAgo } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  createdAt: Date | null;
  likes: number | null;
  userId: string;
  postId: string;
}

interface CommunityViewProps {
  recentComments: Comment[];
}

export default function CommunityView({ recentComments }: CommunityViewProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "activity">("chat");

  return (
    <div className="space-y-6">
      {/* Tab Switcher Headers */}
      <div className="flex border-b border-white/10 gap-6">
        <button
          onClick={() => setActiveTab("chat")}
          className={`pb-4 text-sm font-semibold transition border-b-2 px-1 ${
            activeTab === "chat"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          💬 Global Chat
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`pb-4 text-sm font-semibold transition border-b-2 px-1 ${
            activeTab === "activity"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          🔔 Course Activity
        </button>
      </div>

      {/* Tab Content rendering */}
      {activeTab === "chat" ? (
        <GlobalChat />
      ) : (
        <div className="space-y-4">
          {recentComments.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
              <div className="text-4xl mb-4">💬</div>
              <p className="color-slate-400 text-sm">No course comments yet — be the first to speak up!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {recentComments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex gap-4 hover:border-white/10 transition"
                >
                  <div className="w-9 h-9 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-sm flex-shrink-0">
                    🎓
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-violet-400">
                        ZAIA STUDENT
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {comment.createdAt ? formatTimeAgo(comment.createdAt) : ""}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {comment.content}
                    </p>
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                      ❤️ {comment.likes ?? 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
