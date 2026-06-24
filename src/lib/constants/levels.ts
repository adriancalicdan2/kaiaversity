export interface Level {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  badge: string;
}

export const LEVELS: Level[] = [
  { level: 1, title: "Freshman",            minPoints: 0,    maxPoints: 500,  color: "#94a3b8", badge: "🎓" },
  { level: 2, title: "Sophomore",           minPoints: 501,  maxPoints: 1500, color: "#60a5fa", badge: "📚" },
  { level: 3, title: "Junior",              minPoints: 1501, maxPoints: 3000, color: "#34d399", badge: "⭐" },
  { level: 4, title: "Senior",              minPoints: 3001, maxPoints: 5000, color: "#f59e0b", badge: "🌟" },
  { level: 5, title: "Graduate",            minPoints: 5001, maxPoints: 8000, color: "#a78bfa", badge: "🏆" },
  { level: 6, title: "Assistant Lecturer",   minPoints: 8001, maxPoints: 12000, color: "#f43f5e", badge: "📝" },
  { level: 7, title: "Lecturer",             minPoints: 12001, maxPoints: 17000, color: "#ec4899", badge: "🗣️" },
  { level: 8, title: "Assistant Professor",  minPoints: 17001, maxPoints: 23000, color: "#8b5cf6", badge: "🏫" },
  { level: 9, title: "Associate Professor",  minPoints: 23001, maxPoints: 30000, color: "#3b82f6", badge: "🔬" },
  { level: 10, title: "Professor",           minPoints: 30001, maxPoints: 38000, color: "#10b981", badge: "👑" },
  { level: 11, title: "Dean of Students",    minPoints: 38001, maxPoints: 47000, color: "#14b8a6", badge: "🗃️" },
  { level: 12, title: "Vice Chancellor",     minPoints: 47001, maxPoints: 57000, color: "#f59e0b", badge: "⚔️" },
  { level: 13, title: "Chancellor",          minPoints: 57001, maxPoints: 68000, color: "#6366f1", badge: "🏛️" },
  { level: 14, title: "Grand Scholar",       minPoints: 68001, maxPoints: 80000, color: "#d946ef", badge: "🔮" },
  { level: 15, title: "ZAIA Legend",         minPoints: 80001, maxPoints: Infinity, color: "#f43f5e", badge: "💎" },
];

export const POINTS = {
  DAILY_LOGIN: 10,
  READ_POST: 20,
  WRITE_COMMENT: 5,
  LIKE_POST: 2,
  SHARE_CONTENT: 15,
  COMPLETE_QUEST: 15,
  ATTEND_EVENT: 50,
  MEMBER_REACTION: 100,
  REFER_FRIEND: 200,
} as const;

export const DAILY_CAPS = {
  COMMENTS: 50,   // max points from comments per day
  LIKES: 20,      // max points from likes per day
  SHARES: 30,     // max points from shares per day
} as const;

export function getLevelFromPoints(points: number): Level {
  return (
    [...LEVELS].reverse().find((l) => points >= l.minPoints) ?? LEVELS[0]
  );
}

export function getProgressToNextLevel(points: number): {
  current: Level;
  next: Level | null;
  progress: number; // 0-100
  pointsNeeded: number;
} {
  const current = getLevelFromPoints(points);
  const nextIndex = LEVELS.findIndex((l) => l.level === current.level + 1);
  const next = nextIndex !== -1 ? LEVELS[nextIndex] : null;

  if (!next) {
    return { current, next: null, progress: 100, pointsNeeded: 0 };
  }

  const range = next.minPoints - current.minPoints;
  const earned = points - current.minPoints;
  const progress = Math.min(100, Math.floor((earned / range) * 100));
  const pointsNeeded = next.minPoints - points;

  return { current, next, progress, pointsNeeded };
}
