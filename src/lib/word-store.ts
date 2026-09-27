/** Личный словарь ученика в базе. */
import "server-only";

import { cache } from "react";
import { and, asc, count, desc, eq, lte, sql } from "drizzle-orm";

import { ALL_LESSONS, getLesson } from "@/content/course";
import { getDb } from "@/db";
import { userWords } from "@/db/schema";
import { getCompletedLessonIds } from "@/lib/course-progress";
import type { DbLike } from "@/lib/stats";
import { REVIEW_SESSION_SIZE } from "@/lib/words";

/** Добавляет в словарь слова указанных уроков (уже добавленные пропускаются). */
export async function syncLessonWords(
  db: DbLike,
  userId: string,
  lessonIds: Iterable<string>,
): Promise<number> {
  const values = [...lessonIds].flatMap((lessonId) => {
    const lesson = getLesson(lessonId);
    if (!lesson) return [];
    return lesson.words.map((word) => ({
      userId,
      word: word.en,
      translation: word.ru,
      example: word.example,
      exampleRu: word.exampleRu,
      source: "lesson" as const,
      sourceId: lesson.id,
    }));
  });
  if (values.length === 0) return 0;

  const inserted = await db
    .insert(userWords)
    .values(values)
    .onConflictDoNothing()
    .returning({ id: userWords.id });
  return inserted.length;
}

/** Если слова пройденных уроков ещё не в словаре (уроки пройдены раньше) — добавляет их. */
async function ensureLessonWords(userId: string) {
  const completed = await getCompletedLessonIds(userId);
  if (completed.size === 0) return;
  const expected = ALL_LESSONS.filter((lesson) => completed.has(lesson.id)).reduce(
    (sum, lesson) => sum + lesson.words.length,
    0,
  );
  const [row] = await getDb()
    .select({ total: count() })
    .from(userWords)
    .where(and(eq(userWords.userId, userId), eq(userWords.source, "lesson")));
  if ((row?.total ?? 0) < expected) {
    await syncLessonWords(getDb(), userId, completed);
  }
}

export type WordStats = {
  total: number;
  new: number;
  learning: number;
  learned: number;
  /** Сколько слов ждут повторения прямо сейчас. */
  due: number;
};

/** Счётчики словаря. Один запрос на страницу. */
export const getWordStats = cache(async (userId: string): Promise<WordStats> => {
  await ensureLessonWords(userId);
  const [row] = await getDb()
    .select({
      total: count(),
      new: sql<number>`count(*) filter (where ${userWords.status} = 'new')::int`,
      learning: sql<number>`count(*) filter (where ${userWords.status} = 'learning')::int`,
      learned: sql<number>`count(*) filter (where ${userWords.status} = 'learned')::int`,
      due: sql<number>`count(*) filter (where ${userWords.nextReviewAt} <= now())::int`,
    })
    .from(userWords)
    .where(eq(userWords.userId, userId));
  return {
    total: Number(row?.total ?? 0),
    new: Number(row?.new ?? 0),
    learning: Number(row?.learning ?? 0),
    learned: Number(row?.learned ?? 0),
    due: Number(row?.due ?? 0),
  };
});

/** Все слова словаря, новые сверху. */
export async function getAllWords(userId: string) {
  const rows = await getDb()
    .select()
    .from(userWords)
    .where(eq(userWords.userId, userId))
    .orderBy(desc(userWords.createdAt), asc(userWords.word));
  return rows.map((row) => ({
    ...row,
    sourceTitle:
      row.source === "lesson" && row.sourceId
        ? `Урок ${getLesson(row.sourceId)?.number ?? ""}`.trim()
        : "Разговор с Отти",
  }));
}

export type ReviewCard = {
  id: string;
  word: string;
  translation: string;
  example: string | null;
  exampleRu: string | null;
};

/**
 * Карточки для повторения: сначала слова, у которых подошёл срок.
 * Если таких нет — свободная тренировка на давно не повторявшихся словах.
 */
export async function getReviewCards(
  userId: string,
): Promise<{ cards: ReviewCard[]; practice: boolean }> {
  const columns = {
    id: userWords.id,
    word: userWords.word,
    translation: userWords.translation,
    example: userWords.example,
    exampleRu: userWords.exampleRu,
  };
  const due = await getDb()
    .select(columns)
    .from(userWords)
    .where(and(eq(userWords.userId, userId), lte(userWords.nextReviewAt, sql`now()`)))
    .orderBy(asc(userWords.nextReviewAt))
    .limit(REVIEW_SESSION_SIZE);
  if (due.length > 0) return { cards: due, practice: false };

  const practice = await getDb()
    .select(columns)
    .from(userWords)
    .where(eq(userWords.userId, userId))
    .orderBy(asc(userWords.updatedAt))
    .limit(REVIEW_SESSION_SIZE);
  return { cards: practice, practice: true };
}
