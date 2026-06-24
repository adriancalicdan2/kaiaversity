---
name: functional-courses-implementation
overview: Add a complete functional course system for KAIAVERSITY with 23 courses, modules, quizzes, submissions, progress, rewards, and role-based review flow, starting with full data model + seeded content and usable learner/admin flows.
todos:
  - id: courses-schema-and-seed
    content: Add course schema tables, types, and seed all 23 courses + mini-courses data.
    status: pending
  - id: courses-server-actions
    content: Implement enrollment, module progress, quiz submission, final project submission, and approval actions.
    status: pending
  - id: courses-learner-ui
    content: Build course catalog/detail/progress UI inside dashboard campus routes.
    status: pending
  - id: courses-admin-review-ui
    content: Build admin/professor submissions review workflow with approve/reject actions.
    status: pending
  - id: courses-rewards-and-qa
    content: Integrate milestone rewards, badge displays, and run full build/db/manual verification.
    status: pending
isProject: false
---

# Functional Courses Implementation Plan

## Goal

Implement a production-ready courses feature that supports all provided KAIA course content, learner progression, quizzes, final projects, badges, and points.

## Defaults Applied

- Final project approval: **Admin/Professor review required** before final completion rewards.
- Rollout strategy: **Data-first Phase 1** with full schema + seeded 23 courses + learner flow pages; enhanced quiz authoring/media refinements can follow.

## Phase 1: Data Model + Content Seeding

- Extend DB schema in [C:/Users/Adrian/Documents/Adrian/emgrand/kaiaversity/src/lib/db/schema.ts](C:/Users/Adrian/Documents/Adrian/emgrand/kaiaversity/src/lib/db/schema.ts) with course system tables:
  - `courses` (member, difficulty, duration, points, prerequisite metadata)
  - `course_modules` (ordered modules per course)
  - `course_quizzes`, `course_quiz_questions`, `course_quiz_answers`
  - `course_enrollments` (user-level progress)
  - `course_module_progress` (module completion state)
  - `course_submissions` (final project submission + review status)
  - `course_badges` and `user_course_badges`
  - `course_completion_rewards` (5/10/15/23 course milestones)
- Add stable TypeScript types for course domain in [C:/Users/Adrian/Documents/Adrian/emgrand/kaiaversity/src/types/index.ts](C:/Users/Adrian/Documents/Adrian/emgrand/kaiaversity/src/types/index.ts) (or create it if absent).
- Add full content constants for all courses/modules in [C:/Users/Adrian/Documents/Adrian/emgrand/kaiaversity/src/lib/constants/courses.ts](C:/Users/Adrian/Documents/Adrian/emgrand/kaiaversity/src/lib/constants/courses.ts), including:
  - 23 main courses (1–23)
  - mini-courses list (as separate type/category)
  - prerequisites and difficulty mapping
- Seed all course content and badge definitions in [C:/Users/Adrian/Documents/Adrian/emgrand/kaiaversity/src/lib/db/seed.ts](C:/Users/Adrian/Documents/Adrian/emgrand/kaiaversity/src/lib/db/seed.ts) with idempotent inserts.

## Phase 2: Server Actions + Rules Engine

- Implement course actions in new files under [C:/Users/Adrian/Documents/Adrian/emgrand/kaiaversity/src/lib/actions](C:/Users/Adrian/Documents/Adrian/emgrand/kaiaversity/src/lib/actions):
  - `courses.ts`: enroll, fetch catalog, fetch course detail, validate prerequisites
  - `courseProgress.ts`: mark module complete, quiz submit, compute progress
  - `courseSubmissions.ts`: submit final project, review submission (admin/professor)
  - `courseRewards.ts`: award course points/badges/milestone rewards
- Reuse existing point engine from [C:/Users/Adrian/Documents/Adrian/emgrand/kaiaversity/src/lib/actions/points.ts](C:/Users/Adrian/Documents/Adrian/emgrand/kaiaversity/src/lib/actions/points.ts) for consistent leveling and transaction logs.
- Add centralized gating logic:
  - Difficulty gates by level (Beginner: 1–2, Intermediate: 3–4, Advanced: 5+)
  - Prerequisite course checks
  - Submission review state gates completion.

## Phase 3: Learner UI

- Add course entry pages under dashboard route group:
  - [C:/Users/Adrian/Documents/Adrian/emgrand/kaiaversity/src/app/(dashboard)/campus/courses/page.tsx](C:/Users/Adrian/Documents/Adrian/emgrand/kaiaversity/src/app/(dashboard)/campus/courses/page.tsx) as full catalog with filters (member, difficulty, status).
  - `src/app/(dashboard)/campus/courses/[courseId]/page.tsx` for course header, modules, quiz status, final project panel.
- Add reusable components under `src/components/campus/`:
  - `CourseCard.tsx`, `CourseProgressCard.tsx`, `ModuleList.tsx`, `QuizPanel.tsx`, `FinalProjectSubmission.tsx`, `CourseBadgeToast.tsx`.
- Integrate profile/achievements views to include earned course badges and completed course counts.

## Phase 4: Admin/Professor Review UI

- Add admin course review pages:
  - `src/app/admin/courses/page.tsx` (course health + stats)
  - `src/app/admin/courses/submissions/page.tsx` (pending/approved/rejected final projects)
- Ensure role guard reuse from [C:/Users/Adrian/Documents/Adrian/emgrand/kaiaversity/src/app/admin/layout.tsx](C:/Users/Adrian/Documents/Adrian/emgrand/kaiaversity/src/app/admin/layout.tsx).
- Add approve/reject actions with feedback text and point/badge awarding only on approval.

## Phase 5: Reward Integration + Milestones

- Add milestone completion logic:
  - 5 courses: Diligent Student +100
  - 10 courses: Honors Student +250
  - 15 courses: Dean's List +500
  - 23 courses: KAIAVERSITY Graduate +1000
- Persist and display rewards in dashboard/profile/achievements pages.

## Verification

- Automated:
  - `npm run build`
  - `npm run db:push -- --force` (or migration flow)
  - `npm run db:seed`
- Manual checks:
  - Not-logged-in user blocked from courses dashboard routes.
  - Logged-in user can enroll and complete modules/quizzes.
  - Final project remains pending until admin/professor approval.
  - Points/level/badges update correctly on approved completion.
  - Prerequisite and level gating prevent invalid enrollment.

## Delivery Order

1. Schema + constants + seed
2. Server actions and rules engine
3. Catalog and course detail pages
4. Submission review admin UI
5. Reward milestones + polish

