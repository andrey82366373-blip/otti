/**
 * Повторение слов по расписанию: чем лучше помнишь слово, тем реже оно попадается.
 * Без обращений к базе — только правила.
 */
import type { WordStatus } from "@/db/schema";

/** Через сколько дней повторять слово после 1-го, 2-го, 3-го… «Помню» подряд. */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30];

/** Слово считается выученным после стольких «Помню» подряд. */
export const LEARNED_AFTER = 3;

/** Сколько карточек в одном повторении. */
export const REVIEW_SESSION_SIZE = 10;

export const WORD_STATUS_INFO: Record<WordStatus, { title: string; plural: string }> = {
  new: { title: "Новое", plural: "Новые" },
  learning: { title: "Учу", plural: "Учу" },
  learned: { title: "Выучено", plural: "Выучено" },
};

type Schedule = {
  correctStreak: number;
  intervalDays: number;
  status: WordStatus;
  nextReviewAt: Date;
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** Через сколько минут забытое слово снова попадёт в повторение. */
export const FORGOT_DELAY_MINUTES = 10;

/**
 * Даёт ли «Помню» очко опыта: только если у слова подошёл срок
 * и его не повторяли в последние 12 часов (кроме совсем новых слов).
 * Так опыт нельзя «накрутить», нажимая по кругу «Не помню» → «Помню».
 */
export function earnsReviewXp(
  word: { status: WordStatus; updatedAt: Date },
  remembered: boolean,
  due: boolean,
  now: Date,
): boolean {
  if (!remembered || !due) return false;
  if (word.status === "new") return true;
  return word.updatedAt.getTime() <= now.getTime() - 12 * HOUR;
}

/**
 * Новое расписание слова после ответа.
 * - «Не помню» — начинаем заново, слово вернётся в повторение через 10 минут.
 * - «Помню», когда подошёл срок, — следующий раз через 1, 3, 7, 14, 30 дней.
 * - «Помню» до срока (свободная тренировка) — расписание не меняется.
 */
export function scheduleNext(
  word: Schedule,
  remembered: boolean,
  now: Date,
): Schedule & { due: boolean } {
  const due = word.nextReviewAt.getTime() <= now.getTime();

  if (!remembered) {
    return {
      correctStreak: 0,
      intervalDays: 0,
      status: "learning",
      nextReviewAt: new Date(now.getTime() + FORGOT_DELAY_MINUTES * MINUTE),
      due,
    };
  }
  if (!due) {
    return { ...word, due };
  }

  const correctStreak = word.correctStreak + 1;
  const intervalDays =
    REVIEW_INTERVALS_DAYS[Math.min(correctStreak - 1, REVIEW_INTERVALS_DAYS.length - 1)];
  // Чуть раньше суток, чтобы слово было готово к повторению уже с утра
  const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * HOUR - 6 * HOUR);
  return {
    correctStreak,
    intervalDays,
    status: correctStreak >= LEARNED_AFTER ? "learned" : "learning",
    nextReviewAt,
    due,
  };
}
