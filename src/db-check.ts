import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { config } from "dotenv";
import * as schema from "./lib/db/schema";
import { eq, and } from "drizzle-orm";

config({ path: ".env.local" });

async function check() {
  if (!process.env.TURSO_DATABASE_URL) {
    console.log("No DB URL");
    return;
  }
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });
  const db = drizzle(client, { schema });

  const allUsers = await db.query.users.findMany();
  console.log("USERS IN DB:", allUsers.map(u => ({ id: u.id, name: u.name, points: u.points })));

  const enrollments = await db.query.courseEnrollments.findMany();
  console.log("ENROLLMENTS IN DB:", enrollments.map(e => ({ userId: e.userId, courseId: e.courseId, status: e.status, score: e.quizScore })));

  // Let's test unlock logic for Adrian Calicdan
  if (allUsers.length > 1) {
    const testUserId = allUsers[1].id;
    console.log(`\nTesting level unlocks for user: ${allUsers[1].name} (${testUserId})`);
    
    for (let lvl = 1; lvl <= 3; lvl++) {
      console.log(`\n--- LEVEL ${lvl} ---`);
      const levelCourses = await db.query.courses.findMany({
        where: eq(schema.courses.minLevel, lvl)
      });
      for (const course of levelCourses) {
        // inline check
        const memberId = course.memberId;
        if (lvl === 1) {
          console.log(`Course ${course.title}: UNLOCKED (Level 1)`);
          continue;
        }
        
        const prevCourse = await db.query.courses.findFirst({
          where: and(
            eq(schema.courses.minLevel, lvl - 1),
            eq(schema.courses.memberId, memberId!),
            eq(schema.courses.isActive, true)
          ),
        });
        
        if (!prevCourse) {
          console.log(`Course ${course.title}: UNLOCKED (No prev course)`);
          continue;
        }

        const enrollment = await db.query.courseEnrollments.findFirst({
          where: and(
            eq(schema.courseEnrollments.userId, testUserId),
            eq(schema.courseEnrollments.courseId, prevCourse.id)
          ),
        });

        const isCompleted = enrollment?.status === "COMPLETED";
        const quizScore = enrollment?.quizScore ?? 0;
        const unlocked = isCompleted && quizScore >= 90;

        console.log(`Course ${course.title}: ${unlocked ? "UNLOCKED" : "LOCKED"} (Prev completed: ${isCompleted}, Score: ${quizScore}%)`);
      }
    }
  }
}

check();
