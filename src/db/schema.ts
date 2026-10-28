import { check, index, integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export type RecitationMistake = {
  type: "missing" | "wrong" | "extra";
  expected?: string;
  heard?: string;
  position: number;
};

export const recitationAttempts = pgTable(
  "recitation_attempts",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    surah: varchar("surah", { length: 120 }).notNull(),
    ayahNumber: integer("ayah_number").notNull(),
    expectedText: text("expected_text").notNull(),
    transcript: text("transcript").notNull(),
    accuracy: integer("accuracy").notNull(),
    mistakes: jsonb("mistakes").$type<RecitationMistake[]>().notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("recitation_attempts_ayah_number_check", sql`${table.ayahNumber} BETWEEN 1 AND 286`),
    check("recitation_attempts_accuracy_check", sql`${table.accuracy} BETWEEN 0 AND 100`),
    index("recitation_attempts_created_at_idx").on(table.createdAt),
  ],
);
