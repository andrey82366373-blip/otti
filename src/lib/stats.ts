/** Статистика ученика из базы: для достижений, главной панели и экрана «Прогресс». */
import "server-only";

import { and, count, desc, eq, gte, sql } from "drizzle-orm";

import { SECTIONS } from "@/content/course";
import { getDb, type Database } from "@/db";
import {
  dailyActivity,
  exerciseAttempts,
  lessonProgress,
  mistakes,
  userAchievements,
} from "@/db/schema";
import {
  ACHIEVEMENTS,
  isAchieved,
  type AchievementStats,
} from "@/lib/achievements";

/** Подключение к базе или открытая транзакция. */
export type DbLike = Pick<Database, "select" | "insert" | "update">;

/** Всё, что нужно для проверки достижений. */
export async function getAchievementStats(
  db: DbLike,
  userId: string,
  profile: { totalXp: number; longestStreak: number },
): Promise<AchievementStats> {
  const lessons = await db
    .select({
      lessonId: lessonProgress.lessonId,
      status: lessonProgress.status,
      bestScore: lessonProgress.bestScore,
      attempts: lessonProgress.attempts,
    })
    .from(lessonProgress)
    .where(eq(lessonProgress.userId, userId));

  const [answers] = await db
    .select({ correct: count() })
    .from(exerciseAttempts)
    .where(and(eq(exerciseAttempts.userId, userId), eq(exerciseAttempts.isCorrect, true)));

  const [fixed] = await db
    .select({ count: count() })
    .from(mistakes)
    .where(and(eq(mistakes.userId, userId), eq(mistakes.resolved, true)));

  const [goals] = await db
    .select({ days: count() })
    .from(dailyActivity)
    .where(
      and(
        eq(dailyActivity.userId, userId),
        sql`${dailyActivity.goalXp} > 0`,
        gte(dailyActivity.xp, dailyActivity.goalXp),
      ),
    );

  const completed = new Set(lessons.filter((row) => row.status === "completed").map((row) => row.lessonId));
  const firstSection = SECTIONS[0];

  return {
    lessonsCompleted: completed.size,
    perfectLessons: lessons.filter((row) => row.bestScore === 100).length,
    replays: lessons.filter((row) => row.attempts >= 2).length,
    firstSectionDone: firstSection.lessons.filter((lesson) => completed.has(lesson.id)).length,
    firstSectionTotal: firstSection.lessons.length,
    goalDays: Math.max(goals?.days ?? 0, profile.longestStreak > 0 ? 1 : 0),
    longestStreak: profile.longestStreak,
    totalXp: profile.totalXp,
    correctAnswers: answers?.correct ?? 0,
    mistakesFixed: fixed?.count ?? 0,
  };
}

/** Выдаёт заработанные, но ещё не полученные достижения. Возвращает коды новых. */
export async function syncAchievements(
  db: DbLike,
  userId: string,
  stats: AchievementStats,
): Promise<string[]> {
  const existing = await db
    .select({ code: userAchievements.code })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
  const have = new Set(existing.map((row) => row.code));

  const fresh = ACHIEVEMENTS.filter(
    (achievement) => !have.has(achievement.code) && isAchieved(achievement, stats),
  ).map((achievement) => achievement.code);

  if (fresh.length > 0) {
    await db
      .insert(userAchievements)
      .values(fresh.map((code) => ({ userId, code })))
      .onConflictDoNothing();
  }
  return fresh;
}

/** Полученные достижения с датой. */
export async function getEarnedAchievements(userId: string) {
  return getDb()
    .select({ code: userAchievements.code, earnedAt: userAchievements.earnedAt })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId))
    .orderBy(desc(userAchievements.earnedAt));
}

/** Активность по дням начиная с fromDay (включительно). */
export async function getActivitySince(userId: string, fromDay: string) {
  return getDb()
    .select({
      day: dailyActivity.day,
      xp: dailyActivity.xp,
      goalXp: dailyActivity.goalXp,
      lessonsCompleted: dailyActivity.lessonsCompleted,
    })
    .from(dailyActivity)
    .where(and(eq(dailyActivity.userId, userId), gte(dailyActivity.day, fromDay)));
}

/** Точность ответов по темам (все попытки). */
export async function getTopicAccuracy(userId: string) {
  const rows = await getDb()
    .select({
      topic: exerciseAttempts.topic,
      total: count(),
      correct: sql<number>`sum(case when ${exerciseAttempts.isCorrect} then 1 else 0 end)::int`,
    })
    .from(exerciseAttempts)
    .where(eq(exerciseAttempts.userId, userId))
    .groupBy(exerciseAttempts.topic);
  return rows.map((row) => ({ ...row, correct: Number(row.correct) }));
}
