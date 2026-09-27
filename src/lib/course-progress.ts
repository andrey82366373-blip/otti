/** Прогресс ученика по урокам — читается из базы. */
import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { lessonProgress } from "@/db/schema";

export type LessonProgressRow = typeof lessonProgress.$inferSelect;

/** Все записи о прохождении уроков. */
export const getLessonProgress = cache(async (userId: string): Promise<LessonProgressRow[]> => {
  return getDb().select().from(lessonProgress).where(eq(lessonProgress.userId, userId));
});

/** Пройденные уроки (id). */
export async function getCompletedLessonIds(userId: string): Promise<Set<string>> {
  const rows = await getLessonProgress(userId);
  return new Set(rows.filter((row) => row.status === "completed").map((row) => row.lessonId));
}
