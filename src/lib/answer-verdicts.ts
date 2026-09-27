/**
 * Ответы «своими словами», которые ИИ признал правильными.
 * Сервер при сохранении урока и в «Работе над ошибками» засчитывает ответ,
 * только если здесь есть запись с correct = true — браузеру на слово не верим.
 */
import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import type { Exercise } from "@/content/course/types";
import { aiAnswerChecks } from "@/db/schema";
import { normalizeAnswer } from "@/lib/answer-check";
import type { CheckResult, ExerciseAnswer } from "@/lib/exercise-check";
import type { DbLike } from "@/lib/stats";

export function isOpenExercise(exercise: Exercise): boolean {
  return exercise.type === "short-answer" || exercise.type === "tutor-reply";
}

/** Ключ ответа: строчные буквы, без знаков препинания и лишних пробелов. */
export function answerKey(text: string): string {
  return normalizeAnswer(text).slice(0, 300);
}

type Item = { exercise: Exercise; answer: ExerciseAnswer; result: CheckResult };

/** Засчитывает открытые ответы, которые ИИ раньше признал правильными. */
export async function applyAiVerdicts<T extends Item>(db: DbLike, userId: string, items: T[]): Promise<T[]> {
  const candidates = items.filter(
    (item) =>
      !item.result.correct &&
      isOpenExercise(item.exercise) &&
      item.answer.kind === "text" &&
      item.answer.text.trim() !== "",
  );
  if (candidates.length === 0) return items;

  const rows = await db
    .select({ exerciseId: aiAnswerChecks.exerciseId, answerKey: aiAnswerChecks.answerKey })
    .from(aiAnswerChecks)
    .where(
      and(
        eq(aiAnswerChecks.userId, userId),
        eq(aiAnswerChecks.correct, true),
        inArray(
          aiAnswerChecks.exerciseId,
          candidates.map((item) => item.exercise.id),
        ),
      ),
    );
  const accepted = new Set(rows.map((row) => `${row.exerciseId}|${row.answerKey}`));

  return items.map((item) => {
    if (item.answer.kind !== "text" || !candidates.includes(item)) return item;
    const key = `${item.exercise.id}|${answerKey(item.answer.text)}`;
    return accepted.has(key) ? { ...item, result: { ...item.result, correct: true, nearMiss: false } } : item;
  });
}
