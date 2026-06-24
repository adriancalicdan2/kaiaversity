import React from "react";
import { 
  GraduationCap, BookOpen, Star, Sparkles, Trophy, FileText, 
  MessageSquare, School, FlaskConical, Crown, Archive, Swords, 
  Landmark, Wand2, Gem 
} from "lucide-react";

interface LevelIconProps {
  badge: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function LevelIcon({ badge, size = 24, className, style }: LevelIconProps) {
  // Normalize by trimming any whitespace or special emoji variants
  const normalizedBadge = badge.trim();
  
  switch (normalizedBadge) {
    case "🎓": return <GraduationCap size={size} className={className} style={style} />;
    case "📚": return <BookOpen size={size} className={className} style={style} />;
    case "⭐": return <Star size={size} className={className} style={style} />;
    case "🌟": return <Sparkles size={size} className={className} style={style} />;
    case "🏆": return <Trophy size={size} className={className} style={style} />;
    case "📝": return <FileText size={size} className={className} style={style} />;
    case "🗣️": 
    case "🗣": return <MessageSquare size={size} className={className} style={style} />;
    case "🏫": return <School size={size} className={className} style={style} />;
    case "🔬": return <FlaskConical size={size} className={className} style={style} />;
    case "👑": return <Crown size={size} className={className} style={style} />;
    case "🗃️": 
    case "🗃": return <Archive size={size} className={className} style={style} />;
    case "⚔️": 
    case "⚔": return <Swords size={size} className={className} style={style} />;
    case "🏛️": 
    case "🏛": return <Landmark size={size} className={className} style={style} />;
    case "🔮": return <Wand2 size={size} className={className} style={style} />;
    case "💎": return <Gem size={size} className={className} style={style} />;
    default: return <GraduationCap size={size} className={className} style={style} />;
  }
}
