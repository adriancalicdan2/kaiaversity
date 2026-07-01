import type { Metadata } from "next";
import Link from "next/link";
import { KAIA_MEMBERS } from "@/lib/constants/members";

export const metadata: Metadata = {
  title: "KAIAVERSITY — Welcome, ZAIA!",
  description:
    "The official fan university of KAIA. Earn points, level up, and get closer to Angela, Charice, Alexa, Sophia, and Charlotte.",
};

const STATS = [
  { value: "5", label: "Professors" },
  { value: "7", label: "Daily Quests" },
  { value: "15", label: "Achievements" },
  { value: "6", label: "Levels" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Enroll",
    desc: "Sign in with Google or Demo Login and become an official ZAIA student.",
    icon: "🎓",
  },
  {
    step: "02",
    title: "Learn",
    desc: "Read lectures, diaries, and announcements from your professors.",
    icon: "📚",
  },
  {
    step: "03",
    title: "Earn",
    desc: "Complete daily quests, like posts, and interact to earn points.",
    icon: "⭐",
  },
  {
    step: "04",
    title: "Level Up",
    desc: "Rise from Freshman to Professor's Assistant and unlock achievements.",
    icon: "🏆",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden">
      {/* ── Background effects ────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, #FF6B9D 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── Navbar ────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kaiaversity.png"
            alt="KAIAVERSITY Logo"
            className="h-12 w-auto object-contain"
          />
        </div>
        <Link
          href="/admissions"
          className="btn-glow text-sm"
          style={{
            background: "linear-gradient(135deg, #FF6B9D, #8B5CF6)",
            color: "white",
            padding: "10px 24px",
            borderRadius: "10px",
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.3s",
          }}
        >
          Enroll Now
        </Link>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative z-10 text-center px-6 pt-16 pb-24 max-w-5xl mx-auto">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
          style={{
            background: "rgba(139,92,246,0.15)",
            border: "1px solid rgba(139,92,246,0.3)",
            color: "#a78bfa",
          }}
        >
          <span>✨</span>
          <span>Now Open for Enrollment — Free Forever</span>
        </div>

        <h1
          className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight"
          style={{
            background:
              "linear-gradient(135deg, #ffffff 0%, #FF6B9D 40%, #8B5CF6 70%, #06B6D4 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Welcome to
          <br />
          KAIAVERSITY
        </h1>

        <p
          className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "#94a3b8" }}
        >
          The official fan university of{" "}
          <strong style={{ color: "#FF6B9D" }}>KAIA</strong>. Earn points,
          complete daily quests, unlock achievements, and get closer to your
          professors — one lecture at a time.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/admissions"
            style={{
              background: "linear-gradient(135deg, #FF6B9D, #8B5CF6)",
              color: "white",
              padding: "14px 36px",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "16px",
              textDecoration: "none",
              display: "inline-block",
              boxShadow: "0 8px 30px rgba(255,107,157,0.35)",
              transition: "all 0.3s",
            }}
          >
            🎓 Enroll as ZAIA
          </Link>
          <Link
            href="#professors"
            style={{
              color: "#94a3b8",
              padding: "14px 36px",
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "16px",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              transition: "all 0.3s",
            }}
          >
            Meet the Professors →
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-2xl mx-auto">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="glass py-4 px-2 text-center"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                backdropFilter: "blur(16px)",
              }}
            >
              <div
                className="text-3xl font-black"
                style={{ color: "#8B5CF6" }}
              >
                {s.value}
              </div>
              <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Professors ────────────────────────────────────────── */}
      <section id="professors" className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-bold text-center mb-4"
          style={{ color: "white" }}
        >
          Meet Your{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #FF6B9D, #8B5CF6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Professors
          </span>
        </h2>
        <p className="text-center mb-12" style={{ color: "#94a3b8" }}>
          5 talented members. Each with their own class to teach.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {KAIA_MEMBERS.map((member) => (
            <div
              key={member.slug}
              className="member-card"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${member.color}30`,
                borderRadius: "16px",
                padding: "24px 16px",
                textAlign: "center",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
            >
              {/* Avatar placeholder with member emoji */}
              <div
                className="mx-auto mb-4 flex items-center justify-center text-4xl"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: `${member.color}20`,
                  border: `2px solid ${member.color}50`,
                }}
              >
                {member.emoji}
              </div>
              <h3 className="font-bold text-sm mb-1" style={{ color: member.color }}>
                {member.name}
              </h3>
              <p className="text-xs" style={{ color: "#64748b" }}>
                {member.position.slice(0, 2).join(" · ")}
              </p>
              <div
                className="mt-3 text-xs px-3 py-1 rounded-full inline-block"
                style={{
                  background: `${member.color}15`,
                  color: member.color,
                  border: `1px solid ${member.color}30`,
                }}
              >
                {member.hometown.split(",")[0]}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-20 max-w-5xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-bold text-center mb-14"
          style={{ color: "white" }}
        >
          How{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #06B6D4, #8B5CF6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            It Works
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((step) => (
            <div
              key={step.step}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "28px 20px",
                position: "relative",
                backdropFilter: "blur(16px)",
              }}
            >
              <div
                className="text-xs font-bold mb-4 tracking-widest"
                style={{ color: "#8B5CF6" }}
              >
                STEP {step.step}
              </div>
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="font-bold text-lg mb-2" style={{ color: "white" }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-20">
        <div
          className="max-w-3xl mx-auto text-center rounded-2xl p-12"
          style={{
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(255,107,157,0.2))",
            border: "1px solid rgba(139,92,246,0.3)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="text-5xl mb-6">🎓</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "white" }}>
            Ready to Enroll?
          </h2>
          <p className="mb-8" style={{ color: "#94a3b8" }}>
            Join thousands of ZAIAs. It&apos;s free — forever.
          </p>
          <Link
            href="/admissions"
            style={{
              background: "linear-gradient(135deg, #FF6B9D, #8B5CF6)",
              color: "white",
              padding: "16px 48px",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "18px",
              textDecoration: "none",
              display: "inline-block",
              boxShadow: "0 8px 40px rgba(255,107,157,0.4)",
            }}
          >
            Start Your Journey →
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer
        className="relative z-10 text-center py-8 px-6"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          color: "#475569",
          fontSize: "14px",
        }}
      >
        <div className="flex items-center justify-center mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kaiaversity.png"
            alt="KAIAVERSITY Logo"
            className="h-6 w-auto object-contain"
          />
        </div>
        <p>Made with 💜 by ZAIAs, for ZAIAs. Not affiliated with KAIA&apos;s official management.</p>
        <p className="mt-1">Angela 🐻 · Charice 🍒 · Alexa 🐉 · Sophia 🦊 · Charlotte 🍊</p>
      </footer>
    </main>
  );
}
