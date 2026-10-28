import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { readFile } from "node:fs/promises";
import pg from "pg";
const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");
const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 8000 });
try {
  const migration = await readFile(new URL("../migrations/0001_initial_recitation_attempts.sql", import.meta.url), "utf8");
  await pool.query(migration);
  console.log("QiraCheck database migration completed.");
} finally {
  await pool.end();
}
