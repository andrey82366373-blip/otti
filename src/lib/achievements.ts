/** Достижения: условия получения и прогресс к ним. Без обращений к базе. */
import {
  CircleCheck,
  Flame,
  Footprints,
  Medal,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type AchievementStats = {
  lessonsCompleted: number;
  perfectLessons: number;
  replays: number;
  /** Пройдено уроков в первом разделе и сколько их всего. */
  firstSectionDone: number;
  firstSectionTotal: number;
  goalDays: number;
  longestStreak: number;
  totalXp: number;
  correctAnswers: number;
  /** Исправлено ошибок («Работа над ошибками» или повтор урока). */
  mistakesFixed: number;
};

export type Achievement = {
  code: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Текущее значение и цель — для полосы прогресса. */
  progress: (stats: AchievementStats) => [current: number, target: number];
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    code: "first-lesson",
    title: "Первый шаг",
    description: "Пройди первый урок",
    icon: Footprints,
    progress: (s) => [s.lessonsCompleted, 1],
  },
  {
    code: "perfect-lesson",
    title: "Без единой ошибки",
    description: "Пройди урок, ни разу не ошибившись",
    icon: Sparkles,
    progress: (s) => [s.perfectLessons, 1],
  },
  {
    code: "first-section",
    title: "Первые шаги пройдены",
    description: "Пройди все уроки раздела «Первые шаги»",
    icon: Trophy,
    progress: (s) => [s.firstSectionDone, s.firstSectionTotal],
  },
  {
    code: "goal-first",
    title: "Цель дня",
    description: "Выполни дневную цель по XP",
    icon: Target,
    progress: (s) => [s.goalDays, 1],
  },
  {
    code: "streak-3",
    title: "Три дня подряд",
    description: "Выполняй дневную цель 3 дня подряд",
    icon: Flame,
    progress: (s) => [s.longestStreak, 3],
  },
  {
    code: "streak-7",
    title: "Неделя без пропусков",
    description: "Выполняй дневную цель 7 дней подряд",
    icon: Medal,
    progress: (s) => [s.longestStreak, 7],
  },
  {
    code: "xp-100",
    title: "Первая сотня",
    description: "Набери 100 XP",
    icon: Zap,
    progress: (s) => [s.totalXp, 100],
  },
  {
    code: "xp-500",
    title: "Полтысячи",
    description: "Набери 500 XP",
    icon: Zap,
    progress: (s) => [s.totalXp, 500],
  },
  {
    code: "answers-100",
    title: "Сотня верных ответов",
    description: "Дай 100 правильных ответов в заданиях",
    icon: CircleCheck,
    progress: (s) => [s.correctAnswers, 100],
  },
  {
    code: "replay",
    title: "Повторение — мать учения",
    description: "Пройди любой урок ещё раз",
    icon: RotateCcw,
    progress: (s) => [s.replays, 1],
  },
  {
    code: "mistakes-5",
    title: "Работа над ошибками",
    description: "Исправь 5 ошибок",
    icon: Wrench,
    progress: (s) => [s.mistakesFixed, 5],
  },
];

export function isAchieved(achievement: Achievement, stats: AchievementStats): boolean {
  const [current, target] = achievement.progress(stats);
  return target > 0 && current >= target;
}

export function getAchievement(code: string): Achievement | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.code === code);
}
