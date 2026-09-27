"use server";

/**
 * Разговор с Отти: начать, отправить сообщение, добавить слово в словарь, подвести итоги.
 * Все запросы к ИИ идут через askAi — там лимиты и выключатель.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { chatMessages, chatThreads, profiles, userWords, type ChatAction, type SessionSummary } from "@/db/schema";
import { AiError, askAi, type AiErrorCode } from "@/lib/ai";
import { getAiConfig } from "@/lib/ai/config";
import { getAiUsageToday, getUserAiDailyLimit } from "@/lib/ai/limits";
import { summaryMessages, tutorSystemPrompt, tutorUserMessage } from "@/lib/ai/prompts";
import { newRequestId, safeRequestId } from "@/lib/ai/retry";
import { todayInTimezone } from "@/lib/dates";
import { toExplanationLanguage } from "@/lib/learning";
import { getProfile } from "@/lib/profile";
import { recordXp } from "@/lib/progress-write";
import { getSession, requireSession } from "@/lib/session";
import { getTutorAvailability } from "@/lib/tutor/availability";
import { buildChatHistory } from "@/lib/tutor/history";
import { IELTS_SWITCH_REPLY, detectExamIntent, otherExamReply } from "@/lib/tutor/intent";
import { isUsableTutorReply, parseSummary, parseTutorReply, type TutorReply } from "@/lib/tutor/parse";
import {
  CHAT_MESSAGE_XP,
  CHAT_MIN_MESSAGES_FOR_SUMMARY,
  CHAT_SUMMARY_XP,
  CHAT_THREADS_PER_DAY,
  CHAT_XP_MESSAGES_PER_DAY,
  isEnglishPhrase,
} from "@/lib/tutor/rules";
import { SCENARIOS, getScenario, isScenarioId, scenarioOpener } from "@/lib/tutor/scenarios";
import {
  getChatMessagesToday,
  getThread,
  getTutorMemory,
  pickPracticeWords,
  toMessageView,
  type ChatMessageView,
} from "@/lib/tutor/store";

const GENERIC_ERROR = "Что-то пошло не так. Проверь интернет и попробуй ещё раз.";

/* ─────────────────────────── Новый разговор ─────────────────────────── */

export async function startConversation(input: { scenario: string }): Promise<{ ok: false; error: string }> {
  const { user } = await requireSession();

  if (!isScenarioId(input.scenario)) {
    return { ok: false, error: "Такой темы нет." };
  }
  const availability = getTutorAvailability();
  if (!availability.available) {
    return { ok: false, error: availability.message };
  }

  const scenario = SCENARIOS[input.scenario];
  let threadId: string;
  try {
    // Защита от засорения базы: не больше N новых разговоров в день
    const profile = await getProfile(user.id);
    const [started] = await getDb()
      .select({ total: count() })
      .from(chatThreads)
      .where(
        and(
          eq(chatThreads.userId, user.id),
          sql`(${chatThreads.createdAt} at time zone ${profile.timezone})::date = ${todayInTimezone(profile.timezone)}`,
        ),
      );
    if ((started?.total ?? 0) >= CHAT_THREADS_PER_DAY) {
      return {
        ok: false,
        error: `Сегодня начато уже ${CHAT_THREADS_PER_DAY} разговоров. Продолжи один из них — или приходи завтра!`,
      };
    }

    const words = scenario.id === "words" ? await pickPracticeWords(user.id) : [];
    const opener = scenarioOpener(scenario.id, user.name, words);
    threadId = await getDb().transaction(async (tx) => {
      const [thread] = await tx
        .insert(chatThreads)
        .values({ userId: user.id, title: scenario.title, topic: scenario.id })
        .returning({ id: chatThreads.id });
      await tx.insert(chatMessages).values({
        threadId: thread.id,
        userId: user.id,
        role: "assistant",
        content: opener.en,
        translation: opener.ru,
        words: [],
      });
      return thread.id;
    });
  } catch (error) {
    console.error("[tutor] Не удалось начать разговор:", error);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/tutor");
  redirect(`/tutor/${threadId}`);
}

/* ───────────────────────────── Сообщение ───────────────────────────── */

const sendSchema = z.object({
  threadId: z.uuid(),
  text: z.string().max(5000),
  clientRequestId: z.string().max(64).optional(),
});

/**
 * Почему сообщение не отправилось — браузер показывает понятный текст и решает, повторять ли:
 * offline — нет интернета (определяет браузер); limit — лимит сообщений; unavailable — ИИ временно
 * недоступен; auth — сессия закончилась; invalid — сообщение нельзя отправить; unknown — прочее.
 */
export type ChatErrorKind = "offline" | "limit" | "unavailable" | "auth" | "invalid" | "unknown";

export type SendFailure = {
  ok: false;
  kind: ChatErrorKind;
  error: string;
  /** Имеет ли смысл отправить то же сообщение ещё раз. */
  retryable: boolean;
  /** Через сколько секунд браузер может повторить сам (минутный лимит). */
  retryAfterSec?: number;
  /** Короткий код запроса — по нему владелец найдёт запись в журнале сервера. */
  requestId?: string;
};

export type SendResult =
  | {
      ok: true;
      userMessage: ChatMessageView;
      reply: ChatMessageView;
      xpEarned: number;
      usedToday: number;
      dailyLimit: number;
      /** Это повтор уже обработанного сообщения: ответ взят из базы, XP не начислялся. */
      duplicate: boolean;
    }
  | SendFailure;

function fail(kind: ChatErrorKind, error: string, extra: Partial<SendFailure> = {}): SendFailure {
  return { ok: false, kind, error, retryable: false, ...extra };
}

const AI_ERROR_KIND: Record<AiErrorCode, ChatErrorKind> = {
  disabled: "unavailable",
  not_configured: "unavailable",
  input_too_long: "invalid",
  limit_user_minute: "limit",
  limit_user_day: "limit",
  limit_global: "limit",
  provider_busy: "unavailable",
  provider_unavailable: "unavailable",
  provider_quota: "unavailable",
  provider_config: "unavailable",
  bad_format: "unavailable",
};

/** Нарушение уникального индекса: такое сообщение уже сохранено параллельным запросом. */
function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth += 1) {
    if ((current as { code?: unknown }).code === "23505") return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

/** Уже сохранённые сообщение ученика и ответ Отти с этим ключом отправки. */
async function findSavedPair(threadId: string, clientRequestId: string) {
  const rows = await getDb()
    .select()
    .from(chatMessages)
    .where(and(eq(chatMessages.threadId, threadId), eq(chatMessages.clientRequestId, clientRequestId)));
  const userRow = rows.find((row) => row.role === "user");
  const replyRow = rows.find((row) => row.role === "assistant");
  return userRow && replyRow ? { userRow, replyRow } : null;
}

async function usageNumbers(userId: string) {
  const config = getAiConfig();
  const usage = await getAiUsageToday(userId).catch(() => ({ userRequests: 0 }));
  return {
    usedToday: usage.userRequests,
    dailyLimit: await getUserAiDailyLimit(userId, config.limits).catch(() => config.limits.userDaily),
  };
}

/**
 * Одинаковые запросы (тот же ключ отправки), пришедшие одновременно, ждут один общий ответ:
 * так повтор после обрыва связи не отправляет ИИ второй запрос.
 */
const inflight = new Map<string, Promise<SendResult>>();

export async function sendChatMessage(input: {
  threadId: string;
  text: string;
  clientRequestId?: string;
}): Promise<SendResult> {
  const session = await getSession();
  if (!session) {
    return fail("auth", "Сессия закончилась. Войди снова — текст сообщения сохранится.");
  }
  const clientRequestId = safeRequestId(input.clientRequestId);
  const key = clientRequestId ? `${session.user.id}:${clientRequestId}` : null;
  const running = key ? inflight.get(key) : undefined;
  if (running) return running;

  const promise = sendChatMessageNow(session.user, input, clientRequestId).catch((error: unknown) => {
    const requestId = newRequestId();
    console.error(`[tutor] req=${requestId} Непредвиденная ошибка при отправке:`, error);
    return fail("unknown", "Что-то пошло не так. Попробуй отправить ещё раз.", { retryable: true, requestId });
  });
  if (key) {
    inflight.set(key, promise);
    void promise.finally(() => inflight.delete(key));
  }
  return promise;
}

async function sendChatMessageNow(
  user: { id: string; name: string },
  input: { threadId: string; text: string; clientRequestId?: string },
  clientRequestId: string | null,
): Promise<SendResult> {
  const requestId = newRequestId();
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid", "Сообщение не распознано.");
  }
  const text = parsed.data.text.trim();
  if (!text) {
    return fail("invalid", "Напиши сообщение.");
  }

  const config = getAiConfig();
  if (text.length > config.limits.maxInputChars) {
    return fail("invalid", `Слишком длинно — не больше ${config.limits.maxInputChars} символов.`);
  }

  const found = await getThread(user.id, parsed.data.threadId);
  if (!found) {
    return fail("invalid", "Разговор не найден.");
  }
  const { thread, messages } = found;

  // Повтор уже обработанного сообщения: возвращаем сохранённый ответ — без дубля и без XP
  if (clientRequestId) {
    const saved = await findSavedPair(thread.id, clientRequestId);
    if (saved) {
      console.info(`[tutor] req=${requestId} Повтор сообщения ${clientRequestId}: ответ взят из базы`);
      return {
        ok: true,
        userMessage: toMessageView(saved.userRow),
        reply: toMessageView(saved.replyRow),
        xpEarned: 0,
        duplicate: true,
        ...(await usageNumbers(user.id)),
      };
    }
  }

  if (thread.summary) {
    return fail("invalid", "Этот разговор уже завершён. Начни новый!");
  }
  if (messages.length >= config.limits.threadMaxMessages) {
    return fail("invalid", "Разговор получился длинным! Подведи итоги и начни новый.");
  }

  const profile = await getProfile(user.id);
  const today = todayInTimezone(profile.timezone);

  // «Хочу готовиться к IELTS» — отвечаем по-русски и предлагаем сменить цель (без запроса к ИИ)
  const intent = detectExamIntent(text);
  let reply: TutorReply;
  let action: ChatAction | null = null;
  let tokens = { tokensIn: 0, tokensOut: 0 };

  if (intent) {
    reply = {
      reply: intent.exam === "ielts" ? IELTS_SWITCH_REPLY : otherExamReply(intent.title),
      translation: null,
      correction: null,
      words: [],
    };
    action = { type: "goal_switch", target: "ielts", status: "pending" };
    console.info(`[tutor] req=${requestId} Намерение сменить цель: ${intent.exam}`);
  } else {
    const memory = await getTutorMemory(user.id);
    const { history, earlierContext } = buildChatHistory(messages, config.limits.historyMessages);
    const system = tutorSystemPrompt({
      name: user.name,
      level: profile.level,
      goal: profile.goal,
      explanationLanguage: toExplanationLanguage(profile.explanationLanguage),
      scenario: getScenario(thread.topic).instruction,
      earlierContext,
      ...memory,
    });

    try {
      const answer = await askAi({
        userId: user.id,
        purpose: "chat",
        messages: [{ role: "system", content: system }, ...history, { role: "user", content: tutorUserMessage(text) }],
        userText: text,
        temperature: 0.6,
        requestId,
        validate: isUsableTutorReply,
      });
      reply = parseTutorReply(answer.text);
      tokens = { tokensIn: answer.tokensIn, tokensOut: answer.tokensOut };
    } catch (error) {
      if (error instanceof AiError) {
        return fail(AI_ERROR_KIND[error.code], error.userMessage, {
          retryable: error.retryable,
          retryAfterSec: error.extra.retryAfterSec,
          requestId,
        });
      }
      console.error(`[tutor] req=${requestId} Ошибка при запросе к ИИ:`, error);
      return fail("unknown", "Что-то пошло не так. Попробуй отправить ещё раз.", { retryable: true, requestId });
    }
  }

  const sentToday = await getChatMessagesToday(user.id);
  const earnsXp = !intent && isEnglishPhrase(text) && sentToday < CHAT_XP_MESSAGES_PER_DAY;
  // Явное время: сообщение ученика всегда раньше ответа Отти
  const now = Date.now();

  let rows;
  try {
    rows = await getDb().transaction(async (tx) => {
      const [userRow] = await tx
        .insert(chatMessages)
        .values({
          threadId: thread.id,
          userId: user.id,
          role: "user",
          content: text,
          correction: reply.correction,
          clientRequestId,
          createdAt: new Date(now),
        })
        .returning();
      const [replyRow] = await tx
        .insert(chatMessages)
        .values({
          threadId: thread.id,
          userId: user.id,
          role: "assistant",
          content: reply.reply,
          translation: reply.translation,
          words: reply.words,
          action,
          clientRequestId,
          tokensIn: tokens.tokensIn,
          tokensOut: tokens.tokensOut,
          createdAt: new Date(now + 1),
        })
        .returning();
      await tx.update(chatThreads).set({ updatedAt: new Date(now + 1) }).where(eq(chatThreads.id, thread.id));
      // XP — в той же транзакции: если сообщение не сохранилось (или это дубль), XP тоже не начислится
      if (earnsXp) {
        await recordXp(tx, { userId: user.id, profile, today, xp: CHAT_MESSAGE_XP });
      }
      return { userRow, replyRow };
    });
  } catch (error) {
    // Такое же сообщение уже сохранил параллельный запрос — отдаём его
    if (clientRequestId && isUniqueViolation(error)) {
      const saved = await findSavedPair(thread.id, clientRequestId);
      if (saved) {
        console.info(`[tutor] req=${requestId} Параллельный повтор ${clientRequestId}: ответ взят из базы`);
        return {
          ok: true,
          userMessage: toMessageView(saved.userRow),
          reply: toMessageView(saved.replyRow),
          xpEarned: 0,
          duplicate: true,
          ...(await usageNumbers(user.id)),
        };
      }
    }
    console.error(`[tutor] req=${requestId} Не удалось сохранить сообщения:`, error);
    return fail("unknown", "Отти ответил, но сообщение не сохранилось. Попробуй отправить ещё раз.", {
      retryable: true,
      requestId,
    });
  }

  revalidatePath("/", "layout");
  return {
    ok: true,
    userMessage: toMessageView(rows.userRow),
    reply: toMessageView(rows.replyRow),
    xpEarned: earnsXp ? CHAT_MESSAGE_XP : 0,
    duplicate: false,
    ...(await usageNumbers(user.id)),
  };
}

/* ─────────────────────── Смена учебной цели из чата ─────────────────────── */

export type GoalSwitchResult =
  | { ok: true; status: "accepted" | "declined"; redirectTo: string | null }
  | { ok: false; error: string };

/**
 * Ученик ответил на предложение перейти к IELTS. Цель меняется только здесь —
 * после явного «Да». «Нет» оставляет всё как было.
 */
export async function answerGoalSwitch(input: { messageId: string; accept: boolean }): Promise<GoalSwitchResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Сессия закончилась. Войди снова." };
  const parsed = z.object({ messageId: z.uuid(), accept: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Не получилось. Обнови страницу." };

  try {
    const db = getDb();
    const [message] = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.id, parsed.data.messageId),
          eq(chatMessages.userId, session.user.id),
          eq(chatMessages.role, "assistant"),
        ),
      )
      .limit(1);
    if (!message?.action || message.action.type !== "goal_switch") {
      return { ok: false, error: "Это предложение уже неактуально." };
    }
    if (message.action.status !== "pending") {
      return {
        ok: true,
        status: message.action.status,
        redirectTo: message.action.status === "accepted" ? GOAL_SWITCH_TARGET : null,
      };
    }

    const status = parsed.data.accept ? "accepted" : "declined";
    // Профиль создаётся заранее, если его почему-то нет
    await getProfile(session.user.id);
    await db.transaction(async (tx) => {
      await tx
        .update(chatMessages)
        .set({ action: { ...message.action!, status } })
        .where(eq(chatMessages.id, message.id));
      if (status === "accepted") {
        await tx
          .update(profiles)
          .set({ goal: "exam" })
          .where(eq(profiles.userId, session.user.id));
      }
    });
    revalidatePath("/", "layout");
    return { ok: true, status, redirectTo: status === "accepted" ? GOAL_SWITCH_TARGET : null };
  } catch (error) {
    console.error("[tutor] Не удалось сменить цель:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Куда вести ученика после согласия перейти к IELTS. */
const GOAL_SWITCH_TARGET = "/exams/ielts";

/* ──────────────────────── Слово из чата в словарь ──────────────────────── */

const wordSchema = z.object({ messageId: z.uuid(), en: z.string().min(1).max(40) });

export async function addChatWord(input: {
  messageId: string;
  en: string;
}): Promise<{ ok: true; added: boolean } | { ok: false; error: string }> {
  const { user } = await requireSession();
  const parsed = wordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Слово не распознано." };
  }

  try {
    const db = getDb();
    const [message] = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.id, parsed.data.messageId),
          eq(chatMessages.userId, user.id),
          eq(chatMessages.role, "assistant"),
        ),
      )
      .limit(1);
    // Добавить можно только слово, которое Отти действительно предложил в этом сообщении
    const word = message?.words?.find((item) => item.en.toLowerCase() === parsed.data.en.toLowerCase());
    if (!message || !word) {
      return { ok: false, error: "Это слово нельзя добавить." };
    }

    const en = word.en.toLowerCase();
    const escaped = en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const example =
      message.content
        .split(/(?<=[.!?])\s+/)
        .find((sentence) => new RegExp(`\\b${escaped}\\b`, "i").test(sentence))
        ?.slice(0, 300) ?? null;

    const inserted = await db
      .insert(userWords)
      .values({
        userId: user.id,
        word: en,
        translation: word.ru,
        example,
        source: "chat",
        sourceId: message.threadId,
      })
      .onConflictDoNothing()
      .returning({ id: userWords.id });

    revalidatePath("/", "layout");
    return { ok: true, added: inserted.length > 0 };
  } catch (error) {
    console.error("[tutor] Не удалось добавить слово:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/* ───────────────────────────── Итоги занятия ───────────────────────────── */

export type FinishResult =
  | { ok: true; summary: SessionSummary; xpEarned: number }
  | { ok: false; error: string };

export async function finishConversation(input: { threadId: string }): Promise<FinishResult> {
  const { user } = await requireSession();
  const parsed = z.object({ threadId: z.uuid() }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Разговор не найден." };
  }

  const found = await getThread(user.id, parsed.data.threadId);
  if (!found) {
    return { ok: false, error: "Разговор не найден." };
  }
  const { thread, messages } = found;
  if (thread.summary) {
    return { ok: true, summary: thread.summary, xpEarned: 0 };
  }

  const studentMessages = messages.filter((message) => message.role === "user");
  if (studentMessages.length < CHAT_MIN_MESSAGES_FOR_SUMMARY) {
    return {
      ok: false,
      error: `Напиши Отти хотя бы ${CHAT_MIN_MESSAGES_FOR_SUMMARY} сообщения — тогда будет что подытожить.`,
    };
  }
  const corrections = studentMessages
    .map((message) => message.correction)
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const profile = await getProfile(user.id);
  const config = getAiConfig();
  let answer;
  try {
    answer = await askAi({
      userId: user.id,
      purpose: "summary",
      messages: summaryMessages({
        name: user.name,
        level: profile.level,
        explanationLanguage: toExplanationLanguage(profile.explanationLanguage),
        scenarioTitle: getScenario(thread.topic).title,
        transcript: messages.slice(-30).map((message) => ({
          role: message.role,
          content: message.content.slice(0, 300),
        })),
        corrections: corrections.slice(-8),
      }),
      maxTokens: Math.min(400, config.limits.maxOutputTokens),
      temperature: 0.3,
    });
  } catch (error) {
    if (error instanceof AiError) {
      return { ok: false, error: error.userMessage };
    }
    console.error("[tutor] Ошибка при подведении итогов:", error);
    return { ok: false, error: GENERIC_ERROR };
  }

  const result = parseSummary(answer.text);
  if (!result) {
    console.error("[tutor] ИИ вернул итоги в неожиданном формате:", answer.text.slice(0, 300));
    return { ok: false, error: "Не получилось подвести итоги. Попробуй ещё раз." };
  }

  try {
    const db = getDb();
    const [words] = await db
      .select({ total: count() })
      .from(userWords)
      .where(and(eq(userWords.userId, user.id), eq(userWords.source, "chat"), eq(userWords.sourceId, thread.id)));

    const summary: SessionSummary = {
      ...result,
      stats: { messages: studentMessages.length, corrections: corrections.length, words: words?.total ?? 0 },
      createdAt: new Date().toISOString(),
    };

    let xpEarned = 0;
    await db.transaction(async (tx) => {
      // Итоги сохраняются один раз — повторный вызов не даёт XP второй раз
      const updated = await tx
        .update(chatThreads)
        .set({ summary })
        .where(and(eq(chatThreads.id, thread.id), isNull(chatThreads.summary)))
        .returning({ id: chatThreads.id });
      if (updated.length > 0) {
        await recordXp(tx, {
          userId: user.id,
          profile,
          today: todayInTimezone(profile.timezone),
          xp: CHAT_SUMMARY_XP,
        });
        xpEarned = CHAT_SUMMARY_XP;
      }
    });

    revalidatePath("/", "layout");
    return { ok: true, summary, xpEarned };
  } catch (error) {
    console.error("[tutor] Не удалось сохранить итоги:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
