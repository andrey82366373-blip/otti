/**
 * Настройки ИИ из переменных окружения (.env.local на компьютере, Environment Variables на Vercel).
 * Все значения читаются только на сервере.
 */
import "server-only";

import { AI_PROVIDER_IDS, type AiProviderId } from "@/lib/ai/types";

function readInt(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function readProvider(name: string): AiProviderId | undefined {
  const raw = process.env[name]?.trim().toLowerCase();
  return AI_PROVIDER_IDS.find((id) => id === raw);
}

/** Убирает пробелы и кавычки, которые легко случайно скопировать вместе с ключом. */
export function cleanSecret(value: string | undefined): string | undefined {
  const cleaned = value?.trim().replace(/^["']|["']$/g, "").trim();
  return cleaned ? cleaned : undefined;
}

export type AiLimits = {
  /** Запросов к ИИ на одного ученика в день. */
  userDaily: number;
  /** То же для аккаунтов моложе суток — защита от массовой регистрации ради бесплатного ИИ. */
  newUserDaily: number;
  /** Запросов на одного ученика в минуту. */
  userPerMinute: number;
  /** Запросов на весь сайт в день — защита от неожиданных расходов. */
  globalDaily: number;
  /** Максимальная длина сообщения ученика в символах. */
  maxInputChars: number;
  /** Максимальная длина ответа ИИ в токенах. */
  maxOutputTokens: number;
  /** Сколько последних сообщений диалога отправлять ИИ как контекст. */
  historyMessages: number;
  /** Максимум сообщений в одном разговоре. */
  threadMaxMessages: number;
};

export type AiConfig = {
  /** Главный выключатель: AI_ENABLED=false выключает ИИ на всём сайте. */
  enabled: boolean;
  /** Основной провайдер. null — не настроен. */
  provider: AiProviderId | null;
  /** Запасной провайдер — если основной не ответил. */
  fallback: AiProviderId | null;
  limits: AiLimits;
  /** Сколько ждать ответа одного провайдера, мс. */
  timeoutMs: number;
};

export function isProviderConfigured(id: AiProviderId): boolean {
  switch (id) {
    case "gigachat":
      return Boolean(cleanSecret(process.env.GIGACHAT_AUTH_KEY));
    case "openrouter":
      return Boolean(cleanSecret(process.env.OPENROUTER_API_KEY));
    case "yandex":
      return Boolean(cleanSecret(process.env.YANDEX_API_KEY) && cleanSecret(process.env.YANDEX_FOLDER_ID));
    case "mock":
      return true;
  }
}

export function getAiConfig(): AiConfig {
  const isDev = process.env.NODE_ENV !== "production";

  // Провайдер: из AI_PROVIDER; если не указан — GigaChat при наличии ключа,
  // а на компьютере без ключей — тестовый режим с ответами-заготовками.
  let provider = readProvider("AI_PROVIDER") ?? null;
  if (!provider) {
    if (isProviderConfigured("gigachat")) provider = "gigachat";
    else if (isDev) provider = "mock";
  }

  let fallback = readProvider("AI_FALLBACK_PROVIDER") ?? null;
  if (fallback === provider) fallback = null;

  return {
    enabled: process.env.AI_ENABLED?.trim().toLowerCase() !== "false",
    provider,
    fallback,
    limits: {
      userDaily: readInt("AI_USER_DAILY_LIMIT", 30, 0, 10_000),
      newUserDaily: readInt("AI_NEW_USER_DAILY_LIMIT", 15, 0, 10_000),
      userPerMinute: readInt("AI_USER_PER_MINUTE", 6, 1, 600),
      globalDaily: readInt("AI_GLOBAL_DAILY_LIMIT", 500, 0, 1_000_000),
      maxInputChars: readInt("AI_MAX_INPUT_CHARS", 500, 50, 4000),
      maxOutputTokens: readInt("AI_MAX_OUTPUT_TOKENS", 400, 50, 2000),
      historyMessages: readInt("AI_HISTORY_MESSAGES", 12, 2, 50),
      threadMaxMessages: readInt("AI_THREAD_MAX_MESSAGES", 60, 10, 500),
    },
    timeoutMs: readInt("AI_TIMEOUT_SECONDS", 25, 5, 60) * 1000,
  };
}
