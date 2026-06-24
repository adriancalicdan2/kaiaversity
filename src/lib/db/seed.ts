import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { config } from "dotenv";
import * as schema from "./schema";
import { ACHIEVEMENTS } from "../constants/achievements";
import { DAILY_QUESTS } from "../constants/quests";
import { KAIA_MEMBERS } from "../constants/members";

config({ path: ".env.local" });

const MOCK_USERS = [
  {
    id: "admin-prof",
    name: "KAIA Admin",
    email: "admin@kaiaversity.com",
    role: "ADMIN" as const,
    points: 10000,
    level: 6,
  },
];

const SAMPLE_POSTS = [
  {
    title: "Welcome to KAIAVERSITY, ZAIAs! 🐻",
    content: "I'm so excited to launch our very own university! Here we can learn, grow, and have fun together. Make sure to complete your daily quests and earn those points!",
    type: "ANNOUNCEMENT" as const,
    memberId: KAIA_MEMBERS[0].id, // Angela
  },
  {
    title: "My motorcycle adventures 🏍️",
    content: "Riding helps me clear my mind. Maybe one day I can take one of you ZAIAs for a ride? Stay tuned for more adventures!",
    type: "DIARY" as const,
    memberId: KAIA_MEMBERS[1].id, // Charice
  },
  {
    title: "Coffee time! ☕",
    content: "You know I can't start my day without coffee. How many cups have YOU had today? Let me know in the comments!",
    type: "LECTURE" as const,
    memberId: KAIA_MEMBERS[2].id, // Alexa
  },
  {
    title: "Work until you no longer have to introduce yourself",
    content: "This is my motto and I want to share it with all of you. Keep working hard, ZAIAs! Your dreams are valid.",
    type: "LECTURE" as const,
    memberId: KAIA_MEMBERS[3].id, // Sophia
  },
  {
    title: "Cheerleading days 📣",
    content: "Before KAIA, I was in cheerleading! Here are some old photos. Did anyone else do cheerleading? Let's share stories!",
    type: "DIARY" as const,
    memberId: KAIA_MEMBERS[4].id, // Charlotte
  },
];

async function seed() {
  console.log("🌱 Starting seed...");

  if (!process.env.TURSO_DATABASE_URL) {
    console.warn("⚠️ TURSO_DATABASE_URL is missing. Skipping seed.");
    return;
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });

  const db = drizzle(client, { schema });

  try {
    // 0. Clean up existing courses, modules, quizzes, questions, answers, and badges to allow full updates
    console.log("🧹 Cleaning up old course, quiz, and badge data...");
    await db.delete(schema.courseQuizAnswers);
    await db.delete(schema.courseQuizQuestions);
    await db.delete(schema.courseQuizzes);
    await db.delete(schema.courseModules);
    await db.delete(schema.courseBadges);
    await db.delete(schema.courses);

    // 1. Seed Achievements
    console.log("Planting achievements...");
    for (const ach of ACHIEVEMENTS) {
      await db.insert(schema.achievements)
        .values({
          id: ach.id,
          name: ach.name,
          description: ach.description,
          icon: ach.icon,
          points: ach.points,
          rarity: ach.rarity,
        })
        .onConflictDoNothing();
    }

    // 2. Seed Quests
    console.log("Planting daily quests...");
    for (let i = 0; i < DAILY_QUESTS.length; i++) {
      const q = DAILY_QUESTS[i];
      await db.insert(schema.quests)
        .values({
          id: q.id,
          title: q.title,
          description: q.description,
          points: q.points,
          order: i,
        })
        .onConflictDoNothing();
    }

    // 3. Seed Members
    console.log("Enrolling professors...");
    for (const m of KAIA_MEMBERS) {
      await db.insert(schema.members)
        .values({
          id: m.id,
          name: m.name,
          stageName: m.stageName,
          slug: m.slug,
          fullName: m.fullName,
          position: m.position.join(", "),
          birthday: m.birthday,
          zodiac: m.zodiac,
          height: m.height,
          weight: m.weight,
          mbti: m.mbti,
          emoji: m.emoji,
          color: m.color,
          motto: m.motto,
          funFacts: JSON.stringify(m.funFacts),
          profileImage: m.profileImage,
        })
        .onConflictDoNothing();
    }

    // 4. Seed Admin User & Posts
    console.log("Creating admin user and sample posts...");
    const adminId = "seed-admin-123";
    await db.insert(schema.users)
      .values({
        id: adminId,
        email: "admin@kaiaversity.com",
        name: "KAIA Admin",
        role: "ADMIN",
        points: 10000,
        level: 6,
      })
      .onConflictDoNothing();

    for (const post of SAMPLE_POSTS) {
      await db.insert(schema.posts)
        .values({
          title: post.title,
          content: post.content,
          excerpt: post.content.slice(0, 100),
          type: post.type,
          authorId: adminId,
          memberId: post.memberId,
          published: true,
        })
        .onConflictDoNothing();
    }

    // 5. Programmatically Seed Courses, Modules, Quizzes, Questions, & Badges
    console.log("Planting 50 courses programmatically (5 courses per level for Levels 1–10)...");
    
    const membersList = [
      { id: "member-angela", slug: "angela", name: "Angela", emoji: "🐻", topic: "Leadership & Heart", color: "#8B4513", hometown: "Cavite, Philippines" },
      { id: "member-charice", slug: "charice", name: "Charice", emoji: "🍒", topic: "Rap Speeds & Risk Maneuvers", color: "#DE3163", hometown: "Cavite, Philippines" },
      { id: "member-alexa", slug: "alexa", name: "Alexa", emoji: "🐉", topic: "Cleanliness & Coffee Brewing", color: "#FFD700", hometown: "Las Piñas City, Philippines" },
      { id: "member-sophia", slug: "sophia", name: "Sophia", emoji: "🦊", topic: "Taylor Swift Lyrics & SB19 Dances", color: "#FF2400", hometown: "Manila, Philippines" },
      { id: "member-charlotte", slug: "charlotte", name: "Charlotte", emoji: "🍊", topic: "Bunso Cheerleading & Otter Trivia", color: "#98FF98", hometown: "Quezon City, Philippines" },
    ];

    function getLevelData(lvl: number, member: typeof membersList[0]) {
      const name = member.name;
      const slug = member.slug;
      const emoji = member.emoji;
      
      // LEVEL 1: Intro to Member & Emojis
      if (lvl === 1) {
        if (slug === "angela") {
          return {
            title: `🐻 Level 1: Intro to Angela & Leadership`,
            desc: `Get to know Professor Angela, the leader and protector of KAIA.`,
            m1Title: `Meet Professor Angela`,
            m1Content: `Hello ZAIAs! I am Angela, the leader, vocalist, and lead dancer of KAIA. My signature emoji is the bear 🐻 because it represents warmth, support, and protection. As the leader, I make sure we stay focused, united, and support each other through intense training.`,
            m2Title: `Bear Emoji & Fandom Leadership`,
            m2Content: `The bear emoji 🐻 represents a guiding hand. In P-pop, leadership involves coordinating with the label, choreography directors, and helping the group stay balanced during long performances and promotional tours.`,
            q1: `What is the official emoji representing Prof. Angela?`,
            q1A1: `🐻 (Correct)`, q1A2: `🍒`, q1A3: `🐉`,
            q2: `Which of the following roles does Angela hold in KAIA?`,
            q2A1: `Leader, Vocalist, and Dancer (Correct)`, q2A2: `Main Rapper only`, q2A3: `Bunso and Visual`,
            q3: `Why did Angela choose the bear 🐻 emoji?`,
            q3A1: `To represent warmth, support, and protection (Correct)`, q3A2: `Because she likes cold weather`, q3A3: `To signify fast racing speeds`
          };
        }
        if (slug === "charice") {
          return {
            title: `🍒 Level 1: Intro to Charice & Rhythmic Power`,
            desc: `Get to know Professor Charice, the sharp rapper of KAIA.`,
            m1Title: `Meet Professor Charice`,
            m1Content: `Hello ZAIAs! I am Charice, rapper and dancer of KAIA. My official emoji is the cherry 🍒. It represents compact, sweet energy. Off-stage, I am often quiet and shy, but on-stage, I bring powerful rap flows and precise choreography.`,
            m2Title: `The Cherry Emoji & Rapping Precision`,
            m2Content: `The cherry 🍒 represents double energy (since cherries often grow in pairs, matching my twin connection with Angela). In KAIA's choreography, my role is to deliver sharp movements and clean rhythm segments.`,
            q1: `What is the official emoji representing Prof. Charice?`,
            q1A1: `🍒 (Correct)`, q1A2: `🦊`, q1A3: `🍊`,
            q2: `What is a common description of Charice's off-stage personality?`,
            q2A1: `Shy and quiet in person (Correct)`, q2A2: `Extremely loud and hyperactive`, q2A3: `Very aggressive and talkative`,
            q3: `Which member of KAIA is Charice's twin sister?`,
            q3A1: `Angela (Correct)`, q3A2: `Alexa`, q3A3: `Sophia`
          };
        }
        if (slug === "alexa") {
          return {
            title: `🐉 Level 1: Intro to Alexa & Dragon Energy`,
            desc: `Get to know Professor Alexa, the fiery rapper of KAIA.`,
            m1Title: `Meet Professor Alexa`,
            m1Content: `Hello ZAIAs! I am Alexa, rapper and dancer of KAIA. My official emoji is the dragon 🐉. It represents fiery energy, confidence, and passion. I often call myself "Alexa Kyutie" because of the cute contrast with my fiery rap lines.`,
            m2Title: `The Dragon Emoji & Stage Confidence`,
            m2Content: `The dragon 🐉 symbolizes the fierceness needed to perform high-bpm tracks. Off-stage, I value cleanliness and order, but when the music starts, I channel the dragon's fire to command the stage.`,
            q1: `What is the official emoji representing Prof. Alexa?`,
            q1A1: `🐉 (Correct)`, q1A2: `🐻`, q1A3: `🦊`,
            q2: `What playful nickname does Alexa use for herself?`,
            q2A1: `Alexa Kyutie (Correct)`, q2A2: `Dragon Queen`, q2A3: `Lexy Boss`,
            q3: `What does Alexa's dragon emoji 🐉 symbolize?`,
            q3A1: `Fiery energy, confidence, and passion (Correct)`, q3A2: `Rain and cold nights`, q3A3: `Being quiet and shy`
          };
        }
        if (slug === "sophia") {
          return {
            title: `🦊 Level 1: Intro to Sophia & Clever Vocals`,
            desc: `Get to know Professor Sophia, the elegant vocalist of KAIA.`,
            m1Title: `Meet Professor Sophia`,
            m1Content: `Hello ZAIAs! I am Sophia, vocalist and dancer of KAIA. My signature emoji is the fox 🦊 because it represents cleverness, agility, and a sharp mind. I bring vocal stability and graceful choreography to the group.`,
            m2Title: `The Fox Emoji & Creative Harmony`,
            m2Content: `The fox 🦊 represents strategic thinking and versatility. As a vocalist, I focus on executing precise notes while maintaining synchronization with the other members under the stage lights. My favorite colors are red and pink.`,
            q1: `What is the official emoji representing Prof. Sophia?`,
            q1A1: `🦊 (Correct)`, q1A2: `🍒`, q1A3: `🍊`,
            q2: `What are Sophia's favorite colors?`,
            q2A1: `Red and pink (Correct)`, q2A2: `Blue and green`, q2A3: `Black and gold`,
            q3: `Which of the following is Sophia's main position in KAIA?`,
            q3A1: `Vocalist and Dancer (Correct)`, q3A2: `Main Rapper only`, q3A3: `Group Manager`
          };
        }
        if (slug === "charlotte") {
          return {
            title: `🍊 Level 1: Intro to Charlotte & Bunso Energy`,
            desc: `Get to know Professor Charlotte, the energetic bunso of KAIA.`,
            m1Title: `Meet Professor Charlotte`,
            m1Content: `Hello ZAIAs! I am Charlotte, rapper, dancer, and vocalist of KAIA. I am the youngest member, or the 'Bunso' of the group! My signature emoji is the orange 🍊, representing freshness, energy, and vitamin-like vitality.`,
            m2Title: `The Orange Emoji & Youthful Agility`,
            m2Content: `The orange 🍊 symbolizes refreshment. Being the youngest, I bring positive vibes, versatility (switching between rap and vocal duties), and high agility to all our choreographies.`,
            q1: `What is the official emoji representing Prof. Charlotte?`,
            q1A1: `🍊 (Correct)`, q1A2: `🐉`, q1A3: `🐻`,
            q2: `What is Charlotte's position regarding the age hierarchy in KAIA?`,
            q2A1: `Bunso / Youngest member (Correct)`, q2A2: `Panganay / Oldest member`, q2A3: `Leader of the group`,
            q3: `What does Charlotte's orange 🍊 emoji represent?`,
            q3A1: `Freshness, energy, and vitamin-like vitality (Correct)`, q3A2: `Extreme quietness`, q3A3: `Dark, mysterious vibes`
          };
        }
      }
      
      // LEVEL 2: Mottos & Philosophy
      if (lvl === 2) {
        if (slug === "angela") {
          return {
            title: `🐻 Level 2: Angela's Masterpiece Philosophy`,
            desc: `Deconstruct Angela's motto: "Make everyday your masterpiece".`,
            m1Title: `The Art of Everyday`,
            m1Content: `My motto is "Make everyday your masterpiece". I believe that each day is a blank canvas. Even on exhausting days with endless dance runs, we should strive to create something beautiful, learn something new, or give our 100%.`,
            m2Title: `Applying the Masterpiece Philosophy`,
            m2Content: `For ZAIAs, this philosophy means treating your studies, passions, and relationships as works of art. Do not wait for perfect conditions to start working on your dreams; make today the masterpiece.`,
            q1: `What is Prof. Angela's official motto?`,
            q1A1: `"Make everyday your masterpiece" (Correct)`, q1A2: `"Take the risk"`, q1A3: `"No retreat, no surrender"`,
            q2: `What does Angela compare each new day to?`,
            q2A1: `A blank canvas (Correct)`, q2A2: `A final exam`, q2A3: `A coffee cup`,
            q3: `How should ZAIAs apply Angela's philosophy according to her lesson?`,
            q3A1: `By treating studies, passions, and relationships as works of art (Correct)`, q3A2: `By only working on sunny days`, q3A3: `By ignoring choreographies`
          };
        }
        if (slug === "charice") {
          return {
            title: `🍒 Level 2: Charice's Risk & Chance Philosophy`,
            desc: `Deconstruct Charice's motto: "Take the risk, or lose a chance".`,
            m1Title: `Embracing the Uncomfortable`,
            m1Content: `My motto is "Take the risk, or lose a chance". Coming from a shy background, joining KAIA was a huge risk for me. But I realized that if you do not take the leap, you will never know what you are capable of achieving.`,
            m2Title: `Risk in Performance and Life`,
            m2Content: `Whether it's executing a difficult stunt on stage, trying a new vocal range, or starting a new journey, risks are essential. Overcoming the fear of failure is the first step to unlocking new levels of your potential.`,
            q1: `What is Prof. Charice's official motto?`,
            q1A1: `"Take the risk, or lose a chance" (Correct)`, q1A2: `"Make everyday a masterpiece"`, q1A3: `"Squeeze lemons in eyes"`,
            q2: `What personal challenge did Charice overcome by taking risks?`,
            q2A1: `Her shy and quiet nature (Correct)`, q2A2: `Her fear of heights`, q2A3: `Her dislike of music`,
            q3: `According to Charice, what is the first step to unlocking your potential?`,
            q3A1: `Overcoming the fear of failure (Correct)`, q3A2: `Buying a motorcycle`, q3A3: `Sleeping all day`
          };
        }
        if (slug === "alexa") {
          return {
            title: `🐉 Level 2: Alexa's Lemon Squeezing Philosophy`,
            desc: `Deconstruct Alexa's unique motto: "If life gives you lemons, squeeze them in people's eyes".`,
            m1Title: `A Bold Spin on Lemons`,
            m1Content: `My motto is "If life gives you lemons, squeeze them in people's eyes." While the traditional saying is to make lemonade, I prefer a bold, sassy approach. When life throws difficulties or critics at you, confront them with confidence and double the energy!`,
            m2Title: `Confronting Adversity with Style`,
            m2Content: `Squeezing lemons represents being proactive, assertive, and refusing to let obstacles bring you down. It's about turning passive situations into active victories with a bit of humor and attitude.`,
            q1: `What is Prof. Alexa's unique motto?`,
            q1A1: `"If life gives you lemons, squeeze them in people's eyes" (Correct)`, q1A2: `"Make lemonade"`, q1A3: `"Everything happens for a reason"`,
            q2: `What does 'squeezing lemons' represent in Alexa's philosophy?`,
            q2A1: `Being proactive, assertive, and confronting critics with style (Correct)`, q2A2: `Making sweet drinks`, q2A3: `Being silent and running away`,
            q3: `How does Alexa suggest you handle critics and difficulties?`,
            q3A1: `Confront them with confidence and double the energy (Correct)`, q3A2: `Agree with them`, q3A3: `Quit performing`
          };
        }
        if (slug === "sophia") {
          return {
            title: `🦊 Level 2: Sophia's Quiet Excellence Philosophy`,
            desc: `Deconstruct Sophia's motto: "Work until you no longer have to introduce yourself".`,
            m1Title: `The Power of Silent Hustle`,
            m1Content: `My motto is "Work until you no longer have to introduce yourself". I believe in working hard in silence. Let your dedication, hours of practice, and quality of work speak for you. True impact doesn't need self-promotion.`,
            m2Title: `Building a Reputable Craft`,
            m2Content: `In the P-pop industry, consistency is key. By pouring hours into vocal training and dance detail, we build a reputation that precedes us. Focus on the craft, and the recognition will follow naturally.`,
            q1: `What is Prof. Sophia's official motto?`,
            q1A1: `"Work until you no longer have to introduce yourself" (Correct)`, q1A2: `"Take the risk"`, q1A3: `"Make today a masterpiece"`,
            q2: `What is the core principle of Sophia's 'silent hustle'?`,
            q2A1: `Working hard in silence and letting your dedication speak for itself (Correct)`, q2A2: `Telling everyone about your success`, q2A3: `Not practicing at all`,
            q3: `According to Sophia, what is key to building a lasting reputation?`,
            q3A1: `Consistency, vocal training, and dance detail (Correct)`, q3A2: `Having the loudest outfit`, q3A3: `Posting on social media every minute`
          };
        }
        if (slug === "charlotte") {
          return {
            title: `🍊 Level 2: Charlotte's Trust & Destiny Philosophy`,
            desc: `Deconstruct Charlotte's motto: "Everything happens for a reason".`,
            m1Title: `Trusting the Journey`,
            m1Content: `My motto is "Everything happens for a reason". As the bunso, I faced many changes and rapid transitions. Believing that every obstacle or blessing has a purpose helps me stay positive and accept whatever life brings.`,
            m2Title: `Optimism in the Face of Uncertainty`,
            m2Content: `When things don't go as planned, it can be discouraging. But trusting that there is a larger plan teaches us resilience. Every failure is a lesson, and every success is a step forward on our destined path.`,
            q1: `What is Prof. Charlotte's official motto?`,
            q1A1: `"Everything happens for a reason" (Correct)`, q1A2: `"Squeeze lemons"`, q1A3: `"Work in silence"`,
            q2: `How does Charlotte's motto help her during rapid transitions?`,
            q2A1: `It helps her stay positive and trust that every obstacle has a purpose (Correct)`, q2A2: `It makes her want to quit`, q2A3: `It makes her ignore her members`,
            q3: `According to Charlotte, how should we view failure?`,
            q3A1: `As a lesson that is part of a larger plan (Correct)`, q3A2: `As the end of the journey`, q3A3: `As something to hide`
          };
        }
      }
      
      // LEVEL 3: Kinaiya & Pre-Debut "KAYA"
      if (lvl === 3) {
        if (slug === "angela") {
          return {
            title: `🐻 Level 3: Angela & Pre-Debut "KAYA" Direction`,
            desc: `Learn about Angela's leadership during the recording and release of pre-debut track "KAYA".`,
            m1Title: `Pre-Debut Days & Fandom Foundation`,
            m1Content: `KAIA's pre-debut single "KAYA" was released on December 10, 2021. It introduced our vocal identity to the world. As the leader, I was responsible for guiding the team's dynamics, maintaining energy during 12-hour rehearsal blocks, and aligning our harmonies.`,
            m2Title: `The Concept of 'Kinaiya'`,
            m2Content: `The name KAIA is rooted in the Cebuano word "kinaiya" (inner character/individuality). During "KAYA" rehearsals, I encouraged each member to show their true individuality rather than blending into a single mold.`,
            q1: `On what date was KAIA's pre-debut single 'KAYA' released?`,
            q1A1: `December 10, 2021 (Correct)`, q1A2: `April 8, 2022`, q1A3: `September 29, 2022`,
            q2: `What Cebuano term meaning 'inner character' inspired the name KAIA?`,
            q2A1: `Kinaiya (Correct)`, q2A2: `Kaya`, q2A3: `Kalipay`,
            q3: `What was Angela's main leadership focus during the recording of 'KAYA'?`,
            q3A1: `Aligning harmonies and encouraging members' individuality (Correct)`, q3A2: `Writing all the rap lyrics alone`, q3A3: `Taking care of the costumes`
          };
        }
        if (slug === "charice") {
          return {
            title: `🍒 Level 3: Charice & Pre-Debut "KAYA" Rap Flow`,
            desc: `Study Charice's rapid rap parts and training during the pre-debut single "KAYA".`,
            m1Title: `Charice's 'KAYA' Trainee Breakouts`,
            m1Content: `Before "KAYA" was released on December 10, 2021, we trained relentlessly. As a rapper, "KAYA" was my first time recording professional P-pop rap verses. I spent hours practicing my articulation so that every fast line was crystal clear.`,
            m2Title: `Developing Rhythmic Stamina`,
            m2Content: `"KAYA" is a song of resilience. For me, it was a battle against my own self-doubt. I had to deliver rapid bars while maintaining synchronization with Alexa and Charlotte in the rap unit.`,
            q1: `When was the pre-debut single 'KAYA' officially released?`,
            q1A1: `December 10, 2021 (Correct)`, q1A2: `April 8, 2022`, q1A3: `March 15, 2022`,
            q2: `What was Charice's primary technical challenge during the recording of 'KAYA'?`,
            q2A1: `Practicing articulation so fast lines were crystal clear (Correct)`, q2A2: `Playing the drums`, q2A3: `Singing the high opera notes`,
            q3: `What is the core message of the pre-debut track 'KAYA'?`,
            q3A1: `Resilience and capability to overcome obstacles (Correct)`, q3A2: `Going on a motor road trip`, q3A3: `Buying new shoes`
          };
        }
        if (slug === "alexa") {
          return {
            title: `🐉 Level 3: Alexa & Pre-Debut "KAYA" Attitude`,
            desc: `Analyze Alexa's stylistic contribution and attitude in the pre-debut release "KAYA".`,
            m1Title: `Alexa's Fire in 'KAYA'`,
            m1Content: `On December 10, 2021, we dropped "KAYA". The track blends energetic pop beats with fierce rap drops. I worked on injecting a "girl crush" attitude into my verses, ensuring that the pre-debut audience could feel the dragon energy immediately.`,
            m2Title: `Kinaiya as Artistic Identity`,
            m2Content: `Since KAIA comes from "kinaiya" (inner character), I made sure my delivery reflected my unique personality—playful yet fierce. It set the stage for how I approach all future KAIA records.`,
            q1: `In what year was the pre-debut track 'KAYA' released?`,
            q1A1: `2021 (Correct)`, q1A2: `2022`, q1A3: `2023`,
            q2: `What attitude did Alexa focus on injecting into her 'KAYA' verses?`,
            q2A1: `Girl crush attitude, playful yet fierce (Correct)`, q2A2: `Melancholic and sad`, q2A3: `Operatic and formal`,
            q3: `What double meaning does the name KAIA hold in Tagalog and Cebuano?`,
            q3A1: `Capability (kaya) and Inner Character (kinaiya) (Correct)`, q3A2: `Victory and Speed`, q3A3: `Light and Shadow`
          };
        }
        if (slug === "sophia") {
          return {
            title: `🦊 Level 3: Sophia & Pre-Debut "KAYA" Harmony`,
            desc: `Explore Sophia's vocal preparation and backup dancer legacy during the "KAYA" era.`,
            m1Title: `Sophia's Transition to Vocal Lead`,
            m1Content: `Before recording "KAYA" for its December 10, 2021 launch, I worked on my vocal stability. Having been a backup dancer for SB19, I knew the high level of professionalism expected in the P-pop industry and used that discipline in our recording booth.`,
            m2Title: `The Harmony Roster`,
            m2Content: `"KAYA" required tight vocal layering. I focused on supporting Angela's lead lines with clean harmonies, building a solid vocal foundation that would define KAIA's signature group sound.`,
            q1: `What P-pop group did Sophia perform with as a backup dancer before debut?`,
            q1A1: `SB19 (Correct)`, q1A2: `BGYO`, q1A3: `ALAMAT`,
            q2: `What date marks the release of the pre-debut single 'KAYA'?`,
            q2A1: `December 10, 2021 (Correct)`, q2A2: `November 3, 2021`, q2A3: `August 22, 2022`,
            q3: `What was Sophia's primary vocal focus in the track 'KAYA'?`,
            q3A1: `Supporting lead lines with clean vocal layering and harmonies (Correct)`, q3A2: `Executing a solo opera aria`, q3A3: `Rapping at 200 BPM`
          };
        }
        if (slug === "charlotte") {
          return {
            title: `🍊 Level 3: Charlotte & Pre-Debut "KAYA" Training`,
            desc: `Follow Charlotte's journey as the youngest member recording "KAYA".`,
            m1Title: `The Youngest Trainee's Challenge`,
            m1Content: `When we recorded "KAYA" (released Dec 10, 2021), I was still balancing my roles as a rapper and vocalist. Being the Bunso, I was determined to match the energy and precision of my older members, spending extra hours practicing both units.`,
            m2Title: `Discovering My Unique Flow`,
            m2Content: `The concept of "kinaiya" taught me to trust my unique youthful style. In "KAYA", my parts acted as a bridge between the rapid rap segments and the melodic vocal choruses.`,
            q1: `What is the significance of the release date December 10, 2021?`,
            q1A1: `Release of KAIA's pre-debut single 'KAYA' (Correct)`, q1A2: `KAIA's official debut with 'BLAH BLAH'`, q1A3: `Charlotte's birthday`,
            q2: `What is Charlotte's position in the group's performance units?`,
            q2A1: `Vocalist, Rapper, and Dancer (Correct)`, q2A2: `Leader and main composer only`, q2A3: `Visual only`,
            q3: `How did Charlotte describe her vocal role in the song 'KAYA'?`,
            q3A1: `A bridge between the rapid rap segments and melodic choruses (Correct)`, q3A2: `High-frequency screaming`, q3A3: `Singing all the verses alone`
          };
        }
      }
      
      // LEVEL 4: Official Debut & "BLAH BLAH"
      if (lvl === 4) {
        if (slug === "angela") {
          return {
            title: `🐻 Level 4: Angela & the "BLAH BLAH" Debut`,
            desc: `Analyze Angela's leadership and vocal guidance during the official debut on April 8, 2022.`,
            m1Title: `The Official Launch`,
            m1Content: `On April 8, 2022, KAIA officially debuted with the single "BLAH BLAH" under ShowBT Philippines. It was a high-pressure moment. As the leader, I had to ensure that our stage projections were sharp, and our nerves were kept under control during live TV showcases.`,
            m2Title: `Vocal Direction in "BLAH BLAH"`,
            m2Content: `"BLAH BLAH" is about silencing critics and focusing on our path. I led the vocal sections, aiming for a powerful, confident tone that matched the song's strong, neon-themed visual concept.`,
            q1: `What is the official debut date of KAIA?`,
            q1A1: `April 8, 2022 (Correct)`, q1A2: `December 10, 2021`, q1A3: `September 29, 2022`,
            q2: `What is the title of KAIA's official debut single?`,
            q2A1: `BLAH BLAH (Correct)`, q2A2: `KAYA`, q2A3: `Dalawa`,
            q3: `What was Angela's main responsibility during the 'BLAH BLAH' TV showcases?`,
            q3A1: `Guiding team dynamics, controlling nerves, and sharp vocal delivery (Correct)`, q3A2: `Playing the lead guitar live`, q3A3: `Operating the stage lighting`
          };
        }
        if (slug === "charice") {
          return {
            title: `🍒 Level 4: Charice & the "BLAH BLAH" Dance Center`,
            desc: `Study Charice's center-stage choreography and styling in the "BLAH BLAH" debut.`,
            m1Title: `Commanding the Center`,
            m1Content: `KAIA's debut on April 8, 2022 with "BLAH BLAH" featured intense choreography. I had several center parts in the dance break. Performing these segments required immense core strength, sharp angles, and precise synchronization.`,
            m2Title: `Styling & Attitude`,
            m2Content: `In the "BLAH BLAH" music video, we wore bold, neon-accented outfits. My styling complemented my sharp, aggressive dance style, showing a strong contrast to my quiet off-stage personality.`,
            q1: `What is the name of KAIA's official debut song released on April 8, 2022?`,
            q1A1: `BLAH BLAH (Correct)`, q1A2: `KAYA`, q1A3: `5678`,
            q2: `Where did Charice have a prominent role during the performance of 'BLAH BLAH'?`,
            q2A1: `The intense dance break center segments (Correct)`, q2A2: `Playing the keyboard`, q2A3: `Singing the opening ballad lines`,
            q3: `What is the main conceptual theme of the 'BLAH BLAH' music video?`,
            q3A1: `Bold, neon-accented styling and silencing doubts (Correct)`, q3A2: `A simple acoustic coffee shop`, q3A3: `A retro 1950s diner`
          };
        }
        if (slug === "alexa") {
          return {
            title: `🐉 Level 4: Alexa & the "BLAH BLAH" Opening Rap`,
            desc: `Deconstruct Alexa's iconic opening rap verse and styling in the debut single "BLAH BLAH".`,
            m1Title: `Setting the Tone`,
            m1Content: `In "BLAH BLAH" (debuted April 8, 2022), my opening rap verse set the energetic and confident tone of the track. Delivering this verse required punchy phrasing, strong eye contact with the camera, and an attitude of dismissiveness toward negative chatter.`,
            m2Title: `Silencing the "Blah Blah"`,
            m2Content: `The song's core message is to ignore the white noise and doubts. My rap styling reflected this by being unapologetically fast and sharp, giving the group a solid introductory burst.`,
            q1: `Which member delivered the opening rap verse in the debut single 'BLAH BLAH'?`,
            q1A1: `Alexa (Correct)`, q1A2: `Angela`, q1A3: `Sophia`,
            q2: `When did KAIA officially debut under ShowBT Philippines?`,
            q2A1: `April 8, 2022 (Correct)`, q2A2: `December 10, 2021`, q2A3: `May 20, 2022`,
            q3: `What is the core message of the lyrics in 'BLAH BLAH'?`,
            q3A1: `Ignoring white noise, doubts, and critics to move forward (Correct)`, q3A2: `Going on a shopping spree`, q3A3: `A sad romantic breakup`
          };
        }
        if (slug === "sophia") {
          return {
            title: `🦊 Level 4: Sophia & the "BLAH BLAH" Vocal Bridge`,
            desc: `Analyze Sophia's vocal bridge stability and styling in the debut track "BLAH BLAH".`,
            m1Title: `The Emotional Climax`,
            m1Content: `In "BLAH BLAH" (released April 8, 2022), the vocal bridge acts as the emotional build-up before the final explosive chorus. I was tasked with delivering this bridge, which required excellent breath control and a smooth transition from lower to higher registers.`,
            m2Title: `Maintaining Stability Under Spotlight`,
            m2Content: `Performing the bridge after intense choreography is physically demanding. I trained to keep my shoulders relaxed and control my breathing to prevent pitch issues, showcasing vocal maturity.`,
            q1: `Which single marked KAIA's official debut on April 8, 2022?`,
            q1A1: `BLAH BLAH (Correct)`, q1A2: `KAYA`, q1A3: `Dalawa`,
            q2: `What is Sophia's main technical focus during the vocal bridge of 'BLAH BLAH'?`,
            q2A1: `Breath control and smooth transition between registers (Correct)`, q2A2: `Doing backflips`, q2A3: `Playing the acoustic guitar`,
            q3: `Which agency officially debuted KAIA?`,
            q3A1: `ShowBT Philippines (Correct)`, q3A2: `Star Music`, q3A3: `Viva Records`
          };
        }
        if (slug === "charlotte") {
          return {
            title: `🍊 Level 4: Charlotte & the "BLAH BLAH" Versatility`,
            desc: `Explore Charlotte's hybrid rap-vocal lines and synchronized dance in the debut "BLAH BLAH".`,
            m1Title: `The Bunso's Versatility`,
            m1Content: `In our debut track "BLAH BLAH" (April 8, 2022), I had to quickly transition from executing fast rap verses to supporting the main vocal chorus. This double-duty highlighted my training as a versatile performer.`,
            m2Title: `Synchronized Formations`,
            m2Content: `The choreography of "BLAH BLAH" requires complex floor formations. As the youngest, I worked hard to ensure my movements aligned perfectly with the team's geometry, maintaining high energy throughout.`,
            q1: `What is the title of the debut single KAIA performed on April 8, 2022?`,
            q1A1: `BLAH BLAH (Correct)`, q1A2: `KAYA`, q1A3: `You Did It`,
            q2: `What transition does Charlotte execute during the song 'BLAH BLAH'?`,
            q2A1: `From fast rap verses to supporting vocal choruses (Correct)`, q2A2: `Playing piano to playing drums`, q2A3: `Stage manager to back-up dancer`,
            q3: `What is required of the performers during the complex formations of 'BLAH BLAH'?`,
            q3A1: `Precise alignment, high energy, and geometric synchronization (Correct)`, q3A2: `Standing in a straight line without moving`, q3A3: `Improvising all the dance steps`
          };
        }
      }
      
      // LEVEL 5: Mid-era Singles ("Dalawa" & "5678")
      if (lvl === 5) {
        if (slug === "angela") {
          return {
            title: `🐻 Level 5: Angela & Mid-era Harmony`,
            desc: `Deconstruct Angela's vocal harmony in "Dalawa" and rhythm leading in "5678".`,
            m1Title: `"Dalawa" (September 29, 2022)`,
            m1Content: `"Dalawa" is a sweet P-pop ballad about catching feelings. I worked closely with our vocal line to blend our ranges, creating a cozy and soft acoustic vibe that contrast with our debut track's aggressiveness.`,
            m2Title: `"5678" (March 2023)`,
            m2Content: `"5678" is a high-energy dance track. The title is the counting cue for dancers. As the leader, I led the vocal counts during practice, ensuring we stayed perfectly locked to the tempo.`,
            q1: `On what date was the ballad 'Dalawa' released?`,
            q1A1: `September 29, 2022 (Correct)`, q1A2: `April 8, 2022`, q1A3: `March 20, 2023`,
            q2: `What is the core theme of the song 'Dalawa'?`,
            q2A1: `Catching feelings for someone close (Correct)`, q2A2: `Ignoring the critics`, q2A3: `Riding a motorcycle`,
            q3: `What dance rehearsal cue does the 2023 song title '5678' refer to?`,
            q3A1: `The counting cue for dancers (Correct)`, q3A2: `The members' age order`, q3A3: `A secret code`
          };
        }
        if (slug === "charice") {
          return {
            title: `🍒 Level 5: Charice & Mid-era Raps & Rhythms`,
            desc: `Analyze Charice's rap pacing in "Dalawa" and hip-hop execution in "5678".`,
            m1Title: `Smooth Flow in "Dalawa"`,
            m1Content: `In "Dalawa" (Sept 29, 2022), the rap line had to adapt to a softer, melodic beat. I toned down my aggressive delivery to match the sweet mood of the song, focusing on rhythmic phrasing and warmth.`,
            m2Title: `Hip-Hop Energy in "5678"`,
            m2Content: `When "5678" dropped in March 2023, it was a return to high-energy dance-pop. I focused on executing sharp popping movements, utilizing my hip-hop training to keep the choreo bouncy.`,
            q1: `Which song released on September 29, 2022 features Charice's softer rap flow?`,
            q1A1: `Dalawa (Correct)`, q1A2: `BLAH BLAH`, q1A3: `You Did It`,
            q2: `When was the dance-pop track '5678' released?`,
            q2A1: `March 2023 (Correct)`, q2A2: `September 2022`, q2A3: `April 2022`,
            q3: `What dance style did Charice utilize to keep '5678' choreography bouncy?`,
            q3A1: `Popping and hip-hop techniques (Correct)`, q3A2: `Classical ballet`, q3A3: `Traditional folk dance`
          };
        }
        if (slug === "alexa") {
          return {
            title: `🐉 Level 5: Alexa & Mid-era Verses`,
            desc: `Deconstruct Alexa's cute-cool contrast in "Dalawa" and tempo in "5678".`,
            m1Title: `The Contrast in "Dalawa"`,
            m1Content: `In "Dalawa" (released Sept 29, 2022), I showcased my "Alexa Kyutie" persona, delivering sweet rap lines. It was a fun challenge to balance my typical fierce delivery with a cute, loving vibe.`,
            m2Title: `High-tempo Rapping in "5678"`,
            m2Content: `"5678" (released March 2023) is a fast dance-pop track. My rap verse had to match the rapid BPM of the beat, requiring quick tongue movements and high-energy breath control.`,
            q1: `Which KAIA track released in September 2022 is a sweet ballad about catching feelings?`,
            q1A1: `Dalawa (Correct)`, q1A2: `5678`, q1A3: `KAYA`,
            q2: `What is the BPM style of the March 2023 track '5678'?`,
            q2A1: `Fast dance-pop (Correct)`, q2A2: `Slow acoustic ballad`, q2A3: `Mid-tempo jazz`,
            q3: `What persona did Alexa showcase during her 'Dalawa' rap lines?`,
            q3A1: `Alexa Kyutie (sweet/cute contrast) (Correct)`, q3A2: `Fierce dragon warrior only`, q3A3: `Operatic diva`
          };
        }
        if (slug === "sophia") {
          return {
            title: `🦊 Level 5: Sophia & Mid-era Vocal Belts`,
            desc: `Explore Sophia's emotional belts in "Dalawa" and crisp counts in "5678".`,
            m1Title: `Emotional Delivery in "Dalawa"`,
            m1Content: `In "Dalawa" (released Sept 29, 2022), I was responsible for several high vocal lines. Singing a ballad requires deep emotional projection so that the listeners can feel the sweetness and vulnerability of the lyrics.`,
            m2Title: `Crisp Dance Formations in "5678"`,
            m2Content: `For "5678" (March 2023), our focus was on synchronization. The count-in structure of the choreography meant that every member had to move exactly on the beat, requiring tight coordination during rehearsals.`,
            q1: `Which emotional P-pop ballad did KAIA release on September 29, 2022?`,
            q1A1: `Dalawa (Correct)`, q1A2: `5678`, q1A3: `BLAH BLAH`,
            q2: `What was Sophia's main technical focus when singing 'Dalawa'?`,
            q2A1: `Vulnerability and emotional projection in high lines (Correct)`, q2A2: `Singing as fast as possible`, q2A3: `Rapping in a deep tone`,
            q3: `What was the primary goal during rehearsals for the track '5678'?`,
            q3A1: `Crisp synchronization and moving exactly on the beat (Correct)`, q3A2: `Improvising all the vocal harmonies`, q3A3: `Standing in one spot`
          };
        }
        if (slug === "charlotte") {
          return {
            title: `🍊 Level 5: Charlotte & Mid-era Vitality`,
            desc: `Study Charlotte's vocal sweetness in "Dalawa" and cheer-inspired moves in "5678".`,
            m1Title: `Sweet Melodies in "Dalawa"`,
            m1Content: `In "Dalawa" (Sept 29, 2022), I contributed to the vocal harmony. Being a sweet track, I used my lighter vocal register to add a youthful, fresh texture to the group's blend.`,
            m2Title: `Cheerleading Stamina in "5678"`,
            m2Content: `For "5678" (March 2023), my cheerleading background was a huge help. The choreography is fast, bouncy, and demands continuous energy. I focused on maintaining a bright smile and high-energy execution throughout.`,
            q1: `Which track from late 2022 highlights Charlotte's lighter vocal register?`,
            q1A1: `Dalawa (Correct)`, q1A2: `5678`, q1A3: `KAYA`,
            q2: `Which background experience helped Charlotte maintain stamina in the '5678' choreo?`,
            q2A1: `Cheerleading background (Correct)`, q2A2: `Classical violin training`, q2A3: `Acting in plays`,
            q3: `When was the high-energy dance track '5678' officially released?`,
            q3A1: `March 2023 (Correct)`, q3A2: `September 2022`, q3A3: `April 2022`
          };
        }
      }
      
      // LEVEL 6: Late-era Singles ("You Did It" & "Tanga")
      if (lvl === 6) {
        if (slug === "angela") {
          return {
            title: `🐻 Level 6: Angela & Late-era Evolution`,
            desc: `Study Angela's vocal confidence in "You Did It" and one-take leadership in "Tanga".`,
            m1Title: `"You Did It" (April 12, 2024)`,
            m1Content: `"You Did It" was released on April 12, 2024. It features a darker, mesmerizing pop sound. I focused on delivering a mature, confident vocal performance that matched the empowering theme of confronting critics.`,
            m2Title: `"Tanga" (March 28, 2025)`,
            m2Content: `"Tanga" is a feel-good track released on March 28, 2025. The music video was filmed in a single continuous shot. As the leader, I had to ensure we hit our marks perfectly since any mistake would require a full retake.`,
            q1: `On what date was the single 'You Did It' released?`,
            q1A1: `April 12, 2024 (Correct)`, q1A2: `March 28, 2025`, q1A3: `September 29, 2022`,
            q2: `What is the unique filming concept of the 'Tanga' music video?`,
            q2A1: `A single continuous one-take shot (Correct)`, q2A2: `Filmed entirely green screen`, q2A3: `A stop-motion animation`,
            q3: `What is the release date of the single 'Tanga'?`,
            q3A1: `March 28, 2025 (Correct)`, q3A2: `April 12, 2024`, q3A3: `March 20, 2023`
          };
        }
        if (slug === "charice") {
          return {
            title: `🍒 Level 6: Charice & Late-era Assertiveness`,
            desc: `Deconstruct Charice's rapid rap in "You Did It" and one-take pacing in "Tanga".`,
            m1Title: `Confrontational Bars in "You Did It"`,
            m1Content: `In "You Did It" (April 12, 2024), my rap verse had a darker, more confrontational tone. I focused on a heavy, rhythmic delivery, projecting power and independence through my voice.`,
            m2Title: `Pacing the One-Take in "Tanga"`,
            m2Content: `Filming "Tanga" (March 28, 2025) in one take was a huge challenge. I had to coordinate my movements, rap my lines, and transition out of the camera's frame seamlessly, keeping my energy natural and fun.`,
            q1: `Which track released on April 12, 2024 features Charice's confrontational rap style?`,
            q1A1: `You Did It (Correct)`, q1A2: `Tanga`, q1A3: `Dalawa`,
            q2: `What date marks the release of the single 'Tanga'?`,
            q2A1: `March 28, 2025 (Correct)`, q2A2: `April 12, 2024`, q2A3: `December 10, 2021`,
            q3: `What was the main physical challenge for Charice during the filming of 'Tanga'?`,
            q3A1: `Transitioning seamlessly in and out of the continuous camera shot (Correct)`, q3A2: `Riding a motorcycle on set`, q3A3: `Playing the drums while singing`
          };
        }
        if (slug === "alexa") {
          return {
            title: `🐉 Level 6: Alexa & Late-era Attitude`,
            desc: `Deconstruct Alexa's fierce rap in "You Did It" and playfulness in "Tanga".`,
            m1Title: `Fierce Delivery in "You Did It"`,
            m1Content: `In "You Did It" (April 12, 2024), my rap flow was rapid and sharp, matching the darker pop sound. I channeled my role models (Soyeon and CL) to deliver the lines with maximum impact and attitude.`,
            m2Title: `Playful Expressions in "Tanga"`,
            m2Content: `"Tanga" (March 28, 2025) is a feel-good track. The one-take MV required me to be playful and interactive. I used my facial expressions to bring out the lighthearted, quirky theme of the song.`,
            q1: `Which track features Alexa's rap flow inspired by Soyeon and CL?`,
            q1A1: `You Did It (Correct)`, q1A2: `Tanga`, q1A3: `BLAH BLAH`,
            q2: `In what year was the feel-good track 'Tanga' released?`,
            q2A1: `2025 (Correct)`, q2A2: `2024`, q2A3: `2023`,
            q3: `What styling/video format did KAIA use for the 'Tanga' music video?`,
            q3A1: `One-take continuous filming (Correct)`, q3A2: `CGI space background`, q3A3: `Black and white silent film`
          };
        }
        if (slug === "sophia") {
          return {
            title: `🦊 Level 6: Sophia & Late-era Harmonies`,
            desc: `Deconstruct Sophia's vocal harmonies in "You Did It" and lead vocals in "Tanga".`,
            m1Title: `Mesmerizing Harmonies in "You Did It"`,
            m1Content: `In "You Did It" (released April 12, 2024), the vocal arrangements are layered. I focused on delivering clean harmony stacks, adding a haunting, mesmerizing texture to the chorus.`,
            m2Title: `Lead Melodies in "Tanga"`,
            m2Content: `For "Tanga" (March 28, 2025), I sang the opening lines. Ballad elements mixed with upbeat pop meant I had to deliver the lyrics with a warm, conversational, yet stable tone during the one-take MV.`,
            q1: `Which song released in April 2024 features Sophia's layered harmony stacks?`,
            q1A1: `You Did It (Correct)`, q1A2: `Tanga`, q1A3: `Dalawa`,
            q2: `What is the release date of 'Tanga'?`,
            q2A1: `March 28, 2025 (Correct)`, q2A2: `April 12, 2024`, q2A3: `September 29, 2022`,
            q3: `What vocal style did Sophia use for the opening of 'Tanga'?`,
            q3A1: `Warm, conversational, and stable (Correct)`, q3A2: `High-frequency opera screaming`, q3A3: `Fast speed-rapping`
          };
        }
        if (slug === "charlotte") {
          return {
            title: `🍊 Level 6: Charlotte & Late-era Charisma`,
            desc: `Deconstruct Charlotte's rap-vocal mix in "You Did It" and bubbly charisma in "Tanga".`,
            m1Title: `Hybrid Delivery in "You Did It"`,
            m1Content: `In "You Did It" (April 12, 2024), I delivered a hybrid verse. I had to quickly switch between rhythmic rapping and smooth vocal backing, fitting the song's darker pop aesthetics.`,
            m2Title: `Bubbly Energy in "Tanga"`,
            m2Content: `For the one-take MV of "Tanga" (March 28, 2025), I brought my signature bunso energy. I had to interact with the moving camera, maintaining high spirit and playfulness without breaking character.`,
            q1: `Which song released in 2025 showcases Charlotte's playful interactions with a moving camera?`,
            q1A1: `Tanga (Correct)`, q1A2: `You Did It`, q1A3: `5678`,
            q2: `What transition does Charlotte perform in the song 'You Did It'?`,
            q2A1: `Between rhythmic rapping and smooth vocal backing (Correct)`, q2A2: `Between keyboard and guitar`, q2A3: `Between lead singer and director`,
            q3: `What is the exact release date of the single 'You Did It'?`,
            q3A1: `April 12, 2024 (Correct)`, q3A2: `March 28, 2025`, q3A3: `September 29, 2022`
          };
        }
      }
      
      // LEVEL 7: Hobbies & Hometown
      if (lvl === 7) {
        if (slug === "angela") {
          return {
            title: `🐻 Level 7: Angela's Roots, Kohui, & Guitar`,
            desc: `Deep dive into Angela's hometown, twin sister, kitten Kohui, and hobbies.`,
            m1Title: `Hometown Cavite & Twins`,
            m1Content: `I was born in Cavite, Philippines. Cavite has a rich history, which inspires my determination. A fun fact is that I have a twin sister, Charice, who is also in KAIA! We share a deep connection but have different styles.`,
            m2Title: `Kohui, Guitar, & Handwritings`,
            m2Content: `I love cats—I have a kitten named Kohui! I also play the guitar during my free time to relax. A funny fact about me is that my handwriting is notoriously messy and hard to read.`,
            q1: `What is Prof. Angela's hometown?`,
            q1A1: `Cavite, Philippines (Correct)`, q1A2: `Manila`, q1A3: `Quezon City`,
            q2: `What is the name of Angela's kitten?`,
            q2A1: `Kohui (Correct)`, q2A2: `Milo`, q2A3: `Brownie`,
            q3: `Which of the following is a funny fact about Angela?`,
            q3A1: `Her handwriting is hard to read (Correct)`, q3A2: `She cannot ride a bike`, q3A3: `She hates coffee`
          };
        }
        if (slug === "charice") {
          return {
            title: `🍒 Level 7: Charice's Roots, Motorbike, & Braces`,
            desc: `Deep dive into Charice's hometown, twin sister, motorbike riding, and shy nature.`,
            m1Title: `Cavite Roots & Nickname`,
            m1Content: `Like my twin sister Angela, I am from Cavite, Philippines. I call myself "Cha" and have a quiet, shy personality off-stage. I love listening to Justin Bieber and Taylor Swift to get inspired.`,
            m2Title: `Motorcycle Riding & Braces`,
            m2Content: `A fun fact about me is that I can drive a motorcycle! It gives me a sense of freedom. Also, you might notice my signature smile because I wear braces.`,
            q1: `What is Charice's hometown?`,
            q1A1: `Cavite, Philippines (Correct)`, q1A2: `Las Piñas`, q1A3: `Cebu City`,
            q2: `What vehicle can Charice drive?`,
            q2A1: `Motorcycle (Correct)`, q2A2: `Helicopter`, q2A3: `Submarine`,
            q3: `Who is Charice's twin sister in the group?`,
            q3A1: `Angela (Correct)`, q3A2: `Alexa`, q3A3: `Sophia`
          };
        }
        if (slug === "alexa") {
          return {
            title: `🐉 Level 7: Alexa's Las Piñas Coffee & Anime`,
            desc: `Deep dive into Alexa's hometown, cleanliness habits, coffee passion, and anime hobby.`,
            m1Title: `Las Piñas & Cleanliness`,
            m1Content: `I am from Las Piñas City. I am known as the cleanest member of KAIA—I cannot stand a messy room! Keeping things organized helps me stay focused and calm during hectic schedules.`,
            m2Title: `Coffee, Anime, & Role Models`,
            m2Content: `I love coffee and drink it very often. My favorite hobby is watching anime. When it comes to performance, my main role models are Jeon Soyeon (of (G)I-DLE) and CL (of 2NE1) because of their fierce rap flows.`,
            q1: `What is Alexa's hometown?`,
            q1A1: `Las Piñas City, Philippines (Correct)`, q1A2: `Cavite`, q1A3: `Manila`,
            q2: `Which member is known as the cleanest member of KAIA?`,
            q2A1: `Alexa (Correct)`, q2A2: `Charlotte`, q2A3: `Angela`,
            q3: `Who are Alexa's musical role models?`,
            q3A1: `Jeon Soyeon and CL (Correct)`, q3A2: `Taylor Swift only`, q3A3: `Ariana Grande`
          };
        }
        if (slug === "sophia") {
          return {
            title: `🦊 Level 7: Sophia's Manila Coffee, Glasses & SB19`,
            desc: `Deep dive into Sophia's hometown, coffee sleeping skills, eye grade, and backup dancer days.`,
            m1Title: `Manila Roots & Coffee Power`,
            m1Content: `I am from Manila, Philippines. A fun fact about me is that I can drink coffee all day and still sleep perfectly! Coffee is my fuel. My favorite color combo is red and pink.`,
            m2Title: `Glasses Grade & SB19 Connection`,
            m2Content: `I wear glasses because I have a -4.00 eye grade. Also, before my debut in KAIA, I worked as a backup dancer for SB19, which taught me the dedication required to perform at the highest levels. My role model is Taylor Swift.`,
            q1: `What is Sophia's hometown?`,
            q1A1: `Manila, Philippines (Correct)`, q1A2: `Quezon City`, q1A3: `Cavite`,
            q2: `What is Sophia's eye grade for her glasses?`,
            q2A1: `-4.00 (Correct)`, q2A2: `-1.50`, q2A3: `-6.00`,
            q3: `Which P-pop group did Sophia dance for before debuting?`,
            q3A1: `SB19 (Correct)`, q3A2: `ALAMAT`, q3A3: `BGYO`
          };
        }
        if (slug === "charlotte") {
          return {
            title: `🍊 Level 7: Charlotte's QC Okra, Otters, & Korean`,
            desc: `Deep dive into Charlotte's hometown, favorite food okra, otter obsession, and Korean skills.`,
            m1Title: `Quezon City & Okra`,
            m1Content: `I am from Quezon City, Philippines. I am the youngest (Bunso) of KAIA. A fun fact about my eating habits is that I love eating okra! Many people find it slimy, but I find it delicious and healthy.`,
            m2Title: `Otters & Korean Language`,
            m2Content: `My favorite animal is the otter 🦦. I also love rainy days. Another fun fact is that I can understand some Korean, which helps me follow P-pop and K-pop industry trends.`,
            q1: `What is Charlotte's hometown?`,
            q1A1: `Quezon City, Philippines (Correct)`, q1A2: `Manila`, q1A3: `Las Piñas`,
            q2: `What is Charlotte's favorite food that she often mentions?`,
            q2A1: `Okra (Correct)`, q2A2: `Broccoli`, q2A3: `Chocolate`,
            q3: `What is Charlotte's favorite animal?`,
            q3A1: `Otter (Correct)`, q3A2: `Koala`, q3A3: `Kitten`
          };
        }
      }
      
      // LEVEL 8: Performance Styles & Backgrounds
      if (lvl === 8) {
        if (slug === "angela") {
          return {
            title: `🐻 Level 8: Angela's Stage Presence & Posture`,
            desc: `Analyze Angela's lead dancer focus on clean alignment and posture.`,
            m1Title: `Lead Dancer Alignment`,
            m1Content: `As a lead dancer, my focus is on posture and alignment. Clean lines make group choreographies look professional. I spend rehearsals correcting my arm angles and maintaining a centered posture.`,
            m2Title: `Facial Expressions & Eye Contact`,
            m2Content: `Stage presence is not just footwork; it is about connecting with the camera. I practice keeping my gaze warm but strong, ensuring that the audience feels the emotion behind every lyric we perform.`,
            q1: `What is Angela's focus as a lead dancer in KAIA?`,
            q1A1: `Posture, clean lines, and arm angles (Correct)`, q1A2: `Doing backflips only`, q1A3: `Standing in the back`,
            q2: `Why does Angela emphasize facial expressions and eye contact?`,
            q2A1: `To connect with the camera and convey emotion (Correct)`, q2A2: `To look funny`, q2A3: `To avoid looking at the audience`,
            q3: `What does Angela recommend for clean group choreographies?`,
            q3A1: `Precise alignment and centered postures (Correct)`, q3A2: `Every member dancing in their own tempo`, q3A3: `Only using one hand`
          };
        }
        if (slug === "charice") {
          return {
            title: `🍒 Level 8: Charice's Hip-Hop & Popping Angles`,
            desc: `Study Charice's sharp hip-hop techniques and dance execution.`,
            m1Title: `Popping and Locking Fundamentals`,
            m1Content: `I love hip-hop dance styles. My strength lies in executing sharp popping and locking movements. During our fast dance breaks, I focus on isolation drills, moving one part of my body while keeping the rest still.`,
            m2Title: `Footwork Stamina`,
            m2Content: `Fast footwork requires high ankle strength and balance. I train by repeating choreography segments at 1.25x speed during rehearsals to make the normal speed feel effortless on stage.`,
            q1: `What dance style is Charice's strength in KAIA?`,
            q1A1: `Popping, locking, and hip-hop (Correct)`, q1A2: `Classical ballet`, q1A3: `Tap dancing`,
            q2: `What training technique does Charice use to make normal speed choreo feel effortless?`,
            q2A1: `Practicing segments at 1.25x speed (Correct)`, q2A2: `Dancing in slow motion only`, q2A3: `Sitting down while listening`,
            q3: `What is isolation drilling in Charice's dance lesson?`,
            q3A1: `Moving one body part while keeping the rest still (Correct)`, q3A2: `Dancing alone in a dark room`, q3A3: `Singing without dancing`
          };
        }
        if (slug === "alexa") {
          return {
            title: `🐉 Level 8: Alexa's Camera Projection & Sass`,
            desc: `Explore Alexa's focus on camera projection, facial cues, and sassy presence.`,
            m1Title: `Sassy Stage Projection`,
            m1Content: `My performance style is attitude-driven. I focus on projection—making sure that my energy reaches the back row of the audience. I use a sassy, confident smile to match the girl crush concepts.`,
            m2Title: `Camera Cues & Angles`,
            m2Content: `Finding the active camera is key during live television broadcasts. I train to spot the red tally light on cameras instantly, adapting my angles so that my rap deliveries are captured perfectly.`,
            q1: `What is a key feature of Alexa's stage performance style?`,
            q1A1: `Attitude-driven projection and sassy smiles (Correct)`, q1A2: `Being extremely shy and looking down`, q1A3: `Classical opera gestures`,
            q2: `What is the red tally light on a studio camera used for?`,
            q2A1: `To indicate which camera is currently active/broadcasting (Correct)`, q2A2: `To decorate the stage`, q2A3: `To tell the artist to stop dancing`,
            q3: `How does Alexa ensure her rap deliveries look clean on TV?`,
            q3A1: `By locating active cameras instantly and adapting her angles (Correct)`, q3A2: `By asking the director to stop moving`, q3A3: `By closed-eye rapping`
          };
        }
        if (slug === "sophia") {
          return {
            title: `🦊 Level 8: Sophia's Backup Dancer Discipline`,
            desc: `Analyze Sophia's training under SB19 and her team synchronization.`,
            m1Title: `The Backup Dancer Legacy`,
            m1Content: `Working as a backup dancer for SB19 taught me the importance of absolute precision. Backup dancers must match the main artist's timing perfectly. I brought this high standard of synchronization into KAIA.`,
            m2Title: `Team Spatial Awareness`,
            m2Content: `Spatial awareness means knowing where your members are without looking. During complex transitions, I maintain a mental map of the stage to avoid collisions and keep our formations tight.`,
            q1: `Which P-pop group's backup dancer ranks did Sophia train in?`,
            q1A1: `SB19 (Correct)`, q1A2: `BGYO`, q1A3: `ALAMAT`,
            q2: `What is spatial awareness in Sophia's dance lesson?`,
            q2A1: `Knowing where your members are without looking to keep formations tight (Correct)`, q2A2: `Knowing the weather outside`, q2A3: `Looking at the floor to find marked tape`,
            q3: `What core quality did Sophia bring from her backup dancer days?`,
            q3A1: `Absolute precision and high synchronization standards (Correct)`, q3A2: `Leading all vocal solos`, q3A3: `Designing the stage costumes`
          };
        }
        if (slug === "charlotte") {
          return {
            title: `🍊 Level 8: Charlotte's Cheerleading Endurance`,
            desc: `Study how Charlotte's cheerleading background translates to stage endurance.`,
            m1Title: `Cheerleading Agility & Core Strength`,
            m1Content: `Before joining KAIA, I was in a cheerleading squad. Cheerleading builds core strength, balance, and the ability to execute high-energy jumps. I use these skills to execute bouncy moves in our choreo.`,
            m2Title: `Performance Smile Stamina`,
            m2Content: `In cheerleading, you must smile and maintain high facial energy even when exhausted. This training helps me keep a bright, positive facial expression during demanding 3-song live sets.`,
            q1: `What athletic background does Charlotte have before P-pop?`,
            q1A1: `Cheerleading (Correct)`, q1A2: `Figure skating`, q1A3: `Synchronized swimming`,
            q2: `How does cheerleading benefit Charlotte's stage presence?`,
            q2A1: `It gives her core strength, balance, and performance smile stamina (Correct)`, q2A2: `It helps her play the guitar`, q2A3: `It teaches her how to write lyrics`,
            q3: `What is 'smile stamina' according to Charlotte's lesson?`,
            q3A1: `Maintaining high facial energy and expressions even when physically exhausted (Correct)`, q3A2: `Smiling only at the end of a song`, q3A3: `Laughing during sad lines`
          };
        }
      }
      
      // LEVEL 9: Vocal & Rapping Dynamics
      if (lvl === 9) {
        if (slug === "angela") {
          return {
            title: `🐻 Level 9: Angela's Vocal Blends & Pitch`,
            desc: `Explore Angela's vocal techniques, pitch control, and harmony leading.`,
            m1Title: `Warm Tone & Pitch Control`,
            m1Content: `As a vocalist, my strength lies in my warm tone. I practice pitch control daily, using vocal warm-ups like lip trills and scale runs to ensure my notes are stable, especially during live dance sets.`,
            m2Title: `Leading Group Harmonies`,
            m2Content: `KAIA's choruses often feature complex harmonies. I coordinate our vocal sessions, guiding how we blend our registers (chest, mixed, head voice) so that our five voices sound like a single unit.`,
            q1: `What vocal register blending does Angela lead in rehearsals?`,
            q1A1: `Chest, mixed, and head voice blending (Correct)`, q1A2: `Whisper registers only`, q1A3: `Screaming pitches`,
            q2: `What daily exercise does Angela use for pitch control stability?`,
            q2A1: `Lip trills and scale runs (Correct)`, q2A2: `Running on a treadmill in silence`, q2A3: `Drinking iced water`,
            q3: `What is the primary goal of KAIA's group harmonies?`,
            q3A1: `To blend five distinct voices into a single, unified sound (Correct)`, q3A2: `For each member to sing as loud as possible`, q3A3: `To avoid singing at the same time`
          };
        }
        if (slug === "charice") {
          return {
            title: `🍒 Level 9: Charice's Rap Speed & Articulation`,
            desc: `Deconstruct Charice's rapid rap flows and breath management.`,
            m1Title: `Rapid-Fire Rap articulation`,
            m1Content: `Delivering fast rap verses requires excellent articulation. I practice by exaggerating my jaw and tongue movements during slow reviews, then speeding up to ensure every consonant is audible.`,
            m2Title: `Breath Management in Fast Verses`,
            m2Content: `Rapping fast while dancing can drain your breath. I map out my breath cues—knowing exactly where to take short sips of air between syllables to maintain a steady flow of energy.`,
            q1: `How does Charice practice to ensure fast rap lines are audible?`,
            q1A1: `Exaggerating jaw and tongue movements at slow speeds first (Correct)`, q1A2: `Whispering the lines`, q1A3: `Speaking without moving her lips`,
            q2: `What is breath cue mapping in Charice's rap lesson?`,
            q2A1: `Planning exactly where to take short sips of air between syllables (Correct)`, q2A2: `Holding your breath for the entire song`, q2A3: `Breathing heavily into the microphone`,
            q3: `Which of the following describes Charice's rap style?`,
            q3A1: `Fast-flow and rapid precision (Correct)`, q3A2: `Slow and operatic`, q3A3: `Quiet whispering`
          };
        }
        if (slug === "alexa") {
          return {
            title: `🐉 Level 9: Alexa's Stylistic Rap Flow & Tone`,
            desc: `Study Alexa's tone modulation and stylistic rap delivery.`,
            m1Title: `Tone Modulation & Attitude`,
            m1Content: `A great rap delivery isn't just about speed; it's about tone. I modulate my voice, switching between a higher, punchy tone and a deeper, grittier flow to add texture and attitude to my verses.`,
            m2Title: `Rhythmic Speech Pockets`,
            m2Content: `Rappers must find the "pocket" of the beat—the slight delay or rush that gives the flow style. I study how CL and Soyeon ride the rhythm, adapting their confidence to my own delivery.`,
            q1: `What vocal technique does Alexa use to add texture and attitude to her rap?`,
            q1A1: `Tone modulation between high punchy and deep gritty flows (Correct)`, q1A2: `Singing in falsetto only`, q1A3: `Monotone speaking`,
            q2: `What is finding the 'pocket' in Alexa's rap lesson?`,
            q2A1: `Riding the beat's rhythm with styled timing (Correct)`, q2A2: `Putting the microphone in your pocket`, q2A3: `Forgetting the lyrics`,
            q3: `Which artists serve as Alexa's primary blueprints for rap delivery?`,
            q3A1: `CL and Jeon Soyeon (Correct)`, q3A2: `Taylor Swift`, q3A3: `Justin Bieber`
          };
        }
        if (slug === "sophia") {
          return {
            title: `🦊 Level 9: Sophia's Vocal Belt & Stability`,
            desc: `Deconstruct Sophia's high notes and vocal stability.`,
            m1Title: `The High Note Belt`,
            m1Content: `Belting high notes requires proper support from the diaphragm. I practice engaging my core muscles to project power without straining my vocal cords, ensuring that my belts sound clean and effortless.`,
            m2Title: `Vocal Stability During Cardio`,
            m2Content: `To sing high notes while executing intense dance moves, I practice vocal scales while doing light cardio (like jumping jacks or jogging). This builds the lung capacity needed for live stages.`,
            q1: `Where should support come from when belting high notes?`,
            q1A1: `The diaphragm and core muscles (Correct)`, q1A2: `The throat only`, q1A3: `The shoulders`,
            q2: `How does Sophia train to maintain vocal stability during choreography?`,
            q2A1: `Practicing vocal scales while doing light cardio (Correct)`, q2A2: `Sitting down on a chair`, q2A3: `By not singing during dance practice`,
            q3: `What is Sophia's focus when executing high-note belts?`,
            q3A1: `Projecting power without straining the vocal cords (Correct)`, q3A2: `Screaming as loud as possible`, q3A3: `Using heavy auto-tune`
          };
        }
        if (slug === "charlotte") {
          return {
            title: `🍊 Level 9: Charlotte's Vocal-to-Rap Transitions`,
            desc: `Analyze Charlotte's versatility in transitioning between rap and vocals.`,
            m1Title: `Switching Gears Mid-Song`,
            m1Content: `In several KAIA tracks, I transition from a melodic vocal line straight into a rap verse. This requires rapid adjustments in my vocal cord compression, going from a loose, open throat to a tight, spoken flow.`,
            m2Title: `Mid-Register Stability`,
            m2Content: `My vocal range sits in the comfortable mid-register. I work on stabilizing this range, ensuring it sounds full and warm, serving as a reliable bridge between our high vocalists and deep rappers.`,
            q1: `What vocal transition is Charlotte known for executing mid-song?`,
            q1A1: `Melodic vocal lines to spoken rap flows (Correct)`, q1A2: `Soprano to bass registers`, q1A3: `Singing to whistling`,
            q2: `Where does Charlotte's comfortable vocal range sit?`,
            q2A1: `The mid-register (Correct)`, q2A2: `Extreme high falsetto`, q2A3: `Deep bass register`,
            q3: `How does Charlotte adjust her voice when transitioning to rap?`,
            q3A1: `Adjusting vocal cord compression from open throat to tight spoken flow (Correct)`, q3A2: `By whispering`, q3A3: `By speaking slower`
          };
        }
      }
      
      // LEVEL 10: Graduation & P-Pop Futures
      if (lvl === 10) {
        if (slug === "angela") {
          return {
            title: `🐻 Level 10: Angela's Scorpio Dream & ZAIA Fandom`,
            desc: `Celebrate graduation with Angela's vision for KAIA's global future and ZAIAs.`,
            m1Title: `Scorpio Passion & Global Vision`,
            m1Content: `As a Scorpio born on Nov 3, I am passionate and protective. My vision is to take KAIA and P-pop to global stages, showcasing Filipino culture, language, and talent. We want to show that local stories are globally relevant.`,
            m2Title: `Thank You ZAIAs`,
            m2Content: `ZAIA represents light, guiding us through the dark. Thank you for completing my 10-level curriculum! Continue to make everyday your masterpiece, and let's walk this path together forever.`,
            q1: `What is Angela's zodiac sign?`,
            q1A1: `Scorpio (Correct)`, q1A2: `Taurus`, q1A3: `Leo`,
            q2: `What does the fandom name ZAIA signify?`,
            q2A1: `Light, serving as a guide to KAIA's world (Correct)`, q2A2: `Rain and clouds`, q2A3: `Silence and rest`,
            q3: `What is Angela's final graduation message to ZAIAs?`,
            q3A1: `Make everyday your masterpiece and walk together (Correct)`, q3A2: `Squeeze lemons in eyes`, q3A3: `Quit studying`
          };
        }
        if (slug === "charice") {
          return {
            title: `🍒 Level 10: Charice's ISTJ Perseverance & World Stage`,
            desc: `Celebrate graduation with Charice's persistent outlook and gratitude.`,
            m1Title: `ISTJ Focus & Perseverance`,
            m1Content: `As an ISTJ, I am detail-oriented and persistent. I believe that steady progress and discipline will lead us to the world stage. We are constantly upgrading our skills to match international performance standards.`,
            m2Title: `Cherry Blessings for ZAIAs`,
            m2Content: `To all ZAIAs who graduated from my courses: thank you for believing in me, even when I was shy. Remember to take the risk, or lose a chance. The future belongs to those who dare.`,
            q1: `What is Charice's MBTI personality type?`,
            q1A1: `ISTJ (Correct)`, q1A2: `INFP`, q1A3: `ENFP`,
            q2: `What is Charice's advice to graduates of her courses?`,
            q2A1: `Take the risk, or lose a chance (Correct)`, q2A2: `Stay quiet and never speak`, q2A3: `Avoid taking risks`,
            q3: `What birthday does Charice share with her twin sister Angela?`,
            q3A1: `November 3, 1998 (Correct)`, q3A2: `May 20, 2000`, q3A3: `August 22, 2001`
          };
        }
        if (slug === "alexa") {
          return {
            title: `🐉 Level 10: Alexa's Taurus Pride & Self-Acceptance`,
            desc: `Celebrate graduation with Alexa's message of pride and self-acceptance.`,
            m1Title: `Taurus Determination`,
            m1Content: `Born on May 20, I am a Taurus. We are known for determination and stability. Through KAIA, I learned to accept myself—both the cute "Alexa Kyutie" and the fierce rapper. I want ZAIAs to embrace all sides of themselves too.`,
            m2Title: `The Dragon Fandom Shield`,
            m2Content: `Thank you for completing my courses! Squeeze those lemons when life gets tough. With ZAIA's light and my dragon fire, there is nothing we cannot overcome. Congratulations on your graduation!`,
            q1: `What is Alexa's zodiac sign?`,
            q1A1: `Taurus (Correct)`, q1A2: `Scorpio`, q1A3: `Libra`,
            q2: `What is Alexa's core graduation advice regarding self-acceptance?`,
            q2A1: `Embrace all sides of yourself, both cute and fierce (Correct)`, q2A2: `Hide your true personality`, q2A3: `Try to copy others exactly`,
            q3: `What is Alexa's birthday?`,
            q3A1: `May 20, 2000 (Correct)`, q3A2: `November 3, 1998`, q3A3: `October 9, 2001`
          };
        }
        if (slug === "sophia") {
          return {
            title: `🦊 Level 10: Sophia's Leo Ambition & Swiftie Legacy`,
            desc: `Celebrate graduation with Sophia's Leo confidence and Taylor Swift inspirations.`,
            m1Title: `Leo Confidence & Swiftie Drive`,
            m1Content: `Born on August 22, I am a Leo. We are natural performers. Inspired by my role model Taylor Swift, I strive to write, perform, and connect with fans at a deep level. I want to build a legacy of quality P-pop music.`,
            m2Title: `Fox Intellect Graduates`,
            m2Content: `Congratulations, graduates! You worked until you no longer have to introduce yourselves. Your dedication to learning about KAIA's vocal stability and stage presence makes you true ZAIAs. Thank you!`,
            q1: `What is Sophia's zodiac sign?`,
            q1A1: `Leo (Correct)`, q1A2: `Taurus`, q1A3: `Scorpio`,
            q2: `Who is Sophia's primary musical role model and inspiration?`,
            q2A1: `Taylor Swift (Correct)`, q2A2: `CL`, q2A3: `Jeon Soyeon`,
            q3: `What is Sophia's birthday?`,
            q3A1: `August 22, 2001 (Correct)`, q3A2: `November 3, 1998`, q3A3: `October 9, 2001`
          };
        }
        if (slug === "charlotte") {
          return {
            title: `🍊 Level 10: Charlotte's INFP-T Dream & Youngest Promise`,
            desc: `Celebrate graduation with Charlotte's INFP-T growth and bunso promise.`,
            m1Title: `INFP-T Imagination & Bunso Promise`,
            m1Content: `As an INFP-T, I am a dreamer. Being the Bunso of KAIA, I promise to always bring fresh energy and keep our group's bond warm and youthful. I believe P-pop has a beautiful future filled with creativity.`,
            m2Title: `The Otter Fandom Wave`,
            m2Content: `To all ZAIAs who completed my 10 levels: thank you! Okra is healthy, otters are cute, and everything happens for a reason. Believe in your path and keep supporting KAIA. Happy graduation!`,
            q1: `What is Charlotte's MBTI personality type?`,
            q1A1: `INFP-T (Correct)`, q1A2: `ISTJ`, q1A3: `ENFJ`,
            q2: `What promise does Charlotte make as the bunso of KAIA?`,
            q2A1: `To always bring fresh energy and keep the group's bond warm and youthful (Correct)`, q2A2: `To take over as the leader`, q2A3: `To stop singing`,
            q3: `What is Charlotte's birthday?`,
            q3A1: `October 9, 2001 (Correct)`, q3A2: `November 3, 1998`, q3A3: `May 20, 2000`
          };
        }
      }
      
      // Default fallback
      return {
        title: `${emoji} Level ${lvl}: Special P-pop Studies with ${name}`,
        desc: `Overview of KAIA P-pop girl group.`,
        m1Title: `Core Concept`,
        m1Content: `KAIA represents P-pop.`,
        m2Title: `Class Study`,
        m2Content: `Study P-pop dynamics.`,
        q1: `What group is this?`,
        q1A1: `KAIA (Correct)`, q1A2: `SB19`, q1A3: `BGYO`,
        q2: `What is the fandom?`,
        q2A1: `ZAIA (Correct)`, q2A2: `ATIN`, q2A3: `ACES`,
        q3: `Who is the leader?`,
        q3A1: `Angela (Correct)`, q3A2: `Charice`, q3A3: `Alexa`
      };
    }

    for (let lvl = 1; lvl <= 10; lvl++) {
      console.log(`Generating Level ${lvl} courses...`);
      for (let mIdx = 0; mIdx < membersList.length; mIdx++) {
        const member = membersList[mIdx];
        const courseId = `course-${lvl}-${member.slug}`;
        const quizId = `quiz-${lvl}-${member.slug}`;
        const badgeId = `badge-${lvl}-${member.slug}`;
        
        const difficulty = lvl <= 3 ? ("BEGINNER" as const) : lvl <= 7 ? ("INTERMEDIATE" as const) : ("ADVANCED" as const);
        const pointsReward = lvl * 50;
        const estMins = lvl * 10;

        const data = getLevelData(lvl, member);

        // Create Course
        await db.insert(schema.courses).values({
          id: courseId,
          slug: `${lvl}-${member.slug}`,
          title: data.title,
          description: data.desc,
          category: lvl % 2 === 0 ? ("MINI" as const) : ("MAIN" as const),
          memberId: member.id,
          difficulty,
          minLevel: lvl,
          pointsReward,
          coverEmoji: member.emoji,
          estimatedMinutes: estMins,
          order: lvl * 10 + mIdx,
          isActive: true,
        }).onConflictDoNothing();

        // Create 2 Modules
        await db.insert(schema.courseModules).values([
          {
            id: `module-${lvl}-${member.slug}-1`,
            courseId,
            title: data.m1Title,
            content: data.m1Content,
            order: 1,
            pointsReward: 10,
          },
          {
            id: `module-${lvl}-${member.slug}-2`,
            courseId,
            title: data.m2Title,
            content: data.m2Content,
            order: 2,
            pointsReward: 10,
          }
        ]).onConflictDoNothing();

        // Create Quiz
        await db.insert(schema.courseQuizzes).values({
          id: quizId,
          courseId,
          title: `${member.emoji} Level ${lvl} Examination`,
          passingScore: 70,
          order: 1,
        }).onConflictDoNothing();

        // Create 3 Quiz Questions & Answers
        const q1Id = `q-${lvl}-${member.slug}-1`;
        const q2Id = `q-${lvl}-${member.slug}-2`;
        const q3Id = `q-${lvl}-${member.slug}-3`;

        await db.insert(schema.courseQuizQuestions).values([
          { id: q1Id, quizId, question: data.q1, order: 1 },
          { id: q2Id, quizId, question: data.q2, order: 2 },
          { id: q3Id, quizId, question: data.q3, order: 3 },
        ]).onConflictDoNothing();

        const cleanAns = (str: string) => str.replace(" (Correct)", "").replace(" (correct)", "");

        await db.insert(schema.courseQuizAnswers).values([
          // Q1 Answers
          { id: `a-${q1Id}-1`, questionId: q1Id, answer: cleanAns(data.q1A1), isCorrect: true, order: 1 },
          { id: `a-${q1Id}-2`, questionId: q1Id, answer: cleanAns(data.q1A2), isCorrect: false, order: 2 },
          { id: `a-${q1Id}-3`, questionId: q1Id, answer: cleanAns(data.q1A3), isCorrect: false, order: 3 },
          
          // Q2 Answers
          { id: `a-${q2Id}-1`, questionId: q2Id, answer: cleanAns(data.q2A1), isCorrect: true, order: 1 },
          { id: `a-${q2Id}-2`, questionId: q2Id, answer: cleanAns(data.q2A2), isCorrect: false, order: 2 },
          { id: `a-${q2Id}-3`, questionId: q2Id, answer: cleanAns(data.q2A3), isCorrect: false, order: 3 },
          
          // Q3 Answers
          { id: `a-${q3Id}-1`, questionId: q3Id, answer: cleanAns(data.q3A1), isCorrect: true, order: 1 },
          { id: `a-${q3Id}-2`, questionId: q3Id, answer: cleanAns(data.q3A2), isCorrect: false, order: 2 },
          { id: `a-${q3Id}-3`, questionId: q3Id, answer: cleanAns(data.q3A3), isCorrect: false, order: 3 },
        ]).onConflictDoNothing();

        // Create Badge
        const rarity = lvl <= 3 ? ("COMMON" as const) : lvl <= 7 ? ("RARE" as const) : lvl <= 9 ? ("EPIC" as const) : ("LEGENDARY" as const);
        await db.insert(schema.courseBadges).values({
          id: badgeId,
          courseId,
          name: `${member.name}'s Lvl ${lvl} Star`,
          icon: member.emoji,
          description: `Awarded for mastering Level ${lvl} ${member.topic} with Prof. ${member.name}.`,
          rarity,
        }).onConflictDoNothing();
      }
    }

    console.log("✅ Seeding complete!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  }
}

seed();
