/** Активность ученика за сегодня, дневная цель и серия дней. */
import "server-only";

import { cache } from "react";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { dailyActivity, profiles } from "@/db/schema";
import { todayInTimezone } from "@/lib/dates";
import { getProfile } from "@/lib/profile";
import { effectiveStreak, goalMetToday, streakAfterGoalMet } from "@/lib/streak";

export type DailyState = {
  today: string;
  todayXp: number;
  lessonsToday: number;
  goalXp: number;
  goalMet: boolean;
  streak: number;
  longestStreak: number;
};

/**
 * Состояние дня: XP за сегодня, выполнена ли цель, серия.
 * Если цель уже набрана, но серия ещё не отмечена (например, цель уменьшили в профиле),
 * серия обновляется здесь же. Один запрос на страницу.
 */
export const getDailyState = cache(async (userId: string): Promise<DailyState> => {
  const profile = await getProfile(userId);
  const today = todayInTimezone(profile.timezone);
  const db = getDb();

  const [row] = await db
    .select({ xp: dailyActivity.xp, lessonsCompleted: dailyActivity.lessonsCompleted })
    .from(dailyActivity)
    .where(and(eq(dailyActivity.userId, userId), eq(dailyActivity.day, today)))
    .limit(1);
  const todayXp = row?.xp ?? 0;

  let streakFields = {
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    lastActiveDate: profile.lastActiveDate,
  };

  if (todayXp >= profile.dailyGoalXp && profile.lastActiveDate !== today) {
    streakFields = streakAfterGoalMet(streakFields, today);
    try {
      await db.update(profiles).set(streakFields).where(eq(profiles.userId, userId));
      await db
        .update(dailyActivity)
        .set({ goalXp: profile.dailyGoalXp })
        .where(
          and(
            eq(dailyActivity.userId, userId),
            eq(dailyActivity.day, today),
            eq(dailyActivity.goalXp, 0),
          ),
        );
    } catch (error) {
      console.error("[streak] Не удалось обновить серию:", error);
    }
  }

  return {
    today,
    todayXp,
    lessonsToday: row?.lessonsCompleted ?? 0,
    goalXp: profile.dailyGoalXp,
    goalMet: goalMetToday(streakFields, today),
    streak: effectiveStreak(streakFields, today),
    longestStreak: streakFields.longestStreak,
  };
});
