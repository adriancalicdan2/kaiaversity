"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { getFirebaseFirestore, isFirebaseConfigured } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Send, Crown, Feather, GraduationCap, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  text: string;
  createdAt: Timestamp | null;
  uid: string;
  name: string;
  role: "ADMIN" | "PROFESSOR" | "ZAIA";
  points?: number;
  level?: number;
  image?: string | null;
}

export default function GlobalChat() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firebaseReady = isFirebaseConfigured();

  // 1. Subscribe to Firestore Global Chat Messages
  useEffect(() => {
    if (!firebaseReady) {
      return;
    }

    const db = getFirebaseFirestore();
    const q = query(collection(db, "global-chat"), orderBy("createdAt", "desc"), limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          msgs.push({
            id: doc.id,
            text: data.text || "",
            createdAt: data.createdAt,
            uid: data.uid || "",
            name: data.name || "Anonymous",
            role: data.role || "ZAIA",
            points: data.points || 0,
            level: data.level || 1,
            image: data.image || null,
          });
        });
        // Reverse array to display chronologically
        setMessages(msgs.reverse());
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Global Chat Subscription error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseReady]);

  // 2. Auto-scroll to bottom of the chat container
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Handle Message Sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending || !session?.user) return;

    setSending(true);
    const messageText = inputText.trim();
    setInputText("");

    try {
      const db = getFirebaseFirestore();
      await addDoc(collection(db, "global-chat"), {
        text: messageText,
        createdAt: serverTimestamp(),
        uid: session.user.id,
        name: session.user.name || "Anonymous",
        role: session.user.role || "ZAIA",
        points: session.user.points || 0,
        level: session.user.level || 1,
        image: session.user.image || null,
      });
    } catch (error) {
      console.error("Failed to send message to Firestore:", error);
      alert("Could not deliver message. Please make sure Firestore is enabled.");
    } finally {
      setSending(false);
    }
  };



  // Helper to style roles
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
            <Crown size={10} className="fill-red-400/20" /> ADMIN
          </span>
        );
      case "PROFESSOR":
        return (
          <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
            <Feather size={10} /> MEMBER
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
            <GraduationCap size={10} /> ZAIA
          </span>
        );
    }
  };

  // Helper to generate role-based avatar fallback styling
  const getAvatarBg = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-gradient-to-br from-red-500 to-rose-600 text-white";
      case "PROFESSOR":
        return "bg-gradient-to-br from-emerald-400 to-teal-600 text-white";
      default:
        return "bg-gradient-to-br from-violet-500 to-indigo-600 text-white";
    }
  };

  if (status === "loading" || (firebaseReady && loading)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="animate-spin text-violet-500 mb-3" size={36} />
        <p className="text-sm">Connecting to global chat channel...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md mx-auto">
        <span className="text-4xl mb-4 block">💬</span>
        <h3 className="text-lg font-bold text-white mb-2">Sign In Required</h3>
        <p className="text-slate-400 text-sm mb-4">
          Please sign in to read and participate in the real-time global chat with other members.
        </p>
      </div>
    );
  }

  if (!firebaseReady) {
    return (
      <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md mx-auto">
        <span className="text-4xl mb-4 block">âš ï¸</span>
        <h3 className="text-lg font-bold text-white mb-2">Chat Unavailable</h3>
        <p className="text-slate-400 text-sm">Global chat is unavailable until Firebase is configured.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[650px] bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Chat Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
            <span className="text-3xl">✨</span>
            <p className="text-sm">This is the beginning of the global chat.</p>
            <p className="text-xs text-slate-600">Send the first message to say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.uid === session.user.id;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start animate-fade-in ${
                  isSelf ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* User Avatar */}
                <div
                  className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-md border border-white/10 overflow-hidden ${getAvatarBg(
                    msg.role
                  )}`}
                >
                  {msg.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={msg.image}
                      alt={msg.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/kaiaversity.png";
                      }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/kaiaversity.png"
                      alt={msg.name}
                      className="w-full h-full object-cover p-1 bg-black/30"
                    />
                  )}
                </div>

                {/* Message Block */}
                <div className={`flex flex-col max-w-[70%] ${isSelf ? "items-end" : "items-start"}`}>
                  {/* Sender Metadata Above Message Bubble */}
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-slate-300">
                      {msg.name}
                    </span>
                    {getRoleBadge(msg.role)}
                    {msg.level && msg.level > 0 && (
                      <span className="text-[10px] text-slate-500 bg-white/5 px-1 py-0.2 rounded font-medium border border-white/5">
                        Lvl {msg.level}
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm break-words max-w-full ${
                      isSelf
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none"
                        : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 bg-black/20 border-t border-white/5 flex gap-2 items-center"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message to the community..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition text-sm"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-xl p-3 font-semibold flex items-center justify-center transition shadow-lg shadow-violet-900/30"
        >
          {sending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Send size={18} className="fill-white/10" />
          )}
        </button>
      </form>
    </div>
  );
}
