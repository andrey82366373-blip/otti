/** Готовые списки вариантов для выбора уровня, цели и времени. */
import {
  BookOpen,
  Briefcase,
  ClipboardCheck,
  GraduationCap,
  MessageCircle,
  Plane,
  type LucideIcon,
} from "lucide-react";

import type { ChoiceOption } from "@/components/learning/choice-group";
import {
  CEFR_LEVELS,
  DAILY_MINUTES,
  GOAL_INFO,
  LEARNING_GOALS,
  LEVEL_INFO,
  MINUTES_INFO,
  dailyGoalXpFor,
  type CefrLevel,
  type DailyMinutes,
  type LearningGoal,
} from "@/lib/learning";

export const GOAL_ICONS: Record<LearningGoal, LucideIcon> = {
  conversation: MessageCircle,
  travel: Plane,
  study: GraduationCap,
  work: Briefcase,
  exam: ClipboardCheck,
  grammar: BookOpen,
};

export const levelOptions: ChoiceOption<CefrLevel>[] = CEFR_LEVELS.map((level) => ({
  value: level,
  tag: level,
  title: LEVEL_INFO[level].title,
  description: LEVEL_INFO[level].description,
}));

export const goalOptions: ChoiceOption<LearningGoal>[] = LEARNING_GOALS.map((goal) => ({
  value: goal,
  icon: GOAL_ICONS[goal],
  title: GOAL_INFO[goal].title,
  description: GOAL_INFO[goal].description,
}));

export const minutesOptions: ChoiceOption<DailyMinutes>[] = DAILY_MINUTES.map((minutes) => ({
  value: minutes,
  tag: String(minutes),
  title: `${minutes} минут · ${MINUTES_INFO[minutes].title}`,
  description: `Цель — ${dailyGoalXpFor(minutes)} XP в день`,
}));
