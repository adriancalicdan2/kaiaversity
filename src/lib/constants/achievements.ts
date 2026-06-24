export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  category: "member" | "level" | "social" | "event";
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Member-specific ──────────────────────────────────────────
  {
    id: "ach-coffee-lover",
    name: "Coffee Lover",
    description: "Read 10 of Alexa's posts ☕",
    icon: "☕",
    points: 50,
    rarity: "COMMON",
    category: "member",
  },
  {
    id: "ach-twin-whisperer",
    name: "Twin Whisperer",
    description: "Interact with both Angela 🐻 and Charice 🍒",
    icon: "👯",
    points: 50,
    rarity: "COMMON",
    category: "member",
  },
  {
    id: "ach-rain-seeker",
    name: "Rain Seeker",
    description: "Login on 5 different days",
    icon: "🌧️",
    points: 100,
    rarity: "RARE",
    category: "social",
  },
  {
    id: "ach-handwriting-expert",
    name: "Handwriting Expert",
    description: "Read 5 of Angela's posts 🐻",
    icon: "✍️",
    points: 50,
    rarity: "COMMON",
    category: "member",
  },
  {
    id: "ach-motorcycle-diaries",
    name: "Motorcycle Diaries",
    description: "Read all of Charice's DIARY posts 🏍️",
    icon: "🏍️",
    points: 100,
    rarity: "RARE",
    category: "member",
  },
  {
    id: "ach-kdrama-fan",
    name: "K-Drama Fan",
    description: "Engage with 10 of Charlotte's posts 🍊",
    icon: "📺",
    points: 50,
    rarity: "COMMON",
    category: "member",
  },
  {
    id: "ach-early-bird",
    name: "Early Bird",
    description: "Attend 3 live events",
    icon: "🐦",
    points: 150,
    rarity: "RARE",
    category: "event",
  },
  {
    id: "ach-okra-enthusiast",
    name: "Okra Enthusiast",
    description: "Comment on 5 of Charlotte's posts 🍊",
    icon: "🥬",
    points: 50,
    rarity: "COMMON",
    category: "member",
  },
  {
    id: "ach-taylors-version",
    name: "Taylor's Version",
    description: "Read all of Sophia's published posts 🦊",
    icon: "🎵",
    points: 200,
    rarity: "EPIC",
    category: "member",
  },
  {
    id: "ach-mayonnaise-debate",
    name: "Mayonnaise Debate",
    description: "Comment on 5 of Angela's posts 🐻",
    icon: "🫙",
    points: 50,
    rarity: "COMMON",
    category: "member",
  },
  // ── Level-based ───────────────────────────────────────────────
  {
    id: "ach-freshman",
    name: "Freshman",
    description: "Welcome to KAIAVERSITY! You've enrolled.",
    icon: "🎓",
    points: 0,
    rarity: "COMMON",
    category: "level",
  },
  {
    id: "ach-sophomore",
    name: "Sophomore",
    description: "Reach Level 2 — Sophomore",
    icon: "📚",
    points: 0,
    rarity: "COMMON",
    category: "level",
  },
  {
    id: "ach-junior",
    name: "Junior",
    description: "Reach Level 3 — Junior",
    icon: "⭐",
    points: 0,
    rarity: "RARE",
    category: "level",
  },
  {
    id: "ach-senior",
    name: "Senior",
    description: "Reach Level 4 — Senior",
    icon: "🌟",
    points: 0,
    rarity: "EPIC",
    category: "level",
  },
  {
    id: "ach-graduate",
    name: "Graduate",
    description: "Reach Level 5 — Graduate. You made it!",
    icon: "🏆",
    points: 500,
    rarity: "LEGENDARY",
    category: "level",
  },
];

export const RARITY_COLORS: Record<Achievement["rarity"], string> = {
  COMMON:    "#94a3b8",
  RARE:      "#60a5fa",
  EPIC:      "#a78bfa",
  LEGENDARY: "#f59e0b",
};
