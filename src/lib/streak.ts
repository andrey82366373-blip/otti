/**
 * Серия дней: сколько дней подряд ученик выполняет дневную цель по XP.
 * Пропуск дня обнуляет серию. В профиле хранится серия и последний день, когда цель выполнена.
 */
import { addDays } from "@/lib/dates";

type StreakFields = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
};

/** Серия, которую видит ученик: жива, если цель выполнена сегодня или вчера. */
export function effectiveStreak(profile: StreakFields, today: string): number {
  if (!profile.lastActiveDate) return 0;
  if (profile.lastActiveDate === today || profile.lastActiveDate === addDays(today, -1)) {
    return profile.currentStreak;
  }
  return 0;
}

/** Выполнена ли дневная цель сегодня. */
export function goalMetToday(profile: StreakFields, today: string): boolean {
  return profile.lastActiveDate === today;
}

/** Новые значения серии после того, как сегодня выполнена дневная цель. */
export function streakAfterGoalMet(profile: StreakFields, today: string): StreakFields {
  if (profile.lastActiveDate === today) return profile;
  const continues = profile.lastActiveDate === addDays(today, -1);
  const currentStreak = continues ? profile.currentStreak + 1 : 1;
  return {
    currentStreak,
    longestStreak: Math.max(profile.longestStreak, currentStreak),
    lastActiveDate: today,
  };
}
