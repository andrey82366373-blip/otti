/**
 * Справочник обучения: уровни, цели и время занятий.
 * Используется и на страницах, и на сервере, поэтому здесь нет обращений к базе.
 */

/* ─────────────────────────────── Уровни ─────────────────────────────── */

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const LEVEL_INFO: Record<CefrLevel, { title: string; description: string }> = {
  A1: { title: "Начальный", description: "Знаю буквы и самые простые фразы" },
  A2: { title: "Базовый", description: "Могу рассказать о себе и спросить дорогу" },
  B1: { title: "Средний", description: "Объясняюсь в поездках и на бытовые темы" },
  B2: { title: "Выше среднего", description: "Свободно обсуждаю самые разные темы" },
};

/** Уровни, для которых в приложении уже есть готовые уроки. */
export const LEVELS_WITH_LESSONS: CefrLevel[] = ["A1"];

/* ──────────────────────────────── Цели ──────────────────────────────── */

export const LEARNING_GOALS = [
  "conversation",
  "travel",
  "study",
  "work",
  "exam",
  "grammar",
] as const;
export type LearningGoal = (typeof LEARNING_GOALS)[number];

export const GOAL_INFO: Record<
  LearningGoal,
  { title: string; description: string; tutorFocus: string }
> = {
  conversation: {
    title: "Разговорный английский",
    description: "Свободно общаться в жизни",
    tutorFocus: "Отти будет чаще болтать с тобой на повседневные темы.",
  },
  travel: {
    title: "Путешествия",
    description: "Аэропорт, отель, кафе, дорога",
    tutorFocus: "Отти будет разыгрывать ситуации из поездок: аэропорт, отель, кафе.",
  },
  study: {
    title: "Учёба",
    description: "Для школы, вуза или курсов",
    tutorFocus: "Отти будет помогать с темами и словами для учёбы.",
  },
  work: {
    title: "Работа и собеседования",
    description: "Переписка, созвоны, интервью",
    tutorFocus: "Отти будет тренировать с тобой собеседования и рабочую переписку.",
  },
  exam: {
    title: "Подготовка к экзамену",
    description: "ЕГЭ, IELTS, TOEFL и другие",
    tutorFocus: "Отти будет давать задания в формате экзаменов и строже проверять грамматику.",
  },
  grammar: {
    title: "Грамматика и слова",
    description: "Навести порядок в правилах",
    tutorFocus: "Отти будет подробнее объяснять правила и чаще давать новые слова.",
  },
};

/* ───────────────────────────── Время в день ───────────────────────────── */

export const DAILY_MINUTES = [5, 10, 15, 20] as const;
export type DailyMinutes = (typeof DAILY_MINUTES)[number];

export const MINUTES_INFO: Record<DailyMinutes, { title: string; plan: string[] }> = {
  5: { title: "Легко", plan: ["1 короткий урок"] },
  10: { title: "Нормально", plan: ["1 урок", "Повторение слов"] },
  15: { title: "Серьёзно", plan: ["1–2 урока", "Повторение слов", "5 минут с Отти"] },
  20: {
    title: "Интенсив",
    plan: ["2 урока", "Повторение слов", "Разговор с Отти", "Работа над ошибками"],
  },
};

/** Дневная цель в очках опыта: примерно 2 XP за минуту занятий. */
export function dailyGoalXpFor(minutes: DailyMinutes): number {
  return minutes * 2;
}

export function isDailyMinutes(value: number): value is DailyMinutes {
  return (DAILY_MINUTES as readonly number[]).includes(value);
}

/* ─────────────────────────── Язык объяснений ─────────────────────────── */

export const EXPLANATION_LANGUAGES = ["ru", "en"] as const;
export type ExplanationLanguage = (typeof EXPLANATION_LANGUAGES)[number];

export const EXPLANATION_LANGUAGE_INFO: Record<ExplanationLanguage, { title: string; description: string }> = {
  ru: { title: "По-русски", description: "Отти объясняет ошибки и правила по-русски" },
  en: { title: "По-английски", description: "Простым английским — для уровней B1–B2" },
};

export function toExplanationLanguage(value: string): ExplanationLanguage {
  return value === "en" ? "en" : "ru";
}
