/** Ошибки ученика в базе: список, статистика и задания для тренировки. */
import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";

import { getExercise } from "@/content/course";
import { getTopicTitle } from "@/content/course/topics";
import type { Exercise } from "@/content/course/types";
import { getDb } from "@/db";
import { mistakes } from "@/db/schema";
import { todayInTimezone } from "@/lib/dates";
import { getCorrectAnswerText } from "@/lib/exercise-check";
import { MISTAKE_TRAINING_SIZE } from "@/lib/mistakes";
import { getProfile } from "@/lib/profile";

export type MistakeRecord = {
  id: string;
  exercise: Exercise;
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string;
  topic: string;
  topicTitle: string;
  errorType: string;
  userAnswer: string;
  correctAnswer: string;
  timesWrong: number;
  lastWrongAt: Date;
  resolved: boolean;
  resolvedAt: Date | null;
};

/**
 * Все ошибки ученика вместе с заданиями из курса.
 * Ошибки в заданиях, которых больше нет в курсе, пропускаются.
 */
export const getMistakes = cache(async (userId: string): Promise<MistakeRecord[]> => {
  const rows = await getDb().select().from(mistakes).where(eq(mistakes.userId, userId));

  return rows.flatMap((row) => {
    const found = getExercise(row.exerciseId);
    if (!found) return [];
    const { exercise, lesson } = found;
    return [
      {
        id: row.id,
        exercise,
        lessonId: lesson.id,
        lessonNumber: lesson.number,
        lessonTitle: lesson.title,
        topic: exercise.topic,
        topicTitle: getTopicTitle(exercise.topic),
        errorType: row.errorType,
        userAnswer: row.userAnswer ?? "",
        correctAnswer: getCorrectAnswerText(exercise),
        timesWrong: row.timesWrong,
        lastWrongAt: row.lastWrongAt,
        resolved: row.resolved,
        resolvedAt: row.resolvedAt,
      },
    ];
  });
});

export type MistakeStats = {
  /** Ждут исправления. */
  open: number;
  /** Исправлено за всё время. */
  resolved: number;
  /** Исправлено сегодня. */
  fixedToday: number;
};

export const getMistakeStats = cache(async (userId: string): Promise<MistakeStats> => {
  const [list, profile] = await Promise.all([getMistakes(userId), getProfile(userId)]);
  const today = todayInTimezone(profile.timezone);
  return {
    open: list.filter((item) => !item.resolved).length,
    resolved: list.filter((item) => item.resolved).length,
    fixedToday: list.filter(
      (item) => item.resolvedAt && todayInTimezone(profile.timezone, item.resolvedAt) === today,
    ).length,
  };
});

export type TrainingItem = {
  exercise: Exercise;
  lessonNumber: number;
  topicTitle: string;
  timesWrong: number;
};

/**
 * Задания для тренировки: неисправленные ошибки, сначала самые давние.
 * topic — только ошибки одной темы.
 */
export async function getTrainingItems(
  userId: string,
  topic?: string,
): Promise<{ items: TrainingItem[]; totalOpen: number }> {
  const open = (await getMistakes(userId))
    .filter((item) => !item.resolved && (!topic || item.topic === topic))
    .sort((a, b) => a.lastWrongAt.getTime() - b.lastWrongAt.getTime());

  return {
    totalOpen: open.length,
    items: open.slice(0, MISTAKE_TRAINING_SIZE).map((item) => ({
      exercise: item.exercise,
      lessonNumber: item.lessonNumber,
      topicTitle: item.topicTitle,
      timesWrong: item.timesWrong,
    })),
  };
}
