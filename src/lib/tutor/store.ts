/** Разговоры с Отти в базе: список, сообщения, память о прошлых занятиях. */
import "server-only";

import { cache } from "react";
import { and, asc, count, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { chatMessages, chatThreads, userWords, type Correction, type SuggestedWord } from "@/db/schema";
import { todayInTimezone } from "@/lib/dates";
import { getProfile } from "@/lib/profile";

export type ChatMessageView = {
  id: string;
  role: "user" | "assistant";
  content: string;
  translation: string | null;
  correction: Correction | null;
  words: SuggestedWord[];
  createdAt: string;
};

export function toMessageView(row: typeof chatMessages.$inferSelect): ChatMessageView {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    translation: row.translation,
    correction: row.correction ?? null,
    words: row.words ?? [],
    createdAt: row.createdAt.toISOString(),
  };
}

/** Последние разговоры ученика со счётчиком его сообщений. */
export async function listThreads(userId: string, limit = 20) {
  const db = getDb();
  const threads = await db
    .select()
    .from(chatThreads)
    .where(eq(chatThreads.userId, userId))
    .orderBy(desc(chatThreads.updatedAt))
    .limit(limit);
  if (threads.length === 0) return [];

  const counts = await db
    .select({ threadId: chatMessages.threadId, messages: count() })
    .from(chatMessages)
    .where(
      and(
        inArray(
          chatMessages.threadId,
          threads.map((thread) => thread.id),
        ),
        eq(chatMessages.role, "user"),
      ),
    )
    .groupBy(chatMessages.threadId);
  const byThread = new Map(counts.map((row) => [row.threadId, row.messages]));

  return threads.map((thread) => ({ ...thread, userMessages: byThread.get(thread.id) ?? 0 }));
}

/** Разговор ученика вместе со всеми сообщениями. null — не найден или чужой. */
export async function getThread(userId: string, threadId: string) {
  const db = getDb();
  const [thread] = await db
    .select()
    .from(chatThreads)
    .where(and(eq(chatThreads.id, threadId), eq(chatThreads.userId, userId)))
    .limit(1);
  if (!thread) return null;

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.threadId, thread.id))
    .orderBy(asc(chatMessages.createdAt));
  return { thread, messages };
}

/** Сколько сообщений ученик отправил Отти сегодня (по его часовому поясу). */
export const getChatMessagesToday = cache(async (userId: string): Promise<number> => {
  const profile = await getProfile(userId);
  const today = todayInTimezone(profile.timezone);
  const [row] = await getDb()
    .select({ total: count() })
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.userId, userId),
        eq(chatMessages.role, "user"),
        sql`(${chatMessages.createdAt} at time zone ${profile.timezone})::date = ${today}`,
      ),
    );
  return row?.total ?? 0;
});

/** Что Отти помнит об ученике: слова из словаря, недавние ошибки, советы прошлых занятий. */
export async function getTutorMemory(userId: string) {
  const db = getDb();
  const [words, corrections, summaries] = await Promise.all([
    db
      .select({ word: userWords.word })
      .from(userWords)
      .where(eq(userWords.userId, userId))
      .orderBy(desc(userWords.createdAt))
      .limit(30),
    db
      .select({ correction: chatMessages.correction })
      .from(chatMessages)
      .where(and(eq(chatMessages.userId, userId), isNotNull(chatMessages.correction)))
      .orderBy(desc(chatMessages.createdAt))
      .limit(5),
    db
      .select({ summary: chatThreads.summary })
      .from(chatThreads)
      .where(and(eq(chatThreads.userId, userId), isNotNull(chatThreads.summary)))
      .orderBy(desc(chatThreads.updatedAt))
      .limit(3),
  ]);

  return {
    knownWords: words.map((row) => row.word),
    recentCorrections: corrections
      .map((row) => row.correction)
      .filter((item): item is Correction => Boolean(item))
      .map((item) => ({ original: item.original, corrected: item.corrected })),
    lastFocus: summaries.flatMap((row) => row.summary?.focusOn ?? []).slice(0, 3),
  };
}

/** Слова словаря ученика (строчными) — чтобы отметить уже добавленные. */
export async function getDictionaryWordSet(userId: string): Promise<string[]> {
  const rows = await getDb()
    .select({ word: userWords.word })
    .from(userWords)
    .where(eq(userWords.userId, userId));
  return rows.map((row) => row.word.toLowerCase());
}

/** Слова для «Практики слов»: сначала новые и те, что ученик ещё учит. */
export async function pickPracticeWords(userId: string, limit = 3): Promise<string[]> {
  const rows = await getDb()
    .select({ word: userWords.word })
    .from(userWords)
    .where(and(eq(userWords.userId, userId), inArray(userWords.status, ["new", "learning"])))
    .orderBy(asc(userWords.updatedAt))
    .limit(limit);
  return rows.map((row) => row.word);
}
