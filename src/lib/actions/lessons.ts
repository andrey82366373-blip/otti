"use server";

/**
 * Завершение урока. Сервер заново проверяет каждый ответ (браузеру не доверяем),
 * сохраняет попытки и ошибки, отмечает урок пройденным и начисляет XP.
 */
import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { getLesson, getLessonStates, getNextLesson } from "@/content/course";
import { getDb } from "@/db";
import { exerciseAttempts, lessonProgress, mistakes } from "@/db/schema";
import { getCompletedLessonIds } from "@/lib/course-progress";
import { todayInTimezone } from "@/lib/dates";
import { MAX_ATTEMPTS, checkExercise, type ExerciseAnswer } from "@/lib/exercise-check";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";
import { getAchievement } from "@/lib/achievements";
import { applyAiVerdicts } from "@/lib/answer-verdicts";
import { recordXp } from "@/lib/progress-write";
import { effectiveStreak } from "@/lib/streak";
import { syncLessonWords } from "@/lib/word-store";
import { exerciseAnswerSchema, exerciseIdSchema } from "@/lib/validation/answers";
import { calculateLessonXp } from "@/lib/xp";

const finishSchema = z.object({
  lessonId: z.string().max(64),
  attempts: z
    .array(z.object({ exerciseId: exerciseIdSchema, answer: exerciseAnswerSchema }))
    .min(1)
    .max(100),
});

export type LessonAttempt = { exerciseId: string; answer: ExerciseAnswer };

export type LessonSummary = {
  xpEarned: number;
  firstTryCorrect: number;
  total: number;
  scorePercent: number;
  mistakesCount: number;
  isFirstCompletion: boolean;
  nextLesson: { id: string; number: number; title: string } | null;
  /** XP за сегодня и дневная цель. */
  todayXp: number;
  dailyGoalXp: number;
  /** Цель дня выполнена именно этим уроком. */
  goalReachedNow: boolean;
  streak: number;
  newAchievements: { code: string; title: string }[];
  /** Сколько новых слов попало в словарь. */
  newWordsAdded: number;
  /** Сколько старых ошибок исправлено (задание решено с первой попытки при повторе). */
  mistakesFixed: number;
  /** Опыт за повтор урока сегодня уже получен — в этот раз без XP. */
  replayXpLimited: boolean;
};

export type FinishLessonResult =
  | { ok: true; summary: LessonSummary }
  | { ok: false; error: string };

export async function finishLesson(input: {
  lessonId: string;
  attempts: LessonAttempt[];
}): Promise<FinishLessonResult> {
  const { user } = await requireSession();

  const parsed = finishSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Ответы не распознаны. Пройди урок ещё раз." };
  }
  const { lessonId, attempts } = parsed.data;

  const lesson = getLesson(lessonId);
  if (!lesson) {
    return { ok: false, error: "Такого урока нет." };
  }

  const completedBefore = await getCompletedLessonIds(user.id);
  if (getLessonStates(completedBefore).get(lesson.id) === "locked") {
    return { ok: false, error: "Этот урок пока закрыт — сначала пройди предыдущий." };
  }

  // Перепроверяем каждую попытку
  const exercisesById = new Map(lesson.exercises.map((exercise) => [exercise.id, exercise]));
  const rawChecks = [];
  for (const attempt of attempts) {
    const exercise = exercisesById.get(attempt.exerciseId);
    if (!exercise) {
      return { ok: false, error: "В ответах есть чужое задание. Пройди урок ещё раз." };
    }
    rawChecks.push({ exercise, answer: attempt.answer, result: checkExercise(exercise, attempt.answer) });
  }

  // Ответы «своими словами», которые Отти уже признал правильными, тоже засчитываются
  let verified;
  try {
    verified = await applyAiVerdicts(getDb(), user.id, rawChecks);
  } catch (error) {
    console.error("[lesson] Не удалось прочитать проверки ИИ:", error);
    verified = rawChecks;
  }
  const checked: {
    exerciseId: string;
    correct: boolean;
    userAnswer: string;
    correctAnswer: string;
    errorType: string;
  }[] = verified.map((item) => ({ exerciseId: item.exercise.id, ...item.result }));

  // Порядок попыток: не больше MAX_ATTEMPTS на задание и ни одной после правильного ответа
  const attemptsCount = new Map<string, number>();
  const solved = new Set<string>();
  for (const item of checked) {
    const count = (attemptsCount.get(item.exerciseId) ?? 0) + 1;
    if (solved.has(item.exerciseId) || count > MAX_ATTEMPTS) {
      return { ok: false, error: "Ответы не распознаны. Пройди урок ещё раз." };
    }
    attemptsCount.set(item.exerciseId, count);
    if (item.correct) solved.add(item.exerciseId);
  }

  // Урок пройден, если каждое задание решено или исчерпаны попытки
  for (const exercise of lesson.exercises) {
    const own = checked.filter((item) => item.exerciseId === exercise.id);
    const finished = own.some((item) => item.correct) || own.length >= MAX_ATTEMPTS;
    if (!finished) {
      return { ok: false, error: "Урок ещё не закончен. Ответь на все задания." };
    }
  }

  const total = lesson.exercises.length;
  const firstTryCorrect = lesson.exercises.filter(
    (exercise) => checked.find((item) => item.exerciseId === exercise.id)?.correct,
  ).length;
  const scorePercent = Math.round((firstTryCorrect / total) * 100);
  const wrong = checked.filter((item) => !item.correct);

  const exerciseById = (id: string) => exercisesById.get(id)!;

  // Считаются внутри транзакции — там прогресс урока читается с блокировкой строки
  let isFirstCompletion = !completedBefore.has(lesson.id);
  let xpEarned = 0;
  let replayXpLimited = false;
  let todayXp = 0;
  let goalReachedNow = false;
  let streak = 0;
  let newAchievementCodes: string[] = [];
  let dailyGoalXp = 0;
  let newWordsAdded = 0;
  let mistakesFixed = 0;

  try {
    const profile = await getProfile(user.id);
    const today = todayInTimezone(profile.timezone);
    dailyGoalXp = profile.dailyGoalXp;
    streak = effectiveStreak(profile, today);
    const db = getDb();

    await db.transaction(async (tx) => {
      // 0. Первое ли это прохождение и давали ли сегодня опыт за повтор.
      // «for update» — два одновременных сохранения не получат бонус дважды.
      const [existing] = await tx
        .select({ completedAt: lessonProgress.completedAt, lastReplayXpOn: lessonProgress.lastReplayXpOn })
        .from(lessonProgress)
        .where(and(eq(lessonProgress.userId, user.id), eq(lessonProgress.lessonId, lesson.id)))
        .for("update");
      isFirstCompletion = !existing?.completedAt;
      // Опыт за повтор урока — не чаще раза в день
      replayXpLimited = !isFirstCompletion && existing?.lastReplayXpOn === today;
      xpEarned = replayXpLimited ? 0 : calculateLessonXp({ firstTryCorrect, total, isFirstCompletion });

      // 1. Все ответы — для статистики точности
      await tx.insert(exerciseAttempts).values(
        checked.map((item) => {
          const exercise = exerciseById(item.exerciseId);
          return {
            userId: user.id,
            lessonId: lesson.id,
            exerciseId: item.exerciseId,
            exerciseType: exercise.type,
            topic: exercise.topic,
            isCorrect: item.correct,
            userAnswer: item.userAnswer.slice(0, 300),
          };
        }),
      );

      // 2. Ошибки — в «Работу над ошибками»
      for (const item of wrong) {
        const exercise = exerciseById(item.exerciseId);
        await tx
          .insert(mistakes)
          .values({
            userId: user.id,
            lessonId: lesson.id,
            exerciseId: exercise.id,
            exerciseType: exercise.type,
            topic: exercise.topic,
            errorType: item.errorType,
            userAnswer: item.userAnswer.slice(0, 300),
            correctAnswer: item.correctAnswer.slice(0, 300),
          })
          .onConflictDoUpdate({
            target: [mistakes.userId, mistakes.exerciseId],
            set: {
              timesWrong: sql`${mistakes.timesWrong} + 1`,
              resolved: false,
              resolvedAt: null,
              errorType: item.errorType,
              userAnswer: item.userAnswer.slice(0, 300),
              lastWrongAt: new Date(),
            },
          });
      }

      // 2б. Задания, решённые с первой попытки, снимаются из «Работы над ошибками»
      const firstTryIds = lesson.exercises
        .filter((exercise) => checked.find((item) => item.exerciseId === exercise.id)?.correct)
        .map((exercise) => exercise.id);
      if (firstTryIds.length > 0) {
        const fixed = await tx
          .update(mistakes)
          .set({ resolved: true, resolvedAt: new Date() })
          .where(
            and(
              eq(mistakes.userId, user.id),
              eq(mistakes.resolved, false),
              inArray(mistakes.exerciseId, firstTryIds),
            ),
          )
          .returning({ id: mistakes.id });
        mistakesFixed = fixed.length;
      }

      // 3. Прогресс урока
      await tx
        .insert(lessonProgress)
        .values({
          userId: user.id,
          lessonId: lesson.id,
          status: "completed",
          bestScore: scorePercent,
          attempts: 1,
          xpEarned,
          completedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [lessonProgress.userId, lessonProgress.lessonId],
          set: {
            status: "completed",
            bestScore: sql`greatest(${lessonProgress.bestScore}, ${scorePercent})`,
            attempts: sql`${lessonProgress.attempts} + 1`,
            xpEarned: sql`${lessonProgress.xpEarned} + ${xpEarned}`,
            completedAt: sql`coalesce(${lessonProgress.completedAt}, now())`,
            ...(!isFirstCompletion && !replayXpLimited ? { lastReplayXpOn: today } : {}),
          },
        });

      // 4. Опыт, активность дня, серия и достижения
      const xpResult = await recordXp(tx, {
        userId: user.id,
        profile,
        today,
        xp: xpEarned,
        lessonsCompleted: 1,
        exercisesDone: checked.length,
      });
      todayXp = xpResult.todayXp;
      goalReachedNow = xpResult.goalReachedNow;
      streak = xpResult.streak;
      newAchievementCodes = xpResult.newAchievements;

      // 5. Слова урока — в личный словарь
      newWordsAdded = await syncLessonWords(tx, user.id, [lesson.id]);
    });
  } catch (error) {
    console.error("[lesson] Не удалось сохранить результат урока:", error);
    return { ok: false, error: "Не удалось сохранить результат. Проверь интернет и попробуй ещё раз." };
  }

  const completedNow = new Set(completedBefore).add(lesson.id);
  const next = getNextLesson(completedNow);

  revalidatePath("/", "layout");
  return {
    ok: true,
    summary: {
      xpEarned,
      firstTryCorrect,
      total,
      scorePercent,
      mistakesCount: new Set(wrong.map((item) => item.exerciseId)).size,
      isFirstCompletion,
      nextLesson: next ? { id: next.id, number: next.number, title: next.title } : null,
      todayXp,
      dailyGoalXp,
      goalReachedNow,
      streak,
      newWordsAdded,
      mistakesFixed,
      replayXpLimited,
      newAchievements: newAchievementCodes.map((code) => ({
        code,
        title: getAchievement(code)?.title ?? code,
      })),
    },
  };
}
