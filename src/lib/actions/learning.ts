"use server";

/**
 * Серверные действия: сохранение настроек обучения и проверка мини-теста.
 * Каждое действие сначала проверяет, что ученик вошёл, и проверяет присланные данные.
 */
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import {
  DONT_KNOW,
  PLACEMENT_QUESTIONS,
  gradePlacement,
  type PlacementResult,
} from "@/content/placement-test";
import { getDb } from "@/db";
import { placementResults, profiles } from "@/db/schema";
import { getAuth } from "@/lib/auth";
import {
  EXPLANATION_LANGUAGES,
  CEFR_LEVELS,
  LEARNING_GOALS,
  dailyGoalXpFor,
  isDailyMinutes,
  type CefrLevel,
} from "@/lib/learning";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

const SAVE_ERROR = "Не удалось сохранить. Проверь интернет и попробуй ещё раз.";

const levelSchema = z.enum(CEFR_LEVELS);
const goalSchema = z.enum(LEARNING_GOALS);
const minutesSchema = z.number().int().refine(isDailyMinutes);

const onboardingSchema = z.object({
  level: levelSchema,
  goal: goalSchema,
  dailyMinutes: minutesSchema,
});

const settingsSchema = onboardingSchema.extend({
  name: z.string().trim().min(1, "Как тебя зовут?").max(50, "Имя слишком длинное — до 50 символов"),
  explanationLanguage: z.enum(EXPLANATION_LANGUAGES),
});

const answersSchema = z
  .array(z.number().int().min(DONT_KNOW).max(3))
  .length(PLACEMENT_QUESTIONS.length);

/** Проверяет ответы мини-теста и сохраняет результат. */
export async function gradePlacementTest(
  answers: number[],
): Promise<{ ok: true; result: PlacementResult } | { ok: false; error: string }> {
  const { user } = await requireSession();

  const parsed = answersSchema.safeParse(answers);
  if (!parsed.success) {
    return { ok: false, error: "Ответы не распознаны. Пройди тест ещё раз." };
  }

  const result = gradePlacement(parsed.data);
  try {
    await getDb().insert(placementResults).values({
      userId: user.id,
      score: result.correct,
      total: result.total,
      recommendedLevel: result.level,
    });
  } catch (error) {
    console.error("[placement] Не удалось сохранить результат теста:", error);
    // Результат всё равно показываем — он посчитан
  }
  return { ok: true, result };
}

/** Сохраняет выбор на знакомстве и отмечает, что оно пройдено. */
export async function completeOnboarding(input: {
  level: CefrLevel;
  goal: string;
  dailyMinutes: number;
}): Promise<ActionResult> {
  const { user } = await requireSession();

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Выбери уровень, цель и время занятий." };
  }
  const { level, goal, dailyMinutes } = parsed.data;

  try {
    await getProfile(user.id);
    await getDb()
      .update(profiles)
      .set({
        level,
        goal,
        dailyMinutes,
        dailyGoalXp: dailyGoalXpFor(dailyMinutes),
        onboardingCompleted: true,
      })
      .where(eq(profiles.userId, user.id));
  } catch (error) {
    console.error("[onboarding] Не удалось сохранить:", error);
    return { ok: false, error: SAVE_ERROR };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Сохраняет настройки из профиля: имя, уровень, цель и время занятий. */
export async function updateLearningSettings(input: {
  name: string;
  level: CefrLevel;
  goal: string;
  dailyMinutes: number;
  explanationLanguage: string;
}): Promise<ActionResult> {
  const { user } = await requireSession();

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Проверь поля формы." };
  }
  const { name, level, goal, dailyMinutes, explanationLanguage } = parsed.data;

  try {
    if (name !== user.name) {
      // Через Better Auth, чтобы новое имя сразу попало и в сессию
      await getAuth().api.updateUser({ headers: await headers(), body: { name } });
    }
    await getProfile(user.id);
    await getDb()
      .update(profiles)
      .set({ level, goal, dailyMinutes, dailyGoalXp: dailyGoalXpFor(dailyMinutes), explanationLanguage })
      .where(eq(profiles.userId, user.id));
  } catch (error) {
    console.error("[profile] Не удалось сохранить настройки:", error);
    return { ok: false, error: SAVE_ERROR };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Меняет только уровень — после повторного теста. */
export async function setLevel(level: CefrLevel): Promise<ActionResult> {
  const { user } = await requireSession();

  const parsed = levelSchema.safeParse(level);
  if (!parsed.success) {
    return { ok: false, error: "Неизвестный уровень." };
  }

  try {
    await getProfile(user.id);
    await getDb()
      .update(profiles)
      .set({ level: parsed.data })
      .where(eq(profiles.userId, user.id));
  } catch (error) {
    console.error("[profile] Не удалось сменить уровень:", error);
    return { ok: false, error: SAVE_ERROR };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
