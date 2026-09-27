"use server";

/** Ответ в тренировке «Работа над ошибками». */
import { revalidatePath } from "next/cache";
import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { getExercise } from "@/content/course";
import { getDb } from "@/db";
import { exerciseAttempts, mistakes } from "@/db/schema";
import { getAchievement } from "@/lib/achievements";
import { applyAiVerdicts } from "@/lib/answer-verdicts";
import { todayInTimezone } from "@/lib/dates";
import { checkExercise, type ExerciseAnswer } from "@/lib/exercise-check";
import { MISTAKE_FIX_XP, MISTAKE_FIX_XP_DAILY_CAP } from "@/lib/mistakes";
import { getProfile } from "@/lib/profile";
import { recordXp } from "@/lib/progress-write";
import { requireSession } from "@/lib/session";
import { exerciseAnswerSchema, exerciseIdSchema } from "@/lib/validation/answers";

const checkSchema = z.object({
  exerciseId: exerciseIdSchema,
  answer: exerciseAnswerSchema,
});

export type MistakeCheckResult =
  | {
      ok: true;
      correct: boolean;
      xpEarned: number;
      goalReachedNow: boolean;
      newAchievements: { code: string; title: string }[];
    }
  | { ok: false; error: string };

/**
 * Проверяет ответ на задание из списка ошибок и сохраняет результат.
 * Верный ответ исправляет ошибку (+1 XP), неверный — оставляет её в списке.
 */
export async function checkMistake(input: {
  exerciseId: string;
  answer: ExerciseAnswer;
}): Promise<MistakeCheckResult> {
  const { user } = await requireSession();

  const parsed = checkSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Ответ не распознан." };
  }
  const { exerciseId, answer } = parsed.data;

  const found = getExercise(exerciseId);
  if (!found) {
    return { ok: false, error: "Такого задания нет в курсе." };
  }
  const { exercise, lesson } = found;

  try {
    const db = getDb();
    const [mistake] = await db
      .select({ id: mistakes.id, resolved: mistakes.resolved })
      .from(mistakes)
      .where(and(eq(mistakes.userId, user.id), eq(mistakes.exerciseId, exerciseId)))
      .limit(1);
    if (!mistake) {
      return { ok: false, error: "Этой ошибки нет в твоём списке." };
    }

    // Сервер проверяет ответ сам — браузеру не доверяем.
    // Ответ «своими словами» засчитывается, если его раньше одобрил ИИ.
    const [{ result }] = await applyAiVerdicts(db, user.id, [
      { exercise, answer, result: checkExercise(exercise, answer) },
    ]);

    // Ошибка уже исправлена (например, в другой вкладке) — XP второй раз не даём
    if (mistake.resolved) {
      return { ok: true, correct: result.correct, xpEarned: 0, goalReachedNow: false, newAchievements: [] };
    }

    const profile = await getProfile(user.id);
    const today = todayInTimezone(profile.timezone);
    let xpEarned = 0;
    let goalReachedNow = false;
    let newAchievements: string[] = [];

    await db.transaction(async (tx) => {
      await tx.insert(exerciseAttempts).values({
        userId: user.id,
        lessonId: lesson.id,
        exerciseId: exercise.id,
        exerciseType: exercise.type,
        topic: exercise.topic,
        isCorrect: result.correct,
        userAnswer: result.userAnswer.slice(0, 300),
      });

      if (result.correct) {
        // Сколько ошибок уже исправлено сегодня — опыт за исправления ограничен в день
        const [fixedToday] = await tx
          .select({ total: count() })
          .from(mistakes)
          .where(
            and(
              eq(mistakes.userId, user.id),
              sql`(${mistakes.resolvedAt} at time zone ${profile.timezone})::date = ${today}`,
            ),
          );
        // «resolved = false» в условии: одновременный второй ответ ничего не изменит и не даст опыт
        const fixed = await tx
          .update(mistakes)
          .set({ resolved: true, resolvedAt: new Date() })
          .where(and(eq(mistakes.id, mistake.id), eq(mistakes.resolved, false)))
          .returning({ id: mistakes.id });
        if (fixed.length > 0 && (fixedToday?.total ?? 0) < MISTAKE_FIX_XP_DAILY_CAP) {
          xpEarned = MISTAKE_FIX_XP;
        }
      } else {
        await tx
          .update(mistakes)
          .set({
            timesWrong: sql`${mistakes.timesWrong} + 1`,
            errorType: result.errorType,
            userAnswer: result.userAnswer.slice(0, 300),
            lastWrongAt: new Date(),
          })
          .where(eq(mistakes.id, mistake.id));
      }

      const xpResult = await recordXp(tx, {
        userId: user.id,
        profile,
        today,
        xp: xpEarned,
        exercisesDone: 1,
      });
      goalReachedNow = xpResult.goalReachedNow;
      newAchievements = xpResult.newAchievements;
    });

    revalidatePath("/", "layout");
    return {
      ok: true,
      correct: result.correct,
      xpEarned,
      goalReachedNow,
      newAchievements: newAchievements.map((code) => ({
        code,
        title: getAchievement(code)?.title ?? code,
      })),
    };
  } catch (error) {
    console.error("[mistakes] Не удалось сохранить ответ:", error);
    return { ok: false, error: "Не удалось сохранить ответ. Проверь интернет." };
  }
}
