/**
 * Правила начисления опыта (XP). Опыт даётся только за реально выполненные задания.
 *
 * Первое прохождение урока: 10 XP + 1 XP за каждое задание, решённое с первой попытки,
 * + 5 XP, если все задания решены с первой попытки.
 * Повторное прохождение: 5 XP + 1 XP за каждое задание с первой попытки.
 */
export const XP_RULES = {
  firstCompletion: 10,
  replay: 5,
  perFirstTryCorrect: 1,
  perfectBonus: 5,
} as const;

export function calculateLessonXp(input: {
  firstTryCorrect: number;
  total: number;
  isFirstCompletion: boolean;
}): number {
  const { firstTryCorrect, total, isFirstCompletion } = input;
  if (isFirstCompletion) {
    const perfect = total > 0 && firstTryCorrect === total ? XP_RULES.perfectBonus : 0;
    return XP_RULES.firstCompletion + firstTryCorrect * XP_RULES.perFirstTryCorrect + perfect;
  }
  return XP_RULES.replay + firstTryCorrect * XP_RULES.perFirstTryCorrect;
}

/** Максимум XP за первое прохождение урока из N заданий. */
export function maxLessonXp(total: number): number {
  return XP_RULES.firstCompletion + total * XP_RULES.perFirstTryCorrect + XP_RULES.perfectBonus;
}
