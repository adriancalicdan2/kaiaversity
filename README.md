# 🎓 KAIAVERSITY

**KAIAVERSITY** is a premium, university-themed fan engagement platform designed for **KAIA** and their fans (**ZAIAs**). The app gamifies fan interaction through academic coursework, daily quests, level progressions, achievements, and social feeds, all managed via a robust Admin Control Center.

---

## 🌟 What the App Does

### 1. The Student Journey (ZAIA Campus)
Fans register as students to explore the campus and learn more about their favorite members:
- **Student ID Card**: A personalized digital card tracking the student's name, email, level (Freshman $\rightarrow$ Graduate), and total earned points.
- **Professor Profiles**: KAIA members act as university professors. Each professor has a custom profile detailing their official bio, zodiac sign, MBTI, fun facts, role models, and courses they teach.
- **Academic Courses & Quizzes**: Students can enroll in courses (e.g. *Intro to Angela & Leadership*), read lecture modules, complete multiple-choice quizzes, and submit final projects for grading.
- **Daily Quests**: Daily-resetting checklists (such as logging in, reading a lecture, liking a post, or commenting) that reward students with points on completion.
- **Achievements & Badges**: Gamified badges unlocked dynamically by leveling up (e.g., Sophomore, Junior) or through specific member engagement (e.g. *Coffee Lover* for Alexa, *Twin Whisperer* for Angela/Charice).
- **Leaderboard**: A live rankings board displaying the top ZAIAs on campus based on points and level.
- **Interactive Feed**: Students can browse announcements, diaries, and lectures, like posts, and write comments. Likes and comments are saved and synced in real-time.

### 2. Admin Control Center
A dark-themed command center at `/admin` that grants administrators full moderation power:
- **Dashboard Overview**: Displays live stats (total users, posts, enrollments, points awarded) and recent submissions.
- **User Management**: Promote or demote user roles (`ZAIA` $\leftrightarrow$ `PROFESSOR` $\leftrightarrow$ `ADMIN`), manually award or adjust points, and delete accounts (safeguarded against database constraint issues).
- **Content Moderation**: Edit, publish/unpublish, pin/unpin, and delete community posts.
- **Course & Module Editor**: Activate or deactivate courses, and configure their modules.
- **Project Submissions Queue**: Review pending project submissions from students to approve (awards completion points) or reject them with review notes.
- **Events, Quests, & Achievements Creators**: Direct forms to create, delete, and toggle event notices, daily quests, and achievements.

### 3. Authentication & Security
- **Email & Password Authentication**: Fully custom login/signup flow with secure passwords hashed using Node's native `scrypt` algorithm.
- **OAuth Login**: Supports signing in with Google, with automatic database record synchronization.
- **Edge Routing Guards**: Optimized middleware (`src/proxy.ts`) that reads JWT tokens to guard routes, automatically redirecting admins away from student feeds to `/admin/dashboard`.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router & Turbopack)
- **Database**: Turso & SQLite (`libsql`) with Drizzle ORM
- **Authentication**: Auth.js v5 (`next-auth` JWT strategy)
- **Styling**: Tailwind CSS & Vanilla CSS (Harmonious glassmorphism command aesthetics)
- **State & Logic**: React Context, optimistic states, and Server Actions

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20+
- SQLite (or Turso Database URL + auth token for production)

### 2. Environment Setup
Create a `.env.local` file in the project root:
```bash
# Auth.js
AUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Turso / SQLite
TURSO_DATABASE_URL=file:local.db
TURSO_AUTH_TOKEN=

# Firebase client config (required for Google sign-in and global chat)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

On Netlify, add the same Firebase variables under Site configuration -> Environment variables. Missing or invalid `NEXT_PUBLIC_FIREBASE_API_KEY` values can cause Firebase auth/chat to fail at runtime.

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup
Push the Drizzle schema to your SQLite database:
```bash
npm run db:push
```
Seed members, quests, achievements, and baseline posts:
```bash
npm run db:seed
```

### 5. Running the App
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app!

### 6. Production Build
Verify typings and build the optimized production package:
```bash
npm run build
```
