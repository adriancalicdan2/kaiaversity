import React from "react";
import {
  School,
  BookOpen,
  Heart,
  Share2,
  Palette,
  Sparkles,
  Users,
  Coffee,
  CloudRain,
  PenTool,
  Tv,
  Feather,
  Leaf,
  Music,
  HelpCircle,
  Calendar,
  Trophy,
  Flame,
  Zap,
  GraduationCap
} from "lucide-react";

interface EmojiIconProps {
  emoji: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function EmojiIcon({ emoji, size = 20, className, style }: EmojiIconProps) {
  const norm = emoji.trim();
  
  switch (norm) {
    case "🏫": return <School size={size} className={className} style={style} />;
    case "📖": 
    case "📚": return <BookOpen size={size} className={className} style={style} />;
    case "❤️": return <Heart size={size} className={className} style={style} />;
    case "📤": return <Share2 size={size} className={className} style={style} />;
    case "🎨": return <Palette size={size} className={className} style={style} />;
    case "🌟": 
    case "⭐": return <Sparkles size={size} className={className} style={style} />;
    case "🤝": 
    case "👥": 
    case "👯": return <Users size={size} className={className} style={style} />;
    case "☕": return <Coffee size={size} className={className} style={style} />;
    case "🌧️": 
    case "🌧": return <CloudRain size={size} className={className} style={style} />;
    case "✍️": 
    case "✍": return <PenTool size={size} className={className} style={style} />;
    case "📺": return <Tv size={size} className={className} style={style} />;
    case "🐦": return <Feather size={size} className={className} style={style} />;
    case "🥬": return <Leaf size={size} className={className} style={style} />;
    case "🎵": return <Music size={size} className={className} style={style} />;
    case "🎂": return <Calendar size={size} className={className} style={style} />;
    case "🏆": return <Trophy size={size} className={className} style={style} />;
    case "🔥": 
    case "🐉": return <Flame size={size} className={className} style={style} />;
    case "⚡": 
    case "🏍️": 
    case "🏍": return <Zap size={size} className={className} style={style} />;
    case "🎓": return <GraduationCap size={size} className={className} style={style} />;
    default:
      return <HelpCircle size={size} className={className} style={style} />;
  }
}
