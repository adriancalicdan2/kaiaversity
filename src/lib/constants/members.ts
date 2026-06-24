export type MemberSlug = "angela" | "charice" | "alexa" | "sophia" | "charlotte";

export interface KaiaMember {
  id: string;
  slug: MemberSlug;
  name: string;
  stageName: string;
  fullName: string;
  position: string[];
  birthday: string;
  age?: number;
  zodiac: string;
  height: string;
  weight: string;
  mbti: string | null;
  emoji: string;
  color: string;
  colorName: string;
  motto: string;
  funFacts: string[];
  profileImage: string;
  hometown: string;
  roleModels?: string[];
  favoriteArtists?: string[];
}

export const KAIA_MEMBERS: KaiaMember[] = [
  {
    id: "member-angela",
    slug: "angela",
    name: "Angela",
    stageName: "Angela",
    fullName: "Angela",
    position: ["Leader", "Vocalist", "Dancer"],
    birthday: "November 3, 1998",
    zodiac: "Scorpio",
    height: "165 cm",
    weight: "47 kg",
    mbti: null,
    emoji: "🐻",
    color: "#8B4513",
    colorName: "Brown",
    motto: "Make everyday your masterpiece",
    hometown: "Cavite, Philippines",
    funFacts: [
      "From Cavite, Philippines",
      "Has a twin sister named Charice",
      "Loves cats — has a kitten named Kohui",
      "Loves rainy days",
      "Can play guitar",
      "Her handwriting is hard to understand",
      "Favorite K-pop idol: Chanyeol (EXO)",
    ],
    profileImage: "/images/members/angela.jpg",
  },
  {
    id: "member-charice",
    slug: "charice",
    name: "Charice",
    stageName: "Charice",
    fullName: "Charice",
    position: ["Rapper", "Dancer"],
    birthday: "November 3, 1998",
    zodiac: "Scorpio",
    height: "163 cm",
    weight: "47 kg",
    mbti: "ISTJ",
    emoji: "🍒",
    color: "#DE3163",
    colorName: "Cherry Red",
    motto: "Take the risk, or lose a chance",
    hometown: "Cavite, Philippines",
    favoriteArtists: ["Justin Bieber", "Taylor Swift"],
    funFacts: [
      "From Cavite, Philippines",
      "Twin sister of Angela",
      "Calls herself 'Cha'",
      "Shy and quiet in person",
      "Can drive a motorcycle",
      "Has braces",
      "Favorite artists: Justin Bieber & Taylor Swift",
    ],
    profileImage: "/images/members/charice.jpg",
  },
  {
    id: "member-alexa",
    slug: "alexa",
    name: "Alexa",
    stageName: "Alexa",
    fullName: "Alexa",
    position: ["Rapper", "Dancer"],
    birthday: "May 20, 2000",
    zodiac: "Taurus",
    height: "155 cm",
    weight: "40 kg",
    mbti: null,
    emoji: "🐉",
    color: "#FFD700",
    colorName: "Golden Yellow",
    motto: "If life gives you lemons, squeeze them in people's eyes",
    hometown: "Las Piñas City, Philippines",
    roleModels: ["Jeon Soyeon", "CL"],
    funFacts: [
      "From Las Piñas City",
      "Calls herself 'Alexa Kyutie'",
      "Loves coffee — drinks it a lot",
      "Loves rainy days",
      "Hobby: watching anime",
      "Cleanest member of the group",
      "Role models: Jeon Soyeon & CL",
    ],
    profileImage: "/images/members/alexa.jpg",
  },
  {
    id: "member-sophia",
    slug: "sophia",
    name: "Sophia",
    stageName: "Sophia",
    fullName: "Sophia",
    position: ["Vocalist", "Dancer"],
    birthday: "August 22, 2001",
    zodiac: "Leo",
    height: "160 cm",
    weight: "49 kg",
    mbti: "ISTJ",
    emoji: "🦊",
    color: "#FF2400",
    colorName: "Scarlet",
    motto: "Work until you no longer have to introduce yourself",
    hometown: "Manila, Philippines",
    roleModels: ["Taylor Swift"],
    funFacts: [
      "From Manila, Philippines",
      "Favorite colors: red and pink",
      "Can drink coffee all day and still sleep",
      "Wears glasses — -4.00 eye grade",
      "Was a backup dancer for SB19",
      "Role model: Taylor Swift",
    ],
    profileImage: "/images/members/sophia.jpg",
  },
  {
    id: "member-charlotte",
    slug: "charlotte",
    name: "Charlotte",
    stageName: "Charlotte",
    fullName: "Charlotte",
    position: ["Rapper", "Dancer", "Vocalist"],
    birthday: "October 9, 2001",
    zodiac: "Libra",
    height: "158 cm",
    weight: "40 kg",
    mbti: "INFP-T",
    emoji: "🍊",
    color: "#98FF98",
    colorName: "Mint Green",
    motto: "Everything happens for a reason",
    hometown: "Quezon City, Philippines",
    funFacts: [
      "From Quezon City, Philippines — the Bunso (youngest)!",
      "Favorite animal: otter",
      "Loves eating okra",
      "Loves rainy days",
      "Was in a cheerleading squad",
      "Can understand some Korean",
    ],
    profileImage: "/images/members/charlotte.jpg",
  },
];

export const getMemberBySlug = (slug: string): KaiaMember | undefined =>
  KAIA_MEMBERS.find((m) => m.slug === slug);

export const getMemberById = (id: string): KaiaMember | undefined =>
  KAIA_MEMBERS.find((m) => m.id === id);
