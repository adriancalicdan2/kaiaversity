import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ============================================================
// USERS
// ============================================================
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique().notNull(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  username: text("username").unique(),
  name: text("name"),
  avatar: text("avatar"),
  image: text("image"),   // required by Auth.js DrizzleAdapter
  role: text("role", { enum: ["ZAIA", "PROFESSOR", "ADMIN"] })
    .default("ZAIA")
    .notNull(),
  points: integer("points").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  favoriteMember: text("favorite_member"),
  bio: text("bio"),
  passwordHash: text("password_hash"),
  joinedAt: integer("joined_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  lastActive: integer("last_active", { mode: "timestamp" }),
});

// ============================================================
// AUTH.JS v5 REQUIRED TABLES
// ============================================================
export const accounts = sqliteTable("accounts", {
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

// ============================================================
// KAIA MEMBERS
// ============================================================
export const members = sqliteTable("members", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  stageName: text("stage_name").notNull(),
  slug: text("slug").unique().notNull(), // e.g. "angela", "charice"
  fullName: text("full_name"),
  position: text("position").notNull(), // e.g. "Leader, Vocalist, Dancer"
  birthday: text("birthday"),
  zodiac: text("zodiac"),
  height: text("height"),
  weight: text("weight"),
  mbti: text("mbti"),
  emoji: text("emoji"),
  color: text("color"), // hex brand color
  motto: text("motto"),
  funFacts: text("fun_facts"), // JSON string array
  profileImage: text("profile_image"),
  coverImage: text("cover_image"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});

// ============================================================
// POSTS (Lectures, Diaries, Announcements, Assignments)
// ============================================================
export const posts = sqliteTable("posts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  type: text("type", {
    enum: ["LECTURE", "ANNOUNCEMENT", "DIARY", "ASSIGNMENT"],
  })
    .default("LECTURE")
    .notNull(),
  memberId: text("member_id").references(() => members.id),
  authorId: text("author_id").references(() => users.id),
  published: integer("published", { mode: "boolean" }).default(false),
  pinned: integer("pinned", { mode: "boolean" }).default(false),
  likes: integer("likes").default(0),
  views: integer("views").default(0),
  images: text("images"), // JSON string array of URLs
  tags: text("tags"), // JSON string array
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ============================================================
// COMMENTS
// ============================================================
export const comments = sqliteTable("comments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  content: text("content").notNull(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  likes: integer("likes").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ============================================================
// POST LIKES (junction table to prevent double-liking)
// ============================================================
export const postLikes = sqliteTable("post_likes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ============================================================
// ACHIEVEMENTS / BADGES
// ============================================================
export const achievements = sqliteTable("achievements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // emoji or icon name
  points: integer("points").default(0),
  rarity: text("rarity", {
    enum: ["COMMON", "RARE", "EPIC", "LEGENDARY"],
  })
    .default("COMMON")
    .notNull(),
  criteria: text("criteria"), // JSON conditions
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});

// ============================================================
// USER ACHIEVEMENTS
// ============================================================
export const userAchievements = sqliteTable("user_achievements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  achievementId: text("achievement_id")
    .notNull()
    .references(() => achievements.id),
  earnedAt: integer("earned_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ============================================================
// EVENTS
// ============================================================
export const events = sqliteTable("events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type", {
    enum: ["LIVE", "CHALLENGE", "FANMEET", "BIRTHDAY"],
  })
    .default("LIVE")
    .notNull(),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
  points: integer("points").default(50),
  hostMemberId: text("host_member_id").references(() => members.id),
  imageUrl: text("image_url"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ============================================================
// ATTENDANCE
// ============================================================
export const attendance = sqliteTable("attendance", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  checkedIn: integer("checked_in", { mode: "boolean" }).default(false),
  checkedInAt: integer("checked_in_at", { mode: "timestamp" }),
});

// ============================================================
// QUESTS
// ============================================================
export const quests = sqliteTable("quests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  points: integer("points").default(10),
  requirements: text("requirements"), // JSON
  active: integer("active", { mode: "boolean" }).default(true),
  resetDaily: integer("reset_daily", { mode: "boolean" }).default(true),
  order: integer("order").default(0),
});

// ============================================================
// USER QUESTS (completion tracking)
// ============================================================
export const userQuests = sqliteTable("user_quests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questId: text("quest_id")
    .notNull()
    .references(() => quests.id, { onDelete: "cascade" }),
  completed: integer("completed", { mode: "boolean" }).default(false),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  dateKey: text("date_key").notNull(), // "2025-01-15" — for daily reset
});

// ============================================================
// POINT TRANSACTIONS (audit log)
// ============================================================
export const pointTransactions = sqliteTable("point_transactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  referenceId: text("reference_id"), // postId, questId, etc.
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ============================================================
// COURSES
// ============================================================
export const courses = sqliteTable("courses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category", {
    enum: ["MAIN", "MINI"],
  })
    .default("MAIN")
    .notNull(),
  memberId: text("member_id").references(() => members.id), // which member "teaches" it
  difficulty: text("difficulty", {
    enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
  })
    .default("BEGINNER")
    .notNull(),
  minLevel: integer("min_level").default(1).notNull(), // user level gate
  pointsReward: integer("points_reward").default(50).notNull(),
  prerequisiteCourseId: text("prerequisite_course_id"), // nullable self-ref
  coverEmoji: text("cover_emoji").default("📚"),
  estimatedMinutes: integer("estimated_minutes").default(30),
  order: integer("order").default(0), // display order
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ============================================================
// COURSE MODULES
// ============================================================
export const courseModules = sqliteTable("course_modules", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(), // markdown / rich text
  order: integer("order").default(0).notNull(),
  pointsReward: integer("points_reward").default(10),
});

// ============================================================
// COURSE QUIZZES
// ============================================================
export const courseQuizzes = sqliteTable("course_quizzes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  passingScore: integer("passing_score").default(70).notNull(), // percentage
  order: integer("order").default(0),
});

// ============================================================
// COURSE QUIZ QUESTIONS
// ============================================================
export const courseQuizQuestions = sqliteTable("course_quiz_questions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  quizId: text("quiz_id")
    .notNull()
    .references(() => courseQuizzes.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  order: integer("order").default(0),
});

// ============================================================
// COURSE QUIZ ANSWERS
// ============================================================
export const courseQuizAnswers = sqliteTable("course_quiz_answers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  questionId: text("question_id")
    .notNull()
    .references(() => courseQuizQuestions.id, { onDelete: "cascade" }),
  answer: text("answer").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).default(false).notNull(),
  order: integer("order").default(0),
});

// ============================================================
// COURSE ENROLLMENTS
// ============================================================
export const courseEnrollments = sqliteTable("course_enrollments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["ENROLLED", "IN_PROGRESS", "SUBMITTED", "COMPLETED"],
  })
    .default("ENROLLED")
    .notNull(),
  enrolledAt: integer("enrolled_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  quizScore: real("quiz_score"), // 0–100 percentage
  quizPassed: integer("quiz_passed", { mode: "boolean" }).default(false),
});

// ============================================================
// COURSE MODULE PROGRESS
// ============================================================
export const courseModuleProgress = sqliteTable("course_module_progress", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  moduleId: text("module_id")
    .notNull()
    .references(() => courseModules.id, { onDelete: "cascade" }),
  completed: integer("completed", { mode: "boolean" }).default(false),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

// ============================================================
// COURSE SUBMISSIONS (final project)
// ============================================================
export const courseSubmissions = sqliteTable("course_submissions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  content: text("content").notNull(), // learner's project text / URL
  status: text("status", {
    enum: ["PENDING", "APPROVED", "REJECTED"],
  })
    .default("PENDING")
    .notNull(),
  reviewerId: text("reviewer_id").references(() => users.id),
  reviewNote: text("review_note"),
  submittedAt: integer("submitted_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
});

// ============================================================
// COURSE BADGES
// ============================================================
export const courseBadges = sqliteTable("course_badges", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  description: text("description").notNull(),
  rarity: text("rarity", {
    enum: ["COMMON", "RARE", "EPIC", "LEGENDARY"],
  })
    .default("COMMON")
    .notNull(),
});

// ============================================================
// USER COURSE BADGES
// ============================================================
export const userCourseBadges = sqliteTable("user_course_badges", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  badgeId: text("badge_id")
    .notNull()
    .references(() => courseBadges.id, { onDelete: "cascade" }),
  earnedAt: integer("earned_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ============================================================
// COURSE COMPLETION MILESTONES / REWARDS
// ============================================================
export const courseCompletionRewards = sqliteTable("course_completion_rewards", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  milestone: integer("milestone").notNull().unique(), // 5, 10, 15, 23
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  pointsReward: integer("points_reward").notNull(),
});

// ============================================================
// USER MILESTONE REWARDS (tracking which milestones a user has claimed)
// ============================================================
export const userMilestoneRewards = sqliteTable("user_milestone_rewards", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  milestoneId: text("milestone_id")
    .notNull()
    .references(() => courseCompletionRewards.id, { onDelete: "cascade" }),
  earnedAt: integer("earned_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ============================================================
// QUIZ ATTEMPTS
// ============================================================
export const quizAttempts = sqliteTable("quiz_attempts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  score: real("score").notNull(),
  passed: integer("passed", { mode: "boolean" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Member = typeof members.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type Quest = typeof quests.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CourseModule = typeof courseModules.$inferSelect;
export type CourseQuiz = typeof courseQuizzes.$inferSelect;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type CourseSubmission = typeof courseSubmissions.$inferSelect;
export type CourseBadge = typeof courseBadges.$inferSelect;
export type UserCourseBadge = typeof userCourseBadges.$inferSelect;
export type CourseQuizAttempt = typeof quizAttempts.$inferSelect;
