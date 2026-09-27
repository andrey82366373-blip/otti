/**
 * Начисление опыта: общий XP, активность за день, серия дней и достижения.
 * Вызывается внутри транзакции — после урока и после повторения слов.
 */
import "server-only";

import { eq, sql } from "drizzle-orm";

import { dailyActivity, profiles } from "@/db/schema";
import type { Profile } from "@/lib/profile";
import { getAchievementStats, syncAchievements, type DbLike } from "@/lib/stats";
import { effectiveStreak, streakAfterGoalMet } from "@/lib/streak";

export type XpResult = {
  /** XP за сегодня после начисления. */
  todayXp: number;
  /** Дневная цель выполнена именно сейчас. */
  goalReachedNow: boolean;
  streak: number;
  longestStreak: number;
  /** Коды новых достижений. */
  newAchievements: string[];
};

export async function recordXp(
  tx: DbLike,
  input: {
    userId: string;
    profile: Profile;
    today: string;
    xp: number;
    lessonsCompleted?: number;
    exercisesDone?: number;
  },
): Promise<XpResult> {
  const { userId, profile, today, xp, lessonsCompleted = 0, exercisesDone = 0 } = input;

  // 1. Общий опыт ученика
  if (xp > 0) {
    await tx
      .update(profiles)
      .set({ totalXp: sql`${profiles.totalXp} + ${xp}` })
      .where(eq(profiles.userId, userId));
  }

  // 2. Активность за сегодня — для серии дней и графика
  const [activity] = await tx
    .insert(dailyActivity)
    .values({
      userId,
      day: today,
      xp,
      goalXp: profile.dailyGoalXp,
      lessonsCompleted,
      exercisesDone,
    })
    .onConflictDoUpdate({
      target: [dailyActivity.userId, dailyActivity.day],
      set: {
        xp: sql`${dailyActivity.xp} + ${xp}`,
        goalXp: profile.dailyGoalXp,
        lessonsCompleted: sql`${dailyActivity.lessonsCompleted} + ${lessonsCompleted}`,
        exercisesDone: sql`${dailyActivity.exercisesDone} + ${exercisesDone}`,
      },
    })
    .returning({ xp: dailyActivity.xp });
  const todayXp = activity?.xp ?? xp;

  // 3. Серия дней: растёт, когда за день выполнена дневная цель
  let streak = effectiveStreak(profile, today);
  let longestStreak = profile.longestStreak;
  let goalReachedNow = false;
  if (todayXp >= profile.dailyGoalXp && profile.lastActiveDate !== today) {
    const next = streakAfterGoalMet(profile, today);
    await tx
      .update(profiles)
      .set({
        currentStreak: next.currentStreak,
        longestStreak: next.longestStreak,
        lastActiveDate: next.lastActiveDate,
      })
      .where(eq(profiles.userId, userId));
    goalReachedNow = true;
    streak = next.currentStreak;
    longestStreak = next.longestStreak;
  }

  // 4. Достижения
  const stats = await getAchievementStats(tx, userId, {
    totalXp: profile.totalXp + xp,
    longestStreak,
  });
  const newAchievements = await syncAchievements(tx, userId, stats);

  return { todayXp, goalReachedNow, streak, longestStreak, newAchievements };
}
