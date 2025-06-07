import { drizzle } from "drizzle-orm/node-postgres";

export const clientDatabase = drizzle(process.env.DATABASE_URL, {
  casing: "snake_case",
});
