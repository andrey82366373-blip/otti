"use server";

/**
 * Подготовка к IELTS: настройки и план, отправка ответов Reading/Listening, черновики,
 * проверка Writing и Speaking через ИИ, итог диагностики.
 * Ответы всегда проверяются здесь, на сервере; браузеру не доверяем.
 */
import { createHash } from "node:crypto";

import { revalidatePath } from "next/cache";
import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";

import { DIAGNOSTIC_LISTENING, getListeningSection } from "@/content/ielts/listening";
import { DIAGNOSTIC_READING, getReadingPassage } from "@/content/ielts/reading";
import { DIAGNOSTIC_SPEAKING, getSpeakingTask } from "@/content/ielts/speaking";
import type { ChartSpec } from "@/content/ielts/types";
import { DIAGNOSTIC_WRITING, getWritingTask } from "@/content/ielts/writing";
import { getDb } from "@/db";
import { examAiChecks, examAttempts, examDrafts, examProfiles, profiles } from "@/db/schema";
import { AiError, askAi } from "@/lib/ai";
import { getAiConfig } from "@/lib/ai/config";
import { aiDay } from "@/lib/ai/limits";
import { newRequestId } from "@/lib/ai/retry";
import { todayInTimezone } from "@/lib/dates";
import {
  parseSpeakingFeedback,
  parseWritingFeedback,
  speakingMessages,
  writingMessages,
  type SpeakingAnswer,
} from "@/lib/exams/ai-feedback";
import {
  TARGET_BANDS,
  countWords,
  gradeObjective,
  objectiveEstimate,
  reviewDetails,
  type ReviewDetail,
  overallEstimate,
  productiveEstimate,
  type AnswerValue,
} from "@/lib/exams/ielts";
import { generatePlan } from "@/lib/exams/plan";
import { countChecksToday, getIeltsProfile } from "@/lib/exams/store";
import type {
  BandEstimate,
  DiagnosticResult,
  SpeakingFeedback,
  WritingFeedback,
} from "@/lib/exams/types";
import { getProfile } from "@/lib/profile";
import { recordXp } from "@/lib/progress-write";
import { getSession } from "@/lib/session";

const SAVE_ERROR = "Не удалось сохранить. Проверь интернет и попробуй ещё раз.";
const AUTH_ERROR = "Сессия закончилась. Войди снова — ответы сохранятся на этой странице.";

/* ─────────────────────────── Настройки и план ─────────────────────────── */

const profileSchema = z.object({
  module: z.enum(["academic", "general"]),
  targetBand: z.number().refine((value) => (TARGET_BANDS as readonly number[]).includes(value), "Выбери желаемый балл"),
  examDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  currentLevel: z.enum(["A2", "B1", "B2", "C1", "unknown"]),
  sessionsPerWeek: z.number().int().min(1).max(7),
  weakestSkill: z.enum(["reading", "listening", "writing", "speaking", "unsure"]),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export async function saveIeltsProfile(
  input: ProfileInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: AUTH_ERROR };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Проверь поля формы." };
  }
  const data = parsed.data;
  const userId = session.user.id;

  try {
    const profile = await getProfile(userId);
    const today = todayInTimezone(profile.timezone);
    if (data.examDate && data.examDate < today) {
      return { ok: false, error: "Дата экзамена уже прошла. Выбери будущую дату или оставь «Пока не знаю»." };
    }
    const existing = await getIeltsProfile(userId);
    const plan = generatePlan({
      ...data,
      today,
      diagnosticDone: Boolean(existing?.diagnostic),
      estimateMid: existing?.diagnostic?.estimate?.mid ?? null,
    });
    const db = getDb();
    await db.transaction(async (tx) => {
      await tx
        .insert(examProfiles)
        .values({ userId, exam: "ielts", ...data, plan })
        .onConflictDoUpdate({
          target: [examProfiles.userId, examProfiles.exam],
          set: { ...data, plan },
        });
      // Ученик сам выбрал подготовку к экзамену — отмечаем цель в профиле
      await tx.update(profiles).set({ goal: "exam" }).where(eq(profiles.userId, userId));
    });
  } catch (error) {
    console.error("[exams] Не удалось сохранить настройки IELTS:", error);
    return { ok: false, error: SAVE_ERROR };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/* ───────────────────── Reading и Listening: проверка ───────────────────── */

/** Не больше стольких попыток в день — защита базы от засорения. */
const ATTEMPTS_PER_DAY = 120;
/** XP за задание Reading/Listening — один раз в день за задание, не больше 15. */
const OBJECTIVE_XP_CAP = 15;
/** XP за проверку Writing/Speaking — один раз в день за задание. */
const PRODUCTIVE_XP = 10;

const objectiveSchema = z.object({
  skill: z.enum(["reading", "listening"]),
  taskId: z.string().min(1).max(64),
  mode: z.enum(["practice", "exam", "diagnostic"]),
  answers: z.record(z.string().max(64), z.union([z.string().max(200), z.number(), z.null()])),
  durationSec: z.number().int().min(0).max(4 * 60 * 60),
});

export type ObjectiveResult =
  | {
      ok: true;
      correct: number;
      total: number;
      details: ReviewDetail[];
      estimate: BandEstimate | null;
      xpEarned: number;
    }
  | { ok: false; error: string };

/** Начало и конец сегодняшнего дня ученика — для «один раз в день». */
function dayBounds(timezone: string) {
  const today = todayInTimezone(timezone);
  return { today, sqlToday: sql`(now() at time zone ${timezone})::date` };
}

export async function submitObjective(input: z.infer<typeof objectiveSchema>): Promise<ObjectiveResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: AUTH_ERROR };
  const parsed = objectiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Ответы не распознаны. Обнови страницу." };
  const { skill, taskId, mode, answers, durationSec } = parsed.data;

  const task = skill === "reading" ? getReadingPassage(taskId) : getListeningSection(taskId);
  if (!task) return { ok: false, error: "Задание не найдено." };
  const isDiagnosticTask = taskId === DIAGNOSTIC_READING.id || taskId === DIAGNOSTIC_LISTENING.id;
  if ((mode === "diagnostic") !== isDiagnosticTask) return { ok: false, error: "Задание не найдено." };

  const answeredCount = Object.values(answers).filter((value) => value !== null && value !== "").length;
  if (answeredCount === 0) {
    return { ok: false, error: "Ответь хотя бы на один вопрос — пустую попытку не сохраняем." };
  }

  const userId = session.user.id;
  const examProfile = await getIeltsProfile(userId);
  const examModule = examProfile?.module ?? ("module" in task ? task.module : "academic");
  const graded = gradeObjective(task, answers as Record<string, AnswerValue>);
  const estimate = objectiveEstimate(graded.correct, graded.total, skill, examModule);

  try {
    const profile = await getProfile(userId);
    const { today, sqlToday } = dayBounds(profile.timezone);
    let xpEarned = 0;
    await getDb().transaction(async (tx) => {
      const [attemptsToday] = await tx
        .select({ total: count() })
        .from(examAttempts)
        .where(
          and(
            eq(examAttempts.userId, userId),
            sql`(${examAttempts.createdAt} at time zone ${profile.timezone})::date = ${sqlToday}`,
          ),
        );
      if ((attemptsToday?.total ?? 0) >= ATTEMPTS_PER_DAY) {
        throw new Error("DAILY_ATTEMPTS");
      }
      const [sameTaskToday] = await tx
        .select({ total: count() })
        .from(examAttempts)
        .where(
          and(
            eq(examAttempts.userId, userId),
            eq(examAttempts.taskId, taskId),
            sql`(${examAttempts.createdAt} at time zone ${profile.timezone})::date = ${sqlToday}`,
          ),
        );
      await tx.insert(examAttempts).values({
        userId,
        skill,
        taskId,
        mode,
        correct: graded.correct,
        total: graded.total,
        bandLow: estimate?.low ?? null,
        bandHigh: estimate?.high ?? null,
        answers: answers as Record<string, string | number | null>,
        review: graded.review,
        durationSec,
      });
      if ((sameTaskToday?.total ?? 0) === 0 && graded.correct > 0) {
        xpEarned = Math.min(OBJECTIVE_XP_CAP, graded.correct);
        await recordXp(tx, { userId, profile, today, xp: xpEarned });
      }
    });
    revalidatePath("/", "layout");
    return {
      ok: true,
      correct: graded.correct,
      total: graded.total,
      details: reviewDetails(task, answers as Record<string, AnswerValue>),
      estimate,
      xpEarned,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "DAILY_ATTEMPTS") {
      return { ok: false, error: "На сегодня заданий уже очень много. Отдохни и продолжай завтра!" };
    }
    console.error("[exams] Не удалось сохранить попытку:", error);
    return { ok: false, error: SAVE_ERROR };
  }
}

/* ─────────────────────────────── Черновики ─────────────────────────────── */

const MAX_DRAFT_CHARS = 12_000;

function isDraftTask(taskId: string): boolean {
  return (
    Boolean(getWritingTask(taskId) ?? getSpeakingTask(taskId)) ||
    taskId === DIAGNOSTIC_WRITING.id ||
    taskId === DIAGNOSTIC_SPEAKING.id
  );
}

export async function saveExamDraft(input: { taskId: string; text: string }): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };
  const parsed = z.object({ taskId: z.string().max(64), text: z.string().max(MAX_DRAFT_CHARS) }).safeParse(input);
  if (!parsed.success || !isDraftTask(parsed.data.taskId)) return { ok: false };
  try {
    await getDb()
      .insert(examDrafts)
      .values({ userId: session.user.id, taskId: parsed.data.taskId, text: parsed.data.text })
      .onConflictDoUpdate({
        target: [examDrafts.userId, examDrafts.taskId],
        set: { text: parsed.data.text, updatedAt: new Date() },
      });
    return { ok: true };
  } catch (error) {
    console.error("[exams] Не удалось сохранить черновик:", error);
    return { ok: false };
  }
}

/* ─────────────────────── Проверка ИИ: общие части ─────────────────────── */

export type CheckFailure = {
  ok: false;
  /** limit — лимит проверок; pending — проверка уже идёт; invalid — текст нельзя проверить; unavailable — ИИ недоступен. */
  code: "limit" | "pending" | "invalid" | "unavailable" | "auth";
  error: string;
  retryable: boolean;
  requestId?: string;
  checkId?: string;
};

export type CheckSuccess<T> = {
  ok: true;
  checkId: string;
  feedback: T;
  /** Результат взят из сохранённой проверки — повторный запрос к ИИ не отправлялся. */
  cached: boolean;
  remaining: number;
  xpEarned: number;
};

/** Проверка «зависла» (например, сервер перезапустился) — через 3 минуты её можно начать заново. */
const STALE_PENDING_MS = 3 * 60 * 1000;

function hashContent(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Текст для отпечатка: одинаковый по смыслу текст (лишние пробелы) — одна проверка. */
function normalizeForHash(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

type CheckKind = "writing" | "speaking";

/**
 * Бронирует проверку: если такой текст уже проверен — вернёт готовый результат,
 * если проверка идёт — сообщит об этом, если дневной лимит исчерпан — откажет.
 */
async function reserveCheck(
  userId: string,
  kind: CheckKind,
  taskId: string,
  contentHash: string,
  content: string,
  dailyLimit: number,
  countsToLimit: boolean,
): Promise<
  | { type: "reserved"; checkId: string; used: number }
  | { type: "done"; check: typeof examAiChecks.$inferSelect; used: number }
  | { type: "pending"; checkId: string }
  | { type: "limit"; used: number }
> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(examAiChecks)
    .where(
      and(
        eq(examAiChecks.userId, userId),
        eq(examAiChecks.kind, kind),
        eq(examAiChecks.taskId, taskId),
        eq(examAiChecks.contentHash, contentHash),
      ),
    )
    .limit(1);
  const used = await countChecksToday(userId, kind);
  if (existing?.status === "done") return { type: "done", check: existing, used };
  if (existing?.status === "pending") {
    if (Date.now() - existing.createdAt.getTime() < STALE_PENDING_MS) return { type: "pending", checkId: existing.id };
    await db.delete(examAiChecks).where(eq(examAiChecks.id, existing.id));
  }
  if (countsToLimit && used >= dailyLimit) return { type: "limit", used };

  const inserted = await db
    .insert(examAiChecks)
    .values({ userId, kind, taskId, contentHash, status: "pending", day: aiDay(), content })
    .onConflictDoNothing()
    .returning({ id: examAiChecks.id });
  if (inserted.length === 0) {
    // Параллельный запрос с тем же текстом успел раньше
    const [other] = await db
      .select({ id: examAiChecks.id })
      .from(examAiChecks)
      .where(
        and(
          eq(examAiChecks.userId, userId),
          eq(examAiChecks.kind, kind),
          eq(examAiChecks.taskId, taskId),
          eq(examAiChecks.contentHash, contentHash),
        ),
      )
      .limit(1);
    return { type: "pending", checkId: other?.id ?? "" };
  }
  return { type: "reserved", checkId: inserted[0].id, used: used + (countsToLimit ? 1 : 0) };
}

function aiFailure(error: unknown, requestId: string): CheckFailure {
  if (error instanceof AiError) {
    const limit = error.code === "limit_user_day" || error.code === "limit_user_minute" || error.code === "limit_global";
    return {
      ok: false,
      code: limit ? "limit" : "unavailable",
      error: error.userMessage,
      retryable: error.retryable,
      requestId,
    };
  }
  console.error(`[exams] req=${requestId} Непредвиденная ошибка проверки:`, error);
  return { ok: false, code: "unavailable", error: "Не получилось проверить. Попробуй ещё раз.", retryable: true, requestId };
}

/** Даёт XP за проверку задания — один раз в день за задание. */
async function awardProductiveXp(userId: string, skill: CheckKind, taskId: string, checkId: string, overall: BandEstimate | null) {
  const profile = await getProfile(userId);
  const today = todayInTimezone(profile.timezone);
  let xpEarned = 0;
  await getDb().transaction(async (tx) => {
    const [sameToday] = await tx
      .select({ total: count() })
      .from(examAttempts)
      .where(
        and(
          eq(examAttempts.userId, userId),
          eq(examAttempts.taskId, taskId),
          sql`(${examAttempts.createdAt} at time zone ${profile.timezone})::date = (now() at time zone ${profile.timezone})::date`,
        ),
      );
    await tx.insert(examAttempts).values({
      userId,
      skill,
      taskId,
      mode: taskId.endsWith("-diagnostic") ? "diagnostic" : "practice",
      bandLow: overall?.low ?? null,
      bandHigh: overall?.high ?? null,
      answers: { checkId },
    });
    if ((sameToday?.total ?? 0) === 0) {
      xpEarned = PRODUCTIVE_XP;
      await recordXp(tx, { userId, profile, today, xp: xpEarned });
    }
  });
  return xpEarned;
}

/* ─────────────────────────────── Writing ─────────────────────────────── */

/** Данные графика словами — для проверки точности описания в Task 1. */
function chartToText(chart: ChartSpec | undefined): string | null {
  if (!chart) return null;
  if (chart.type === "table") {
    return [chart.title, chart.columns.join(" | "), ...chart.rows.map((row) => row.join(" | "))].join("\n");
  }
  return [
    `${chart.title} (${chart.type === "bar" ? "bar chart" : "line graph"})`,
    `Categories: ${chart.categories.join(", ")}`,
    ...chart.series.map((series) => `${series.name}: ${series.values.join(", ")}${chart.unit}`),
  ].join("\n");
}

const writingSchema = z.object({
  taskId: z.string().max(64),
  text: z.string().max(MAX_DRAFT_CHARS),
  durationSec: z.number().int().min(0).max(4 * 60 * 60).optional(),
});

export type WritingCheckResult = CheckSuccess<WritingFeedback> | CheckFailure;

export async function checkWriting(input: z.infer<typeof writingSchema>): Promise<WritingCheckResult> {
  const session = await getSession();
  if (!session) return { ok: false, code: "auth", error: AUTH_ERROR, retryable: false };
  const parsed = writingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid", error: "Текст не распознан.", retryable: false };
  const userId = session.user.id;
  const requestId = newRequestId();

  const isDiagnostic = parsed.data.taskId === DIAGNOSTIC_WRITING.id;
  const task = isDiagnostic
    ? {
        task: 2 as const,
        module: "both" as const,
        prompt: DIAGNOSTIC_WRITING.prompt,
        minWords: DIAGNOSTIC_WRITING.minWords,
        kindTitle: "короткий ответ-мнение (диагностика)",
        chart: undefined,
      }
    : getWritingTask(parsed.data.taskId);
  if (!task) return { ok: false, code: "invalid", error: "Задание не найдено.", retryable: false };

  const text = normalizeForHash(parsed.data.text);
  const words = countWords(text);
  if (words < 20) {
    return { ok: false, code: "invalid", error: "Напиши хотя бы 20 слов — тогда будет что проверить.", retryable: false };
  }
  if (/[а-яё]/i.test(text) && (text.match(/[а-яё]/gi)?.length ?? 0) > text.length * 0.3) {
    return { ok: false, code: "invalid", error: "Ответ должен быть на английском языке.", retryable: false };
  }

  const config = getAiConfig();
  const limit = config.limits.examWritingDaily;
  const reservation = await reserveCheck(
    userId,
    "writing",
    parsed.data.taskId,
    hashContent(text),
    text,
    limit,
    !isDiagnostic,
  );
  if (reservation.type === "done" && reservation.check.writing) {
    return {
      ok: true,
      checkId: reservation.check.id,
      feedback: reservation.check.writing,
      cached: true,
      remaining: Math.max(0, limit - reservation.used),
      xpEarned: 0,
    };
  }
  if (reservation.type === "pending") {
    return {
      ok: false,
      code: "pending",
      error: "Этот текст уже проверяется. Результат появится здесь через минуту.",
      retryable: true,
      checkId: reservation.checkId,
    };
  }
  if (reservation.type === "limit") {
    return {
      ok: false,
      code: "limit",
      error: `На сегодня проверки Writing закончились (${limit} в день). Черновик сохранён — проверь его завтра. Это ограничение бесплатного режима ИИ.`,
      retryable: false,
    };
  }
  if (reservation.type !== "reserved") {
    return { ok: false, code: "unavailable", error: "Не получилось начать проверку.", retryable: true, requestId };
  }

  const checkId = reservation.checkId;
  try {
    const answer = await askAi({
      userId,
      purpose: "exam_writing",
      messages: writingMessages({ task, chartText: chartToText(task.chart), text }),
      temperature: 0.2,
      requestId,
      longOutput: true,
      validate: (raw) => parseWritingFeedback(raw, text, task.minWords) !== null,
    });
    const feedback = parseWritingFeedback(answer.text, text, task.minWords);
    if (!feedback) throw new AiError("bad_format", "ИИ ответил в непонятном формате. Попробуй проверить ещё раз.");
    await getDb()
      .update(examAiChecks)
      .set({ status: "done", writing: feedback })
      .where(eq(examAiChecks.id, checkId));
    const xpEarned = await awardProductiveXp(userId, "writing", parsed.data.taskId, checkId, feedback.overall);
    revalidatePath("/", "layout");
    return {
      ok: true,
      checkId,
      feedback,
      cached: false,
      remaining: Math.max(0, limit - reservation.used),
      xpEarned,
    };
  } catch (error) {
    // Проверка не удалась — бронь снимаем, лимит не тратится
    await getDb()
      .delete(examAiChecks)
      .where(eq(examAiChecks.id, checkId))
      .catch(() => undefined);
    return aiFailure(error, requestId);
  }
}

/** Состояние проверки — для страницы, пока идёт проверка (например, после обновления). */
export async function getCheckStatus(input: { checkId: string }): Promise<
  | { status: "done"; writing: WritingFeedback | null; speaking: SpeakingFeedback | null }
  | { status: "pending" }
  | { status: "missing" }
> {
  const session = await getSession();
  if (!session) return { status: "missing" };
  const parsed = z.object({ checkId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { status: "missing" };
  const [row] = await getDb()
    .select()
    .from(examAiChecks)
    .where(and(eq(examAiChecks.id, parsed.data.checkId), eq(examAiChecks.userId, session.user.id)))
    .limit(1);
  if (!row) return { status: "missing" };
  if (row.status === "done") return { status: "done", writing: row.writing ?? null, speaking: row.speaking ?? null };
  if (Date.now() - row.createdAt.getTime() > STALE_PENDING_MS) return { status: "missing" };
  return { status: "pending" };
}

/* ─────────────────────────────── Speaking ─────────────────────────────── */

const speakingSchema = z.object({
  taskId: z.string().max(64),
  answers: z
    .array(z.object({ question: z.string().max(400), answer: z.string().max(4000) }))
    .min(1)
    .max(8),
  mode: z.enum(["voice", "text"]),
  unclearFragments: z.array(z.string().max(120)).max(20),
  recognitionConfidence: z.number().min(0).max(1).nullable(),
});

export type SpeakingCheckResult = CheckSuccess<SpeakingFeedback> | CheckFailure;

export async function checkSpeaking(input: z.infer<typeof speakingSchema>): Promise<SpeakingCheckResult> {
  const session = await getSession();
  if (!session) return { ok: false, code: "auth", error: AUTH_ERROR, retryable: false };
  const parsed = speakingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid", error: "Ответы не распознаны.", retryable: false };
  const userId = session.user.id;
  const requestId = newRequestId();

  const isDiagnostic = parsed.data.taskId === DIAGNOSTIC_SPEAKING.id;
  const task = isDiagnostic
    ? { part: 1 as const, topic: "Diagnostic: about you", cueCard: undefined, questions: DIAGNOSTIC_SPEAKING.questions }
    : getSpeakingTask(parsed.data.taskId);
  if (!task) return { ok: false, code: "invalid", error: "Задание не найдено.", retryable: false };

  // Вопросы берём из задания на сервере — браузер присылает только ответы
  const allowedQuestions = task.cueCard ? [task.cueCard.prompt] : task.questions;
  const answers: SpeakingAnswer[] = parsed.data.answers
    .map((item) => ({ question: item.question.trim(), answer: normalizeForHash(item.answer) }))
    .filter((item) => allowedQuestions.includes(item.question) && item.answer);
  const words = countWords(answers.map((item) => item.answer).join(" "));
  if (answers.length === 0 || words < 15) {
    return { ok: false, code: "invalid", error: "Ответь хотя бы на один вопрос (от 15 слов), чтобы Отти было что разобрать.", retryable: false };
  }

  const content = answers.map((item) => `${item.question}\n${item.answer}`).join("\n\n");
  const config = getAiConfig();
  const limit = config.limits.examSpeakingDaily;
  const reservation = await reserveCheck(
    userId,
    "speaking",
    parsed.data.taskId,
    hashContent(`${parsed.data.mode}\n${content}`),
    content,
    limit,
    !isDiagnostic,
  );
  if (reservation.type === "done" && reservation.check.speaking) {
    return {
      ok: true,
      checkId: reservation.check.id,
      feedback: reservation.check.speaking,
      cached: true,
      remaining: Math.max(0, limit - reservation.used),
      xpEarned: 0,
    };
  }
  if (reservation.type === "pending") {
    return {
      ok: false,
      code: "pending",
      error: "Эти ответы уже проверяются. Результат появится здесь через минуту.",
      retryable: true,
      checkId: reservation.checkId,
    };
  }
  if (reservation.type === "limit") {
    return {
      ok: false,
      code: "limit",
      error: `На сегодня проверки Speaking закончились (${limit} в день). Потренируйся без проверки или приходи завтра. Это ограничение бесплатного режима ИИ.`,
      retryable: false,
    };
  }
  if (reservation.type !== "reserved") {
    return { ok: false, code: "unavailable", error: "Не получилось начать проверку.", retryable: true, requestId };
  }

  const checkInput = {
    task,
    answers,
    mode: parsed.data.mode,
    unclearFragments: parsed.data.unclearFragments,
    recognitionConfidence: parsed.data.recognitionConfidence,
  };
  const checkId = reservation.checkId;
  try {
    const answer = await askAi({
      userId,
      purpose: "exam_speaking",
      messages: speakingMessages(checkInput),
      temperature: 0.3,
      requestId,
      longOutput: true,
      validate: (raw) => parseSpeakingFeedback(raw, checkInput) !== null,
    });
    const feedback = parseSpeakingFeedback(answer.text, checkInput);
    if (!feedback) throw new AiError("bad_format", "ИИ ответил в непонятном формате. Попробуй проверить ещё раз.");
    await getDb()
      .update(examAiChecks)
      .set({ status: "done", speaking: feedback })
      .where(eq(examAiChecks.id, checkId));
    const xpEarned = await awardProductiveXp(userId, "speaking", parsed.data.taskId, checkId, feedback.overall);
    revalidatePath("/", "layout");
    return {
      ok: true,
      checkId,
      feedback,
      cached: false,
      remaining: Math.max(0, limit - reservation.used),
      xpEarned,
    };
  } catch (error) {
    await getDb()
      .delete(examAiChecks)
      .where(eq(examAiChecks.id, checkId))
      .catch(() => undefined);
    return aiFailure(error, requestId);
  }
}

/* ─────────────────────────────── Диагностика ─────────────────────────────── */

/**
 * Итог диагностики: берёт последние диагностические попытки по каждому навыку,
 * считает примерный уровень и обновляет учебный план.
 */
export async function completeDiagnostic(): Promise<
  { ok: true; result: DiagnosticResult } | { ok: false; error: string }
> {
  const session = await getSession();
  if (!session) return { ok: false, error: AUTH_ERROR };
  const userId = session.user.id;
  const examProfile = await getIeltsProfile(userId);
  if (!examProfile) return { ok: false, error: "Сначала выбери модуль и цель подготовки." };

  try {
    const db = getDb();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await db
      .select()
      .from(examAttempts)
      .where(
        and(
          eq(examAttempts.userId, userId),
          eq(examAttempts.mode, "diagnostic"),
          gte(examAttempts.createdAt, since),
          lt(examAttempts.createdAt, new Date(Date.now() + 60_000)),
        ),
      )
      .orderBy(desc(examAttempts.createdAt));
    const latest = (skill: string) => rows.find((row) => row.skill === skill);
    const reading = latest("reading");
    const listening = latest("listening");
    if (!reading || !listening) {
      return { ok: false, error: "Сначала выполни Reading и Listening в диагностике." };
    }
    const writing = latest("writing");
    const speaking = latest("speaking");
    const range = (row: typeof writing) =>
      row && row.bandLow !== null && row.bandHigh !== null ? { low: row.bandLow, high: row.bandHigh } : null;

    const skills = {
      reading: objectiveEstimate(reading.correct, reading.total, "reading", examProfile.module),
      listening: objectiveEstimate(listening.correct, listening.total, "listening", examProfile.module),
      writing: range(writing) ? productiveEstimate([(writing!.bandLow! + writing!.bandHigh!) / 2], "проверке") : null,
      speaking: range(speaking) ? productiveEstimate([(speaking!.bandLow! + speaking!.bandHigh!) / 2], "проверке") : null,
    };
    const overall = overallEstimate(skills);
    const estimate = overall ? { ...overall, confidence: "low" as const, basis: "по короткой диагностике" } : null;

    const result: DiagnosticResult = {
      completedAt: new Date().toISOString(),
      reading: { correct: reading.correct, total: reading.total },
      listening: { correct: listening.correct, total: listening.total },
      writing: range(writing),
      speaking: range(speaking),
      estimate,
    };

    const profile = await getProfile(userId);
    const plan = generatePlan({
      module: examProfile.module,
      targetBand: examProfile.targetBand,
      examDate: examProfile.examDate,
      currentLevel: examProfile.currentLevel,
      sessionsPerWeek: examProfile.sessionsPerWeek,
      weakestSkill: examProfile.weakestSkill,
      today: todayInTimezone(profile.timezone),
      diagnosticDone: true,
      estimateMid: estimate?.mid ?? null,
    });
    await db
      .update(examProfiles)
      .set({ diagnostic: result, plan })
      .where(and(eq(examProfiles.userId, userId), eq(examProfiles.exam, "ielts")));
    revalidatePath("/", "layout");
    return { ok: true, result };
  } catch (error) {
    console.error("[exams] Не удалось подвести итог диагностики:", error);
    return { ok: false, error: SAVE_ERROR };
  }
}
