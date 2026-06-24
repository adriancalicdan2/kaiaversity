import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: {
    default: "KAIAVERSITY — Learn, Grow, and Fangirl Together",
    template: "%s | KAIAVERSITY",
  },
  description:
    "The official fan university of KAIA. Enroll, earn points, complete daily quests, and get closer to your favorite professors — Angela, Charice, Alexa, Sophia, and Charlotte.",
  keywords: ["KAIA", "KAIAVERSITY", "ZAIA", "K-pop Philippines", "fan platform"],
  openGraph: {
    title: "KAIAVERSITY",
    description: "The official fan university of KAIA girl group",
    type: "website",
  },
};

import { AchievementToast } from "@/components/shared/AchievementToast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className={inter.className}>
        {children}
        <AchievementToast />
      </body>
    </html>
  );
}
