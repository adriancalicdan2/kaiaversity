export interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  type: "daily" | "weekly";
}

export const DAILY_QUESTS: Quest[] = [
  {
    id: "quest-daily-login",
    title: "Daily Login",
    description: "Check in to KAIAVERSITY today",
    points: 10,
    icon: "🏫",
    type: "daily",
  },
  {
    id: "quest-read-lecture",
    title: "Read a Lecture",
    description: "Read any post from your favorite professor",
    points: 20,
    icon: "📖",
    type: "daily",
  },
  {
    id: "quest-show-love",
    title: "Show Some Love",
    description: "Like and comment on 3 posts",
    points: 15,
    icon: "❤️",
    type: "daily",
  },
  {
    id: "quest-share-joy",
    title: "Share the Joy",
    description: "Share a post on social media",
    points: 15,
    icon: "📤",
    type: "daily",
  },
  {
    id: "quest-fan-art",
    title: "Fan Art Appreciation",
    description: "React to 5 posts in the community gallery",
    points: 10,
    icon: "🎨",
    type: "daily",
  },
  {
    id: "quest-professor-spotlight",
    title: "Professor Spotlight",
    description: "Read the latest post from any professor",
    points: 20,
    icon: "🌟",
    type: "daily",
  },
  {
    id: "quest-community-helper",
    title: "Community Helper",
    description: "Reply to 3 other ZAIA comments",
    points: 15,
    icon: "🤝",
    type: "daily",
  },
];
