"use server";

/**
 * Проверка ответа «своими словами» через ИИ.
 * Вызывается, только если ответ не совпал с образцами. Решение ИИ сохраняется,
 * чтобы сервер потом засчитал ответ при сохранении урока.
 */
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getExercise } from "@/content/course";
import { getDb } from "@/db";
import { aiAnswerChecks } from "@/db/schema";
import { AiError, askAi } from "@/lib/ai";
import { answerCheckMessages } from "@/lib/ai/prompts";
import { matchesPatterns } from "@/lib/answer-check";
import { answerKey } from "@/lib/answer-verdicts";
import { toExplanationLanguage } from "@/lib/learning";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";
import { parseAnswerVerdict } from "@/lib/tutor/parse";

export type OpenAnswerVerdict =
  | { status: "correct" | "wrong"; comment: string | null; corrected: string | null }
  | { status: "unavailable"; message: string };

const schema = z.object({
  exerciseId: z.string().min(1).max(64),
  text: z.string().max(300),
});

export async function checkOpenAnswer(input: { exerciseId: string; text: string }): Promise<OpenAnswerVerdict> {
  const { user } = await requireSession();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { status: "unavailable", message: "Ответ не распознан." };
  }

  const found = getExercise(parsed.data.exerciseId);
  const exercise = found?.exercise;
  if (!exercise || (exercise.type !== "short-answer" && exercise.type !== "tutor-reply")) {
    return { status: "unavailable", message: "Это задание ИИ не проверяет." };
  }

  const text = parsed.data.text.trim();
  if (!text) {
    return { status: "wrong", comment: null, corrected: null };
  }
  if (matchesPatterns(text, exercise.patterns)) {
    return { status: "correct", comment: null, corrected: null };
  }
  if (/[а-яё]/i.test(text)) {
    return { status: "wrong", comment: "Ответ нужен по-английски.", corrected: null };
  }

  const key = answerKey(text);
  const db = getDb();

  // Этот ответ уже проверяли — не тратим запрос к ИИ второй раз
  const [cached] = await db
    .select()
    .from(aiAnswerChecks)
    .where(
      and(
        eq(aiAnswerChecks.userId, user.id),
        eq(aiAnswerChecks.exerciseId, exercise.id),
        eq(aiAnswerChecks.answerKey, key),
      ),
    )
    .limit(1);
  if (cached) {
    return {
      status: cached.correct ? "correct" : "wrong",
      comment: cached.comment,
      corrected: cached.corrected,
    };
  }

  const profile = await getProfile(user.id);
  let raw: string;
  try {
    const result = await askAi({
      userId: user.id,
      purpose: "check",
      messages: answerCheckMessages({
        level: profile.level,
        explanationLanguage: toExplanationLanguage(profile.explanationLanguage),
        task: exercise.prompt,
        question: exercise.question,
        questionTranslation: exercise.questionTranslation,
        sample: exercise.sample,
        answer: text,
      }),
      userText: text,
      maxTokens: 150,
      temperature: 0.1,
    });
    raw = result.text;
  } catch (error) {
    if (error instanceof AiError) {
      return { status: "unavailable", message: error.userMessage };
    }
    console.error("[answer-check] Ошибка при проверке ответа:", error);
    return { status: "unavailable", message: "Проверка ИИ сейчас недоступна." };
  }

  const verdict = parseAnswerVerdict(raw);
  if (!verdict) {
    console.error("[answer-check] ИИ ответил в неожиданном формате:", raw.slice(0, 200));
    return { status: "unavailable", message: "Отти не смог проверить ответ." };
  }

  try {
    await db
      .insert(aiAnswerChecks)
      .values({
        userId: user.id,
        exerciseId: exercise.id,
        answerKey: key,
        correct: verdict.correct,
        comment: verdict.comment,
        corrected: verdict.corrected,
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error("[answer-check] Не удалось сохранить решение ИИ:", error);
    return { status: "unavailable", message: "Проверка ИИ сейчас недоступна." };
  }

  return {
    status: verdict.correct ? "correct" : "wrong",
    comment: verdict.comment,
    corrected: verdict.corrected,
  };
}
