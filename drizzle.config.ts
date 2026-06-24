import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });
const url = process.env.TURSO_DATABASE_URL;

if (!url) {
  throw new Error("TURSO_DATABASE_URL is required in .env.local");
}

const baseConfig = {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  verbose: true,
  strict: true,
} as const;

export default url.startsWith("file:")
  ? defineConfig({
      ...baseConfig,
      dialect: "sqlite",
      dbCredentials: { url },
    })
  : defineConfig({
      ...baseConfig,
      dialect: "turso",
      dbCredentials: {
        url,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      },
    });
