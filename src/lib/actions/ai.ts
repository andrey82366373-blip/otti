"use server";

/** Проверка связи с ИИ со страницы /status. Тратит один запрос из дневного лимита ученика. */
import { AiError, askAi } from "@/lib/ai";
import { getAiConfig } from "@/lib/ai/config";
import { getAiUsageToday, getUserAiDailyLimit } from "@/lib/ai/limits";
import { pingMessages } from "@/lib/ai/prompts";
import { AI_PROVIDER_TITLES } from "@/lib/ai/types";
import { isAdminEmail } from "@/lib/admin";
import { getSession } from "@/lib/session";

export type AiCheckResult =
  | {
      ok: true;
      provider: string;
      model: string;
      /** «за 1,4 с» или «быстрее чем за секунду». */
      duration: string;
      text: string;
      usedFallback: boolean;
      /** Ответ-заготовка тестового режима, а не настоящего ИИ. */
      isMock: boolean;
      usedToday: number;
      dailyLimit: number;
    }
  | { ok: false; error: string; details?: string };

export async function checkAiConnection(): Promise<AiCheckResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Войдите в аккаунт, чтобы проверить ИИ." };
  }
  // Проверка тратит запросы и показывает технические подробности — только для владельца сайта
  if (!isAdminEmail(session.user.email)) {
    return { ok: false, error: "Проверка ИИ доступна только владельцу сайта." };
  }

  try {
    const result = await askAi({
      userId: session.user.id,
      purpose: "ping",
      messages: pingMessages(),
      maxTokens: 80,
      temperature: 0.5,
    });
    const usage = await getAiUsageToday(session.user.id);
    return {
      ok: true,
      provider: AI_PROVIDER_TITLES[result.provider],
      model: result.model,
      duration:
        result.ms < 1000
          ? "быстрее чем за секунду"
          : `за ${(result.ms / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} с`,
      text: result.text,
      usedFallback: result.usedFallback,
      isMock: result.provider === "mock",
      usedToday: usage.userRequests,
      dailyLimit: await getUserAiDailyLimit(session.user.id, getAiConfig().limits),
    };
  } catch (error) {
    if (error instanceof AiError) {
      return { ok: false, error: error.userMessage, details: error.details };
    }
    console.error("[ai] Проверка связи не удалась:", error);
    return { ok: false, error: "Не удалось проверить ИИ. Подробности — в журнале сервера." };
  }
}
