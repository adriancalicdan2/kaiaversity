# KAIAVERSITY — Implementation Plan

A university-themed fan engagement web app for KAIA (K-pop girl group) and their fans (ZAIAs).
Fans earn points, level up, complete daily quests, and interact with KAIA members as "professors."

---

## ⚠️ User Review Required

> [!IMPORTANT]
> The original plan uses `NextAuth v4` + `@auth/drizzle-adapter` which has known compatibility issues with Next.js 15 App Router. The updated plan uses **Auth.js v5 (NextAuth v5)** which is the official stable upgrade — fully compatible with App Router and Server Actions.

> [!IMPORTANT]
> The original plan uses `shadcn-ui@latest` CLI (deprecated package name). The correct CLI is now `npx shadcn@latest`. This is a breaking rename — the old package may error out.

> [!WARNING]
> **Turso + Drizzle ORM** is kept as recommended. However, `drizzle-kit push` is a **direct schema push** (no migrations). For production safety, you should use `drizzle-kit migrate` instead. Plan includes both options.

> [!NOTE]
> Member photos are not yet available. For launch, placeholder AI-generated images or real photos hosted on Cloudinary will be used.

---

## Recommended Tech Stack (Upgrades & Rationale)

| Category | Original Plan | ✅ Recommended Upgrade | Reason |
|---|---|---|---|
| Framework | Next.js (unspecified) | **Next.js 15 (App Router)** | Latest stable, Server Actions, better caching |
| Auth | NextAuth v4 | **Auth.js v5 (NextAuth v5)** | App Router native, no adapter issues |
| Database ORM | Drizzle ORM | **Drizzle ORM** ✅ Keep | Best-in-class, type-safe, works perfectly with Turso |
| Database | Turso (libSQL) | **Turso** ✅ Keep | Free 9GB, edge-ready, perfect fit |
| UI Components | shadcn/ui (old CLI) | **shadcn/ui** (new CLI `npx shadcn@latest`) | Must use correct CLI name |
| Forms | Manual | **React Hook Form + Zod** | Type-safe validation, pairs with shadcn form components |
| State | None specified | **Zustand** (lightweight) | For client-side points/quest state without Redux overhead |
| Animations | Tailwind only | **Framer Motion** | Smooth level-up animations, card flips for badges |
| Image Hosting | Cloudinary / Vercel Blob | **Cloudinary** ✅ (25GB free) | More generous free tier for member photos |
| Email | Resend | **Resend** ✅ Keep | Best free option, React Email templates |
| Deployment | Vercel | **Vercel** ✅ Keep | Optimal for Next.js |
| Analytics | Vercel Analytics | **Vercel Analytics** ✅ Keep | Zero-config, free |
| Icons | lucide-react | **lucide-react** ✅ Keep | Standard for shadcn ecosystem |

### Additional Recommended Libraries

```
npm install framer-motion          # Animations (level-up, badge unlock)
npm install react-hook-form zod    # Form validation
npm install zustand                # Lightweight client state
npm install date-fns               # Date formatting (birthdays, events)
npm install @tanstack/react-query  # Server state/caching for posts/quests
npm install resend @react-email/components  # Email templates
```

---

## Proposed Changes from Original Plan

### 1. Project Initialization

```bash
npx create-next-app@latest kaiaversity \
  --typescript --tailwind --app --eslint \
  --src-dir --import-alias "@/*"
cd kaiaversity
```

> [!TIP]
> Use `--src-dir` to keep `src/` clean and separate from config files at root.

---

### 2. Folder Structure (Refined)

```
kaiaversity/
├── src/
│   ├── app/
│   │   ├── (marketing)/           # Public pages (no auth)
│   │   │   ├── page.tsx           # Landing page
│   │   │   └── admissions/page.tsx # Sign-up/login
│   │   │
│   │   ├── (dashboard)/           # Protected pages (auth required)
│   │   │   ├── layout.tsx         # Auth guard + sidebar
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── professors/
│   │   │   │   ├── page.tsx       # All 5 members
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── campus/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── courses/page.tsx
│   │   │   │   ├── achievements/page.tsx
│   │   │   │   └── events/page.tsx
│   │   │   ├── community/page.tsx
│   │   │   └── profile/page.tsx
│   │   │
│   │   ├── admin/                 # KAIA member admin
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── posts/page.tsx
│   │   │   └── analytics/page.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── posts/route.ts
│   │       ├── points/route.ts
│   │       └── quests/route.ts
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn components
│   │   ├── professors/
│   │   │   ├── MemberCard.tsx
│   │   │   ├── MemberHeader.tsx
│   │   │   ├── FunFactCard.tsx
│   │   │   └── PostCard.tsx
│   │   ├── campus/
│   │   │   ├── DailyQuests.tsx
│   │   │   ├── PointsDisplay.tsx
│   │   │   └── LevelBadge.tsx
│   │   ├── dashboard/
│   │   │   ├── StudentID.tsx
│   │   │   └── ActivityFeed.tsx
│   │   └── shared/
│   │       ├── Navbar.tsx
│   │       ├── Sidebar.tsx
│   │       └── AchievementToast.tsx  # ← pop-up when badge unlocked
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts          # Drizzle schema
│   │   │   └── index.ts           # Turso client
│   │   ├── auth.ts                # Auth.js v5 config
│   │   ├── constants/
│   │   │   ├── members.ts         # All 5 KAIA members data
│   │   │   ├── achievements.ts    # Badge definitions
│   │   │   ├── quests.ts          # Daily quest definitions
│   │   │   └── levels.ts          # Level thresholds
│   │   ├── actions/               # ← NEW: Server Actions (replaces some API routes)
│   │   │   ├── points.ts          # addPoints(), claimDailyLogin()
│   │   │   ├── quests.ts          # completeQuest()
│   │   │   └── posts.ts           # likePost(), createComment()
│   │   └── utils.ts
│   │
│   └── types/
│       └── index.ts               # Global TypeScript types
│
├── public/
│   └── images/members/
├── drizzle/                       # Migration files
├── drizzle.config.ts
├── .env.local
└── package.json
```

> [!TIP]
> **Server Actions** (`lib/actions/`) replace many simple API routes. For example, `addPoints()` can be called directly from a React Server Component — no need for `fetch('/api/points')`. This is the Next.js 15 recommended pattern.

---

### 3. Database Schema (Drizzle ORM + Turso/libSQL)

#### [MODIFY] `src/lib/db/schema.ts`

Key schema decisions:
- Use `text('id').$defaultFn(() => crypto.randomUUID())` for UUIDs (no external package needed)
- Store JSON fields (funFacts, images, criteria) as `text` with Zod parsing on read
- Add `updatedAt` to `posts` and `users` for cache invalidation

```typescript
// Example: users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').unique().notNull(),
  username: text('username').unique(),
  name: text('name'),
  avatar: text('avatar'),
  role: text('role', { enum: ['ZAIA', 'PROFESSOR', 'ADMIN'] }).default('ZAIA'),
  points: integer('points').default(0),
  level: integer('level').default(1),
  favoriteMember: text('favorite_member'),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  lastActive: integer('last_active', { mode: 'timestamp' }),
});
```

---

### 4. Authentication (Auth.js v5)

#### [MODIFY] `src/lib/auth.ts`

```typescript
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [GitHub, Google],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      session.user.role = user.role  // expose role to client
      return session
    }
  }
})
```

> [!NOTE]
> Auth.js v5 exports `auth()` as a middleware-compatible function. Protect dashboard routes via `src/middleware.ts` using `export { auth as middleware }` — no wrapping needed.

---

### 5. Gamification — Server Actions Pattern

#### [NEW] `src/lib/actions/points.ts`

```typescript
"use server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export async function addPoints(amount: number, reason: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  await db.update(users)
    .set({ 
      points: sql`${users.points} + ${amount}`,
      lastActive: new Date()
    })
    .where(eq(users.id, session.user.id))

  // Check for level up + achievement unlock here
  await checkLevelUp(session.user.id)
}
```

---

### 6. Key UI Enhancements (Beyond Original Plan)

#### `AchievementToast.tsx` — Badge Unlock Animation
Using **Framer Motion** for a dramatic badge reveal overlay when a fan earns a new achievement.

#### `StudentID.tsx` — Digital Student ID Card
Animated flip card showing:
- Fan's avatar, name, level badge
- Favorite member with their emoji + color
- QR code placeholder (for future event check-ins)

#### `LevelBadge.tsx` — Animated Progress Bar
Framer Motion `useSpring` for smooth points fill animation on the level progress bar.

#### Member Profile Color Themes
Each member's page uses their brand color as the accent:
- Angela 🐻 → `#8B4513` (Brown)
- Charice 🍒 → `#DE3163` (Cherry Red)  
- Alexa 🐉 → `#FFD700` (Yellow)
- Sophia 🦊 → `#FF2400` (Scarlet)
- Charlotte 🍊 → `#98FF98` (Mint Green)

---

### 7. shadcn/ui Components to Install

```bash
# Correct CLI (NOT shadcn-ui, that's deprecated)
npx shadcn@latest init
npx shadcn@latest add button card badge progress \
  checkbox tabs avatar dialog toast sheet \
  form input textarea select separator skeleton
```

> [!IMPORTANT]
> Install `form`, `input`, `textarea` for the comment + admin post creation forms. The original plan omitted these.

---

### 8. Daily Quests — Smart Reset Logic

Quests reset at **midnight Philippine time (UTC+8)**. Implementation:

```typescript
// In quest completion check
const phTime = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })
const today = new Date(phTime).toDateString()
// Compare against userQuest.completedAt date string
```

---

### 9. Admin Panel — Simple Role Guard

Instead of a separate password, use the `PROFESSOR` or `ADMIN` role in the database:
- KAIA members are seeded as `role: 'PROFESSOR'`
- Admin panel checks `session.user.role === 'PROFESSOR' || 'ADMIN'`
- Members log in with Google using their personal Google accounts

---

## Open Questions

> [!IMPORTANT]
> **Do you have real photos of the KAIA members?** The plan assumes Cloudinary for member photos. If photos aren't ready at launch, I can generate placeholder images using AI.

> [!IMPORTANT]
> **Will KAIA members actually use the admin panel to post?** If yes, they need to sign in with Google accounts that we seed as `PROFESSOR` role. If not (i.e., you manage posts on their behalf), the admin flow is simpler.

> [!NOTE]
> **Should comments be real-time or refresh-based?** Real-time would require adding Pusher (free tier: 200k messages/day) or Supabase Realtime. The current plan is refresh-based (polling every 30s) to stay fully free.

> [!NOTE]
> **Multilingual support?** The content mixes English and Filipino expressions. No i18n library is planned — is that acceptable?

---

## Verification Plan

### Automated
- `npm run build` — TypeScript compilation check
- `npx drizzle-kit check` — Schema validation before migration

### Manual
- Log in with GitHub/Google → confirm session + role assigned
- Complete daily login quest → verify +10 points added
- Reach level threshold → confirm level badge updates
- Admin panel: create post → appears on dashboard feed
- Earn achievement → `AchievementToast` overlay appears

### Deployment Check
- `vercel --prod` — confirm environment variables set in Vercel dashboard
- Test Turso connection from production (check `TURSO_DATABASE_URL` is set)

---

## 7-Day Sprint (Revised)

| Day | Focus | Key Deliverables |
|-----|-------|-----------------|
| 1 | Setup | Next.js init, Turso + Drizzle schema, Auth.js v5, `.env.local` |
| 2 | Member Data + Profiles | `members.ts` constants, professor list page, individual member pages with brand colors |
| 3 | Content System | Post CRUD, admin panel, like/comment Server Actions |
| 4 | Points + Quests | `addPoints()` action, daily quest reset, quest completion tracking |
| 5 | Achievements | Badge unlock logic, `AchievementToast`, profile badge display |
| 6 | Dashboard + Polish | Student ID card, activity feed, Framer Motion animations, mobile responsiveness |
| 7 | Testing + Deploy | Seed sample posts, production build, Vercel deploy, share with beta ZAIAs |

---

## Cost Summary (Still $0)

| Service | Free Tier | Usage |
|---------|-----------|-------|
| Vercel | Unlimited deploys, 100GB bandwidth | Hosting |
| Turso | 9GB, 1B reads/month | Database |
| Cloudinary | 25GB storage + bandwidth | Member photos |
| Auth.js + GitHub/Google OAuth | Free | Authentication |
| Resend | 3,000 emails/month | Welcome emails |
| All libraries | Open source | App logic |
| **Total** | **$0/month** | |
