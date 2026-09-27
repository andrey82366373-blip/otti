/**
 * Лимиты запросов к ИИ: на ученика в минуту и в день, на весь сайт в день.
 * Запрос сначала «бронируется» (счётчики увеличиваются), и только потом уходит к ИИ.
 * Дни считаются по московскому времени.
 */
import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { aiUsage, user } from "@/db/schema";
import type { AiLimits } from "@/lib/ai/config";
import { todayInTimezone } from "@/lib/dates";

const LIMITS_TIMEZONE = "Europe/Moscow";

export type LimitCode = "limit_user_minute" | "limit_user_day" | "limit_global";

class LimitReached extends Error {
  constructor(readonly code: LimitCode) {
    super(code);
  }
}

export function aiDay(): string {
  return todayInTimezone(LIMITS_TIMEZONE);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Дневной лимит ученика: у аккаунтов моложе суток он меньше. */
export function dailyLimitFor(limits: AiLimits, userCreatedAt: Date | null | undefined): number {
  const isNew = userCreatedAt ? Date.now() - userCreatedAt.getTime() < DAY_MS : false;
  return isNew ? Math.min(limits.newUserDaily, limits.userDaily) : limits.userDaily;
}

/** Дневной лимит конкретного ученика — для показа «N из M». */
export async function getUserAiDailyLimit(userId: string, limits: AiLimits): Promise<number> {
  const [row] = await getDb().select({ createdAt: user.createdAt }).from(user).where(eq(user.id, userId)).limit(1);
  return dailyLimitFor(limits, row?.createdAt);
}

/** Бронирует один запрос. Если лимит исчерпан — ничего не меняет и возвращает причину. */
export async function reserveAiRequest(
  userId: string,
  limits: AiLimits,
): Promise<{ ok: true; day: string } | { ok: false; code: LimitCode; retryAfterSec?: number }> {
  const day = aiDay();
  const newWindow = sql`${aiUsage.windowStart} is null or ${aiUsage.windowStart} < now() - interval '1 minute'`;

  try {
    await getDb().transaction(async (tx) => {
      const [global] = await tx
        .select({ total: sql<number>`coalesce(sum(${aiUsage.requests}), 0)::int` })
        .from(aiUsage)
        .where(eq(aiUsage.day, day));
      if (Number(global?.total ?? 0) >= limits.globalDaily) {
        throw new LimitReached("limit_global");
      }

      const [row] = await tx
        .insert(aiUsage)
        .values({ userId, day, requests: 1, windowStart: sql`now()`, windowRequests: 1 })
        .onConflictDoUpdate({
          target: [aiUsage.userId, aiUsage.day],
          set: {
            requests: sql`${aiUsage.requests} + 1`,
            windowRequests: sql`case when ${newWindow} then 1 else ${aiUsage.windowRequests} + 1 end`,
            windowStart: sql`case when ${newWindow} then now() else ${aiUsage.windowStart} end`,
          },
        })
        .returning({ requests: aiUsage.requests, windowRequests: aiUsage.windowRequests });

      const [account] = await tx
        .select({ createdAt: user.createdAt })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      // Исключение отменяет транзакцию — счётчики не увеличатся
      if (!row || row.windowRequests > limits.userPerMinute) {
        throw new LimitReached("limit_user_minute");
      }
      if (row.requests > dailyLimitFor(limits, account?.createdAt)) {
        throw new LimitReached("limit_user_day");
      }
    });
    return { ok: true, day };
  } catch (error) {
    if (!(error instanceof LimitReached)) throw error;
    if (error.code !== "limit_user_minute") return { ok: false, code: error.code };
    // Сколько секунд осталось до конца минутного окна — браузер отправит сообщение сам
    const [row] = await getDb()
      .select({
        seconds: sql<number>`greatest(1, ceil(extract(epoch from (${aiUsage.windowStart} + interval '1 minute' - now()))))::int`,
      })
      .from(aiUsage)
      .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, day)));
    return { ok: false, code: error.code, retryAfterSec: Math.min(60, Number(row?.seconds ?? 60)) };
  }
}

/** Возвращает бронь, если ИИ так и не ответил: неудачный запрос не тратит ни дневной, ни минутный лимит. */
export async function releaseAiRequest(userId: string, day: string) {
  await getDb()
    .update(aiUsage)
    .set({
      requests: sql`greatest(${aiUsage.requests} - 1, 0)`,
      windowRequests: sql`greatest(${aiUsage.windowRequests} - 1, 0)`,
    })
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, day)));
}

export async function recordAiTokens(userId: string, day: string, tokens: number) {
  if (tokens <= 0) return;
  await getDb()
    .update(aiUsage)
    .set({ tokens: sql`${aiUsage.tokens} + ${tokens}` })
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, day)));
}

/** Сколько запросов сделано сегодня: всего на сайте и (если указан) этим учеником. */
export async function getAiUsageToday(userId?: string) {
  const day = aiDay();
  const db = getDb();
  const [global] = await db
    .select({
      requests: sql<number>`coalesce(sum(${aiUsage.requests}), 0)::int`,
      tokens: sql<number>`coalesce(sum(${aiUsage.tokens}), 0)::int`,
    })
    .from(aiUsage)
    .where(eq(aiUsage.day, day));

  let user = 0;
  if (userId) {
    const [row] = await db
      .select({ requests: aiUsage.requests })
      .from(aiUsage)
      .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, day)));
    user = row?.requests ?? 0;
  }

  return {
    globalRequests: Number(global?.requests ?? 0),
    globalTokens: Number(global?.tokens ?? 0),
    userRequests: user,
  };
}
