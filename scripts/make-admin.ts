import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { eq } from "drizzle-orm";

async function main() {
  const { db } = await import("../src/lib/db");
  const { users } = await import("../src/lib/db/schema");

  const email = "admin@kaia.com";
  console.log(`Searching for user with email: ${email}`);
  
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    console.error(`User with email ${email} not found in the Turso database.`);
    return;
  }

  console.log(`Found user: ${user.name} (Current Role: ${user.role}). Updating to ADMIN...`);
  
  await db.update(users)
    .set({ role: "ADMIN" })
    .where(eq(users.email, email));

  console.log("Success: User role successfully updated to ADMIN.");
}

main().catch(console.error);
